import { Box } from "@mui/material";
import Profile from "../components/Profile.jsx";
import PersonalBookings from "../components/PersonalBookings.jsx";

const NAVBAR_HEIGHT = 64; // change if your Navbar height differs
const GAP = 0; // space between the two cards (px)

const UserDashboard = () => {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        display: "flex",
        justifyContent: "start", // vertical centering
        alignItems: "center", // horizontal centering
        flexDirection: "column",
        px: { xs: 2, sm: 3 },
        py: 2,
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 600, // same width for both cards on PC
          display: "flex",
          flexDirection: "column",
          gap: `${GAP}px`,
          "& > *": { width: "100%", margin: 0 }, // force equal width, no margins
        }}
      >
        <PersonalBookings />
        <Profile />
      </Box>
    </Box>
  );
};

export default UserDashboard;