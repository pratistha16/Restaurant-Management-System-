from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomLoginView, LogoutView
from .api import api

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Ninja API
    path('api/v2/', api.urls),

    # API V1
    path('api/v1/superadmin/', include('superadmin.urls')),
    
    # Tenant Scoped API
    path('api/v1/tenant/<str:tenant_slug>/', include([
        path('pos/', include('pos.urls')),
        path('kitchen/', include('kitchen.urls')),
        path('accounts/', include('accounts.urls')),
        path('printing/', include('printing.urls')),
        path('menu/', include('menu.urls')),
        path('inventory/', include('inventory.urls')),
        path('dashboard/', include('dashboard.urls')),
    ])),

    # Auth
    path('api/v1/auth/login/', CustomLoginView.as_view(), name='token_obtain_pair'), # Using CustomLoginView
    path('api/v1/auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
