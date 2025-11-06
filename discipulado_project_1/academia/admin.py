# En academia/admin.py

from django.contrib import admin
from .models import Curso, Horario, Mesa, Alumno, Asistencia

# Registramos los modelos para que aparezcan en el panel de admin
admin.site.register(Curso)
admin.site.register(Horario)
admin.site.register(Mesa)
admin.site.register(Alumno)
admin.site.register(Asistencia)