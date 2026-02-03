from ninja import Router
from typing import List
from .models import TenantUser
from .schemas import TenantUserSchema

router = Router()

@router.get("/users", response=List[TenantUserSchema])
def list_users(request):
    # This should be scoped to current tenant in middleware
    return TenantUser.objects.all()
