from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from tenants.models import Restaurant
from accounts.models import Role, TenantUser
from pos.models import Table, TableSession, Zone

class TableSessionTests(APITestCase):
    def setUp(self):
        # 1. Tenant & User
        self.restaurant = Restaurant.objects.create(name="Session Resto")
        self.user = User.objects.create_user(username='manager', password='password')
        self.role = Role.objects.create(name='manager', restaurant=self.restaurant)
        TenantUser.objects.create(user=self.user, restaurant=self.restaurant, role=self.role)
        
        # 2. Auth
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'manager',
            'password': 'password',
            'tenant_id': str(self.restaurant.tenant_id)
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        # 3. Table
        self.zone = Zone.objects.create(name="Patio", restaurant=self.restaurant)
        self.table = Table.objects.create(restaurant=self.restaurant, number="T1", zone=self.zone)

    def test_start_session_qr(self):
        url = f'/api/v1/tenant/{self.restaurant.slug}/pos/sessions/start/'
        
        # 1. Start with valid QR
        data = {'qr_token': self.table.qr_code_token, 'guest_count': 4}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertEqual(response.data['status'], 'created')
        
        # Verify Table Status
        self.table.refresh_from_db()
        self.assertEqual(self.table.status, 'occupied')
        
        # 2. Start again (Resume)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'resumed')

    def test_verify_session(self):
        # Create session
        session = TableSession.objects.create(table=self.table, access_token="abc-123")
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/pos/sessions/verify/'
        response = self.client.post(url, {'access_token': "abc-123"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'valid')

    def test_order_attachment_to_session(self):
        # 1. Start Session
        session = TableSession.objects.create(table=self.table, access_token="order-sess", is_active=True)
        
        # 2. Create Order
        url = f'/api/v1/tenant/{self.restaurant.slug}/pos/orders/'
        data = {
            'table': self.table.id,
            'type': 'dine_in',
            'items': [] # Valid items required? View allows empty list loop
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']
        
        # 3. Verify Attachment
        from pos.models import Order
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.session, session)
        
    def test_close_session(self):
        session = TableSession.objects.create(table=self.table, access_token="abc-123", is_active=True)
        self.table.status = 'occupied'
        self.table.save()
        
        url = f'/api/v1/tenant/{self.restaurant.slug}/pos/sessions/{session.id}/close/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        session.refresh_from_db()
        self.assertFalse(session.is_active)
        self.assertIsNotNone(session.end_time)
        
        self.table.refresh_from_db()
        self.assertEqual(self.table.status, 'available')
