import { useState, useEffect, useCallback } from "react";
import { Box, Typography, ButtonBase, Button, Skeleton } from "@mui/material";
import dayjs from "dayjs";
import axios from "axios";

const MORNING_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"];
const EVENING_SLOTS = [
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
  "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM","11:00 PM",
];

const STYLES = {
  available: { border: "#CBD5E1", bg: "#FFFFFF", text: "#1B263B" },
  unavailable: { border: "#F1F5F9", bg: "#F8FAFC", text: "#CBD5E1" },
  selected: { border: "#FFC300", bg: "#FFFDF4", text: "#1B263B" },
};

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

  // Refresh automatically when the user comes back to the tab (replaces the refresh button)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchBookedSlots();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchBookedSlots]);

  const isAvailable = useCallback(
    (timeString) => {
      const slotTime = getSlotDayjs(timeString);
      if (bookedSlots.some((bTime) => dayjs(bTime).isSame(slotTime, "minute"))) return false;
      if (slotTime.isBefore(now)) return false;
      return true;
    },
    [bookedSlots, now]
  );

  const noBarber = !barberId;

  // Clear selection if the chosen slot stops being available
  useEffect(() => {
    if (selectedTime && !isAvailable(selectedTime)) {
      setSelectedTime(null);
      onTimeSelect(null);
    }
  }, [selectedTime, isAvailable, onTimeSelect]);

  const handleSelect = (time) => {
    setSelectedTime(time);
    onTimeSelect(time);
  };

  const renderSlot = (time) => {
    const available = !noBarber && isAvailable(time);
    const isSelected = selectedTime === time && available;
    const style = isSelected ? STYLES.selected : available ? STYLES.available : STYLES.unavailable;

    return (
      <ButtonBase
        key={time}
        disabled={!available}
        onClick={() => handleSelect(time)}
        aria-pressed={isSelected}
        aria-label={`${time}, ${available ? "available" : "unavailable"}${isSelected ? ", selected" : ""}`}
        sx={{
          minHeight: 44,
          borderRadius: "8px",
          fontSize: "0.85rem",
          fontWeight: isSelected ? 700 : 500,
          border: "2px solid",
          borderColor: style.border,
          bgcolor: style.bg,
          color: style.text,
          cursor: available ? "pointer" : "not-allowed",
          transition: "border-color 0.15s ease, background-color 0.15s ease",
          "&:hover:not(.Mui-disabled)": { borderColor: "#FFC300" },
          "&:focus-visible": { outline: "2px solid #FFC300", outlineOffset: 2 },
        }}
      >
        {time}
      </ButtonBase>
    );
  };

  const gridSx = {
    display: "grid",
    gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
    gap: 1,
  };

  const renderGroup = (label, slots) => (
    <Box>
      <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", mb: 0.75 }}>
        {label}
      </Typography>
      <Box sx={gridSx}>{slots.map(renderSlot)}</Box>
    </Box>
  );

  const renderLegendItem = (bg, border, label) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 10, height: 10, bgcolor: bg, border: `1.5px solid ${border}`, borderRadius: "3px" }} />
      <Typography sx={{ fontSize: "12px", color: "#64748B" }}>{label}</Typography>
    </Box>
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1B263B", mb: 1.5 }}>
        Today, {now.format("ddd DD MMM")}
      </Typography>

      {noBarber && (
        <Typography sx={{ fontSize: "13px", color: "#64748B", mb: 1.5 }}>
          Choose a barber above to see available times.
        </Typography>
      )}

      {!noBarber && error && !loadingSlots && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontSize: "13px", color: "#64748B" }}>Couldn't load times.</Typography>
          <Button
            size="small"
            onClick={fetchBookedSlots}
            sx={{ fontWeight: 600, color: "#1B263B", textTransform: "none", minWidth: 0 }}
          >
            Retry
          </Button>
        </Box>
      )}

      {loadingSlots ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[4, 9].map((count, i) => (
            <Box key={i} sx={gridSx}>
              {Array.from({ length: count }).map((_, j) => (
                <Skeleton key={j} variant="rounded" height={44} />
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {renderGroup("Morning", MORNING_SLOTS)}
          {renderGroup("Evening", EVENING_SLOTS)}

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            {renderLegendItem(STYLES.available.bg, STYLES.available.border, "Available")}
            {renderLegendItem(STYLES.unavailable.bg, STYLES.unavailable.border, "Unavailable")}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TimeManager;