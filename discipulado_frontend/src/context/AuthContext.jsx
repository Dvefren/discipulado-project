// En src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react'; // 1. Importar useEffect
import apiClient from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 2. Modificar los useState para que lean de localStorage
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        return jwtDecode(token); // Decodificamos el usuario al cargar
      } catch (e) {
        console.error("Token inválido en localStorage", e);
        localStorage.removeItem('authToken'); // Limpiamos token malo
        return null;
      }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false); // (Mantenemos loading para el login)
  const [error, setError] = useState(null);

  // 3. Añadir useEffect para actualizar el estado cuando el token cambie
  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setUser(decodedToken);
        localStorage.setItem('authToken', authToken);
      } catch (e) {
        console.error("Token inválido", e);
        setUser(null);
        localStorage.removeItem('authToken');
      }
    } else {
      setUser(null);
      localStorage.removeItem('authToken');
    }
  }, [authToken]); // Este efecto se ejecuta cada vez que 'authToken' cambia

  // --- Función de Login ---
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/token/', {
        username: username,
        password: password,
      });

      const data = response.data;
      setAuthToken(data.access); // 4. SOLO hacemos esto. El useEffect de arriba hará el resto.

      setLoading(false);
      return true;

    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
      return false;
    }
  };

  // --- Función de Logout ---
  const logout = () => {
    setAuthToken(null); // 5. SOLO hacemos esto. El useEffect se encargará de limpiar.
  };

  // ... (el resto del archivo 'contextData' y 'return' quedan igual)
  const contextData = {
    user,
    authToken,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};