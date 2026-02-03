from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from pos.models import Order
from .models import ItemRecipe, StockMovement

@receiver(post_save, sender=Order)
def deduct_inventory(sender, instance, created, **kwargs):
    if instance.status == 'confirmed' and not instance.inventory_deducted:
        with transaction.atomic():
            # Iterate over order items
            for order_item in instance.items.all():
                # Find recipe for the item
                recipes = ItemRecipe.objects.filter(item=order_item.item)
                for recipe in recipes:
                    deduction_qty = recipe.quantity * order_item.quantity
                    
                    # Deduct from ingredient
                    ingredient = recipe.ingredient
                    ingredient.current_stock -= deduction_qty
                    ingredient.save()
                    
                    # Log movement
                    StockMovement.objects.create(
                        restaurant=instance.restaurant,
                        ingredient=ingredient,
                        movement_type=StockMovement.OUT,
                        quantity=deduction_qty,
                        note=f"Order #{instance.id} - {order_item.item.name}"
                    )
            
            # Mark as deducted
            # update_fields avoids triggering full save logic if we were worried, 
            # but here the flag prevents re-execution.
            instance.inventory_deducted = True
            instance.save(update_fields=['inventory_deducted'])
