import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ScheduleIcon from '@mui/icons-material/Schedule';

const BarberAnalytics = () => {
  // Placeholder stats - replace these with your backend data later
  const stats = [
    { title: 'Total Revenue', value: '$1,245', icon: <AttachMoneyIcon sx={{ color: '#FFC300', fontSize: '28px' }} />, change: '+12% from last week' },
    { title: 'Appointments', value: '48', icon: <ScheduleIcon sx={{ color: '#0F172A', fontSize: '28px' }} />, change: '+4 today' },
    { title: 'Total Clients', value: '312', icon: <PeopleIcon sx={{ color: '#0F172A', fontSize: '28px' }} />, change: '+18 this month' },
    { title: 'Completion Rate', value: '98%', icon: <TrendingUpIcon sx={{ color: '#10B981', fontSize: '28px' }} />, change: '+2% improvement' },
  ];

  return (
    <Box 
      sx={{ 
        maxWidth: '1280px', 
        width: '100%', 
        mx: 'auto', 
        px: { xs: 2, md: 4 }, 
        pt: '100px', // Leaves space for the fixed navbar
        pb: 6 
      }}
    >
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ fontSize: { xs: '24px', md: '30px' }, fontWeight: 700, color: '#0F172A', mb: 1 }}
        >
          Barber Analytics
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ fontSize: '15px', color: '#64748B' }}
        >
          Monitor your daily appointments, earnings, and client activity at a glance.
        </Typography>
      </Box>

      {/* KPI Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 2, 
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                boxSizing: 'border-box',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>
                  {stat.title}
                </Typography>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1.5, 
                    backgroundColor: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#10B981' }}>
                  {stat.change}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Simple Recent Activity / Summary Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF'
        }}
      >
        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', mb: 2 }}>
          Performance Overview
        </Typography>
        <Typography sx={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
          Your shop is performing exceptionally well this week. Client retention has gone up, and morning slots are fully booked. Connect this view with your booking database endpoint to display dynamic charts or live metrics.
        </Typography>
      </Paper>
    </Box>
  );
};

export default BarberAnalytics;