from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, IngredientViewSet, StockMovementViewSet, ItemRecipeViewSet

router = DefaultRouter()
router.register('suppliers', SupplierViewSet, basename='suppliers')
router.register('ingredients', IngredientViewSet, basename='ingredients')
router.register('stock-movements', StockMovementViewSet, basename='stock-movements')
router.register('recipes', ItemRecipeViewSet, basename='recipes')

urlpatterns = router.urls
