from ninja import ModelSchema
from .models import Zone, Table, TableSession, Order, OrderItem, Payment

class ZoneSchema(ModelSchema):
    class Meta:
        model = Zone
        fields = ['id', 'name']

class TableSchema(ModelSchema):
    zone: ZoneSchema = None
    class Meta:
        model = Table
        fields = ['id', 'number', 'capacity', 'status', 'qr_code_token']

class TableSessionSchema(ModelSchema):
    table: TableSchema
    class Meta:
        model = TableSession
        fields = ['id', 'start_time', 'end_time', 'is_active', 'access_token', 'guest_count', 'customer_name']

class OrderItemSchema(ModelSchema):
    # We might want to include Item details, but simpler for now
    item_name: str = None
    
    class Meta:
        model = OrderItem
        fields = ['id', 'quantity', 'price', 'notes', 'status']
    
    @staticmethod
    def resolve_item_name(obj):
        return obj.item.name

class OrderSchema(ModelSchema):
    table: TableSchema = None
    session: TableSessionSchema = None
    items: list[OrderItemSchema] = []
    
    class Meta:
        model = Order
        fields = ['id', 'order_type', 'status', 'total_amount', 'tax_amount', 'service_charge_amount', 'customer_name', 'created_at']

class PaymentSchema(ModelSchema):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'method', 'status', 'transaction_id', 'created_at']
