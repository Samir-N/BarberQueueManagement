import { useState, useEffect } from "react";
import { Snackbar, Box, Typography, Slide } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { useSelector, useDispatch } from "react-redux";
import { hideAlert } from "../redux/features/alertSlice";

const iconPop = keyframes`
  0%   { transform: scale(0.4); opacity: 0; }
  65%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

// status colours come from the design system
const ALERT_STYLES = {
  success: { color: "#34C759", Icon: CheckCircleRoundedIcon },
  error:   { color: "#FF3B30", Icon: CancelRoundedIcon },
  warning: { color: "#FFB300", Icon: WarningRoundedIcon },
  info:    { color: "#007AFF", Icon: InfoRoundedIcon },
};

// iOS-style easing
const IOS_EASE_OUT = "cubic-bezier(0.32, 0.72, 0, 1)";

const ErrorTab = () => {
  const { message, type, open, duration } = useSelector((state) => state.alert);
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
    if (reason === "clickaway") return;
    dispatch(hideAlert());
  };

  // clear content only after the exit animation finishes
  const handleExited = () => {
    setDisplayType(null);
    setDisplayMessage(null);
  };

  if (!displayType || !displayMessage) return null;

  const { color, Icon } = ALERT_STYLES[displayType] || ALERT_STYLES.info;

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration || 4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      TransitionComponent={Slide}
      TransitionProps={{
        direction: "down",
        onExited: handleExited,
        easing: { enter: IOS_EASE_OUT, exit: "cubic-bezier(0.4, 0, 1, 1)" },
        timeout: { enter: 450, exit: 250 },
      }}
      sx={{ top: { xs: "80px", sm: "80px" }, zIndex: 1400 }}
    >
      <Box
        role="alert"
        aria-live="polite"
        onClick={handleClose}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minWidth: { xs: 290, sm: 360 },
          maxWidth: { xs: "calc(100vw - 32px)", sm: 480 },
          px: 2,
          py: 1.5,
          cursor: "pointer",
          // frosted glass, neutral, no status colour on the card
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          border: "1px solid rgba(209, 209, 214, 0.7)",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(28, 28, 30, 0.12)",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
        }}
      >
        <Icon
          sx={{
            flexShrink: 0,
            fontSize: 26,
            color,
            animation: `${iconPop} 0.45s ${IOS_EASE_OUT} 0.12s both`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />

        <Typography
          sx={{
            flex: 1,
            fontSize: "15px",
            lineHeight: "22px",
            fontWeight: 500,
            color: "#1C1C1E",
            fontFamily: "inherit",
          }}
        >
          {displayMessage}
        </Typography>
      </Box>
    </Snackbar>
  );
};

export default ErrorTab;