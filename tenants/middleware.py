from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from .models import Domain, Tenant
from .utils import set_current_tenant, set_current_user
from .exceptions import TenantViolation, TenantNotFound, TenantSuspended

class CurrentTenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # 1. Set User Context
        # Note: For JWT, request.user might not be set yet if using DRF. 
        # It relies on AuthenticationMiddleware for session auth.
        if hasattr(request, 'user'):
            set_current_user(request.user)
        else:
            set_current_user(None)

        # 2. Resolve Tenant
        tenant = None
        
        # A. Domain/Subdomain
        host = request.get_host().split(':')[0].lower()
        
        # Try finding domain
        domain_obj = Domain.objects.select_related('tenant').filter(domain=host).first()
        if domain_obj:
            tenant = domain_obj.tenant
        
        # B. Header (optional, useful for testing/API)
        if not tenant:
            tenant_id = request.headers.get('X-Tenant-ID')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except (Tenant.DoesNotExist, ValueError):
                    pass

        request.tenant = tenant
        set_current_tenant(tenant)

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Update user context if it became available (e.g. some other middleware)
        if hasattr(request, 'user'):
            set_current_user(request.user)

        # Path based override if present (useful for API gateway style)
        if 'tenant_slug' in view_kwargs:
            slug = view_kwargs['tenant_slug']
            try:
                request.tenant = Tenant.objects.get(slug=slug)
                set_current_tenant(request.tenant)
            except Tenant.DoesNotExist:
                raise TenantNotFound("Invalid Tenant Slug")
        
        # Check suspension
        if request.tenant:
            # Check if user is superuser to bypass suspension check?
            # If user is not yet authenticated (JWT), we might block valid superuser.
            # But typically suspension applies to everyone or we need early auth.
            if request.tenant.subscription_status == 'suspended':
                 # Allow superuser if we know who they are
                 user = getattr(request, 'user', None)
                 if not (user and user.is_authenticated and user.is_superuser):
                     raise TenantSuspended("Restaurant suspended")
        
        return None

    def process_exception(self, request, exception):
        if isinstance(exception, TenantViolation):
            return JsonResponse({'error': str(exception)}, status=403)
        return None
