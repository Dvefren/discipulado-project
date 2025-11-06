# En usuarios/views.py

from rest_framework import viewsets, permissions # Importar permissions
from .models import CustomUser
from .serializers import CustomUserSerializer
# (Importamos el permiso de Admin de la otra app, aunque podríamos moverlo
# a un archivo de permisos 'global')
from academia.permissions import IsAdminUser 

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    # Solo Admins pueden gestionar usuarios
    permission_classes = [IsAdminUser]