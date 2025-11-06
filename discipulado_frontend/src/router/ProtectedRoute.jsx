// En src/router/ProtectedRoute.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const { user, authToken } = useAuth(); // Obtenemos el usuario del contexto

  // (Podríamos añadir lógica para chequear si el token
  // guardado en localStorage sigue siendo válido)
  
  // Si no hay usuario o token, lo redirigimos a la página de login
  if (!user && !authToken) {
    // 'replace' evita que el usuario pueda volver atrás con el botón del navegador
    return <Navigate to="/login" replace />;
  }

  // Si hay un usuario, le mostramos el contenido que esta ruta protege
  // <Outlet /> renderizará los componentes hijos (en nuestro caso, MainLayout)
  return <Outlet />;
}