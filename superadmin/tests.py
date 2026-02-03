from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework import status
from tenants.models import Restaurant
from accounts.models import Role
from superadmin.models import PlatformLog
import uuid

class SuperAdminTests(APITestCase):
    def setUp(self):
        # Create Super Admin
        self.super_admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpassword'
        )
        
        # Get Token
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'admin',
            'password': 'adminpassword'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_dashboard_access(self):
        response = self.client.get('/api/v1/superadmin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_tenants', response.data)

    def test_create_tenant(self):
        data = {
            'name': 'Test Restaurant',
            'username': 'owner1',
            'password': 'password123',
            'owner_name': 'John Doe',
            'owner_email': 'john@example.com'
        }
        response = self.client.post('/api/v1/superadmin/tenants/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Restaurant.objects.filter(name='Test Restaurant').exists())
        self.assertTrue(User.objects.filter(username='owner1').exists())
        
        # Check logs
        self.assertTrue(PlatformLog.objects.filter(action='create_tenant').exists())

    def test_suspend_activate_tenant(self):
        # Create a tenant first
        restaurant = Restaurant.objects.create(name="Suspend Me", owner_name="Owner")
        
        # Suspend
        url = f'/api/v1/superadmin/tenants/{restaurant.id}/suspend/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        restaurant.refresh_from_db()
        self.assertTrue(restaurant.is_suspended)
        
        # Activate
        url = f'/api/v1/superadmin/tenants/{restaurant.id}/activate/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        restaurant.refresh_from_db()
        self.assertFalse(restaurant.is_suspended)

    def test_view_logs(self):
        PlatformLog.objects.create(action='test_log', details={})
        response = self.client.get('/api/v1/superadmin/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_access_restriction_pos(self):
        # Try to access a protected POS route
        # Assuming '/api/v1/tenant/{id}/orders/' requires 'orders:read'
        # Super admin has 'tenants:read', 'platform:read', 'logs:read'
        # So this should fail
        
        # Need a tenant for the URL
        restaurant = Restaurant.objects.create(name="POS Test", owner_name="Owner")
        url = f'/api/v1/tenant/{restaurant.tenant_id}/orders/'
        
        response = self.client.get(url)
        # Should be 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
