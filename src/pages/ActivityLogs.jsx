import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { toast } from "react-toastify";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    entity: "",
    action: "",
    page: 1,
    limit: 20,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // =========================
  // CHARGEMENT DES LOGS
  // =========================

  const fetchLogs = async (customFilters = filters) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (customFilters.search) {
        query.append("search", customFilters.search);
      }

      if (customFilters.entity) {
        query.append("entity", customFilters.entity);
      }

      if (customFilters.action) {
        query.append("action", customFilters.action);
      }

      query.append("page", customFilters.page);
      query.append("limit", customFilters.limit);

      const res = await API.get(
        `/activity-logs?${query.toString()}`
      );

      setLogs(res.data.data || []);

      setPagination({
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0,
      });
    } catch (error) {
      console.error(
        "Erreur chargement Activity Logs :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement du journal d’activité"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CHARGEMENT INITIAL
  // =========================

  useEffect(() => {
    fetchLogs();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // PAGINATION / LIMIT
  // =========================

  useEffect(() => {
    fetchLogs(filters);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit]);

  // =========================
  // FILTRES
  // =========================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const applyFilters = (e) => {
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

    setFilters(newFilters);
    fetchLogs(newFilters);
  };

  // =========================
  // PAGINATION
  // =========================

  const goToPage = (page) => {
    if (page < 1) return;
    if (page > pagination.totalPages) return;

    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================
  // TRADUCTION ACTION
  // =========================

  const getActionLabel = (action) => {
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

  // =========================
  // TRADUCTION ENTITÉ
  // =========================

  const getEntityLabel = (entity) => {
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

  // =========================
  // RENDER
  // =========================

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Journal d’activité</h2>

          <p
            style={{
              color: "#6b7280",
              marginTop: 6,
            }}
          >
            Suivi des actions effectuées dans la plateforme
          </p>
        </div>
      </div>

      {/* =========================
          FILTRES
      ========================= */}

      <div className="card">
        <form
          className="filters-panel"
          onSubmit={applyFilters}
        >
          <input
            type="text"
            name="search"
            placeholder="Rechercher une activité..."
            value={filters.search}
            onChange={handleFilterChange}
          />

          {/* ENTITÉ */}

          <select
            name="entity"
            value={filters.entity}
            onChange={handleFilterChange}
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

          {/* ACTION */}

          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
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

          {/* NOMBRE PAR PAGE */}

          <select
            name="limit"
            value={filters.limit}
            onChange={handleFilterChange}
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

          <div className="filter-actions">
            <button type="submit">
              Appliquer
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* =========================
          TABLEAU
      ========================= */}

      <div className="card section-gap">
        <div className="section-header">
          <div>
            <h2>Activités</h2>

            <span className="results-count">
              {pagination.total} action(s) enregistrée(s)
            </span>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
            }}
          >
            Chargement du journal...
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>Description</th>
                </tr>
              </thead>

              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id}>
                      {/* DATE */}

                      <td>
                        {formatDate(log.createdAt)}
                      </td>

                      {/* UTILISATEUR */}

                      <td>
                        {log.userName ||
                          log.userId?.name ||
                          "Système"}
                      </td>

                      {/* ACTION */}

                      <td>
                        <span
                          className={`activity-badge activity-${(
                            log.action || ""
                          ).toLowerCase()}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </td>

                      {/* ENTITÉ */}

                      <td>
                        {getEntityLabel(log.entity)}
                      </td>

                      {/* DESCRIPTION */}

                      <td>
                        {log.description || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                      }}
                    >
                      Aucune activité trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================
            PAGINATION
        ========================= */}

        {pagination.totalPages > 1 && (
          <div className="pagination-bar">
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                goToPage(pagination.page - 1)
              }
              disabled={pagination.page <= 1}
            >
              Précédent
            </button>

            <span>
              Page {pagination.page} /{" "}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                goToPage(pagination.page + 1)
              }
              disabled={
                pagination.page >=
                pagination.totalPages
              }
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}