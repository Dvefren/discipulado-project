// En src/pages/AlumnoDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import apiClient from '../services/api';

// --- Importaciones de MUI ---
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Modal,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
// --- Iconos para Asistencia ---
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Asistió
import CancelIcon from '@mui/icons-material/Cancel'; // Faltó
import ReplayIcon from '@mui/icons-material/Replay'; // Recuperó
import HistoryIcon from '@mui/icons-material/History'; // Adelantó
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // Sin registrar
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

// --- Lista de Clases (para el historial) ---
const CLASES = [
  "Introduccion", "El comienzo de una vida en Cristo", "El arrepentimiento",
  "La Fe", "El Perdon", "La Obediencia", "La Familia", "El Espiritu Santo",
  "La Biblia", "La Oracion y el Ayuno", "El Bautismo", "La Santa Cena",
  "Compartir el Mensaje", "La Mayordomia", "La Iglesia", "Satanas",
  "La Vieja Naturaleza", "El Mundo", "Dios", "Guiados por Dios", "Resumen General"
];
// ---

export default function AlumnoDetail() {
  const { alumnoId } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [asistencias, setAsistencias] = useState([]); // <-- Estado para asistencia
  const [mesas, setMesas] = useState([]); // <-- Estado para mesas
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [formError, setFormError] = useState(null);
  const [editingAlumno, setEditingAlumno] = useState(null); // (Para el título del modal)

  // --- Cargar datos (Alumno, Mesas, y Asistencias) ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [alumnoRes, mesasRes, asistenciasRes] = await Promise.all([
        apiClient.get(`/alumnos/${alumnoId}/`),
        apiClient.get('/mesas/'),
        apiClient.get(`/asistencias/?alumno=${alumnoId}`) // <-- Llamada de asistencia
      ]);
      
      setAlumno(alumnoRes.data);
      setMesas(mesasRes.data);
      setAsistencias(asistenciasRes.data);
      
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [alumnoId]);

  // --- Manejadores del Modal de Edición ---
  const handleShowEditModal = () => {
    if (!alumno) return;
    setEditingAlumno(alumno); // Para el título
    setFormData({
      nombres: alumno.nombres || '',
      apellidos: alumno.apellidos || '',
      fecha_nacimiento: alumno.fecha_nacimiento || '',
      telefono: alumno.telefono || '',
      colonia: alumno.colonia || '',
      calle: alumno.calle || '',
      numero_casa: alumno.numero_casa || '',
      mesa: alumno.mesa || '',
      meta_personal: alumno.meta_personal || '',
      testimonio: alumno.testimonio || '',
      areas_mejorar: alumno.areas_mejorar || '',
      bautizado: alumno.bautizado || false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData(null);
    setFormError(null);
    setEditingAlumno(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      ...formData,
      mesa: parseInt(formData.mesa),
    };
    try {
      await apiClient.patch(`/alumnos/${alumnoId}/`, payload);
      handleCancel();
      fetchData(); // Recargamos todos los datos (incluido el nombre del alumno)
    } catch (err) {
      console.error("Error al actualizar alumno:", err);
      setFormError("Error al guardar los cambios.");
    }
  };
  // ---

  // --- Componente de Ayuda para Info ---
  const InfoItem = ({ title, value }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {title}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {value || 'No especificado'}
      </Typography>
    </Box>
  );

  // --- Componente de Ayuda para Icono de Estado ---
  const GetStatusIcon = ({ estado }) => {
    switch (estado) {
      case 'A':
        return <CheckCircleIcon color="success" />;
      case 'F':
        return <CancelIcon color="error" />;
      case 'R':
        return <ReplayIcon color="warning" />;
      case 'D':
        return <HistoryIcon color="info" />;
      default:
        return <HelpOutlineIcon color="disabled" />;
    }
  };

  // --- Renderizado ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }
  if (error) return <Typography color="error">{error}</Typography>;
  if (!alumno) return <Typography>Alumno no encontrado.</Typography>;

  return (
    <Box>
      <Button
        component={RouterLink}
        to="/alumnos"
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Volver a Alumnos
      </Button>

      {/* --- Cabecera del Perfil --- */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1">
              {alumno.nombres} {alumno.apellidos}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Mesa: {mesas.find(m => m.id === alumno.mesa)?.nombre_mesa || 'N/A'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={alumno.activo ? "Activo" : "Inactivo"} 
              color={alumno.activo ? "success" : "default"} 
            />
            <Button 
              variant="contained" 
              startIcon={<EditIcon />} 
              onClick={handleShowEditModal}
              disabled={!alumno.activo}
            >
              Editar Perfil
            </Button>
          </Stack>
        </Stack>
      </Paper>
      
      {/* --- Contenido del Perfil en Grid --- */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Información Personal</Typography>
            <Divider sx={{ mb: 2 }} />
            <InfoItem title="Fecha de Nacimiento" value={alumno.fecha_nacimiento} />
            <InfoItem title="Teléfono" value={alumno.telefono} />
            <InfoItem title="Colonia" value={alumno.colonia} />
            <InfoItem title="Calle" value={alumno.calle} />
            <InfoItem title="Número de Casa" value={alumno.numero_casa} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Respuestas Personales</Typography>
            <Divider sx={{ mb: 2 }} />
            <InfoItem title="¿Está bautizado?" value={alumno.bautizado ? "Sí" : "No"} />
            <InfoItem title="Meta Personal" value={alumno.meta_personal} />
            <InfoItem title="Áreas a mejorar" value={alumno.areas_mejorar} />
            <InfoItem title="Testimonio" value={alumno.testimonio} />
          </Paper>
        </Grid>

        {/* --- Historial de Asistencia --- */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Historial de Asistencia</Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              {CLASES.map((nombreClase, index) => {
                const numeroClase = index + 1;
                const record = asistencias.find(a => a.numero_clase === numeroClase);
                
                let statusText = "Sin Registrar";
                let statusColor = "text.secondary";

                if (record) {
                  switch (record.estado) {
                    case 'A':
                      statusText = "Asistió";
                      statusColor = "success.main";
                      break;
                    case 'F':
                      statusText = `Faltó ${record.motivo_falta_recupero ? `(Motivo: ${record.motivo_falta_recupero})` : ''}`;
                      statusColor = "error.main";
                      break;
                    case 'R':
                      statusText = `Recuperó ${record.motivo_falta_recupero ? `(Motivo: ${record.motivo_falta_recupero})` : ''}`;
                      statusColor = "warning.main";
                      break;
                    case 'D':
                      const horarioAdelanto = horarios.find(h => h.id === record.horario_adelanto);
                      const horarioTexto = horarioAdelanto ? `(${horarioAdelanto.dia === 'MIE' ? 'Mié' : 'Dom'} ${horarioAdelanto.hora})` : '';
                      statusText = `Adelantó ${horarioTexto}`;
                      statusColor = "info.main";
                      break;
                    default:
                      break;
                  }
                }

                return (
                  <ListItem key={numeroClase}>
                    <ListItemIcon>
                      <GetStatusIcon estado={record ? record.estado : null} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Clase ${numeroClase}: ${nombreClase}`}
                      secondary={statusText}
                      primaryTypographyProps={{ fontWeight: '500' }}
                      secondaryTypographyProps={{ color: statusColor }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
        
      </Grid>

      {/* --- Modal de Edición --- */}
      <Modal
        open={isModalOpen}
        onClose={handleCancel}
      >
        <Box sx={modalStyle}>
          {formData && (
            <>
              <Typography variant="h5" component="h2">
                Editando Perfil: {editingAlumno ? editingAlumno.nombres : ''}
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
                <Grid container spacing={2}>
                  {/* Columna 1 */}
                  <Grid item xs={12} sm={6}>
                    <TextField name="nombres" label="Nombres" value={formData.nombres} onChange={handleInputChange} fullWidth margin="normal" required />
                    <TextField name="apellidos" label="Apellidos" value={formData.apellidos} onChange={handleInputChange} fullWidth margin="normal" required />
                    <TextField name="fecha_nacimiento" label="Fecha de Nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleInputChange} fullWidth margin="normal" required InputLabelProps={{ shrink: true }} />
                    <TextField name="telefono" label="Teléfono" value={formData.telefono} onChange={handleInputChange} fullWidth margin="normal" />
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel id="mesa-select-label">Mesa Asignada</InputLabel>
                      <Select labelId="mesa-select-label" name="mesa" label="Mesa Asignada" value={formData.mesa} onChange={handleInputChange}>
                        <MenuItem value="">-- Selecciona --</MenuItem>
                        {mesas.map(mesa => (
                          <MenuItem key={mesa.id} value={mesa.id}>
                            {mesa.nombre_mesa || `Mesa ID: ${mesa.id}`} (Fac: {mesa.facilitador ? mesa.facilitador.first_name : 'N/A'})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Columna 2 */}
                  <Grid item xs={12} sm={6}>
                    <TextField name="colonia" label="Colonia" value={formData.colonia} onChange={handleInputChange} fullWidth margin="normal" />
                    <TextField name="calle" label="Calle" value={formData.calle} onChange={handleInputChange} fullWidth margin="normal" />
                    <TextField name="numero_casa" label="Número" value={formData.numero_casa} onChange={handleInputChange} fullWidth margin="normal" />
                    <FormControlLabel
                      control={<Checkbox name="bautizado" checked={formData.bautizado} onChange={handleInputChange} />}
                      label="¿Está bautizado?"
                      sx={{ mt: 1 }}
                    />
                  </Grid>

                  {/* Campos de texto largo */}
                  <Grid item xs={12}>
                    <TextField name="meta_personal" label="Meta Personal" value={formData.meta_personal} onChange={handleInputChange} fullWidth margin="normal" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField name="areas_mejorar" label="Áreas a mejorar" value={formData.areas_mejorar} onChange={handleInputChange} fullWidth margin="normal" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="testimonio"
                      label="Testimonio"
                      value={formData.testimonio}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>

                {formError && <Typography color="error" sx={{ mt: 2 }}>{formError}</Typography>}
                
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
                  <Button variant="contained" type="submit">Guardar Cambios</Button>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}