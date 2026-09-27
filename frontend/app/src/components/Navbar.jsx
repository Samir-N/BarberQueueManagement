import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  useMediaQuery, 
  useTheme, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider 
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/features/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "./Button";

import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem('token');
    setMobileOpen(false);
    navigate('/barber/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const dashboardPath = user?.role === 'admin' ? '/barber/dashboard' : '/user/dashboard';

  // Dynamic active page title for mobile navbar header
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === dashboardPath) return 'Dashboard';
    if (location.pathname === '/barber/login') return 'Log In';
    if (location.pathname === '/barber/register') return 'Register';
    return 'Barber App';
  };

  // Mobile Drawer Navigation Content
  const drawerContent = (
    <Box 
      sx={{ 
        width: 280, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        backgroundColor: '#FFC300', // Golden Yellow
        color: '#0F172A',
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
        }}
      >
        <Typography sx={{ fontSize: '18px', fontWeight: 100, color: '#0F172A', letterSpacing: '-0.01em' }}>
          Barber App
        </Typography>
        <IconButton onClick={handleDrawerToggle} edge="end" sx={{ color: '#0F172A' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Navigation Links */}
      <List sx={{ pt: 1, flexGrow: 1 }}>
        {user && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation('/')}
                selected={isActive('/')}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(15, 23, 42, 0.12)',
                    '& .MuiListItemIcon-root': { color: '#0F172A' },
                    '& .MuiTypography-root': { fontWeight: 100, color: '#0F172A' },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(15, 23, 42, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#0F172A' }}>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" primaryTypographyProps={{ fontSize: '15px', fontWeight: 100, color: '#0F172A' }} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(dashboardPath)}
                selected={isActive(dashboardPath)}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(15, 23, 42, 0.12)',
                    '& .MuiListItemIcon-root': { color: '#0F172A' },
                    '& .MuiTypography-root': { fontWeight: 100, color: '#0F172A' },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(15, 23, 42, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#0F172A' }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: '15px', fontWeight: 100, color: '#0F172A' }} />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.12)' }} />

      {/* Auth Actions */}
      <Box sx={{ p: 2.5 }}>
        {user ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            sx={{ fontWeight: 100, fontSize: '15px' }}
          >
            <LogoutIcon sx={{ fontSize: '18px', mr: 1 }} />
            Log Out
          </Button>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => handleNavigation('/barber/register')}
              sx={{ 
                width: '100%', 
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#0F172A',
                border: '1px solid #0F172A',
                fontWeight: 100,
                fontSize: '15px'
              }}
            >
              <AppRegistrationIcon sx={{ fontSize: '18px', mr: 1 }} />
              Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleNavigation('/barber/login')}
              sx={{ 
                width: '100%', 
                justifyContent: 'center',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 100,
                fontSize: '15px',
                '&:hover': { backgroundColor: '#1E293B' },
              }}
            >
              <LoginIcon sx={{ fontSize: '18px', mr: 1 }} />
              Log In
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  // Mobile Top Bar
  if (isMobile) {
    return (
      <>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            zIndex: 1100,
          }}
        >
          <Typography
            onClick={() => handleNavigation('/')}
            sx={{
              fontSize: '18px',
              fontWeight: 100,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              cursor: 'pointer',
            }}
          >
            {getPageTitle()}
          </Typography>

          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
          >
            <MenuIcon sx={{ color: '#0F172A' }} />
          </IconButton>
        </Box>

        {/* Golden Drawer Container */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              backgroundColor: '#FFC300',
              boxShadow: '-4px 0px 16px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </>
    );
  }

  // Desktop Navigation
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 4 },
        zIndex: 1100,
      }}
    >
      <Typography
        onClick={() => navigate('/')}
        sx={{
          fontSize: '22px',
          fontWeight: 100,
          color: '#0F172A',
          letterSpacing: '-0.02em',
          cursor: 'pointer',
          '&:hover': { color: '#334155' },
        }}
      >
        Barber App
      </Typography>

      {user && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => navigate('/')}
            sx={{
              border: 'none',
              color: isActive('/') ? '#0F172A' : '#64748B',
              fontWeight: 100,
              fontSize: '17px',
              position: 'relative',
              px: 2,
              '&:hover': {
                backgroundColor: '#F8FAFC',
                transform: 'none',
                boxShadow: 'none',
              },
              '&::after': isActive('/') ? {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '3px',
                backgroundColor: '#FFC300',
                borderRadius: '2px 2px 0 0',
              } : {},
            }}
          >
            Home
          </Button>

          <Button
            variant="tertiary"
            size="sm"
            onClick={() => navigate(dashboardPath)}
            sx={{
              border: 'none',
              color: isActive(dashboardPath) ? '#0F172A' : '#64748B',
              fontWeight: 100,
              fontSize: '17px',
              position: 'relative',
              px: 2,
              '&:hover': {
                backgroundColor: '#F8FAFC',
                transform: 'none',
                boxShadow: 'none',
              },
              '&::after': isActive(dashboardPath) ? {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '3px',
                backgroundColor: '#FFC300',
                borderRadius: '2px 2px 0 0',
              } : {},
            }}
          >
            Dashboard
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {user ? (
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleLogout}
            sx={{ fontWeight: 100, fontSize: '16px' }}
          >
            <LogoutIcon sx={{ fontSize: '20px' }} />
            Log Out
          </Button>
        ) : (
          <>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => navigate('/barber/register')}
              sx={{ fontWeight: 100, fontSize: '16px' }}
            >
              <AppRegistrationIcon sx={{ fontSize: '20px' }} />
              Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/barber/login')}
              sx={{ fontWeight: 100, fontSize: '16px' }}
            >
              <LoginIcon sx={{ fontSize: '20px' }} />
              Log In
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Navbar;