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
  // DONNÉES API
  // ======================================================

  const members =
    dashboard?.members || {
      total: 0,
      active: 0,
      inactive: 0,
    };

  const departments =
    dashboard?.departments || {
      total: 0,
      active: 0,
    };

  const events =
    dashboard?.events || {
      total: 0,
      upcoming: 0,
    };

  const attendances =
    dashboard?.attendances || {
      total: 0,
      present: 0,
      absent: 0,
      attendanceRate: 0,
    };

  const assignments =
    dashboard?.assignments || {
      total: 0,
      pending: 0,
      confirmed: 0,
      declined: 0,
      confirmationRate: 0,
    };

  const nextEvents =
    Array.isArray(
      dashboard?.nextEvents
    )
      ? dashboard.nextEvents
      : [];

  const recentMembers =
    Array.isArray(
      dashboard?.recentMembers
    )
      ? dashboard.recentMembers
      : [];

  const recentAssignments =
    Array.isArray(
      dashboard?.recentAssignments
    )
      ? dashboard.recentAssignments
      : [];

  const membersByDepartment =
    Array.isArray(
      dashboard?.membersByDepartment
    )
      ? dashboard.membersByDepartment
      : [];

  // ======================================================
  // MEMBRES
  // ======================================================

  const memberStatusData =
    useMemo(
      () => [
        {
          name: "Actifs",
          value:
            members.active || 0,
        },
        {
          name: "Inactifs",
          value:
            members.inactive || 0,
        },
      ],
      [
        members.active,
        members.inactive,
      ]
    );

  // ======================================================
  // ÉVÉNEMENTS
  // ======================================================

  const eventStatusData =
    useMemo(() => {
      const upcoming =
        events.upcoming || 0;

      const otherEvents =
        Math.max(
          (events.total || 0) -
            upcoming,
          0
        );

      return [
        {
          name: "À venir",
          value: upcoming,
        },
        {
          name: "Autres",
          value: otherEvents,
        },
      ];
    }, [
      events.total,
      events.upcoming,
    ]);

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
              department.total ||
              0,

            actifs:
              department.activeMembers ||
              department.active ||
              0,

            inactifs:
              department.inactiveMembers ||
              department.inactive ||
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

      case "Planifié":
        return "Planifié";

      case "En cours":
        return "En cours";

      case "Terminé":
        return "Terminé";

      case "Annulé":
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
      case "Planifié":
        return "status-badge status-planned";

      case "ongoing":
      case "En cours":
        return "status-badge status-active";

      case "completed":
      case "Terminé":
        return "status-badge status-completed";

      case "cancelled":
      case "Annulé":
        return "status-badge status-cancelled";

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

          {/* MEMBRES */}

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
              {members.total || 0}
            </div>

            <div className="dashboard-kpi-footer">
              <span className="dashboard-positive">
                {members.active || 0}{" "}
                actifs
              </span>

              <span>
                {members.inactive || 0}{" "}
                inactifs
              </span>
            </div>
          </div>

          {/* DÉPARTEMENTS */}

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
              {departments.total ||
                0}
            </div>

            <div className="dashboard-kpi-footer">
              <span>
                {departments.active ||
                  0}{" "}
                actif
                {departments.active > 1
                  ? "s"
                  : ""}
              </span>
            </div>
          </div>

          {/* ÉVÉNEMENTS */}

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
              {events.total || 0}
            </div>

            <div className="dashboard-kpi-footer">
              <span className="dashboard-info">
                {events.upcoming ||
                  0}{" "}
                à venir
              </span>

              <span>
                {events.total || 0}{" "}
                enregistrés
              </span>
            </div>
          </div>

          {/* PRÉSENCES */}

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
              {attendances.total ||
                0}
            </div>

            <div className="dashboard-kpi-footer">
              <span className="dashboard-positive">
                {attendances.present ||
                  0}{" "}
                présents
              </span>

              <span>
                {attendances.attendanceRate ||
                  0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* ================================================
            GRAPHIQUES
        ================================================ */}

        <div className="dashboard-chart-grid">

          {/* MEMBRES */}

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
                  {members.total || 0}
                </strong>

                <span>
                  Membres
                </span>
              </div>
            </div>
          </div>

          {/* ÉVÉNEMENTS */}

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
                    <Cell fill="#cbd5e1" />
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="dashboard-pie-center">
                <strong>
                  {events.total || 0}
                </strong>

                <span>
                  Événements
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================
            INDICATEURS PRÉSENCES
        ================================================ */}

        <div className="management-card dashboard-department-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>
                Présences de l’église
              </h2>

              <p>
                Résumé des pointages
                enregistrés.
              </p>
            </div>

            <span className="status-badge status-active">
              {attendances.attendanceRate ||
                0}
              %
            </span>
          </div>

          <div className="dashboard-kpi-grid">

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  Pointages
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {attendances.total ||
                  0}
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  Présents
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {attendances.present ||
                  0}
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  Absents
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {attendances.absent ||
                  0}
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  Taux de présence
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {attendances.attendanceRate ||
                  0}
                %
              </div>
            </div>
          </div>
        </div>

        {/* ================================================
            MEMBRES PAR DÉPARTEMENT
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
              {departments.total ||
                0}{" "}
              département
              {departments.total > 1
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
                Ajoutez des
                départements pour
                afficher ici la
                répartition des
                membres.
              </p>
            </div>
          )}
        </div>

        {/* ================================================
            ACTIVITÉ RÉCENTE
        ================================================ */}

        <div className="dashboard-activity-grid">

          {/* DERNIERS MEMBRES */}

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
              {recentMembers.length >
              0 ? (
                recentMembers.map(
                  (member) => (
                    <div
                      className="dashboard-activity-row"
                      key={member._id}
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
                            member.membershipType ||
                            "Membre"}
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

          {/* PROCHAINS ÉVÉNEMENTS */}

          <div className="management-card dashboard-activity-card">
            <div className="dashboard-card-heading">
              <div>
                <h2>
                  Prochains événements
                </h2>

                <p>
                  Événements à venir
                  dans votre église.
                </p>
              </div>
            </div>

            <div className="dashboard-activity-list">
              {nextEvents.length >
              0 ? (
                nextEvents.map(
                  (event) => (
                    <div
                      className="dashboard-activity-row"
                      key={event._id}
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
                          {event.date
                            ? formatDate(
                                event.date
                              )
                            : event.location ||
                              "Date non renseignée"}
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
                  Aucun événement à
                  venir
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================
            ASSIGNATIONS
        ================================================ */}

        <div className="management-card dashboard-attendance-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>
                Organisation des équipes
              </h2>

              <p>
                État des affectations
                et confirmations.
              </p>
            </div>
          </div>

          <div className="dashboard-kpi-grid">

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  Affectations
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {assignments.total ||
                  0}
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  En attente
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {assignments.pending ||
                  0}
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  Confirmées
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {assignments.confirmed ||
                  0}
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span>
                  Confirmation
                </span>
              </div>

              <div className="dashboard-kpi-value">
                {assignments.confirmationRate ||
                  0}
                %
              </div>
            </div>
          </div>

          {recentAssignments.length >
            0 && (
            <div className="dashboard-activity-list">
              {recentAssignments.map(
                (assignment) => (
                  <div
                    className="dashboard-activity-row"
                    key={
                      assignment._id
                    }
                  >
                    <div className="dashboard-event-icon">
                      📋
                    </div>

                    <div className="dashboard-activity-content">
                      <strong>
                        {assignment.title ||
                          assignment
                            .event
                            ?.title ||
                          "Affectation"}
                      </strong>

                      <span>
                        {assignment.status ||
                          "En attente"}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}