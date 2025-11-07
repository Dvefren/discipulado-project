// En src/pages/Cursos.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// (Estilos temporales)
const courseCardStyle = { /* ... (como antes) ... */ };
const activeBadgeStyle = { /* ... (como antes) ... */ };

// --- Nuevos estilos para el formulario ---
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
// ---

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para el formulario ---
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true, // Por defecto, un curso nuevo estará activo
  });

  // --- Cargar datos ---
  const fetchCursos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cursos/');
      setCursos(response.data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar cursos:", err);
      setError("No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  // --- Manejadores del formulario ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Manejo especial para el checkbox 'activo'
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
      setFormError("Todos los campos (nombre y fechas) son obligatorios.");
      return;
    }

    try {
      // 1. Enviar los datos al backend
      await apiClient.post('/cursos/', formData);
      
      // 2. Limpiar formulario y ocultarlo
      setIsFormVisible(false);
      setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '', activo: true });
      
      // 3. Recargar la lista de cursos
      fetchCursos(); 
      
    } catch (err) {
      console.error("Error al crear curso:", err);
      setFormError("Error al crear el curso.");
    }
  };

  // --- Renderizado ---
  if (loading && cursos.length === 0) {
    return <p>Cargando cursos...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h1>📚 Cursos</h1>
      
      <button onClick={() => setIsFormVisible(!isFormVisible)} style={toggleButtonStyle}>
        {isFormVisible ? 'Cancelar' : 'Añadir Nuevo Curso'}
      </button>

      {/* --- Formulario de Creación --- */}
      {isFormVisible && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>Nuevo Curso</h3>
          <input type="text" name="nombre" placeholder="* Nombre del curso (Ej: 2025 - Semestre 1)" value={formData.nombre} onChange={handleInputChange} style={inputStyle} />
          
          <label htmlFor="fecha_inicio">Fecha de Inicio:</label>
          <input type="date" name="fecha_inicio" id="fecha_inicio" value={formData.fecha_inicio} onChange={handleInputChange} style={inputStyle} />
          
          <label htmlFor="fecha_fin">Fecha de Fin:</label>
          <input type="date" name="fecha_fin" id="fecha_fin" value={formData.fecha_fin} onChange={handleInputChange} style={inputStyle} />
          
          <div>
            <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleInputChange} />
            <label htmlFor="activo" style={{ marginLeft: '5px' }}>¿Marcar como curso activo?</label>
          </div>
          
          {formError && <p style={errorStyle}>{formError}</p>}
          
          <button type="submit" style={buttonStyle}>Crear Curso</button>
        </form>
      )}

      <hr />

      {/* --- Lista de Cursos --- */}
      {cursos.length === 0 ? (
        <p>No hay cursos registrados.</p>
      ) : (
        <div>
          {cursos.map((curso) => (
            <div key={curso.id} style={courseCardStyle}>
              <h3>
                {curso.nombre}
                {curso.activo && <span style={activeBadgeStyle}>Activo</span>}
              </h3>
              <p>
                <strong>Duración:</strong> {curso.fecha_inicio} a {curso.fecha_fin}
              </p>
              {/* (Aquí pondremos botones de Editar/Eliminar más adelante) */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}