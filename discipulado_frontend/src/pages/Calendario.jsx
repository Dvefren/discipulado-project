// En src/pages/Calendario.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// (Estilos)
const cardStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  padding: '15px',
  marginBottom: '10px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '15px', // Espacio entre el día y el nombre
};

const dayStyle = {
  fontSize: '1.5em',
  fontWeight: 'bold',
  color: '#007bff',
  minWidth: '40px',
  textAlign: 'center',
};
// ---

export default function Calendario() {
  const [cumpleaneros, setCumpleaneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Obtenemos el nombre del mes actual ---
  const [nombreMes, setNombreMes] = useState('');
  useEffect(() => {
    // Obtenemos el nombre del mes actual en español
    const nombre = new Date().toLocaleString('es-ES', { month: 'long' });
    // Convertimos la primera letra a mayúscula
    setNombreMes(nombre.charAt(0).toUpperCase() + nombre.slice(1));
  }, []);
  // ---

  useEffect(() => {
    const fetchCumpleanos = async () => {
      try {
        setLoading(true);
        // 1. Llamamos a nuestro nuevo endpoint
        const response = await apiClient.get('/cumpleanos/');
        setCumpleaneros(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar cumpleaños:", err);
        setError("No se pudieron cargar los cumpleaños.");
      } finally {
        setLoading(false);
      }
    };

    fetchCumpleanos();
  }, []); // Se ejecuta solo una vez al cargar

  // --- Función para obtener solo el día ---
  const getDay = (fechaString) => {
    // fechaString es "YYYY-MM-DD"
    // Dividimos por el guion y tomamos la tercera parte (el día)
    // Usamos split en lugar de new Date() para evitar problemas de zona horaria
    try {
      return fechaString.split('-')[2];
    } catch {
      return '?';
    }
  };

  // --- Renderizado ---
  if (loading) {
    return <p>Cargando cumpleaños...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h1>🗓️ Cumpleaños de {nombreMes}</h1>
      
      {cumpleaneros.length === 0 ? (
        <p>Nadie cumple años este mes.</p>
      ) : (
        <div>
          {cumpleaneros.map((alumno) => (
            <div key={alumno.id} style={cardStyle}>
              <div style={dayStyle}>
                {getDay(alumno.fecha_nacimiento)}
              </div>
              <div>
                <strong>{alumno.nombres} {alumno.apellidos}</strong>
                <br />
                <small>Fecha: {alumno.fecha_nacimiento}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}