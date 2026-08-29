import {
  useEffect,
  useMemo,
  useState,
} from "react";

import * as XLSX from "xlsx";

import API from "../api/axios";

import Layout from "../components/Layout";

import "../styles/ManagementPages.css";

export default function Reports() {
  const [dashboard, setDashboard] =
    useState(null);

  const [
    departmentStats,
    setDepartmentStats,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ======================================================
  // CHARGEMENT
  // ======================================================

  const fetchReportsData =
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardRes,
          departmentsRes,
        ] = await Promise.all([
          API.get("/dashboard"),

          API.get(
            "/departments/stats/all"
          ),
        ]);

        setDashboard(
          dashboardRes?.data
            ?.data || {}
        );

        setDepartmentStats(
          departmentsRes?.data
            ?.data || []
        );
      } catch (err) {
        console.error(
          "Erreur fetch reports :",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Impossible de charger les rapports."
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
    dashboard?.recentActivity ||
    {};

  const recentMembers =
    recentActivity?.recentMembers ||
    [];

  const recentEvents =
    recentActivity?.recentEvents ||
    [];

  // ======================================================
  // STATISTIQUES CALCULÉES
  // ======================================================

  const reportStats =
    useMemo(() => {
      const activeMembers =
        members.activeMembers ||
        0;

      const inactiveMembers =
        members.inactiveMembers ||
        0;

      const plannedEvents =
        events.plannedEvents ||
        0;

      const completedEvents =
        events.completedEvents ||
        0;

      const cancelledEvents =
        events.cancelledEvents ||
        0;

      return {
        activeMembers,
        inactiveMembers,
        plannedEvents,
        completedEvents,
        cancelledEvents,
      };
    }, [members, events]);

  // ======================================================
  // IMPRESSION
  // ======================================================

  const handlePrint = () => {
    window.print();
  };

  // ======================================================
  // EXPORT EXCEL
  // ======================================================

  const handleExportExcel =
    () => {
      const summarySheetData =
        [
          [
            "RAPPORT GLOBAL - ELDIOR MANAGEMENT CHURCH",
          ],
          [],
          ["Vue d’ensemble"],
          [
            "Total membres",
            overview.totalMembers ||
              0,
          ],
          [
            "Total départements",
            overview.totalDepartments ||
              0,
          ],
          [
            "Total événements",
            overview.totalEvents ||
              0,
          ],
          [
            "Total présences",
            overview.totalAttendances ||
              0,
          ],
          [],
          [
            "Statut des membres",
          ],
          [
            "Actifs",
            members.activeMembers ||
              0,
          ],
          [
            "Inactifs",
            members.inactiveMembers ||
              0,
          ],
          [],
          [
            "Statut des événements",
          ],
          [
            "Prévus",
            events.plannedEvents ||
              0,
          ],
          [
            "Terminés",
            events.completedEvents ||
              0,
          ],
          [
            "Annulés",
            events.cancelledEvents ||
              0,
          ],
        ];

      const departmentSheetData =
        [
          [
            "Département",
            "Leader",
            "Statut",
            "Total membres",
            "Actifs",
            "Inactifs",
          ],

          ...departmentStats.map(
            (dep) => [
              dep.name || "",
              dep.leader || "",
              dep.status || "",
              dep.totalMembers ||
                0,
              dep.activeMembers ||
                0,
              dep.inactiveMembers ||
                0,
            ]
          ),
        ];

      const recentMembersSheetData =
        [
          [
            "Prénom",
            "Nom",
            "Département",
          ],

          ...recentMembers.map(
            (member) => [
              member.firstName ||
                "",
              member.lastName ||
                "",
              member.department
                ?.name ||
                "Sans département",
            ]
          ),
        ];

      const recentEventsSheetData =
        [
          [
            "Titre",
            "Statut",
          ],

          ...recentEvents.map(
            (event) => [
              event.title || "",
              event.status || "",
            ]
          ),
        ];

      const workbook =
        XLSX.utils.book_new();

      const summarySheet =
        XLSX.utils.aoa_to_sheet(
          summarySheetData
        );

      const departmentsSheet =
        XLSX.utils.aoa_to_sheet(
          departmentSheetData
        );

      const membersSheet =
        XLSX.utils.aoa_to_sheet(
          recentMembersSheetData
        );

      const eventsSheet =
        XLSX.utils.aoa_to_sheet(
          recentEventsSheetData
        );

      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Résumé"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        departmentsSheet,
        "Départements"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        membersSheet,
        "Derniers membres"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        eventsSheet,
        "Derniers événements"
      );

      XLSX.writeFile(
        workbook,
        "rapport-eldior-management-church.xlsx"
      );
    };

  // ======================================================
  // LABELS
  // ======================================================

  const getMemberStatusLabel =
    (status) => {
      return status === "active"
        ? "Actif"
        : status === "inactive"
        ? "Inactif"
        : status || "—";
    };

  const getEventStatusLabel =
    (status) => {
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
          return status || "—";
      }
    };

  // ======================================================
  // CHARGEMENT
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des
                rapports...
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // AFFICHAGE
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
              Rapports globaux
            </h1>

            <p className="page-subtitle">
              Consultez une vue
              synthétique de
              l’activité de votre
              église.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-success"
              onClick={
                handleExportExcel
              }
            >
              📊 Export Excel
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={
                handlePrint
              }
            >
              🖨️ Imprimer PDF
            </button>
          </div>
        </div>

        {/* ================================================
            ERREUR
        ================================================ */}

        {error && (
          <div
            className="management-card"
            style={{
              marginBottom: 24,
              border:
                "1px solid #fecaca",
              background:
                "#fef2f2",
            }}
          >
            <div
              style={{
                color:
                  "#b91c1c",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* ================================================
            STATS PRINCIPALES
        ================================================ */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total membres
            </div>

            <div className="management-stat-value">
              {overview.totalMembers ||
                0}
            </div>

            <div className="management-stat-description">
              Membres enregistrés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Départements
            </div>

            <div className="management-stat-value">
              {overview.totalDepartments ||
                0}
            </div>

            <div className="management-stat-description">
              Départements créés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Événements
            </div>

            <div className="management-stat-value">
              {overview.totalEvents ||
                0}
            </div>

            <div className="management-stat-description">
              Événements enregistrés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Présences
            </div>

            <div className="management-stat-value">
              {overview.totalAttendances ||
                0}
            </div>

            <div className="management-stat-description">
              Présences enregistrées
            </div>
          </div>
        </div>

        {/* ================================================
            STATUTS
        ================================================ */}

        <div
          className="content-grid"
          style={{
            marginTop: 24,
          }}
        >
          {/* MEMBRES */}

          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Statut des membres
                </h2>

                <p className="page-subtitle">
                  Répartition des
                  membres actifs et
                  inactifs
                </p>
              </div>
            </div>

            <div
              style={{
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 16,
                }}
              >
                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Actifs
                  </div>

                  <div className="management-stat-value">
                    {
                      reportStats.activeMembers
                    }
                  </div>

                  <span className="status-badge status-active">
                    Actifs
                  </span>
                </div>

                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Inactifs
                  </div>

                  <div className="management-stat-value">
                    {
                      reportStats.inactiveMembers
                    }
                  </div>

                  <span className="status-badge status-inactive">
                    Inactifs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ÉVÉNEMENTS */}

          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Statut des
                  événements
                </h2>

                <p className="page-subtitle">
                  État actuel du
                  calendrier
                </p>
              </div>
            </div>

            <div
              style={{
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 16,
                  }}
                >
                  <span>
                    Événements prévus
                  </span>

                  <span className="status-badge status-planned">
                    {
                      reportStats.plannedEvents
                    }
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 16,
                  }}
                >
                  <span>
                    Événements terminés
                  </span>

                  <span className="status-badge status-completed">
                    {
                      reportStats.completedEvents
                    }
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 16,
                  }}
                >
                  <span>
                    Événements annulés
                  </span>

                  <span className="status-badge status-cancelled">
                    {
                      reportStats.cancelledEvents
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================
            DÉPARTEMENTS
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
                Répartition par
                département
              </h2>

              <p className="page-subtitle">
                Effectifs et activité
                de chaque département
              </p>
            </div>

            <span className="status-badge status-planned">
              {
                departmentStats.length
              }{" "}
              département
              {departmentStats.length >
              1
                ? "s"
                : ""}
            </span>
          </div>

          {departmentStats.length >
          0 ? (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Département
                    </th>

                    <th>
                      Leader
                    </th>

                    <th>
                      Statut
                    </th>

                    <th>
                      Total membres
                    </th>

                    <th>
                      Actifs
                    </th>

                    <th>
                      Inactifs
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {departmentStats.map(
                    (dep) => (
                      <tr
                        key={dep._id}
                      >
                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              {dep.name
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase() ||
                                "D"}
                            </div>

                            <div>
                              <div className="person-name">
                                {dep.name ||
                                  "—"}
                              </div>

                              <div className="person-secondary">
                                Département
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {dep.leader ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              dep.status ===
                              "active"
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {getMemberStatusLabel(
                              dep.status
                            )}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {dep.totalMembers ||
                              0}
                          </strong>
                        </td>

                        <td>
                          <span className="status-badge status-active">
                            {dep.activeMembers ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="status-badge status-inactive">
                            {dep.inactiveMembers ||
                              0}
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
                🏢
              </div>

              <h3>
                Aucune donnée
                disponible
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

        <div
          className="content-grid"
          style={{
            marginTop: 24,
          }}
        >
          {/* DERNIERS MEMBRES */}

          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Derniers membres
                </h2>

                <p className="page-subtitle">
                  Membres récemment
                  enregistrés
                </p>
              </div>
            </div>

            {recentMembers.length >
            0 ? (
              <div
                style={{
                  padding: 20,
                  display: "grid",
                  gap: 12,
                }}
              >
                {recentMembers.map(
                  (member) => (
                    <div
                      key={
                        member._id
                      }
                      className="person-cell"
                      style={{
                        padding:
                          "12px 0",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <div className="person-avatar">
                        {member.firstName
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase() ||
                          ""}
                        {member.lastName
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase() ||
                          ""}
                      </div>

                      <div>
                        <div className="person-name">
                          {member.firstName ||
                            "—"}{" "}
                          {member.lastName ||
                            ""}
                        </div>

                        <div className="person-secondary">
                          {member
                            .department
                            ?.name ||
                            "Sans département"}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="management-empty">
                <div className="management-empty-icon">
                  👥
                </div>

                <h3>
                  Aucun membre récent
                </h3>
              </div>
            )}
          </div>

          {/* DERNIERS ÉVÉNEMENTS */}

          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Derniers événements
                </h2>

                <p className="page-subtitle">
                  Événements récemment
                  enregistrés
                </p>
              </div>
            </div>

            {recentEvents.length >
            0 ? (
              <div
                style={{
                  padding: 20,
                  display: "grid",
                  gap: 12,
                }}
              >
                {recentEvents.map(
                  (event) => (
                    <div
                      key={
                        event._id
                      }
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: 16,
                        padding:
                          "12px 0",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <div className="person-cell">
                        <div className="person-avatar">
                          📅
                        </div>

                        <div>
                          <div className="person-name">
                            {event.title ||
                              "—"}
                          </div>

                          <div className="person-secondary">
                            Événement
                          </div>
                        </div>
                      </div>

                      <span
                        className={`status-badge ${
                          event.status ===
                          "completed"
                            ? "status-completed"
                            : event.status ===
                              "cancelled"
                            ? "status-cancelled"
                            : "status-planned"
                        }`}
                      >
                        {getEventStatusLabel(
                          event.status
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="management-empty">
                <div className="management-empty-icon">
                  📅
                </div>

                <h3>
                  Aucun événement récent
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}