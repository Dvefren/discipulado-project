// En src/pages/Asistencia.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- (Estilos) ---
const formContainerStyle = { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' };
const listStyle = { listStyle: 'none', padding: 0 };
const studentRowStyle = {
  display: 'flex',
  flexDirection: 'column', // <-- CAMBIO: Apilado vertical
  padding: '15px',
  borderBottom: '1px solid #eee',
  gap: '10px', // Espacio entre elementos
};
const studentHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const selectStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' };
const inputStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }; // <-- NUEVO
const buttonStyle = { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em' };
// ---

// --- (Lista de Clases queda igual) ---
const CLASES = [ "Introduccion", "El comienzo de una vida en Cristo", /* ... */ "Resumen General" ];
// ---

export default function Asistencia() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [horarios, setHorarios] = useState([]); // <-- NUEVO: Para el desplegable de "Adelantó"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [numeroClase, setNumeroClase] = useState(1);
  
  // --- CAMBIO: Estado de Asistencia más complejo ---
  // Ahora es un objeto que guarda objetos
  // { alumnoId: { estado: 'A', motivo: '', horarioAdelanto: null }, ... }
  const [asistenciaEstado, setAsistenciaEstado] = useState({});
  // ---

  // --- Cargar Alumnos, Horarios y Asistencias Previas ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Pedimos alumnos, asistencias previas, y TODOS los horarios activos
      const [alumnosRes, asistenciaRes, horariosRes] = await Promise.all([
        apiClient.get('/alumnos/'),
        apiClient.get(`/asistencias/?numero_clase=${numeroClase}`),
        apiClient.get('/horarios/') // <-- NUEVO: Pedimos horarios activos
      ]);
      
      setAlumnos(alumnosRes.data);
      setHorarios(horariosRes.data); // <-- NUEVO: Guardamos horarios

      // 3. Pre-poblamos el estado complejo
      const estadoInicial = {};
      alumnosRes.data.forEach(alumno => {
        const registro = asistenciaRes.data.find(a => a.alumno === alumno.id);
        if (registro) {
          estadoInicial[alumno.id] = {
            estado: registro.estado,
            motivo: registro.motivo_falta_recupero || '',
            horarioAdelanto: registro.horario_adelanto || null, // Guardamos el ID
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
  }, [numeroClase, user]); // Se recarga si cambia la clase

  // --- Manejadores ---

  // --- CAMBIO: Un solo manejador para todos los campos ---
  const handleAsistenciaChange = (alumnoId, campo, valor) => {
    setAsistenciaEstado(prev => {
      const newState = { ...prev[alumnoId], [campo]: valor };

      // Lógica de limpieza:
      // Si el estado NO es F o R, borramos el motivo
      if (campo === 'estado' && valor !== 'F' && valor !== 'R') {
        newState.motivo = '';
      }
      // Si el estado NO es D, borramos el horario
      if (campo === 'estado' && valor !== 'D') {
        newState.horarioAdelanto = null;
      }
      
      return {
        ...prev,
        [alumnoId]: newState,
      };
    });
  };
  // ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Convertir nuestro estado complejo en el payload
    const payload = Object.keys(asistenciaEstado)
      .filter(alumnoId => asistenciaEstado[alumnoId].estado !== '') // Solo los que tienen estado
      .map(alumnoId => {
        const estado = asistenciaEstado[alumnoId];
        return {
          alumno: parseInt(alumnoId),
          numero_clase: numeroClase,
          estado: estado.estado,
          motivo_falta_recupero: (estado.estado === 'F' || estado.estado === 'R') ? estado.motivo : null,
          horario_adelanto: (estado.estado === 'D') ? parseInt(estado.horarioAdelanto) : null,
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

  // --- Renderizado ---

  return (
    <div>
      <h1>✅ Asistencia</h1>
      
      <form onSubmit={handleSubmit} style={formContainerStyle}>
        {/* ... (Selector de Clase queda igual) ... */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="numeroClase" style={{ display: 'block', marginBottom: '5px' }}>Selecciona la Clase:</label>
            <select
              id="numeroClase"
              value={numeroClase}
              onChange={(e) => setNumeroClase(Number(e.target.value))}
              style={{...selectStyle, width: '400px'}}
            >
              {CLASES.map((nombre, index) => (
                <option key={index} value={index + 1}>
                  Clase {index + 1}: {nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Lista de Alumnos --- */}
        {loading && <p>Cargando alumnos...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {!loading && (
          <ul style={listStyle}>
            {alumnos.map(alumno => {
              // Obtenemos el estado actual para este alumno
              const estadoActual = asistenciaEstado[alumno.id] || { estado: '', motivo: '', horarioAdelanto: null };
              
              return (
                <li key={alumno.id} style={studentRowStyle}>
                  {/* Fila 1: Nombre y Selector de Estado */}
                  <div style={studentHeaderStyle}>
                    <span>{alumno.nombres} {alumno.apellidos}</span>
                    <select
                      style={selectStyle}
                      value={estadoActual.estado}
                      onChange={(e) => handleAsistenciaChange(alumno.id, 'estado', e.target.value)}
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="A">Asistió</option>
                      <option value="F">Faltó</option>
                      <option value="R">Recuperó</option>
                      <option value="D">Adelantó</option>
                    </select>
                  </div>
                  
                  {/* --- NUEVO: Campos Condicionales --- */}
                  
                  {/* 2. Si es Faltó o Recuperó, mostrar campo de Motivo */}
                  {(estadoActual.estado === 'F' || estadoActual.estado === 'R') && (
                    <input
                      type="text"
                      placeholder="Escribe el motivo..."
                      style={inputStyle}
                      value={estadoActual.motivo}
                      onChange={(e) => handleAsistenciaChange(alumno.id, 'motivo', e.target.value)}
                    />
                  )}
                  
                  {/* 3. Si es Adelantó, mostrar desplegable de Horarios */}
                  {estadoActual.estado === 'D' && (
                    <select
                      style={inputStyle} // Reutilizamos el estilo del input
                      value={estadoActual.horarioAdelanto || ''}
                      onChange={(e) => handleAsistenciaChange(alumno.id, 'horarioAdelanto', e.target.value)}
                    >
                      <option value="">-- Selecciona horario donde adelantó --</option>
                      {horarios.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.dia === 'MIE' ? 'Miércoles' : 'Domingo'} {h.hora} (Curso: {h.curso})
                        </option>
                      ))}
                    </select>
                  )}
                  {/* --- FIN DE CAMPOS CONDICIONALES --- */}
                </li>
              );
            })}
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