// components/PrivateRoutes.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoutes = ({allowedRole}) => {
  const { user } = useSelector((state) => state.auth);

  if(!user)
  {
  return <Navigate to="/login" replace />;
  }

  if(allowedRole && user.role !== allowedRole)
  {
    const redirectPath ="/";
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />

};

export default PrivateRoutes;