// En src/pages/Facilitadores.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// (Estilos temporales)
const cardStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  padding: '15px',
  marginBottom: '10px',
  borderRadius: '8px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '20px',
  background: '#f9f9f9',
  borderRadius: '8px',
  marginBottom: '20px',
};

const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const toggleButtonStyle = { ...buttonStyle, background: '#28a745', marginBottom: '20px' };
const errorStyle = { color: 'red', fontSize: '0.9em' };

export default function Facilitadores() {
  const [facilitadores, setFacilitadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- Estados para el formulario ---
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
  });

  // --- Cargar datos ---
  const fetchFacilitadores = async () => {
    try {
      setLoading(true);
      // Ya no necesitamos filtrar en frontend, el backend lo hace
      const response = await apiClient.get('/auth/usuarios/');
      setFacilitadores(response.data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar facilitadores:", err);
      setError("No se pudieron cargar los facilitadores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilitadores();
  }, []);

  // --- Manejadores del formulario ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validación simple
    if (!formData.username || !formData.password) {
      setFormError("El usuario y la contraseña son obligatorios.");
      return;
    }

    try {
      // 1. Enviar los datos al backend
      await apiClient.post('/auth/usuarios/', formData);
      
      // 2. Limpiar formulario y ocultarlo
      setIsFormVisible(false);
      setFormData({ username: '', password: '', first_name: '', last_name: '', email: '' });
      
      // 3. Recargar la lista de facilitadores
      fetchFacilitadores(); 
      
    } catch (err) {
      console.error("Error al crear facilitador:", err);
      setFormError("Error al crear. Revisa que el 'username' no esté repetido.");
    }
  };

  // --- Renderizado ---
  if (loading && facilitadores.length === 0) {
    return <p>Cargando facilitadores...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h1>👤 Facilitadores</h1>
      
      <button onClick={() => setIsFormVisible(!isFormVisible)} style={toggleButtonStyle}>
        {isFormVisible ? 'Cancelar' : 'Añadir Nuevo Facilitador'}
      </button>

      {/* --- Formulario de Creación (visible condicionalmente) --- */}
      {isFormVisible && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>Nuevo Facilitador</h3>
          <input type="text" name="username" placeholder="* Nombre de Usuario" value={formData.username} onChange={handleInputChange} style={inputStyle} />
          <input type="password" name="password" placeholder="* Contraseña" value={formData.password} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="first_name" placeholder="Nombres" value={formData.first_name} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="last_name" placeholder="Apellidos" value={formData.last_name} onChange={handleInputChange} style={inputStyle} />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} style={inputStyle} />
          
          {formError && <p style={errorStyle}>{formError}</p>}
          
          <button type="submit" style={buttonStyle}>Crear Facilitador</button>
        </form>
      )}

      <hr />

      {/* --- Lista de Facilitadores --- */}
      {facilitadores.length === 0 ? (
        <p>No hay facilitadores registrados.</p>
      ) : (
        <div>
          {facilitadores.map((user) => (
            <div key={user.id} style={cardStyle}>
              <h3>{user.first_name} {user.last_name}</h3>
              <p>
                <strong>Usuario:</strong> {user.username}
                <br />
                <strong>Email:</strong> {user.email || 'No especificado'}
              </p>
              {/* (Aquí pondremos botones de Editar/Eliminar más adelante) */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}