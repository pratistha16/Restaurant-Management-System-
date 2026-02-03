from rest_framework import serializers
from tenants.models import Restaurant, SubscriptionPlan
from .models import PlatformLog
from django.contrib.auth.models import User

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class TenantSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = Restaurant
        fields = [
            'id', 'tenant_id', 'name', 'slug', 
            'owner_name', 'owner_email', 'owner_phone',
            'plan', 'plan_name',
            'subscription_status', 'is_active', 'is_suspended', 
            'created_at', 'last_activity'
        ]
        read_only_fields = ['tenant_id', 'created_at', 'last_activity', 'slug']

class TenantCreateSerializer(serializers.ModelSerializer):
    # For creating new tenants with initial owner
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Restaurant
        fields = [
            'name', 'owner_name', 'owner_email', 'owner_phone', 
            'plan', 'username', 'password'
        ]

class PlatformLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)
    
    class Meta:
        model = PlatformLog
        fields = '__all__'
