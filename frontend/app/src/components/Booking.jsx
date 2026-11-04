import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  Avatar,
  ButtonBase,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../redux/features/alertSlice';
import { hideBooking } from '../redux/features/bookingSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';

import TimeManager from '../components/TimeManager.jsx';

/* ---------- tokens ---------- */
const GOLD = '#FFC300';
const INK = '#1B263B';
const MUTED = '#475569'; // darker than before so small text is easy to read
const LINE = '#E2E8F0';

/* One question per screen, in plain words */
const TITLES = [
  'Pick a service',
  'Pick a barber',
  'Pick a time',
  'Confirm booking',
];

const barberName = (b) =>
  b?.name || `${b?.firstName || ''} ${b?.lastName || ''}`.trim() || 'Barber';

/* ---------- big tap row for services and barbers ---------- */
const OptionRow = ({ selected, onClick, leading, title, subtitle, price }) => (
  <ButtonBase
    onClick={onClick}
    aria-pressed={selected}
    sx={{
      width: '100%',
      minHeight: 84,
      px: 2,
      py: 1.5,
      gap: 2,
      justifyContent: 'flex-start',
      textAlign: 'left',
      borderRadius: 0,
      border: '2px solid',
      borderColor: selected ? GOLD : LINE,
      backgroundColor: selected ? GOLD : '#FFFFFF',
      color: INK,
      transition: 'background-color .15s ease, border-color .15s ease, transform .1s ease',
      '&:active': { transform: 'scale(0.98)' },
    }}
  >
    {leading}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, color: INK }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: 16, color: selected ? INK : MUTED, mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {price && (
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: INK, flexShrink: 0 }}>
        {price}
      </Typography>
    )}
  </ButtonBase>
);

/* ---------- big line in the final summary ---------- */
const SummaryRow = ({ label, value, onChange }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      py: 2,
      borderBottom: `1px solid ${LINE}`,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 16, color: MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
        {value}
      </Typography>
    </Box>
    {onChange && (
      <Button
        onClick={onChange}
        sx={{
          minHeight: 44,
          px: 2,
          fontSize: 16,
          fontWeight: 700,
          textTransform: 'none',
          color: INK,
          border: `2px solid ${LINE}`,
          borderRadius: 0,
          flexShrink: 0,
        }}
      >
        Change
      </Button>
    )}
  </Box>
);

const Booking = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { user } = useSelector((state) => state.auth || {});
  const { services = [], loading: servicesLoading } = useSelector((state) => state.service || {});
  const { showBooking } = useSelector((state) => state.booking || { showBooking: true });

  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [formData, setFormData] = useState({ service: '', barber: '', time: null });

  useEffect(() => {
    let isMounted = true;
    const fetchBarbers = async () => {
      try {
        setBarbersLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/barber/getAllBarbers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted && res.data?.success) {
          setBarbers(res.data.data || res.data.barbers || []);
        }
      } catch (error) {
        console.error('Failed to fetch barbers:', error);
      } finally {
        if (isMounted) setBarbersLoading(false);
      }
    };
    fetchBarbers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    dispatch(hideBooking());
  };

  /* short pause so the person sees their choice light up, then move on */
  const goTo = (next) => setTimeout(() => setStep(next), 180);

  const handleSelectService = (id) => {
    setFormData((prev) => ({ ...prev, service: id }));
    goTo(1);
  };

  const handleSelectBarber = (id) => {
    setFormData((prev) => ({
      ...prev,
      barber: id,
      time: prev.barber === id ? prev.time : null,
    }));
    goTo(2);
  };

  const handleTimeSelect = useCallback((selectedTime) => {
    if (!selectedTime) {
      setFormData((prev) => ({ ...prev, time: null }));
      return;
    }

    let parsedTime = null;

    if (dayjs.isDayjs(selectedTime)) {
      parsedTime = selectedTime.second(0).millisecond(0);
    } else if (typeof selectedTime === 'string') {
      if (/am|pm/i.test(selectedTime)) {
        const [t, modifier] = selectedTime.trim().split(/\s+/);
        let [hours, minutes] = t.split(':').map(Number);
        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
        parsedTime = dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
      } else {
        parsedTime = dayjs(selectedTime).second(0).millisecond(0);
      }
    }

    if (parsedTime && parsedTime.isValid()) {
      setFormData((prev) => ({ ...prev, time: parsedTime }));
      setTimeout(() => setStep(3), 180);
    }
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;

    if (!formData.service || !formData.barber || !formData.time) {
      dispatch(showAlert({ message: 'Please complete all booking fields.', type: 'error' }));
      return;
    }

    const bookingData = {
      service: formData.service,
      barberId: formData.barber,
      bookingTime: formData.time.toISOString(),
    };

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/user/bookingInfo', bookingData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        dispatch(showAlert({ message: 'Booking Successful!', type: 'success' }));
        setFormData({ service: '', barber: '', time: null });
        setStep(0);
        handleClose();
        navigate('/user/dashboard');
      } else {
        dispatch(showAlert({ message: res.data?.message || 'Booking Failed!', type: 'error' }));
      }
    } catch (error) {
      dispatch(showAlert({ message: error.response?.data?.message || 'Booking Failed!', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s._id === formData.service);
  const selectedBarber = barbers.find((b) => b._id === formData.barber);
  const onConfirm = step === 3 && selectedService && selectedBarber && formData.time;

  if (!user || servicesLoading || services.length === 0) return null;

  return (
    <Dialog
      open={open && showBooking !== false}
      fullScreen={isMobile}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') handleClose();
      }}
      maxWidth={false}
      aria-labelledby="booking-dialog-title"
      sx={{
        zIndex: 1200,
        '& .MuiBackdrop-root': { backgroundColor: 'rgba(0,0,0,0.6)' },
      }}
      PaperProps={{
        sx: {
          m: 0,
          width: { xs: '100%', sm: 480 },
          height: { xs: '100%', sm: 'auto' },
          maxHeight: { xs: '100%', sm: '90vh' },
          borderRadius: 0,
          px: 2.5,
          pt: { xs: 'calc(12px + env(safe-area-inset-top))', sm: 2 },
          pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          aria-label="Go back"
          sx={{ width: 48, height: 48, ml: -1, color: INK, visibility: step === 0 ? 'hidden' : 'visible' }}
        >
          <ArrowBackIcon sx={{ fontSize: 28 }} />
        </IconButton>

        <Typography sx={{ fontSize: 17, fontWeight: 700, color: MUTED }}>
          Step {step + 1} of 4
        </Typography>

        <IconButton
          onClick={handleClose}
          aria-label="Close"
          sx={{ width: 48, height: 48, mr: -1, color: INK }}
        >
          <CloseIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* Progress */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 0,
              backgroundColor: i <= step ? GOLD : LINE,
              transition: 'background-color .25s ease',
            }}
          />
        ))}
      </Box>

      {/* The one question for this screen */}
      <Typography
        id="booking-dialog-title"
        component="h2"
        sx={{ fontSize: 30, fontWeight: 800, color: INK, mb: 2.5, lineHeight: 1.15 }}
      >
        {TITLES[step]}
      </Typography>

      <DialogContent
        key={step}
        sx={{
          p: '0 !important',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          animation: 'stepIn .2s ease-out',
          '@keyframes stepIn': {
            from: { opacity: 0, transform: 'translateX(14px)' },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {/* 1. Service */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1 }}>
            {services.map((service) => (
              <OptionRow
                key={service._id}
                selected={formData.service === service._id}
                onClick={() => handleSelectService(service._id)}
                title={service.serviceName}
                subtitle={`${service.duration} min`}
                price={`Rs. ${service.price}`}
              />
            ))}
          </Box>
        )}

        {/* 2. Barber */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1 }}>
            {barbersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={36} sx={{ color: GOLD }} />
              </Box>
            ) : barbers.length === 0 ? (
              <Typography sx={{ fontSize: 18, color: MUTED, py: 2 }}>
                No barbers are available right now. Please try again later.
              </Typography>
            ) : (
              barbers.map((barber) => (
                <OptionRow
                  key={barber._id}
                  selected={formData.barber === barber._id}
                  onClick={() => handleSelectBarber(barber._id)}
                  leading={
                    <Avatar
                      variant="square"
                      src={barber.avatar || barber.image}
                      sx={{ width: 56, height: 56, bgcolor: '#F1F5F9', color: INK }}
                    >
                      <PersonIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                  }
                  title={barberName(barber)}
                />
              ))
            )}
          </Box>
        )}

        {/* 3. Time */}
        {step === 2 && (
          <TimeManager
            key={formData.barber || 'no-barber'}
            barberId={formData.barber}
            serviceId={formData.service}
            onTimeSelect={handleTimeSelect}
            onlyAvailable
          />
        )}

        {/* 4. Confirm */}
        {onConfirm && (
          <Box>
            <Box sx={{ borderTop: `1px solid ${LINE}` }}>
              <SummaryRow label="Service" value={selectedService.serviceName} onChange={() => setStep(0)} />
              <SummaryRow label="Barber" value={barberName(selectedBarber)} onChange={() => setStep(1)} />
              <SummaryRow
                label="Time (today)"
                value={formData.time.format('h:mm A')}
                onChange={() => setStep(2)}
              />
              <SummaryRow label="Price" value={`Rs. ${selectedService.price}`} />
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Big button stays pinned at the bottom so it is always in thumb reach */}
      {onConfirm && (
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            mt: 2,
            minHeight: 64,
            fontSize: 20,
            fontWeight: 800,
            textTransform: 'none',
            backgroundColor: GOLD,
            color: INK,
            borderRadius: 0,
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#E6AF00', boxShadow: 'none' },
            '&.Mui-disabled': { backgroundColor: GOLD, color: INK, opacity: 0.7 },
          }}
        >
          {submitting ? <CircularProgress size={26} sx={{ color: INK }} /> : 'Book now'}
        </Button>
      )}
    </Dialog>
  );
};

export default Booking;