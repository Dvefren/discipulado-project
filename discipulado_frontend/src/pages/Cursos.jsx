// En src/pages/Cursos.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // <-- AÑADIR IMPORT
import apiClient from '../services/api';

// --- (Estilos) ---
const courseCardStyle = {
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

// Estilo para cursos inactivos/archivados
const inactiveCardStyle = {
  ...courseCardStyle,
  background: '#f8f9fa',
  opacity: 0.7,
};

const activeBadgeStyle = {
  background: 'green',
  color: 'white',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '0.8em',
  marginLeft: '10px',
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
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  activo: true,
};

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formMode, setFormMode] = useState('hidden'); // 'hidden', 'create', 'edit'
  const [editingCurso, setEditingCurso] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // Guardar la fecha de hoy (sin la hora)
  const [today, setToday] = useState('');
  useEffect(() => {
    // Obtenemos la fecha de hoy en formato 'YYYY-MM-DD'
    const todayISO = new Date().toISOString().split('T')[0];
    setToday(todayISO);
  }, []);
  // ---

  // --- Cargar datos ---
  const fetchCursos = async () => {
    try {
      setLoading(true);
      // El backend ahora devuelve TODOS los cursos
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

  // --- (handleInputChange queda igual) ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // --- handleSubmit (Crear/Actualizar) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
      setFormError("Todos los campos (nombre y fechas) son obligatorios.");
      return;
    }

    // Usamos PATCH para 'edit' (actualiza solo campos cambiados)
    // Usamos POST para 'create'
    const method = (formMode === 'edit') ? 'patch' : 'post';
    const url = (formMode === 'edit') ? `/cursos/${editingCurso.id}/` : '/cursos/';
    
    try {
      await apiClient[method](url, formData);
      handleCancel();
      fetchCursos(); // Recarga la lista
    } catch (err) {
      console.error("Error al guardar curso:", err);
      setFormError(formMode === 'create' ? "Error al crear." : "Error al actualizar.");
    }
  };

  // --- (Manejadores de formulario) ---
  const handleShowCreateForm = () => {
    setFormMode('create');
    setEditingCurso(null);
    setFormData(initialFormState);
  };
  
  const handleCancel = () => {
    setFormMode('hidden');
    setEditingCurso(null);
    setFormData(initialFormState);
    setFormError(null);
  };

  const handleShowEditForm = (curso) => {
    setFormMode('edit');
    setEditingCurso(curso);
    setFormData(curso);
  };

  // --- Lógica de Activar/Desactivar (ahora usa PATCH) ---
  const handleDeactivate = async (cursoId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR este curso? (Esto desactivará también sus mesas y alumnos)")) {
      try {
        await apiClient.patch(`/cursos/${cursoId}/`, { activo: false });
        fetchCursos(); // Recargamos para ver el cambio de estado
      } catch (err) {
        console.error("Error al desactivar curso:", err);
        alert("Error al desactivar el curso.");
      }
    }
  };

  const handleActivate = async (cursoId) => {
    if (window.confirm("¿Estás seguro de que quieres REACTIVAR este curso?")) {
      try {
        await apiClient.patch(`/cursos/${cursoId}/`, { activo: true });
        fetchCursos(); // Recargamos para ver el cambio de estado
      } catch (err) {
        console.error("Error al activar curso:", err);
        alert("Error al activar el curso.");
      }
    }
  };
  
  // --- Renderizado ---
  if (loading && cursos.length === 0) {
    return <p>Cargando cursos...</p>;
  }

  return (
    <div>
      <h1>📚 Cursos</h1>
      
      {formMode === 'hidden' && (
        <button onClick={handleShowCreateForm} style={toggleButtonStyle}>
          Añadir Nuevo Curso
        </button>
      )}

      {formMode !== 'hidden' && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>{formMode === 'create' ? 'Nuevo Curso' : `Editando: ${editingCurso.nombre}`}</h3>
          
          <input type="text" name="nombre" placeholder="* Nombre del curso" value={formData.nombre} onChange={handleInputChange} style={inputStyle} />
          <label htmlFor="fecha_inicio">Fecha de Inicio:</label>
          <input type="date" name="fecha_inicio" id="fecha_inicio" value={formData.fecha_inicio} onChange={handleInputChange} style={inputStyle} />
          <label htmlFor="fecha_fin">Fecha de Fin:</label>
          <input type="date" name="fecha_fin" id="fecha_fin" value={formData.fecha_fin} onChange={handleInputChange} style={inputStyle} />
          <div>
            <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleInputChange} />
            <label htmlFor="activo" style={{ marginLeft: '5px' }}>¿Marcar como curso activo?</label>
          </div>
          
          {formError && <p style={errorStyle}>{formError}</p>}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleCancel} style={{...buttonStyle, background: '#6c757d'}}>Cancelar</button>
            <button type="submit" style={buttonStyle}>
              {formMode === 'create' ? 'Crear Curso' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      <hr />

      {/* --- Lista de Cursos --- */}
      {cursos.length === 0 ? (
        <p>No hay cursos registrados.</p>
      ) : (
        <div>
          {cursos.map((curso) => {
            
            // Lógica de fechas
            const isFinished = curso.fecha_fin < today;
            
            return (
              <div key={curso.id} style={curso.activo ? courseCardStyle : inactiveCardStyle}>
                {/* Información del curso */}
                <div>
                  {/* --- CAMBIO AQUÍ --- */}
                  <Link to={`/cursos/${curso.id}`} style={{ textDecoration: 'none', color: 'black' }}>
                    <h3>
                      {curso.nombre}
                      {curso.activo ? 
                        <span style={activeBadgeStyle}>Activo</span> :
                        <strong style={{ color: 'red', marginLeft: '10px' }}>(INACTIVO)</strong>
                      }
                    </h3>
                  </Link>
                  {/* --- FIN DEL CAMBIO --- */}
                  <p>
                    <strong>Duración:</strong> {curso.fecha_inicio} a {curso.fecha_fin}
                    {isFinished && !curso.activo && <strong style={{ color: 'gray', marginLeft: '10px' }}>(Archivado)</strong>}
                  </p>
                </div>

                {/* Botones de Acción Condicionales */}
                <div>
                  {curso.activo ? (
                    // Si está ACTIVO, podemos Editar y Desactivar
                    <>
                      <button onClick={() => handleShowEditForm(curso)} style={editButtonStyle}>
                        Editar
                      </button>
                      <button onClick={() => handleDeactivate(curso.id)} style={deleteButtonStyle}>
                        Desactivar
                      </button>
                    </>
                  ) : (
                    // Si está INACTIVO
                    isFinished ? (
                      // Y ya terminó: solo podemos Ver
                      <button onClick={() => handleShowEditForm(curso)} style={{...editButtonStyle, background: '#6c757d'}}>
                        Ver
                      </button>
                    ) : (
                      // Y NO ha terminado: podemos Activar
                      <button onClick={() => handleActivate(curso.id)} style={activateButtonStyle}>
                        Activar
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}