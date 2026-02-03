from django.db import models
from django.contrib.auth.models import User

class PlatformLog(models.Model):
    ACTION_CHOICES = (
        ('create_tenant', 'Create Tenant'),
        ('suspend_tenant', 'Suspend Tenant'),
        ('activate_tenant', 'Activate Tenant'),
        ('login', 'Login'),
        ('other', 'Other'),
    )
    
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='platform_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor} - {self.action} - {self.created_at}"
