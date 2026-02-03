from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from .models import Tenant, Restaurant
from .schemas import TenantSchema, RestaurantSchema

router = Router()

@router.get("/", response=List[TenantSchema])
def list_tenants(request):
    # In real app, filter by user ownership
    return Tenant.objects.all()

@router.get("/{tenant_id}", response=TenantSchema)
def get_tenant(request, tenant_id: str):
    return get_object_or_404(Tenant, id=tenant_id)

@router.get("/{tenant_id}/restaurants", response=List[RestaurantSchema])
def list_restaurants(request, tenant_id: str):
    return Restaurant.objects.filter(tenant_id=tenant_id)
