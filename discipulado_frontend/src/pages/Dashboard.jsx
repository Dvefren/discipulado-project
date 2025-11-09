// En src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// --- NUEVO: Importaciones de MUI ---
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper, // Usaremos Paper para los contenedores de gráficas
  Grid, // Para organizar las gráficas
} from '@mui/material';
// ---

// (Registrar Chart.js - queda igual)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// (Lista de Clases - queda igual)
const CLASES = [
  "Introduccion", "El comienzo de una vida en Cristo", "El arrepentimiento",
  "La Fe", "El Perdon", "La Obediencia", "La Familia", "El Espiritu Santo",
  "La Biblia", "La Oracion y el Ayuno", "El Bautismo", "La Santa Cena",
  "Compartir el Mensaje", "La Mayordomia", "La Iglesia", "Satanas",
  "La Vieja Naturaleza", "El Mundo", "Dios", "Guiados por Dios", "Resumen General"
];

// (Opciones de gráficas - quedan igual)
const stackedBarOptions = {
  maintainAspectRatio: false,
  scales: {
    x: { stacked: true },
    y: { stacked: true },
  },
};

const doughnutOptions = {
  maintainAspectRatio: false,
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numeroClase, setNumeroClase] = useState(1);

  // --- (Lógica de fetchStats - queda igual) ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/dashboard-stats/?clase=${numeroClase}`); 
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [numeroClase]);

  // --- (Toda la lógica de getConteoGeneralData, getFaltasHorarioData,
  // y getDetalleMesaData queda EXACTAMENTE IGUAL que antes) ---
  
  const getConteoGeneralData = () => {
    if (!stats || !stats.conteo_general) return { labels: [], datasets: [] };
    const labels = { 'A': 'Asistió', 'F': 'Faltó', 'R': 'Recuperó', 'D': 'Adelantó' };
    const data = { 'A': 0, 'F': 0, 'R': 0, 'D': 0 };
    stats.conteo_general.forEach(item => { data[item.estado] = item.total; });
    return {
      labels: Object.values(labels),
      datasets: [{
        data: Object.values(data),
        backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#17a2b8'],
      }],
    };
  };

  const getFaltasHorarioData = () => {
    if (!stats || !stats.faltas_por_horario) return { labels: [], datasets: [] };
    const labels = stats.faltas_por_horario.map(item => 
      `${item.alumno__mesa__horario__dia === 'MIE' ? 'Mié' : 'Dom'} ${item.alumno__mesa__horario__hora}`
    );
    const data = stats.faltas_por_horario.map(item => item.total_faltas);
    return {
      labels,
      datasets: [{
        label: 'Total de Faltas',
        data,
        backgroundColor: '#007bff',
      }],
    };
  };

  const getDetalleMesaData = () => {
    if (!stats || !stats.detalle_por_mesa) return { labels: [], datasets: [] };
    const rawData = stats.detalle_por_mesa;
    const mesas = {};
    rawData.forEach(item => {
      const mesaNombre = item.alumno__mesa__nombre_mesa || `Mesa de ${item.alumno__mesa__facilitador__first_name}`;
      mesas[item.alumno__mesa_id] = mesaNombre;
    });
    const labels = Object.values(mesas);
    const mesaIds = Object.keys(mesas);
    const dataA = new Array(labels.length).fill(0);
    const dataF = new Array(labels.length).fill(0);
    const dataR = new Array(labels.length).fill(0);
    const dataD = new Array(labels.length).fill(0);
    rawData.forEach(item => {
      const mesaIndex = mesaIds.indexOf(item.alumno__mesa_id.toString());
      if (mesaIndex === -1) return;
      switch (item.estado) {
        case 'A': dataA[mesaIndex] = item.total; break;
        case 'F': dataF[mesaIndex] = item.total; break;
        case 'R': dataR[mesaIndex] = item.total; break;
        case 'D': dataD[mesaIndex] = item.total; break;
      }
    });
    return {
      labels,
      datasets: [
        { label: 'Asistió', data: dataA, backgroundColor: '#28a745' },
        { label: 'Faltó', data: dataF, backgroundColor: '#dc3545' },
        { label: 'Recuperó', data: dataR, backgroundColor: '#ffc107' },
        { label: 'Adelantó', data: dataD, backgroundColor: '#17a2b8' },
      ],
    };
  };

  // --- RENDERIZADO (Aquí están los cambios) ---
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        📊 Inicio (Dashboard)
      </Typography>
      
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

      {/* --- Contenedor de Gráficas con MUI Grid --- */}
      {loading && <Typography>Cargando estadísticas...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      
      {stats && (
        <Grid container spacing={3}>
          
          {/* Gráfica 1: Conteo General */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6">Asistencia General (Clase {numeroClase})</Typography>
              <Box sx={{ height: 'calc(100% - 30px)' }}> {/* Box para controlar altura */}
                <Doughnut 
                  data={getConteoGeneralData()} 
                  options={doughnutOptions}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Gráfica 2: Faltas por Horario */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6">Faltas por Horario (Clase {numeroClase})</Typography>
              <Box sx={{ height: 'calc(100% - 30px)' }}>
                <Bar 
                  data={getFaltasHorarioData()} 
                  options={{ maintainAspectRatio: false }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Gráfica 3 (Detalle por Mesa) */}
          {stats.detalle_por_mesa && stats.detalle_por_mesa.length > 0 && (
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, height: '400px' }}>
                <Typography variant="h6">Asistencia Detallada por Mesa</Typography>
                <Box sx={{ height: 'calc(100% - 30px)' }}>
                  <Bar 
                    data={getDetalleMesaData()}
                    options={stackedBarOptions}
                  />
                </Box>
              </Paper>
            </Grid>
          )}

        </Grid>
      )}
    </Box>
  );
}