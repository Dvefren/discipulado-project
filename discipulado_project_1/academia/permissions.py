# En academia/permissions.py (archivo nuevo)

from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Permiso global para verificar si el usuario es Administrador.
    """
    def has_permission(self, request, view):
        # request.user existe gracias al token JWT
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class IsFacilitadorUser(permissions.BasePermission):
    """
    Permiso global para verificar si el usuario es Facilitador.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'FACILITADOR'

class IsAdminOrFacilitador(permissions.BasePermission):
    """
    Permiso para verificar si es Admin O Facilitador.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.role == 'ADMIN' or request.user.role == 'FACILITADOR')

class IsFacilitadorOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso de objeto:
    - Admins pueden hacer todo.
    - Facilitadores solo pueden ver/editar objetos (ej. una Mesa) 
      si son los 'dueños' (facilitador_id coincida).
    """

    def has_object_permission(self, request, view, obj):
        # Admins siempre tienen permiso
        if request.user.role == 'ADMIN':
            return True
        
        # Si el objeto es una 'Mesa', verificamos si el facilitador es el dueño
        if hasattr(obj, 'facilitador'):
            return obj.facilitador == request.user
        
        # Si el objeto es un 'Alumno', verificamos la mesa del alumno
        if hasattr(obj, 'mesa'):
            return obj.mesa.facilitador == request.user

        # Si el objeto es 'Asistencia', verificamos el alumno
        if hasattr(obj, 'alumno'):
            return obj.alumno.mesa.facilitador == request.user

        return False