import { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { hideAlert } from "../redux/features/alertSlice";

const ErrorTab = () => {
  const { message, type, open, duration } = useSelector(state => state.alert);
  const dispatch = useDispatch();
  
  const [displayType, setDisplayType] = useState(null);
  const [displayMessage, setDisplayMessage] = useState(null);

  useEffect(() => {
    if (open && type && message) {
      setDisplayType(type);
      setDisplayMessage(message);
    }
  }, [open, type, message]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideAlert());
    setTimeout(() => {
      setDisplayType(null);
      setDisplayMessage(null);
    }, 300);
  };

  if (!displayType || !displayMessage) {
    return null;
  }

  const getAlertConfig = () => {
    switch (displayType) {
      case 'success':
        return {
          backgroundColor: '#319B6A',
          color: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#C12C2C',
          color: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: '#FFB300',
          color: '#222222',
        };
      case 'info':
        return {
          backgroundColor: '#3B9C9C',
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#1B263B',
          color: '#FFFFFF',
        };
    }
  };

  const alertConfig = getAlertConfig();

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration || 4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{
        top: { xs: '80px', sm: '80px' },
        zIndex: 1400
      }}
    >
      <Alert 
        onClose={handleClose}
        severity={displayType}
        variant="filled"
        sx={{
          minWidth: { xs: '300px', sm: '400px' },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: '500px' },
          fontSize: '16px',
          lineHeight: '24px',
          fontWeight: 500,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(27, 38, 59, 0.15)',
          backgroundColor: alertConfig.backgroundColor,
          color: alertConfig.color,
          '& .MuiAlert-icon': {
            fontSize: '24px',
            color: alertConfig.color,
          },
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            color: alertConfig.color,
          },
          '& .MuiAlert-action': {
            color: alertConfig.color,
          }
        }}
      >
        {displayMessage}
      </Alert>
    </Snackbar>
  );
};

export default ErrorTab;
