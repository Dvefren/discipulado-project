# En usuarios/views.py

from rest_framework import viewsets, permissions # Importar permissions
from .models import CustomUser
from .serializers import CustomUserSerializer, MyTokenObtainPairSerializer
# (Importamos el permiso de Admin de la otra app, aunque podríamos moverlo
# a un archivo de permisos 'global')
from academia.permissions import IsAdminUser 
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    # Solo Admins pueden gestionar usuarios
    permission_classes = [IsAdminUser]
    
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Vista de login personalizada que usa nuestro serializer.
    """
    serializer_class = MyTokenObtainPairSerializer