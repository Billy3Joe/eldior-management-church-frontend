import {
    useEffect,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import Layout from "../components/Layout";
  
  import API from "../api/axios";
  
  import "../styles/ManagementPages.css";
  import "./PlatformDashboard.css";
  
  export default function PlatformDashboard() {
    const navigate =
      useNavigate();
  
    const [
      data,
      setData,
    ] = useState(null);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      error,
      setError,
    ] = useState("");
  
    // ======================================================
    // CHARGEMENT
    // ======================================================
  
    useEffect(() => {
      const loadDashboard =
        async () => {
          try {
            setLoading(true);
  
            setError("");
  
            const response =
              await API.get(
                "/platform/dashboard"
              );
  
            setData(
              response.data?.data ||
                null
            );
          } catch (err) {
            console.error(
              "Erreur dashboard plateforme :",
              err
            );
  
            setError(
              err.response?.data
                ?.message ||
                "Impossible de charger le tableau de bord plateforme."
            );
          } finally {
            setLoading(false);
          }
        };
  
      loadDashboard();
    }, []);
  
    // ======================================================
    // LOADING
    // ======================================================
  
    if (loading) {
      return (
        <Layout>
          <div className="management-page">
            <div className="management-loading">
              <div className="management-spinner" />
  
              <span>
                Chargement de la plateforme...
              </span>
            </div>
          </div>
        </Layout>
      );
    }
  
    // ======================================================
    // ERREUR
    // ======================================================
  
    if (error) {
      return (
        <Layout>
          <div className="management-page">
            <div className="management-empty">
              <h3>
                Erreur
              </h3>
  
              <p>
                {error}
              </p>
  
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  window.location.reload()
                }
              >
                Réessayer
              </button>
            </div>
          </div>
        </Layout>
      );
    }
  
    const overview =
      data?.overview || {};
  
    const subscriptions =
      data?.subscriptions || {};
  
    const recentChurches =
      data?.recentChurches ||
      [];
  
    // ======================================================
    // PAGE
    // ======================================================
  
    return (
      <Layout>
        <div className="management-page platform-dashboard">
  
          {/* HEADER */}
  
          <div className="page-header">
            <div className="page-header-left">
              <div className="platform-eyebrow">
                ELDIOR MANAGEMENT CHURCH
              </div>
  
              <h1 className="page-title">
                Vue plateforme
              </h1>
  
              <p className="page-subtitle">
                Pilotez l'ensemble des églises utilisant votre plateforme.
              </p>
            </div>
  
            <div className="platform-owner-badge">
              🛡️ Super Admin
            </div>
          </div>
  
          {/* STATS */}
  
          <div className="management-stats-grid">
            <div className="management-stat-card">
              <div className="management-stat-label">
                Églises
              </div>
  
              <div className="management-stat-value">
                {overview.totalChurches ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Organisations inscrites
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Églises actives
              </div>
  
              <div className="management-stat-value">
                {overview.activeChurches ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Comptes opérationnels
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Membres
              </div>
  
              <div className="management-stat-value">
                {overview.totalMembers ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Membres sur toute la plateforme
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Utilisateurs
              </div>
  
              <div className="management-stat-value">
                {overview.totalUsers ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Comptes clients
              </div>
            </div>
          </div>
  
          {/* PLANS */}
  
          <section className="platform-section">
            <div className="platform-section-header">
              <div>
                <h2>
                  Abonnements
                </h2>
  
                <p>
                  Répartition des églises par formule.
                </p>
              </div>
            </div>
  
            <div className="platform-plan-grid">
              <div className="platform-plan-card">
                <span className="platform-plan-label">
                  FREE
                </span>
  
                <strong>
                  {subscriptions.free ||
                    0}
                </strong>
  
                <small>
                  Églises
                </small>
              </div>
  
              <div className="platform-plan-card">
                <span className="platform-plan-label">
                  STANDARD
                </span>
  
                <strong>
                  {subscriptions.standard ||
                    0}
                </strong>
  
                <small>
                  Églises
                </small>
              </div>
  
              <div className="platform-plan-card premium">
                <span className="platform-plan-label">
                  PREMIUM
                </span>
  
                <strong>
                  {subscriptions.premium ||
                    0}
                </strong>
  
                <small>
                  Églises
                </small>
              </div>
            </div>
          </section>
  
          {/* AUTRES STATS */}
  
          <section className="platform-section">
            <div className="platform-mini-grid">
              <div className="management-card platform-mini-card">
                <span>
                  Événements
                </span>
  
                <strong>
                  {overview.totalEvents ||
                    0}
                </strong>
              </div>
  
              <div className="management-card platform-mini-card">
                <span>
                  Départements
                </span>
  
                <strong>
                  {overview.totalDepartments ||
                    0}
                </strong>
              </div>
  
              <div className="management-card platform-mini-card">
                <span>
                  Églises suspendues
                </span>
  
                <strong>
                  {overview.suspendedChurches ||
                    0}
                </strong>
              </div>
            </div>
          </section>
  
          {/* DERNIÈRES ÉGLISES */}
  
          <section className="platform-section">
            <div className="management-card">
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Dernières églises inscrites
                  </h2>
  
                  <p className="page-subtitle">
                    Les organisations récemment créées sur ElDior.
                  </p>
                </div>
  
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(
                      "/platform/churches"
                    )
                  }
                >
                  Voir toutes les églises
                </button>
              </div>
  
              {recentChurches.length >
              0 ? (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>
                          Église
                        </th>
  
                        <th>
                          Localisation
                        </th>
  
                        <th>
                          Plan
                        </th>
  
                        <th>
                          Statut
                        </th>
  
                        <th>
                          Inscription
                        </th>
                      </tr>
                    </thead>
  
                    <tbody>
                      {recentChurches.map(
                        (church) => (
                          <tr
                            key={
                              church._id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  church.name
                                }
                              </strong>
  
                              <div className="person-secondary">
                                {
                                  church.email
                                }
                              </div>
                            </td>
  
                            <td>
                              {[
                                church.city,
                                church.country,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  ", "
                                ) ||
                                "—"}
                            </td>
  
                            <td>
                              <span className="status-badge status-planned">
                                {String(
                                  church.plan ||
                                    "free"
                                ).toUpperCase()}
                              </span>
                            </td>
  
                            <td>
                              <span
                                className={
                                  church.isActive &&
                                  church.status ===
                                    "active"
                                    ? "status-badge status-active"
                                    : "status-badge status-inactive"
                                }
                              >
                                {church.isActive &&
                                church.status ===
                                  "active"
                                  ? "Active"
                                  : "Suspendue"}
                              </span>
                            </td>
  
                            <td>
                              {church.createdAt
                                ? new Date(
                                    church.createdAt
                                  ).toLocaleDateString(
                                    "fr-FR"
                                  )
                                : "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="management-empty">
                  <h3>
                    Aucune église
                  </h3>
  
                  <p>
                    Les nouvelles inscriptions apparaîtront ici.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </Layout>
    );
  }