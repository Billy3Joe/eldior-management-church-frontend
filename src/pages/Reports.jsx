import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import API from "../api/axios";
import Layout from "../components/Layout";

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardRes, departmentsRes] = await Promise.all([
        API.get("/dashboard"),
        API.get("/departments/stats/all"),
      ]);

      setDashboard(dashboardRes?.data?.data || {});
      setDepartmentStats(departmentsRes?.data?.data || []);
    } catch (err) {
      console.error("Erreur fetch reports :", err);
      setError(
        err?.response?.data?.message || "Impossible de charger les rapports."
      );
      setDashboard({});
      setDepartmentStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const overview = dashboard?.overview || {};
    const members = dashboard?.members || {};
    const events = dashboard?.events || {};
    const recentActivity = dashboard?.recentActivity || {};

    const summarySheetData = [
      ["RAPPORT GLOBAL - ELDIOR MANAGEMENT CHURCH"],
      [],
      ["Vue d’ensemble"],
      ["Total membres", overview.totalMembers || 0],
      ["Total départements", overview.totalDepartments || 0],
      ["Total événements", overview.totalEvents || 0],
      ["Total présences", overview.totalAttendances || 0],
      [],
      ["Statut des membres"],
      ["Actifs", members.activeMembers || 0],
      ["Inactifs", members.inactiveMembers || 0],
      [],
      ["Statut des événements"],
      ["Prévus", events.plannedEvents || 0],
      ["Terminés", events.completedEvents || 0],
      ["Annulés", events.cancelledEvents || 0],
    ];

    const departmentSheetData = [
      [
        "Département",
        "Leader",
        "Statut",
        "Total membres",
        "Actifs",
        "Inactifs",
      ],
      ...departmentStats.map((dep) => [
        dep.name || "",
        dep.leader || "",
        dep.status || "",
        dep.totalMembers || 0,
        dep.activeMembers || 0,
        dep.inactiveMembers || 0,
      ]),
    ];

    const recentMembersSheetData = [
      ["Prénom", "Nom", "Département"],
      ...(recentActivity?.recentMembers || []).map((member) => [
        member.firstName || "",
        member.lastName || "",
        member.department?.name || "Sans département",
      ]),
    ];

    const recentEventsSheetData = [
      ["Titre", "Statut"],
      ...(recentActivity?.recentEvents || []).map((event) => [
        event.title || "",
        event.status || "",
      ]),
    ];

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
    const departmentsSheet = XLSX.utils.aoa_to_sheet(departmentSheetData);
    const membersSheet = XLSX.utils.aoa_to_sheet(recentMembersSheetData);
    const eventsSheet = XLSX.utils.aoa_to_sheet(recentEventsSheetData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Résumé");
    XLSX.utils.book_append_sheet(workbook, departmentsSheet, "Départements");
    XLSX.utils.book_append_sheet(workbook, membersSheet, "Derniers membres");
    XLSX.utils.book_append_sheet(workbook, eventsSheet, "Derniers événements");

    XLSX.writeFile(workbook, "rapport-eldior-management-church.xlsx");
  };

  const overview = dashboard?.overview || {};
  const members = dashboard?.members || {};
  const events = dashboard?.events || {};
  const recentActivity = dashboard?.recentActivity || {};
  const recentMembers = recentActivity?.recentMembers || [];
  const recentEvents = recentActivity?.recentEvents || [];

  if (loading) {
    return (
      <Layout>
        <div className="card">Chargement des rapports...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="card">
        <div className="section-header">
          <div>
            <h2>Rapports globaux</h2>
            <p style={{ color: "#6b7280", marginTop: 6 }}>
              Vue synthétique de l’activité de l’église
            </p>
          </div>

          <div className="export-actions">
            <button className="export-btn excel-btn" onClick={handleExportExcel}>
              Export Excel
            </button>
            <button className="print-btn" onClick={handlePrint}>
              Imprimer PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="error-box" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}
      </div>

      <div className="cards-grid section-gap">
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
        <div className="card">
          <h2>Statut des membres</h2>
          <ul className="list">
            <li>Actifs : {members.activeMembers || 0}</li>
            <li>Inactifs : {members.inactiveMembers || 0}</li>
          </ul>
        </div>

        <div className="card">
          <h2>Statut des événements</h2>
          <ul className="list">
            <li>Prévus : {events.plannedEvents || 0}</li>
            <li>Terminés : {events.completedEvents || 0}</li>
            <li>Annulés : {events.cancelledEvents || 0}</li>
          </ul>
        </div>
      </div>

      <div className="card section-gap">
        <h2>Répartition par département</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Département</th>
                <th>Leader</th>
                <th>Statut</th>
                <th>Total membres</th>
                <th>Actifs</th>
                <th>Inactifs</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.length > 0 ? (
                departmentStats.map((dep) => (
                  <tr key={dep._id}>
                    <td>{dep.name || "-"}</td>
                    <td>{dep.leader || "-"}</td>
                    <td>{dep.status || "-"}</td>
                    <td>{dep.totalMembers || 0}</td>
                    <td>{dep.activeMembers || 0}</td>
                    <td>{dep.inactiveMembers || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">Aucune donnée disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-grid section-gap">
        <div className="card">
          <h2>Derniers membres</h2>
          <ul className="list">
            {recentMembers.length > 0 ? (
              recentMembers.map((member) => (
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
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
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
    </Layout>
  );
}