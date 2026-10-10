import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  ButtonBase,
  Button,
  Skeleton,
  IconButton,
  Chip,
} from "@mui/material";
import dayjs from "dayjs";
import axios from "axios";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import NightsStayOutlinedIcon from "@mui/icons-material/NightsStayOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const MORNING_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"];
const EVENING_SLOTS = [
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
  "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM",
];
const ALL_SLOTS = [...MORNING_SLOTS, ...EVENING_SLOTS];

const getSlotDayjs = (timeString) => {
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
};

const TimeManager = ({ barberId, serviceId, onTimeSelect }) => {
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchBookedSlots = useCallback(async () => {
    if (!barberId) {
      setBookedSlots([]);
      setError(false);
      return;
    }
    try {
      setLoadingSlots(true);
      setError(false);
      const res = await axios.get("/api/v1/user/getBookings", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) {
        const barberBookings = (res.data.data || [])
          .filter((b) => {
            const bBarber = typeof b.barberId === "object" ? b.barberId?._id : b.barberId;
            return String(bBarber) === String(barberId) && b.status !== "cancelled";
          })
          .map((b) => b.bookingTime);

        setBookedSlots(barberBookings);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching booked slots:", err);
      setError(true);
    } finally {
      setLoadingSlots(false);
    }
  }, [barberId]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const getStatus = useCallback(
    (timeString) => {
      const slotTime = getSlotDayjs(timeString);
      if (bookedSlots.some((bTime) => dayjs(bTime).isSame(slotTime, "minute"))) return "booked";
      if (slotTime.isBefore(now)) return "past";
      return "available";
    },
    [bookedSlots, now]
  );

  const availableSlots = useMemo(
    () => ALL_SLOTS.filter((t) => getStatus(t) === "available"),
    [getStatus]
  );
  const nextAvailable = availableSlots[0];

  const noBarber = !barberId;

  const handleSelect = (time) => {
    setSelectedTime(time);
    onTimeSelect(time);
  };

  const renderSlot = (time) => {
    const status = noBarber ? "disabled" : getStatus(time);
    const isSelected = selectedTime === time && status === "available";
    const unavailable = status !== "available";

    let borderColor = "#86efac";
    let bgColor = "#f0fdf4";
    let textColor = "#15803d";
    let subLabel = null;

    if (isSelected) {
      borderColor = "#FFC300";
      bgColor = "#FFFDF4";
      textColor = "#1B263B";
    } else if (status === "booked") {
      borderColor = "#fca5a5";
      bgColor = "#fef2f2";
      textColor = "#991b1b";
      subLabel = "Booked";
    } else if (status === "past") {
      borderColor = "#E2E8F0";
      bgColor = "#F1F5F9";
      textColor = "#94A3B8";
      subLabel = "Passed";
    } else if (status === "disabled") {
      borderColor = "#E2E8F0";
      bgColor = "#F8FAFC";
      textColor = "#94A3B8";
    }

    return (
      <ButtonBase
        key={time}
        disabled={unavailable}
        onClick={() => handleSelect(time)}
        aria-pressed={isSelected}
        aria-label={`${time}${subLabel ? `, ${subLabel}` : ""}${isSelected ? ", selected" : ""}`}
        sx={{
          position: "relative",
          minHeight: 46,
          py: 0.8,
          px: 0.5,
          borderRadius: "8px",
          fontSize: "0.85rem",
          fontWeight: isSelected ? 700 : 600,
          transition: "all 0.15s ease",
          border: "2px solid",
          borderColor,
          bgcolor: bgColor,
          color: textColor,
          cursor: unavailable ? "not-allowed" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: status === "disabled" ? 0.6 : 1,
          textDecoration: status === "booked" ? "line-through" : "none",
          "&:hover:not(.Mui-disabled)": {
            borderColor: "#FFC300",
            bgcolor: "#FFFDF4",
            color: "#1B263B",
          },
          "&:focus-visible": { outline: "2px solid #FFC300", outlineOffset: 2 },
        }}
      >
        <span>{time}</span>
        {subLabel && (
          <Typography
            variant="caption"
            sx={{ fontSize: "0.62rem", lineHeight: 1, mt: 0.25, textDecoration: "none", fontWeight: 600 }}
          >
            {subLabel}
          </Typography>
        )}
        {isSelected && (
          <CheckCircleIcon
            sx={{ position: "absolute", top: -7, right: -7, fontSize: 18, color: "#D99B00", bgcolor: "#fff", borderRadius: "50%" }}
          />
        )}
      </ButtonBase>
    );
  };

  const renderGroup = (label, icon, slots) => (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, px: 0.5 }}>
        {icon}
        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>{label}</Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
          gap: 0.75,
        }}
      >
        {slots.map(renderSlot)}
      </Box>
    </Box>
  );

  const renderLegendItem = (bg, border, label) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 10, height: 10, bgcolor: bg, border: `1px solid ${border}`, borderRadius: 0.5 }} />
      <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ width: "auto", mb: 2 }}>
      <Paper
        elevation={0}
        sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", p: 1.5 }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Today
            </Typography>
            <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#1B263B" }}>
              {now.format("ddd, DD MMM")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {!noBarber && !loadingSlots && !error && (
              <Chip
                size="small"
                label={`${availableSlots.length} available`}
                sx={{
                  fontWeight: 600,
                  fontSize: "11px",
                  height: "22px",
                  bgcolor: availableSlots.length ? "#f0fdf4" : "#fef2f2",
                  color: availableSlots.length ? "#15803d" : "#991b1b",
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={fetchBookedSlots}
              disabled={noBarber || loadingSlots}
              aria-label="Refresh available times"
              sx={{ color: "#64748B" }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {noBarber && (
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: 1, mb: 1.5, p: 1.25,
              bgcolor: "#FFFDF4", border: "1px solid #FFE08A", borderRadius: "8px",
            }}
          >
            <PersonOutlineIcon sx={{ fontSize: 18, color: "#D99B00" }} />
            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#1B263B" }}>
              Choose a barber above to see their available times.
            </Typography>
          </Box>
        )}

        {!noBarber && error && !loadingSlots && (
          <Box
            sx={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5, p: 1.25,
              bgcolor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ErrorOutlineIcon sx={{ fontSize: 18, color: "#991b1b" }} />
              <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#991b1b" }}>
                Couldn't load booked times.
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={fetchBookedSlots}
              sx={{ fontWeight: 600, color: "#991b1b", textTransform: "none" }}
            >
              Retry
            </Button>
          </Box>
        )}

        {!noBarber && !loadingSlots && !error && nextAvailable && !selectedTime && (
          <Button
            fullWidth
            onClick={() => handleSelect(nextAvailable)}
            startIcon={<AccessTimeIcon sx={{ fontSize: "18px !important" }} />}
            sx={{
              mb: 1.5, py: 0.9, textTransform: "none", fontWeight: 600, fontSize: "13px",
              color: "#1B263B", bgcolor: "#FFFDF4", border: "1px dashed #FFC300", borderRadius: "8px",
              "&:hover": { bgcolor: "#FFF6D6" },
            }}
          >
            Earliest available: {nextAvailable}
          </Button>
        )}

        {loadingSlots ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[4, 6].map((count, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
                  gap: 0.75,
                }}
              >
                {Array.from({ length: count }).map((_, j) => (
                  <Skeleton key={j} variant="rounded" height={46} />
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {renderGroup("Morning", <WbSunnyOutlinedIcon sx={{ fontSize: 16, color: "#D99B00" }} />, MORNING_SLOTS)}
            {renderGroup("Evening", <NightsStayOutlinedIcon sx={{ fontSize: 16, color: "#D99B00" }} />, EVENING_SLOTS)}

            {!noBarber && !error && availableSlots.length === 0 && (
              <Typography sx={{ fontSize: "13px", color: "#64748B", textAlign: "center" }}>
                No slots left today. Try another barber.
              </Typography>
            )}

            <Box
              sx={{
                display: "flex", gap: 2, justifyContent: "center", pt: 1,
                borderTop: "1px solid #F1F5F9", flexWrap: "wrap",
              }}
            >
              {renderLegendItem("#f0fdf4", "#86efac", "Available")}
              {renderLegendItem("#FFFDF4", "#FFC300", "Selected")}
              {renderLegendItem("#fef2f2", "#fca5a5", "Booked")}
              {renderLegendItem("#F1F5F9", "#E2E8F0", "Passed")}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TimeManager;