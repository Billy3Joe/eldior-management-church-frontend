import {
  Navigate,
} from "react-router-dom";

import {
  getCurrentAdmin,
} from "../utils/auth";

export default function AdminRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  const admin =
    getCurrentAdmin();

  // Pas connecté
  if (!token) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Données utilisateur inexistantes
  if (!admin) {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "admin"
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Connecté mais pas admin
  if (
    admin.role !==
    "admin"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}