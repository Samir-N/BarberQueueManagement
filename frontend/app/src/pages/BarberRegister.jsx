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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      dispatch(showAlert({ message: "Passwords do not match!", type: "error" }));
      return;
    }

    if (formData.role === 'barber' && !formData.barberSecretKey.trim()) {
      dispatch(showAlert({ message: "Barber Secret Key is required for barber accounts!", type: "error" }));
      return;
    }

    try {
      dispatch(showLoading());
      const { confirmPassword, ...submitData } = formData;
      
      // Clean up payload if registering as standard user
      if (submitData.role !== 'barber') {
        delete submitData.barberSecretKey;
      }

      const response = await axios.post('/api/v1/user/register', submitData); 
      dispatch(hideLoading());

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        dispatch(setUser({ 
          user: response.data.user, 
          token: response.data.token 
        }));
        dispatch(showAlert({ message: "Registration Successful!", type: "success", duration: 2000 }));
        
        // Redirect based on assigned role
        if (response.data.user.role === 'barber') {
          navigate('/barber/dashboard');
        } else {
          navigate('/user/dashboard');  
        }
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
        px: 2,
        py: 2,
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
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#FFC300',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <PersonAddIcon sx={{ fontSize: '24px', color: '#222222' }} />
          </Box>
          <Typography
            sx={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#1B263B',
            }}
          >
            Create Account
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              color: '#6B7280',
            }}
          >
            Sign up to get started
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
                    <PersonIcon sx={{ color: '#6B7280', fontSize: '20px' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#415A77' },
                  '&.Mui-focused fieldset': { borderColor: '#FFC300' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#1B263B' },
              }}
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
              inputProps={{ minLength: 10 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#6B7280', fontSize: '20px' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#415A77' },
                  '&.Mui-focused fieldset': { borderColor: '#FFC300' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#1B263B' },
              }}
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
                    <LockIcon sx={{ color: '#6B7280', fontSize: '20px' }} />
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
                        <VisibilityOff sx={{ fontSize: '20px', color: '#6B7280' }} />
                      ) : (
                        <Visibility sx={{ fontSize: '20px', color: '#6B7280' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#415A77' },
                  '&.Mui-focused fieldset': { borderColor: '#FFC300' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#1B263B' },
              }}
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
                    <LockIcon sx={{ color: '#6B7280', fontSize: '20px' }} />
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
                        <VisibilityOff sx={{ fontSize: '20px', color: '#6B7280' }} />
                      ) : (
                        <Visibility sx={{ fontSize: '20px', color: '#6B7280' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#415A77' },
                  '&.Mui-focused fieldset': { borderColor: '#FFC300' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#1B263B' },
              }}
            />

            <FormControl 
              fullWidth 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#415A77' },
                  '&.Mui-focused fieldset': { borderColor: '#FFC300' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#1B263B' },
              }}
            >
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="barber">Barber</MenuItem>
              </Select>
            </FormControl>

            {/* Conditional Barber Secret Key Field */}
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
                      <KeyIcon sx={{ color: '#6B7280', fontSize: '20px' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': { borderColor: '#E5E7EB' },
                    '&:hover fieldset': { borderColor: '#415A77' },
                    '&.Mui-focused fieldset': { borderColor: '#FFC300' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#1B263B' },
                }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1,
                fontSize: '15px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: '#FFC300',
                color: '#222222',
                boxShadow: '0 4px 12px rgba(255, 195, 0, 0.3)',
                '&:hover': {
                  backgroundColor: '#E6B000',
                  boxShadow: '0 6px 16px rgba(255, 195, 0, 0.4)',
                },
              }}
            >
              Register
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
            Already have an account?{' '}
            <Typography
              component="span"
              onClick={() => navigate('/barber/login')}
              sx={{
                color: '#1B263B',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { color: '#FFC300' },
              }}
            >
              Log In
            </Typography>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default BarberRegister;