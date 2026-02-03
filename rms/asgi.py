import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path, re_path
from printing.consumers import PrintConsumer
from kitchen.consumers import KitchenConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter([
        re_path(r"^ws/print/(?P<restaurant_id>\d+)/(?P<printer_type>\\w+)/$", PrintConsumer.as_asgi()),
        re_path(r"^ws/kitchen/(?P<tenant_slug>[\w-]+)/$", KitchenConsumer.as_asgi()),
    ]),
})
