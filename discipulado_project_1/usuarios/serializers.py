# En usuarios/serializers.py

from rest_framework import serializers
from .models import CustomUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Campos que queremos exponer en la API
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # 1. Llama al método original para obtener el token
        token = super().get_token(user)

        # 2. Añade nuestros datos personalizados (claims)
        # user es el objeto CustomUser que se está logueando
        token['username'] = user.username
        token['role'] = user.role
        token['first_name'] = user.first_name

        return token