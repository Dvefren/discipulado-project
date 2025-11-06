// En src/App.jsx

import { Routes, Route } from 'react-router-dom'

// --- Páginas ---
// (Todavía no existen, las crearemos ahora)
// function Layout() { return <h1>Layout (Sidebar + Contenido)</h1> }
// function Dashboard() { return <h1>Página de Inicio (Dashboard)</h1> }
// function Cursos() { return <h1>Página de Cursos</h1> }
// function Asistencia() { return <h1>Página de Asistencia</h1> }
// function Alumnos() { return <h1>Página de Alumnos</h1> }
// function Facilitadores() { return <h1>Página de Facilitadores</h1> }
// function Calendario() { return <h1>Página de Calendario</h1> }
function Login() { return <h1>Página de Login</h1> }
function NotFound() { return <h1>404 - Página no encontrada</h1> }


function App() {

  return (
    <Routes>
      {/* RUTAS PÚBLICAS (ej. Login) */}
      <Route path="/login" element={<Login />} />

      {/* RUTAS PRIVADAS (requieren estar logueado) */}
      {/* Más adelante, aquí pondremos el Layout que contiene el Sidebar.
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cursos" element={<Cursos />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="facilitadores" element={<Facilitadores />} />
          <Route path="calendario" element={<Calendario />} />
        </Route>
      */}
      
      {/* Ruta principal temporal */}
      <Route path="/" element={<h1>Página principal (Temporal)</h1>} />

      {/* Ruta para cualquier otra cosa */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App