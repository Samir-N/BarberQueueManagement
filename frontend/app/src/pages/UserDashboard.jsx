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
      <Grid container spacing={3}>
        <Grid item xs={12} md={7} lg={5}>
          <PersonalBookings />
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <Profile />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;