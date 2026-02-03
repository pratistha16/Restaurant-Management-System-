from rest_framework.routers import DefaultRouter
from .views import PrintJobViewSet

router = DefaultRouter()
router.register('jobs', PrintJobViewSet, basename='print-jobs')

urlpatterns = router.urls
