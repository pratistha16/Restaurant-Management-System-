from rest_framework.routers import DefaultRouter
from .views import KitchenOrderViewSet

router = DefaultRouter()
router.register('orders', KitchenOrderViewSet, basename='kitchen-orders')

urlpatterns = router.urls
