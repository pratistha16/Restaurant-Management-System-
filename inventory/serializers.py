from rest_framework import serializers
from .models import Supplier, Ingredient, StockMovement, ItemRecipe

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['tenant']

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'
        read_only_fields = ['tenant']

class StockMovementSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['tenant', 'user']

class ItemRecipeSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    class Meta:
        model = ItemRecipe
        fields = '__all__'
        read_only_fields = ['tenant']
