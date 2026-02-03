import re

# Role Permissions
ROLE_PERMISSIONS = {
    'super_admin': {
        'tenants:read', 'tenants:write',
        'platform:read',
        'logs:read'
    },
    'owner': {'*'},
    'manager': {
        'dashboard:read',
        'menu:read', 'menu:write',
        'inventory:read', 'inventory:write',
        'orders:read', 'orders:write', 'orders:create',
        'tables:read', 'tables:write',
        'reports:read'
    },
    'reception': {
        'orders:read', 'orders:update',
        'tables:read', 'tables:write',
        'payments:create', 'payments:read',
        'dashboard:read'
    },
    'cashier': {
        'orders:read', 'orders:update',
        'tables:read', 'tables:write',
        'payments:create', 'payments:read',
        'dashboard:read'
    },
    'waiter': {
        'menu:read',
        'orders:create', 'orders:read', 'orders:update',
        'tables:read',
        'payments:create',
        'dashboard:read'
    },
    'kitchen': {
        'orders:read', 'orders:update_status',
        'dashboard:read'
    },
    'accountant': {
        'reports:read', 'payments:read',
        'dashboard:read'
    },
    'table_user': {
        'menu:read',
        'orders:create_self',
        'payments:create_self',
        'dashboard:read'
    }
}

# Path to Permission Mapping
# (Regex Pattern, Method) -> Required Permission
# Note: This is a simplified mapping.
PATH_PERMISSION_MAPPING = [
    # Super Admin
    (r'^/api/v1/superadmin/tenants.*', 'GET', 'tenants:read'),
    (r'^/api/v1/superadmin/tenants.*', 'POST', 'tenants:write'),
    (r'^/api/v1/superadmin/tenants.*', 'PUT', 'tenants:write'),
    (r'^/api/v1/superadmin/dashboard.*', 'GET', 'platform:read'),
    (r'^/api/v1/superadmin/logs.*', 'GET', 'logs:read'),

    # Tenant Scoped
    (r'^/api/v1/tenant/[^/]+/menu/.*', 'GET', 'menu:read'),
    (r'^/api/v1/tenant/[^/]+/menu/.*', 'POST', 'menu:write'),
    (r'^/api/v1/tenant/[^/]+/menu/.*', 'PUT', 'menu:write'),
    (r'^/api/v1/tenant/[^/]+/menu/.*', 'DELETE', 'menu:write'),
    
    (r'^/api/v1/tenant/[^/]+/inventory/.*', 'GET', 'inventory:read'),
    (r'^/api/v1/tenant/[^/]+/inventory/.*', 'POST', 'inventory:write'),
    
    (r'^/api/v1/tenant/[^/]+/pos/orders/.*', 'GET', 'orders:read'),
    (r'^/api/v1/tenant/[^/]+/pos/orders/.*', 'POST', 'orders:create'), 
    
    (r'^/api/v1/tenant/[^/]+/pos/tables/.*', 'GET', 'tables:read'),
    
    (r'^/api/v1/tenant/[^/]+/reports/.*', 'GET', 'reports:read'),
    (r'^/api/v1/tenant/[^/]+/dashboard/.*', 'GET', 'dashboard:read'),
    (r'^/api/v1/tenant/[^/]+/pos/sessions/.*/close/', 'POST', 'tables:write'),
]

PUBLIC_PATHS = [
    r'^/api/v1/auth/login/',
    r'^/api/v1/auth/logout/',
    r'^/api/v1/auth/token/',
    r'^/api/v1/auth/token/refresh/',
    r'^/admin/', # Django Admin handles its own auth
    r'^/api/v1/tenant/[^/]+/pos/sessions/start/',
    r'^/api/v1/tenant/[^/]+/pos/sessions/verify/',
]

def get_required_permission(path, method):
    for pattern in PUBLIC_PATHS:
        if re.match(pattern, path):
            return None # Public
            
    for pattern, req_method, permission in PATH_PERMISSION_MAPPING:
        if re.match(pattern, path) and (req_method == '*' or req_method == method):
            return permission
            
    return 'denied' # Default deny
