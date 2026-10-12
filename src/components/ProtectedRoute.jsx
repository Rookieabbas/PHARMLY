import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("adminToken");

  // If there's no token, redirect to the login page (root route)
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child routes (e.g., Layout and its contents)
  return <Outlet />;
};

export default ProtectedRoute;
