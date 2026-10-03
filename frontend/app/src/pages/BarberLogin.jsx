import React, { useState } from "react";
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Card, 
  Stack, 
  InputAdornment, 
  IconButton,
  MenuItem 
} from "@mui/material";
import axios from "axios";
import { useDispatch } from "react-redux";
import {
  showLoading,
  hideLoading,
  showAlert,
} from "../redux/features/alertSlice.js";
import { setUser } from "../redux/features/authSlice.js";
import { useNavigate } from "react-router-dom";
import LoginIcon from '@mui/icons-material/Login';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const UnifiedLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    role: "user",
  });

  const [showPassword, setShowPassword] = useState(false);

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
      dispatch(
        showAlert({
          message: "Please enter a valid 10-digit phone number.",
          type: "error",
        })
      );
      return;
    }

    try {
      dispatch(showLoading());

      const endpoint = formData.role === "barber" 
        ? "/api/v1/barber/login" 
        : "/api/v1/user/login";

      const response = await axios.post(endpoint, formData, {
        withCredentials: true,
      });

      dispatch(hideLoading());

      if (response.data.success) {
        const loggedInUser = response.data.user || response.data.barber || response.data.data;

        // Save only role to localStorage
        localStorage.setItem("role", formData.role);

        dispatch(
          setUser({
            user: loggedInUser,
            token: response.data.token || null,
          })
        );

        dispatch(
          showAlert({ 
            message: "Login Successful", 
            type: "success", 
            duration: 2000 
          })
        );

        
          navigate("/");
        
      } else {
        dispatch(
          showAlert({
            message: response.data.message || "Login failed!",
            type: "error",
          })
        );
      }
    } catch (error) {
      dispatch(hideLoading());
      dispatch(
        showAlert({ 
          message: error.response?.data?.message || "Something went wrong!", 
          type: "error" 
        })
      );
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
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <LoginIcon sx={{ fontSize: '24px', color: '#222222' }} />
          </Box>
          <Typography sx={{ fontSize: '22px', fontWeight: 600, color: '#1B263B' }}>
            Welcome Back
          </Typography>
          <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
            Sign in to continue
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Login As"
              name="role"
              value={formData.role}
              onChange={handleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#415A77' },
                  '&.Mui-focused fieldset': { borderColor: '#FFC300' },
                },
              }}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="barber">Barber</MenuItem>
            </TextField>

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
              }}
            />

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
                '&:hover': { backgroundColor: '#E6B000' },
              }}
            >
              Log In
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
};

export default UnifiedLogin;