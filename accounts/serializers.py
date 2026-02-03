from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Role, TenantUser

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Resolve Tenant
        request = self.context['request']
        # Tenant can be passed in body or header. 
        # Middleware might have already resolved 'request.tenant' but that's for the request context.
        # Here we are establishing the session context.
        
        target_tenant_id = request.data.get('tenant_id')
        if not target_tenant_id and hasattr(request, 'tenant') and request.tenant:
            target_tenant_id = str(request.tenant.tenant_id)

        # Super Admin
        if self.user.is_superuser:
            role_name = 'super_admin'
            tenant_id = target_tenant_id if target_tenant_id else None
        else:
            # Resolve via TenantUser
            if target_tenant_id:
                try:
                    tenant_user = self.user.tenant_roles.get(restaurant__tenant_id=target_tenant_id)
                    role_name = tenant_user.role.name if tenant_user.role else 'custom'
                    tenant_id = target_tenant_id
                except TenantUser.DoesNotExist:
                    raise serializers.ValidationError("User is not a member of the specified tenant.")
            else:
                # Default to first tenant if available
                tenant_user = self.user.tenant_roles.first()
                if tenant_user:
                    role_name = tenant_user.role.name if tenant_user.role else 'custom'
                    tenant_id = str(tenant_user.restaurant.tenant_id)
                else:
                    raise serializers.ValidationError("User belongs to no tenants.")

        # Embed into Token
        refresh = self.get_token(self.user)
        
        refresh['user_id'] = self.user.id
        refresh['role'] = role_name
        refresh['tenant_id'] = tenant_id

        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        # Response Data
        data['role'] = role_name
        data['tenant_id'] = tenant_id
        
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add basic claims here if needed statically, but dynamic ones are better in validate
        token['user_id'] = user.id
        return token
