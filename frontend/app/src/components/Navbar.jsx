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
    setMobileOpen((prev) => !prev);
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
  const dashboardPath = user?.role === 'barber' ? '/barber/dashboard' : '/user/dashboard';

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === dashboardPath) return 'Dashboard';
    if (location.pathname === '/barber/login') return 'Log In';
    if (location.pathname === '/barber/register') return 'Register';
    return 'Barber App';
  };

  // FULL SCREEN MOBILE DRAWER CONTENT
  const drawerContent = (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#FFC300',
        color: '#0F172A',
        p: 3,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
        }}
      >
        <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#0F172A' }}>
          Barber App
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: '#0F172A' }}>
          <CloseIcon sx={{ fontSize: '28px' }} />
        </IconButton>
      </Box>

      {/* Nav Links */}
      <List sx={{ pt: 2, flexGrow: 1 }}>
        {user && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation('/')}
                selected={isActive('/')}
                sx={{
                  py: 1.8,
                  px: 2,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(15, 23, 42, 0.12)',
                    '& .MuiListItemIcon-root, & .MuiTypography-root': { color: '#0F172A', fontWeight: 600 },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 44, color: '#0F172A' }}>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" primaryTypographyProps={{ fontSize: '16px' }} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mt: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(dashboardPath)}
                selected={isActive(dashboardPath)}
                sx={{
                  py: 1.8,
                  px: 2,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(15, 23, 42, 0.12)',
                    '& .MuiListItemIcon-root, & .MuiTypography-root': { color: '#0F172A', fontWeight: 600 },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 44, color: '#0F172A' }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: '16px' }} />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.12)', my: 2 }} />

      {/* Auth Buttons */}
      <Box sx={{ pb: 2 }}>
        {user ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            sx={{ width: '100%', justifyContent: 'center', fontSize: '16px', py: 1.2 }}
          >
            <LogoutIcon sx={{ fontSize: '20px', mr: 1 }} />
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
                fontSize: '16px',
                py: 1.2
              }}
            >
              <AppRegistrationIcon sx={{ fontSize: '20px', mr: 1 }} />
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
                fontSize: '16px',
                py: 1.2,
              }}
            >
              <LoginIcon sx={{ fontSize: '20px', mr: 1 }} />
              Log In
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  // MOBILE TOP BAR
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
            px: 2,
            zIndex: 1100,
          }}
        >
          {/* Page Title Far Left */}
          <Typography
            onClick={() => handleNavigation('/')}
            sx={{ fontSize: '18px', fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}
          >
            {getPageTitle()}
          </Typography>

          {/* Hamburger Locked to Far Right via ml: 'auto' */}
          <IconButton 
            onClick={handleDrawerToggle} 
            sx={{ ml: 'auto', color: '#0F172A', p: 1 }}
          >
            <MenuIcon sx={{ fontSize: '28px' }} />
          </IconButton>
        </Box>

        {/* Drawer Anchor Set to Right */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: '100%',
              height: '100%',
              backgroundColor: '#FFC300',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </>
    );
  }

  // DESKTOP TOP BAR
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
        px: { xs: 2, md: 4 },
        zIndex: 1100,
      }}
    >
      {/* Left Column (Logo) */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Typography
          onClick={() => navigate('/')}
          sx={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            cursor: 'pointer',
            '&:hover': { color: '#334155' },
          }}
        >
          Barber App
        </Typography>
      </Box>

      {/* Middle Column (Center Links) */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 1.5 }}>
        {user && (
          <>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => navigate('/')}
              sx={{
                border: 'none',
                color: isActive('/') ? '#0F172A' : '#64748B',
                fontWeight: 500,
                fontSize: '16px',
                position: 'relative',
                px: 2,
                '&::after': isActive('/') ? {
                  content: '""',
                  position: 'absolute',
                  bottom: -12,
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
                fontWeight: 500,
                fontSize: '16px',
                position: 'relative',
                px: 2,
                '&::after': isActive(dashboardPath) ? {
                  content: '""',
                  position: 'absolute',
                  bottom: -12,
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
          </>
        )}
      </Box>

      {/* Right Column (Auth Buttons) */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        {user ? (
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleLogout}
            sx={{ fontWeight: 500, fontSize: '16px' }}
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
              sx={{ fontWeight: 500, fontSize: '16px' }}
            >
              <AppRegistrationIcon sx={{ fontSize: '20px' }} />
              Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/barber/login')}
              sx={{ fontWeight: 500, fontSize: '16px' }}
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