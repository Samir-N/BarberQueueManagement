import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading, showAlert } from '../redux/features/alertSlice.js';
import { setUser } from '../redux/features/authSlice.js';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '& fieldset': { borderColor: '#E5E7EB' },
    '&:hover fieldset': { borderColor: '#415A77' },
    '&.Mui-focused fieldset': { borderColor: '#FFC300' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#1B263B' },
};

const BarberRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "user",
    barberSecretKey: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.phone.length !== 10) {
      dispatch(showAlert({ message: "Please enter a valid 10-digit phone number.", type: "error" }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      dispatch(showAlert({ message: "Passwords do not match!", type: "error" }));
      return;
    }

    if (formData.role === 'barber' && !formData.barberSecretKey.trim()) {
      dispatch(showAlert({ message: "Barber Secret Key is required!", type: "error" }));
      return;
    }

    try {
      dispatch(showLoading());
      const { confirmPassword, ...submitData } = formData;
      
      if (submitData.role !== 'barber') {
        delete submitData.barberSecretKey;
      }

      const endpoint = submitData.role === 'barber' 
        ? '/api/v1/barber/register' 
        : '/api/v1/user/register';

      const response = await axios.post(endpoint, submitData, {
        withCredentials: true,
      }); 
      dispatch(hideLoading());

      if (response.data.success) {
        // Save role in localStorage
        localStorage.setItem("role", submitData.role);

        dispatch(setUser({ user: response.data.user }));
        dispatch(showAlert({ message: "Registration Successful!", type: "success", duration: 2000 }));
        
        navigate(response.data.user.role === 'barber' ? '/barber/dashboard' : '/user/dashboard');
      } else {
        dispatch(showAlert({ message: response.data.message || "Registration failed!", type: "error" }));
      }
    } catch (error) {
      dispatch(hideLoading());
      dispatch(showAlert({ message: error.response?.data?.message || "Something went wrong!", type: "error" }));
    }
  };

  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 380,
          p: 3,
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(27, 38, 59, 0.08)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#FFC300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1,
            }}
          >
            <PersonAddIcon sx={{ fontSize: 22, color: '#222222' }} />
          </Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#1B263B' }}>
            Create Account
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
            
            <TextField
              fullWidth
              size="small"
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              inputProps={{ 
                maxLength: 10, 
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
            
            <TextField
              fullWidth
              size="small"
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 20, color: '#6B7280' }} />
                      ) : (
                        <Visibility sx={{ fontSize: 20, color: '#6B7280' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />

            <TextField
              fullWidth
              size="small"
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff sx={{ fontSize: 20, color: '#6B7280' }} />
                      ) : (
                        <Visibility sx={{ fontSize: 20, color: '#6B7280' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />

            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel id="role-label">Account Role</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                label="Account Role"
                onChange={handleChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="barber">Barber</MenuItem>
              </Select>
            </FormControl>

            {formData.role === 'barber' && (
              <TextField
                fullWidth
                size="small"
                label="Barber Secret Key"
                name="barberSecretKey"
                type="password"
                value={formData.barberSecretKey}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1.1,
                mt: 1,
                fontSize: '15px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: '#FFC300',
                color: '#222222',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#E6B000',
                  boxShadow: '0 4px 12px rgba(255, 195, 0, 0.3)',
                },
              }}
            >
              Register
            </Button>
          </Stack>
        </form>

        <Typography 
          sx={{ 
            mt: 2.5, 
            textAlign: 'center', 
            fontSize: '13px', 
            color: '#6B7280' 
          }}
        >
          Already have an account?{' '}
          <Box
            component="span"
            onClick={() => navigate('/barber/login')}
            sx={{
              color: '#1B263B',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': { color: '#E6B000', textDecoration: 'underline' },
            }}
          >
            Log In
          </Box>
        </Typography>
      </Card>
    </Box>
  );
};

export default BarberRegister;