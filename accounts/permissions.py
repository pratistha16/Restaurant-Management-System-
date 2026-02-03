from rest_framework.permissions import BasePermission
from .models import TenantUser, RolePermission

class TenantScopePermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return False
        # Check if user is associated with this tenant
        return TenantUser.objects.filter(user=request.user, restaurant=tenant).exists()

class HasPermission(BasePermission):
    required_code = None
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return False
        code = getattr(view, 'required_permission', self.required_code)
        if not code:
            return True
        user_roles = TenantUser.objects.filter(user=request.user, restaurant=tenant).values_list('role_id', flat=True)
        return RolePermission.objects.filter(role_id__in=user_roles, permission__code=code, restaurant=tenant).exists()
