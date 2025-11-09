// En src/pages/Asistencia.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- NUEVO: Importaciones de MUI ---
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper, // Usaremos Paper para cada fila
  Stack,
  TextField,
  Grid,
  Autocomplete,
} from '@mui/material';
// ---

// (Lista de Clases - queda igual)
const CLASES = [
  "Introduccion", "El comienzo de una vida en Cristo", "El arrepentimiento",
  "La Fe", "El Perdon", "La Obediencia", "La Familia", "El Espiritu Santo",
  "La Biblia", "La Oracion y el Ayuno", "El Bautismo", "La Santa Cena",
  "Compartir el Mensaje", "La Mayordomia", "La Iglesia", "Satanas",
  "La Vieja Naturaleza", "El Mundo", "Dios", "Guiados por Dios", "Resumen General"
];
// ---

export default function Asistencia() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [numeroClase, setNumeroClase] = useState(1);
  const [asistenciaEstado, setAsistenciaEstado] = useState({});

  // --- (Lógica de fetchData - queda igual) ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alumnosRes, asistenciaRes, horariosRes] = await Promise.all([
        apiClient.get('/alumnos/'),
        apiClient.get(`/asistencias/?numero_clase=${numeroClase}`),
        apiClient.get('/horarios/')
      ]);
      setAlumnos(alumnosRes.data);
      setHorarios(horariosRes.data);
      const estadoInicial = {};
      alumnosRes.data.forEach(alumno => {
        const registro = asistenciaRes.data.find(a => a.alumno === alumno.id);
        if (registro) {
          estadoInicial[alumno.id] = {
            estado: registro.estado,
            motivo: registro.motivo_falta_recupero || '',
            horarioAdelanto: registro.horario_adelanto || null,
          };
        } else {
          estadoInicial[alumno.id] = { estado: '', motivo: '', horarioAdelanto: null };
        }
      });
      setAsistenciaEstado(estadoInicial);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [numeroClase, user]);

  // --- (Lógica de handleAsistenciaChange - queda igual) ---
  const handleAsistenciaChange = (alumnoId, campo, valor) => {
    setAsistenciaEstado(prev => {
      const newState = { ...prev[alumnoId], [campo]: valor };
      if (campo === 'estado' && valor !== 'F' && valor !== 'R') {
        newState.motivo = '';
      }
      if (campo === 'estado' && valor !== 'D') {
        newState.horarioAdelanto = null;
      }
      return { ...prev, [alumnoId]: newState };
    });
  };

  // --- (Lógica de handleSubmit - queda igual) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = Object.keys(asistenciaEstado)
      .filter(alumnoId => asistenciaEstado[alumnoId].estado !== '')
      .map(alumnoId => {
        const estado = asistenciaEstado[alumnoId];
        return {
          alumno: parseInt(alumnoId),
          numero_clase: numeroClase,
          estado: estado.estado,
          motivo_falta_recupero: (estado.estado === 'F' || estado.estado === 'R') ? estado.motivo : null,
          horario_adelanto: (estado.estado === 'D' && estado.horarioAdelanto) ? parseInt(estado.horarioAdelanto) : null,
        };
      });
    if (payload.length === 0) {
      setError("No hay asistencias para guardar.");
      return;
    }
    try {
      await apiClient.post('/asistencias/bulk_upsert/', payload);
      alert('¡Asistencia guardada con éxito!');
    } catch (err) {
      console.error("Error al guardar asistencia:", err);
      setError("Error al guardar la asistencia.");
    }
  };

  // --- RENDERIZADO (Aquí están los cambios) ---
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        ✅ Asistencia
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        {/* --- Selector de Clase con MUI --- */}
        <FormControl sx={{ mb: 3, minWidth: 400 }}>
          <InputLabel id="clase-select-label">Selecciona la Clase</InputLabel>
          <Select
            labelId="clase-select-label"
            id="clase-select"
            value={numeroClase}
            label="Selecciona la Clase"
            onChange={(e) => setNumeroClase(Number(e.target.value))}
          >
            {CLASES.map((nombre, index) => (
              <MenuItem key={index} value={index + 1}>
                Clase {index + 1}: {nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* --- Lista de Alumnos --- */}
        {loading && <Typography>Cargando alumnos...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        
        {!loading && (
          <Stack spacing={2}>
            {alumnos.map(alumno => {
              const estadoActual = asistenciaEstado[alumno.id] || { estado: '', motivo: '', horarioAdelanto: null };
              
              return (
                <Paper key={alumno.id} variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={17} alignItems="center">
                    {/* Columna 1: Nombre */}
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body1">{alumno.nombres} {alumno.apellidos}</Typography>
                    </Grid>
                    
                    {/* Columna 2: Selector de Estado */}
                    <Grid item xs={12} sm={8}>
                      <FormControl fullWidth>
                        <InputLabel id={`estado-label-${alumno.id}`}>Estado</InputLabel>
                        <Select
                          labelId={`estado-label-${alumno.id}`}
                          value={estadoActual.estado}
                          label="Estado"
                          onChange={(e) => handleAsistenciaChange(alumno.id, 'estado', e.target.value)}
                        >
                          <MenuItem value="">-- Seleccionar --</MenuItem>
                          <MenuItem value="A">Asistió</MenuItem>
                          <MenuItem value="F">Faltó</MenuItem>
                          <MenuItem value="R">Recuperó</MenuItem>
                          <MenuItem value="D">Adelantó</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* --- Campos Condicionales --- */}
                    
                    {/* Si es Faltó o Recuperó, mostrar campo de Motivo */}
                    {(estadoActual.estado === 'F' || estadoActual.estado === 'R') && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Motivo (Falta o Recuperación)"
                          variant="outlined"
                          value={estadoActual.motivo}
                          onChange={(e) => handleAsistenciaChange(alumno.id, 'motivo', e.target.value)}
                        />
                      </Grid>
                    )}
                    
                    {/* Si es Adelantó, mostrar desplegable de Horarios */}
                    {estadoActual.estado === 'D' && (
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel id={`horario-label-${alumno.id}`}>Horario donde adelantó</InputLabel>
                          <Select
                            labelId={`horario-label-${alumno.id}`}
                            value={estadoActual.horarioAdelanto || ''}
                            label="Horario donde adelantó"
                            onChange={(e) => handleAsistenciaChange(alumno.id, 'horarioAdelanto', e.target.value)}
                          >
                            <MenuItem value="">-- Selecciona horario --</MenuItem>
                            {horarios.map(h => (
                              <MenuItem key={h.id} value={h.id}>
                                {h.dia === 'MIE' ? 'Miércoles' : 'Domingo'} {h.hora}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        )}
        
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          size="large"
          disabled={loading}
          sx={{ mt: 3 }}
        >
          Guardar Asistencia
        </Button>
      </Box>
    </Box>
  );
}