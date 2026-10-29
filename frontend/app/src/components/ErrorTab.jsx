import { useState, useEffect, useRef } from "react";
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
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
`;

const ALERT_STYLES = {
  success: { color: "#34C759", Icon: CheckCircleRoundedIcon, title: "Success" },
  error:   { color: "#FF3B30", Icon: CancelRoundedIcon,      title: "Something went wrong" },
  warning: { color: "#FFB300", Icon: WarningRoundedIcon,     title: "Heads up" },
  info:    { color: "#007AFF", Icon: InfoRoundedIcon,        title: "Info" },
};

const IOS_EASE_OUT = "cubic-bezier(0.32, 0.72, 0, 1)";
const TOP_OFFSET = { xs: 12, sm: 16 };
const SWIPE_DISMISS_PX = 30;

const ErrorTab = () => {
  const { message, type, open, duration, title } = useSelector(
    (state) => state.alert
  );
  const dispatch = useDispatch();

  const [displayType, setDisplayType] = useState(null);
  const [displayMessage, setDisplayMessage] = useState(null);
  const [displayTitle, setDisplayTitle] = useState(null);

  // swipe-up-to-dismiss state
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    if (open && type && message) {
      setDisplayType(type);
      setDisplayMessage(message);
      setDisplayTitle(title || null);
    }
  }, [open, type, message, title]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    dispatch(hideAlert());
  };

  const handleExited = () => {
    setDisplayType(null);
    setDisplayMessage(null);
    setDisplayTitle(null);
    setDragY(0);
  };

  const onPointerDown = (e) => {
    startY.current = e.clientY;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY.current;
    if (Math.abs(dy) > 4) moved.current = true;
    setDragY(Math.min(0, dy)); // only allow dragging upwards
  };

  const onPointerUp = () => {
    setDragging(false);
    if (dragY < -SWIPE_DISMISS_PX) {
      dispatch(hideAlert());
    } else {
      setDragY(0);
      if (!moved.current) dispatch(hideAlert()); // plain tap closes it
    }
  };

  if (!displayType || !displayMessage) return null;

  const { color, Icon, title: defaultTitle } =
    ALERT_STYLES[displayType] || ALERT_STYLES.info;

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration || 3500}
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
      {/* outer box is animated by Slide; inner card handles the swipe */}
      <Box sx={{ width: "100%", maxWidth: { xs: 420, sm: 440 } }}>
        <Box
          role="alert"
          aria-live="polite"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
            minWidth: { xs: 0, sm: 340 },
            px: 2,
            py: 1.5,
            cursor: "pointer",
            userSelect: "none",
            touchAction: "none",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "saturate(180%) blur(24px)",
            WebkitBackdropFilter: "saturate(180%) blur(24px)",
            border: "1px solid rgba(209, 209, 214, 0.7)",
            borderRadius: "8px",
            boxShadow:
              "0 10px 30px rgba(28, 28, 30, 0.14), 0 1px 3px rgba(28, 28, 30, 0.06)",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
            transform: `translateY(${dragY}px)`,
            opacity: 1 + dragY / 160,
            transition: dragging
              ? "none"
              : `transform 0.25s ${IOS_EASE_OUT}, opacity 0.25s ease`,
            // "backwards" so the animation doesn't override the drag transform afterwards
            animation: `${cardIn} 0.35s ${IOS_EASE_OUT} backwards`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          <Icon
            sx={{
              flexShrink: 0,
              fontSize: 28,
              color,
              animation: `${iconPop} 0.45s ${IOS_EASE_OUT} 0.1s both`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "14.5px",
                lineHeight: "20px",
                fontWeight: 600,
                color: "#1C1C1E",
                fontFamily: "inherit",
              }}
            >
              {displayTitle || defaultTitle}
            </Typography>
            <Typography
              sx={{
                fontSize: "14px",
                lineHeight: "19px",
                fontWeight: 400,
                color: "rgba(28, 28, 30, 0.72)",
                fontFamily: "inherit",
                wordBreak: "break-word",
              }}
            >
              {displayMessage}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Snackbar>
  );
};

export default ErrorTab;