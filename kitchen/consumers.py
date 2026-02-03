from channels.generic.websocket import AsyncJsonWebsocketConsumer

class KitchenConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.tenant_slug = self.scope['url_route']['kwargs']['tenant_slug']
        self.group_name = f"kitchen_{self.tenant_slug}"
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def order_update(self, event):
        await self.send_json(event['data'])
