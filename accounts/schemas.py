from ninja import ModelSchema
from .models import TenantUser, Role
from django.contrib.auth.models import User

class UserSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class RoleSchema(ModelSchema):
    class Meta:
        model = Role
        fields = ['id', 'name', 'display_name']

class TenantUserSchema(ModelSchema):
    user: UserSchema
    role: RoleSchema = None
    class Meta:
        model = TenantUser
        fields = ['id', 'is_active', 'joined_at']
