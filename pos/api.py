from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from .models import Zone, Table, Order
from .schemas import ZoneSchema, TableSchema, OrderSchema

router = Router()

@router.get("/zones", response=List[ZoneSchema])
def list_zones(request):
    # In real app, filter by tenant from request
    return Zone.objects.all()

@router.get("/tables", response=List[TableSchema])
def list_tables(request):
    return Table.objects.select_related('zone').all()

@router.get("/orders", response=List[OrderSchema])
def list_orders(request):
    return Order.objects.select_related('table', 'session', 'table__zone').prefetch_related('items', 'items__item').all()

@router.get("/orders/{order_id}", response=OrderSchema)
def get_order(request, order_id: int):
    return get_object_or_404(Order, id=order_id)
