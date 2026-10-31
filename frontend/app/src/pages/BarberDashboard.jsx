import React, { useEffect } from 'react';
import { Box, Card } from '@mui/material';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import WaitingList from '../components/WaitingList';

const BarberDashboard = () => {
  const authUser = useSelector((state) => state.auth?.user);

  useEffect(() => {
    // 1. Retrieve logged-in user / barber info from Redux or localStorage fallback
    const userStorage = localStorage.getItem('user') || localStorage.getItem('userInfo');
    const localUser = userStorage ? JSON.parse(userStorage) : null;
    const barberId = authUser?._id || authUser?.id || localUser?._id || localUser?.id;

    if (!barberId) {
      console.warn("No barber ID found in Redux or localStorage. Real-time status sync skipped.");
      return;
    }

    // 2. Pull dynamic socket URL from environment variable
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://barber-queue-api.onrender.com";

    // 3. Connect to backend socket using env URL and auth handshake
    const socket = io(SOCKET_URL, {
      auth: { barberId },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to socket server as barber:", barberId);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
    });

    // Cleanup connection on unmount
    return () => {
      socket.disconnect();
    };
  }, [authUser]);

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