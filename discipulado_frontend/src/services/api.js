// En src/services/api.js

import axios from 'axios';

// 1. Mover la URL base a una constante
const baseURL = 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Petición (Request Interceptor)
// (Este ya lo teníamos, envía el token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 2. AÑADIR INTERCEPTOR DE RESPUESTA (Response Interceptor) ---
// Esto se ejecuta DESPUÉS de recibir una respuesta

// Bandera para evitar bucles infinitos de refresco
let isRefreshing = false;

apiClient.interceptors.response.use(
  // Si la respuesta es OK (2xx), solo devuélvela
  (response) => {
    return response;
  },
  // Si la respuesta es un ERROR (4xx, 5xx)
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refreshToken');

    // 3. Comprobar si es un 401, si tenemos refresh token y si no estamos ya refrescando
    if (error.response.status === 401 && refreshToken && !isRefreshing) {
      isRefreshing = true; // Marcar que estamos refrescando

      try {
        // 4. Pedir un nuevo token de acceso
        const refreshResponse = await axios.post(`${baseURL}/token/refresh/`, {
          refresh: refreshToken
        });

        const newAccessToken = refreshResponse.data.access;
        // (Algunas configuraciones de Django también devuelven un nuevo refresh token)
        // const newRefreshToken = refreshResponse.data.refresh;

        // 5. Actualizar el token en localStorage
        localStorage.setItem('authToken', newAccessToken);
        // if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        // 6. Actualizar la cabecera de la petición original
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        isRefreshing = false; // Terminar refresco
        
        // 7. Reintentar la petición original con el nuevo token
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error("No se pudo refrescar el token", refreshError);
        isRefreshing = false;
        
        // 8. Si el refresco falla, limpiar todo y forzar logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        
        // Redirigir a login (la forma más segura)
        window.location.href = '/login'; 
        
        return Promise.reject(refreshError);
      }
    }

    // Para cualquier otro error, solo rechazar la promesa
    return Promise.reject(error);
  }
);

export default apiClient;