import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import API from "../api/axios";

import Layout from "../components/Layout";

import "../styles/ManagementPages.css";

export default function EventDetails() {
  const { id } =
    useParams();

  const [
    event,
    setEvent,
  ] = useState(null);

  const [
    summary,
    setSummary,
  ] = useState(null);

  const [
    membersAttendance,
    setMembersAttendance,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ======================================================
  // CHARGER LES DÉTAILS
  // ======================================================

  const fetchEventDetails =
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          eventRes,
          summaryRes,
          membersRes,
        ] =
          await Promise.all([
            API.get(
              `/events/${id}`
            ),

            API.get(
              `/attendances/event/${id}/summary`
            ),

            API.get(
              `/attendances/event/${id}/members`
            ),
          ]);

        setEvent(
          eventRes.data?.data ||
            null
        );

        setSummary(
          summaryRes.data?.data ||
            null
        );

        setMembersAttendance(
          membersRes.data?.data ||
            []
        );
      } catch (err) {
        console.error(
          "Erreur fetch event details :",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Impossible de charger les détails de l'événement"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

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
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // STATUT PRÉSENCE
  // ======================================================

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "Présent":
        return "status-badge status-active";

      case "Absent":
        return "status-badge status-inactive";

      case "Excusé":
        return "status-badge status-warning";

      case "En retard":
        return "status-badge status-planned";

      default:
        return "status-badge status-pending";
    }
  };

  // ======================================================
  // STATUT ÉVÉNEMENT
  // ======================================================

  const getEventStatusClass = (
    status
  ) => {
    switch (status) {
      case "completed":
        return "status-badge status-completed";

      case "cancelled":
        return "status-badge status-cancelled";

      case "ongoing":
        return "status-badge status-active";

      case "planned":
      default:
        return "status-badge status-planned";
    }
  };

  const getEventStatusLabel = (
    status
  ) => {
    switch (status) {
      case "planned":
        return "Planifié";

      case "ongoing":
        return "En cours";

      case "completed":
        return "Terminé";

      case "cancelled":
        return "Annulé";

      default:
        return status || "-";
    }
  };

  // ======================================================
  // INITIALS MEMBRE
  // ======================================================

  const getInitials = (
    member
  ) => {
    const first =
      member?.firstName?.[0] ||
      "";

    const last =
      member?.lastName?.[0] ||
      "";

    return `${first}${last}`.toUpperCase();
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-loading">
              <div className="management-spinner" />

              <span>
                Chargement des détails de
                l'événement...
              </span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // ERREUR
  // ======================================================

  if (
    error ||
    !event
  ) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-empty">
              <div className="management-empty-icon">
                ⚠️
              </div>

              <h3>
                Événement introuvable
              </h3>

              <p>
                {error ||
                  "Impossible de trouver cet événement."}
              </p>

              <Link
                to="/events"
                className="btn btn-secondary"
              >
                ← Retour aux événements
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 12,
                flexWrap:
                  "wrap",
              }}
            >
              <h1 className="page-title">
                {event.title}
              </h1>

              <span
                className={getEventStatusClass(
                  event.status
                )}
              >
                {getEventStatusLabel(
                  event.status
                )}
              </span>
            </div>

            <p className="page-subtitle">
              Consultez les informations,
              statistiques et présences
              liées à cet événement.
            </p>
          </div>

          <div className="page-header-actions">
            <Link
              to="/events"
              className="btn btn-secondary"
            >
              ← Retour
            </Link>

            <Link
              to={`/attendance?eventId=${event._id}`}
              className="btn btn-primary"
            >
              ✓ Ouvrir le pointage
            </Link>
          </div>
        </div>

        {/* ================================================
            INFORMATIONS ÉVÉNEMENT
        ================================================ */}

        <div className="management-card">
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Informations de
                l'événement
              </h2>

              <p className="page-subtitle">
                Informations générales
                et organisationnelles.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: 24,
            }}
          >
            <div className="management-stats-grid">
              <div className="management-stat-card">
                <div className="management-stat-label">
                  Type
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {event.type ||
                    "-"}
                </div>
              </div>

              <div className="management-stat-card">
                <div className="management-stat-label">
                  Date
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  {formatDate(
                    event.date
                  )}
                </div>
              </div>

              <div className="management-stat-card">
                <div className="management-stat-label">
                  Lieu
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {event.location ||
                    "-"}
                </div>
              </div>

              <div className="management-stat-card">
                <div className="management-stat-label">
                  Responsable
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {event.leader ||
                    "-"}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 22,
                padding: 20,
                border:
                  "1px solid #e5e7eb",
                borderRadius: 12,
                background:
                  "#f8fafc",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    "#64748b",
                  marginBottom: 8,
                }}
              >
                Description
              </div>

              <div
                style={{
                  color:
                    "#374151",
                  lineHeight: 1.7,
                }}
              >
                {event.description ||
                  "Aucune description renseignée."}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================
            STATISTIQUES
        ================================================ */}

        {summary && (
          <div
            style={{
              marginTop: 24,
            }}
          >
            <div className="management-stats-grid">
              <div className="management-stat-card">
                <div className="management-stat-label">
                  Total membres
                </div>

                <div className="management-stat-value">
                  {summary.totalMembers ||
                    0}
                </div>

                <div className="management-stat-description">
                  Membres concernés
                </div>
              </div>

              <div className="management-stat-card">
                <div className="management-stat-label">
                  Présents
                </div>

                <div className="management-stat-value">
                  {summary.present ||
                    0}
                </div>

                <div className="management-stat-description">
                  Présences confirmées
                </div>
              </div>

              <div className="management-stat-card">
                <div className="management-stat-label">
                  Absents
                </div>

                <div className="management-stat-value">
                  {summary.absent ||
                    0}
                </div>

                <div className="management-stat-description">
                  Membres absents
                </div>
              </div>

              <div className="management-stat-card">
                <div className="management-stat-label">
                  Excusés
                </div>

                <div className="management-stat-value">
                  {summary.excused ||
                    0}
                </div>

                <div className="management-stat-description">
                  Absences excusées
                </div>
              </div>

              <div className="management-stat-card">
                <div className="management-stat-label">
                  Non marqués
                </div>

                <div className="management-stat-value">
                  {summary.notMarked ||
                    0}
                </div>

                <div className="management-stat-description">
                  Pointage restant
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================
            TABLEAU PRÉSENCES
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
                Présences des membres
              </h2>

              <p className="page-subtitle">
                Consultez le statut de
                présence de chaque membre.
              </p>
            </div>

            <div>
              <span className="status-badge status-planned">
                {membersAttendance.length}{" "}
                membre
                {membersAttendance.length >
                1
                  ? "s"
                  : ""}
              </span>
            </div>
          </div>

          {membersAttendance.length >
          0 ? (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Membre
                    </th>

                    <th>
                      Département
                    </th>

                    <th>
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {membersAttendance.map(
                    (item) => {
                      const member =
                        item.member;

                      return (
                        <tr
                          key={
                            member?._id ||
                            item._id
                          }
                        >
                          <td>
                            <div className="person-cell">
                              <div className="person-avatar">
                                {getInitials(
                                  member
                                )}
                              </div>

                              <div>
                                <div className="person-name">
                                  {member?.firstName ||
                                    ""}{" "}
                                  {member?.lastName ||
                                    ""}
                                </div>

                                <div className="person-secondary">
                                  {member?.email ||
                                    member?.phone ||
                                    "Membre"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            {member
                              ?.department
                              ?.name ||
                              "-"}
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                item.status
                              )}
                            >
                              {item.status ||
                                "Non marqué"}
                            </span>
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
                Aucune donnée de
                présence
              </h3>

              <p>
                Aucun pointage n'est
                encore disponible pour
                cet événement.
              </p>

              <Link
                to={`/attendance?eventId=${event._id}`}
                className="btn btn-primary"
              >
                Ouvrir le pointage
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}