import { useEffect, useRef } from 'react';
import axios from 'axios';
import Booking from '../components/Booking';
import Button from '../components/Button';
import WaitingList from '../components/WaitingList';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/features/authSlice';
import { toggleBooking, hideBooking } from '../redux/features/bookingSlice';
import { showLoading, hideLoading } from '../redux/features/alertSlice';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ListAltIcon from '@mui/icons-material/ListAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        dispatch(
          setUser({
            user: response.data.data,
          })
        );
      } else {
        localStorage.removeItem('token');
        navigate('/barber/login');
      }
      dispatch(hideLoading());
    } catch (error) {
      dispatch(hideLoading());
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/barber/login');
      }
    }
  };

  useEffect(() => {
    if (!user) {
      getUserData();
    }
  }, []);

  useEffect(() => {
    return () => {
      dispatch(hideBooking());
    };
  }, [dispatch]);

  const handleScrollToWaitingList = () => {
    waitingListRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Hero Section */}
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Header Content */}
            <Box sx={{ mb: 4, maxWidth: '800px' }}>
              <Typography
                sx={{
                  fontSize: { xs: '46px', sm: '62px', md: '74px' },
                  lineHeight: { xs: '44px', sm: '60px', md: '72px' },
                  fontWeight: 300,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  mb: 1.5,
                }}
              >
                Welcome{user?.name ? `, ${user.name}` : ''}
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: '15px', sm: '18px' },
                  lineHeight: { xs: '22px', sm: '28px' },
                  fontWeight: 400,
                  color: '#475569',
                  maxWidth: '560px',
                  mx: 'auto',
                }}
              >
                {user?.role === 'user'
                  ? 'Book your appointment in seconds. Select your preferred service.'
                  : 'Manage daily schedules, barber queues, and client appointments.'}
              </Typography>
            </Box>

            {/* Action CTA & Scroll Indicator Container */}
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2.5,
              }}
            >
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

              {/* Scroll Trigger: "View live list" */}
              <Box
                onClick={handleScrollToWaitingList}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  color: '#64748B',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  '&:hover': {
                    color: '#0F172A',
                    transform: 'translateY(2px)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                  }}
                >
                  View waiting list
                </Typography>
                <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Live Queue / Waiting List Section */}
      <Container
        ref={waitingListRef}
        maxWidth="lg"
        sx={{ pb: { xs: 8, md: 10 }, px: { xs: 2, sm: 3 } }}
      >
        <WaitingList />
      </Container>
    </Box>
  );
};

export default Home;