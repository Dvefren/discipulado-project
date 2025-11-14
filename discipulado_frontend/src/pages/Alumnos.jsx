// En src/pages/Alumnos.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../services/api';

// --- Importaciones de MUI ---
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Grid,
} from '@mui/material';

// --- Importaciones de Iconos ---
import AddIcon from '@mui/icons-material/Add';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import SearchIcon from '@mui/icons-material/Search'; // Icono de búsqueda
// ---

// --- Estilo para el Modal ---
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};
// ---

const initialFormState = {
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  telefono: '',
  colonia: '',
  calle: '',
  numero_casa: '',
  mesa: '',
};

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]); // La lista "maestra"
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formMode, setFormMode] = useState('hidden');
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // --- Estado para el buscador ---
  const [searchTerm, setSearchTerm] = useState('');
  // ---

  // --- Cargar datos ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [alumnosRes, mesasRes] = await Promise.all([
        apiClient.get('/alumnos/'),
        apiClient.get('/mesas/') 
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

  // Recarga solo la lista de alumnos
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
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (formMode === 'create') {
      if (!formData.nombres || !formData.apellidos || !formData.fecha_nacimiento || !formData.mesa) {
        setFormError("Nombres, apellidos, fecha de nacimiento y mesa son obligatorios.");
        return;
      }
      
      const payload = { ...formData };
      if (payload.mesa) {
        payload.mesa = parseInt(payload.mesa);
      }
      
      try {
        await apiClient.post('/alumnos/', payload);
        handleCancel();
        fetchAlumnosOnly();
      } catch (err) {
        console.error("Error al crear alumno:", err);
        setFormError("Error al crear el alumno.");
      }
    }
  };
  
  // --- (Manejadores de botones) ---
  const handleShowCreateForm = () => {
    setFormMode('create');
    setFormData(initialFormState);
    if (mesas.length === 1) {
      setFormData(prev => ({ ...prev, mesa: mesas[0].id }));
    }
  };

  const handleCancel = () => {
    setFormMode('hidden');
    setFormData(initialFormState);
    setFormError(null);
  };

  // --- (Manejadores de Activar/Desactivar) ---
  const handleDeactivate = async (alumnoId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR este alumno?")) {
      try {
        await apiClient.delete(`/alumnos/${alumnoId}/`);
        fetchAlumnosOnly();
      } catch (err) {
        console.error("Error al desactivar alumno:", err);
        alert("Error al desactivar el alumno.");
      }
    }
  };

  const handleActivate = async (alumnoId) => {
    if (window.confirm("¿Estás seguro de que quieres REACTIVAR este alumno?")) {
      try {
        await apiClient.patch(`/alumnos/${alumnoId}/`, { activo: true });
        fetchAlumnosOnly();
      } catch (err) {
        console.error("Error al activar alumno:", err);
        alert("Error al activar el alumno.");
      }
    }
  };

  // --- Lógica de filtrado ---
  const filteredAlumnos = useMemo(() => {
    if (!searchTerm) {
      return alumnos; // Si no hay búsqueda, devuelve la lista completa
    }
    return alumnos.filter(alumno => 
      alumno.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumno.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [alumnos, searchTerm]);
  // ---

  // --- Renderizado ---
  if (loading) {
    return <Typography>Cargando datos...</Typography>;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        🧑‍🎓 Alumnos
      </Typography>
      
      {formMode === 'hidden' && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleShowCreateForm}
          sx={{ mb: 3 }}
        >
          Añadir Nuevo Alumno
        </Button>
      )}

      {/* --- Formulario de Creación en Modal --- */}
      <Modal
        open={formMode === 'create'}
        onClose={handleCancel}
      >
        <Box sx={modalStyle}>
          <Typography variant="h5" component="h2">
            Nuevo Alumno
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
            <Grid container spacing={2}>
              {/* Columna Izquierda */}
              <Grid item xs={12} sm={6}>
                <TextField name="nombres" label="Nombres" value={formData.nombres} onChange={handleInputChange} fullWidth margin="normal" required />
                <TextField name="apellidos" label="Apellidos" value={formData.apellidos} onChange={handleInputChange} fullWidth margin="normal" required />
                <TextField name="fecha_nacimiento" label="Fecha de Nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleInputChange} fullWidth margin="normal" required InputLabelProps={{ shrink: true }} />
                <TextField name="telefono" label="Teléfono" type="tel" value={formData.telefono} onChange={handleInputChange} fullWidth margin="normal" />
              </Grid>
              
              {/* Columna Derecha */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel id="mesa-select-label">* Mesa Asignada</InputLabel>
                  <Select
                    labelId="mesa-select-label"
                    id="mesa"
                    name="mesa"
                    label="* Mesa Asignada"
                    value={formData.mesa}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">-- Selecciona una mesa --</MenuItem>
                    {mesas.map(mesa => (
                      <MenuItem key={mesa.id} value={mesa.id}>
                        {mesa.nombre_mesa || `Mesa ID: ${mesa.id}`} (Fac: {mesa.facilitador ? mesa.facilitador.first_name : 'N/A'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField name="colonia" label="Colonia" value={formData.colonia} onChange={handleInputChange} fullWidth margin="normal" />
                <TextField name="calle" label="Calle" value={formData.calle} onChange={handleInputChange} fullWidth margin="normal" />
                <TextField name="numero_casa" label="Número" value={formData.numero_casa} onChange={handleInputChange} fullWidth margin="normal" />
              </Grid>
            </Grid>

            {formError && <Typography color="error" sx={{ mt: 2 }}>{formError}</Typography>}
            
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
              <Button variant="contained" type="submit">Crear Alumno</Button>
            </Stack>
          </Box>
        </Box>
      </Modal>

      {/* --- Barra de Búsqueda --- */}
      <TextField
        label="Buscar Alumno (por nombre o apellido)"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
          ),
        }}
      />
      {/* --- Fin de la Barra de Búsqueda --- */}

      {/* --- Lista de Alumnos con MUI Cards --- */}
      <Stack spacing={2}>
        {filteredAlumnos.length === 0 ? (
          <Typography>
            {searchTerm 
              ? 'No se encontraron alumnos con ese nombre.' 
              : 'No hay alumnos registrados.'
            }
          </Typography>
        ) : (
          filteredAlumnos.map((alumno) => (
            <Card key={alumno.id} variant="outlined" sx={{ opacity: alumno.activo ? 1 : 0.6 }}>
              <RouterLink 
                to={`/alumnos/${alumno.id}`} 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="div">
                      {alumno.nombres} {alumno.apellidos}
                    </Typography>
                    {alumno.activo ? 
                      <Chip label="Activo" color="success" size="small" /> :
                      <Chip label="Inactivo" color="default" size="small" />
                    }
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Teléfono: {alumno.telefono || 'No especificado'}
                  </Typography>
                </CardContent>
              </RouterLink>
              
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                {alumno.activo ? (
                  <Button size="small" variant="outlined" color="error" startIcon={<DoNotDisturbOnIcon />} onClick={() => handleDeactivate(alumno.id)}>
                    Desactivar
                  </Button>
                ) : (
                  <Button size="small" variant="outlined" color="success" startIcon={<PowerSettingsNewIcon />} onClick={() => handleActivate(alumno.id)}>
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