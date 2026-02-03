from rest_framework import serializers
from .models import Table, Zone, Order, OrderItem, Payment, TableSession
from menu.serializers import ItemSerializer

class TableSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableSession
        fields = ['id', 'table', 'start_time', 'end_time', 'is_active', 'access_token', 'pin', 'guest_count', 'customer_name']
        read_only_fields = ['access_token', 'start_time', 'end_time']

class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ['id', 'name']

class TableSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)

    class Meta:
        model = Table
        fields = ['id', 'number', 'capacity', 'status', 'zone', 'zone_name', 'qr_code_token']

class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'item_name', 'variant', 'addons', 'quantity', 'price', 'notes', 'status']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    waiter_name = serializers.CharField(source='waiter.user.username', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'table', 'table_number', 'waiter', 'waiter_name', 'customer_name', 
                  'order_type', 'status', 'total_amount', 'created_at', 'items']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
