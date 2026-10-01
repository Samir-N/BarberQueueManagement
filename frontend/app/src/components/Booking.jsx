import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Stack,
  Card,
  Chip,
  useMediaQuery,
} from "@mui/material";
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert, showLoading, hideLoading } from '../redux/features/alertSlice';
import { hideBooking } from '../redux/features/bookingSlice';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material/styles';
import TimeManager from '../components/TimeManager.jsx';
import { useNavigate } from "react-router-dom";


const Booking = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { services, loading: servicesLoading } = useSelector(state => state.service);
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (services.length > 0) {
      console.log('✅ Using services from Redux:', services.length, 'services');
    }
  }, [services]);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    service: "",
    time: dayjs().hour(8).minute(0).second(0),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bookingData = {
      service: formData.service,
      bookingTime: formData.time.toDate() ,
    };

    try {
      dispatch(showLoading());
      await axios.post('/api/v1/user/bookingInfo', bookingData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      dispatch(hideLoading());
      dispatch(showAlert({ message: 'Booking Successful!', type: 'success' }));
      setFormData({ service: "", time: dayjs() });
      setActiveStep(0);
      navigate('/user/dashboard');


    } catch (error) {
      dispatch(hideLoading());
      dispatch(showAlert({ message: 'Booking Failed!', type: 'error' }));
    } finally {
      dispatch(hideBooking());
    }
  };

  const selectedService = services.find(s => s._id === formData.service);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', px: 2 }}>
        <Typography sx={{ fontSize: '18px', color: '#6B7280' }}>Loading...</Typography>
      </Box>
    );
  }

  if (servicesLoading || services.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', px: 2 }}>
        <Typography sx={{ fontSize: '18px', color: '#6B7280' }}>Loading services...</Typography>
      </Box>
    );
  }

  const handleTimeSelect = (timeString) =>
  {

  const [t, modifier] = timeString.split(" "); // ["2:00", "PM"]
  let [hours, minutes] = t.split(":");

  if (modifier === "PM" && hours !== "12") hours = +hours + 12;
  if (modifier === "AM" && hours === "12") hours = 0;

  const newTime = dayjs().hour(hours).minute(minutes).second(0); 
    setFormData(prev => ({ ...prev, time:newTime }));
  }
  

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: 'calc(100vh - 64px)',
      py: { xs: 3, sm: 4 },
      px: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '600px' } }}>
        {/* Step 1: Select Service */}
        {activeStep === 0 && (
          <Card sx={{ 
            p: { xs: 3, sm: 4 },
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(27, 38, 59, 0.08)',
            backgroundColor: '#FFFFFF',
          }}>
            <Typography sx={{ 
              mb: 4,
              fontSize: { xs: '24px', sm: '28px' },
              lineHeight: { xs: '32px', sm: '36px' },
              fontWeight: 600,
              color: '#1B263B'
            }}>
              Select Service
            </Typography>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 2,
              mb: 4
            }}>
              {services.map(service => (
                <Box
                  key={service._id}
                  onClick={() => setFormData(prev => ({ ...prev, service: service._id }))}
                  sx={{
                    p: 3,
                    border: '2px solid',
                    borderColor: formData.service === service._id ? '#FFC300' : '#E5E7EB',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: formData.service === service._id ? '#FFF9E6' : '#FFFFFF',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: formData.service === service._id ? '#FFC300' : '#415A77',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(27, 38, 59, 0.12)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography sx={{ 
                      fontSize: { xs: '18px', sm: '20px' },
                      lineHeight: { xs: '24px', sm: '28px' },
                      fontWeight: 600,
                      color: '#1B263B',
                      flex: 1,
                    }}>
                      {service.serviceName}
                    </Typography>
                    {formData.service === service._id && (
                      <CheckCircleIcon sx={{ color: '#FFC300', fontSize: '28px', ml: 1 }} />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography sx={{ 
                      fontSize: { xs: '24px', sm: '28px' },
                      fontWeight: 700,
                      color: '#1B263B'
                    }}>
                      Rs. {service.price}
                    </Typography>
                    <Chip
                      icon={<AccessTimeIcon sx={{ fontSize: '16px !important' }} />}
                      label={`${service.duration} min`}
                      sx={{
                        backgroundColor: '#F9F9F6',
                        color: '#1B263B',
                        fontWeight: 600,
                        fontSize: '14px',
                        height: '32px',
                        border: '1px solid #E5E7EB',
                        '& .MuiChip-icon': {
                          color: '#6B7280',
                        }
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setActiveStep(1)}
                disabled={!formData.service}
                sx={{ 
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#FFC300',
                  color: '#222222',
                  minHeight: '48px',
                  boxShadow: '0 4px 12px rgba(255, 195, 0, 0.3)',
                  '&:hover': {
                    backgroundColor: '#E6B000',
                    boxShadow: '0 6px 16px rgba(255, 195, 0, 0.4)',
                  },
                  '&:disabled': {
                    backgroundColor: '#E5E7EB',
                    color: '#9CA3AF',
                  }
                }}
              >
                Continue
                <ArrowForwardIcon sx={{ ml: 1, fontSize: '20px' }} />
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => dispatch(hideBooking())}
                sx={{ 
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#1B263B',
                  borderColor: '#415A77',
                  minHeight: '48px',
                  '&:hover': {
                    borderColor: '#1B263B',
                    backgroundColor: '#F9F9F6',
                  }
                }}
              >
                <ArrowBackIcon sx={{ mr: 1, fontSize: '20px' }} />
                Back to Home
              </Button>
            </Stack>
          </Card>
        )}

        {/* Step 2: Choose Time */}
        {activeStep === 1 && (
          <Card sx={{ 
            p: { xs: 3, sm: 4 },
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(27, 38, 59, 0.08)',
            backgroundColor: '#FFFFFF',
          }}>
            <Typography sx={{ 
              mb: 4,
              fontSize: { xs: '24px', sm: '28px' },
              lineHeight: { xs: '32px', sm: '36px' },
              fontWeight: 600,
              color: '#1B263B'
            }}>
              Select Time
            </Typography>

            <Box sx={{ 
              mb: 4, 
              p: 3, 
              backgroundColor: '#F9F9F6',
              borderRadius: '12px',
              border: '2px solid #E5E7EB'
            }}>
              <Typography sx={{ 
                fontSize: '12px', 
                color: '#6B7280', 
                fontWeight: 600, 
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Selected Time
              </Typography>
              <Typography sx={{ 
                fontSize: { xs: '32px', sm: '40px' },
                fontWeight: 700, 
                color: '#1B263B',
                lineHeight: 1,
              }}>
                {formData.time.format('hh:mm A')}
              </Typography>
            </Box>

            <TimeManager onTimeSelect ={handleTimeSelect}  />

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setActiveStep(2)}
                sx={{ 
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#FFC300',
                  color: '#222222',
                  minHeight: '48px',
                  boxShadow: '0 4px 12px rgba(255, 195, 0, 0.3)',
                  '&:hover': {
                    backgroundColor: '#E6B000',
                    boxShadow: '0 6px 16px rgba(255, 195, 0, 0.4)',
                  }
                }}
              >
                Continue
                <ArrowForwardIcon sx={{ ml: 1, fontSize: '20px' }} />
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{ 
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#1B263B',
                  borderColor: '#415A77',
                  minHeight: '48px',
                  '&:hover': {
                    borderColor: '#1B263B',
                    backgroundColor: '#F9F9F6',
                  }
                }}
              >
                <ArrowBackIcon sx={{ mr: 1, fontSize: '20px' }} />
                Back
              </Button>
            </Stack>
          </Card>
        )}

        {/* Step 3: Review & Confirm */}
        {activeStep === 2 && selectedService && (
          <Card
  sx={{
    maxWidth: 880,
    p: { xs: 2.5, sm: 3.5 },
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 12px rgba(27, 38, 59, 0.08)',
    backgroundColor: '#FFFFFF',
  }}
>
  <Typography
    sx={{
      mb: 3,
      fontSize: { xs: '22px', sm: '24px' },
      lineHeight: { xs: '28px', sm: '32px' },
      fontWeight: 600,
      color: '#1B263B',
    }}
  >
    Confirm Booking
  </Typography>

  <Box
    sx={{
      mb: 3,
      p: { xs: 2.5, sm: 3 },
      backgroundColor: '#F9F9F6',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
    }}
  >
    <Stack spacing={2.5}>
      <Box>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#6B7280',
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Service
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '18px', sm: '20px' },
            lineHeight: { xs: '24px', sm: '28px' },
            fontWeight: 600,
            color: '#1B263B',
          }}
        >
          {selectedService.serviceName}
        </Typography>
      </Box>

      <Box sx={{ height: '1px', backgroundColor: '#E5E7EB' }} />

      <Box>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#6B7280',
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Total Amount
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '32px', sm: '38px' },
            fontWeight: 700,
            color: '#1B263B',
            lineHeight: 1,
          }}
        >
          Rs. {selectedService.price}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Duration
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              lineHeight: '22px',
              fontWeight: 600,
              color: '#1B263B',
            }}
          >
            {selectedService.duration} min
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Time
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              lineHeight: '22px',
              fontWeight: 600,
              color: '#1B263B',
            }}
          >
            {formData.time.format('hh:mm A')}
          </Typography>
        </Box>
      </Box>
    </Stack>
  </Box>

  <Stack spacing={1.5}>
    <Button
      fullWidth
      variant="contained"
      onClick={handleSubmit}
      sx={{
        py: 1.5,
        fontSize: '15px',
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: '8px',
        backgroundColor: '#FFC300',
        color: '#222222',
        minHeight: '44px',
        boxShadow: '0 4px 12px rgba(255, 195, 0, 0.3)',
        '&:hover': {
          backgroundColor: '#E6B000',
          boxShadow: '0 6px 16px rgba(255, 195, 0, 0.4)',
        },
      }}
    >
      Confirm Booking
    </Button>
    <Button
      fullWidth
      variant="outlined"
      onClick={() => setActiveStep(1)}
      sx={{
        py: 1.25,
        fontSize: '15px',
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: '8px',
        color: '#1B263B',
        borderColor: '#415A77',
        minHeight: '44px',
        '&:hover': {
          borderColor: '#1B263B',
          backgroundColor: '#F9F9F6',
        },
      }}
    >
      <ArrowBackIcon sx={{ mr: 1, fontSize: '18px' }} />
      Back
    </Button>
  </Stack>
</Card>
        )}
      </Box>
    </Box>
  );
};

export default Booking;
