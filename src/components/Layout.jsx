import { useState } from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentAdmin,
  isAdmin,
} from "../utils/auth";

import {
  hasFeature,
  normalizePlan,
} from "../utils/subscription";

import {
  useSubscription,
} from "../context/SubscriptionContext";

import "./Layout.css";

export default function Layout({ children }) {
  const navigate = useNavigate();

  const admin = getCurrentAdmin();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  // ======================================================
  // ABONNEMENT
  // ======================================================

  const {
    plan,
    initialized,
  } = useSubscription();

  const isSuperAdmin =
    admin?.platformRole === "superadmin";

  // ======================================================
  // ÉGLISE
  // ======================================================

  const church =
    admin?.church || null;

  const churchName =
    church?.name || "Mon église";

  const churchCity =
    church?.city || "";

  const churchCountry =
    church?.country || "";

  const currentPlan = normalizePlan(
    initialized
      ? plan
      : church?.plan || "free"
  );

  const churchPlan =
    currentPlan.toUpperCase();

  // ======================================================
  // FEATURES
  // ======================================================

  const canUseAssignments =
    isSuperAdmin ||
    hasFeature(
      currentPlan,
      "assignments"
    );

  const canUseReports =
    isSuperAdmin ||
    hasFeature(
      currentPlan,
      "reports"
    );

  const canUseActivityLogs =
    isSuperAdmin ||
    hasFeature(
      currentPlan,
      "activityLogs"
    );

  // ======================================================
  // HELPERS
  // ======================================================

  const getChurchInitial = () => {
    return (
      churchName
        ?.trim()
        ?.charAt(0)
        ?.toUpperCase() || "E"
    );
  };

  const churchLocation = [
    churchCity,
    churchCountry,
  ]
    .filter(Boolean)
    .join(" • ");

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "admin"
    );

    sessionStorage.removeItem(
      "subscriptionBlockedFeature"
    );

    sessionStorage.removeItem(
      "subscriptionRequiredPlan"
    );

    navigate("/login", {
      replace: true,
    });
  };

  // ======================================================
  // PLATEFORME
  // ======================================================

  const platformLinks = [
    {
      to: "/platform",
      label: "Vue plateforme",
      icon: "🛡️",
    },

    {
      to: "/platform/churches",
      label: "Églises clientes",
      icon: "⛪",
    },
  ];

  // ======================================================
  // GESTION ÉGLISE
  // ======================================================

  const mainLinks = [
    {
      to: "/dashboard",
      label: "Tableau de bord",
      icon: "🏠",
      visible: true,
    },

    {
      to: "/members",
      label: "Membres",
      icon: "👥",
      visible: true,
    },

    {
      to: "/families",
      label: "Familles",
      icon: "👨‍👩‍👧",
      visible: true,
    },

    {
      to: "/groups",
      label: "Groupes / Cellules",
      icon: "🏘️",
      visible: true,
    },

    {
      to: "/departments",
      label: "Départements",
      icon: "🏢",
      visible: true,
    },

    {
      to: "/events",
      label: "Événements",
      icon: "🗓️",
      visible: true,
    },

    {
      to: "/attendance",
      label: "Présences",
      icon: "✅",
      visible: true,
    },

    {
      to: "/attendance-stats",
      label:
        "Statistiques de présence",
      icon: "📊",
      visible: true,
    },

    {
      to: "/pastoral-statistics",
      label:
        "Statistiques pastorales",
      icon: "📈",
      visible: true,
    },

    {
      to: "/visitor-follow-up",
      label:
        "Suivi des visiteurs",
      icon: "🤝",
      visible: true,
    },

    {
      to: "/pastoral-alerts",
      label:
        "Alertes pastorales",
      icon: "🛟",
      visible: true,
    },

    {
      to: "/assignments",
      label: "Programmations",
      icon: "📋",
      visible:
        canUseAssignments,
    },

    {
      to: "/reports",
      label: "Rapports",
      icon: "📊",
      visible:
        canUseReports,
    },

    // ==================================================
    // FINANCES
    // ==================================================

    {
      to: "/finance",
      label: "Tableau de bord financier",
      icon: "📈",
      visible: true,
    },

    {
      to: "/finance/accounts",
      label: "Comptes financiers",
      icon: "💰",
      visible: true,
    },

    {
      to: "/finance/categories",
      label: "Catégories financières",
      icon: "🗂️",
      visible: true,
    },

    {
      to: "/finance/transactions",
      label: "Transactions financières",
      icon: "💳",
      visible: true,
    },

    {
      to: "/finance/budgets",
      label: "Budgets financiers",
      icon: "📊",
      visible: true,
    },

    {
      to: "/finance/reconciliation",
      label: "Rapprochement financier",
      icon: "⚖️",
      visible: isAdmin(),
    },

    // ==================================================
    // PARAMÈTRES / ABONNEMENT
    // ==================================================

    {
      to: "/settings",
      label: "Paramètres",
      icon: "⚙️",
      visible: true,
    },

    {
      to: "/subscription",
      label: "Mon abonnement",
      icon: "💳",
      visible: true,
    },
  ].filter(
    (item) => item.visible
  );

  // ======================================================
  // ADMIN
  // ======================================================

  const adminLinks = [
    {
      to: "/users",
      label: "Utilisateurs",
      icon: "👤",
      visible: true,
    },

    {
      to: "/activity-logs",
      label:
        "Journal activité",
      icon: "📌",
      visible:
        canUseActivityLogs,
    },
  ].filter(
    (item) => item.visible
  );

  // ======================================================
  // RÔLE
  // ======================================================

  const getRoleLabel = () => {
    if (isSuperAdmin) {
      return "Super Administrateur";
    }

    if (
      admin?.role === "admin"
    ) {
      return "Administrateur";
    }

    if (
      admin?.role === "manager"
    ) {
      return "Manager";
    }

    if (
      admin?.role === "member"
    ) {
      return "Membre";
    }

    return "Utilisateur";
  };

  // ======================================================
  // STYLE PLAN
  // ======================================================

  const getPlanStyle = () => {
    switch (currentPlan) {
      case "premium":
        return {
          background:
            "rgba(168, 85, 247, 0.16)",

          color: "#c4b5fd",

          border:
            "1px solid rgba(196, 181, 253, 0.18)",
        };

      case "standard":
        return {
          background:
            "rgba(59, 130, 246, 0.16)",

          color: "#93c5fd",

          border:
            "1px solid rgba(147, 197, 253, 0.18)",
        };

      default:
        return {
          background:
            "rgba(34, 197, 94, 0.15)",

          color: "#86efac",

          border:
            "1px solid rgba(134, 239, 172, 0.16)",
        };
    }
  };

  // ======================================================
  // RENDER LINK
  // ======================================================

  const renderLink = (
    item,
    closeMobile = false
  ) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={
        item.to === "/platform" ||
        item.to === "/finance"
      }
      onClick={() => {
        if (closeMobile) {
          setMobileOpen(false);
        }
      }}
      className={({
        isActive,
      }) =>
        `sidebar-link ${
          isActive ? "active" : ""
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

  const renderChurchCard = () => {
    if (!church) {
      return null;
    }

    return (
      <div
        style={{
          margin: "18px 0 16px",
          padding: "16px",
          borderRadius: "16px",

          background:
            "linear-gradient(135deg, rgba(91, 72, 238, 0.20), rgba(37, 99, 235, 0.08))",

          border:
            "1px solid rgba(139, 126, 255, 0.20)",

          boxShadow:
            "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            marginBottom: "11px",
            color: "#8b93a7",
            fontSize: "9px",
            fontWeight: 900,
            textTransform:
              "uppercase",
            letterSpacing: "1px",
          }}
        >
          {isSuperAdmin
            ? "Église active"
            : "Votre église"}
        </div>

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "11px",
          }}
        >
          <div
            style={{
              width: "42px",
              minWidth: "42px",
              height: "42px",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              borderRadius:
                "12px",

              background:
                "linear-gradient(135deg, #6d4aff, #4938d7)",

              color: "#ffffff",

              fontSize: "17px",
              fontWeight: 900,

              boxShadow:
                "0 7px 17px rgba(92, 70, 235, 0.30)",
            }}
          >
            {getChurchInitial()}
          </div>

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

        <div
          style={{
            marginTop: "12px",

            paddingTop: "11px",

            borderTop:
              "1px solid rgba(255,255,255,0.08)",

            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "9px",
              color: "#8993aa",
              fontWeight: 700,
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

              fontSize: "8px",

              fontWeight: 900,

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
  // SIDEBAR
  // ======================================================

  const renderSidebarContent = (
    mobile = false
  ) => (
    <>
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

      {renderChurchCard()}

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
              marginTop: "5px",

              color: "#8b7cff",

              fontSize: "9px",

              fontWeight: 900,

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

      <nav className="sidebar-nav">
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

        {isAdmin() &&
          adminLinks.length >
            0 && (
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
      <aside className="sidebar desktop-sidebar">
        {renderSidebarContent(
          false
        )}
      </aside>

      <div className="main-wrapper">
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
            {admin?.name || ""}
          </div>
        </header>

        <main className="main-content">
          {children || (
            <Outlet />
          )}
        </main>
      </div>

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