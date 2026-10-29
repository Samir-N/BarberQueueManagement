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
  from { opacity: 0; transform: translate3d(0, 0, 0) scale(0.97); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
`;

// transform-only animation = runs on the GPU, no layout or repaint per frame
const drain = keyframes`
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
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
const DEFAULT_DURATION = 3500;

const ErrorTab = () => {
  const { message, type, open, duration, title } = useSelector(
    (state) => state.alert
  );
  const dispatch = useDispatch();

  const [displayType, setDisplayType] = useState(null);
  const [displayMessage, setDisplayMessage] = useState(null);
  const [displayTitle, setDisplayTitle] = useState(null);

  // swipe state lives in refs, so dragging never re-renders the component
  const cardRef = useRef(null);
  const startY = useRef(0);
  const dragY = useRef(0);
  const dragging = useRef(false);
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
    dragY.current = 0;
  };

  const onPointerDown = (e) => {
    startY.current = e.clientY;
    moved.current = false;
    dragging.current = true;
    if (cardRef.current) cardRef.current.style.transition = "none";
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current || !cardRef.current) return;
    const dy = Math.min(0, e.clientY - startY.current); // upwards only
    if (Math.abs(dy) > 4) moved.current = true;
    dragY.current = dy;
    cardRef.current.style.transform = `translate3d(0, ${dy}px, 0)`;
    cardRef.current.style.opacity = String(Math.max(0.3, 1 + dy / 160));
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const el = cardRef.current;

    if (dragY.current < -SWIPE_DISMISS_PX) {
      dispatch(hideAlert());
    } else {
      if (el) {
        el.style.transition = `transform 0.25s ${IOS_EASE_OUT}, opacity 0.25s ease`;
        el.style.transform = "translate3d(0, 0, 0)";
        el.style.opacity = "1";
      }
      dragY.current = 0;
      if (!moved.current) dispatch(hideAlert()); // plain tap closes it
    }
  };

  if (!displayType || !displayMessage) return null;

  const { color, Icon, title: defaultTitle } =
    ALERT_STYLES[displayType] || ALERT_STYLES.info;
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
      <Box sx={{ width: "100%", maxWidth: { xs: 420, sm: 440 } }}>
        <Box
          ref={cardRef}
          role="alert"
          aria-live="polite"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          sx={{
            position: "relative",
            overflow: "hidden", // clips the loader to the corners
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
            // lighter blur is much cheaper to animate than a heavy one
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "saturate(160%) blur(12px)",
            WebkitBackdropFilter: "saturate(160%) blur(12px)",
            border: "1px solid rgba(209, 209, 214, 0.7)",
            borderRadius: "8px",
            boxShadow:
              "0 10px 30px rgba(28, 28, 30, 0.14), 0 1px 3px rgba(28, 28, 30, 0.06)",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
            willChange: "transform, opacity",
            transform: "translate3d(0, 0, 0)",
            animation: `${cardIn} 0.35s ${IOS_EASE_OUT} backwards`,
            "&:hover .alert-loader": { animationPlayState: "paused" },
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
                color: "rgba(28, 28, 30, 0.72)",
                fontFamily: "inherit",
                wordBreak: "break-word",
              }}
            >
              {displayMessage}
            </Typography>
          </Box>

          {/* loader: restarts for each new message */}
          <Box
            key={`${displayType}-${displayMessage}`}
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
              willChange: "transform",
              animation: `${drain} ${autoHide}ms linear forwards`,
            }}
          />
        </Box>
      </Box>
    </Snackbar>
  );
};

export default ErrorTab;