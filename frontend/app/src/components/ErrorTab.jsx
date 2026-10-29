
import { useState, useEffect } from "react";
import { Snackbar, Alert, LinearProgress, Box } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { hideAlert } from "../redux/features/alertSlice";

const ErrorTab = () => {
  const { message, type, open, duration } = useSelector(
    (state) => state.alert
  );
  const dispatch = useDispatch();

  const [displayType, setDisplayType] = useState(null);
  const [displayMessage, setDisplayMessage] = useState(null);
  const [progress, setProgress] = useState(100);

  const notificationDuration = 3000;

  useEffect(() => {
    if (open && type && message) {
      setDisplayType(type);
      setDisplayMessage(message);
      setProgress(100);

      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(
          0,
          100 - (elapsed / notificationDuration) * 100
        );

        setProgress(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [open, type, message]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;

    dispatch(hideAlert());
    setProgress(0);

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
      case "success":
        return {
          backgroundColor: "#319B6A",
          color: "#FFFFFF",
        };
      case "error":
        return {
          backgroundColor: "#C12C2C",
          color: "#FFFFFF",
        };
      case "warning":
        return {
          backgroundColor: "#FFB300",
          color: "#222222",
        };
      case "info":
        return {
          backgroundColor: "#3B9C9C",
          color: "#FFFFFF",
        };
      default:
        return {
          backgroundColor: "#1B263B",
          color: "#FFFFFF",
        };
    }
  };

  const alertConfig = getAlertConfig();

  return (
    <Snackbar
      open={open}
      autoHideDuration={notificationDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{
        top: { xs: "80px", sm: "80px" },
        zIndex: 1400,
      }}
    >
      <Box
        sx={{
          width: "fit-content",
          minWidth: { xs: "300px", sm: "400px" },
          maxWidth: { xs: "calc(100vw - 32px)", sm: "500px" },
          overflow: "hidden",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(27, 38, 59, 0.15)",
        }}
      >
        <Alert
          onClose={handleClose}
          severity={displayType}
          variant="filled"
          sx={{
            minWidth: 0,
            fontSize: "16px",
            lineHeight: "24px",
            fontWeight: 500,
            borderRadius: 0,
            backgroundColor: alertConfig.backgroundColor,
            color: alertConfig.color,
            "& .MuiAlert-icon": {
              fontSize: "24px",
              color: alertConfig.color,
            },
            "& .MuiAlert-message": {
              display: "flex",
              alignItems: "center",
              color: alertConfig.color,
            },
            "& .MuiAlert-action": {
              color: alertConfig.color,
            },
          }}
        >
          {displayMessage}
        </Alert>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: alertConfig.color,
              transition: "transform 30ms linear",
            },
          }}
        />
      </Box>
    </Snackbar>
  );
};

export default ErrorTab;
