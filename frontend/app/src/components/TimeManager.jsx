import { useState } from "react";
import { Box, Paper, Typography, ButtonBase } from "@mui/material";
import dayjs from "dayjs";

const TimeManager = ({ onTimeSelect }) => {
  const [selectedTime, setSelectedTime] = useState(null);

  const morningSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"];
  const eveningSlots = ["2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

  // Check if slot has already passed today
  const isTimePast = (timeString) => {
    const [t, modifier] = timeString.split(" ");
    let [hours, minutes] = t.split(":");

    if (modifier === "PM" && hours !== "12") hours = +hours + 12;
    if (modifier === "AM" && hours === "12") hours = 0;

    const slotTime = dayjs()
      .hour(parseInt(hours, 10))
      .minute(parseInt(minutes, 10))
      .second(0);

    return slotTime.isBefore(dayjs());
  };

  const renderSlot = (time) => {
    const past = isTimePast(time);
    const isSelected = selectedTime === time;

    return (
      <ButtonBase
        key={time}
        disabled={past}
        onClick={() => {
          if (past) return;
          setSelectedTime(time);
          onTimeSelect(time);
        }}
        sx={{
          py: 1,
          px: 0.5,
          borderRadius: 1,
          fontSize: "0.9rem",
          fontWeight: 500,
          transition: "all 0.2s",
          // Past: grey | Selected: yellow border | Available: green border
          border: isSelected
            ? "3px solid #FFC300"
            : past
            ? "1px solid #d1d5db"
            : "1px solid #86efac",
          // Past: grey bg | Selected: soft yellow bg | Available: soft green bg
          bgcolor: isSelected
            ? "#ffe9a2ff"
            : past
            ? "#e5e7eb"
            : "#dcfce7",
          // Past: muted text | Selected: black | Available: dark green
          color: isSelected ? "#000" : past ? "#9ca3af" : "#15803d",
          cursor: past ? "not-allowed" : "pointer",
          opacity: past ? 0.6 : 1,
        }}
      >
        {time}
      </ButtonBase>
    );
  };

  return (
    <Box sx={{ width: "auto", mb: 2 }}>
      <Paper elevation={1} sx={{ border: "1px solid #e5e7eb" }}>
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box>
            <Typography variant="body2" fontWeight={500} color="#000" sx={{ mb: 0.5, px: 0.5 }}>
              Morning
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5 }}>
              {morningSlots.map(renderSlot)}
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" fontWeight={500} color="#000" sx={{ mb: 0.5, px: 0.5 }}>
              Evening
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.5 }}>
              {eveningSlots.map(renderSlot)}
            </Box>
          </Box>

          {/* Status Legend */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", pt: 1, mt: 0.5, borderTop: "1px solid #f3f4f6" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: "#dcfce7", border: "1px solid #86efac", borderRadius: 0.5 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Available
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: "#e5e7eb", border: "1px solid #d1d5db", borderRadius: 0.5 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Unavailable (Past)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TimeManager;