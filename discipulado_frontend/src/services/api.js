// En src/services/api.js

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- AÑADIR ESTO ---
// Interceptor de Petición (Request Interceptor)
// Esto se ejecuta ANTES de que cada petición sea enviada.
apiClient.interceptors.request.use(
  (config) => {
    // 1. Obtiene el token de localStorage
    const token = localStorage.getItem('authToken');
    
    // 2. Si el token existe, lo añade a la cabecera 'Authorization'
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// ---

export default apiClient;