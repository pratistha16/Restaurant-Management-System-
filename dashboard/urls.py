from django.urls import path
from .views import TenantDashboardView

urlpatterns = [
    path('', TenantDashboardView.as_view(), name='tenant-dashboard'),
]
