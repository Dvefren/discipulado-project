# En usuarios/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    
    # Definimos los roles usando TextChoices
    class Roles(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        FACILITADOR = 'FACILITADOR', 'Facilitador'
    
    # Añadimos el nuevo campo 'role'
    role = models.CharField(
        max_length=50, 
        choices=Roles.choices,
        # Por seguridad, el rol por defecto será el de menos privilegios
        default=Roles.FACILITADOR 
    )

    # (Puedes añadir más campos aquí en el futuro si lo necesitas,
    # como 'telefono', 'foto_perfil', etc.)