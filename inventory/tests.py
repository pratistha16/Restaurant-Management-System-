from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from tenants.models import Restaurant
from accounts.models import TenantUser, Role, Permission, RolePermission
from menu.models import Item
from inventory.models import Ingredient, StockMovement, ItemRecipe
from rest_framework_simplejwt.tokens import RefreshToken

class InventoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.restaurant = Restaurant.objects.create(name="Test Resto", slug="test-resto")
        
        self.user = User.objects.create_user('manager', 'manager@example.com', 'password')
        self.role = Role.objects.create(name="manager", restaurant=self.restaurant)
        TenantUser.objects.create(user=self.user, role=self.role, restaurant=self.restaurant)
        
        # Setup Permissions
        perm = Permission.objects.create(code='inventory.manage', description='Manage Inventory')
        RolePermission.objects.create(role=self.role, permission=perm, restaurant=self.restaurant)
        
        # Generate Token
        refresh = RefreshToken.for_user(self.user)
        refresh['role'] = 'manager'
        refresh['tenant_id'] = str(self.restaurant.tenant_id)
        self.token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_ingredient_flow(self):
        # 1. Create Ingredient
        url = f'/api/v1/tenant/{self.restaurant.slug}/inventory/ingredients/'
        data = {'name': 'Flour', 'unit': 'kg', 'cost_per_unit': '1.50'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ing_id = response.data['id']
        
        # 2. Add Stock (StockMovement IN)
        url = f'/api/v1/tenant/{self.restaurant.slug}/inventory/stock-movements/'
        data = {
            'ingredient': ing_id,
            'movement_type': 'in',
            'quantity': 10,
            'reason': 'purchase',
            'note': 'Initial stock'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Stock
        ing = Ingredient.objects.get(id=ing_id)
        self.assertEqual(ing.current_stock, 10)
        
        # 3. Deduct Stock (StockMovement OUT)
        data = {
            'ingredient': ing_id,
            'movement_type': 'out',
            'quantity': 2,
            'reason': 'waste'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        ing.refresh_from_db()
        self.assertEqual(ing.current_stock, 8)
        
        # 4. Insufficient Stock
        data['quantity'] = 100
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_deduction_via_recipe(self):
        # Setup Ingredient
        ing = Ingredient.objects.create(tenant=self.restaurant, name="Cheese", current_stock=10)
        
        # Setup Item (maintain_stock=False)
        item = Item.objects.create(tenant=self.restaurant, name="Pizza", base_price=10)
        
        # Setup Recipe (1 Pizza needs 2 Cheese)
        ItemRecipe.objects.create(tenant=self.restaurant, item=item, ingredient=ing, quantity=2)
        
        # Create Order
        url = f'/api/v1/tenant/{self.restaurant.slug}/pos/orders/'
        data = {
            'type': 'dine_in',
            'items': [{'item': item.id, 'qty': 2}] # Needs 4 Cheese
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Ingredient Deduction
        ing.refresh_from_db()
        self.assertEqual(ing.current_stock, 6) # 10 - 4
        
        # Verify Log
        self.assertEqual(StockMovement.objects.filter(ingredient=ing, reason='sale').count(), 1)
