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

// Components
import Spinner from "./components/Spinner.jsx";
import ErrorTab from "./components/ErrorTab.jsx";
import PrivateRoutes from "./components/PrivateRoutes.jsx";
import PublicRoutes from "./components/PublicRoutes.jsx";
import Navbar from "./components/Navbar.jsx";

// Redux
import { setUser } from "./redux/features/authSlice";
import { showLoading, hideLoading } from "./redux/features/alertSlice";
import {
  fetchServicesStart,
  fetchServicesSuccess,
  fetchServicesFailure,
} from "./redux/features/serviceSlice";

axios.defaults.baseURL = "http://localhost:8080";
axios.defaults.withCredentials = true;

function App() {
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.alert);
  const { user } = useSelector((state) => state.auth);
  const { services } = useSelector((state) => state.service);

  const [authChecked, setAuthChecked] = useState(false);

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
            <Route element={<PrivateRoutes />}>
              <Route path="/" element={<Home />} />
              <Route path="/barber/dashboard" element={<BarberDashboard />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
            </Route>

            <Route element={<PublicRoutes />}>
              <Route path="/login" element={<BarberLogin />} />
              <Route path="/barber/login" element={<BarberLogin />} />
              <Route path="/barber/register" element={<BarberRegister />} />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Box>
      </Router>
    </Box>
  );
}

export default App;