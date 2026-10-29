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
  0%   { transform: scale(0.5); opacity: 0; }
  65%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const cardIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
`;

const shrink = keyframes`
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
`;

const ALERT_STYLES = {
  success: { color: "#34C759", Icon: CheckCircleRoundedIcon },
  error:   { color: "#FF3B30", Icon: CancelRoundedIcon },
  warning: { color: "#FFB300", Icon: WarningRoundedIcon },
  info:    { color: "#007AFF", Icon: InfoRoundedIcon },
};

const IOS_EASE_OUT = "cubic-bezier(0.32, 0.72, 0, 1)";
const TOP_OFFSET = { xs: 12, sm: 16 };
const DEFAULT_DURATION = 3500;

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

  const handleExited = () => {
    setDisplayType(null);
    setDisplayMessage(null);
  };

  if (!displayType || !displayMessage) return null;

  const { color, Icon } = ALERT_STYLES[displayType] || ALERT_STYLES.info;
  const autoHide = duration || DEFAULT_DURATION;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHide}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      TransitionComponent={Slide}
      TransitionProps={{
        direction: "down",
        onExited: handleExited,
        easing: { enter: IOS_EASE_OUT, exit: "cubic-bezier(0.4, 0, 1, 1)" },
        timeout: { enter: 400, exit: 220 },
      }}
      sx={{
        top: {
          xs: `calc(env(safe-area-inset-top, 0px) + ${TOP_OFFSET.xs}px) !important`,
          sm: `${TOP_OFFSET.sm}px !important`,
        },
        zIndex: 1400,
        left: 0,
        right: 0,
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        role="alert"
        aria-live="polite"
        onClick={handleClose}
        sx={{
          position: "relative",
          overflow: "hidden", // keeps the loader inside the corners
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          minWidth: { xs: 0, sm: 340 },
          maxWidth: { xs: 420, sm: 440 },
          px: 2,
          py: 1.5,
          cursor: "pointer",
          userSelect: "none",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          border: "1px solid rgba(209, 209, 214, 0.7)",
          borderRadius: "8px",
          boxShadow:
            "0 8px 24px rgba(28, 28, 30, 0.12), 0 1px 3px rgba(28, 28, 30, 0.06)",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
          animation: `${cardIn} 0.35s ${IOS_EASE_OUT} both`,
          transition: "transform 0.15s ease",
          "&:active": { transform: "scale(0.98)" },
          // hovering pauses the auto-hide timer, so pause the loader too
          "&:hover .alert-loader": { animationPlayState: "paused" },
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <Icon
          sx={{
            flexShrink: 0,
            fontSize: 26,
            color,
            animation: `${iconPop} 0.45s ${IOS_EASE_OUT} 0.1s both`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />

        <Typography
          sx={{
            flex: 1,
            fontSize: "15px",
            lineHeight: "21px",
            fontWeight: 500,
            color: "#1C1C1E",
            fontFamily: "inherit",
            wordBreak: "break-word",
          }}
        >
          {displayMessage}
        </Typography>

        {/* loader line: restarts for every new message */}
        <Box
          key={displayMessage}
          className="alert-loader"
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: "3px",
            backgroundColor: color,
            opacity: 0.85,
            transformOrigin: "left center",
            animation: `${shrink} ${autoHide}ms linear forwards`,
          }}
        />
      </Box>
    </Snackbar>
  );
};

export default ErrorTab;