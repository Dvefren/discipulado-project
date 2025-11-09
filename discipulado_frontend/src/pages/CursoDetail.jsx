// En src/pages/CursoDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api';

// --- (Estilos) ---
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '20px' };
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const errorStyle = { color: 'red', fontSize: '0.9em' };
const cardStyle = { 
  background: '#fff', 
  border: '1px solid #ddd', 
  padding: '15px', 
  marginBottom: '10px', 
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'all 0.3s ease',
};
const inactiveCardStyle = {
  ...cardStyle,
  background: '#f8f9fa',
  opacity: 0.7,
};
const actionButtonStyle = {
  marginLeft: '10px',
  padding: '5px 10px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};
const editButtonStyle = { ...actionButtonStyle, background: '#ffc107', color: 'black' };
const deleteButtonStyle = { ...actionButtonStyle, background: '#dc3545', color: 'white' };
const activateButtonStyle = { ...actionButtonStyle, background: '#28a745', color: 'white' };
// ---

const initialFormState = {
  dia: 'MIE',
  hora: '19:00',
  curso: null,
  activo: true, // El formulario ahora debe saber sobre 'activo'
};

export default function CursoDetail() {
  const { cursoId } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para el formulario ---
  const [formMode, setFormMode] = useState('hidden'); // 'hidden', 'create', 'edit'
  const [editingHorario, setEditingHorario] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  // --- Cargar datos ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // El backend ahora devuelve TODOS los horarios (activos e inactivos)
      const [cursoRes, horariosRes] = await Promise.all([
        apiClient.get(`/cursos/${cursoId}/`),
        apiClient.get(`/horarios/?curso=${cursoId}`)
      ]);
      
      setCurso(cursoRes.data);
      setHorarios(horariosRes.data);
      
      setFormData(prev => ({ ...initialFormState, curso: cursoId }));
    } catch (err) {
      console.error("Error al cargar datos del curso:", err);
      setError("No se pudo cargar la información del curso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  // --- Manejadores del formulario ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const method = (formMode === 'edit') ? 'patch' : 'post';
    const url = (formMode === 'edit') ? `/horarios/${editingHorario.id}/` : '/horarios/';

    try {
      await apiClient[method](url, formData);
      handleCancel();
      fetchData(); // Recargamos todo
    } catch (err) {
      console.error("Error al guardar horario:", err);
      setFormError("Error al guardar el horario.");
    }
  };

  // --- (Manejadores de botones) ---
  const handleShowCreateForm = () => {
    setFormMode('create');
    setEditingHorario(null);
    setFormData({ ...initialFormState, curso: cursoId }); // Limpia el formulario
  };

  const handleShowEditForm = (horario) => {
    setFormMode('edit');
    setEditingHorario(horario);
    setFormData(horario); // Llena el formulario con los datos del horario
  };

  const handleCancel = () => {
    setFormMode('hidden');
    setEditingHorario(null);
    setFormData({ ...initialFormState, curso: cursoId });
    setFormError(null);
  };

  const handleDeactivate = async (horarioId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR este horario? (Esto desactivará también sus mesas y alumnos)")) {
      try {
        await apiClient.patch(`/horarios/${horarioId}/`, { activo: false });
        fetchData(); // Recargamos para ver el cambio de estado
      } catch (err) {
        console.error("Error al desactivar horario:", err);
        alert("Error al desactivar el horario.");
      }
    }
  };

  const handleActivate = async (horarioId) => {
    if (window.confirm("¿Estás seguro de que quieres REACTIVAR este horario?")) {
      try {
        await apiClient.patch(`/horarios/${horarioId}/`, { activo: true });
        fetchData(); // Recargamos para ver el cambio de estado
      } catch (err) {
        console.error("Error al activar horario:", err);
        alert("Error al activar el horario.");
      }
    }
  };

  // --- Renderizado ---
  if (loading) return <p>Cargando curso...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!curso) return <p>Curso no encontrado.</p>;

  return (
    <div>
      <Link to="/cursos">&larr; Volver a todos los cursos</Link>
      
      <h1>Gestión de: {curso.nombre}</h1>
      <p>Aquí puedes administrar los horarios para este curso.</p>

      {/* --- Formulario de Creación/Edición --- */}
      {formMode === 'hidden' && (
        <button onClick={handleShowCreateForm} style={{...buttonStyle, background: '#28a745', marginBottom: '20px'}}>
          Añadir Nuevo Horario
        </button>
      )}

      {formMode !== 'hidden' && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>{formMode === 'create' ? 'Nuevo Horario' : 'Editando Horario'}</h3>
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
            {/* Solo mostramos el checkbox 'activo' al editar */}
            {formMode === 'edit' && (
              <div>
                <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleInputChange} />
                <label htmlFor="activo" style={{ marginLeft: '5px' }}>¿Activo?</label>
              </div>
            )}
          </div>
          {formError && <p style={errorStyle}>{formError}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleCancel} style={{...buttonStyle, background: '#6c757d'}}>Cancelar</button>
            <button type="submit" style={buttonStyle}>
              {formMode === 'create' ? 'Crear Horario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      <hr />

      {/* --- Lista de Horarios Existentes --- */}
      <h2>Horarios de este Curso</h2>
      {horarios.length === 0 ? (
        <p>No hay horarios registrados para este curso.</p>
      ) : (
        <div>
          {horarios.map(horario => (
            <div key={horario.id} style={horario.activo ? cardStyle : inactiveCardStyle}>
              {/* Información del Horario (ahora es un Link) */}
              <Link to={`/horarios/${horario.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Día: {horario.dia === 'MIE' ? 'Miércoles' : 'Domingo'}</strong>
                <p>Hora: {horario.hora}</p>
                {!horario.activo && <strong style={{ color: 'red' }}>(INACTIVO)</strong>}
              </Link>
              
              {/* Botones de Acción */}
              <div>
                {horario.activo ? (
                  <>
                    <button onClick={() => handleShowEditForm(horario)} style={editButtonStyle}>
                      Editar
                    </button>
                    <button onClick={() => handleDeactivate(horario.id)} style={deleteButtonStyle}>
                      Desactivar
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleActivate(horario.id)} style={activateButtonStyle}>
                    Activar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}