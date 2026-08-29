import {
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentAdmin,
  isAdmin,
} from "../utils/auth";

import "./Layout.css";

export default function Layout({
  children,
}) {
  const navigate =
    useNavigate();

  const admin =
    getCurrentAdmin();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  // ======================================================
  // SUPER ADMIN
  // ======================================================

  const isSuperAdmin =
    admin?.platformRole ===
    "superadmin";

  // ======================================================
  // ÉGLISE CONNECTÉE
  // ======================================================

  const church =
    admin?.church || null;

  const churchName =
    church?.name ||
    "Mon église";

  const churchCity =
    church?.city ||
    "";

  const churchCountry =
    church?.country ||
    "";

  const churchPlan =
    String(
      church?.plan ||
        "free"
    ).toUpperCase();

  // ======================================================
  // INITIALE ÉGLISE
  // ======================================================

  const getChurchInitial =
    () => {
      if (
        !churchName
      ) {
        return "E";
      }

      return churchName
        .trim()
        .charAt(0)
        .toUpperCase();
    };

  // ======================================================
  // LOCALISATION
  // ======================================================

  const churchLocation =
    [
      churchCity,
      churchCountry,
    ]
      .filter(Boolean)
      .join(" • ");

  // ======================================================
  // DÉCONNEXION
  // ======================================================

  const handleLogout =
    () => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "admin"
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  // ======================================================
  // PLATEFORME ELDIOR
  // ======================================================

  const platformLinks = [
    {
      to: "/platform",
      label:
        "Vue plateforme",
      icon: "🛡️",
    },

    {
      to:
        "/platform/churches",
      label:
        "Églises clientes",
      icon: "⛪",
    },
  ];

  // ======================================================
  // GESTION ÉGLISE
  // ======================================================

  const mainLinks = [
    {
      to: "/dashboard",
      label:
        "Tableau de bord",
      icon: "🏠",
    },

    {
      to: "/members",
      label:
        "Membres",
      icon: "👥",
    },

    {
      to: "/departments",
      label:
        "Départements",
      icon: "🏢",
    },

    {
      to: "/events",
      label:
        "Événements",
      icon: "🗓️",
    },

    {
      to: "/attendance",
      label:
        "Présences",
      icon: "✅",
    },

    {
      to: "/assignments",
      label:
        "Programmations",
      icon: "📋",
    },

    {
      to: "/reports",
      label:
        "Rapports",
      icon: "📊",
    },

    {
      to: "/settings",
      label:
        "Paramètres",
      icon: "⚙️",
    },

    {
      to: "/subscription",
      label:
        "Mon abonnement",
      icon: "💳",
    },
  ];

  // ======================================================
  // ADMINISTRATION
  // ======================================================

  const adminLinks = [
    {
      to: "/users",
      label:
        "Utilisateurs",
      icon: "👤",
    },

    {
      to: "/activity-logs",
      label:
        "Journal activité",
      icon: "📌",
    },
  ];

  // ======================================================
  // RÔLE
  // ======================================================

  const getRoleLabel =
    () => {
      if (
        isSuperAdmin
      ) {
        return (
          "Super Administrateur"
        );
      }

      if (
        admin?.role ===
        "admin"
      ) {
        return (
          "Administrateur"
        );
      }

      if (
        admin?.role ===
        "manager"
      ) {
        return "Manager";
      }

      if (
        admin?.role ===
        "member"
      ) {
        return "Membre";
      }

      return "Utilisateur";
    };

  // ======================================================
  // STYLE DU PLAN
  // ======================================================

  const getPlanStyle =
    () => {
      switch (
        String(
          church?.plan ||
            "free"
        ).toLowerCase()
      ) {
        case "premium":
          return {
            background:
              "rgba(168, 85, 247, 0.16)",

            color:
              "#c4b5fd",

            border:
              "1px solid rgba(196, 181, 253, 0.18)",
          };

        case "standard":
          return {
            background:
              "rgba(59, 130, 246, 0.16)",

            color:
              "#93c5fd",

            border:
              "1px solid rgba(147, 197, 253, 0.18)",
          };

        default:
          return {
            background:
              "rgba(34, 197, 94, 0.15)",

            color:
              "#86efac",

            border:
              "1px solid rgba(134, 239, 172, 0.16)",
          };
      }
    };

  // ======================================================
  // LIEN SIDEBAR
  // ======================================================

  const renderLink = (
    item,
    closeMobile = false
  ) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={
        item.to ===
        "/platform"
      }
      onClick={() => {
        if (
          closeMobile
        ) {
          setMobileOpen(
            false
          );
        }
      }}
      className={({
        isActive,
      }) =>
        `sidebar-link ${
          isActive
            ? "active"
            : ""
        }`
      }
    >
      <span className="sidebar-link-icon">
        {item.icon}
      </span>

      <span className="sidebar-link-label">
        {item.label}
      </span>
    </NavLink>
  );

  // ======================================================
  // CARTE ÉGLISE
  // ======================================================

  const renderChurchCard =
    () => {
      if (!church) {
        return null;
      }

      return (
        <div
          style={{
            margin:
              "18px 0 16px",

            padding:
              "16px",

            borderRadius:
              "16px",

            background:
              "linear-gradient(135deg, rgba(91, 72, 238, 0.20), rgba(37, 99, 235, 0.08))",

            border:
              "1px solid rgba(139, 126, 255, 0.20)",

            boxShadow:
              "0 10px 25px rgba(0,0,0,0.08)",
          }}
        >
          {/* LABEL */}

          <div
            style={{
              marginBottom:
                "11px",

              color:
                "#8b93a7",

              fontSize:
                "9px",

              fontWeight:
                900,

              textTransform:
                "uppercase",

              letterSpacing:
                "1px",
            }}
          >
            {isSuperAdmin
              ? "Église active"
              : "Votre église"}
          </div>

          {/* IDENTITÉ */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "11px",
            }}
          >
            {/* LOGO / INITIALE */}

            <div
              style={{
                width:
                  "42px",

                minWidth:
                  "42px",

                height:
                  "42px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "12px",

                background:
                  "linear-gradient(135deg, #6d4aff, #4938d7)",

                color:
                  "#ffffff",

                fontSize:
                  "17px",

                fontWeight:
                  900,

                boxShadow:
                  "0 7px 17px rgba(92, 70, 235, 0.30)",
              }}
            >
              {getChurchInitial()}
            </div>

            {/* INFORMATIONS */}

            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  color:
                    "#ffffff",

                  fontSize:
                    "13px",

                  fontWeight:
                    900,

                  lineHeight:
                    1.3,

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",
                }}
                title={
                  churchName
                }
              >
                {churchName}
              </div>

              {churchLocation && (
                <div
                  style={{
                    marginTop:
                      "3px",

                    color:
                      "#9ca8c2",

                    fontSize:
                      "9px",

                    fontWeight:
                      600,
                  }}
                >
                  {
                    churchLocation
                  }
                </div>
              )}
            </div>
          </div>

          {/* FOOTER CARTE */}

          <div
            style={{
              marginTop:
                "12px",

              paddingTop:
                "11px",

              borderTop:
                "1px solid rgba(255,255,255,0.08)",

              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                "8px",
            }}
          >
            <span
              style={{
                fontSize:
                  "9px",

                color:
                  "#8993aa",

                fontWeight:
                  700,
              }}
            >
              Abonnement
            </span>

            <span
              style={{
                ...getPlanStyle(),

                padding:
                  "4px 8px",

                borderRadius:
                  "999px",

                fontSize:
                  "8px",

                fontWeight:
                  900,

                letterSpacing:
                  "0.5px",
              }}
            >
              {churchPlan}
            </span>
          </div>
        </div>
      );
    };

  // ======================================================
  // CONTENU SIDEBAR
  // ======================================================

  const renderSidebarContent = (
    mobile = false
  ) => (
    <>
      {/* ==================================================
          MARQUE ELDIOR
      ================================================== */}

      <div className="sidebar-brand">
        <div className="sidebar-logo">
          E
        </div>

        <div>
          <div className="sidebar-title">
            ElDior
          </div>

          <div className="sidebar-subtitle">
            Management Church
          </div>
        </div>
      </div>

      {/* ==================================================
          ÉGLISE
      ================================================== */}

      {renderChurchCard()}

      {/* ==================================================
          UTILISATEUR
      ================================================== */}

      <div className="sidebar-user">
        <div className="sidebar-user-name">
          {admin?.name ||
            "Utilisateur"}
        </div>

        <div className="sidebar-user-role">
          {getRoleLabel()}
        </div>

        {isSuperAdmin && (
          <div
            style={{
              marginTop:
                "5px",

              color:
                "#8b7cff",

              fontSize:
                "9px",

              fontWeight:
                900,

              textTransform:
                "uppercase",

              letterSpacing:
                "0.8px",
            }}
          >
            Propriétaire ElDior
          </div>
        )}
      </div>

      {/* ==================================================
          NAVIGATION
      ================================================== */}

      <nav className="sidebar-nav">

        {/* PLATEFORME */}

        {isSuperAdmin && (
          <>
            <div className="sidebar-section-title">
              Plateforme ElDior
            </div>

            {platformLinks.map(
              (item) =>
                renderLink(
                  item,
                  mobile
                )
            )}

            <div className="sidebar-section-title">
              Gestion église
            </div>
          </>
        )}

        {/* ÉGLISE */}

        {!isSuperAdmin && (
          <div className="sidebar-section-title">
            Gestion de l'église
          </div>
        )}

        {mainLinks.map(
          (item) =>
            renderLink(
              item,
              mobile
            )
        )}

        {/* ADMINISTRATION */}

        {isAdmin() && (
          <>
            <div className="sidebar-section-title">
              Administration
            </div>

            {adminLinks.map(
              (item) =>
                renderLink(
                  item,
                  mobile
                )
            )}
          </>
        )}
      </nav>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <div className="sidebar-footer">
        <button
          type="button"
          className="logout-button"
          onClick={
            handleLogout
          }
        >
          🚪 Déconnexion
        </button>
      </div>
    </>
  );

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="app-layout">

      {/* DESKTOP */}

      <aside className="sidebar desktop-sidebar">
        {renderSidebarContent(
          false
        )}
      </aside>

      {/* CONTENT */}

      <div className="main-wrapper">

        {/* MOBILE HEADER */}

        <header className="mobile-header">

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen(
                true
              )
            }
          >
            ☰
          </button>

          <div>
            <div className="mobile-brand">
              {church?.name ||
                "ElDior Management Church"}
            </div>
          </div>

          <div className="mobile-user">
            {admin?.name ||
              ""}
          </div>

        </header>

        {/* PAGE */}

        <main className="main-content">
          {children ||
            <Outlet />}
        </main>

      </div>

      {/* OVERLAY */}

      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
        />
      )}

      {/* MOBILE SIDEBAR */}

      <aside
        className={`mobile-sidebar ${
          mobileOpen
            ? "open"
            : ""
        }`}
      >
        <div className="mobile-sidebar-header">

          <strong>
            Menu
          </strong>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
          >
            ✕
          </button>

        </div>

        {renderSidebarContent(
          true
        )}
      </aside>

    </div>
  );
}