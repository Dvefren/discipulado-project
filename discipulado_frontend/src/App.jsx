// En src/App.jsx

import { Routes, Route } from 'react-router-dom';

// Layout
import MainLayout from './layout/MainLayout';
import ProtectedRoute from './router/ProtectedRoute'; // <-- 1. Importar el guardia

// Páginas
import Dashboard from './pages/Dashboard';
import Cursos from './pages/Cursos';
import Asistencia from './pages/Asistencia';
import Alumnos from './pages/Alumnos';
import Facilitadores from './pages/Facilitadores';
import Calendario from './pages/Calendario';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import CursoDetail from './pages/CursoDetail';
import HorarioDetail from './pages/HorarioDetail';

function App() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS (ej. Login) */}
      <Route path="/login" element={<Login />} />

      {/* RUTAS PRIVADAS (requieren estar logueado) */}
      
      {/* 2. Envolvemos las rutas privadas con el "Guardia" */}
      <Route element={<ProtectedRoute />}>
        
        {/* Todas las rutas aquí dentro solo serán visibles si estás logueado */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="cursos" element={<Cursos />} />
          <Route path="cursos/:cursoId" element={<CursoDetail />} />
          <Route path="horarios/:horarioId" element={<HorarioDetail />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="facilitadores" element={<Facilitadores />} />
          <Route path="calendario" element={<Calendario />} />
        </Route>
        
      </Route>
      
      {/* Ruta para cualquier otra cosa */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;