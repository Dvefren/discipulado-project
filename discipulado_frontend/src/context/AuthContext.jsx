// En src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/api';
import { jwtDecode } from 'jwt-decode';

// ... (El resto del código inicial, como createContext) ...
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. LEER AMBOS TOKENS DE LOCALSTORAGE
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null); // <-- AÑADIR
  
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try { return jwtDecode(token); } catch (e) { return null; }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setUser(decodedToken);
        localStorage.setItem('authToken', authToken);
      } catch (e) {
        console.error("Token inválido", e);
        setUser(null);
        setAuthToken(null); // Limpiar estado si es malo
        localStorage.removeItem('authToken');
      }
    } else {
      setUser(null);
    }
  }, [authToken]);

  // --- 2. MODIFICAR LOGIN ---
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/token/', {
        username: username,
        password: password,
      });

      const data = response.data;
      setAuthToken(data.access);
      setRefreshToken(data.refresh); // <-- AÑADIR
      
      // Guardar ambos tokens
      localStorage.setItem('authToken', data.access);
      localStorage.setItem('refreshToken', data.refresh); // <-- AÑADIR

      setLoading(false);
      return true;

    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
      return false;
    }
  };

  // --- 3. MODIFICAR LOGOUT ---
  const logout = () => {
    setAuthToken(null);
    setRefreshToken(null); // <-- AÑADIR
    // Limpiar ambos tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken'); // <-- AÑADIR
  };

  // --- 4. EXPONER LOS NUEVOS VALORES ---
  const contextData = {
    user,
    authToken,
    refreshToken, // <-- AÑADIR
    loading,
    error,
    login,
    logout,
    setAuthToken, // <-- Exponer para el interceptor
    setRefreshToken, // <-- Exponer para el interceptor
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