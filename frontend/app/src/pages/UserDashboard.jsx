import { Grid, Box } from '@mui/material';
import Profile from '../components/Profile.jsx';
import PersonalBookings from '../components/PersonalBookings.jsx';

const UserDashboard = () => {
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
        spacing={3}
        justifyContent="center"
        alignItems="flex-start"
        direction="column"
        wrap="nowrap"
      >
        <Grid item sx={{ width: "100%", maxWidth: { lg: 900 } }}>
          <PersonalBookings />
        </Grid>
        <Grid item sx={{ width: "100%", maxWidth: { lg: 900 } }}>
          <Profile />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;