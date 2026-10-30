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
  ListItemText, 
  ListItemIcon, 
  Divider 
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/features/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import Button from "./Button";
import { RoleGuard } from './RoleGuard';

import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const harvardKeyframes = {
  '@keyframes harvardDrawerFade': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  '@keyframes harvardTextSlide': {
    '0%': { opacity: 0, transform: 'translateY(-24px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
};

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

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/user/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout failed on server", error);
    } finally {
      dispatch(clearUser());
      setMobileOpen(false);
      navigate('/barber/login');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const dashboardPath = user?.role === 'barber' ? '/barber/dashboard' : '/user/dashboard';

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
        animation: 'harvardDrawerFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        ...harvardKeyframes,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
          animation: 'harvardTextSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both',
        }}
      >
        <Typography 
          onClick={() => handleNavigation('/')}
          sx={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
        >
          Barber App
        </Typography>
        <IconButton 
          onClick={handleDrawerToggle} 
          sx={{ 
            color: '#0F172A',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': { transform: 'rotate(90deg) scale(1.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '28px' }} />
        </IconButton>
      </Box>

      <List sx={{ pt: 2, flexGrow: 1 }}>
        {user && (
          <>
            <ListItem 
              disablePadding 
              sx={{ animation: 'harvardTextSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both' }}
            >
              <ListItemButton
                onClick={() => handleNavigation('/')}
                selected={isActive('/')}
                sx={{
                  py: 1.8,
                  px: 2,
                  borderRadius: 1.5,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.08)' },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(15, 23, 42, 0.15)',
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

            <ListItem 
              disablePadding 
              sx={{ mt: 1, animation: 'harvardTextSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both' }}
            >
              <ListItemButton
                onClick={() => handleNavigation(dashboardPath)}
                selected={isActive(dashboardPath)}
                sx={{
                  py: 1.8,
                  px: 2,
                  borderRadius: 1.5,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.08)' },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(15, 23, 42, 0.15)',
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

            <RoleGuard allowedRoles={['barber']}>
              <ListItem 
                disablePadding 
                sx={{ mt: 1, animation: 'harvardTextSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both' }}
              >
                <ListItemButton
                  onClick={() => handleNavigation('/barber/viewAnalytics')}
                  selected={isActive('/barber/viewAnalytics')}
                  sx={{
                    py: 1.8,
                    px: 2,
                    borderRadius: 1.5,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.08)' },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(15, 23, 42, 0.15)',
                      '& .MuiListItemIcon-root, & .MuiTypography-root': { color: '#0F172A', fontWeight: 600 },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 44, color: '#0F172A' }}>
                    <BarChartIcon />
                  </ListItemIcon>
                  <ListItemText primary="Analytics" primaryTypographyProps={{ fontSize: '16px' }} />
                </ListItemButton>
              </ListItem>
            </RoleGuard>
          </>
        )}
      </List>

      <Divider 
        sx={{ 
          borderColor: 'rgba(15, 23, 42, 0.12)', 
          my: 2, 
          animation: 'harvardTextSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' 
        }} 
      />

      <Box 
        sx={{ 
          pb: 2, 
          animation: 'harvardTextSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.36s both' 
        }}
      >
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
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#0F172A',
                border: '1px solid #0F172A',
                fontSize: '16px',
                py: 1.2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                '&:hover': { backgroundColor: '#FFFFFF' }
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
                boxShadow: '0 4px 6px rgba(15, 23, 42, 0.2)',
                '&:hover': { backgroundColor: '#1E293B' }
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

  // Mobile View
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
          <Box sx={{ maxWidth: '1280px', width: '100%', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              onClick={() => navigate('/')}
              sx={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
            >
              Barber App
            </Typography>

            <IconButton 
              onClick={handleDrawerToggle} 
              sx={{ 
                color: '#0F172A', 
                p: 1,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              <MenuIcon sx={{ fontSize: '28px' }} />
            </IconButton>
          </Box>
        </Box>

        <Drawer
          anchor="top"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          transitionDuration={{ enter: 400, exit: 300 }}
          ModalProps={{ 
            keepMounted: true,
            slotProps: {
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(8px)',
                  transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }
              }
            }
          }}
          PaperProps={{
            sx: {
              width: '100%',
              height: '100dvh',
              backgroundColor: '#FFC300',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              backgroundImage: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </>
    );
  }

  // Desktop View
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
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.03)',
        zIndex: 1100,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: '1280px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, md: 4 },
        }}
      >
        {/* Brand */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Typography
            onClick={() => navigate('/')}
            sx={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.025em',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              '&:hover': { color: '#334155' },
            }}
          >
            Barber App
          </Typography>
        </Box>

        {/* Nav Links */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
          {user && (
            <>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => navigate('/')}
                sx={{
                  border: 'none',
                  color: isActive('/') ? '#0F172A' : '#64748B',
                  fontWeight: isActive('/') ? 600 : 500,
                  fontSize: '15px',
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor: isActive('/') ? 'rgba(255, 195, 0, 0.15)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    backgroundColor: isActive('/') ? 'rgba(255, 195, 0, 0.22)' : 'rgba(15, 23, 42, 0.04)',
                    color: '#0F172A',
                  },
                }}
              >
                <HomeIcon sx={{ fontSize: '19px', color: isActive('/') ? '#0F172A' : 'inherit' }} />
                Home
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                onClick={() => navigate(dashboardPath)}
                sx={{
                  border: 'none',
                  color: isActive(dashboardPath) ? '#0F172A' : '#64748B',
                  fontWeight: isActive(dashboardPath) ? 600 : 500,
                  fontSize: '15px',
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor: isActive(dashboardPath) ? 'rgba(255, 195, 0, 0.15)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    backgroundColor: isActive(dashboardPath) ? 'rgba(255, 195, 0, 0.22)' : 'rgba(15, 23, 42, 0.04)',
                    color: '#0F172A',
                  },
                }}
              >
                <DashboardIcon sx={{ fontSize: '19px', color: isActive(dashboardPath) ? '#0F172A' : 'inherit' }} />
                Dashboard
              </Button>

              <RoleGuard allowedRoles={['barber']}>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => navigate('/barber/viewAnalytics')}
                  sx={{
                    border: 'none',
                    color: isActive('/barber/viewAnalytics') ? '#0F172A' : '#64748B',
                    fontWeight: isActive('/barber/viewAnalytics') ? 600 : 500,
                    fontSize: '15px',
                    px: 2.5,
                    py: 1,
                    borderRadius: '8px',
                    backgroundColor: isActive('/barber/viewAnalytics') ? 'rgba(255, 195, 0, 0.15)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1.25,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      backgroundColor: isActive('/barber/viewAnalytics') ? 'rgba(255, 195, 0, 0.22)' : 'rgba(15, 23, 42, 0.04)',
                      color: '#0F172A',
                    },
                  }}
                >
                  <BarChartIcon sx={{ fontSize: '19px', color: isActive('/barber/viewAnalytics') ? '#0F172A' : 'inherit' }} />
                  Analytics
                </Button>
              </RoleGuard>
            </>
          )}
        </Box>

        {/* Auth Actions */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          {user ? (
            <Button
              variant="tertiary"
              size="sm"
              onClick={handleLogout}
              sx={{
                fontWeight: 500,
                fontSize: '15px',
                px: 2,
                py: 1,
                borderRadius: '8px',
                color: '#64748B',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#EF4444',
                },
              }}
            >
              <LogoutIcon sx={{ fontSize: '19px' }} />
              Log Out
            </Button>
          ) : (
            <>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => navigate('/register')}
                sx={{
                  fontWeight: 500,
                  fontSize: '15px',
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px',
                  color: '#0F172A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.05)' },
                }}
              >
                <AppRegistrationIcon sx={{ fontSize: '19px' }} />
                Register
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/barber/login')}
                sx={{
                  fontWeight: 600,
                  fontSize: '15px',
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#1E293B',
                    boxShadow: '0 4px 6px rgba(15, 23, 42, 0.15)',
                  },
                }}
              >
                <LoginIcon sx={{ fontSize: '19px' }} />
                Log In
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Navbar;