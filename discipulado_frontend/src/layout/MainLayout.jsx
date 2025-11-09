// En src/layout/MainLayout.jsx

import React from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- Importaciones de MUI ---
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button'; // Para el botón de logout

// --- Importaciones de Iconos ---
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChecklistIcon from '@mui/icons-material/Checklist';
// ---

const drawerWidth = 260; // Ancho del sidebar

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation(); // Para saber qué página está activa

  const userRole = user ? user.role : null;

  // Lista de todos los items de navegación
  const navItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/', roles: ['ADMIN', 'FACILITADOR'] },
    { text: 'Alumnos', icon: <PeopleIcon />, path: '/alumnos', roles: ['ADMIN', 'FACILITADOR'] },
    { text: 'Calendario', icon: <CalendarMonthIcon />, path: '/calendario', roles: ['ADMIN', 'FACILITADOR'] },
    { text: 'Asistencia', icon: <ChecklistIcon />, path: '/asistencia', roles: ['FACILITADOR'] },
    { text: 'Cursos', icon: <SchoolIcon />, path: '/cursos', roles: ['ADMIN'] },
    { text: 'Facilitadores', icon: <CoPresentIcon />, path: '/facilitadores', roles: ['ADMIN'] },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 1. Resetea los estilos CSS */}
      <CssBaseline />
      
      {/* 2. La Barra Superior (AppBar) */}
      <AppBar 
        position="fixed" 
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} // Se pone por encima del sidebar
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div">
            Discipulado
          </Typography>
          <div>
            <Typography variant="body2" component="span" sx={{ marginRight: 2 }}>
              {user.first_name || user.username}
            </Typography>
            <Button color="red" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </Toolbar>
      </AppBar>
      
      {/* 3. El Sidebar (Drawer) */}
      <Drawer
        variant="permanent" // Siempre visible
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> {/* Un espacio vacío para que el contenido empiece debajo del AppBar */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              // Filtramos los items basado en el rol del usuario
              item.roles.includes(userRole) && (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={RouterLink} // Usamos el Link de React Router
                    to={item.path}
                    selected={location.pathname === item.path} // Se resalta el item activo
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )
            ))}
          </List>
        </Box>
      </Drawer>
      
      {/* 4. El Contenido Principal de la Página */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Otro espacio para que el contenido empiece debajo del AppBar */}
        
        {/* Aquí es donde se renderizan las páginas (Dashboard, Cursos, etc.) */}
        <Outlet /> 
      </Box>
    </Box>
  );
}