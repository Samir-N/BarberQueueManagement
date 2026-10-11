import { Stack, Box } from "@mui/material";
import Profile from "../components/Profile.jsx";
import PersonalBookings from "../components/PersonalBookings.jsx";

const UserDashboard = () => {
  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Stack
        spacing={{ xs: 2, sm: 3 }}
        sx={{
          width: "100%",
          maxWidth: { lg: 900 },
          mx: "auto",
        }}
      >
        <PersonalBookings />
        <Profile />
      </Stack>
    </Box>
  );
};

export default UserDashboard;