# En config/urls.py

from django.contrib import admin
from django.urls import path, include

# --- Importar la vista de REFRESH de SimpleJWT ---
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
# --- Importar NUESTRA VISTA de login ---
from usuarios.views import MyTokenObtainPairView 
# ---

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- URLs de Autenticación (Login) ---
    
    # Usa nuestra vista personalizada
    path('api/v1/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'), 
    
    # Mantenemos la vista original para el "refresh"
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # ---
    
    # Nuestras URLs de la API
    path('api/v1/auth/', include('usuarios.urls')),
    path('api/v1/', include('academia.urls')),
]