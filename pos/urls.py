from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, TableViewSet, ZoneViewSet, TableSessionViewSet

router = DefaultRouter()
router.register('orders', OrderViewSet, basename='orders')
router.register('tables', TableViewSet, basename='tables')
router.register('zones', ZoneViewSet, basename='zones')
router.register('sessions', TableSessionViewSet, basename='sessions')

urlpatterns = router.urls
