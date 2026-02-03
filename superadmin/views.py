from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.contrib.auth.models import User
from tenants.models import Restaurant, SubscriptionPlan
from accounts.models import Role, TenantUser
from .models import PlatformLog
from .serializers import TenantSerializer, TenantCreateSerializer, PlatformLogSerializer
from functools import wraps

def json_except(fn):
    """Ensure any exception returns a JSON error."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            return Response({'detail': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return wrapper
from accounts.permissions import HasPermission # Assuming I can use this or just rely on RBAC Middleware

# Note: RBAC Middleware enforces permission check before view is called.
# But for finer grain or method-level checks, we can use DRF permissions too.
# For Super Admin, the RBAC middleware checks 'tenants:read' etc.

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = TenantSerializer
    # Permission is handled by RBAC Middleware (tenants:read/write)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        return TenantSerializer

    def perform_create(self, serializer):
        # We need custom create logic for User + Tenant
        pass

    def create(self, request, *args, **kwargs):
        serializer = TenantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        with transaction.atomic():
            # 1. Create User
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={'email': data.get('owner_email', '')}
            )
            if created:
                user.set_password(data['password'])
                user.save()
            
            # 2. Create Restaurant
            restaurant = Restaurant.objects.create(
                name=data['name'],
                owner_name=data.get('owner_name', ''),
                owner_email=data.get('owner_email', ''),
                owner_phone=data.get('owner_phone', ''),
                plan=data.get('plan')
            )
            
            # 3. Create 'Owner' Role if not exists (or use system default)
            # We need to assign the user as Owner of this restaurant
            # First, check if 'owner' role template exists, or create specific one
            role, _ = Role.objects.get_or_create(
                name='owner',
                defaults={'display_name': 'Owner'}
            )
            
            # 4. Link User to Restaurant
            TenantUser.objects.create(
                user=user,
                restaurant=restaurant,
                role=role
            )
            
            # Log action
            self._log_action(request, 'create_tenant', {'tenant_id': str(restaurant.tenant_id), 'name': restaurant.name})

        return Response(TenantSerializer(restaurant).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        tenant = self.get_object()
        tenant.is_suspended = True
        tenant.subscription_status = 'suspended'
        tenant.save()
        self._log_action(request, 'suspend_tenant', {'tenant_id': str(tenant.tenant_id)})
        return Response({'status': 'suspended'})

    @json_except
    @action(detail=True, methods=['post'])
    def install(self, request, pk=None):
        """Install a tenant: create schema, domain, activate."""
        tenant = self.get_object()
        
        if tenant.is_installed:
            return Response({'detail': 'Tenant is already installed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 1. Create schema (if not exists)
            from tenants.utils import create_tenant_schema
            create_tenant_schema(tenant)
            
            # 2. Create domain (if not exists)
            from tenants.models import Domain
            domain, created = Domain.objects.get_or_create(
                domain=tenant.slug + '.localhost',  # Or use a configured base domain
                defaults={'tenant': tenant, 'is_primary': True}
            )
            
            # 3. Activate tenant
            tenant.is_active = True
            tenant.is_installed = True
            tenant.save()
            
            self._log_action(request, 'install_tenant', {'tenant_id': str(tenant.tenant_id), 'domain': domain.domain})
            
            return Response({
                'status': 'installed',
                'domain': domain.domain,
                'tenant_id': str(tenant.tenant_id)
            })
        except Exception as e:
            return Response({'detail': f'Installation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        tenant = self.get_object()
        tenant.is_suspended = False
        tenant.subscription_status = 'active'
        tenant.save()
        self._log_action(request, 'activate_tenant', {'tenant_id': str(tenant.tenant_id)})
        return Response({'status': 'activated'})

    def _log_action(self, request, action, details):
        if request.user.is_authenticated:
            PlatformLog.objects.create(
                actor=request.user,
                action=action,
                details=details,
                ip_address=request.META.get('REMOTE_ADDR')
            )

class DashboardView(APIView):
    def get(self, request):
        total_tenants = Restaurant.objects.count()
        active_tenants = Restaurant.objects.filter(is_active=True, is_suspended=False).count()
        suspended_tenants = Restaurant.objects.filter(is_suspended=True).count()
        
        # Simple stats
        data = {
            'role': 'super_admin',
            'metrics': {
                'total_restaurants': total_tenants,
                'active_restaurants': active_tenants,
                'suspended_restaurants': suspended_tenants,
                'total_users': User.objects.count(),
            },
            'total_tenants': total_tenants,
            'active_tenants': active_tenants,
            'suspended_tenants': suspended_tenants,
            'recent_logs': PlatformLogSerializer(PlatformLog.objects.order_by('-created_at')[:5], many=True).data
        }
        return Response(data)

class PlatformLogsView(viewsets.ReadOnlyModelViewSet):
    queryset = PlatformLog.objects.all().order_by('-created_at')
    serializer_class = PlatformLogSerializer
