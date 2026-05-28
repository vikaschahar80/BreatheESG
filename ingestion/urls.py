from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngestionRunViewSet, ActivityRecordViewSet, SetupViewSet

router = DefaultRouter()
router.register(r'runs', IngestionRunViewSet)
router.register(r'records', ActivityRecordViewSet)
router.register(r'setup', SetupViewSet, basename='setup')

urlpatterns = [
    path('', include(router.urls)),
]
