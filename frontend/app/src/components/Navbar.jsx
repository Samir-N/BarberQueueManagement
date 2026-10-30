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
  Divider,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../redux/features/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Button from './Button';
import { RoleGuard } from './RoleGuard';

import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

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

/* Desktop nav links: simple neutral hover and active state */
const navLinkSx = (active) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1.25,
  border: 'none',
  boxShadow: 'none',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  px: 2.5,
  py: 1,
  fontSize: '15px',
  borderRadius: 0,
  fontWeight: 400,
  color: active ? '#0F172A' : '#64748B',
  backgroundColor: active ? 'rgba(15, 23, 42, 0.06)' : 'transparent',
  transition: `background-color 0.2s ease, color 0.2s ease`,
  '& svg': {
    fontSize: '19px',
    color: 'inherit',
  },
  '&:hover': {
    border: 'none',
    boxShadow: 'none',
    transform: 'none',
    color: '#0F172A',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  '&:active': {
    transform: 'none',
    backgroundColor: 'rgba(15, 23, 42, 0.09)',
  },
});

/* Mobile drawer items: slide on hover, navy bar when selected */
const drawerItemSx = {
  position: 'relative',
  overflow: 'hidden',
  py: 1.8,
  px: 2,
  borderRadius: 0,
  transition: `all 0.25s ${EASE}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '22%',
    bottom: '22%',
    width: '3px',
    borderRadius: '0 3px 3px 0',
    backgroundColor: '#0F172A',
    transform: 'scaleY(0)',
    transition: `transform 0.25s ${EASE}`,
  },
  '&:hover': {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    transform: 'translateX(4px)',
  },
  '&:active': {
    transform: 'translateX(2px) scale(0.98)',
  },
  '&.Mui-selected': {
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
    '&::before': { transform: 'scaleY(1)' },
    '& .MuiListItemIcon-root, & .MuiTypography-root': {
      color: '#0F172A',
      fontWeight: 500,
    },
  },
  '&.Mui-selected:hover': {
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
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
      console.error('Logout failed on server', error);
    } finally {
      dispatch(clearUser());
      setMobileOpen(false);
      navigate('/login');
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
        animation: `harvardDrawerFade 0.3s ${EASE} forwards`,
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
          animation: `harvardTextSlide 0.5s ${EASE} 0.05s both`,
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
            transition: `transform 0.25s ${EASE}`,
            '&:hover': { transform: 'rotate(90deg) scale(1.1)' },
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
              sx={{ animation: `harvardTextSlide 0.5s ${EASE} 0.12s both` }}
            >
              <ListItemButton
                onClick={() => handleNavigation('/')}
                selected={isActive('/')}
                sx={drawerItemSx}
              >
                <ListItemIcon sx={{ minWidth: 44, color: '#0F172A' }}>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" primaryTypographyProps={{ fontSize: '16px' }} />
              </ListItemButton>
            </ListItem>

            <ListItem
              disablePadding
              sx={{ mt: 1, animation: `harvardTextSlide 0.5s ${EASE} 0.18s both` }}
            >
              <ListItemButton
                onClick={() => handleNavigation(dashboardPath)}
                selected={isActive(dashboardPath)}
                sx={drawerItemSx}
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
                sx={{ mt: 1, animation: `harvardTextSlide 0.5s ${EASE} 0.24s both` }}
              >
                <ListItemButton
                  onClick={() => handleNavigation('/barber/viewAnalytics')}
                  selected={isActive('/barber/viewAnalytics')}
                  sx={drawerItemSx}
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
          animation: `harvardTextSlide 0.5s ${EASE} 0.3s both`,
        }}
      />

      <Box
        sx={{
          pb: 2,
          animation: `harvardTextSlide 0.5s ${EASE} 0.36s both`,
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
                '&:hover': { backgroundColor: '#FFFFFF', borderColor: '#0F172A' },
              }}
            >
              <AppRegistrationIcon sx={{ fontSize: '20px', mr: 1 }} />
              Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleNavigation('/login')}
              sx={{
                width: '100%',
                justifyContent: 'center',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '16px',
                py: 1.2,
                boxShadow: '0 4px 6px rgba(15, 23, 42, 0.2)',
                '&:hover': { backgroundColor: '#1E293B', transform: 'none' },
                '&:focus-visible': { outline: 'none' },
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
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            zIndex: 1100,
          }}
        >
          <Box
            sx={{
              maxWidth: '1280px',
              width: '100%',
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
                transition: `all 0.2s ${EASE}`,
                '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.05)' },
                '&:active': { backgroundColor: 'rgba(15, 23, 42, 0.09)' },
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
                  transition: `opacity 0.3s ${EASE}`,
                },
              },
            },
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
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
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
              fontWeight: 600,
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
                sx={navLinkSx(isActive('/'))}
              >
                <HomeIcon />
                Home
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                onClick={() => navigate(dashboardPath)}
                sx={navLinkSx(isActive(dashboardPath))}
              >
                <DashboardIcon />
                Dashboard
              </Button>

              <RoleGuard allowedRoles={['barber']}>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => navigate('/barber/viewAnalytics')}
                  sx={navLinkSx(isActive('/barber/viewAnalytics'))}
                >
                  <BarChartIcon />
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
                borderRadius: 0,
                color: '#64748B',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
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
                  borderRadius: 0,
                  color: '#0F172A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AppRegistrationIcon sx={{ fontSize: '19px' }} />
                Register
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
                sx={{
                  fontWeight: 600,
                  fontSize: '15px',
                  px: 2.5,
                  py: 1,
                  borderRadius: 0,
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
                    transform: 'none',
                  },
                  '&:focus-visible': {
                    outline: 'none',
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