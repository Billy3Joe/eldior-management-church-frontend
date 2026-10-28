
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

// ======================================================
// ROUTES EXACTES DE L'APPLICATION
// ======================================================

const ROUTES = {
  dashboard: "/dashboard",

  members: "/members",
  families: "/families",
  groups: "/groups",
  departments: "/departments",

  events: "/events",
  attendances: "/attendance",
  attendanceStatistics: "/attendance-stats",
  assignments: "/assignments",

  pastoralStatistics: "/pastoral-statistics",
  visitors: "/visitor-follow-up",
  pastoralAlerts: "/pastoral-alerts",

  reports: "/reports",

  finance: "/finance",
  financeAccounts: "/finance/accounts",
  financeCategories: "/finance/categories",
  financeTransactions: "/finance/transactions",
  financeBudgets: "/finance/budgets",
  financeReconciliation: "/finance/reconciliation",

  settings: "/settings",
  subscription: "/subscription",
  users: "/users",
  activityLogs: "/activity-logs",
};

// ======================================================
// FONCTIONS UTILITAIRES
// ======================================================

const number = (value) => Number(value) || 0;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (firstName, lastName) => {
  const first = firstName?.[0] || "";
  const last = lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "M";
};

const getEventStatusLabel = (status) => {
  const labels = {
    planned: "Planifié",
    ongoing: "En cours",
    completed: "Terminé",
    cancelled: "Annulé",
  };

  return labels[status] || status || "-";
};

const getEventStatusClass = (status) => {
  const classes = {
    planned: "status-planned",
    "Planifié": "status-planned",
    ongoing: "status-active",
    "En cours": "status-active",
    completed: "status-completed",
    "Terminé": "status-completed",
    cancelled: "status-cancelled",
    "Annulé": "status-cancelled",
  };

  return `status-badge ${
    classes[status] || "status-pending"
  }`;
};

// ======================================================
// CARTE STATISTIQUE CLIQUABLE
// ======================================================

function KpiCard({
  icon,
  title,
  value,
  footer,
  to,
}) {
  const content = (
    <>
      <div className="dashboard-kpi-top">
        {icon && (
          <div className="dashboard-kpi-icon">
            {icon}
          </div>
        )}

        <span>{title}</span>
      </div>

      <div className="dashboard-kpi-value">
        {value}
      </div>

      {footer && (
        <div className="dashboard-kpi-footer">
          <span>{footer}</span>
        </div>
      )}
    </>
  );

  if (!to) {
    return (
      <div className="dashboard-kpi-card">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="dashboard-kpi-card dashboard-kpi-clickable"
      title={`Accéder à ${title}`}
      aria-label={`Accéder à ${title}`}
    >
      {content}
    </Link>
  );
}

// ======================================================
// EN-TÊTE DE SECTION
// ======================================================

function SectionHeading({
  title,
  description,
  badge,
  to,
}) {
  return (
    <div className="dashboard-card-heading">
      <div>
        <h2>{title}</h2>

        {description && (
          <p>{description}</p>
        )}
      </div>

      <div className="dashboard-section-actions">
        {badge && (
          <span className="status-badge status-planned">
            {badge}
          </span>
        )}

        {to && (
          <Link
            to={to}
            className="dashboard-section-link"
          >
            Voir la page
            <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ======================================================
// ÉTAT VIDE
// ======================================================

function EmptyState({ title, description }) {
  return (
    <div className="management-empty">
      <div className="management-empty-icon">
        ◫
      </div>

      <h3>{title}</h3>

      {description && (
        <p>{description}</p>
      )}
    </div>
  );
}

// ======================================================
// GRAPHIQUE CIRCULAIRE
// ======================================================

function DonutChart({
  data,
  total,
  label,
  colors,
}) {
  const hasData = data.some(
    (item) => item.value > 0
  );

  if (!hasData) {
    return (
      <EmptyState
        title="Aucune donnée disponible"
        description="Les statistiques apparaîtront après les premiers enregistrements."
      />
    );
  }

  return (
    <div className="dashboard-pie-wrapper">
      <ResponsiveContainer
        width="100%"
        height={290}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={4}
          >
            {data.map((item, index) => (
              <Cell
                key={item.name}
                fill={
                  colors[index % colors.length]
                }
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>

      <div className="dashboard-pie-center">
        <strong>{total}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

// ======================================================
// ACCÈS RAPIDE
// ======================================================

function QuickAccessCard({
  icon,
  title,
  description,
  to,
}) {
  return (
    <Link
      to={to}
      className="dashboard-quick-card"
      aria-label={`Accéder à ${title}`}
    >
      <div className="dashboard-quick-icon">
        {icon}
      </div>

      <div className="dashboard-quick-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <span
        className="dashboard-quick-arrow"
        aria-hidden="true"
      >
        ↗
      </span>
    </Link>
  );
}

// ======================================================
// TABLEAU DE BORD PRINCIPAL
// ======================================================

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================================================
  // CHARGEMENT DES DONNÉES
  // ==================================================

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/dashboard");

        if (mounted) {
          setDashboard(response.data?.data || null);
        }
      } catch (err) {
        console.error("Erreur dashboard :", err);

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger le tableau de bord."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  // ==================================================
  // DONNÉES
  // ==================================================

  const members = dashboard?.members || {};
  const departments = dashboard?.departments || {};
  const families = dashboard?.families || {};
  const groups = dashboard?.groups || {};
  const visitors = dashboard?.visitors || {};
  const users = dashboard?.users || {};
  const events = dashboard?.events || {};
  const attendances = dashboard?.attendances || {};
  const assignments = dashboard?.assignments || {};

  const nextEvents = Array.isArray(dashboard?.nextEvents)
    ? dashboard.nextEvents
    : [];

  const recentMembers = Array.isArray(
    dashboard?.recentMembers
  )
    ? dashboard.recentMembers
    : [];

  const recentAssignments = Array.isArray(
    dashboard?.recentAssignments
  )
    ? dashboard.recentAssignments
    : [];

  const membersByDepartment = Array.isArray(
    dashboard?.membersByDepartment
  )
    ? dashboard.membersByDepartment
    : [];

  // ==================================================
  // GRAPHIQUES
  // ==================================================

  const memberStatusData = useMemo(
    () => [
      {
        name: "Actifs",
        value: number(members.active),
      },
      {
        name: "Inactifs",
        value: number(members.inactive),
      },
    ],
    [members.active, members.inactive]
  );

  const eventStatusData = useMemo(() => {
    const upcoming = number(events.upcoming);
    const total = number(events.total);

    return [
      {
        name: "À venir",
        value: upcoming,
      },
      {
        name: "Autres",
        value: Math.max(total - upcoming, 0),
      },
    ];
  }, [events.total, events.upcoming]);

  const departmentChartData = useMemo(
    () =>
      membersByDepartment.map((department) => ({
        name: department.name || "Département",
        total: number(department.totalMembers),
        actifs: number(department.activeMembers),
        inactifs: number(department.inactiveMembers),
      })),
    [membersByDepartment]
  );

  // ==================================================
  // CHARGEMENT
  // ==================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="dashboard-loading">
            <div className="management-spinner" />

            <h3>Chargement du tableau de bord</h3>
            <p>Préparation des statistiques...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ==================================================
  // ERREUR
  // ==================================================

  if (error) {
    return (
      <Layout>
        <div className="management-page">
          <EmptyState
            title="Tableau de bord indisponible"
            description={error}
          />
        </div>
      </Layout>
    );
  }

  // ==================================================
  // AFFICHAGE PRINCIPAL
  // ==================================================

  return (
    <Layout>
      <div className="management-page dashboard-page">

        {/* ======================================
            EN-TÊTE
        ====================================== */}

        <div className="page-header">
          <div className="page-header-left">
            <div className="dashboard-eyebrow">
              TABLEAU DE BORD
            </div>

            <h1 className="page-title">
              Vue d’ensemble
            </h1>

            <p className="page-subtitle">
              Suivez en un coup d’œil l’activité
              de votre église.
            </p>
          </div>

          <div className="dashboard-live-indicator">
            <span className="dashboard-live-dot" />
            Données actualisées
          </div>
        </div>

        {/* ======================================
            INDICATEURS PRINCIPAUX
        ====================================== */}

        <div className="dashboard-kpi-grid">
          <KpiCard
            icon="👥"
            title="Membres"
            value={number(members.total)}
            footer={`${number(members.active)} actifs · ${number(
              members.inactive
            )} inactifs`}
            to={ROUTES.members}
          />

          <KpiCard
            icon="◫"
            title="Départements"
            value={number(departments.total)}
            footer={`${number(departments.active)} actifs`}
            to={ROUTES.departments}
          />

          <KpiCard
            icon="◷"
            title="Événements"
            value={number(events.total)}
            footer={`${number(events.upcoming)} à venir`}
            to={ROUTES.events}
          />

          <KpiCard
            icon="✓"
            title="Présences"
            value={number(attendances.total)}
            footer={`${number(attendances.present)} présents · ${number(
              attendances.attendanceRate
            )}%`}
            to={ROUTES.attendances}
          />
        </div>

        {/* ======================================
            COMMUNAUTÉ ET SUIVI PASTORAL
        ====================================== */}

        <div className="management-card dashboard-department-card">
          <SectionHeading
            title="Communauté et suivi pastoral"
            description="Vue générale des familles, groupes, visiteurs et utilisateurs de l’église."
          />

          <div className="dashboard-kpi-grid">
            <KpiCard
              icon="⌂"
              title="Familles"
              value={number(families.total)}
              footer={`${number(families.active)} actives · ${number(
                families.inactive
              )} inactives`}
              to={ROUTES.families}
            />

            <KpiCard
              icon="◉"
              title="Groupes / Cellules"
              value={number(groups.total)}
              footer={`${number(groups.active)} actifs · ${number(
                groups.paused
              )} en pause`}
              to={ROUTES.groups}
            />

            <KpiCard
              icon="♧"
              title="Visiteurs"
              value={number(visitors.total)}
              footer={`${number(visitors.toFollowUp)} à suivre · ${number(
                visitors.integrated
              )} anciens visiteurs intégrés`}
              to={ROUTES.visitors}
            />

            <KpiCard
              icon="♙"
              title="Utilisateurs actifs"
              value={number(users.total)}
              footer="Comptes actifs de l’église"
              to={ROUTES.users}
            />
          </div>
        </div>

        {/* ======================================
            STATUT DES MEMBRES ET ÉVÉNEMENTS
        ====================================== */}

        <div className="dashboard-chart-grid">
          <div className="management-card dashboard-chart-card">
            <SectionHeading
              title="Statut des membres"
              description="Répartition des membres actifs et inactifs."
              to={ROUTES.members}
            />

            <DonutChart
              data={memberStatusData}
              total={number(members.total)}
              label="Membres"
              colors={["#16a34a", "#e5e7eb"]}
            />
          </div>

          <div className="management-card dashboard-chart-card">
            <SectionHeading
              title="Statut des événements"
              description="Répartition des événements enregistrés."
              to={ROUTES.events}
            />

            <DonutChart
              data={eventStatusData}
              total={number(events.total)}
              label="Événements"
              colors={["#4f46e5", "#cbd5e1"]}
            />
          </div>
        </div>

        {/* ======================================
            PRÉSENCES DE L'ÉGLISE
        ====================================== */}

        <div className="management-card dashboard-department-card">
          <SectionHeading
            title="Présences de l’église"
            description="Résumé des pointages enregistrés."
            badge={`${number(attendances.attendanceRate)}%`}
            to={ROUTES.attendances}
          />

          <div className="dashboard-kpi-grid">
            <KpiCard
              title="Pointages"
              value={number(attendances.total)}
              to={ROUTES.attendances}
            />

            <KpiCard
              title="Présents"
              value={number(attendances.present)}
              to={ROUTES.attendances}
            />

            <KpiCard
              title="Absents"
              value={number(attendances.absent)}
              to={ROUTES.attendances}
            />

            <KpiCard
              title="Taux de présence"
              value={`${number(attendances.attendanceRate)}%`}
              to={ROUTES.attendanceStatistics}
            />
          </div>
        </div>

        {/* ======================================
            MEMBRES PAR DÉPARTEMENT
        ====================================== */}

        <div className="management-card dashboard-department-card">
          <SectionHeading
            title="Membres par département"
            description="Répartition des effectifs dans les différents départements."
            badge={`${number(departments.total)} départements`}
            to={ROUTES.departments}
          />

          {departmentChartData.some((item) => item.total > 0) ? (
            <div className="dashboard-bar-chart">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={departmentChartData}
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
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />
                  <Legend />

                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="actifs"
                    name="Actifs"
                    fill="#16a34a"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="inactifs"
                    name="Inactifs"
                    fill="#cbd5e1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Aucune affectation disponible"
              description="Ajoutez des membres aux départements pour afficher leur répartition."
            />
          )}
        </div>

        {/* ======================================
            ACTIVITÉS RÉCENTES
        ====================================== */}

        <div className="dashboard-activity-grid">

          {/* DERNIERS MEMBRES */}

          <div className="management-card dashboard-activity-card">
            <SectionHeading
              title="Derniers membres"
              description="Membres récemment enregistrés."
              to={ROUTES.members}
            />

            <div className="dashboard-activity-list">
              {recentMembers.length > 0 ? (
                recentMembers.map((member) => (
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
                        {member.firstName || "-"}{" "}
                        {member.lastName || "-"}
                      </strong>

                      <span>
                        {member.department?.name ||
                          member.membershipType ||
                          "Membre"}
                      </span>
                    </div>

                    {member.createdAt && (
                      <div className="dashboard-activity-date">
                        {formatDate(member.createdAt)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="dashboard-mini-empty">
                  Aucun membre récent
                </div>
              )}
            </div>
          </div>

          {/* PROCHAINS ÉVÉNEMENTS */}

          <div className="management-card dashboard-activity-card">
            <SectionHeading
              title="Prochains événements"
              description="Événements à venir dans votre église."
              to={ROUTES.events}
            />

            <div className="dashboard-activity-list">
              {nextEvents.length > 0 ? (
                nextEvents.map((event) => (
                  <div
                    className="dashboard-activity-row"
                    key={event._id}
                  >
                    <div className="dashboard-event-icon">
                      ◷
                    </div>

                    <div className="dashboard-activity-content">
                      <strong>{event.title || "-"}</strong>

                      <span>
                        {event.date
                          ? formatDate(event.date)
                          : event.location ||
                            "Date non renseignée"}
                      </span>
                    </div>

                    <span
                      className={getEventStatusClass(
                        event.status
                      )}
                    >
                      {getEventStatusLabel(event.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="dashboard-mini-empty">
                  Aucun événement à venir
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================
            ORGANISATION DES ÉQUIPES
        ====================================== */}

        <div className="management-card dashboard-attendance-card">
          <SectionHeading
            title="Organisation des équipes"
            description="État des affectations et confirmations."
            to={ROUTES.assignments}
          />

          <div className="dashboard-kpi-grid">
            <KpiCard
              title="Affectations"
              value={number(assignments.total)}
              to={ROUTES.assignments}
            />

            <KpiCard
              title="En attente"
              value={number(assignments.pending)}
              to={ROUTES.assignments}
            />

            <KpiCard
              title="Confirmées"
              value={number(assignments.confirmed)}
              to={ROUTES.assignments}
            />

            <KpiCard
              title="Confirmation"
              value={`${number(assignments.confirmationRate)}%`}
              to={ROUTES.assignments}
            />
          </div>

          {recentAssignments.length > 0 && (
            <div className="dashboard-activity-list">
              {recentAssignments.map((assignment) => (
                <div
                  className="dashboard-activity-row"
                  key={assignment._id}
                >
                  <div className="dashboard-event-icon">
                    📋
                  </div>

                  <div className="dashboard-activity-content">
                    <strong>
                      {assignment.title ||
                        assignment.event?.title ||
                        "Affectation"}
                    </strong>

                    <span>
                      {assignment.member
                        ? `${
                            assignment.member.firstName || ""
                          } ${
                            assignment.member.lastName || ""
                          }`
                        : assignment.department?.name ||
                          "Équipe"}
                    </span>
                  </div>

                  <span className="status-badge status-pending">
                    {assignment.status || "En attente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================
            ACCÈS RAPIDES AUX AUTRES MODULES
        ====================================== */}

        <div className="management-card dashboard-department-card">
          <SectionHeading
            title="Accès rapides"
            description="Accédez directement aux autres espaces de gestion de votre église."
          />

          <div className="dashboard-quick-grid">

            <QuickAccessCard
              icon="📈"
              title="Statistiques de présence"
              description="Analyse des participations"
              to={ROUTES.attendanceStatistics}
            />

            <QuickAccessCard
              icon="📊"
              title="Statistiques pastorales"
              description="Indicateurs du suivi pastoral"
              to={ROUTES.pastoralStatistics}
            />

            <QuickAccessCard
              icon="🔔"
              title="Alertes pastorales"
              description="Situations nécessitant un suivi"
              to={ROUTES.pastoralAlerts}
            />

            <QuickAccessCard
              icon="📑"
              title="Rapports"
              description="Consulter les rapports de l’église"
              to={ROUTES.reports}
            />

            <QuickAccessCard
              icon="💰"
              title="Tableau de bord financier"
              description="Vue générale des finances"
              to={ROUTES.finance}
            />

            <QuickAccessCard
              icon="🏦"
              title="Comptes financiers"
              description="Gestion des comptes"
              to={ROUTES.financeAccounts}
            />

            <QuickAccessCard
              icon="📂"
              title="Catégories financières"
              description="Organisation des catégories"
              to={ROUTES.financeCategories}
            />

            <QuickAccessCard
              icon="💳"
              title="Transactions financières"
              description="Entrées et dépenses"
              to={ROUTES.financeTransactions}
            />

            <QuickAccessCard
              icon="📋"
              title="Budgets financiers"
              description="Suivi des budgets de l’église"
              to={ROUTES.financeBudgets}
            />

            <QuickAccessCard
              icon="⚖️"
              title="Rapprochement financier"
              description="Contrôle des opérations"
              to={ROUTES.financeReconciliation}
            />

            <QuickAccessCard
              icon="⚙️"
              title="Paramètres"
              description="Configuration de l’église"
              to={ROUTES.settings}
            />

            <QuickAccessCard
              icon="⭐"
              title="Mon abonnement"
              description="Offre et fonctionnalités"
              to={ROUTES.subscription}
            />

            <QuickAccessCard
              icon="👤"
              title="Utilisateurs"
              description="Gestion des accès"
              to={ROUTES.users}
            />

            <QuickAccessCard
              icon="📜"
              title="Journal d’activité"
              description="Historique des opérations"
              to={ROUTES.activityLogs}
            />

          </div>
        </div>

      </div>
    </Layout>
  );
}
