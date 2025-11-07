# En academia/models.py

from django.db import models
from django.conf import settings # Para relacionar con nuestro CustomUser

# Modelo 1: Curso (El contenedor más grande)
class Curso(models.Model):
    nombre = models.CharField(max_length=100) # Ej: "Discipulado 2025 - Semestre 1"
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

# Modelo 2: Horario (Los 4 horarios fijos por curso)
class Horario(models.Model):
    class Dia(models.TextChoices):
        MIERCOLES = 'MIE', 'Miércoles'
        DOMINGO = 'DOM', 'Domingo'
    
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='horarios')
    dia = models.CharField(max_length=3, choices=Dia.choices)
    hora = models.TimeField() # Ej: 19:00, 09:00, 11:00, 13:00

    def __str__(self):
        # Texto descriptivo, ej: "Discipulado 2025 - S1 - Miércoles 19:00"
        return f"{self.curso.nombre} - {self.get_dia_display()} {self.hora.strftime('%H:%M')}"

# Modelo 3: Mesa (El grupo del facilitador)
class Mesa(models.Model):
    horario = models.ForeignKey(Horario, on_delete=models.CASCADE, related_name='mesas')
    # Usamos settings.AUTH_USER_MODEL para referirnos a nuestro 'CustomUser'
    facilitador = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, # No borrar al facilitador si tiene una mesa
        limit_choices_to={'role': 'FACILITADOR'}, # Solo permite asignar facilitadores
        related_name='mesas_asignadas'
    )
    nombre_mesa = models.CharField(max_length=100, blank=True) # Ej: "Mesa 1"

    def __str__(self):
        # Ej: "Mesa de [Facilitador] (Miércoles 19:00)"
        return f"Mesa de {self.facilitador.first_name} ({self.horario.get_dia_display()})"

# Modelo 4: Alumno
class Alumno(models.Model):
    # El alumno pertenece a UNA mesa. Si cambia de mesa, solo actualizamos este campo.
    mesa = models.ForeignKey(
        Mesa, 
        on_delete=models.SET_NULL, # Si se borra la mesa, el alumno queda "sin mesa"
        null=True, 
        blank=True,
        related_name='alumnos'
    )
    
    # Datos personales
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField()
    
    # Contacto
    telefono = models.CharField(max_length=15, blank=True)
    
    # Dirección (blank=True significa que son opcionales)
    colonia = models.CharField(max_length=100, blank=True)
    calle = models.CharField(max_length=100, blank=True)
    numero_casa = models.CharField(max_length=20, blank=True)
    
    activo = models.BooleanField(default=True) # Si el alumno sigue en el curso

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

# Modelo 5: Asistencia (El registro más usado)
class Asistencia(models.Model):
    class Estado(models.TextChoices):
        ASISTIO = 'A', 'Asistió'
        FALTO = 'F', 'Faltó'
        RECUPERO = 'R', 'Recuperó'
        ADELANTO = 'D', 'Adelantó'

    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='asistencias')
    # Guardamos la fecha y el número de clase (de 1 a 23)
    numero_clase = models.PositiveSmallIntegerField() # De 1 a 23
    
    estado = models.CharField(max_length=1, choices=Estado.choices)
    
    # Para los casos especiales
    motivo_falta_recupero = models.TextField(blank=True, null=True) # Para 'Faltó' o 'Recuperó'
    
    # Si 'Adelantó', guardamos en qué horario lo hizo
    horario_adelanto = models.ForeignKey(
        Horario, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True
    )

    class Meta:
        # Creamos un índice único para evitar duplicados:
        # Un alumno no puede tener dos registros para la misma "numero_clase"
        unique_together = ('alumno', 'numero_clase')

    def __str__(self):
        return f"Clase {self.numero_clase} - {self.alumno.nombres} ({self.get_estado_display()})"