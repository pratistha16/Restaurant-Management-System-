from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
import qrcode
import uuid
from tenants.models import Restaurant
from django.db.models import Sum
from pos.models import Order, OrderItem, Table, Zone, TableSession, Payment
from menu.models import Item, ItemVariant
from inventory.models import ItemRecipe, Ingredient, StockMovement
from accounts.permissions import HasPermission, TenantScopePermission
from .serializers import OrderSerializer, TableSerializer, ZoneSerializer, TableSessionSerializer, PaymentSerializer
from django_filters.rest_framework import DjangoFilterBackend

class TableSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny] # We handle auth manually via QR/Token
    serializer_class = TableSessionSerializer
    queryset = TableSession.objects.all()

    @action(detail=False, methods=['post'])
    def start(self, request, tenant_slug=None):
        # 1. Validate QR Token (from Table model)
        qr_token = request.data.get('qr_token')
        pin = request.data.get('pin')
        
        table = Table.objects.filter(qr_code_token=qr_token).first()
        if not table:
            return Response({'error': 'Invalid QR Token'}, status=400)
            
        # 2. Check for existing active session
        active_session = TableSession.objects.filter(table=table, is_active=True).first()
        
        if active_session:
            # If PIN protected, validate PIN
            if active_session.pin and active_session.pin != pin:
                return Response({'error': 'Invalid PIN'}, status=401)
            
            return Response({
                'session_id': active_session.id,
                'access_token': active_session.access_token,
                'status': 'resumed'
            })
            
        # 3. Create New Session
        # Enforce "One active session"
        access_token = uuid.uuid4().hex
        session = TableSession.objects.create(
            table=table,
            access_token=access_token,
            pin=pin or '',
            guest_count=request.data.get('guest_count', 1),
            customer_name=request.data.get('customer_name', '')
        )
        
        # Update Table Status
        table.status = 'occupied'
        table.save()
        
        return Response({
            'session_id': session.id,
            'access_token': session.access_token,
            'status': 'created'
        })

    @action(detail=False, methods=['post'])
    def verify(self, request, tenant_slug=None):
        # Verify Session Access Token
        token = request.data.get('access_token')
        session = TableSession.objects.filter(access_token=token, is_active=True).first()
        if not session:
             return Response({'error': 'Invalid or expired session'}, status=401)
        return Response({'status': 'valid', 'table_id': session.table.id})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None, tenant_slug=None):
        # Close session manually (or via payment)
        # Needs Auth (Manager or the Session Token?)
        # Let's assume Manager or Session Token for now.
        session = self.get_object()
        session.is_active = False
        session.end_time = timezone.now()
        session.save()
        
        session.table.status = 'available'
        session.table.save()
        
        return Response({'status': 'closed'})

class TableViewSet(viewsets.ModelViewSet):
    permission_classes = [TenantScopePermission, permissions.IsAuthenticated]
    serializer_class = TableSerializer

    def get_queryset(self):
        return Table.objects.filter(restaurant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(restaurant=self.request.tenant)

    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None, **kwargs):
        table = self.get_object()
        # For development, use localhost:3000. In prod, use settings.FRONTEND_URL
        frontend_url = "http://localhost:3000" 
        url = f"{frontend_url}/menu/{table.restaurant.slug}/{table.qr_code_token}"
        img = qrcode.make(url)
        response = HttpResponse(content_type="image/png")
        img.save(response, "PNG")
        return response

class ZoneViewSet(viewsets.ModelViewSet):
    permission_classes = [TenantScopePermission, permissions.IsAuthenticated]
    serializer_class = ZoneSerializer

    def get_queryset(self):
        return Zone.objects.filter(restaurant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(restaurant=self.request.tenant)

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [TenantScopePermission]
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['table', 'status']

    def get_queryset(self):
        return Order.objects.filter(restaurant=self.request.tenant).order_by('-id')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        tenant = request.tenant
        payload = request.data
        table_id = payload.get("table")
        order_type = payload.get("type", "dine_in")
        
        # Resolve Session
        session = None
        if table_id:
            session = TableSession.objects.filter(table_id=table_id, is_active=True).first()
        
        # Check for existing open order (for append)
        existing_order = None
        if session:
            existing_order = Order.objects.filter(
                session=session, 
                status__in=['open', 'confirmed', 'preparing', 'ready', 'served']
            ).first()
        
        # 1. Validate & Prepare Items
        valid_items = []
        total_amount = 0
        ingredient_demand = {} # {ingredient_id: quantity_needed}
        
        for itm in payload.get("items", []):
            try:
                # Lock item for stock check
                item_obj = Item.objects.select_for_update().get(id=itm["item"], tenant=tenant)
                qty = int(itm.get("qty", 1))
                
                # Check Item Stock (Direct)
                if getattr(item_obj, 'maintain_stock', False):
                    if item_obj.current_stock < qty:
                        raise ValidationError(f"Insufficient stock for {item_obj.name}")
                else:
                    # Calculate Ingredient Demand (Recipe)
                    recipes = ItemRecipe.objects.filter(item=item_obj)
                    for recipe in recipes:
                        needed = recipe.quantity * qty
                        ingredient_demand[recipe.ingredient_id] = ingredient_demand.get(recipe.ingredient_id, 0) + needed
                
                price = item_obj.base_price
                variant_id = itm.get("variant")
                if variant_id:
                    variant = ItemVariant.objects.get(id=variant_id, item=item_obj)
                    price += variant.price_delta
                
                total_amount += (price * qty)
                valid_items.append({
                    'item': item_obj,
                    'variant_id': variant_id,
                    'qty': qty,
                    'price': price,
                    'notes': itm.get("notes", "")
                })
            except Item.DoesNotExist:
                continue

        # 2. Validate & Deduct Ingredient Stock
        ingredients_to_log = []
        for ing_id, needed in ingredient_demand.items():
            try:
                ing = Ingredient.objects.select_for_update().get(id=ing_id)
                if ing.current_stock < needed:
                    raise ValidationError(f"Insufficient stock for ingredient: {ing.name}")
                ing.current_stock -= needed
                ing.save()
                ingredients_to_log.append((ing, needed))
            except Ingredient.DoesNotExist:
                raise ValidationError(f"Ingredient ID {ing_id} not found")

        # 3. Create or Update Order
        if existing_order:
            order = existing_order
            order.updated_at = timezone.now()
        else:
            order = Order.objects.create(
                restaurant=tenant, 
                table_id=table_id, 
                session=session,
                order_type=order_type
            )
        
        for line in valid_items:
            item_obj = line['item']
            qty = line['qty']
            
            # Deduct Item Stock (if maintained)
            if getattr(item_obj, 'maintain_stock', False):
                item_obj.current_stock -= qty
                item_obj.save()
            
            OrderItem.objects.create(
                order=order,
                item=item_obj,
                variant_id=line['variant_id'],
                quantity=qty,
                price=line['price'],
                notes=line['notes'],
                status='sent' # Immediately sent to kitchen logic for now
            )

        # 4. Log Ingredient Movement
        for ing, needed in ingredients_to_log:
            StockMovement.objects.create(
                tenant=tenant,
                ingredient=ing,
                movement_type=StockMovement.OUT,
                quantity=needed,
                reason=StockMovement.REASON_SALE,
                note=f"Order #{order.id}",
                user=request.user if request.user.is_authenticated else None
            )

        order.total_amount += total_amount
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        order = self.get_object()
        amount = request.data.get('amount')
        method = request.data.get('method', 'cash')
        
        if not amount:
            amount = order.total_amount
        
        # Create Payment
        Payment.objects.create(
            tenant=request.tenant,
            order=order,
            amount=amount,
            method=method,
            status='success'
        )
        
        # Check if fully paid
        total_paid = order.payments.filter(status='success').aggregate(Sum('amount'))['amount__sum'] or 0
        if total_paid >= order.total_amount:
            order.status = 'completed'
            order.completed_at = timezone.now()
            order.save()
            
            # Close session
            if order.session:
                order.session.is_active = False
                order.session.end_time = timezone.now()
                order.session.save()
                
                order.session.table.status = 'available'
                order.session.table.save()
                
        return Response({'status': 'paid', 'order_status': order.status, 'paid_amount': total_paid})

    @action(detail=False, methods=['post'])
    def table_auth(self, request):
        tenant = request.tenant
        number = request.data.get("number")
        token = request.data.get("token")
        table = Table.objects.filter(restaurant=tenant, number=number, qr_code_token=token).first()
        if not table:
            return Response({"detail": "Invalid"}, status=401)
        return Response({"table": table.id})

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        status_value = request.data.get("status")
        o = self.get_object()
        o.status = status_value
        o.save()
        return Response({"id": o.id, "status": o.status})
