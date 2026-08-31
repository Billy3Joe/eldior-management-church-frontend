import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  getCurrentAdmin,
} from "../utils/auth";

export default function PrivateRoute({
  children,
}) {
  const location =
    useLocation();

  const token =
    localStorage.getItem(
      "token"
    );

  const admin =
    getCurrentAdmin();

  // ======================================================
  // PAS DE TOKEN
  // ======================================================

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  // ======================================================
  // TOKEN PRÉSENT MAIS UTILISATEUR LOCAL ABSENT
  // ======================================================

  if (!admin) {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "admin"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "church"
    );

    localStorage.removeItem(
      "plan"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ======================================================
  // COMPTE DÉSACTIVÉ
  // ======================================================

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

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "church"
    );

    localStorage.removeItem(
      "plan"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ======================================================
  // UTILISATEUR AUTORISÉ
  // ======================================================

  return children;
}