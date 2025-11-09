// En src/pages/Calendario.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// --- NUEVO: Importaciones de MUI ---
import {
  Box,
  Typography,
  Paper, // Usaremos Paper para las tarjetas
  Stack, // Para apilar la lista
} from '@mui/material';
// ---

export default function Calendario() {
  const [cumpleaneros, setCumpleaneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nombreMes, setNombreMes] = useState('');

  // --- (Lógica para obtener el nombre del mes - queda igual) ---
  useEffect(() => {
    const nombre = new Date().toLocaleString('es-ES', { month: 'long' });
    setNombreMes(nombre.charAt(0).toUpperCase() + nombre.slice(1));
  }, []);

  // --- (Lógica de fetchCumpleanos - queda igual) ---
  useEffect(() => {
    const fetchCumpleanos = async () => {
      try {
        setLoading(true);
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
  }, []);

  // --- (Lógica de getDay - queda igual) ---
  const getDay = (fechaString) => {
    try {
      return fechaString.split('-')[2];
    } catch {
      return '?';
    }
  };

  // --- RENDERIZADO (Aquí están los cambios) ---
  
  if (loading) {
    return <Typography>Cargando cumpleaños...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        🗓️ Cumpleaños de {nombreMes}
      </Typography>
      
      {cumpleaneros.length === 0 ? (
        <Typography>Nadie cumple años este mes.</Typography>
      ) : (
        <Stack spacing={2}> {/* Apila las tarjetas verticalmente */}
          {cumpleaneros.map((alumno) => (
            <Paper 
              key={alumno.id} 
              variant="outlined" 
              sx={{ 
                p: 2, // padding
                display: 'flex', 
                alignItems: 'center', 
                gap: 2 // Espacio entre el día y el nombre
              }}
            >
              {/* Estilo para el día (reemplaza dayStyle) */}
              <Typography 
                variant="h5" 
                component="div"
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'primary.main', // Color azul de MUI
                  minWidth: '40px', 
                  textAlign: 'center' 
                }}
              >
                {getDay(alumno.fecha_nacimiento)}
              </Typography>
              
              {/* Nombre y fecha */}
              <Box>
                <Typography variant="h6">
                  {alumno.nombres} {alumno.apellidos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fecha: {alumno.fecha_nacimiento}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}