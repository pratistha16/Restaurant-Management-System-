from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, AddonGroupViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='categories')
router.register('items', ItemViewSet, basename='items')
router.register('addons', AddonGroupViewSet, basename='addons')

urlpatterns = [
    path('', include(router.urls)),
]
