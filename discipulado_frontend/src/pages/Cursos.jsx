// En src/pages/Cursos.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Checkbox,
  FormControlLabel,
  Stack, // Para apilar botones
} from '@mui/material';

// --- NUEVO: Importaciones de Iconos ---
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
// ---

// --- NUEVO: Estilo para el Modal (la ventana pop-up) ---
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

  const [today, setToday] = useState('');
  useEffect(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    setToday(todayISO);
  }, []);

  // --- (Toda la lógica de 'fetchCursos' queda igual) ---
  const fetchCursos = async () => {
    try {
      setLoading(true);
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

  // --- (Toda la lógica de 'handle...' queda igual) ---
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
    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
      setFormError("Todos los campos (nombre y fechas) son obligatorios.");
      return;
    }
    const method = (formMode === 'edit') ? 'patch' : 'post';
    const url = (formMode === 'edit') ? `/cursos/${editingCurso.id}/` : '/cursos/';
    try {
      await apiClient[method](url, formData);
      handleCancel();
      fetchCursos();
    } catch (err) {
      console.error("Error al guardar curso:", err);
      setFormError(formMode === 'create' ? "Error al crear." : "Error al actualizar.");
    }
  };

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

  const handleDeactivate = async (cursoId) => {
    if (window.confirm("¿Estás seguro de que quieres DESACTIVAR este curso? (Esto desactivará también sus mesas y alumnos)")) {
      try {
        await apiClient.patch(`/cursos/${cursoId}/`, { activo: false });
        fetchCursos();
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
        fetchCursos();
      } catch (err) {
        console.error("Error al activar curso:", err);
        alert("Error al activar el curso.");
      }
    }
  };
  
  // --- RENDERIZADO (Aquí están los cambios) ---
  
  if (loading && cursos.length === 0) {
    return <Typography>Cargando cursos...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        📚 Cursos
      </Typography>
      
      {/* Botón de Añadir (solo se muestra si el modal está oculto) */}
      {formMode === 'hidden' && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleShowCreateForm}
          sx={{ mb: 3 }} // margen inferior
        >
          Añadir Nuevo Curso
        </Button>
      )}

      {/* --- NUEVO: Formulario en un Modal --- */}
      <Modal
        open={formMode !== 'hidden'}
        onClose={handleCancel}
      >
        <Box sx={modalStyle}>
          <Typography variant="h5" component="h2">
            {formMode === 'create' ? 'Nuevo Curso' : `Editando: ${editingCurso ? editingCurso.nombre : 'Curso'}`}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              name="nombre"
              label="Nombre del curso"
              value={formData.nombre}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              name="fecha_inicio"
              label="Fecha de Inicio"
              type="date"
              value={formData.fecha_inicio}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{ shrink: true }} // Para que la etiqueta no se encime
            />
            <TextField
              name="fecha_fin"
              label="Fecha de Fin"
              type="date"
              value={formData.fecha_fin}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  name="activo" 
                  checked={formData.activo} 
                  onChange={handleInputChange} 
                />
              }
              label="Marcar como curso activo?"
            />
            
            {formError && <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>}
            
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button variant="contained" type="submit">
                {formMode === 'create' ? 'Crear Curso' : 'Guardar Cambios'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Modal>

      {/* --- NUEVO: Lista de Cursos con MUI Cards --- */}
      <Stack spacing={2}>
        {cursos.length === 0 ? (
          <Typography>No hay cursos registrados.</Typography>
        ) : (
          cursos.map((curso) => {
            const isFinished = curso.fecha_fin < today;
            
            return (
              <Card key={curso.id} variant="outlined" sx={{ opacity: curso.activo ? 1 : 0.6 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Link to={`/cursos/${curso.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Typography variant="h5" component="div">
                        {curso.nombre}
                      </Typography>
                    </Link>
                    {curso.activo ? 
                      <Chip label="Activo" color="success" size="small" /> :
                      <Chip label="Inactivo" color="default" size="small" />
                    }
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Duración: {curso.fecha_inicio} a {curso.fecha_fin}
                    {isFinished && !curso.activo && " (Archivado)"}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  {curso.activo ? (
                    <>
                      <Button size="small" variant="outlined" color="warning" startIcon={<EditIcon />} onClick={() => handleShowEditForm(curso)}>
                        Editar
                      </Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeactivate(curso.id)}>
                        Desactivar
                      </Button>
                    </>
                  ) : (
                    isFinished ? (
                      <Button size="small" variant="outlined" color="info" startIcon={<VisibilityIcon />} onClick={() => handleShowEditForm(curso)}>
                        Ver
                      </Button>
                    ) : (
                      <Button size="small" variant="outlined" color="success" startIcon={<PowerSettingsNewIcon />} onClick={() => handleActivate(curso.id)}>
                        Activar
                      </Button>
                    )
                  )}
                </CardActions>
              </Card>
            );
          })
        )}
      </Stack>
    </Box>
  );
}