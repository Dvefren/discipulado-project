# En usuarios/serializers.py

from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Campos que queremos exponer en la API
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role']