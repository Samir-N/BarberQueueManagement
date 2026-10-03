import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Container, Paper, Stack } from '@mui/material';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import Booking from '../components/Booking';
import Button from '../components/Button';
import WaitingList from '../components/WaitingList';
import { RoleGuard } from '../components/RoleGuard';

import { setUser } from '../redux/features/authSlice';
import { toggleBooking, hideBooking } from '../redux/features/bookingSlice';
import { showLoading, hideLoading } from '../redux/features/alertSlice';
import Spinner from '../components/Spinner';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const waitingListRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { isVisible } = useSelector((state) => state.booking);

  const getUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/barber/login');
      return;
    }

    try {
      dispatch(showLoading());
      const response = await axios.post(
        '/api/v1/user/getUserData',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dispatch(setUser(response.data.data));
      } else {
        localStorage.removeItem('token');
        navigate('/barber/login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/barber/login');
      }
    } finally {
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    if (!user || !user.role) getUserData();
  }, []);

  useEffect(() => {
    return () => dispatch(hideBooking());
  }, [dispatch]);

  const handleScrollToWaitingList = () => {
    waitingListRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!user || !user.role) {
    return <Spinner />;
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        bgcolor: '#F8FAFC',
        py: { xs: 3, sm: 6 },
      }}
    >
      <Container maxWidth="sm">
        {isVisible ? (
          <Booking />
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              textAlign: 'center',
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#0F172A',
                mb: 2.5,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Welcome{user?.name ? `, ${user.name}` : ''}
            </Typography>

            <RoleGuard allowedRoles={['user']}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="center"
                alignItems="center"
                sx={{ width: '100%' }}
              >
                <Button
                  variant="primary"
                  onClick={() => dispatch(toggleBooking())}
                  className="w-full h-12 justify-center gap-2 text-sm font-semibold shadow-xs"
                >
                  <CalendarTodayIcon className="!text-[18px]" />
                  <span>Book Appointment</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => navigate('/user/dashboard')}
                  className="w-full h-12 justify-center gap-2 text-sm font-semibold shadow-xs"
                >
                  <DashboardIcon className="!text-[18px]" />
                  <span>Dashboard</span>
                </Button>
              </Stack>
            </RoleGuard>

            <RoleGuard allowedRoles={['barber']}>
              <Box sx={{ width: '100%' }}>
                <Button
                  variant="primary"
                  onClick={() => navigate('/barber/dashboard')}
                  className="w-full h-12 justify-center gap-2 text-sm font-semibold shadow-xs"
                >
                  <DashboardIcon className="!text-[18px]" />
                  <span>Barber Dashboard</span>
                </Button>
              </Box>
            </RoleGuard>

            <RoleGuard allowedRoles={['user']}>
              <Box
                onClick={handleScrollToWaitingList}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 2.5,
                  px: 2,
                  py: 0.7,
                  borderRadius: '20px',
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' },
                }}
              >
                <span>View Live Queue</span>
                <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
              </Box>
            </RoleGuard>
          </Paper>
        )}

        <RoleGuard allowedRoles={['user']}>
          <Box ref={waitingListRef}>
            <WaitingList />
          </Box>
        </RoleGuard>
      </Container>
    </Box>
  );
};

export default Home;