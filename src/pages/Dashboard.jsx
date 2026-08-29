import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import API from "../api/axios";
import Layout from "../components/Layout";

import "../styles/ManagementPages.css";
import "./Dashboard.css";

export default function Dashboard() {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ======================================================
  // CHARGEMENT
  // ======================================================

  useEffect(() => {
    const fetchDashboard =
      async () => {
        try {
          setLoading(true);
          setError("");

          const res =
            await API.get(
              "/dashboard"
            );

          setDashboard(
            res.data?.data ||
              null
          );
        } catch (err) {
          console.error(
            "Erreur dashboard :",
            err
          );

          setDashboard(null);

          setError(
            err.response?.data
              ?.message ||
              "Impossible de charger le tableau de bord."
          );
        } finally {
          setLoading(false);
        }
      };

    fetchDashboard();
  }, []);

  // ======================================================
  // DONNÉES
  // ======================================================

  const overview =
    dashboard?.overview || {};

  const members =
    dashboard?.members || {};

  const events =
    dashboard?.events || {};

  const recentActivity =
    dashboard?.recentActivity || {};

  const membersByDepartment =
    dashboard?.membersByDepartment ||
    [];

  // ======================================================
  // MEMBRES
  // ======================================================

  const memberStatusData =
    useMemo(
      () => [
        {
          name: "Actifs",
          value:
            members.activeMembers ||
            0,
        },
        {
          name: "Inactifs",
          value:
            members.inactiveMembers ||
            0,
        },
      ],
      [
        members.activeMembers,
        members.inactiveMembers,
      ]
    );

  // ======================================================
  // ÉVÉNEMENTS
  // ======================================================

  const eventStatusData =
    useMemo(
      () => [
        {
          name: "Prévus",
          value:
            events.plannedEvents ||
            0,
        },
        {
          name: "Terminés",
          value:
            events.completedEvents ||
            0,
        },
        {
          name: "Annulés",
          value:
            events.cancelledEvents ||
            0,
        },
      ],
      [
        events.plannedEvents,
        events.completedEvents,
        events.cancelledEvents,
      ]
    );

  // ======================================================
  // DÉPARTEMENTS
  // ======================================================

  const departmentChartData =
    useMemo(
      () =>
        membersByDepartment.map(
          (department) => ({
            name:
              department.name ||
              "Département",

            total:
              department.totalMembers ||
              0,

            actifs:
              department.activeMembers ||
              0,

            inactifs:
              department.inactiveMembers ||
              0,
          })
        ),
      [membersByDepartment]
    );

  // ======================================================
  // HELPERS
  // ======================================================

  const getInitials = (
    firstName,
    lastName
  ) => {
    const first =
      firstName?.[0] || "";

    const last =
      lastName?.[0] || "";

    return `${first}${last}`
      .toUpperCase() || "M";
  };

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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

  const getEventStatusClass = (
    status
  ) => {
    switch (status) {
      case "planned":
        return "status-badge status-planned";

      case "ongoing":
        return "status-badge status-active";

      case "completed":
        return "status-badge status-completed";

      case "cancelled":
        return "status-badge status-cancelled";

      default:
        return "status-badge status-pending";
    }
  };

  const getAttendanceClass = (
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
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="dashboard-loading">
            <div className="management-spinner" />

            <h3>
              Chargement du tableau
              de bord
            </h3>

            <p>
              Préparation des
              statistiques...
            </p>
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
            <div className="management-empty-icon">
              ⚠
            </div>

            <h3>
              Tableau de bord
              indisponible
            </h3>

            <p>
              {error}
            </p>
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
      <div className="management-page dashboard-page">
        {/* ================================================
            HEADER
        ================================================ */}

        <div className="page-header">
          <div className="page-header-left">
            <div className="dashboard-eyebrow">
              TABLEAU DE BORD
            </div>

            <h1 className="page-title">
              Vue d’ensemble
            </h1>

            <p className="page-subtitle">
              Suivez en un coup
              d’œil l’activité de
              votre église.
            </p>
          </div>

          <div className="dashboard-live-indicator">
            <span className="dashboard-live-dot" />

            Données actualisées
          </div>
        </div>

        {/* ================================================
            KPI
        ================================================ */}

        <div className="dashboard-kpi-grid">
          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-top">
              <div className="dashboard-kpi-icon">
                👥
              </div>

              <span>
                Membres
              </span>
            </div>

            <div className="dashboard-kpi-value">
              {overview.totalMembers ||
                0}
            </div>

            <div className="dashboard-kpi-footer">
              <span className="dashboard-positive">
                {members.activeMembers ||
                  0}{" "}
                actifs
              </span>

              <span>
                {members.inactiveMembers ||
                  0}{" "}
                inactifs
              </span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-top">
              <div className="dashboard-kpi-icon">
                ◫
              </div>

              <span>
                Départements
              </span>
            </div>

            <div className="dashboard-kpi-value">
              {overview.totalDepartments ||
                0}
            </div>

            <div className="dashboard-kpi-footer">
              <span>
                Organisation des
                équipes
              </span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-top">
              <div className="dashboard-kpi-icon">
                ◷
              </div>

              <span>
                Événements
              </span>
            </div>

            <div className="dashboard-kpi-value">
              {overview.totalEvents ||
                0}
            </div>

            <div className="dashboard-kpi-footer">
              <span className="dashboard-info">
                {events.plannedEvents ||
                  0}{" "}
                planifiés
              </span>

              <span>
                {events.completedEvents ||
                  0}{" "}
                terminés
              </span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-top">
              <div className="dashboard-kpi-icon">
                ✓
              </div>

              <span>
                Présences
              </span>
            </div>

            <div className="dashboard-kpi-value">
              {overview.totalAttendances ||
                0}
            </div>

            <div className="dashboard-kpi-footer">
              <span>
                Pointages enregistrés
              </span>
            </div>
          </div>
        </div>

        {/* ================================================
            GRAPHIQUES PIE
        ================================================ */}

        <div className="dashboard-chart-grid">
          <div className="management-card dashboard-chart-card">
            <div className="dashboard-card-heading">
              <div>
                <h2>
                  Statut des membres
                </h2>

                <p>
                  Répartition des
                  membres actifs et
                  inactifs.
                </p>
              </div>
            </div>

            <div className="dashboard-pie-wrapper">
              <ResponsiveContainer
                width="100%"
                height={290}
              >
                <PieChart>
                  <Pie
                    data={
                      memberStatusData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    <Cell fill="#16a34a" />
                    <Cell fill="#e5e7eb" />
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="dashboard-pie-center">
                <strong>
                  {overview.totalMembers ||
                    0}
                </strong>

                <span>
                  Membres
                </span>
              </div>
            </div>
          </div>

          <div className="management-card dashboard-chart-card">
            <div className="dashboard-card-heading">
              <div>
                <h2>
                  Statut des événements
                </h2>

                <p>
                  État des événements
                  enregistrés.
                </p>
              </div>
            </div>

            <div className="dashboard-pie-wrapper">
              <ResponsiveContainer
                width="100%"
                height={290}
              >
                <PieChart>
                  <Pie
                    data={
                      eventStatusData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill="#16a34a" />
                    <Cell fill="#f59e0b" />
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="dashboard-pie-center">
                <strong>
                  {overview.totalEvents ||
                    0}
                </strong>

                <span>
                  Événements
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================
            BAR CHART
        ================================================ */}

        <div className="management-card dashboard-department-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>
                Membres par département
              </h2>

              <p>
                Répartition des
                effectifs dans les
                différents
                départements.
              </p>
            </div>

            <span className="status-badge status-planned">
              {
                membersByDepartment.length
              }{" "}
              département
              {membersByDepartment.length >
              1
                ? "s"
                : ""}
            </span>
          </div>

          {departmentChartData.length >
          0 ? (
            <div className="dashboard-bar-chart">
              <ResponsiveContainer
                width="100%"
                height={350}
              >
                <BarChart
                  data={
                    departmentChartData
                  }
                  margin={{
                    top: 15,
                    right: 15,
                    left: -15,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill:
                        "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={
                      false
                    }
                    tick={{
                      fill:
                        "#94a3b8",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#4f46e5"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="actifs"
                    name="Actifs"
                    fill="#16a34a"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="inactifs"
                    name="Inactifs"
                    fill="#cbd5e1"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="management-empty">
              <div className="management-empty-icon">
                ◫
              </div>

              <h3>
                Aucun département
              </h3>

              <p>
                Les statistiques des
                départements
                apparaîtront ici.
              </p>
            </div>
          )}
        </div>

        {/* ================================================
            ACTIVITÉ RÉCENTE
        ================================================ */}

        <div className="dashboard-activity-grid">
          {/* MEMBRES */}

          <div className="management-card dashboard-activity-card">
            <div className="dashboard-card-heading">
              <div>
                <h2>
                  Derniers membres
                </h2>

                <p>
                  Membres récemment
                  enregistrés.
                </p>
              </div>
            </div>

            <div className="dashboard-activity-list">
              {recentActivity
                .recentMembers
                ?.length > 0 ? (
                recentActivity.recentMembers.map(
                  (member) => (
                    <div
                      className="dashboard-activity-row"
                      key={
                        member._id
                      }
                    >
                      <div className="person-avatar">
                        {getInitials(
                          member.firstName,
                          member.lastName
                        )}
                      </div>

                      <div className="dashboard-activity-content">
                        <strong>
                          {member.firstName ||
                            "-"}{" "}
                          {member.lastName ||
                            "-"}
                        </strong>

                        <span>
                          {member
                            .department
                            ?.name ||
                            "Sans département"}
                        </span>
                      </div>

                      {member.createdAt && (
                        <div className="dashboard-activity-date">
                          {formatDate(
                            member.createdAt
                          )}
                        </div>
                      )}
                    </div>
                  )
                )
              ) : (
                <div className="dashboard-mini-empty">
                  Aucun membre récent
                </div>
              )}
            </div>
          </div>

          {/* ÉVÉNEMENTS */}

          <div className="management-card dashboard-activity-card">
            <div className="dashboard-card-heading">
              <div>
                <h2>
                  Derniers événements
                </h2>

                <p>
                  Événements récemment
                  enregistrés.
                </p>
              </div>
            </div>

            <div className="dashboard-activity-list">
              {recentActivity
                .recentEvents
                ?.length > 0 ? (
                recentActivity.recentEvents.map(
                  (event) => (
                    <div
                      className="dashboard-activity-row"
                      key={
                        event._id
                      }
                    >
                      <div className="dashboard-event-icon">
                        ◷
                      </div>

                      <div className="dashboard-activity-content">
                        <strong>
                          {event.title ||
                            "-"}
                        </strong>

                        <span>
                          {event.location ||
                            "Lieu non renseigné"}
                        </span>
                      </div>

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
                  )
                )
              ) : (
                <div className="dashboard-mini-empty">
                  Aucun événement récent
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================
            PRÉSENCES
        ================================================ */}

        <div className="management-card dashboard-attendance-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>
                Dernières présences
              </h2>

              <p>
                Derniers pointages
                enregistrés dans
                l’application.
              </p>
            </div>
          </div>

          {recentActivity
            .recentAttendances
            ?.length > 0 ? (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Membre
                    </th>

                    <th>
                      Événement
                    </th>

                    <th>
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentActivity.recentAttendances.map(
                    (
                      attendance
                    ) => (
                      <tr
                        key={
                          attendance._id
                        }
                      >
                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              {getInitials(
                                attendance
                                  .memberId
                                  ?.firstName,
                                attendance
                                  .memberId
                                  ?.lastName
                              )}
                            </div>

                            <div>
                              <div className="person-name">
                                {attendance
                                  .memberId
                                  ?.firstName ||
                                  "-"}{" "}
                                {attendance
                                  .memberId
                                  ?.lastName ||
                                  "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {attendance
                            .eventId
                            ?.title ||
                            "Événement"}
                        </td>

                        <td>
                          <span
                            className={getAttendanceClass(
                              attendance.status
                            )}
                          >
                            {attendance.status ||
                              "-"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="management-empty">
              <div className="management-empty-icon">
                ✓
              </div>

              <h3>
                Aucune présence récente
              </h3>

              <p>
                Les derniers pointages
                apparaîtront ici.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}