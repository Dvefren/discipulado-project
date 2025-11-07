// En src/pages/Asistencia.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- (Estilos temporales) ---
const formContainerStyle = {
  background: '#f9f9f9',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
};
const listStyle = { listStyle: 'none', padding: 0 };
const studentRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  borderBottom: '1px solid #eee',
};
const selectStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' };
const buttonStyle = { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em' };
// ---

// --- CAMBIO: Lista de Clases ---
// Creamos un array con los nombres de las 21 clases
const CLASES = [
  "Introduccion",
  "El comienzo de una vida en Cristo",
  "El arrepentimiento",
  "La Fe",
  "El Perdon",
  "La Obediencia",
  "La Familia",
  "El Espiritu Santo",
  "La Biblia",
  "La Oracion y el Ayuno",
  "El Bautismo",
  "La Santa Cena",
  "Compartir el Mensaje",
  "La Mayordomia",
  "La Iglesia",
  "Satanas",
  "La Vieja Naturaleza",
  "El Mundo",
  "Dios",
  "Guiados por Dios",
  "Resumen General"
];
// ---

export default function Asistencia() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para el formulario ---
  const [numeroClase, setNumeroClase] = useState(1); // Sigue siendo el ID (1, 2, 3...)
  // const [fechaClase, setFechaClase] = useState(getTodayDate()); // <-- CAMBIO: Eliminado
  
  const [asistenciaEstado, setAsistenciaEstado] = useState({});

  // --- Cargar Alumnos y Asistencias Previas ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // (La lógica para cargar alumnos y asistencias previas sigue igual)
      const [alumnosRes, asistenciaRes] = await Promise.all([
        apiClient.get('/alumnos/'),
        apiClient.get(`/asistencias/?numero_clase=${numeroClase}`)
      ]);
      
      setAlumnos(alumnosRes.data);

      const estadoInicial = {};
      alumnosRes.data.forEach(alumno => {
        const registro = asistenciaRes.data.find(a => a.alumno === alumno.id);
        estadoInicial[alumno.id] = registro ? registro.estado : '';
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
  }, [numeroClase, user]); // Se ejecuta cuando 'numeroClase' cambia

  // --- Manejadores ---
  const handleEstadoChange = (alumnoId, nuevoEstado) => {
    setAsistenciaEstado(prev => ({
      ...prev,
      [alumnoId]: nuevoEstado,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Convertir el estado en el payload
    const payload = Object.keys(asistenciaEstado)
      .filter(alumnoId => asistenciaEstado[alumnoId] !== '')
      .map(alumnoId => ({
        alumno: parseInt(alumnoId),
        numero_clase: numeroClase,
        // fecha_clase: fechaClase, // <-- CAMBIO: Eliminado
        estado: asistenciaEstado[alumnoId],
      }));

    if (payload.length === 0) {
      setError("No hay asistencias para guardar.");
      return;
    }

    try {
      // 2. Enviar el array al endpoint 'bulk_upsert'
      await apiClient.post('/asistencias/bulk_upsert/', payload);
      alert('¡Asistencia guardada con éxito!');
      
    } catch (err) {
      console.error("Error al guardar asistencia:", err);
      setError("Error al guardar la asistencia.");
    }
  };

  // --- Renderizado ---

  return (
    <div>
      <h1>✅ Asistencia</h1>
      
      <form onSubmit={handleSubmit} style={formContainerStyle}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="numeroClase" style={{ display: 'block', marginBottom: '5px' }}>Selecciona la Clase:</label>
            {/* --- CAMBIO: de input a select --- */}
            <select
              id="numeroClase"
              value={numeroClase}
              onChange={(e) => setNumeroClase(Number(e.target.value))}
              style={{...selectStyle, width: '400px'}} // Hacemos el select más ancho
            >
              {CLASES.map((nombre, index) => (
                <option key={index} value={index + 1}>
                  Clase {index + 1}: {nombre}
                </option>
              ))}
            </select>
            {/* --- Fin del cambio --- */}
          </div>
        </div>

        {/* --- Lista de Alumnos --- */}
        {loading && <p>Cargando alumnos...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {!loading && (
          <ul style={listStyle}>
            {alumnos.map(alumno => (
              <li key={alumno.id} style={studentRowStyle}>
                <span>{alumno.nombres} {alumno.apellidos}</span>
                <select
                  style={selectStyle}
                  value={asistenciaEstado[alumno.id] || ''}
                  onChange={(e) => handleEstadoChange(alumno.id, e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="A">Asistió</option>
                  <option value="F">Faltó</option>
                  <option value="R">Recuperó</option>
                  <option value="D">Adelantó</option>
                </select>
              </li>
            ))}
          </ul>
        )}
        
        <hr />
        <button type="submit" style={buttonStyle} disabled={loading}>
          Guardar Asistencia
        </button>
      </form>
    </div>
  );
}