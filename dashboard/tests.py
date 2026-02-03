from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from tenants.models import Restaurant
from accounts.models import Role, TenantUser
from pos.models import Order, OrderItem, Table
from menu.models import Item, Category
from inventory.models import Ingredient
from django.utils import timezone
import datetime

class DashboardRoleTests(APITestCase):
    def setUp(self):
        # 1. Create Tenant
        self.restaurant = Restaurant.objects.create(name="Dashboard Resto", slug="dashboard-resto")
        
        # 2. Setup Data
        # Orders (Today)
        self.order1 = Order.objects.create(
            restaurant=self.restaurant,
            status='completed',
            total_amount=50.00
        )
        
        # Active Table
        self.table = Table.objects.create(restaurant=self.restaurant, number="1", status="occupied")
        
        # Low Stock Ingredient
        Ingredient.objects.create(tenant=self.restaurant, name="Tomato", current_stock=5, min_stock=10, cost_per_unit=1.0)
        
        # Menu Item for OrderItem
        self.category = Category.objects.create(tenant=self.restaurant, name="Starters")
        self.item = Item.objects.create(tenant=self.restaurant, category=self.category, name="Soup", base_price=10.0)

    def get_token(self, username, role_name):
        user = User.objects.create_user(username=username, password='password')
        role, _ = Role.objects.get_or_create(name=role_name, defaults={'display_name': role_name.title()})
        TenantUser.objects.create(user=user, restaurant=self.restaurant, role=role)
        
        response = self.client.post('/api/v1/auth/login/', {
            'username': username,
            'password': 'password',
        })
        return response.data['access']

    def test_owner_dashboard(self):
        token = self.get_token('owner_user', 'owner')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'owner')
        self.assertIn('kpis', data)
        self.assertEqual(float(data['kpis']['today_sales']), 50.00)
        self.assertIn('operational', data)
        self.assertEqual(data['operational']['active_tables'], 1)

    def test_manager_dashboard(self):
        token = self.get_token('manager_user', 'manager')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'manager')
        self.assertIn('sales_orders', data)
        self.assertEqual(float(data['sales_orders']['today_sales']), 50.00)
        self.assertIn('inventory', data)
        self.assertEqual(data['inventory']['low_stock_alerts'], 1)

    def test_cashier_dashboard(self):
        token = self.get_token('cashier_user', 'cashier')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'cashier')
        self.assertIn('billing', data)
        self.assertIn('tables', data)
        self.assertEqual(data['tables']['occupied'], 1)

    def test_reception_dashboard(self):
        token = self.get_token('reception_user', 'reception')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        # Reception shares logic with cashier
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['role'], 'cashier') # Logic returns cashier data structure

    def test_waiter_dashboard(self):
        token = self.get_token('waiter_user', 'waiter')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'waiter')
        self.assertIn('tables', data)
        self.assertIn('orders', data)
        # Check assigned tables (requires more setup in views but checking structure here)
        self.assertEqual(data['tables']['assigned_count'], 1) # Occupied tables count

    def test_kitchen_dashboard(self):
        token = self.get_token('kitchen_user', 'kitchen')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Add an order item in 'sent' state
        order = Order.objects.create(restaurant=self.restaurant, status='confirmed')
        OrderItem.objects.create(order=order, item=self.item, status='sent', price=10.0, quantity=1)

        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'kitchen')
        self.assertIn('queue', data)
        self.assertEqual(data['queue']['pending_items'], 1)

    def test_accountant_dashboard(self):
        token = self.get_token('accountant_user', 'accountant')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'accountant')
        self.assertIn('financials', data)
        self.assertEqual(float(data['financials']['total_revenue']), 50.00)

    def test_table_user_dashboard(self):
        token = self.get_token('table_user', 'table_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'table_user')
        self.assertIn('session', data)

    def test_super_admin_dashboard(self):
        # Create superuser
        user = User.objects.create_superuser(username='superadmin', password='password')
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'superadmin',
            'password': 'password',
        })
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = '/api/v1/superadmin/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertEqual(data['role'], 'super_admin')
        self.assertIn('metrics', data)
        # Should count at least our created restaurant
        self.assertTrue(data['metrics']['total_restaurants'] >= 1)
