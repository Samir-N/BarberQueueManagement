import { useState, useEffect } from "react";
import { Snackbar, Box, Typography, IconButton, Slide } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useSelector, useDispatch } from "react-redux";
import { hideAlert } from "../redux/features/alertSlice";

const popIn = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); }
`;

const ALERT_STYLES = {
  success: { color: "#319B6A", bg: "rgba(49, 155, 106, 0.12)", Icon: CheckRoundedIcon },
  error:   { color: "#C12C2C", bg: "rgba(193, 44, 44, 0.12)",  Icon: CloseRoundedIcon },
  warning: { color: "#E09A00", bg: "rgba(255, 179, 0, 0.16)",  Icon: PriorityHighRoundedIcon },
  info:    { color: "#3B9C9C", bg: "rgba(59, 156, 156, 0.12)", Icon: InfoOutlinedIcon },
};

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

  // clear content only after the exit animation has finished
  const handleExited = () => {
    setDisplayType(null);
    setDisplayMessage(null);
  };

  if (!displayType || !displayMessage) return null;

  const { color, bg, Icon } = ALERT_STYLES[displayType] || ALERT_STYLES.info;

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration || 4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "down", onExited: handleExited }}
      sx={{ top: { xs: "80px", sm: "80px" }, zIndex: 1400 }}
    >
      <Box
        role="alert"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minWidth: { xs: 280, sm: 360 },
          maxWidth: { xs: "calc(100vw - 32px)", sm: 480 },
          py: 1.25,
          pl: 1.5,
          pr: 1,
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(27, 38, 59, 0.08)",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(27, 38, 59, 0.12)",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: bg,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: `${popIn} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both`,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>

        <Typography
          sx={{
            flex: 1,
            fontSize: "15px",
            lineHeight: "22px",
            fontWeight: 500,
            color: "#1B263B",
          }}
        >
          {displayMessage}
        </Typography>

        <IconButton
          size="small"
          onClick={handleClose}
          aria-label="close"
          sx={{ color: "rgba(27, 38, 59, 0.45)", "&:hover": { color: "#1B263B" } }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Snackbar>
  );
};

export default ErrorTab;