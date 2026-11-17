import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}   

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem("userToken");
    const user = localStorage.getItem("user");
    return token && user;
  };

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;