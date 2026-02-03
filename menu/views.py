from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Category, Item, AddonGroup
from .serializers import CategorySerializer, ItemSerializer, AddonGroupSerializer

class TenantScopePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return getattr(request, 'tenant', None) is not None

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [TenantScopePermission, permissions.IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)

class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [TenantScopePermission, permissions.IsAuthenticated]
    serializer_class = ItemSerializer

    def get_queryset(self):
        return Item.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)

class AddonGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [TenantScopePermission, permissions.IsAuthenticated]
    serializer_class = AddonGroupSerializer

    def get_queryset(self):
        return AddonGroup.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)
