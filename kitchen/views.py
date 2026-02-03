from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from accounts.permissions import HasPermission
from pos.models import Order
from pos.serializers import OrderSerializer

class KitchenOrderViewSet(viewsets.ViewSet):
    permission_classes = [HasPermission]
    required_permission = 'kitchen.manage'

    def list(self, request):
        tenant = getattr(request, 'tenant', None)
        # Fetch orders that are confirmed or preparing
        qs = Order.objects.filter(restaurant=tenant, status__in=['confirmed','preparing']).order_by('created_at')
        serializer = OrderSerializer(qs, many=True)
        return Response(serializer.data)

    def update(self, request, pk=None):
        tenant = getattr(request, 'tenant', None)
        o = Order.objects.filter(id=pk, restaurant=tenant).first()
        if not o:
            return Response({"detail": "Not found"}, status=404)
        new_status = request.data.get("status")
        # Validate status transition if needed
        o.status = new_status
        o.save()
        return Response(OrderSerializer(o).data)
