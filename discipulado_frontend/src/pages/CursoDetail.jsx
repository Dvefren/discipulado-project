// En src/pages/CursoDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import apiClient from '../services/api';

// --- Importaciones de MUI ---
import {
  Box,
  Button, // Ya lo estábamos importando
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
  Link, // Lo dejamos por si acaso, aunque el botón lo reemplaza
  Chip,
} from '@mui/material';

// --- Importaciones de Iconos ---
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // <-- NUEVO ÍCONO
// ---

// --- (Estilo de Modal - queda igual) ---
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
  dia: 'MIE',
  hora: '19:00',
  curso: null,
  activo: true,
};

export default function CursoDetail() {
  const { cursoId } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formMode, setFormMode] = useState('hidden');
  const [editingHorario, setEditingHorario] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  // --- (TODA LA LÓGICA DE 'fetchData', 'handleSubmit', 'handle...Click'
  // ... QUEDA EXACTAMENTE IGUAL QUE ANTES) ---

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
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
      fetchData();
    } catch (err) {
      console.error("Error al guardar horario:", err);
      setFormError("Error al guardar el horario.");
    }
  };

  const handleShowCreateForm = () => {
    setFormMode('create');
    setEditingHorario(null);
    setFormData({ ...initialFormState, curso: cursoId });
  };

  const handleShowEditForm = (horario) => {
    setFormMode('edit');
    setEditingHorario(horario);
    setFormData(horario);
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
        fetchData();
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
        fetchData();
      } catch (err) {
        console.error("Error al activar horario:", err);
        alert("Error al activar el horario.");
      }
    }
  };
  
  // --- RENDERIZADO ---
  if (loading) return <Typography>Cargando curso...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!curso) return <Typography>Curso no encontrado.</Typography>;

  return (
    <Box>
      {/* --- CAMBIO AQUÍ: Botón de Volver --- */}
      <Button
        component={RouterLink}
        to="/cursos"
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }} // mb: 2 es "margin-bottom: 2"
      >
        Volver a Cursos
      </Button>
      {/* --- FIN DEL CAMBIO --- */}
      
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de: {curso.nombre}
      </Typography>
      {/* (Aquí es donde estaba el <Typography> vacío que quitaste) */}

      {/* ... (Todo el resto del código: formulario en Modal, lista de Horarios, etc. 
           queda exactamente igual que en la versión anterior) ... */}
      
      {formMode === 'hidden' && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleShowCreateForm}
          sx={{ mb: 3 }}
        >
          Añadir Nuevo Horario
        </Button>
      )}

      <Modal open={formMode !== 'hidden'} onClose={handleCancel}>
        <Box sx={modalStyle}>
          <Typography variant="h5" component="h2">
            {formMode === 'create' ? 'Nuevo Horario' : 'Editando Horario'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="dia-select-label">Día</InputLabel>
                <Select
                  labelId="dia-select-label"
                  id="dia"
                  name="dia"
                  label="Día"
                  value={formData.dia}
                  onChange={handleInputChange}
                >
                  <MenuItem value="MIE">Miércoles</MenuItem>
                  <MenuItem value="DOM">Domingo</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="hora"
                label="Hora"
                type="time"
                value={formData.hora}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              {formMode === 'edit' && (
                <FormControlLabel
                  control={<Checkbox name="activo" checked={formData.activo} onChange={handleInputChange} />}
                  label="¿Activo?"
                />
              )}
            </Stack>
            {formError && <Typography color="error" sx={{ mt: 2 }}>{formError}</Typography>}
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
              <Button variant="contained" type="submit">
                {formMode === 'create' ? 'Crear Horario' : 'Guardar Cambios'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Modal>

      <hr style={{ margin: '20px 0' }} />

      <Typography variant="h5" component="h2" gutterBottom>
        Horarios de este Curso
      </Typography>
      
      {horarios.length === 0 ? (
        <Typography>No hay horarios registrados para este curso.</Typography>
      ) : (
        <Stack spacing={2}>
          {horarios.map(horario => (
            <Card key={horario.id} variant="outlined" sx={{ opacity: horario.activo ? 1 : 0.6 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <RouterLink to={`/horarios/${horario.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography variant="h6">
                      {horario.dia === 'MIE' ? 'Miércoles' : 'Domingo'} - {horario.hora}
                    </Typography>
                  </RouterLink>
                  {horario.activo ? 
                    <Chip label="Activo" color="success" size="small" /> :
                    <Chip label="Inactivo" color="default" size="small" />
                  }
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                {horario.activo ? (
                  <>
                    <Button size="small" variant="outlined" color="warning" startIcon={<EditIcon />} onClick={() => handleShowEditForm(horario)}>
                      Editar
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DoNotDisturbOnIcon />} onClick={() => handleDeactivate(horario.id)}>
                      Desactivar
                    </Button>
                  </>
                ) : (
                  <Button size="small" variant="outlined" color="success" startIcon={<PowerSettingsNewIcon />} onClick={() => handleActivate(horario.id)}>
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