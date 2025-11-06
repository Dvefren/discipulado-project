// En src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext' // <-- 1. Importar

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* <-- 2. Envolver la App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)