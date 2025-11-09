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

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// (Estilos)
const dashboardContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
  gap: '20px',
};
const chartBoxStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  minHeight: '400px', 
  maxHeight: '500px',
};
const selectStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1em', marginBottom: '20px' };

// (Lista de Clases)
const CLASES = [
  "Introduccion", "El comienzo de una vida en Cristo", "El arrepentimiento",
  "La Fe", "El Perdon", "La Obediencia", "La Familia", "El Espiritu Santo",
  "La Biblia", "La Oracion y el Ayuno", "El Bautismo", "La Santa Cena",
  "Compartir el Mensaje", "La Mayordomia", "La Iglesia", "Satanas",
  "La Vieja Naturaleza", "El Mundo", "Dios", "Guiados por Dios", "Resumen General"
];

// Opciones para la gráfica apilada
const stackedBarOptions = {
  maintainAspectRatio: false,
  scales: {
    x: { stacked: true },
    y: { stacked: true },
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numeroClase, setNumeroClase] = useState(1);

  // --- Cargar datos ---
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
  }, [numeroClase]); // Se recarga cada vez que 'numeroClase' cambia

  // --- Funciones para preparar los datos de las gráficas ---
  
  // Gráfica de Donut (Asistencia General)
  const getConteoGeneralData = () => {
    // Guardia de seguridad:
    if (!stats || !stats.conteo_general) return { labels: [], datasets: [] };

    const labels = { 'A': 'Asistió', 'F': 'Faltó', 'R': 'Recuperó', 'D': 'Adelantó' };
    const data = { 'A': 0, 'F': 0, 'R': 0, 'D': 0 };

    stats.conteo_general.forEach(item => {
      data[item.estado] = item.total;
    });

    return {
      labels: Object.values(labels),
      datasets: [{
        data: Object.values(data),
        backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#17a2b8'],
      }],
    };
  };

  // Gráfica de Barras (Faltas por Horario)
  const getFaltasHorarioData = () => {
    // Guardia de seguridad:
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

  // Gráfica de Barras Apiladas (Asistencia Detallada por Mesa)
  const getDetalleMesaData = () => {
    // Guardia de seguridad:
    if (!stats || !stats.detalle_por_mesa) return { labels: [], datasets: [] };
    
    const rawData = stats.detalle_por_mesa;
    
    // 1. Encontrar todas las mesas únicas (labels)
    const mesas = {}; // { mesaId: "Nombre Mesa", ... }
    rawData.forEach(item => {
      const mesaNombre = item.alumno__mesa__nombre_mesa || `Mesa de ${item.alumno__mesa__facilitador__first_name}`;
      mesas[item.alumno__mesa_id] = mesaNombre;
    });

    const labels = Object.values(mesas); // ["Mesa 1", "Mesa 2"]
    const mesaIds = Object.keys(mesas);   // ["1", "2"]

    // 2. Preparar los 4 datasets (Asistió, Faltó, Recuperó, Adelantó)
    const dataA = new Array(labels.length).fill(0);
    const dataF = new Array(labels.length).fill(0);
    const dataR = new Array(labels.length).fill(0);
    const dataD = new Array(labels.length).fill(0);

    // 3. Llenar los datasets con los datos del backend
    rawData.forEach(item => {
      const mesaIndex = mesaIds.indexOf(item.alumno__mesa_id.toString());
      if (mesaIndex === -1) return;

      switch (item.estado) {
        case 'A':
          dataA[mesaIndex] = item.total;
          break;
        case 'F':
          dataF[mesaIndex] = item.total;
          break;
        case 'R':
          dataR[mesaIndex] = item.total;
          break;
        case 'D':
          dataD[mesaIndex] = item.total;
          break;
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
  // ---

  // --- Renderizado ---
  return (
    <div>
      <h1>📊 Inicio (Dashboard)</h1>
      
      {/* --- Selector de Clase --- */}
      <div>
        <label htmlFor="numeroClase" style={{ display: 'block', marginBottom: '5px' }}>Selecciona la Clase:</label>
        <select
          id="numeroClase"
          value={numeroClase}
          onChange={(e) => setNumeroClase(Number(e.target.value))}
          style={selectStyle}
        >
          {CLASES.map((nombre, index) => (
            <option key={index} value={index + 1}>
              Clase {index + 1}: {nombre}
            </option>
          ))}
        </select>
      </div>

      {/* --- Contenedor de Gráficas --- */}
      {loading && <p>Cargando estadísticas...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {stats && (
        <div style={dashboardContainerStyle}>
          
          {/* Gráfica 1: Conteo General */}
          <div style={chartBoxStyle}>
            <h3>Asistencia General (Clase {numeroClase})</h3>
            <Doughnut 
              data={getConteoGeneralData()} 
              options={{ maintainAspectRatio: false }}
            />
          </div>

          {/* Gráfica 2: Faltas por Horario */}
          <div style={chartBoxStyle}>
            <h3>Faltas por Horario (Clase {numeroClase})</h3>
            <Bar 
              data={getFaltasHorarioData()} 
              options={{ maintainAspectRatio: false }}
            />
          </div>

          {/* Gráfica 3 (Detalle por Mesa) */}
          {stats.detalle_por_mesa && stats.detalle_por_mesa.length > 0 && (
            <div style={chartBoxStyle}>
              <h3>Asistencia Detallada por Mesa</h3>
              <Bar 
                data={getDetalleMesaData()}
                options={stackedBarOptions}
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
}