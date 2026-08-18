import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (admin?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}