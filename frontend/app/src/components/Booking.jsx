import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Stack,
  Dialog,
  DialogContent,
  IconButton,
  Chip,
  Avatar,
  CircularProgress
} from "@mui/material";
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert, showLoading, hideLoading } from '../redux/features/alertSlice';
import { hideBooking } from '../redux/features/bookingSlice';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';

import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceIcon from '@mui/icons-material/Face';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import DryCleaningIcon from '@mui/icons-material/DryCleaning';

import TimeManager from '../components/TimeManager.jsx';
import { useNavigate } from "react-router-dom";

const Booking = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth || {});
  const { services = [], loading: servicesLoading } = useSelector(state => state.service || {});
  const { showBooking } = useSelector(state => state.booking || { showBooking: true });

  const [open, setOpen] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [barbers, setBarbers] = useState([]);
  const [barbersLoading, setBarbersLoading] = useState(false);

  const [formData, setFormData] = useState({
    service: "",
    barber: "",
    time: null,
    timeSelected: false,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchBarbers = async () => {
      try {
        setBarbersLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/barber/getAllBarbers', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (isMounted && res.data?.success) {
          setBarbers(res.data.data || res.data.barbers || []);
        }
      } catch (error) {
        console.error("Failed to fetch barbers:", error);
      } finally {
        if (isMounted) setBarbersLoading(false);
      }
    };

    fetchBarbers();

    return () => {
      isMounted = false;
    };
  }, []);

  const getServiceIcon = (serviceName = '') => {
    const name = serviceName.toLowerCase();
    
    if (name.includes('combo') || (name.includes('&') && name.includes('cut'))) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <ContentCutIcon sx={{ fontSize: '18px', color: '#D99B00' }} />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#D99B00' }}>+</span>
        </Box>
      );
    }
    if (name.includes('child') || name.includes('kid') || name.includes('boy')) {
      return <ChildCareIcon sx={{ fontSize: '22px', color: '#D99B00' }} />;
    }
    if (name.includes('shave') || name.includes('beard') || name.includes('gillette') || name.includes('razor')) {
      return <DryCleaningIcon sx={{ fontSize: '22px', color: '#D99B00' }} />;
    }
    if (name.includes('hair') || name.includes('cut') || name.includes('trim') || name.includes('adult')) {
      return <FaceIcon sx={{ fontSize: '22px', color: '#D99B00' }} />;
    }

    return <ContentCutIcon sx={{ fontSize: '22px', color: '#D99B00' }} />;
  };

  const handleClose = () => {
    setOpen(false);
    dispatch(hideBooking());
  
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.service || !formData.barber || !formData.time) {
      dispatch(showAlert({ message: 'Please complete all booking fields.', type: 'error' }));
      return;
    }

    const bookingData = {
      service: formData.service,
      barberId: formData.barber,
      bookingTime: formData.time ? formData.time.toISOString() : null,
    };

    try {
      dispatch(showLoading());
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/user/bookingInfo', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        dispatch(showAlert({ message: 'Booking Successful!', type: 'success' }));
        setFormData({ service: "", barber: "", time: null, timeSelected: false });
        setActiveStep(0);
        handleClose();
      } else {
        dispatch(showAlert({ message: res.data?.message || 'Booking Failed!', type: 'error' }));
      }
    } catch (error) {
      dispatch(showAlert({ message: error.response?.data?.message || 'Booking Failed!', type: 'error' }));
    } finally {
      dispatch(hideLoading());
    }
  };

  const selectedService = services.find(s => s._id === formData.service);
  const selectedBarber = barbers.find(b => b._id === formData.barber);

  const handleTimeSelect = (selectedTime) => {
    if (!selectedTime) return;

    let parsedTime = null;

    if (dayjs.isDayjs(selectedTime)) {
      parsedTime = selectedTime.second(0).millisecond(0);
    } else if (typeof selectedTime === 'string') {
      const hasMeridiem = /am|pm/i.test(selectedTime);
      if (hasMeridiem) {
        const [t, modifier] = selectedTime.trim().split(/\s+/);
        let [hours, minutes] = t.split(':').map(Number);

        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

        // FIX: zero the milliseconds so every user's 8:00 PM is the exact same value
        parsedTime = dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
      } else {
        parsedTime = dayjs(selectedTime).second(0).millisecond(0);
      }
    }

    if (parsedTime && parsedTime.isValid()) {
      setFormData(prev => ({ ...prev, time: parsedTime, timeSelected: true }));
    }
  };

  const handleSelectBarber = (barberId) => {
    setFormData(prev => ({
      ...prev,
      barber: barberId,
      time: null,
      timeSelected: false
    }));
  };

  if (!user || servicesLoading || services.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open && showBooking !== false}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
      maxWidth="sm"
      disableScrollLock={false}
      aria-labelledby="booking-dialog-title"
      sx={{ 
        zIndex: 1200,
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: { xs: 2, sm: 3 },
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Step {activeStep + 1} of 3
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#64748B' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent 
        sx={{ 
          p: '0 !important', 
          overflowY: 'auto !important',
          overflowX: 'hidden !important',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {/* Step 0: Select Service */}
        {activeStep === 0 && (
          <Box>
            <Typography sx={{ mb: 2, fontSize: { xs: '20px', sm: '22px' }, fontWeight: 700, color: '#1B263B' }}>
              Select Service
            </Typography>

            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                gap: 1.5, 
                mb: 3 
              }}
            >
              {services.map(service => (
                <Box
                  key={service._id}
                  onClick={() => setFormData(prev => ({ ...prev, service: service._id }))}
                  sx={{
                    p: 2,
                    border: '2px solid',
                    borderColor: formData.service === service._id ? '#FFC300' : '#E2E8F0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: formData.service === service._id ? '#FFFDF4' : '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: formData.service === service._id ? '#FFC300' : '#CBD5E1' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, backgroundColor: '#F8FAFC', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getServiceIcon(service.serviceName)}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1B263B', mb: 0.5 }}>
                        {service.serviceName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1B263B' }}>
                          Rs. {service.price}
                        </Typography>
                        <Chip
                          icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
                          label={`${service.duration}m`}
                          size="small"
                          sx={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600, fontSize: '11px', height: '20px' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  {formData.service === service._id && (
                    <CheckCircleIcon sx={{ color: '#D99B00', fontSize: '20px', ml: 1 }} />
                  )}
                </Box>
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={!formData.service}
              sx={{ py: 1.25, fontSize: '15px', fontWeight: 600, backgroundColor: '#FFC300', color: '#1B263B', borderRadius: '8px', boxShadow: 'none', '&:hover': { backgroundColor: '#E6AF00' } }}
            >
              Continue <ArrowForwardIcon sx={{ ml: 1, fontSize: '18px' }} />
            </Button>
          </Box>
        )}

        {/* Step 1: Select Barber & Time */}
        {activeStep === 1 && (
          <Box>
            <Typography sx={{ mb: 2, fontSize: { xs: '20px', sm: '22px' }, fontWeight: 700, color: '#1B263B' }}>
              Select Barber & Time
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569', mb: 1.5 }}>
                Choose Your Barber
              </Typography>

              {barbersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} sx={{ color: '#FFC300' }} />
                </Box>
              ) : barbers.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: '#64748B' }}>No barbers available.</Typography>
              ) : (
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, 
                    gap: 1.5 
                  }}
                >
                  {barbers.map(barber => {
                    const barberName = barber.name || `${barber.firstName || ''} ${barber.lastName || ''}`.trim() || 'Barber';
                    const isSelected = formData.barber === barber._id;

                    return (
                      <Box
                        key={barber._id}
                        onClick={() => handleSelectBarber(barber._id)}
                        sx={{
                          p: 1.5,
                          border: '2px solid',
                          borderColor: isSelected ? '#FFC300' : '#E2E8F0',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#FFFDF4' : '#FFFFFF',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: isSelected ? '#FFC300' : '#CBD5E1' }
                        }}
                      >
                        <Avatar 
                          src={barber.avatar || barber.image} 
                          sx={{ width: 42, height: 42, mb: 1, bgcolor: '#F1F5F9', color: '#D99B00' }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1B263B', lineHeight: 1.2 }}>
                          {barberName}
                        </Typography>
                        {isSelected && (
                          <CheckCircleIcon sx={{ color: '#D99B00', fontSize: '16px', mt: 0.5 }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569', mb: 1.5 }}>
              Choose Time Slot
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TimeManager 
                key={formData.barber || 'no-barber'}
                barberId={formData.barber} 
                serviceId={formData.service}
                onTimeSelect={handleTimeSelect} 
              />
            </Box>

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!formData.timeSelected || !formData.barber}
                sx={{ py: 1.25, fontSize: '15px', fontWeight: 600, backgroundColor: '#FFC300', color: '#1B263B', borderRadius: '8px', boxShadow: 'none', '&:hover': { backgroundColor: '#E6AF00' } }}
              >
                Continue <ArrowForwardIcon sx={{ ml: 1, fontSize: '18px' }} />
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{ py: 1.25, fontSize: '15px', fontWeight: 600, color: '#475569', borderColor: '#CBD5E1', borderRadius: '8px' }}
              >
                <ArrowBackIcon sx={{ mr: 1, fontSize: '18px' }} /> Back
              </Button>
            </Stack>
          </Box>
        )}

        {/* Step 2: Confirm */}
        {activeStep === 2 && selectedService && (
          <Box>
            <Typography sx={{ mb: 2, fontSize: { xs: '20px', sm: '22px' }, fontWeight: 700, color: '#1B263B' }}>
              Confirm Booking
            </Typography>

            <Box sx={{ mb: 3, p: 2.5, backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', mb: 0.5, textTransform: 'uppercase' }}>Service</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1B263B' }}>{selectedService.serviceName}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', mb: 0.5, textTransform: 'uppercase' }}>Selected Barber</Typography>
                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1B263B' }}>
                      {selectedBarber ? (selectedBarber.name || `${selectedBarber.firstName || ''} ${selectedBarber.lastName || ''}`.trim()) : 'Any Barber'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: '1px', backgroundColor: '#E2E8F0' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', mb: 0.5, textTransform: 'uppercase' }}>Total Price</Typography>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#1B263B' }}>Rs. {selectedService.price}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', mb: 0.5, textTransform: 'uppercase' }}>Duration & Time</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1B263B' }}>{selectedService.duration}m | {formData.time?.format('hh:mm A')}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={1.5}>
              <Button
                type="button"
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                sx={{ py: 1.25, fontSize: '15px', fontWeight: 600, backgroundColor: '#FFC300', color: '#1B263B', borderRadius: '8px', boxShadow: 'none', '&:hover': { backgroundColor: '#E6AF00' } }}
              >
                Confirm Booking
              </Button>
              <Button
                type="button"
                fullWidth
                variant="outlined"
                onClick={() => setActiveStep(1)}
                sx={{ py: 1.25, fontSize: '15px', fontWeight: 600, color: '#475569', borderColor: '#CBD5E1', borderRadius: '8px' }}
              >
                <ArrowBackIcon sx={{ mr: 1, fontSize: '18px' }} /> Back
              </Button>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Booking;