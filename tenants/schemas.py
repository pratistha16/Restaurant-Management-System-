from ninja import ModelSchema
from .models import Tenant, Restaurant

class TenantSchema(ModelSchema):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'slug', 'subscription_status', 'is_active', 'created_at']

class RestaurantSchema(ModelSchema):
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'address', 'phone', 'is_active', 'created_at']
