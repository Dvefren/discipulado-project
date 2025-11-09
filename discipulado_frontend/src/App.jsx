// En src/App.jsx

import { Routes, Route } from 'react-router-dom';

// Layout
import MainLayout from './layout/MainLayout';
import ProtectedRoute from './router/ProtectedRoute';

// Páginas
import Dashboard from './pages/Dashboard';
import Cursos from './pages/Cursos';
import CursoDetail from './pages/CursoDetail';
import HorarioDetail from './pages/HorarioDetail';
import Asistencia from './pages/Asistencia';
import Alumnos from './pages/Alumnos';
import Facilitadores from './pages/Facilitadores';
import Calendario from './pages/Calendario';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function App() {
  return (
    // ¡Sin <Box> ni estilos aquí! MUI se encarga de todo.
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
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
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;