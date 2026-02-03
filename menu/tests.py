from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from tenants.models import Restaurant
from accounts.models import TenantUser, Role
from .models import Category, Item

from rest_framework_simplejwt.tokens import RefreshToken

class MenuAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.restaurant = Restaurant.objects.create(name="Test Resto", slug="test-resto")
        
        self.user = User.objects.create_user('manager', 'manager@example.com', 'password')
        self.role = Role.objects.create(name="manager", restaurant=self.restaurant)
        TenantUser.objects.create(user=self.user, role=self.role, restaurant=self.restaurant)
        
        # Generate Token
        refresh = RefreshToken.for_user(self.user)
        refresh['role'] = 'manager'
        refresh['tenant_id'] = str(self.restaurant.tenant_id)
        self.token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
    def test_create_category_and_item(self):
        # Create Category
        response = self.client.post('/api/v1/tenant/test-resto/menu/categories/', {
            "name": "Starters",
            "is_kitchen": True
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        category_id = response.data['id']
        
        # Create Item
        response = self.client.post('/api/v1/tenant/test-resto/menu/items/', {
            "name": "Soup",
            "base_price": "10.00",
            "category": category_id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Item.objects.count(), 1)

    def test_item_stock_validation(self):
        # Create Category
        cat = Category.objects.create(tenant=self.restaurant, name="Main")
        
        # 1. Create Item with maintain_stock=True but negative stock (should fail)
        response = self.client.post('/api/v1/tenant/test-resto/menu/items/', {
            "name": "Steak",
            "base_price": "20.00",
            "category": cat.id,
            "maintain_stock": True,
            "current_stock": -1
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 2. Create Item with maintain_stock=True and valid stock
        response = self.client.post('/api/v1/tenant/test-resto/menu/items/', {
            "name": "Steak",
            "base_price": "20.00",
            "category": cat.id,
            "maintain_stock": True,
            "current_stock": 10
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item_id = response.data['id']
        self.assertEqual(Item.objects.get(id=item_id).current_stock, 10)

    def test_order_stock_deduction(self):
        # Setup Item
        cat = Category.objects.create(tenant=self.restaurant, name="Drinks")
        item = Item.objects.create(
            tenant=self.restaurant, 
            category=cat, 
            name="Coke", 
            base_price=2.0, 
            maintain_stock=True, 
            current_stock=10
        )
        
        # Create Order
        url = f'/api/v1/tenant/{self.restaurant.slug}/pos/orders/'
        data = {
            'type': 'dine_in',
            'items': [{'item': item.id, 'qty': 2}]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Stock Deduction
        item.refresh_from_db()
        self.assertEqual(item.current_stock, 8)
        
        # Create Order with Insufficient Stock
        data = {
            'type': 'dine_in',
            'items': [{'item': item.id, 'qty': 100}] # 8 available
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Insufficient stock", str(response.data))
