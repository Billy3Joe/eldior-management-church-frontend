import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentAdmin,
  isAdmin,
} from "../utils/auth";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const admin = getCurrentAdmin();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");

    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell premium-shell">
      {/* ========================================= */}
      {/* SIDEBAR DESKTOP */}
      {/* ========================================= */}

      <aside className="sidebar premium-sidebar desktop-sidebar">
        <div>
          <div className="brand premium-brand">
            <div className="brand-badge">
              EMC
            </div>

            <div>
              <h2>ElDior</h2>

              <span>
                Management Church
              </span>
            </div>
          </div>

          <nav className="menu premium-menu">
            <Link
              className={
                isActive("/dashboard")
                  ? "active"
                  : ""
              }
              to="/dashboard"
            >
              Dashboard
            </Link>

            <Link
              className={
                isActive("/members")
                  ? "active"
                  : ""
              }
              to="/members"
            >
              Membres
            </Link>

            <Link
              className={
                isActive("/departments")
                  ? "active"
                  : ""
              }
              to="/departments"
            >
              Départements
            </Link>

            <Link
              className={
                isActive("/events")
                  ? "active"
                  : ""
              }
              to="/events"
            >
              Événements
            </Link>

            <Link
              className={
                isActive("/attendance")
                  ? "active"
                  : ""
              }
              to="/attendance"
            >
              Présences
            </Link>

            <Link
              className={
                isActive("/assignments")
                  ? "active"
                  : ""
              }
              to="/assignments"
            >
              Programmations
            </Link>

            <Link
              className={
                isActive("/reports")
                  ? "active"
                  : ""
              }
              to="/reports"
            >
              Rapports
            </Link>

            <Link
              className={
                isActive("/settings")
                  ? "active"
                  : ""
              }
              to="/settings"
            >
              Paramètres
            </Link>

            {/* ===================================== */}
            {/* ADMIN UNIQUEMENT */}
            {/* ===================================== */}

            {isAdmin() && (
              <>
                <Link
                  className={
                    isActive("/admin-users")
                      ? "active"
                      : ""
                  }
                  to="/admin-users"
                >
                  Admin Users
                </Link>

                <Link
                  className={
                    isActive("/activity-logs")
                      ? "active"
                      : ""
                  }
                  to="/activity-logs"
                >
                  Journal activité
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* ========================================= */}
        {/* UTILISATEUR DESKTOP */}
        {/* ========================================= */}

        <div className="sidebar-footer premium-sidebar-footer">
          <div className="user-chip">
            <div className="avatar-circle">
              {(admin?.name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p>
                {admin?.name ||
                  "Administrateur"}
              </p>

              <small>
                {admin?.email ||
                  "admin"}
              </small>

              <small
                style={{
                  display: "block",
                  marginTop: 2,
                }}
              >
                {admin?.role === "admin"
                  ? "Administrateur"
                  : "Manager"}
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ========================================= */}
      {/* OVERLAY MOBILE */}
      {/* ========================================= */}

      <div
        className={`mobile-drawer-overlay ${
          mobileMenuOpen
            ? "open"
            : ""
        }`}
        onClick={closeMobileMenu}
      />

      {/* ========================================= */}
      {/* MENU MOBILE */}
      {/* ========================================= */}

      <aside
        className={`mobile-drawer ${
          mobileMenuOpen
            ? "open"
            : ""
        }`}
      >
        <div>
          <div className="brand premium-brand">
            <div className="brand-badge">
              EMC
            </div>

            <div>
              <h2>ElDior</h2>

              <span>
                Management Church
              </span>
            </div>
          </div>

          <nav className="menu premium-menu">
            <Link
              className={
                isActive("/dashboard")
                  ? "active"
                  : ""
              }
              to="/dashboard"
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>

            <Link
              className={
                isActive("/members")
                  ? "active"
                  : ""
              }
              to="/members"
              onClick={closeMobileMenu}
            >
              Membres
            </Link>

            <Link
              className={
                isActive("/departments")
                  ? "active"
                  : ""
              }
              to="/departments"
              onClick={closeMobileMenu}
            >
              Départements
            </Link>

            <Link
              className={
                isActive("/events")
                  ? "active"
                  : ""
              }
              to="/events"
              onClick={closeMobileMenu}
            >
              Événements
            </Link>

            <Link
              className={
                isActive("/attendance")
                  ? "active"
                  : ""
              }
              to="/attendance"
              onClick={closeMobileMenu}
            >
              Présences
            </Link>

            <Link
              className={
                isActive("/assignments")
                  ? "active"
                  : ""
              }
              to="/assignments"
              onClick={closeMobileMenu}
            >
              Programmations
            </Link>

            <Link
              className={
                isActive("/reports")
                  ? "active"
                  : ""
              }
              to="/reports"
              onClick={closeMobileMenu}
            >
              Rapports
            </Link>

            <Link
              className={
                isActive("/settings")
                  ? "active"
                  : ""
              }
              to="/settings"
              onClick={closeMobileMenu}
            >
              Paramètres
            </Link>

            {/* ADMIN UNIQUEMENT */}

            {isAdmin() && (
              <>
                <Link
                  className={
                    isActive("/admin-users")
                      ? "active"
                      : ""
                  }
                  to="/admin-users"
                  onClick={closeMobileMenu}
                >
                  Admin Users
                </Link>

                <Link
                  className={
                    isActive("/activity-logs")
                      ? "active"
                      : ""
                  }
                  to="/activity-logs"
                  onClick={closeMobileMenu}
                >
                  Journal activité
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* ========================================= */}
        {/* UTILISATEUR MOBILE */}
        {/* ========================================= */}

        <div className="sidebar-footer premium-sidebar-footer">
          <div className="user-chip">
            <div className="avatar-circle">
              {(admin?.name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p>
                {admin?.name ||
                  "Administrateur"}
              </p>

              <small>
                {admin?.email ||
                  "admin"}
              </small>

              <small
                style={{
                  display: "block",
                  marginTop: 2,
                }}
              >
                {admin?.role === "admin"
                  ? "Administrateur"
                  : "Manager"}
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              closeMobileMenu();
              logout();
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ========================================= */}
      {/* CONTENU PRINCIPAL */}
      {/* ========================================= */}

      <main className="main-content premium-main">
        <header className="top-header premium-top-header">
          <div className="mobile-topbar">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => {
                setMobileMenuOpen(true);
              }}
            >
              ☰
            </button>

            <div>
              <h1>
                Administration
              </h1>

              <p>
                Plateforme de gestion
                d’église
              </p>
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}