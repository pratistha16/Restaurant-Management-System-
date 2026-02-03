from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .rbac import ROLE_PERMISSIONS, get_required_permission

class RBACMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # 1. Determine Required Permission
        required_perm = get_required_permission(request.path, request.method)
        
        if required_perm is None:
            return None # Public access
            
        # 2. Authenticate User (Manually triggers DRF JWT Auth for Middleware context)
        # Note: This duplicates some work of DRF but is necessary for global middleware blocking
        user = None
        user_role = None
        
        try:
            jwt_auth = JWTAuthentication()
            header = jwt_auth.get_header(request)
            if header:
                raw_token = jwt_auth.get_raw_token(header)
                if raw_token:
                    validated_token = jwt_auth.get_validated_token(raw_token)
                    user = jwt_auth.get_user(validated_token)
                    request.user = user
                    request.auth = validated_token
                    # Extract role from token payload
                    user_role = validated_token.get('role', 'custom')
                    request.user_role = user_role
        except (InvalidToken, AuthenticationFailed):
            return JsonResponse({'error': 'Invalid or expired token'}, status=401)
        except Exception:
            # Token might be missing or malformed
            pass
        
        if not user or not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        # 3. Check Permissions
        # Owner has full access (scoped by Tenant middleware)
        if user_role == 'owner':
            return None

        # Check explicit permissions
        if user_role not in ROLE_PERMISSIONS:
            return JsonResponse({'error': 'Role not recognized'}, status=403)
            
        perms = ROLE_PERMISSIONS[user_role]
        
        if '*' in perms:
            return None
            
        if required_perm == 'denied':
             return JsonResponse({'error': 'Endpoint access denied'}, status=403)

        # Exact match
        if required_perm in perms:
            return None
            
        # Check for _self variants (e.g., allow if user has 'orders:create_self' and req is 'orders:create')
        # This assumes the view handles the 'self' restriction logic.
        if f"{required_perm}_self" in perms:
            return None
            
        return JsonResponse({'error': f'Missing permission: {required_perm}'}, status=403)
