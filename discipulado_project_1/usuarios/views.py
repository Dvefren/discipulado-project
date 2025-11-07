# En usuarios/views.py

from rest_framework import viewsets, permissions # Importar permissions
from .models import CustomUser
from .serializers import CustomUserSerializer, MyTokenObtainPairSerializer, UserCreateSerializer
# (Importamos el permiso de Admin de la otra app, aunque podríamos moverlo
# a un archivo de permisos 'global')
from academia.permissions import IsAdminUser 
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    # Solo Admins pueden gestionar usuarios
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        """
        Elige qué serializer usar basado en la acción.
        """
        if self.action == 'create':
            # Si estamos creando (POST), usa el serializer de creación
            return UserCreateSerializer
        
        # Para todo lo demás (GET, PUT, DELETE), usa el normal
        return CustomUserSerializer
    
    # --- (Opcional) Filtrar para que esta vista solo devuelva facilitadores ---
    def get_queryset(self):
        # Hacemos que este endpoint solo devuelva facilitadores
        return CustomUser.objects.filter(role='FACILITADOR')
    
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Vista de login personalizada que usa nuestro serializer.
    """
    serializer_class = MyTokenObtainPairSerializer