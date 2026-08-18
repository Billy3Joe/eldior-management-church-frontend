import { useEffect, useMemo, useState } from "react";
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

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get("/dashboard");
        setDashboard(res.data.data || null);
      } catch (err) {
        console.error("Erreur dashboard :", err);
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const overview = dashboard?.overview || {};
  const members = dashboard?.members || {};
  const events = dashboard?.events || {};
  const recentActivity = dashboard?.recentActivity || {};
  const membersByDepartment = dashboard?.membersByDepartment || [];

  const memberStatusData = useMemo(
    () => [
      { name: "Actifs", value: members.activeMembers || 0 },
      { name: "Inactifs", value: members.inactiveMembers || 0 },
    ],
    [members]
  );

  const eventStatusData = useMemo(
    () => [
      { name: "Prévus", value: events.plannedEvents || 0 },
      { name: "Terminés", value: events.completedEvents || 0 },
      { name: "Annulés", value: events.cancelledEvents || 0 },
    ],
    [events]
  );

  const departmentChartData = useMemo(
    () =>
      membersByDepartment.map((dep) => ({
        name: dep.name,
        total: dep.totalMembers || 0,
        actifs: dep.activeMembers || 0,
        inactifs: dep.inactiveMembers || 0,
      })),
    [membersByDepartment]
  );

  if (loading) {
    return (
      <Layout>
        <div className="card">Chargement du dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Vue d’ensemble</h2>
          <p style={{ color: "#6b7280", marginTop: 6 }}>
            Résumé global de l’activité de l’église
          </p>
        </div>
      </div>

      <div className="cards-grid">
        <div className="stat-card">
          <h3>Total membres</h3>
          <p>{overview.totalMembers || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total départements</h3>
          <p>{overview.totalDepartments || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total événements</h3>
          <p>{overview.totalEvents || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total présences</h3>
          <p>{overview.totalAttendances || 0}</p>
        </div>
      </div>

      <div className="content-grid section-gap">
        <div className="card chart-card">
          <h2>Statut des membres</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={memberStatusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#dc2626" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h2>Statut des événements</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={eventStatusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#16a34a" />
                  <Cell fill="#d97706" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card section-gap chart-card">
        <h2>Membres par département</h2>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#111827" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actifs" fill="#16a34a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="inactifs" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="content-grid section-gap">
        <div className="card">
          <h2>Derniers membres</h2>
          <ul className="list">
            {recentActivity.recentMembers?.length > 0 ? (
              recentActivity.recentMembers.map((member) => (
                <li key={member._id}>
                  {member.firstName || "-"} {member.lastName || "-"} —{" "}
                  {member.department?.name || "Sans département"}
                </li>
              ))
            ) : (
              <li>Aucun membre récent</li>
            )}
          </ul>
        </div>

        <div className="card">
          <h2>Derniers événements</h2>
          <ul className="list">
            {recentActivity.recentEvents?.length > 0 ? (
              recentActivity.recentEvents.map((event) => (
                <li key={event._id}>
                  {event.title || "-"} — {event.status || "-"}
                </li>
              ))
            ) : (
              <li>Aucun événement récent</li>
            )}
          </ul>
        </div>
      </div>

      <div className="card section-gap">
        <h2>Dernières présences</h2>
        <ul className="list">
          {recentActivity.recentAttendances?.length > 0 ? (
            recentActivity.recentAttendances.map((attendance) => (
              <li key={attendance._id}>
                {attendance.memberId?.firstName || "-"}{" "}
                {attendance.memberId?.lastName || "-"} —{" "}
                {attendance.eventId?.title || "Événement"} —{" "}
                {attendance.status || "-"}
              </li>
            ))
          ) : (
            <li>Aucune présence récente</li>
          )}
        </ul>
      </div>
    </Layout>
  );
}