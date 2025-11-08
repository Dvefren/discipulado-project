// En src/pages/CursoDetail.jsx (NUEVO ARCHIVO)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api';

// (Estilos)
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '20px' };
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const errorStyle = { color: 'red', fontSize: '0.9em' };
const cardStyle = { background: '#fff', border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' };

const initialFormState = {
  dia: 'MIE',
  hora: '19:00',
  curso: null, // El ID del curso se añadirá al enviar
};

export default function CursoDetail() {
  const { cursoId } = useParams(); // Obtiene el ID del curso desde la URL
  const navigate = useNavigate(); // Para volver atrás

  const [curso, setCurso] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  // --- Cargar datos ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Pedimos la info del curso
      const cursoRes = await apiClient.get(`/cursos/${cursoId}/`);
      
      // 2. Pedimos los horarios filtrados por este curso
      const horariosRes = await apiClient.get(`/horarios/?curso=${cursoId}`);
      
      setCurso(cursoRes.data);
      setHorarios(horariosRes.data);
      
      // Pre-llenamos el ID del curso en el formulario
      setFormData(prev => ({ ...prev, curso: cursoId }));

    } catch (err) {
      console.error("Error al cargar datos del curso:", err);
      setError("No se pudo cargar la información del curso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cursoId]); // Se recarga si el ID del curso cambia

  // --- Manejadores del formulario ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      await apiClient.post('/horarios/', formData);
      // Limpiamos y recargamos la lista
      setFormData(initialFormState);
      fetchData(); // Recargamos todo
    } catch (err) {
      console.error("Error al crear horario:", err);
      setFormError("Error al crear el horario.");
    }
  };

  // --- Renderizado ---
  if (loading) return <p>Cargando curso...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!curso) return <p>Curso no encontrado.</p>;

  return (
    <div>
      {/* Botón para volver a la lista */}
      <Link to="/cursos">&larr; Volver a todos los cursos</Link>
      
      <h1>Gestión de: {curso.nombre}</h1>
      <p>Aquí puedes administrar los horarios para este curso.</p>

      {/* --- Formulario de Creación de Horario --- */}
      <form onSubmit={handleSubmit} style={formStyle}>
        <h3>Añadir Nuevo Horario</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div>
            <label htmlFor="dia">Día:</label>
            <select id="dia" name="dia" value={formData.dia} onChange={handleInputChange} style={inputStyle}>
              <option value="MIE">Miércoles</option>
              <option value="DOM">Domingo</option>
            </select>
          </div>
          <div>
            <label htmlFor="hora">Hora (HH:MM):</label>
            <input type="time" id="hora" name="hora" value={formData.hora} onChange={handleInputChange} style={inputStyle} />
          </div>
          <button type="submit" style={buttonStyle}>Crear Horario</button>
        </div>
        {formError && <p style={errorStyle}>{formError}</p>}
      </form>

      <hr />

      {/* --- Lista de Horarios Existentes --- */}
      <h2>Horarios de este Curso</h2>
      {horarios.length === 0 ? (
        <p>No hay horarios registrados para este curso.</p>
      ) : (
          <div>
          {horarios.map(horario => (
            // --- CAMBIO AQUÍ: Envolvemos la tarjeta con un Link ---
            <Link 
              to={`/horarios/${horario.id}`} 
              key={horario.id} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={cardStyle}>
                <strong>Día: {horario.dia === 'MIE' ? 'Miércoles' : 'Domingo'}</strong>
                <p>Hora: {horario.hora}</p>
              </div>
            </Link>
            // --- FIN DEL CAMBIO ---
          ))}
          </div>
      )}
    </div>
  );
}