# En usuarios/serializers.py

from rest_framework import serializers
from .models import CustomUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Campos que queremos exponer en la API
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active']

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
    
class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear usuarios (Facilitadores).
    Se encarga de encriptar la contraseña.
    """
    class Meta:
        model = CustomUser
        # Pedimos estos campos
        fields = ['username', 'password', 'first_name', 'last_name', 'email']
        # La contraseña será solo de escritura (no se podrá leer)
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # Usamos el método create_user() que hashea la contraseña
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            role='FACILITADOR'  # Forzamos el rol a Facilitador
        )
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para *actualizar* facilitadores.
    No permite cambiar el username ni la contraseña.
    """
    class Meta:
        model = CustomUser
        # Solo permitimos actualizar estos campos
        fields = ['first_name', 'last_name', 'email', 'is_active']
        
class FacilitadorSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer simple para mostrar solo el nombre de un facilitador.
    """
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'username']