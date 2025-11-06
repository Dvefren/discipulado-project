// En src/pages/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // 1. Importar el hook de Auth
import { useNavigate } from 'react-router-dom'; // 2. Importar hook para redirigir

// --- Estilos temporales ---
const loginContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  background: '#f9f9f9',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '30px',
  background: '#fff',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  width: '300px',
};

const inputStyle = {
  marginBottom: '15px',
  padding: '10px',
  fontSize: '16px',
  borderRadius: '4px',
  border: '1px solid #ddd',
};

const buttonStyle = {
  padding: '10px',
  fontSize: '16px',
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const errorStyle = {
  color: 'red',
  marginBottom: '10px',
};
// ---

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, loading, error } = useAuth(); // 3. Obtener funciones del contexto
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    // 4. Llamar a la función de login del contexto
    const success = await login(username, password);
    
    if (success) {
      // 5. Redirigir al inicio si el login fue exitoso
      navigate('/');
    }
  };

  return (
    <div style={loginContainerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2>Iniciar Sesión</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          autoComplete="current-password"
        />
        
        {/* Mostrar mensaje de error si existe */}
        {error && <p style={errorStyle}>{error}</p>}
        
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Cargando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}