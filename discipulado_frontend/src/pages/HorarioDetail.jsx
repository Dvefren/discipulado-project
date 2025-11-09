// En src/pages/HorarioDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext'; // <-- Importar useAuth

// (Estilos)
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
  nombre_mesa: '',
  facilitador_id: '', // ID del facilitador
  horario: null,
  activo: true,
};

export default function HorarioDetail() {
  const { horarioId } = useParams();
  const { user } = useAuth(); // <-- Obtener el usuario
  
  const [horario, setHorario] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [facilitadores, setFacilitadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para el formulario ---
  const [formMode, setFormMode] = useState('hidden'); // 'hidden', 'create', 'edit'
  const [editingMesa, setEditingMesa] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  // --- Cargar datos ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // (El backend ahora devuelve TODAS las mesas si eres Admin)
      const [horarioRes, mesasRes, facilitadoresRes] = await Promise.all([
        apiClient.get(`/horarios/${horarioId}/`),
        apiClient.get(`/mesas/?horario=${horarioId}`),
        apiClient.get('/auth/usuarios/') // Facilitadores activos
      ]);
      
      setHorario(horarioRes.data);
      setMesas(mesasRes.data);
      setFacilitadores(facilitadoresRes.data);
      
      setFormData(prev => ({ ...initialFormState, horario: horarioId }));
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) { // Asegurarse de que el usuario esté cargado
      fetchData();
    }
  }, [horarioId, user]);

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

    // Quitamos 'facilitador' del estado y usamos 'facilitador_id'
    const { facilitador, ...payload } = formData;
    payload.facilitador_id = formData.facilitador_id; // Asegurarse de que el ID esté

    if (!payload.facilitador_id) {
      setFormError("Debes seleccionar un facilitador.");
      return;
    }

    const method = (formMode === 'edit') ? 'patch' : 'post';
    const url = (formMode === 'edit') ? `/mesas/${editingMesa.id}/` : '/mesas/';

    try {
      await apiClient[method](url, payload);
      handleCancel();
      fetchData(); // Recargamos todo
    } catch (err) {
      console.error("Error al guardar mesa:", err);
      setFormError("Error al guardar la mesa.");
    }
  };
  
  // --- (Manejadores de botones) ---
  const handleShowCreateForm = () => {
    setFormMode('create');
    setEditingMesa(null);
    setFormData({ ...initialFormState, horario: horarioId });
  };

  const handleShowEditForm = (mesa) => {
    setFormMode('edit');
    setEditingMesa(mesa);
    setFormData({
      nombre_mesa: mesa.nombre_mesa || '',
      facilitador_id: mesa.facilitador.id, // <-- Usar el ID del objeto facilitador
      horario: mesa.horario,
      activo: mesa.activo,
    });
  };

  const handleCancel = () => {
    setFormMode('hidden');
    setEditingMesa(null);
    setFormData({ ...initialFormState, horario: horarioId });
    setFormError(null);
  };

  const handleDeactivate = async (mesaId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR esta mesa? (Esto desactivará a sus alumnos)")) {
      try {
        await apiClient.delete(`/mesas/${mesaId}/`); // El backend intercepta DELETE
        fetchData();
      } catch (err) {
        console.error("Error al desactivar mesa:", err);
        alert("Error al desactivar la mesa.");
      }
    }
  };

  const handleActivate = async (mesaId) => {
    if (window.confirm("¿Estás seguro de que quieres REACTIVAR esta mesa?")) {
      try {
        await apiClient.patch(`/mesas/${mesaId}/`, { activo: true });
        fetchData();
      } catch (err) {
        console.error("Error al activar mesa:", err);
        alert("Error al activar la mesa.");
      }
    }
  };

  // --- Renderizado ---
  if (loading) return <p>Cargando horario...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!horario) return <p>Horario no encontrado.</p>;

  return (
    <div>
      <Link to={`/cursos/${horario.curso}`}>&larr; Volver al curso</Link>
      
      <h1>Gestión de Mesas</h1>
      <h2>Horario: {horario.dia === 'MIE' ? 'Miércoles' : 'Domingo'} a las {horario.hora}</h2>

      {/* --- Formulario de Creación/Edición --- */}
      {formMode === 'hidden' && (
        <button onClick={handleShowCreateForm} style={{...buttonStyle, background: '#28a745', marginBottom: '20px'}}>
          Añadir Nueva Mesa
        </button>
      )}

      {formMode !== 'hidden' && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>{formMode === 'create' ? 'Nueva Mesa' : 'Editando Mesa'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label htmlFor="facilitador_id">* Facilitador:</label>
              <select id="facilitador_id" name="facilitador_id" value={formData.facilitador_id} onChange={handleInputChange} style={inputStyle} required>
                <option value="">-- Selecciona un facilitador --</option>
                {facilitadores.map(facil => (
                  <option key={facil.id} value={facil.id}>
                    {facil.first_name} {facil.last_name} ({facil.username})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nombre_mesa">Nombre de la Mesa (Opcional):</label>
              <input type="text" id="nombre_mesa" name="nombre_mesa" value={formData.nombre_mesa} onChange={handleInputChange} style={inputStyle} />
            </div>
            {formMode === 'edit' && (
              <div>
                <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleInputChange} />
                <label htmlFor="activo" style={{ marginLeft: '5px' }}>¿Activa?</label>
              </div>
            )}
          </div>
          {formError && <p style={errorStyle}>{formError}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={handleCancel} style={{...buttonStyle, background: '#6c757d'}}>Cancelar</button>
            <button type="submit" style={buttonStyle}>
              {formMode === 'create' ? 'Crear Mesa' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      <hr />

      {/* --- Lista de Mesas Existentes --- */}
      <h2>Mesas en este Horario</h2>
      {mesas.length === 0 ? (
        <p>No hay mesas registradas para este horario.</p>
      ) : (
        <div>
          {mesas.map(mesa => (
            <div key={mesa.id} style={mesa.activo ? cardStyle : inactiveCardStyle}>
              <div>
                <strong>{mesa.nombre_mesa || `Mesa ID: ${mesa.id}`}</strong>
                {mesa.facilitador ? (
                  <p>Facilitador: {mesa.facilitador.first_name} {mesa.facilitador.last_name}</p>
                ) : (
                  <p>Facilitador no asignado</p>
                )}
                {!mesa.activo && <strong style={{ color: 'red' }}>(INACTIVA)</strong>}
              </div>
              <div>
                {mesa.activo ? (
                  <>
                    <button onClick={() => handleShowEditForm(mesa)} style={editButtonStyle}>
                      Editar
                    </button>
                    <button onClick={() => handleDeactivate(mesa.id)} style={deleteButtonStyle}>
                      Desactivar
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleActivate(mesa.id)} style={activateButtonStyle}>
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