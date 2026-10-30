import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

// Pages
import Home from "./pages/Home.jsx";
import BarberLogin from "./pages/BarberLogin.jsx";
import BarberDashboard from "./pages/BarberDashboard.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import PageNotFound from "./pages/PageNotFound.jsx";
import BarberRegister from "./pages/BarberRegister.jsx";
import Contact from "./pages/Contact.jsx";
import BarberAnalytics from "./pages/BarberAnalytics.jsx";

// Components
import Spinner from "./components/Spinner.jsx";
import ErrorTab from "./components/ErrorTab.jsx";
import PrivateRoutes from "./components/PrivateRoutes.jsx";
import PublicRoutes from "./components/PublicRoutes.jsx";
import Navbar from "./components/Navbar.jsx";

// Socket + hooks
import socket from "./socket/socket.js";
import useSoundNotification from "./hooks/useSoundNotification";

// Redux
import { setUser } from "./redux/features/authSlice";
import { showLoading, hideLoading } from "./redux/features/alertSlice";
import {
  fetchServicesStart,
  fetchServicesSuccess,
  fetchServicesFailure,
} from "./redux/features/serviceSlice";
import {
  bookingData,
  addBooking,
  deleteBooking,
  updateBooking,
  updateStatus,
} from "./redux/features/bookingSlice";

axios.defaults.baseURL = import.meta.env.VITE_API_URL ?? "";
axios.defaults.withCredentials = true;

function App() {
  const dispatch = useDispatch();
  const playSound = useSoundNotification();

  const { loading } = useSelector((state) => state.alert);
  const { user } = useSelector((state) => state.auth);
  const { services } = useSelector((state) => state.service);

  const [authChecked, setAuthChecked] = useState(false);

  const currentUserId = user?._id || user?.id;
  const userRole = user?.role;

  // ---------------------------------------------------------------
  // Initial data: services + session check
  // ---------------------------------------------------------------
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch(showLoading());

      try {
        // Fetch services if store is empty
        if (!services || services.length === 0) {
          dispatch(fetchServicesStart());
          const serviceRes = await axios.get("/api/v1/user/services");
          if (serviceRes.data?.success) {
            dispatch(fetchServicesSuccess(serviceRes.data.data));
          } else {
            dispatch(fetchServicesFailure("Failed to fetch services"));
          }
        }

        // Session check via HttpOnly cookie based on stored role
        if (!user) {
          const role = localStorage.getItem("role");

          if (role) {
            const endpoint =
              role === "barber"
                ? "/api/v1/barber/getBarberData"
                : "/api/v1/user/getUserData";

            const userRes = await axios.get(endpoint);

            if (userRes.data?.success) {
              const userData =
                userRes.data.barber || userRes.data.user || userRes.data.data;
              dispatch(setUser({ user: userData }));
            }
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          // Cookie expired or invalid -> clear stored role
          localStorage.removeItem("role");
        } else {
          console.error(
            "Auth session check error:",
            error?.response?.data || error.message
          );
        }
      } finally {
        dispatch(hideLoading());
        setAuthChecked(true);
      }
    };

    loadInitialData();
  }, [dispatch]);

  // ---------------------------------------------------------------
  // Load all bookings once a user is known (login or session restore).
  // Clears the list on logout. Also refetches when the socket
  // reconnects so missed events are recovered.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!currentUserId) {
      dispatch(bookingData([]));
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await axios.get("/api/v1/user/getBookings");
        if (res.data?.success) {
          dispatch(bookingData(res.data.data));
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      }
    };

    fetchBookings();

    // socket.io-client v4: "reconnect" is emitted on the Manager
    socket.io?.on("reconnect", fetchBookings);
    return () => {
      socket.io?.off("reconnect", fetchBookings);
    };
  }, [currentUserId, dispatch]);

  // ---------------------------------------------------------------
  // Real-time booking events (active on every page, not just the queue)
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!currentUserId) return;

    const handleNewBooking = (booking) => {
      dispatch(addBooking(booking));

      // Handles populated object or plain string/ID
      const bookingBarberId =
        typeof booking?.barberId === "object"
          ? booking.barberId?._id || booking.barberId?.id
          : booking?.barberId;

      // Notify ONLY the barber the booking is assigned to
      if (
        userRole === "barber" &&
        String(bookingBarberId) === String(currentUserId)
      ) {
        playSound();
        if ("vibrate" in navigator) {
          navigator.vibrate([300, 100, 300]);
        }
      }
    };

    const handleDeletedBooking = (booking) => dispatch(deleteBooking(booking));
    const handleUpdatedBooking = (booking) => dispatch(updateBooking(booking));
    const handleStatusUpdated = (booking) => dispatch(updateStatus(booking));

    socket.on("bookingCreated", handleNewBooking);
    socket.on("bookingDeleted", handleDeletedBooking);
    socket.on("bookingUpdated", handleUpdatedBooking);
    socket.on("bookingStatusUpdated", handleStatusUpdated);

    return () => {
      socket.off("bookingCreated", handleNewBooking);
      socket.off("bookingDeleted", handleDeletedBooking);
      socket.off("bookingUpdated", handleUpdatedBooking);
      socket.off("bookingStatusUpdated", handleStatusUpdated);
    };
  }, [dispatch, currentUserId, userRole, playSound]);

  // Early return must stay AFTER all hooks
  if (!authChecked) {
    return <Spinner />;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#F9F9F6" }}>
      <ErrorTab />
      {loading && <Spinner />}

      <Router>
        <Navbar />

        <Box
          component="main"
          sx={{
            pt: { xs: "64px", sm: "70px" },
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Routes>
            {/* Public / Auth Routes */}
            <Route element={<PublicRoutes />}>
              <Route path="/login" element={<BarberLogin />} />
              <Route path="/register" element={<BarberRegister />} />
            </Route>

            {/* Shared Homepage for all authenticated users */}
            <Route element={<PrivateRoutes />}>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Regular User Only Routes */}
            <Route element={<PrivateRoutes allowedRole={"user"} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
            </Route>

            {/* Barber Only Routes */}
            <Route element={<PrivateRoutes allowedRole={"barber"} />}>
              <Route path="/barber/dashboard" element={<BarberDashboard />} />
              <Route path="/barber/viewAnalytics" element={<BarberAnalytics />} />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Box>
      </Router>
    </Box>
  );
}

export default App;