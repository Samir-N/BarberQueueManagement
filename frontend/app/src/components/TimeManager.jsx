import { useState, useEffect, useCallback } from "react";
import { Box, Typography, ButtonBase, Button, Skeleton } from "@mui/material";
import dayjs from "dayjs";
import axios from "axios";

const MORNING_SLOTS = ["8:00 AM"];
const EVENING_SLOTS = [
  "2:00 PM",
];
const ALL_SLOTS = [...MORNING_SLOTS, ...EVENING_SLOTS];

const getSlotDayjs = (timeString) => {
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
};

/**
 * onlyAvailable (default false):
 *   false -> original layout: Morning / Afternoon groups, unavailable slots greyed out, legend.
 *   true  -> simple layout for the booking flow: one grid with ONLY the free times.
 */
const TimeManager = ({ barberId, serviceId, onTimeSelect, onlyAvailable = false }) => {
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

    return (
      <ButtonBase
        key={time}
        disabled={!available}
        onClick={() => handleSelect(time)}
        sx={{
          minHeight: onlyAvailable ? 60 : 48,
          px: 1,
          borderRadius: 0,
          fontSize: onlyAvailable ? "1.15rem" : "0.95rem",
          fontWeight: onlyAvailable ? 700 : isSelected ? 700 : 500,
          border: "2px solid",
          borderColor: isSelected ? "#FFC300" : available ? "#E2E8F0" : "#F1F5F9",
          bgcolor: isSelected ? (onlyAvailable ? "#FFC300" : "#FFFDF4") : available ? "#FFFFFF" : "#F8FAFC",
          color: isSelected ? "#1B263B" : available ? (onlyAvailable ? "#1B263B" : "#334155") : "#CBD5E1",
          cursor: available ? "pointer" : "not-allowed",
          transition: "all 0.15s ease",
          "&:hover:not(.Mui-disabled)": { borderColor: "#FFC300" },
          "&:active:not(.Mui-disabled)": { transform: "scale(0.97)" },
        }}
      >
        {time}
      </ButtonBase>
    );
  };

  const gridSx = {
    display: "grid",
    gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
    gap: 1.25,
  };

  const retryButton = (
    <Button
      size="small"
      onClick={fetchBookedSlots}
      sx={{ fontSize: "14px", color: "#EF4444", textTransform: "none", p: 0, minWidth: 0 }}
    >
      Could not load times. Tap to retry
    </Button>
  );

  /* ---------- simple mode: only the free times ---------- */
  if (onlyAvailable) {
    const freeSlots = noBarber ? [] : ALL_SLOTS.filter(isAvailable);

    if (loadingSlots) {
      return (
        <Box sx={gridSx}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={60} />
          ))}
        </Box>
      );
    }

    if (error) return <Box sx={{ py: 2 }}>{retryButton}</Box>;

    if (freeSlots.length === 0) {
      return (
        <Typography sx={{ fontSize: 18, color: "#475569", py: 2 }}>
          No times left today for this barber. Go back and pick another barber.
        </Typography>
      );
    }

    return <Box sx={gridSx}>{freeSlots.map(renderSlot)}</Box>;
  }

  /* ---------- original mode ---------- */
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1.5 }}>
        <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#1B263B" }}>
          Today ({now.format("MMM D")})
        </Typography>
        {noBarber && (
          <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
            Select a barber first
          </Typography>
        )}
        {!noBarber && error && !loadingSlots && retryButton}
      </Box>

      {loadingSlots ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[3, 6].map((count, i) => (
            <Box key={i} sx={gridSx}>
              {Array.from({ length: count }).map((_, j) => (
                <Skeleton key={j} variant="rectangular" height={48} />
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.75 }}>
              Morning
            </Typography>
            <Box sx={gridSx}>{MORNING_SLOTS.map(renderSlot)}</Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.75 }}>
              Afternoon & Evening
            </Typography>
            <Box sx={gridSx}>{EVENING_SLOTS.map(renderSlot)}</Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", pt: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "50%" }} />
              <Typography sx={{ fontSize: "11px", color: "#64748B" }}>Available</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: "#F1F5F9", borderRadius: "50%" }} />
              <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>Unavailable</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TimeManager;