import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import Layout from "../components/Layout";
  
  import API from "../api/axios";
  
  import "../styles/ManagementPages.css";
  import "./PlatformChurches.css";
  
  export default function PlatformChurches() {
    const navigate =
      useNavigate();
  
    const [
      churches,
      setChurches,
    ] = useState([]);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      error,
      setError,
    ] = useState("");
  
    const [
      search,
      setSearch,
    ] = useState("");
  
    const [
      plan,
      setPlan,
    ] = useState("");
  
    const [
      status,
      setStatus,
    ] = useState("");
  
    const [
      page,
      setPage,
    ] = useState(1);
  
    const [
      pagination,
      setPagination,
    ] = useState({
      page: 1,
      total: 0,
      totalPages: 1,
      limit: 20,
    });
  
    const [
      actionLoading,
      setActionLoading,
    ] = useState(null);
  
    // ======================================================
    // CHARGEMENT DES ÉGLISES
    // ======================================================
  
    const loadChurches =
      async () => {
        try {
          setLoading(true);
  
          setError("");
  
          const response =
            await API.get(
              "/platform/churches",
              {
                params: {
                  search,
                  plan,
                  status,
                  page,
                  limit: 20,
                },
              }
            );
  
          setChurches(
            response.data?.data ||
              []
          );
  
          setPagination(
            response.data
              ?.pagination || {
              page: 1,
              total: 0,
              totalPages: 1,
              limit: 20,
            }
          );
        } catch (err) {
          console.error(
            "Erreur chargement églises :",
            err
          );
  
          setError(
            err.response?.data
              ?.message ||
              "Impossible de charger les églises clientes."
          );
        } finally {
          setLoading(false);
        }
      };
  
    // ======================================================
    // RECHARGEMENT
    // ======================================================
  
    useEffect(() => {
      const timer =
        setTimeout(() => {
          loadChurches();
        }, 250);
  
      return () =>
        clearTimeout(timer);
    }, [
      search,
      plan,
      status,
      page,
    ]);
  
    // ======================================================
    // REVENIR PAGE 1 SI FILTRE CHANGE
    // ======================================================
  
    useEffect(() => {
      setPage(1);
    }, [
      search,
      plan,
      status,
    ]);
  
    // ======================================================
    // STATS LOCALES
    // ======================================================
  
    const stats =
      useMemo(() => {
        const total =
          pagination.total || 0;
  
        const active =
          churches.filter(
            (church) =>
              church.isActive &&
              church.status ===
                "active"
          ).length;
  
        const suspended =
          churches.filter(
            (church) =>
              !church.isActive ||
              church.status ===
                "suspended"
          ).length;
  
        const premium =
          churches.filter(
            (church) =>
              church.plan ===
              "premium"
          ).length;
  
        return {
          total,
          active,
          suspended,
          premium,
        };
      }, [
        churches,
        pagination,
      ]);
  
    // ======================================================
    // MODIFIER PLAN
    // ======================================================
  
    const handlePlanChange =
      async (
        churchId,
        newPlan
      ) => {
        try {
          setActionLoading(
            churchId
          );
  
          await API.put(
            `/platform/churches/${churchId}`,
            {
              plan:
                newPlan,
            }
          );
  
          await loadChurches();
        } catch (err) {
          console.error(
            "Erreur changement plan :",
            err
          );
  
          alert(
            err.response?.data
              ?.message ||
              "Impossible de modifier le plan."
          );
        } finally {
          setActionLoading(
            null
          );
        }
      };
  
    // ======================================================
    // ACTIVER / SUSPENDRE
    // ======================================================
  
    const handleToggleStatus =
      async (
        church
      ) => {
        const isCurrentlyActive =
          church.isActive &&
          church.status ===
            "active";
  
        const confirmation =
          window.confirm(
            isCurrentlyActive
              ? `Suspendre l'église "${church.name}" ?`
              : `Réactiver l'église "${church.name}" ?`
          );
  
        if (!confirmation) {
          return;
        }
  
        try {
          setActionLoading(
            church._id
          );
  
          await API.put(
            `/platform/churches/${church._id}`,
            {
              isActive:
                !isCurrentlyActive,
  
              status:
                isCurrentlyActive
                  ? "suspended"
                  : "active",
            }
          );
  
          await loadChurches();
        } catch (err) {
          console.error(
            "Erreur statut église :",
            err
          );
  
          alert(
            err.response?.data
              ?.message ||
              "Impossible de modifier le statut."
          );
        } finally {
          setActionLoading(
            null
          );
        }
      };
  
    // ======================================================
    // FORMAT DATE
    // ======================================================
  
    const formatDate =
      (date) => {
        if (!date) {
          return "—";
        }
  
        return new Date(
          date
        ).toLocaleDateString(
          "fr-FR"
        );
      };
  
    // ======================================================
    // LOADING INITIAL
    // ======================================================
  
    if (
      loading &&
      churches.length === 0
    ) {
      return (
        <Layout>
          <div className="management-page">
            <div className="management-loading">
              <div className="management-spinner" />
  
              <span>
                Chargement des églises clientes...
              </span>
            </div>
          </div>
        </Layout>
      );
    }
  
    // ======================================================
    // PAGE
    // ======================================================
  
    return (
      <Layout>
        <div className="management-page">
  
          {/* ==================================================
              HEADER
          ================================================== */}
  
          <div className="page-header">
            <div className="page-header-left">
              <div className="platform-eyebrow">
                PLATEFORME ELDIOR
              </div>
  
              <h1 className="page-title">
                Églises clientes
              </h1>
  
              <p className="page-subtitle">
                Gérez toutes les organisations inscrites sur ElDior Management Church.
              </p>
            </div>
  
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                navigate(
                  "/platform"
                )
              }
            >
              ← Vue plateforme
            </button>
          </div>
  
          {/* ==================================================
              STATS
          ================================================== */}
  
          <div className="management-stats-grid">
            <div className="management-stat-card">
              <div className="management-stat-label">
                Total
              </div>
  
              <div className="management-stat-value">
                {stats.total}
              </div>
  
              <div className="management-stat-description">
                Églises inscrites
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Actives
              </div>
  
              <div className="management-stat-value">
                {stats.active}
              </div>
  
              <div className="management-stat-description">
                Sur cette page
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Suspendues
              </div>
  
              <div className="management-stat-value">
                {stats.suspended}
              </div>
  
              <div className="management-stat-description">
                Sur cette page
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Premium
              </div>
  
              <div className="management-stat-value">
                {stats.premium}
              </div>
  
              <div className="management-stat-description">
                Sur cette page
              </div>
            </div>
          </div>
  
          {/* ==================================================
              FILTRES
          ================================================== */}
  
          <div className="management-card platform-filters-card">
            <div className="platform-filters-grid">
  
              <div className="form-group">
                <label>
                  Rechercher
                </label>
  
                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Nom, email, ville, pays..."
                />
              </div>
  
              <div className="form-group">
                <label>
                  Plan
                </label>
  
                <select
                  value={plan}
                  onChange={(e) =>
                    setPlan(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Tous les plans
                  </option>
  
                  <option value="free">
                    Free
                  </option>
  
                  <option value="standard">
                    Standard
                  </option>
  
                  <option value="premium">
                    Premium
                  </option>
                </select>
              </div>
  
              <div className="form-group">
                <label>
                  Statut
                </label>
  
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Tous les statuts
                  </option>
  
                  <option value="active">
                    Active
                  </option>
  
                  <option value="suspended">
                    Suspendue
                  </option>
  
                  <option value="cancelled">
                    Annulée
                  </option>
                </select>
              </div>
  
            </div>
          </div>
  
          {/* ==================================================
              ERREUR
          ================================================== */}
  
          {error && (
            <div className="management-alert management-alert-error">
              {error}
            </div>
          )}
  
          {/* ==================================================
              TABLE
          ================================================== */}
  
          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Liste des églises
                </h2>
  
                <p className="page-subtitle">
                  {pagination.total} résultat(s)
                </p>
              </div>
  
              {loading && (
                <span className="platform-table-loading">
                  Actualisation...
                </span>
              )}
            </div>
  
            {churches.length ===
            0 ? (
              <div className="management-empty">
                <h3>
                  Aucune église trouvée
                </h3>
  
                <p>
                  Modifie les filtres de recherche.
                </p>
              </div>
            ) : (
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
                        Utilisation
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
  
                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>
  
                  <tbody>
                    {churches.map(
                      (church) => {
                        const active =
                          church.isActive &&
                          church.status ===
                            "active";
  
                        return (
                          <tr
                            key={
                              church._id
                            }
                          >
                            <td>
                              <div className="platform-church-name">
                                {
                                  church.name
                                }
                              </div>
  
                              <div className="person-secondary">
                                {
                                  church.email ||
                                  "Aucun email"
                                }
                              </div>
  
                              {church.slug && (
                                <div className="platform-slug">
                                  /{
                                    church.slug
                                  }
                                </div>
                              )}
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
                              <div className="platform-usage">
                                <span>
                                  👥{" "}
                                  {church
                                    .usage
                                    ?.members ||
                                    0}
                                </span>
  
                                <span>
                                  👤{" "}
                                  {church
                                    .usage
                                    ?.users ||
                                    0}
                                </span>
  
                                <span>
                                  🗓️{" "}
                                  {church
                                    .usage
                                    ?.events ||
                                    0}
                                </span>
  
                                <span>
                                  🏢{" "}
                                  {church
                                    .usage
                                    ?.departments ||
                                    0}
                                </span>
                              </div>
                            </td>
  
                            <td>
                              <select
                                className="platform-plan-select"
                                value={
                                  church.plan ||
                                  "free"
                                }
                                disabled={
                                  actionLoading ===
                                  church._id
                                }
                                onChange={(e) =>
                                  handlePlanChange(
                                    church._id,
                                    e.target
                                      .value
                                  )
                                }
                              >
                                <option value="free">
                                  Free
                                </option>
  
                                <option value="standard">
                                  Standard
                                </option>
  
                                <option value="premium">
                                  Premium
                                </option>
                              </select>
                            </td>
  
                            <td>
                              <span
                                className={
                                  active
                                    ? "status-badge status-active"
                                    : "status-badge status-inactive"
                                }
                              >
                                {active
                                  ? "Active"
                                  : church.status ===
                                    "cancelled"
                                  ? "Annulée"
                                  : "Suspendue"}
                              </span>
                            </td>
  
                            <td>
                              {formatDate(
                                church.createdAt
                              )}
                            </td>
  
                            <td>
                              <button
                                type="button"
                                className={
                                  active
                                    ? "btn btn-danger btn-sm"
                                    : "btn btn-primary btn-sm"
                                }
                                disabled={
                                  actionLoading ===
                                  church._id
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    church
                                  )
                                }
                              >
                                {actionLoading ===
                                church._id
                                  ? "..."
                                  : active
                                  ? "Suspendre"
                                  : "Activer"}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
  
            {/* ==================================================
                PAGINATION
            ================================================== */}
  
            {pagination.totalPages >
              1 && (
              <div className="platform-pagination">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          current -
                            1,
                          1
                        )
                    )
                  }
                >
                  ← Précédent
                </button>
  
                <span>
                  Page{" "}
                  {
                    pagination.page
                  }{" "}
                  sur{" "}
                  {
                    pagination.totalPages
                  }
                </span>
  
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={
                    page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          current +
                            1,
                          pagination.totalPages
                        )
                    )
                  }
                >
                  Suivant →
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }