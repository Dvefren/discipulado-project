# En usuarios/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

# Configuramos el admin para nuestro modelo
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    
    # Añadimos 'role' a la vista de edición del usuario
    fieldsets = UserAdmin.fieldsets + (
        ('Datos Personalizados', {'fields': ('role',)}),
    )
    # Añadimos 'role' al formulario de creación de usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role',)}),
    )

# Registramos nuestro modelo
admin.site.register(CustomUser, CustomUserAdmin)