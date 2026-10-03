import React, { useEffect } from 'react';
import { Box, Card } from '@mui/material';
import WaitingList from '../components/WaitingList';
import { io } from 'socket.io-client';

const BarberDashboard = () => {
  useEffect(() => {
    // Retrieve logged-in user / barber info from localStorage (or Redux)
    const userStorage = localStorage.getItem('user');
    const barberUser = userStorage ? JSON.parse(userStorage) : null;
    const barberId = barberUser?._id || barberUser?.id;

    if (!barberId) {
      console.warn("No barber ID found in localStorage. Real-time status sync skipped.");
      return;
    }

    // Connect to backend socket and pass barberId in auth handshake
    const socket = io("http://localhost:8080", {
      auth: { barberId },
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to socket server as barber:", barberId);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
    });

    // Cleanup connection on unmount (logs the barber offline)
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        py: { xs: 4, sm: 6 },
        px: { xs: 2, sm: 3, md: 4 },
        maxWidth: '1200px',
        mx: 'auto',
      }}
    >
      <Card
        sx={{
          p: { xs: 4, sm: 6 },
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(27, 38, 59, 0.08)',
          backgroundColor: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <WaitingList />
      </Card>
    </Box>
  );
};

export default BarberDashboard;