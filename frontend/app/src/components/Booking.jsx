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
} from '@mui/material';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../redux/features/alertSlice';
import { hideBooking } from '../redux/features/bookingSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceIcon from '@mui/icons-material/Face';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import DryCleaningIcon from '@mui/icons-material/DryCleaning';

import TimeManager from '../components/TimeManager.jsx';

/* ---------- design tokens (same palette as the rest of the app) ---------- */
const GOLD = '#FFC300';
const GOLD_DEEP = '#B8860B';
const INK = '#1B263B';
const MUTED = '#64748B';
const LINE = '#E2E8F0';

/* 4 steps: one question per screen */
const TITLES = [
  'What do you need?',
  'Who would you like?',
  'What time today?',
  'Check and book',
];

const barberName = (b) =>
  b?.name || `${b?.firstName || ''} ${b?.lastName || ''}`.trim() || 'Barber';

const serviceIcon = (serviceName = '') => {
  const n = serviceName.toLowerCase();
  const sx = { fontSize: 24, color: GOLD_DEEP };
  if (n.includes('child') || n.includes('kid') || n.includes('boy')) return <ChildCareIcon sx={sx} />;
  if (n.includes('shave') && n.includes('hair')) return <ContentCutIcon sx={sx} />;
  if (n.includes('shave') || n.includes('beard')) return <DryCleaningIcon sx={sx} />;
  if (n.includes('hair') || n.includes('cut') || n.includes('adult')) return <FaceIcon sx={sx} />;
  return <ContentCutIcon sx={sx} />;
};

/* ---------- one big tappable row, used for services and barbers ---------- */
const OptionRow = ({ selected, onClick, icon, title, subtitle, right }) => (
  <ButtonBase
    onClick={onClick}
    aria-pressed={selected}
    sx={{
      width: '100%',
      minHeight: 68,
      p: 1.5,
      gap: 1.5,
      justifyContent: 'flex-start',
      textAlign: 'left',
      borderRadius: '12px',
      border: '2px solid',
      borderColor: selected ? GOLD : LINE,
      backgroundColor: selected ? '#FFFDF4' : '#FFFFFF',
      transition: 'border-color .15s ease, background-color .15s ease, transform .1s ease',
      '&:active': { transform: 'scale(0.985)' },
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: '10px',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: INK, lineHeight: 1.25 }}>{title}</Typography>
      {subtitle && (
        <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.25 }}>{subtitle}</Typography>
      )}
    </Box>
    {right && (
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: INK, flexShrink: 0 }}>{right}</Typography>
    )}
  </ButtonBase>
);

/* ---------- one line in the final summary, tap to change ---------- */
const SummaryRow = ({ label, value, onChange }) => (
  <ButtonBase
    onClick={onChange}
    sx={{
      width: '100%',
      py: 1.75,
      justifyContent: 'space-between',
      textAlign: 'left',
      borderBottom: `1px solid ${LINE}`,
    }}
  >
    <Box>
      <Typography sx={{ fontSize: 13, color: MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 17, fontWeight: 600, color: INK }}>{value}</Typography>
    </Box>
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: GOLD_DEEP }}>Change</Typography>
  </ButtonBase>
);

const Booking = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth || {});
  const { services = [], loading: servicesLoading } = useSelector((state) => state.service || {});
  const { showBooking } = useSelector((state) => state.booking || { showBooking: true });

  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [formData, setFormData] = useState({ service: '', barber: '', time: null });

  /* ---------- load barbers once ---------- */
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

  /* Short pause after a tap so the person sees their choice highlight, then move on */
  const goTo = (next) => setTimeout(() => setStep(next), 180);

  const handleSelectService = (id) => {
    setFormData((prev) => ({ ...prev, service: id }));
    goTo(1);
  };

  const handleSelectBarber = (id) => {
    setFormData((prev) => ({
      ...prev,
      barber: id,
      // a different barber has different free times
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
        // zero the ms so every user's 8:00 PM is the exact same value
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
    if (submitting) return; // stops accidental double taps

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

  if (!user || servicesLoading || services.length === 0) return null;

  return (
    <Dialog
      open={open && showBooking !== false}
      onClose={(event, reason) => {
        // ignore stray taps outside so nobody loses their progress
        if (reason !== 'backdropClick') handleClose();
      }}
      maxWidth={false}
      aria-labelledby="booking-dialog-title"
      sx={{
        zIndex: 1200,
        // bottom sheet on phones (thumb reach), centred card on larger screens
        '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } },
        '& .MuiBackdrop-root': { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' },
      }}
      PaperProps={{
        sx: {
          m: 0,
          width: { xs: '100%', sm: 460 },
          maxHeight: { xs: '92vh', sm: '90vh' },
          borderRadius: { xs: '20px 20px 0 0', sm: '16px' },
          px: { xs: 2, sm: 3 },
          pt: 1.5,
          pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 3 },
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Top bar: back, progress, close */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          aria-label="Go back"
          sx={{ color: INK, visibility: step === 0 ? 'hidden' : 'visible' }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of 4`}
          sx={{ flex: 1, display: 'flex', gap: 0.75 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= step ? GOLD : LINE,
                transition: 'background-color .25s ease',
              }}
            />
          ))}
        </Box>

        <IconButton onClick={handleClose} aria-label="Close" sx={{ color: MUTED }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Typography
        id="booking-dialog-title"
        component="h2"
        sx={{ fontSize: 24, fontWeight: 700, color: INK, mb: 2, lineHeight: 1.2 }}
      >
        {TITLES[step]}
      </Typography>

      <DialogContent
        key={step}
        sx={{
          p: '0 !important',
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
        {/* 1. Service: tap one, move on */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pb: 0.5 }}>
            {services.map((service) => (
              <OptionRow
                key={service._id}
                selected={formData.service === service._id}
                onClick={() => handleSelectService(service._id)}
                icon={serviceIcon(service.serviceName)}
                title={service.serviceName}
                subtitle={`${service.duration} min`}
                right={`Rs. ${service.price}`}
              />
            ))}
          </Box>
        )}

        {/* 2. Barber: tap one, move on */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pb: 0.5 }}>
            {barbersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: GOLD }} />
              </Box>
            ) : barbers.length === 0 ? (
              <Typography sx={{ fontSize: 15, color: MUTED, py: 2 }}>
                No barbers are available right now. Please try again later.
              </Typography>
            ) : (
              barbers.map((barber) => (
                <OptionRow
                  key={barber._id}
                  selected={formData.barber === barber._id}
                  onClick={() => handleSelectBarber(barber._id)}
                  icon={
                    <Avatar
                      src={barber.avatar || barber.image}
                      sx={{ width: 44, height: 44, bgcolor: '#F1F5F9', color: GOLD_DEEP }}
                    >
                      <PersonIcon />
                    </Avatar>
                  }
                  title={barberName(barber)}
                />
              ))
            )}
          </Box>
        )}

        {/* 3. Time: only free times are shown, tap one, move on */}
        {step === 2 && (
          <TimeManager
            key={formData.barber || 'no-barber'}
            barberId={formData.barber}
            serviceId={formData.service}
            onTimeSelect={handleTimeSelect}
            onlyAvailable
          />
        )}

        {/* 4. Confirm: one summary, one big button */}
        {step === 3 && selectedService && selectedBarber && formData.time && (
          <Box>
            <Box sx={{ borderTop: `1px solid ${LINE}` }}>
              <SummaryRow label="Service" value={selectedService.serviceName} onChange={() => setStep(0)} />
              <SummaryRow label="Barber" value={barberName(selectedBarber)} onChange={() => setStep(1)} />
              <SummaryRow
                label="Time"
                value={`Today, ${formData.time.format('h:mm A')}`}
                onChange={() => setStep(2)}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 2.5 }}>
              <Typography sx={{ fontSize: 15, color: MUTED }}>
                About {selectedService.duration} min
              </Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 700, color: INK }}>
                Rs. {selectedService.price}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={18} sx={{ color: INK }} />
                ) : (
                  <CheckCircleIcon />
                )
              }
              sx={{
                py: 1.75,
                fontSize: 17,
                fontWeight: 700,
                textTransform: 'none',
                backgroundColor: GOLD,
                color: INK,
                borderRadius: '12px',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#E6AF00', boxShadow: 'none' },
                '&.Mui-disabled': { backgroundColor: GOLD, color: INK, opacity: 0.7 },
              }}
            >
              {submitting ? 'Booking...' : 'Book now'}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Booking;