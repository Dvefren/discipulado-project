// En src/pages/Facilitadores.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// --- NUEVO: Importaciones de MUI ---
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Modal,
  TextField,
  Stack,
} from '@mui/material';

// --- NUEVO: Importaciones de Iconos ---
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn'; // Para Desactivar
// ---

// --- NUEVO: Estilo para el Modal ---
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};
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

  // --- (Lógica de 'fetchFacilitadores' queda igual) ---
  const fetchFacilitadores = async () => {
    try {
      setLoading(true);
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

  // --- (Lógica de 'handleInputChange' queda igual) ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // --- (Lógica de 'handleSubmit' queda igual) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (formMode === 'edit' && editingFacilitador) {
      if (!formData.first_name && !formData.last_name) {
        setFormError("Debe tener al menos nombre o apellido.");
        return;
      }
      try {
        const updatePayload = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        };
        await apiClient.patch(`/auth/usuarios/${editingFacilitador.id}/`, updatePayload);
        handleCancel();
        fetchFacilitadores();
      } catch (err) {
        console.error("Error al actualizar facilitador:", err);
        setFormError("Error al actualizar.");
      }
    } else if (formMode === 'create') {
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

  // --- (Lógica de 'handleShowCreateForm', 'handleShowEditForm', 'handleCancel' quedan igual) ---
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
      first_name: facilitador.first_name || '',
      last_name: facilitador.last_name || '',
      email: facilitador.email || '',
    });
  };

  const handleCancel = () => {
    setFormMode('hidden');
    setEditingFacilitador(null);
    setFormData(initialFormState);
    setFormError(null);
  };
  
  // --- (Lógica de 'handleDeactivate' y 'handleActivate' quedan igual) ---
  const handleDeactivate = async (facilitadorId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR este facilitador?")) {
      try {
        await apiClient.delete(`/auth/usuarios/${facilitadorId}/`);
        fetchFacilitadores();
      } catch (err) {
        console.error("Error al desactivar facilitador:", err);
        alert("Error al desactivar el facilitador.");
      }
    }
  };
  
  const handleActivate = async (facilitadorId) => {
    if (window.confirm("¿Estás seguro de que quieres REACTIVAR este facilitador?")) {
      try {
        await apiClient.patch(`/auth/usuarios/${facilitadorId}/`, { is_active: true });
        fetchFacilitadores();
      } catch (err) {
        console.error("Error al activar facilitador:", err);
        alert("Error al activar el facilitador.");
      }
    }
  };

  // --- RENDERIZADO (Aquí están los cambios) ---
  
  if (loading && facilitadores.length === 0) {
    return <Typography>Cargando facilitadores...</Typography>;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        👤 Facilitadores
      </Typography>
      
      {formMode === 'hidden' && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleShowCreateForm}
          sx={{ mb: 3 }}
        >
          Añadir Nuevo Facilitador
        </Button>
      )}

      {/* --- Formulario en un Modal --- */}
      <Modal
        open={formMode !== 'hidden'}
        onClose={handleCancel}
      >
        <Box sx={modalStyle}>
          <Typography variant="h5" component="h2">
            {formMode === 'create' ? 'Nuevo Facilitador' : `Editando a: ${editingFacilitador ? editingFacilitador.username : ''}`}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {/* El 'username' y 'password' solo se pueden poner al CREAR */}
            {formMode === 'create' ? (
              <>
                <TextField
                  name="username"
                  label="Nombre de Usuario"
                  value={formData.username}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  name="password"
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                />
              </>
            ) : (
              <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                Editando datos de: <strong>{formData.username}</strong>
                <br />
                (El nombre de usuario y la contraseña no se pueden cambiar).
              </Typography>
            )}
            
            {/* Estos campos se pueden editar y crear */}
            <TextField
              name="first_name"
              label="Nombres"
              value={formData.first_name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              name="last_name"
              label="Apellidos"
              value={formData.last_name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            
            {formError && <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>}
            
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button variant="contained" type="submit">
                {formMode === 'create' ? 'Crear Facilitador' : 'Guardar Cambios'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Modal>

      {/* --- Lista de Facilitadores con MUI Cards --- */}
      <Stack spacing={2}>
        {facilitadores.length === 0 ? (
          <Typography>No hay facilitadores registrados.</Typography>
        ) : (
          facilitadores.map((user) => (
            <Card key={user.id} variant="outlined" sx={{ opacity: user.is_active ? 1 : 0.6 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h5" component="div">
                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </Typography>
                  {user.is_active ? 
                    <Chip label="Activo" color="success" size="small" /> :
                    <Chip label="Inactivo" color="default" size="small" />
                  }
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Usuario: {user.username}
                  <br />
                  Email: {user.email || 'No especificado'}
                </Typography>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                {user.is_active ? (
                  <>
                    <Button size="small" variant="outlined" color="warning" startIcon={<EditIcon />} onClick={() => handleShowEditForm(user)}>
                      Editar
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DoNotDisturbOnIcon />} onClick={() => handleDeactivate(user.id)}>
                      Desactivar
                    </Button>
                  </>
                ) : (
                  <Button size="small" variant="outlined" color="success" startIcon={<PowerSettingsNewIcon />} onClick={() => handleActivate(user.id)}>
                    Activar
                  </Button>
                )}
              </CardActions>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  );
}