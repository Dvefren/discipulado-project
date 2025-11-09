# En academia/urls.py (archivo nuevo)

from rest_framework.routers import DefaultRouter
from . import views
from django.urls import path

# Creamos un router
router = DefaultRouter()

# Registramos nuestros ViewSets con el router
# Esto creará las URLs para /cursos, /horarios, /mesas, etc.
router.register(r'cursos', views.CursoViewSet)
router.register(r'horarios', views.HorarioViewSet)
router.register(r'mesas', views.MesaViewSet)
router.register(r'alumnos', views.AlumnoViewSet)
router.register(r'asistencias', views.AsistenciaViewSet)

# Los urlpatterns son generados automáticamente por el router
urlpatterns = router.urls

urlpatterns.extend([
    path('dashboard-stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('cumpleanos/', views.CumpleanosView.as_view(), name='cumpleanos')
])