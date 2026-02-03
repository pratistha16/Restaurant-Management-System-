from django.test import TransactionTestCase
from channels.testing import WebsocketCommunicator
from rms.asgi import application
from tenants.models import Restaurant
from pos.models import Order
from asgiref.sync import sync_to_async

class KitchenWebSocketTests(TransactionTestCase):
    async def test_order_notification(self):
        # Setup Restaurant
        restaurant = await sync_to_async(Restaurant.objects.create)(name="Test Kitchen", slug="test-kitchen")
        
        # Connect to WebSocket
        communicator = WebsocketCommunicator(application, "/ws/kitchen/test-kitchen/")
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Create Order and Update Status to trigger signal
        await sync_to_async(self._create_and_confirm_order)(restaurant)
        
        # Expect notification
        response = await communicator.receive_json_from()
        self.assertEqual(response['event'], 'order_update')
        self.assertEqual(response['status'], 'confirmed')
        
        await communicator.disconnect()

    def _create_and_confirm_order(self, restaurant):
        # Create initially as open
        order = Order.objects.create(restaurant=restaurant, status='open', total_amount=0)
        # Update to confirmed
        order.status = 'confirmed'
        order.save()
