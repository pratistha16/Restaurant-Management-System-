from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import Role, TenantUser, Permission, RolePermission
from .permissions import HasPermission
from .serializers import RoleSerializer, CustomTokenObtainPairSerializer

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TenantUserViewSet(viewsets.ViewSet):
    # Only users with 'users.manage' permission (or equivalent) can access
    permission_classes = [HasPermission]
    required_permission = 'users.manage'

    def list(self, request):
        tenant = request.tenant
        # Find all users who have a role in this tenant
        user_ids = TenantUser.objects.filter(restaurant=tenant).values_list('user_id', flat=True)
        users = User.objects.filter(id__in=user_ids)
        data = []
        for u in users:
            # Get role for this user in this tenant
            try:
                tu = TenantUser.objects.get(user=u, restaurant=tenant)
                role_name = tu.role.display_name if tu.role else "No Role"
                role_id = tu.role.id if tu.role else None
            except TenantUser.DoesNotExist:
                role_name = "N/A"
                role_id = None
            
            data.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": role_name,
                "role_id": role_id
            })
        return Response(data)

    def create(self, request):
        tenant = request.tenant
        username = request.data.get("username")
        password = request.data.get("password")
        role_id = request.data.get("role_id")

        if not all([username, password, role_id]):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if role belongs to this tenant
        try:
            role = Role.objects.get(id=role_id, restaurant=tenant)
        except Role.DoesNotExist:
            return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)

        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password(password)
            user.save()
        
        # Assign role
        if TenantUser.objects.filter(user=user, restaurant=tenant).exists():
             return Response({"error": "User already in restaurant"}, status=status.HTTP_400_BAD_REQUEST)

        TenantUser.objects.create(user=user, role=role, restaurant=tenant)
        return Response({"id": user.id, "username": user.username})

    def update(self, request, pk=None):
        tenant = request.tenant
        try:
            user = User.objects.get(pk=pk)
            tu = TenantUser.objects.get(user=user, restaurant=tenant)
        except (User.DoesNotExist, TenantUser.DoesNotExist):
            return Response({"error": "User not found in this restaurant"}, status=status.HTTP_404_NOT_FOUND)

        role_id = request.data.get("role_id")
        if role_id:
             try:
                role = Role.objects.get(id=role_id, restaurant=tenant)
                tu.role = role
                tu.save()
             except Role.DoesNotExist:
                return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"status": "updated"})

    def destroy(self, request, pk=None):
        tenant = request.tenant
        try:
            user = User.objects.get(pk=pk)
            TenantUser.objects.filter(user=user, restaurant=tenant).delete()
            return Response({"status": "removed from restaurant"})
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class TenantRoleViewSet(viewsets.ModelViewSet):
    permission_classes = [HasPermission]
    required_permission = 'roles.manage'
    serializer_class = RoleSerializer

    def get_queryset(self):
        return Role.objects.filter(restaurant=self.request.tenant)
