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

// Custom / Specific Service Icons
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceIcon from '@mui/icons-material/Face';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import DryCleaningIcon from '@mui/icons-material/DryCleaning';

import TimeManager from '../components/TimeManager.jsx';
import { useNavigate } from "react-router-dom";

const Booking = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { services, loading: servicesLoading } = useSelector(state => state.service);
  const dispatch = useDispatch();

  const [activeStep, setActiveStep] = useState(0); // 0 (Service), 1 (Time), 2 (Review)
  const [formData, setFormData] = useState({
    service: "",
    time: null,
    timeSelected: false,
  });

  // Intelligent icon mapper based on service name keywords
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
    dispatch(hideBooking());
    navigate('/user/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bookingData = {
      service: formData.service,
      bookingTime: formData.time.toDate(),
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
      setFormData({ service: "", time: null, timeSelected: false });
      setActiveStep(0);
      handleClose();
    } catch (error) {
      dispatch(hideLoading());
      dispatch(showAlert({ message: 'Booking Failed!', type: 'error' }));
    }
  };

  const selectedService = services.find(s => s._id === formData.service);

  const handleTimeSelect = (timeString) => {
    const [t, modifier] = timeString.split(" ");
    let [hours, minutes] = t.split(":");

    if (modifier === "PM" && hours !== "12") hours = +hours + 12;
    if (modifier === "AM" && hours === "12") hours = 0;

    const newTime = dayjs().hour(hours).minute(minutes).second(0);
    setFormData(prev => ({ ...prev, time: newTime, timeSelected: true }));
  };

  if (!user || servicesLoading || services.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={true}
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
        zIndex: 9999,
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
          '&::-webkit-scrollbar': {
            display: 'none',
          }
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

        {/* Step 1: Select Time Slot */}
        {activeStep === 1 && (
          <Box>
            <Typography sx={{ mb: 2, fontSize: { xs: '20px', sm: '22px' }, fontWeight: 700, color: '#1B263B' }}>
              Select Time Slot
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TimeManager onTimeSelect={handleTimeSelect} />
            </Box>

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!formData.timeSelected}
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

        {/* Step 2: Review & Confirm */}
        {activeStep === 2 && selectedService && (
          <Box>
            <Typography sx={{ mb: 2, fontSize: { xs: '20px', sm: '22px' }, fontWeight: 700, color: '#1B263B' }}>
              Confirm Booking
            </Typography>

            <Box sx={{ mb: 3, p: 2.5, backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', mb: 0.5, textTransform: 'uppercase' }}>Service</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1B263B' }}>{selectedService.serviceName}</Typography>
                </Box>
                <Box sx={{ height: '1px', backgroundColor: '#E2E8F0' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', mb: 0.5, textTransform: 'uppercase' }}>Total Price</Typography>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#1B263B' }}>Rs. {selectedService.price}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', mb: 0.5, textTransform: 'uppercase' }}>Duration & Time</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1B263B' }}>{selectedService.duration}m | {formData.time.format('hh:mm A')}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                sx={{ py: 1.25, fontSize: '15px', fontWeight: 600, backgroundColor: '#FFC300', color: '#1B263B', borderRadius: '8px', boxShadow: 'none', '&:hover': { backgroundColor: '#E6AF00' } }}
              >
                Confirm Booking
              </Button>
              <Button
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