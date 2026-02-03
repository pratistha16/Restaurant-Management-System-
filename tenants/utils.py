from asgiref.local import Local

_thread_locals = Local()

def get_current_tenant():
    return getattr(_thread_locals, 'tenant', None)

def set_current_tenant(tenant):
    _thread_locals.tenant = tenant

def get_current_user():
    return getattr(_thread_locals, 'user', None)

def set_current_user(user):
    _thread_locals.user = user
