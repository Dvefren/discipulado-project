// En src/pages/HorarioDetail.jsx (NUEVO ARCHIVO)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';

// (Estilos - son los mismos que antes)
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '20px' };
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const errorStyle = { color: 'red', fontSize: '0.9em' };
const cardStyle = { background: '#fff', border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' };

const initialFormState = {
  nombre_mesa: '',
  facilitador: '', // ID del facilitador
  horario: null,   // ID del horario (se llenará al cargar)
};

export default function HorarioDetail() {
  const { horarioId } = useParams(); // Obtiene el ID del horario desde la URL

  const [horario, setHorario] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [facilitadores, setFacilitadores] = useState([]); // <-- NUEVO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  // --- Cargar datos ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Pedimos la info del horario
      const horarioRes = await apiClient.get(`/horarios/${horarioId}/`);
      
      // 2. Pedimos las mesas filtradas por este horario
      // (El backend ya las filtra por 'activo=True')
      const mesasRes = await apiClient.get(`/mesas/?horario=${horarioId}`);
      
      // 3. Pedimos la lista de facilitadores activos (el backend ya filtra)
      const facilitadoresRes = await apiClient.get('/auth/usuarios/');
      
      setHorario(horarioRes.data);
      setMesas(mesasRes.data);
      setFacilitadores(facilitadoresRes.data);
      
      // Pre-llenamos el ID del horario en el formulario
      setFormData(prev => ({ ...prev, horario: horarioId }));

    } catch (err) {
      console.error("Error al cargar datos del horario:", err);
      setError("No se pudo cargar la información del horario.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [horarioId]);

  // --- Manejadores del formulario ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.facilitador) {
      setFormError("Debes seleccionar un facilitador.");
      return;
    }
    
    // --- CAMBIO AQUÍ ---
    // Preparamos el payload. El backend espera 'facilitador_id'
    const payload = {
      nombre_mesa: formData.nombre_mesa,
      horario: formData.horario,
      facilitador_id: formData.facilitador // <-- Cambiar nombre del campo
    };
    // --- FIN DEL CAMBIO ---

    try {
      await apiClient.post('/mesas/', payload); // Enviamos el payload
      // Limpiamos y recargamos la lista
      setFormData(prev => ({ ...initialFormState, horario: prev.horario }));
      fetchData(); 
    } catch (err) {
      console.error("Error al crear mesa:", err);
      setFormError("Error al crear la mesa.");
    }
  };

  // --- Renderizado ---
  if (loading) return <p>Cargando horario...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!horario) return <p>Horario no encontrado.</p>;

  return (
    <div>
      {/* Botón para volver al curso */}
      <Link to={`/cursos/${horario.curso}`}>&larr; Volver al curso</Link>
      
      <h1>Gestión de Mesas</h1>
      <h2>Horario: {horario.dia === 'MIE' ? 'Miércoles' : 'Domingo'} a las {horario.hora}</h2>

      {/* --- Formulario de Creación de Mesa --- */}
      <form onSubmit={handleSubmit} style={formStyle}>
        <h3>Añadir Nueva Mesa</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div>
            <label htmlFor="facilitador">* Facilitador:</label>
            <select id="facilitador" name="facilitador" value={formData.facilitador} onChange={handleInputChange} style={inputStyle} required>
              <option value="">-- Selecciona un facilitador --</option>
              {facilitadores.map(facil => (
                <option key={facil.id} value={facil.id}>
                  {facil.first_name} {facil.last_name} ({facil.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nombre_mesa">Nombre de la Mesa (Opcional):</label>
            <input type="text" id="nombre_mesa" name="nombre_mesa" value={formData.nombre_mesa} onChange={handleInputChange} style={inputStyle} />
          </div>
          <button type="submit" style={buttonStyle}>Crear Mesa</button>
        </div>
        {formError && <p style={errorStyle}>{formError}</p>}
      </form>

      <hr />

      {/* --- Lista de Mesas Existentes --- */}
      <h2>Mesas en este Horario</h2>
      {mesas.length === 0 ? (
        <p>No hay mesas registradas para este horario.</p>
      ) : (
        <div>
          {mesas.map(mesa => (
            <div key={mesa.id} style={cardStyle}>
              <strong>{mesa.nombre_mesa || `Mesa ID: ${mesa.id}`}</strong>
              {/* Ahora accedemos a las propiedades del objeto */}
              <p>
                Facilitador: {mesa.facilitador.first_name} {mesa.facilitador.last_name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}