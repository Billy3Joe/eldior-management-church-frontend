import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import Layout from "../components/Layout";

import API from "../api/axios";

import "../styles/ManagementPages.css";

export default function ActivityLogs() {
  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [filters, setFilters] =
    useState({
      search: "",
      entity: "",
      action: "",
      page: 1,
      limit: 20,
    });

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // ======================================================
  // CHARGEMENT DES LOGS
  // ======================================================

  const fetchLogs = async (
    customFilters = filters
  ) => {
    try {
      setLoading(true);

      const query =
        new URLSearchParams();

      if (
        customFilters.search
      ) {
        query.append(
          "search",
          customFilters.search
        );
      }

      if (
        customFilters.entity
      ) {
        query.append(
          "entity",
          customFilters.entity
        );
      }

      if (
        customFilters.action
      ) {
        query.append(
          "action",
          customFilters.action
        );
      }

      query.append(
        "page",
        customFilters.page
      );

      query.append(
        "limit",
        customFilters.limit
      );

      const res =
        await API.get(
          `/activity-logs?${query.toString()}`
        );

      setLogs(
        res.data?.data || []
      );

      setPagination({
        page:
          res.data?.page || 1,
        totalPages:
          res.data
            ?.totalPages || 1,
        total:
          res.data?.total || 0,
      });
    } catch (error) {
      console.error(
        "Erreur chargement Activity Logs :",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Erreur lors du chargement du journal d’activité"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CHARGEMENT INITIAL
  // ======================================================

  useEffect(() => {
    fetchLogs();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======================================================
  // PAGINATION / LIMIT
  // ======================================================

  useEffect(() => {
    fetchLogs(filters);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.limit,
  ]);

  // ======================================================
  // FILTRES
  // ======================================================

  const handleFilterChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const applyFilters = (
    e
  ) => {
    e.preventDefault();

    fetchLogs(filters);
  };

  const resetFilters = () => {
    const newFilters = {
      search: "",
      entity: "",
      action: "",
      page: 1,
      limit: 20,
    };

    setFilters(
      newFilters
    );

    fetchLogs(
      newFilters
    );
  };

  // ======================================================
  // PAGINATION
  // ======================================================

  const goToPage = (
    page
  ) => {
    if (page < 1) {
      return;
    }

    if (
      page >
      pagination.totalPages
    ) {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // TRADUCTION ACTION
  // ======================================================

  const getActionLabel = (
    action
  ) => {
    switch (action) {
      case "CREATE":
        return "Création";

      case "UPDATE":
        return "Modification";

      case "DELETE":
        return "Suppression";

      case "LOGIN":
        return "Connexion";

      default:
        return action || "-";
    }
  };

  // ======================================================
  // TRADUCTION ENTITÉ
  // ======================================================

  const getEntityLabel = (
    entity
  ) => {
    switch (entity) {
      case "Member":
        return "Membre";

      case "Department":
        return "Département";

      case "Event":
        return "Événement";

      case "Assignment":
        return "Programmation";

      case "Attendance":
        return "Présence";

      case "User":
        return "Administrateur";

      default:
        return entity || "-";
    }
  };

  // ======================================================
  // BADGE ACTION
  // ======================================================

  const getActionClass = (
    action
  ) => {
    switch (action) {
      case "CREATE":
        return "status-badge status-active";

      case "UPDATE":
        return "status-badge status-planned";

      case "DELETE":
        return "status-badge status-inactive";

      case "LOGIN":
        return "status-badge status-pending";

      default:
        return "status-badge status-pending";
    }
  };

  // ======================================================
  // INITIALS
  // ======================================================

  const getInitials = (
    name
  ) => {
    if (!name) {
      return "S";
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0] || ""
      )
      .join("")
      .toUpperCase();
  };

  // ======================================================
  // STATISTIQUES DE LA PAGE CHARGÉE
  // ======================================================

  const stats = useMemo(() => {
    const create =
      logs.filter(
        (log) =>
          log.action ===
          "CREATE"
      ).length;

    const update =
      logs.filter(
        (log) =>
          log.action ===
          "UPDATE"
      ).length;

    const deleteCount =
      logs.filter(
        (log) =>
          log.action ===
          "DELETE"
      ).length;

    const login =
      logs.filter(
        (log) =>
          log.action ===
          "LOGIN"
      ).length;

    return {
      create,
      update,
      deleteCount,
      login,
    };
  }, [logs]);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <Layout>
      <div className="management-page">
        {/* ================================================
            HEADER
        ================================================ */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Journal d’activité
            </h1>

            <p className="page-subtitle">
              Consultez les actions
              effectuées dans la
              plateforme et gardez une
              trace des principales
              opérations administratives.
            </p>
          </div>
        </div>

        {/* ================================================
            STATISTIQUES
        ================================================ */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total activités
            </div>

            <div className="management-stat-value">
              {pagination.total}
            </div>

            <div className="management-stat-description">
              Actions enregistrées
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Créations
            </div>

            <div className="management-stat-value">
              {stats.create}
            </div>

            <div className="management-stat-description">
              Sur cette page
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Modifications
            </div>

            <div className="management-stat-value">
              {stats.update}
            </div>

            <div className="management-stat-description">
              Sur cette page
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Connexions
            </div>

            <div className="management-stat-value">
              {stats.login}
            </div>

            <div className="management-stat-description">
              {stats.deleteCount} suppression
              {stats.deleteCount > 1
                ? "s"
                : ""}
            </div>
          </div>
        </div>

        {/* ================================================
            FILTRES
        ================================================ */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Rechercher une activité
              </h2>

              <p className="page-subtitle">
                Filtrez le journal par
                utilisateur, type
                d’entité ou action.
              </p>
            </div>
          </div>

          <form
            className="management-toolbar"
            onSubmit={applyFilters}
          >
            <div className="management-search">
              <span className="management-search-icon">
                ⌕
              </span>

              <input
                type="text"
                name="search"
                placeholder="Rechercher une activité..."
                value={
                  filters.search
                }
                onChange={
                  handleFilterChange
                }
              />
            </div>

            <div className="management-filters">
              <select
                name="entity"
                className="management-select"
                value={
                  filters.entity
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  Toutes les entités
                </option>

                <option value="Member">
                  Membres
                </option>

                <option value="Department">
                  Départements
                </option>

                <option value="Event">
                  Événements
                </option>

                <option value="Assignment">
                  Programmations
                </option>

                <option value="Attendance">
                  Présences
                </option>

                <option value="User">
                  Administrateurs
                </option>
              </select>

              <select
                name="action"
                className="management-select"
                value={
                  filters.action
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  Toutes les actions
                </option>

                <option value="CREATE">
                  Création
                </option>

                <option value="UPDATE">
                  Modification
                </option>

                <option value="DELETE">
                  Suppression
                </option>

                <option value="LOGIN">
                  Connexion
                </option>
              </select>

              <select
                name="limit"
                className="management-select"
                value={
                  filters.limit
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="10">
                  10 / page
                </option>

                <option value="20">
                  20 / page
                </option>

                <option value="50">
                  50 / page
                </option>

                <option value="100">
                  100 / page
                </option>
              </select>

              <button
                type="submit"
                className="btn btn-primary btn-small"
              >
                Appliquer
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={
                  resetFilters
                }
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        {/* ================================================
            TABLEAU
        ================================================ */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Historique des activités
              </h2>

              <p className="page-subtitle">
                {pagination.total} action
                {pagination.total > 1
                  ? "s"
                  : ""}{" "}
                enregistrée
                {pagination.total > 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <span className="status-badge status-planned">
              Page {pagination.page}
            </span>
          </div>

          {loading ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <span>
                Chargement du journal...
              </span>
            </div>
          ) : logs.length > 0 ? (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Date
                    </th>

                    <th>
                      Utilisateur
                    </th>

                    <th>
                      Action
                    </th>

                    <th>
                      Entité
                    </th>

                    <th>
                      Description
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map(
                    (log) => {
                      const userName =
                        log.userName ||
                        log.userId
                          ?.name ||
                        "Système";

                      return (
                        <tr
                          key={
                            log._id
                          }
                        >
                          <td>
                            <div
                              style={{
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {formatDate(
                                log.createdAt
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="person-cell">
                              <div className="person-avatar">
                                {getInitials(
                                  userName
                                )}
                              </div>

                              <div>
                                <div className="person-name">
                                  {userName}
                                </div>

                                <div className="person-secondary">
                                  {userName ===
                                  "Système"
                                    ? "Action automatique"
                                    : "Utilisateur"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={getActionClass(
                                log.action
                              )}
                            >
                              {getActionLabel(
                                log.action
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="status-badge status-pending">
                              {getEntityLabel(
                                log.entity
                              )}
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                maxWidth:
                                  420,
                                lineHeight:
                                  1.55,
                                color:
                                  "#475569",
                              }}
                            >
                              {log.description ||
                                "-"}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="management-empty">
              <div className="management-empty-icon">
                📋
              </div>

              <h3>
                Aucune activité
              </h3>

              <p>
                Aucun élément ne
                correspond aux filtres
                sélectionnés.
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  resetFilters
                }
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* ================================================
              PAGINATION
          ================================================ */}

          {pagination.totalPages >
            1 && (
            <div className="management-pagination">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() =>
                  goToPage(
                    pagination.page -
                      1
                  )
                }
                disabled={
                  pagination.page <=
                  1
                }
              >
                ← Précédent
              </button>

              <div className="management-pagination-info">
                Page{" "}
                <strong>
                  {pagination.page}
                </strong>{" "}
                sur{" "}
                <strong>
                  {
                    pagination.totalPages
                  }
                </strong>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() =>
                  goToPage(
                    pagination.page +
                      1
                  )
                }
                disabled={
                  pagination.page >=
                  pagination.totalPages
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