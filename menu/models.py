from django.db import models
from tenants.models import Restaurant, TenantAwareModel

class Category(TenantAwareModel):
    # tenant field provided by TenantAwareModel
    name = models.CharField(max_length=120)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subcategories')
    is_kitchen = models.BooleanField(default=True)
    is_bar = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

class Item(TenantAwareModel):
    # tenant field provided by TenantAwareModel
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    service_charge_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)
    is_veg = models.BooleanField(default=True)
    image = models.ImageField(upload_to='menu_items/', null=True, blank=True)

    # Stock Management
    maintain_stock = models.BooleanField(default=False)
    current_stock = models.PositiveIntegerField(default=0, blank=True, null=True)
    low_stock_threshold = models.PositiveIntegerField(default=5, blank=True, null=True)

    def __str__(self):
        return self.name

class ItemVariant(TenantAwareModel):
    # tenant field provided by TenantAwareModel
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100) # e.g., "Small", "Large"
    price_delta = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Additional cost

    def __str__(self):
        return f"{self.item.name} - {self.name}"

class AddonGroup(TenantAwareModel):
    # tenant field provided by TenantAwareModel
    name = models.CharField(max_length=100) # e.g., "Toppings", "Crust"
    min_selection = models.PositiveIntegerField(default=0)
    max_selection = models.PositiveIntegerField(default=1)
    items = models.ManyToManyField(Item, related_name='addon_groups', blank=True)

    def __str__(self):
        return self.name

class Addon(TenantAwareModel):
    # tenant field provided by TenantAwareModel
    group = models.ForeignKey(AddonGroup, on_delete=models.CASCADE, related_name='addons')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.group.name} - {self.name}"
