// En src/layout/MainLayout.jsx

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Importar el hook de Auth

// --- (Estilos temporales) ---
const layoutStyle = {
  display: 'flex',
  height: '100vh',
};

const sidebarStyle = {
  width: '250px',
  background: '#f4f4f4',
  padding: '20px',
  borderRight: '1px solid #ddd',
};

const contentStyle = {
  flex: 1,
  padding: '20px',
  overflowY: 'auto', // Para permitir scroll en el contenido
};
// ---

export default function MainLayout() {
  const { user, logout } = useAuth(); // 2. Obtener el usuario y la función logout

  const handleLogout = () => {
    logout();
    // (No necesitamos redirigir, el ProtectedRoute lo hará automáticamente)
  };

  return (
    <div style={layoutStyle}>
      {/* 1. El Sidebar */}
      <aside style={sidebarStyle}>
        <h2>Discipulado</h2>

        {/* 3. Mostrar el nombre del usuario */}
        {user && <p>Hola, {user.first_name || user.username}</p>}

        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {/* Estos son los enlaces que React Router usará */}
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/cursos">Cursos</Link></li>
            <li><Link to="/alumnos">Alumnos</Link></li>
            <li><Link to="/asistencia">Asistencia</Link></li>
            <li><Link to="/facilitadores">Facilitadores</Link></li>
            <li><Link to="/calendario">Calendario</Link></li>
            <hr />
            {/* 4. Conectar el botón de logout */}
            <li>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '1em' }}>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 2. El Contenido (aquí se renderiza la página actual) */}
      <main style={contentStyle}>
        <Outlet /> 
      </main>
    </div>
  );
}