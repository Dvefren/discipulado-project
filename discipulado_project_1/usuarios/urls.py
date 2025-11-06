# En usuarios/urls.py (archivo nuevo)

from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Esto creará las URLs para /usuarios
router.register(r'usuarios', views.CustomUserViewSet)

urlpatterns = router.urls