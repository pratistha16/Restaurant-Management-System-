from rest_framework import serializers
from .models import Category, Item, ItemVariant, AddonGroup, Addon

class ItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemVariant
        fields = ['id', 'name', 'price_delta']

class AddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addon
        fields = ['id', 'name', 'price', 'is_available']

class AddonGroupSerializer(serializers.ModelSerializer):
    addons = AddonSerializer(many=True, read_only=True)
    
    class Meta:
        model = AddonGroup
        fields = ['id', 'name', 'min_selection', 'max_selection', 'items', 'addons']

class ItemSerializer(serializers.ModelSerializer):
    variants = ItemVariantSerializer(many=True, read_only=True)
    addon_groups = AddonGroupSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'base_price', 'category', 'category_name', 
                  'is_available', 'is_veg', 'image', 'variants', 'addon_groups',
                  'maintain_stock', 'current_stock', 'low_stock_threshold']

    def validate(self, data):
        maintain_stock = data.get('maintain_stock', self.instance.maintain_stock if self.instance else False)
        
        if maintain_stock:
            current_stock = data.get('current_stock')
            if current_stock is None and (not self.instance or self.instance.current_stock is None):
                # If creating or updating and no stock provided, default to 0 is handled by model, 
                # but validation rule might require explicit input if we want to be strict.
                # However, model default is 0.
                pass
            if current_stock is not None and current_stock < 0:
                 raise serializers.ValidationError({"current_stock": "Stock cannot be negative."})
        
        return data

class CategorySerializer(serializers.ModelSerializer):
    items = ItemSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'is_kitchen', 'is_bar', 'items']
