import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const token =
    localStorage.getItem("token");

  const storedUser =
    localStorage.getItem("admin");

  // Pas connecté
  if (!token || !storedUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  let user = null;

  try {
    user = JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Erreur lecture utilisateur localStorage :",
      error
    );

    localStorage.removeItem("token");
    localStorage.removeItem("admin");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ===============================================
  // SUPER ADMIN PLATEFORME
  // ===============================================

  if (
    user?.platformRole ===
    "superadmin"
  ) {
    return children;
  }

  // ===============================================
  // ADMIN D'UNE ÉGLISE
  // ===============================================

  if (
    user?.role === "admin"
  ) {
    return children;
  }

  // ===============================================
  // AUTRES UTILISATEURS
  // ===============================================

  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );
};

export default AdminRoute;