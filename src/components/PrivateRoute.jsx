import {
  Navigate,
} from "react-router-dom";

import {
  getCurrentAdmin,
} from "../utils/auth";

export default function PrivateRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  const admin =
    getCurrentAdmin();

  // Pas de JWT
  if (!token) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Token présent mais utilisateur local absent
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

  // Compte éventuellement désactivé
  if (
    admin.isActive ===
    false
  ) {
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

  return children;
}