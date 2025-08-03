// components/MainLayout.tsx
import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Button } from '@mui/material';
import { Home, BarChart, LibraryBooks, Settings, People, Payment, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProtectedComponent from './common/ProtectedComponent';

const drawerWidth = 240;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Dashboard', icon: <Home />, path: '/' },
    { text: 'Content Library', icon: <LibraryBooks />, path: '/content-library' },
    { text: 'Analytics', icon: <BarChart />, path: '/analytics' },
    { text: 'Team', icon: <People />, path: '/team' },
    { text: 'Billing', icon: <Payment />, path: '/billing' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            ContentCraft
          </Typography>
        </Toolbar>
        <ProtectedComponent allowedRoles={['Admin', 'Editor']}>
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Add />}
              onClick={() => navigate('/new-post')}
            >
              New Post
            </Button>
          </Box>
        </ProtectedComponent>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
