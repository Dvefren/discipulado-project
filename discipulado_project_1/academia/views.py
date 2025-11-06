# En academia/views.py

from rest_framework import viewsets
from .models import Curso, Horario, Mesa, Alumno, Asistencia
from .serializers import (
    CursoSerializer, 
    HorarioSerializer, 
    MesaSerializer, 
    AlumnoSerializer, 
    AsistenciaSerializer
)
# --- Importamos nuestros permisos ---
from .permissions import IsAdminUser, IsFacilitadorOwnerOrAdmin, IsAdminOrFacilitador

# ---
# 1. Cursos y Horarios: SOLO ADMINS
# ---
class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    permission_classes = [IsAdminUser] # <-- Solo Admins

class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer
    permission_classes = [IsAdminUser] # <-- Solo Admins

# ---
# 2. Mesas, Alumnos, Asistencia: Admins (todo) o Facilitadores (solo lo suyo)
# ---
class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer
    # Aplicamos el permiso de "dueño"
    permission_classes = [IsAdminOrFacilitador, IsFacilitadorOwnerOrAdmin]

    def get_queryset(self):
        """
        Sobrescribimos esta función para filtrar los resultados:
        - Si es Admin, devuelve todo.
        - Si es Facilitador, devuelve solo su mesa.
        """
        user = self.request.user
        if user.role == 'ADMIN':
            return Mesa.objects.all()
        elif user.role == 'FACILITADOR':
            # Filtramos las mesas donde el facilitador sea el usuario logueado
            return Mesa.objects.filter(facilitador=user)
        
        return Mesa.objects.none() # No debería llegar aquí

class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = Alumno.objects.all()
    serializer_class = AlumnoSerializer
    permission_classes = [IsAdminOrFacilitador, IsFacilitadorOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Alumno.objects.all()
        elif user.role == 'FACILITADOR':
            # Filtramos alumnos que pertenezcan a las mesas de este facilitador
            return Alumno.objects.filter(mesa__facilitador=user)
        
        return Alumno.objects.none()

class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.all()
    serializer_class = AsistenciaSerializer
    permission_classes = [IsAdminOrFacilitador, IsFacilitadorOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Asistencia.objects.all()
        elif user.role == 'FACILITADOR':
            # Filtramos asistencias de alumnos que pertenezcan a este facilitador
            return Asistencia.objects.filter(alumno__mesa__facilitador=user)
        
        return Asistencia.objects.none()