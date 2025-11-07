# En academia/views.py

from rest_framework import viewsets, status
from .models import Curso, Horario, Mesa, Alumno, Asistencia
from .serializers import (
    CursoSerializer, 
    HorarioSerializer, 
    MesaSerializer, 
    AlumnoSerializer, 
    AsistenciaSerializer
)
# Importamos nuestros permisos personalizados
from .permissions import IsAdminUser, IsFacilitadorOwnerOrAdmin, IsAdminOrFacilitador

# --- Importaciones para Vistas Personalizadas ---
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q
from django.utils import timezone
import datetime
# ---

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
    queryset = Mesa.objects.all()  # Necesario para el router
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
        
        return Mesa.objects.none()

class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = Alumno.objects.all() # Necesario para el router
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
    queryset = Asistencia.objects.all() # Necesario para el router
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

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrFacilitador])
    def bulk_upsert(self, request):
        """
        Crea o actualiza una lista de registros de asistencia.
        Espera datos como:
        [
            { "alumno": 12, "numero_clase": 5, "fecha_clase": "2025-11-06", "estado": "A" },
            { "alumno": 13, "numero_clase": 5, "fecha_clase": "2025-11-06", "estado": "F" }
        ]
        """
        asistencias_data = request.data
        if not isinstance(asistencias_data, list):
            return Response({"error": "Se esperaba una lista (array) de asistencias."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        alumnos_permitidos_ids = []

        # Si es facilitador, validamos que solo guarde asistencias de sus alumnos
        if user.role == 'FACILITADOR':
            alumnos_permitidos_ids = list(
                Alumno.objects.filter(mesa__facilitador=user).values_list('id', flat=True)
            )

        creados_o_actualizados = []

        for item in asistencias_data:
            alumno_id = item.get('alumno')

            # Validación de permisos
            if user.role == 'FACILITADOR' and alumno_id not in alumnos_permitidos_ids:
                continue # Se salta este registro si no le pertenece

            try:
                # Usamos update_or_create para manejar "upsert"
                # Busca por 'alumno' y 'numero_clase' (nuestro 'unique_together')
                obj, created = Asistencia.objects.update_or_create(
                    alumno_id=alumno_id,
                    numero_clase=item.get('numero_clase'),
                    # 'defaults' son los campos que se van a actualizar o crear
                    defaults={
                        'estado': item.get('estado'),
                        'motivo_falta_recupero': item.get('motivo_falta_recupero', None),
                        'horario_adelanto_id': item.get('horario_adelanto', None)
                    }
                )
                creados_o_actualizados.append(self.get_serializer(obj).data)
            except Exception as e:
                # Si algo falla (ej. el alumno_id no existe), solo lo reportamos
                print(f"Error al procesar asistencia para alumno {alumno_id}: {e}")

        return Response(creados_o_actualizados, status=status.HTTP_201_CREATED)

# ---
# 3. Vista Personalizada para el Dashboard
# ---
class DashboardStatsView(APIView):
    """
    Vista para obtener las estadísticas del dashboard.
    """
    permission_classes = [IsAdminOrFacilitador] # Ambos pueden ver el dashboard

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # --- Lógica de fechas ---
        # Definimos "esta semana" como de miércoles a domingo
        today = timezone.now().date()
        weekday = today.weekday() # Lunes=0, Martes=1, Miércoles=2, ... Domingo=6

        if weekday >= 2: # Si es Miércoles (2) o después
            # El inicio de la semana fue el miércoles más reciente
            start_of_week = today - datetime.timedelta(days=weekday - 2)
        else: # Si es Lunes (0) o Martes (1)
            # El inicio de la semana fue el miércoles de la semana pasada
            start_of_week = today - datetime.timedelta(days=weekday + 5) # (weekday + 7 - 2)

        end_of_week = start_of_week + datetime.timedelta(days=4) # Miércoles + 4 días = Domingo

        # --- Base de la consulta de Asistencia ---
        # Filtramos asistencias de esta semana y que sean 'FALTO'
        base_queryset = Asistencia.objects.filter(
            fecha_clase__range=[start_of_week, end_of_week],
            estado='F'
        )

        # Filtramos por rol
        if user.role == 'FACILITADOR':
            base_queryset = base_queryset.filter(alumno__mesa__facilitador=user)

        # --- Cálculo de Estadísticas ---

        # 1. Faltas totales por horario
        faltas_por_horario = base_queryset.values(
            'alumno__mesa__horario__dia', 
            'alumno__mesa__horario__hora'
        ).annotate(
            total_faltas=Count('id')
        ).order_by('alumno__mesa__horario__dia', 'alumno__mesa__horario__hora')

        # 2. Faltas por mesa (para el admin)
        faltas_por_mesa = []
        if user.role == 'ADMIN':
            faltas_por_mesa = base_queryset.values(
                'alumno__mesa__nombre_mesa',
                'alumno__mesa__facilitador__first_name'
            ).annotate(
                total_faltas=Count('id')
            ).order_by('alumno__mesa__nombre_mesa')

        # Datos para el frontend
        data = {
            'rango_semana': f"{start_of_week.strftime('%Y-%m-%d')} al {end_of_week.strftime('%Y-%m-%d')}",
            'faltas_por_horario': list(faltas_por_horario),
            'faltas_por_mesa': list(faltas_por_mesa),
        }

        return Response(data)