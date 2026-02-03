from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantUserViewSet, TenantRoleViewSet, CustomLoginView, LogoutView

router = DefaultRouter()
router.register(r'users', TenantUserViewSet, basename='tenant-users')
router.register(r'roles', TenantRoleViewSet, basename='tenant-roles')

urlpatterns = [
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('', include(router.urls)),
]
