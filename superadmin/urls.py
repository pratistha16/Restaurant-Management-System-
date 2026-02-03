from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, DashboardView, PlatformLogsView

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='superadmin-tenants')
router.register(r'logs', PlatformLogsView, basename='superadmin-logs')

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='superadmin-dashboard'),
    path('', include(router.urls)),
]
