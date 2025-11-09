# En academia/views.py

from django.db.models import Count, Q
from django.utils import timezone
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
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """
        Por defecto, solo muestra los cursos activos.
        """
        return Curso.objects.all().order_by('activo', '-fecha_inicio')

    def perform_update(self, serializer):
        """
        Sobrescribe la actualización para manejar la desactivación en cascada.
        """
        instance = serializer.save() # Guarda el curso primero

        # Si el curso se está desactivando (pasando de True a False)
        if instance.activo is False and serializer.validated_data.get('activo') is False:
            # 1. Desactivar todas las Mesas de este curso
            mesas_del_curso = Mesa.objects.filter(horario__curso=instance)
            mesas_del_curso.update(activo=False)
            
            # 2. Desactivar todos los Alumnos de esas mesas
            Alumno.objects.filter(mesa__in=mesas_del_curso).update(activo=False)

class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.all()  # (Esto debe estar)
    serializer_class = HorarioSerializer
    # permission_classes = [IsAdminUser] # <-- ¡ELIMINA ESTA LÍNEA!

    def get_queryset(self):
        """
        Si se pide un curso, devuelve todos sus horarios (activos e inactivos).
        Si no se pide un curso, devuelve SOLO los horarios ACTIVOS.
        """
        queryset = Horario.objects.all()
        
        curso_id = self.request.query_params.get('curso') 
        if curso_id:
            queryset = queryset.filter(curso_id=curso_id)
        else:
            queryset = queryset.filter(activo=True)
            
        return queryset.order_by('-activo', 'dia', 'hora')

    # --- AÑADE ESTA NUEVA FUNCIÓN ---
    def get_permissions(self):
        """
        Asigna permisos basados en la acción (el método HTTP).
        """
        # Si la acción es 'list' o 'retrieve' (GET)
        if self.action in ['list', 'retrieve']:
            # Permite que Admins Y Facilitadores puedan LEER
            permission_classes = [IsAdminOrFacilitador]
        else:
            # Para todo lo demás (POST, PUT, PATCH, DELETE)
            # Solo permite Admins
            permission_classes = [IsAdminUser]
        
        return [permission() for permission in permission_classes]
    # --- FIN DE LA NUEVA FUNCIÓN ---

    def perform_update(self, serializer):
        # ... (esta función queda igual)
        instance = serializer.save()
        if instance.activo is False and serializer.validated_data.get('activo') is False:
            mesas_del_horario = Mesa.objects.filter(horario=instance)
            mesas_del_horario.update(activo=False)
            Alumno.objects.filter(mesa__in=mesas_del_horario).update(activo=False)
    
    def perform_destroy(self, instance):
        # ... (esta función queda igual)
        instance.activo = False
        instance.save()
        mesas_del_horario = Mesa.objects.filter(horario=instance)
        mesas_del_horario.update(activo=False)
        Alumno.objects.filter(mesa__in=mesas_del_horario).update(activo=False)

# ---
# 2. Mesas, Alumnos, Asistencia: Admins (todo) o Facilitadores (solo lo suyo)
# ---
class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()  # (Esto es necesario para el router)
    serializer_class = MesaSerializer # (Usará el serializer corregido)
    permission_classes = [IsAdminOrFacilitador, IsFacilitadorOwnerOrAdmin]

    def get_queryset(self):
        """
        Filtra por rol, estado activo, Y por horario.
        ¡Lógica de filtrado corregida!
        """
        user = self.request.user
        queryset = Mesa.objects.all() # Empezamos con todo

        # 1. Filtramos por 'horario' si se pide
        horario_id = self.request.query_params.get('horario')
        if horario_id:
            queryset = queryset.filter(horario_id=horario_id)

        # 2. Filtramos por rol
        if user.role == 'ADMIN':
            # El Admin ve todas (activas e inactivas)
            return queryset.order_by('-activo', 'nombre_mesa')
        
        elif user.role == 'FACILITADOR':
            # El Facilitador solo ve sus mesas Y que estén activas
            return queryset.filter(
                facilitador=user,
                activo=True
            ).order_by('nombre_mesa')
        
        return Mesa.objects.none()
    
    def perform_update(self, serializer):
        """
        Sobrescribe la actualización para manejar la desactivación en cascada.
        (Esta función SÍ la necesitamos)
        """
        instance = serializer.save() # Guarda la mesa primero

        # Si la mesa se está desactivando
        if 'activo' in serializer.validated_data and instance.activo is False:
            # Desactivar todos los Alumnos de esta mesa
            Alumno.objects.filter(mesa=instance).update(activo=False)
        
    def perform_destroy(self, instance):
        """
        Sobrescribe el borrado (DELETE) para hacer un "soft delete".
        """
        instance.activo = False
        instance.save()
        
        # También desactivamos en cascada a los alumnos
        Alumno.objects.filter(mesa=instance).update(activo=False)

class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = Alumno.objects.all()
    serializer_class = AlumnoSerializer
    permission_classes = [IsAdminOrFacilitador, IsFacilitadorOwnerOrAdmin]

    def get_queryset(self):
        """
        Filtra por rol Y por estado activo.
        """
        user = self.request.user
        
        queryset = Alumno.objects.all() # <-- Solo alumnos activos

        if user.role == 'ADMIN':
            return queryset.order_by('-activo','apellidos')
        elif user.role == 'FACILITADOR':
            return queryset.filter(mesa__facilitador=user).order_by('-activo', 'apellidos')
        
        return Alumno.objects.none()

    def perform_destroy(self, instance):
        """
        Sobrescribe el borrado (DELETE) para hacer un "soft delete".
        """
        instance.activo = False
        instance.save()

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
    Vista para obtener las estadísticas del dashboard,
    filtradas por 'numero_clase'.
    """
    permission_classes = [IsAdminOrFacilitador]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        try:
            numero_clase = int(request.query_params.get('clase', 1))
        except ValueError:
            numero_clase = 1

        # --- Base de la consulta ---
        base_queryset = Asistencia.objects.filter(
            numero_clase=numero_clase
        )
        if user.role == 'FACILITADOR':
            base_queryset = base_queryset.filter(alumno__mesa__facilitador=user)

        # --- Cálculo de Estadísticas ---

        # 1. Faltas por Horario (Esta se queda igual)
        faltas_queryset = base_queryset.filter(estado='F')
        faltas_por_horario = faltas_queryset.values(
            'alumno__mesa__horario__dia', 
            'alumno__mesa__horario__hora'
        ).annotate(
            total_faltas=Count('id')
        ).order_by('alumno__mesa__horario__dia', 'alumno__mesa__horario__hora')

        # --- CAMBIO AQUÍ ---
        # 2. Desglose DETALLADO por mesa (solo para Admin)
        detalle_por_mesa = []
        if user.role == 'ADMIN':
            # NO filtramos por estado, sino que AGRUPAMOS por estado
            detalle_por_mesa = base_queryset.values(
                'alumno__mesa__nombre_mesa',
                'alumno__mesa__facilitador__first_name',
                'alumno__mesa_id', # ID para agrupar en el frontend
                'estado'          # Agrupamos también por estado
            ).annotate(
                total=Count('id') # Nuevo nombre
            ).order_by('alumno__mesa__nombre_mesa', 'estado')
        # --- FIN DEL CAMBIO ---

        # 3. Conteo general (Se queda igual)
        conteo_general = base_queryset.values('estado').annotate(
            total=Count('id')
        ).order_by('estado')

        # Datos para el frontend
        data = {
            'numero_clase_consultada': numero_clase,
            'faltas_por_horario': list(faltas_por_horario),
            'detalle_por_mesa': list(detalle_por_mesa), # <-- CAMBIO (antes 'asistencias_por_mesa')
            'conteo_general': list(conteo_general),
        }

        return Response(data)

class CumpleanosView(APIView):
    """
    Vista para obtener la lista de alumnos que cumplen años
    en el mes actual, filtrados por rol.
    """
    permission_classes = [IsAdminOrFacilitador] # Ambos pueden ver la lista

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # 1. Obtener el mes actual (como un número, ej: 11 para Noviembre)
        current_month = timezone.now().month

        # 2. Base de la consulta:
        #    - Alumnos activos
        #    - Que su mes de nacimiento coincida con el mes actual
        base_queryset = Alumno.objects.filter(
            activo=True,
            fecha_nacimiento__month=current_month
        )

        # 3. Filtrar por rol
        if user.role == 'FACILITADOR':
            # Facilitador solo ve alumnos de sus mesas activas
            base_queryset = base_queryset.filter(
                mesa__facilitador=user,
                mesa__activo=True
            )
        
        # 4. Ordenar por día del mes
        alumnos = base_queryset.order_by('fecha_nacimiento__day')
        
        # 5. Usamos el AlumnoSerializer que ya teníamos
        serializer = AlumnoSerializer(alumnos, many=True)
        return Response(serializer.data)