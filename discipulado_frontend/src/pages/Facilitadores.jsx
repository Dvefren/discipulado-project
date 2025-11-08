// En src/pages/Facilitadores.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// (Estilos)
const cardStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  padding: '15px',
  marginBottom: '10px',
  borderRadius: '8px',
  display: 'flex', // Para alinear botones
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'all 0.3s ease', // <-- NUEVO
};

// --- NUEVO: Estilo para facilitadores inactivos ---
const inactiveCardStyle = {
  ...cardStyle,
  background: '#f8f9fa', // Color más oscuro/gris
  opacity: 0.6,
};
// ---

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

// --- NUEVO: Estilo para el botón de Activar ---
const activateButtonStyle = { ...actionButtonStyle, background: '#28a745', color: 'white' };
// ---

const initialFormState = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
};

export default function Facilitadores() {
  const [facilitadores, setFacilitadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formMode, setFormMode] = useState('hidden'); // 'hidden', 'create', 'edit'
  const [editingFacilitador, setEditingFacilitador] = useState(null);
  
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // --- Cargar datos ---
  const fetchFacilitadores = async () => {
    try {
      setLoading(true);
      // El backend ahora devuelve TODOS (activos e inactivos)
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

    // Si estamos en modo 'edit'
    if (formMode === 'edit' && editingFacilitador) {
      if (!formData.first_name && !formData.last_name) {
        setFormError("Debe tener al menos nombre o apellido.");
        return;
      }
      try {
        // Creamos un payload solo con los campos permitidos por UserUpdateSerializer
        const updatePayload = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        };
        // Usamos PATCH para actualizar solo los campos enviados
        await apiClient.patch(`/auth/usuarios/${editingFacilitador.id}/`, updatePayload);
        handleCancel();
        fetchFacilitadores();
      } catch (err) {
        console.error("Error al actualizar facilitador:", err);
        setFormError("Error al actualizar.");
      }
    } 
    // Si estamos en modo 'create'
    else if (formMode === 'create') {
      if (!formData.username || !formData.password) {
        setFormError("El usuario y la contraseña son obligatorios.");
        return;
      }
      try {
        await apiClient.post('/auth/usuarios/', formData);
        handleCancel();
        fetchFacilitadores(); 
      } catch (err) {
        console.error("Error al crear facilitador:", err);
        setFormError("Error al crear. Revisa que el 'username' no esté repetido.");
      }
    }
  };

  // --- Manejadores para los botones ---
  const handleShowCreateForm = () => {
    setFormMode('create');
    setEditingFacilitador(null);
    setFormData(initialFormState);
  };

  const handleShowEditForm = (facilitador) => {
    setFormMode('edit');
    setEditingFacilitador(facilitador);
    setFormData({
      username: facilitador.username,
      password: '',
      first_name: facilitador.first_name || '', // Asegurar que no sea null
      last_name: facilitador.last_name || '', // Asegurar que no sea null
      email: facilitador.email || '',       // Asegurar que no sea null
    });
  };

  const handleCancel = () => {
    setFormMode('hidden');
    setEditingFacilitador(null);
    setFormData(initialFormState);
    setFormError(null);
  };

  // --- CAMBIO: handle "Deactivate" (antes "Delete") ---
  const handleDeactivate = async (facilitadorId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR este facilitador?")) {
      try {
        // Seguimos llamando a DELETE, el backend se encarga
        await apiClient.delete(`/auth/usuarios/${facilitadorId}/`);
        // Recargamos la lista para ver el cambio de estado
        fetchFacilitadores();
      } catch (err) {
        console.error("Error al desactivar facilitador:", err);
        alert("Error al desactivar el facilitador.");
      }
    }
  };
  
  // --- NUEVO: Función para Reactivar ---
  const handleActivate = async (facilitadorId) => {
    if (window.confirm("¿Estás seguro de que quieres REACTIVAR este facilitador?")) {
      try {
        // Usamos PATCH para actualizar solo el campo 'is_active'
        await apiClient.patch(`/auth/usuarios/${facilitadorId}/`, { is_active: true });
        // Recargamos la lista para ver el cambio de estado
        fetchFacilitadores();
      } catch (err) {
        console.error("Error al activar facilitador:", err);
        alert("Error al activar el facilitador.");
      }
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
      
      {formMode === 'hidden' && (
        <button onClick={handleShowCreateForm} style={toggleButtonStyle}>
          Añadir Nuevo Facilitador
        </button>
      )}

      {/* --- Formulario de Creación/Edición --- */}
      {formMode !== 'hidden' && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>{formMode === 'create' ? 'Nuevo Facilitador' : `Editando a: ${editingFacilitador.username}`}</h3>
          
          {formMode === 'create' ? (
            <>
              <input type="text" name="username" placeholder="* Nombre de Usuario" value={formData.username} onChange={handleInputChange} style={inputStyle} />
              <input type="password" name="password" placeholder="* Contraseña" value={formData.password} onChange={handleInputChange} style={inputStyle} />
            </>
          ) : (
            <p>Editando datos de: <strong>{formData.username}</strong> (El nombre de usuario y la contraseña no se pueden cambiar aquí).</p>
          )}
          
          <input type="text" name="first_name" placeholder="Nombres" value={formData.first_name} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="last_name" placeholder="Apellidos" value={formData.last_name} onChange={handleInputChange} style={inputStyle} />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} style={inputStyle} />
          
          {formError && <p style={errorStyle}>{formError}</p>}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleCancel} style={{...buttonStyle, background: '#6c757d'}}>Cancelar</button>
            <button type="submit" style={buttonStyle}>
              {formMode === 'create' ? 'Crear Facilitador' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      <hr />

      {/* --- Lista de Facilitadores --- */}
      {facilitadores.length === 0 ? (
        <p>No hay facilitadores registrados.</p>
      ) : (
        <div>
          {facilitadores.map((user) => (
            <div key={user.id} style={user.is_active ? cardStyle : inactiveCardStyle}>
              <div>
                <h3>{user.first_name} {user.last_name}</h3>
                <p>
                  <strong>Usuario:</strong> {user.username}
                  {!user.is_active && <strong style={{ color: 'red', marginLeft: '10px' }}>(INACTIVO)</strong>}
                </p>
              </div>
              <div>
                {user.is_active ? (
                  <>
                    <button onClick={() => handleShowEditForm(user)} style={editButtonStyle}>
                      Editar
                    </button>
                    <button onClick={() => handleDeactivate(user.id)} style={deleteButtonStyle}>
                      Desactivar
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleActivate(user.id)} style={activateButtonStyle}>
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