// En src/pages/HorarioDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom'; // Importamos RouterLink
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- NUEVO: Importaciones de MUI ---
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Modal,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Link, // Para el "volver"
  Chip,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

// --- NUEVO: Importaciones de Iconos ---
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  nombre_mesa: '',
  facilitador_id: '', // ID del facilitador
  horario: null,
  activo: true,
};

export default function HorarioDetail() {
  const { horarioId } = useParams();
  const { user } = useAuth();
  
  const [horario, setHorario] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [facilitadores, setFacilitadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formMode, setFormMode] = useState('hidden');
  const [editingMesa, setEditingMesa] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  // --- (Lógica de fetchData - queda igual) ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [horarioRes, mesasRes, facilitadoresRes] = await Promise.all([
        apiClient.get(`/horarios/${horarioId}/`),
        apiClient.get(`/mesas/?horario=${horarioId}`),
        apiClient.get('/auth/usuarios/')
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
    if (user) {
      fetchData();
    }
  }, [horarioId, user]);

  // --- (Lógica de handleInputChange - queda igual) ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // --- (Lógica de handleSubmit - queda igual) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      nombre_mesa: formData.nombre_mesa,
      horario: formData.horario,
      facilitador_id: formData.facilitador_id,
      activo: formData.activo,
    };

    if (!payload.facilitador_id) {
      setFormError("Debes seleccionar un facilitador.");
      return;
    }

    const method = (formMode === 'edit') ? 'patch' : 'post';
    const url = (formMode === 'edit') ? `/mesas/${editingMesa.id}/` : '/mesas/';

    try {
      await apiClient[method](url, payload);
      handleCancel();
      fetchData();
    } catch (err) {
      console.error("Error al guardar mesa:", err);
      setFormError("Error al guardar la mesa.");
    }
  };
  
  // --- (Lógica de 'handleShow...', 'handleCancel', 'handleDeactivate', 'handleActivate' - quedan igual) ---
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
      facilitador_id: mesa.facilitador.id,
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
        await apiClient.delete(`/mesas/${mesaId}/`);
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

  // --- RENDERIZADO (Aquí están los cambios) ---
  if (loading) return <Typography>Cargando horario...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!horario) return <Typography>Horario no encontrado.</Typography>;

  return (
    <Box>
      <Button
        component={RouterLink}
        to={`/cursos/${horario.curso}`} // Vuelve al curso padre
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Volver al Curso
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Mesas
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Horario: {horario.dia === 'MIE' ? 'Miércoles' : 'Domingo'} a las {horario.hora}
      </Typography>

      {formMode === 'hidden' && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleShowCreateForm}
          sx={{ mb: 3 }}
        >
          Añadir Nueva Mesa
        </Button>
      )}

      {/* --- Formulario en Modal --- */}
      <Modal
        open={formMode !== 'hidden'}
        onClose={handleCancel}
      >
        <Box sx={modalStyle}>
          <Typography variant="h5" component="h2">
            {formMode === 'create' ? 'Nueva Mesa' : `Editando Mesa`}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <FormControl fullWidth required>
                <InputLabel id="facilitador-select-label">Facilitador</InputLabel>
                <Select
                  labelId="facilitador-select-label"
                  id="facilitador_id"
                  name="facilitador_id"
                  label="Facilitador"
                  value={formData.facilitador_id}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">-- Selecciona un facilitador --</MenuItem>
                  {facilitadores.map(facil => (
                    <MenuItem key={facil.id} value={facil.id}>
                      {facil.first_name} {facil.last_name} ({facil.username})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                name="nombre_mesa"
                label="Nombre de la Mesa (Opcional)"
                value={formData.nombre_mesa}
                onChange={handleInputChange}
                fullWidth
              />
              
              {formMode === 'edit' && (
                <FormControlLabel
                  control={
                    <Checkbox 
                      name="activo" 
                      checked={formData.activo} 
                      onChange={handleInputChange} 
                    />
                  }
                  label="¿Activa?"
                />
              )}
            </Stack>
            
            {formError && <Typography color="error" sx={{ mt: 2 }}>{formError}</Typography>}
            
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
              <Button variant="contained" type="submit">
                {formMode === 'create' ? 'Crear Mesa' : 'Guardar Cambios'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Modal>

      <hr style={{ margin: '20px 0' }} />

      {/* --- Lista de Mesas Existentes con MUI Cards --- */}
      <Typography variant="h5" component="h2" gutterBottom>
        Mesas en este Horario
      </Typography>
      
      {mesas.length === 0 ? (
        <Typography>No hay mesas registradas para este horario.</Typography>
      ) : (
        <Stack spacing={2}>
          {mesas.map(mesa => (
            <Card key={mesa.id} variant="outlined" sx={{ opacity: mesa.activo ? 1 : 0.6 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    {mesa.nombre_mesa || `Mesa ID: ${mesa.id}`}
                  </Typography>
                  {mesa.activo ? 
                    <Chip label="Activa" color="success" size="small" /> :
                    <Chip label="Inactiva" color="default" size="small" />
                  }
                </Box>
                {mesa.facilitador ? (
                  <Typography variant="body2" color="text.secondary">
                    Facilitador: {mesa.facilitador.first_name} {mesa.facilitador.last_name}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="error">
                    Facilitador no asignado
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                {mesa.activo ? (
                  <>
                    <Button size="small" variant="outlined" color="warning" startIcon={<EditIcon />} onClick={() => handleShowEditForm(mesa)}>
                      Editar
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DoNotDisturbOnIcon />} onClick={() => handleDeactivate(mesa.id)}>
                      Desactivar
                    </Button>
                  </>
                ) : (
                  <Button size="small" variant="outlined" color="success" startIcon={<PowerSettingsNewIcon />} onClick={() => handleActivate(mesa.id)}>
                    Activar
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}