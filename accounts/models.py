from django.db import models
from django.contrib.auth.models import User
from tenants.models import Tenant, Restaurant

class Role(models.Model):
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('reception', 'Reception'),
        ('cashier', 'Cashier'),
        ('waiter', 'Waiter'),
        ('kitchen', 'Kitchen'),
        ('accountant', 'Accountant'),
        ('table_user', 'Table User'),
        ('custom', 'Custom'),
    )
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, default='custom')
    display_name = models.CharField(max_length=100, default='Custom Role')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='roles', null=True, blank=True)
    # If tenant is null, it's a system default role template

    def __str__(self):
        return f"{self.display_name} ({self.tenant.name if self.tenant else 'System'})"

class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)
    
    def __str__(self):
        return self.code

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    def __str__(self):
        return self.user.username

class TenantUser(models.Model):
    """
    Links a User to a Tenant with a specific Role.
    Optionally scoped to a specific Restaurant.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tenant_roles')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    
    # Shift Timing
    shift_start = models.TimeField(null=True, blank=True)
    shift_end = models.TimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'tenant', 'restaurant')

    def __str__(self):
        return f"{self.user.username} - {self.role.display_name} @ {self.tenant.name}"
