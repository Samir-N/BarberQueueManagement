// Home.jsx
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Container, CircularProgress } from '@mui/material';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ListAltIcon from '@mui/icons-material/ListAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import Booking from '../components/Booking';
import Button from '../components/Button';
import WaitingList from '../components/WaitingList';
import { RoleGuard } from '../components/RoleGuard';

import { setUser } from '../redux/features/authSlice';
import { toggleBooking, hideBooking } from '../redux/features/bookingSlice';
import { showLoading, hideLoading } from '../redux/features/alertSlice';


const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const waitingListRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { isVisible } = useSelector((state) => state.booking);
  const { loading } = useSelector((state) => state.alerts || {});

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
    if (!user) getUserData();
  }, []);

  useEffect(() => {
    return () => dispatch(hideBooking());
  }, [dispatch]);

  const handleScrollToWaitingList = () => {
    waitingListRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Prevent UI flashing before user data loads
  if (!user && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <Box
        sx={{
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          py: 6,
          maxWidth: '1200px',
          mx: 'auto',
          position: 'relative',
        }}
      >
        {isVisible ? (
          <Booking />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
            <Box sx={{ mb: 4, maxWidth: '800px' }}>
              <Typography sx={{ fontSize: { xs: '46px', sm: '62px', md: '74px' }, fontWeight: 300, color: '#0F172A', mb: 1.5 }}>
                Welcome{user?.name ? `, ${user.name}` : ''}
              </Typography>

              <Typography sx={{ fontSize: { xs: '15px', sm: '18px' }, color: '#475569', maxWidth: '560px', mx: 'auto' }}>
                {user?.role === 'user'
                  ? 'Book your appointment in seconds. Select your preferred service.'
                  : 'Manage daily schedules, barber queues, and client appointments.'}
              </Typography>
            </Box>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
              {user?.role === 'user' ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => dispatch(toggleBooking())}
                  className="w-full max-w-[320px] gap-2 shadow-sm hover:shadow transition-all"
                >
                  <CalendarTodayIcon className="!text-[18px]" />
                  Book an Appointment
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/barber/dashboard')}
                  className="w-full max-w-[320px] gap-2 shadow-sm hover:shadow transition-all"
                >
                  <ListAltIcon className="!text-[18px]" />
                  Manage Bookings
                </Button>
              )}

              <RoleGuard allowedRoles={["user"]}>
                <Box
                  onClick={handleScrollToWaitingList}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    color: '#64748B',
                    '&:hover': { color: '#0F172A', transform: 'translateY(2px)' },
                  }}
                >
                  <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                    View waiting list
                  </Typography>
                  <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
                </Box>
              </RoleGuard>
            </Box>
          </Box>
        )}
      </Box>

        <RoleGuard allowedRoles={["user"]}>
      <Container ref={waitingListRef} maxWidth="lg" sx={{ pb: { xs: 8, md: 10 }, px: { xs: 2, sm: 3 } }}>
        <WaitingList />
      </Container>
      </RoleGuard>
    </Box>
  );
};

export default Home;