from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Order

@receiver(post_save, sender=Order)
def notify_kitchen(sender, instance, created, **kwargs):
    # Only notify if status is relevant to kitchen
    if instance.status in ['confirmed', 'preparing', 'ready', 'cancelled']:
        channel_layer = get_channel_layer()
        group_name = f"kitchen_{instance.restaurant.slug}"
        
        # Serialize items manually (avoiding DRF dependency inside signal for speed/simplicity)
        items_data = []
        for item in instance.items.all():
            items_data.append({
                "item": item.item.name,
                "variant": item.variant.name if item.variant else None,
                "qty": item.quantity,
                "notes": item.notes,
                "addons": [a.name for a in item.addons.all()]
            })

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "order_update",
                "data": {
                    "event": "order_update",
                    "order_id": instance.id,
                    "status": instance.status,
                    "type": instance.order_type,
                    "table": instance.table.number if instance.table else "N/A",
                    "waiter": instance.waiter.user.username if instance.waiter else None,
                    "created_at": instance.created_at.isoformat(),
                    "items": items_data
                }
            }
        )
