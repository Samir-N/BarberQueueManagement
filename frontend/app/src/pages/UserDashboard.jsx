import { Box } from "@mui/material";
import Profile from "../components/Profile.jsx";
import PersonalBookings from "../components/PersonalBookings.jsx";

const GAP = 12; // space between the cards in px (try 12 if you want a little room)

const UserDashboard = () => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: 520, md: 1040 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // stacked on mobile, side by side on PC
          alignItems: "flex-start",
          gap: `${GAP}px`,
        }}
      >
        <Box sx={{ flex: 1, width: "100%", minWidth: 0 }}>
          <PersonalBookings />
        </Box>
        <Box sx={{ flex: 1, width: "100%", minWidth: 0 }}>
          <Profile />
        </Box>
      </Box>
    </Box>
  );
};

export default UserDashboard;