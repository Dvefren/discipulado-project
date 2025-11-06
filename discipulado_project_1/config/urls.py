# En config/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- URLs de Autenticación (Login) ---
    # React enviará el POST (usuario/pass) aquí
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Esta ruta sirve para refrescar un token que está por expirar
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # ---
    
    # Nuestras URLs de la API
    path('api/v1/auth/', include('usuarios.urls')),
    path('api/v1/', include('academia.urls')),
]