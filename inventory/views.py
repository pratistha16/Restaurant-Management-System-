from rest_framework import viewsets, permissions, serializers
from accounts.permissions import TenantScopePermission, HasPermission
from .models import Supplier, Ingredient, StockMovement, ItemRecipe
from .serializers import SupplierSerializer, IngredientSerializer, StockMovementSerializer, ItemRecipeSerializer
from django.db import transaction

class SupplierViewSet(viewsets.ModelViewSet):
    permission_classes = [HasPermission]
    serializer_class = SupplierSerializer
    required_permission = 'inventory.manage'

    def get_queryset(self):
        return Supplier.objects.filter(tenant=self.request.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)

class IngredientViewSet(viewsets.ModelViewSet):
    permission_classes = [HasPermission]
    serializer_class = IngredientSerializer
    required_permission = 'inventory.manage'

    def get_queryset(self):
        return Ingredient.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)

class StockMovementViewSet(viewsets.ModelViewSet):
    permission_classes = [HasPermission]
    serializer_class = StockMovementSerializer
    required_permission = 'inventory.manage'

    def get_queryset(self):
        return StockMovement.objects.filter(tenant=self.request.tenant).order_by('-created_at')

    def perform_create(self, serializer):
        with transaction.atomic():
            # Save first to get the instance data, but wait... 
            # If I save first, I can access fields.
            # But I need to set tenant and user.
            
            # Validation logic before saving? 
            # Better to do it in serializer.validate()? 
            # But I need to lock the ingredient.
            
            # Let's do it here.
            # We can't access instance.ingredient until it's saved OR we fetch it from validated_data.
            # validated_data has 'ingredient' (ID or object).
            
            ingredient = serializer.validated_data['ingredient']
            quantity = serializer.validated_data['quantity']
            movement_type = serializer.validated_data['movement_type']
            
            # Lock ingredient
            ingredient = Ingredient.objects.select_for_update().get(id=ingredient.id)
            
            if movement_type == 'out':
                if ingredient.current_stock < quantity:
                    raise serializers.ValidationError({"quantity": f"Insufficient stock. Current: {ingredient.current_stock}"})
                ingredient.current_stock -= quantity
            else:
                ingredient.current_stock += quantity
            
            ingredient.save()
            serializer.save(tenant=self.request.tenant, user=self.request.user)

class ItemRecipeViewSet(viewsets.ModelViewSet):
    permission_classes = [HasPermission]
    serializer_class = ItemRecipeSerializer
    required_permission = 'inventory.manage'

    def get_queryset(self):
        return ItemRecipe.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)
