from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class PrintConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.restaurant_id = int(self.scope['url_route']['kwargs']['restaurant_id'])
        self.printer_type = self.scope['url_route']['kwargs']['printer_type']
        self.group_name = f"printer:{self.restaurant_id}:{self.printer_type}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def receive_json(self, content, **kwargs):
        await self.send_json({"status": "received", "content": content})

    async def print_job(self, event):
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
