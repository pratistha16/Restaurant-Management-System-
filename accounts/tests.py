from django.test import TestCase, RequestFactory
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from tenants.models import Restaurant, SubscriptionPlan
from accounts.models import Role, TenantUser
from accounts.middleware import RBACMiddleware
from accounts.rbac import ROLE_PERMISSIONS
import jwt
from django.conf import settings
from unittest.mock import MagicMock
import json

User = get_user_model()

class AuthRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.factory = RequestFactory()
        
        # Setup Tenant
        self.plan = SubscriptionPlan.objects.create(name="Basic", price=10.00)
        self.restaurant = Restaurant.objects.create(
            name="Test Resto",
            plan=self.plan
        )
        self.tenant_id = str(self.restaurant.tenant_id)
        self.tenant_slug = self.restaurant.slug

        # Setup Roles
        self.role_manager = Role.objects.create(name='manager', display_name='Manager', restaurant=self.restaurant)
        self.role_waiter = Role.objects.create(name='waiter', display_name='Waiter', restaurant=self.restaurant)
        self.role_table = Role.objects.create(name='table_user', display_name='Table User', restaurant=self.restaurant)

        # Setup Users
        self.user_manager = User.objects.create_user(username='manager', password='password123')
        self.user_waiter = User.objects.create_user(username='waiter', password='password123')
        self.user_table = User.objects.create_user(username='table1', password='password123')

        # Assign Roles
        TenantUser.objects.create(user=self.user_manager, restaurant=self.restaurant, role=self.role_manager)
        TenantUser.objects.create(user=self.user_waiter, restaurant=self.restaurant, role=self.role_waiter)
        TenantUser.objects.create(user=self.user_table, restaurant=self.restaurant, role=self.role_table)

    def test_login_payload(self):
        """
        Test that login returns JWT with correct payload (user_id, tenant_id, role)
        """
        url = reverse('token_obtain_pair') 
        data = {
            'username': 'manager',
            'password': 'password123',
            'tenant_id': self.tenant_id
        }
        response = self.client.post(url, data)
        
        if response.status_code != 200:
            print(f"Login failed: {response.content}")
            
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        
        # Decode token
        access_token = response.data['access']
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
        
        self.assertEqual(payload['user_id'], self.user_manager.id)
        self.assertEqual(payload['tenant_id'], self.tenant_id)
        self.assertEqual(payload['role'], 'manager')

    def test_logout(self):
        """
        Test that logout blacklists the refresh token
        """
        # Login first
        login_url = reverse('token_obtain_pair')
        data = {
            'username': 'manager',
            'password': 'password123',
            'tenant_id': self.tenant_id
        }
        response = self.client.post(login_url, data)
        self.assertEqual(response.status_code, 200)
        refresh_token = response.data['refresh']
        access_token = response.data['access']

        # Logout
        logout_url = reverse('auth_logout')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)
        response = self.client.post(logout_url, {'refresh': refresh_token})
        
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
        
        # Verify token is blacklisted (requires simplejwt settings to reject blacklisted, 
        # but blacklist app should catch it if we tried to refresh)
        refresh_url = reverse('token_refresh')
        response = self.client.post(refresh_url, {'refresh': refresh_token})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rbac_middleware_allow(self):
        """
        Test RBAC Middleware allows authorized access
        """
        token = self.get_token('manager', 'password123')
        
        path = f'/api/v1/tenant/{self.tenant_slug}/orders/'
        request = self.factory.get(path)
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        middleware = RBACMiddleware(get_response=MagicMock())
        response = middleware.process_request(request)
        self.assertIsNone(response)
        
        self.assertTrue(hasattr(request, 'user'))
        self.assertTrue(hasattr(request, 'user_role'))
        self.assertEqual(request.user_role, 'manager')

    def test_rbac_middleware_deny(self):
        """
        Test RBAC Middleware denies unauthorized access
        """
        token = self.get_token('waiter', 'password123')
        
        path = f'/api/v1/tenant/{self.tenant_slug}/inventory/add/'
        request = self.factory.post(path)
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        middleware = RBACMiddleware(get_response=MagicMock())
        response = middleware.process_request(request)
        
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 403)
        
        content = json.loads(response.content.decode())
        self.assertIn('Missing permission', content.get('error', ''))

    def test_rbac_table_user_limited(self):
        """
        Test TABLE_USER limited permissions
        """
        token = self.get_token('table1', 'password123')
        
        path_menu = f'/api/v1/tenant/{self.tenant_slug}/menu/items/'
        request_menu = self.factory.get(path_menu)
        request_menu.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        middleware = RBACMiddleware(get_response=MagicMock())
        self.assertIsNone(middleware.process_request(request_menu))

        path_orders = f'/api/v1/tenant/{self.tenant_slug}/orders/'
        request_orders = self.factory.get(path_orders)
        request_orders.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        response = middleware.process_request(request_orders)
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 403)

    def get_token(self, username, password):
        url = reverse('token_obtain_pair')
        data = {
            'username': username,
            'password': password,
            'tenant_id': self.tenant_id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200, f"Token fetch failed: {response.content}")
        return response.data['access']
