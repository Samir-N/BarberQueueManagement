import { Grid, Box, useMediaQuery, useTheme } from '@mui/material';
import Profile from '../components/Profile.jsx';
import PersonalBookings from '../components/PersonalBookings.jsx';

const UserDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Grid
        container
        direction={isMobile ? "column" : "row"}
        spacing={3}
        alignItems={isMobile ? "center" : "flex-start"}
        justifyContent="center"
      >
        <Grid item xs={12} sm={12} md={5} lg={4} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Profile />
        </Grid>

        <Grid item xs={12} sm={12} md={7} lg={5} sx={{ width: { xs: "100%", md: "auto" } }}>
          <PersonalBookings />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;