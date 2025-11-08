# En academia/serializers.py

from rest_framework import serializers
from .models import Curso, Horario, Mesa, Alumno, Asistencia
from usuarios.serializers import FacilitadorSimpleSerializer
from usuarios.models import CustomUser  # <-- 1. AÑADE ESTA LÍNEA DE IMPORTACIÓN

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = '__all__'  # '__all__' es un atajo para incluir todos los campos

class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horario
        fields = '__all__'

class MesaSerializer(serializers.ModelSerializer):
    # --- AÑADIR ESTAS LÍNEAS ---
    # Esto le dice a DRF que use el serializer anidado
    # 'read_only=True' significa que no se usará para crear/actualizar,
    # lo cual es correcto (para eso enviamos el ID por separado).
    facilitador = FacilitadorSimpleSerializer(read_only=True)
    
    # Esto es para la ESCRITURA (Crear/Actualizar)
    # Permite que sigamos enviando solo el ID (ej. 'facilitador': 4)
    facilitador_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source='facilitador', write_only=True
    )
    # ---

    class Meta:
        model = Mesa
        # Actualizamos los fields
        fields = [
            'id', 'horario', 'nombre_mesa', 'activo', 
            'facilitador', # El objeto (para LEER)
            'facilitador_id' # El ID (para ESCRIBIR)
        ]

class AlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alumno
        fields = '__all__'

class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = '__all__'