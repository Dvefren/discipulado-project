// En src/pages/Alumnos.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// --- AÑADE O REEMPLAZA ESTE BLOQUE DE ESTILOS ---
const cardStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  padding: '15px',
  marginBottom: '10px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};
const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '20px',
  background: '#f9f9f9',
  borderRadius: '8px',
  marginBottom: '20px',
};
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const toggleButtonStyle = { ...buttonStyle, background: '#28a745', marginBottom: '20px' };
const errorStyle = { color: 'red', fontSize: '0.9em' };
// ---

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [mesas, setMesas] = useState([]); // <-- NUEVO: Estado para las mesas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para el formulario ---
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    telefono: '',
    colonia: '',
    calle: '',
    numero_casa: '',
    mesa: '', // <-- NUEVO: ID de la mesa seleccionada
  });

  // --- Cargar datos ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // Hacemos ambas peticiones en paralelo
      const [alumnosRes, mesasRes] = await Promise.all([
        apiClient.get('/alumnos/'),
        apiClient.get('/mesas/') // <-- NUEVO: Pedimos la lista de mesas
      ]);
      
      setAlumnos(alumnosRes.data);
      setMesas(mesasRes.data); // <-- NUEVO: Guardamos las mesas
      setError(null);
      
      // Si solo hay una mesa (ej. un Facilitador), la pre-seleccionamos
      if (mesasRes.data.length === 1) {
        setFormData(prev => ({ ...prev, mesa: mesasRes.data[0].id }));
      }
      
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudieron cargar los datos de alumnos o mesas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Manejadores del formulario ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nombres || !formData.apellidos || !formData.fecha_nacimiento || !formData.mesa) {
      setFormError("Nombres, apellidos, fecha de nacimiento y mesa son obligatorios.");
      return;
    }

    try {
      // 1. Enviar los datos al backend
      // El backend espera el ID de la mesa, que ya está en formData.mesa
      await apiClient.post('/alumnos/', formData);
      
      // 2. Limpiar formulario y ocultarlo
      setIsFormVisible(false);
      setFormData({
        nombres: '', apellidos: '', fecha_nacimiento: '', telefono: '',
        colonia: '', calle: '', numero_casa: '',
        mesa: mesas.length === 1 ? mesas[0].id : '', // Reseteamos la mesa
      });
      
      // 3. Recargar la lista de alumnos (no necesitamos recargar mesas)
      const alumnosRes = await apiClient.get('/alumnos/');
      setAlumnos(alumnosRes.data);
      
    } catch (err) {
      console.error("Error al crear alumno:", err);
      setFormError("Error al crear el alumno.");
    }
  };

  // --- Renderizado ---
  if (loading && alumnos.length === 0) {
    return <p>Cargando alumnos...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h1>🧑‍🎓 Alumnos</h1>
      
      <button onClick={() => setIsFormVisible(!isFormVisible)} style={toggleButtonStyle}>
        {isFormVisible ? 'Cancelar' : 'Añadir Nuevo Alumno'}
      </button>

      {/* --- Formulario de Creación --- */}
      {isFormVisible && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>Nuevo Alumno</h3>
          
          <select name="mesa" value={formData.mesa} onChange={handleInputChange} style={inputStyle} required>
            <option value="">* Selecciona una mesa...</option>
            {mesas.map(mesa => (
              // Mostramos el nombre del facilitador y el horario
              <option key={mesa.id} value={mesa.id}>
                {mesa.nombre_mesa} (Fac: {mesa.facilitador}) {/* Ajusta esto según los datos del facilitador */}
              </option>
            ))}
          </select>
          
          <input type="text" name="nombres" placeholder="* Nombres" value={formData.nombres} onChange={handleInputChange} style={inputStyle} required />
          <input type="text" name="apellidos" placeholder="* Apellidos" value={formData.apellidos} onChange={handleInputChange} style={inputStyle} required />
          
          <label htmlFor="fecha_nacimiento">Fecha de Nacimiento:</label>
          <input type="date" name="fecha_nacimiento" id="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} style={inputStyle} required />
          
          <input type="tel" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="colonia" placeholder="Colonia" value={formData.colonia} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="calle" placeholder="Calle" value={formData.calle} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="numero_casa" placeholder="Número" value={formData.numero_casa} onChange={handleInputChange} style={inputStyle} />

          {formError && <p style={errorStyle}>{formError}</p>}
          <button type="submit" style={buttonStyle}>Crear Alumno</button>
        </form>
      )}

      <hr />

      {/* --- Lista de Alumnos --- */}
      {alumnos.length === 0 ? (
        <p>No hay alumnos registrados.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {alumnos.map((alumno) => (
            <li key={alumno.id} style={{...cardStyle, listStyle: 'none'}}>
              <strong>{alumno.nombres} {alumno.apellidos}</strong>
              <br />
              <small>Teléfono: {alumno.telefono || 'No especificado'}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}