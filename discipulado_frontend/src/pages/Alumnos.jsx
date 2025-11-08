// En src/pages/Alumnos.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// --- (Estilos) ---
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
  opacity: 0.6,
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
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  telefono: '',
  colonia: '',
  calle: '',
  numero_casa: '',
  mesa: '', // ID de la mesa seleccionada
};

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formMode, setFormMode] = useState('hidden'); // 'hidden', 'create', 'edit'
  const [editingAlumno, setEditingAlumno] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // --- Cargar datos ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // El backend ahora devuelve TODOS los alumnos (activos e inactivos)
      const [alumnosRes, mesasRes] = await Promise.all([
        apiClient.get('/alumnos/'),
        apiClient.get('/mesas/') // Pedimos solo mesas activas (el backend ya filtra)
      ]);
      
      setAlumnos(alumnosRes.data);
      setMesas(mesasRes.data);
      setError(null);
      
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudieron cargar los datos de alumnos o mesas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Carga inicial
  }, []);

  // Recarga solo la lista de alumnos (después de crear/editar/borrar)
  const fetchAlumnosOnly = async () => {
    try {
      const alumnosRes = await apiClient.get('/alumnos/');
      setAlumnos(alumnosRes.data);
    } catch (err) {
      console.error("Error al recargar alumnos:", err);
    }
  };

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

    if (!formData.nombres || !formData.apellidos || !formData.fecha_nacimiento || !formData.mesa) {
      setFormError("Nombres, apellidos, fecha de nacimiento y mesa son obligatorios.");
      return;
    }

    const method = (formMode === 'edit') ? 'patch' : 'post';
    const url = (formMode === 'edit') ? `/alumnos/${editingAlumno.id}/` : '/alumnos/';
    
    // Para 'edit', solo enviamos los datos del formulario (incluyendo 'mesa' y 'activo' si lo tuviéramos)
    // El backend (PATCH) actualizará solo los campos que enviemos.
    const payload = { ...formData };
    // Aseguramos que 'mesa' sea un número si está presente
    if (payload.mesa) {
      payload.mesa = parseInt(payload.mesa);
    }

    try {
      await apiClient[method](url, payload);
      handleCancel();
      fetchAlumnosOnly(); // Recargamos solo la lista de alumnos
      
    } catch (err) {
      console.error("Error al guardar alumno:", err);
      setFormError("Error al guardar el alumno.");
    }
  };

  // --- (Manejadores de botones) ---
  const handleShowCreateForm = () => {
    setFormMode('create');
    setEditingAlumno(null);
    setFormData(initialFormState);
    
    // Pre-seleccionar la mesa si solo hay una (para Facilitadores)
    if (mesas.length === 1) {
      setFormData(prev => ({ ...prev, mesa: mesas[0].id }));
    }
  };

  const handleShowEditForm = (alumno) => {
    setFormMode('edit');
    setEditingAlumno(alumno);
    // Llenamos el formulario con los datos del alumno
    setFormData({
      nombres: alumno.nombres || '',
      apellidos: alumno.apellidos || '',
      fecha_nacimiento: alumno.fecha_nacimiento || '',
      telefono: alumno.telefono || '',
      colonia: alumno.colonia || '',
      calle: alumno.calle || '',
      numero_casa: alumno.numero_casa || '',
      mesa: alumno.mesa || '', // El ID de la mesa
    });
  };

  const handleCancel = () => {
    setFormMode('hidden');
    setEditingAlumno(null);
    setFormData(initialFormState);
    setFormError(null);
  };

  // --- (Manejadores de Activar/Desactivar) ---
  const handleDeactivate = async (alumnoId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR este alumno?")) {
      try {
        // Usamos DELETE, el backend (perform_destroy) lo intercepta
        await apiClient.delete(`/alumnos/${alumnoId}/`);
        fetchAlumnosOnly(); // Recargamos solo alumnos
      } catch (err) {
        console.error("Error al desactivar alumno:", err);
        alert("Error al desactivar el alumno.");
      }
    }
  };

  const handleActivate = async (alumnoId) => {
    if (window.confirm("¿Estás seguro de que quieres REACTIVAR este alumno?")) {
      try {
        // Usamos PATCH para actualizar solo el campo 'activo'
        await apiClient.patch(`/alumnos/${alumnoId}/`, { activo: true });
        fetchAlumnosOnly(); // Recargamos solo alumnos
      } catch (err) {
        console.error("Error al activar alumno:", err);
        alert("Error al activar el alumno.");
      }
    }
  };

  // --- Renderizado ---
  if (loading) {
    return <p>Cargando datos...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h1>🧑‍🎓 Alumnos</h1>
      
      {formMode === 'hidden' && (
        <button onClick={handleShowCreateForm} style={toggleButtonStyle}>
          Añadir Nuevo Alumno
        </button>
      )}

      {/* --- Formulario de Creación/Edición --- */}
      {formMode !== 'hidden' && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>{formMode === 'create' ? 'Nuevo Alumno' : `Editando a: ${editingAlumno.nombres}`}</h3>
          
          <label htmlFor="mesa">* Mesa Asignada:</label>
          <select id="mesa" name="mesa" value={formData.mesa} onChange={handleInputChange} style={inputStyle} required>
            <option value="">-- Selecciona una mesa --</option>
            {mesas.map(mesa => (
              <option key={mesa.id} value={mesa.id}>
                {/* Asumimos que el backend nos da el ID del facilitador.
                    Sería mejor si el backend nos diera el nombre.
                    Por ahora, usamos el ID. */}
                {mesa.nombre_mesa || `Mesa ID: ${mesa.id}`} (Fac. ID: {mesa.facilitador})
              </option>
            ))}
          </select>
          
          <label htmlFor="nombres">* Nombres:</label>
          <input id="nombres" type="text" name="nombres" placeholder="Nombres del alumno" value={formData.nombres} onChange={handleInputChange} style={inputStyle} required />
          
          <label htmlFor="apellidos">* Apellidos:</label>
          <input id="apellidos" type="text" name="apellidos" placeholder="Apellidos del alumno" value={formData.apellidos} onChange={handleInputChange} style={inputStyle} required />
          
          <label htmlFor="fecha_nacimiento">* Fecha de Nacimiento:</label>
          <input type="date" name="fecha_nacimiento" id="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} style={inputStyle} required />
          
          <label htmlFor="telefono">Teléfono:</label>
          <input id="telefono" type="tel" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleInputChange} style={inputStyle} />
          
          <label htmlFor="colonia">Colonia:</label>
          <input id="colonia" type="text" name="colonia" placeholder="Colonia" value={formData.colonia} onChange={handleInputChange} style={inputStyle} />
          
          <label htmlFor="calle">Calle:</label>
          <input id="calle" type="text" name="calle" placeholder="Calle" value={formData.calle} onChange={handleInputChange} style={inputStyle} />
          
          <label htmlFor="numero_casa">Número:</label>
          <input id="numero_casa" type="text" name="numero_casa" placeholder="Número de casa" value={formData.numero_casa} onChange={handleInputChange} style={inputStyle} />

          {formError && <p style={errorStyle}>{formError}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleCancel} style={{...buttonStyle, background: '#6c757d'}}>Cancelar</button>
            <button type="submit" style={buttonStyle}>
              {formMode === 'create' ? 'Crear Alumno' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      <hr />

      {/* --- Lista de Alumnos --- */}
      {alumnos.length === 0 ? (
        <p>No hay alumnos registrados.</p>
      ) : (
        <div>
          {alumnos.map((alumno) => (
            <div key={alumno.id} style={alumno.activo ? cardStyle : inactiveCardStyle}>
              <div>
                <strong>{alumno.nombres} {alumno.apellidos}</strong>
                {!alumno.activo && <strong style={{ color: 'red', marginLeft: '10px' }}>(INACTIVO)</strong>}
                <br />
                <small>Teléfono: {alumno.telefono || 'No especificado'}</small>
              </div>
              <div>
                {alumno.activo ? (
                  <>
                    <button onClick={() => handleShowEditForm(alumno)} style={editButtonStyle}>
                      Editar
                    </button>
                    <button onClick={() => handleDeactivate(alumno.id)} style={deleteButtonStyle}>
                      Desactivar
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleActivate(alumno.id)} style={activateButtonStyle}>
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