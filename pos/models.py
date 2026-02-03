from django.db import models
from tenants.models import Restaurant, TenantAwareModel
from menu.models import Item, ItemVariant, Addon
from accounts.models import TenantUser

class Zone(TenantAwareModel):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='zones')
    name = models.CharField(max_length=100) # e.g., "Indoor", "Patio", "VIP"
    
    def save(self, *args, **kwargs):
        if self.restaurant and not self.tenant_id:
            self.tenant = self.restaurant.tenant
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Table(TenantAwareModel):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Maintenance'),
    )

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tables')
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='tables')
    number = models.CharField(max_length=20)
    capacity = models.PositiveIntegerField(default=4)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    qr_code_token = models.CharField(max_length=100, blank=True) # For table-ordering

    class Meta:
        unique_together = ('restaurant', 'number')

    def save(self, *args, **kwargs):
        if not self.qr_code_token:
            import uuid
            self.qr_code_token = uuid.uuid4().hex
        if self.restaurant and not self.tenant_id:
            self.tenant = self.restaurant.tenant
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Table {self.number} ({self.zone.name if self.zone else 'No Zone'})"

class TableSession(TenantAwareModel):
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    access_token = models.CharField(max_length=100, unique=True) # Used for API auth from table device
    pin = models.CharField(max_length=10, blank=True) # For user re-entry
    
    # Metadata
    guest_count = models.PositiveIntegerField(default=1)
    customer_name = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if self.table and not self.tenant_id:
            self.tenant = self.table.tenant
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Session {self.id} - {self.table}"

class Order(TenantAwareModel):
    STATUS_CHOICES = (
        ('open', 'Open'), # Order placed, not yet confirmed/kitchen
        ('confirmed', 'Confirmed'), # Sent to kitchen
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('served', 'Served'),
        ('completed', 'Completed'), # Paid and closed
        ('cancelled', 'Cancelled'),
    )
    
    TYPE_CHOICES = (
        ('dine_in', 'Dine In'),
        ('takeaway', 'Takeaway'),
        ('delivery', 'Delivery'),
    )

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    session = models.ForeignKey(TableSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    waiter = models.ForeignKey(TenantUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders_served')
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    
    order_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='dine_in')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    service_charge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    inventory_deducted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.restaurant and not self.tenant_id:
            self.tenant = self.restaurant.tenant
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} - {self.restaurant.name}"

class OrderItem(TenantAwareModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'), # Not sent to kitchen
        ('sent', 'Sent to Kitchen'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready to Serve'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(Item, on_delete=models.PROTECT) # Don't delete order history if item deleted
    variant = models.ForeignKey(ItemVariant, on_delete=models.SET_NULL, null=True, blank=True)
    addons = models.ManyToManyField(Addon, blank=True)
    
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Price at time of order
    notes = models.CharField(max_length=255, blank=True) # "No onion", etc.
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.order and not self.tenant_id:
            self.tenant = self.order.tenant
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.item.name} (Order #{self.order.id})"

class Payment(TenantAwareModel):
    METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('online', 'Online'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.order and not self.tenant_id:
            self.tenant = self.order.tenant
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.amount} - {self.method} (Order #{self.order.id})"
