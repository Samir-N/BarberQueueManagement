// components/PrivateRoutes.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoutes = () => {
  const { user } = useSelector((state) => state.auth);

  // Simply check if user exists. Do NOT check alert.loading here!
  return user ? <Outlet /> : <Navigate to="/barber/login" replace />;
};

export default PrivateRoutes;