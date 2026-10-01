import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import Home from "./pages/Home.jsx";
import BarberLogin from "./pages/BarberLogin.jsx";
import BarberDashboard from "./pages/BarberDashboard.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import PageNotFound from "./pages/PageNotFound.jsx";
import BarberRegister from "./pages/BarberRegister.jsx";
import Spinner from "./components/Spinner.jsx";
import ErrorTab from "./components/ErrorTab.jsx";
import PrivateRoutes from "./components/PrivateRoutes.jsx";
import PublicRoutes from "./components/PublicRoutes.jsx";
import Navbar from "./components/Navbar.jsx";

import { setUser } from "./redux/features/authSlice";
import { bookingData } from "./redux/features/bookingSlice";
import { showLoading, hideLoading } from "./redux/features/alertSlice";
import {
  fetchServicesStart,
  fetchServicesSuccess,
  fetchServicesFailure,
} from "./redux/features/serviceSlice";

import { store } from "./redux/store";

function App() {
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.alert);
  const { user } = useSelector((state) => state.auth);
useEffect(() => {
    const loadAllData = async () => {
      const token = localStorage.getItem("token");
      dispatch(showLoading());

      try {
        // 1. Fetch Services if empty
        const currentServices = store.getState().service.services;
        if (currentServices.length === 0) {
          dispatch(fetchServicesStart());
          const serviceRes = await axios.get("/api/v1/user/services");
          if (serviceRes.data.success) {
            dispatch(fetchServicesSuccess(serviceRes.data.data));
          } else {
            dispatch(fetchServicesFailure("Failed to fetch services"));
          }
        }

        // 2. Fetch User & Bookings if token exists
        if (token) {
          if (!user) {
            const userRes = await axios.post("/api/v1/user/getUserData", {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.data.success) {
              dispatch(setUser({ user: userRes.data.data }));
            } else {
              localStorage.removeItem("token");
            }
          }

          const bookingRes = await axios.get("/api/v1/user/getBookings", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (bookingRes.data.success) {
            dispatch(bookingData(bookingRes.data.data));
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
        }
      } finally {
        // Ensures loading is ALWAYS hidden once everything settles
        dispatch(hideLoading());
      }
    };

    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#F9F9F6",
      }}
    >
      <ErrorTab />

      {loading && <Spinner />}

      <Router>
        <Navbar />

        <Box
          sx={{
            pt: { xs: "64px", md: "64px" },
            pb: { xs: "64px", md: 0 },
            minHeight: "100vh",
          }}
        >
          <Routes>
            <Route element={<PrivateRoutes />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/barber/dashboard"
                element={<BarberDashboard />}
              />
              <Route
                path="/user/dashboard"
                element={<UserDashboard />}
              />
            </Route>

            <Route element={<PublicRoutes />}>
              <Route
                path="/barber/login"
                element={<BarberLogin />}
              />
              <Route
                path="/barber/register"
                element={<BarberRegister />}
              />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Box>
      </Router>
    </Box>
  );
}

export default App;