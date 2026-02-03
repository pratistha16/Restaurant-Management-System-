from django.db import models
from tenants.models import TenantAwareModel
from menu.models import Item
from django.conf import settings

class Supplier(TenantAwareModel):
    name = models.CharField(max_length=200)
    contact = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return self.name

class Ingredient(TenantAwareModel):
    name = models.CharField(max_length=200)
    unit = models.CharField(max_length=50, default='g') # e.g. kg, g, l, ml, pcs
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0) # For P&L

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"

class StockMovement(TenantAwareModel):
    IN = 'in'
    OUT = 'out'
    TYPES = [(IN, 'In'), (OUT, 'Out')]
    
    REASON_PURCHASE = 'purchase'
    REASON_SALE = 'sale'
    REASON_WASTE = 'waste'
    REASON_ADJUSTMENT = 'adjustment'
    REASONS = [
        (REASON_PURCHASE, 'Purchase'),
        (REASON_SALE, 'Sale'),
        (REASON_WASTE, 'Waste'),
        (REASON_ADJUSTMENT, 'Adjustment'),
    ]

    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=5, choices=TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=20, choices=REASONS, default=REASON_ADJUSTMENT)
    note = models.CharField(max_length=255, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.movement_type} {self.quantity} {self.ingredient.name}"

class ItemRecipe(TenantAwareModel):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='recipes')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='used_in')
    quantity = models.DecimalField(max_digits=10, decimal_places=2) # Quantity of ingredient per 1 unit of Item

    def __str__(self):
        return f"{self.item.name} needs {self.quantity}{self.ingredient.unit} of {self.ingredient.name}"
