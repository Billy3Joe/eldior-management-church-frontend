import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import * as XLSX from "xlsx";
  
  import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
  } from "recharts";
  
  import Layout from "../components/Layout";
  import "../styles/ManagementPages.css";
  
  import API from "../api/axios";
  
  export default function AttendanceStats() {
    const [analytics, setAnalytics] =
      useState(null);
  
    const [loading, setLoading] =
      useState(true);
  
    const [period, setPeriod] =
      useState("all");
  
    const [customStart, setCustomStart] =
      useState("");
  
    const [customEnd, setCustomEnd] =
      useState("");
  
    const fetchAnalytics = async (
      selectedPeriod = period
    ) => {
      try {
        setLoading(true);
  
        const query =
          new URLSearchParams();
  
        if (selectedPeriod) {
          query.append(
            "period",
            selectedPeriod
          );
        }
  
        if (
          selectedPeriod === "custom" &&
          customStart &&
          customEnd
        ) {
          query.append(
            "startDate",
            customStart
          );
  
          query.append(
            "endDate",
            customEnd
          );
        }
  
        const res = await API.get(
          `/attendances/analytics/global?${query.toString()}`
        );
  
        setAnalytics(
          res.data?.data || null
        );
      } catch (err) {
        console.error(
          "Erreur analytics attendance :",
          err
        );
  
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchAnalytics(period);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    useEffect(() => {
      if (period !== "custom") {
        fetchAnalytics(period);
      } else if (
        customStart &&
        customEnd
      ) {
        fetchAnalytics(period);
      }
  
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      period,
      customStart,
      customEnd,
    ]);
  
    const overview =
      analytics?.overview || {};
  
    const bestAttendanceEvent =
      analytics?.bestAttendanceEvent ||
      null;
  
    const eventsAnalytics =
      analytics?.eventsAnalytics || [];
  
    const globalStatusData =
      useMemo(
        () => [
          {
            name: "Présents",
            value:
              overview.presentCount ||
              0,
          },
          {
            name: "Absents",
            value:
              overview.absentCount ||
              0,
          },
          {
            name: "Excusés",
            value:
              overview.excusedCount ||
              0,
          },
        ],
        [
          overview.presentCount,
          overview.absentCount,
          overview.excusedCount,
        ]
      );
  
    const eventChartData =
      useMemo(
        () =>
          eventsAnalytics.map(
            (event) => ({
              name:
                event.title ||
                "Événement",
  
              presents:
                event.present || 0,
  
              absents:
                event.absent || 0,
  
              excuses:
                event.excused || 0,
  
              taux:
                event.attendanceRate ||
                0,
            })
          ),
        [eventsAnalytics]
      );
  
    const handleExportExcel = () => {
      const summarySheetData = [
        [
          "STATISTIQUES AVANCÉES DE PRÉSENCE",
        ],
        [],
        [
          "Période sélectionnée",
          analytics?.period ||
            period,
        ],
        [
          "Date début",
          analytics?.startDate ||
            customStart ||
            "",
        ],
        [
          "Date fin",
          analytics?.endDate ||
            customEnd ||
            "",
        ],
        [],
        ["Résumé global"],
        [
          "Total membres",
          overview.totalMembers ||
            0,
        ],
        [
          "Présents",
          overview.presentCount ||
            0,
        ],
        [
          "Absents",
          overview.absentCount ||
            0,
        ],
        [
          "Excusés",
          overview.excusedCount ||
            0,
        ],
        [
          "Total présences",
          overview.totalAttendances ||
            0,
        ],
        [],
        ["Meilleur événement"],
        [
          "Titre",
          bestAttendanceEvent?.title ||
            "",
        ],
        [
          "Taux de présence",
          `${
            bestAttendanceEvent
              ?.attendanceRate || 0
          }%`,
        ],
        [
          "Présents",
          bestAttendanceEvent
            ?.present || 0,
        ],
        [
          "Absents",
          bestAttendanceEvent
            ?.absent || 0,
        ],
        [
          "Excusés",
          bestAttendanceEvent
            ?.excused || 0,
        ],
      ];
  
      const eventsSheetData = [
        [
          "Événement",
          "Date",
          "Présents",
          "Absents",
          "Excusés",
          "Non marqués",
          "Taux de présence",
          "Type",
          "Statut",
        ],
  
        ...eventsAnalytics.map(
          (event) => [
            event.title || "",
  
            event.date
              ? new Date(
                  event.date
                ).toLocaleString(
                  "fr-FR"
                )
              : "",
  
            event.present || 0,
  
            event.absent || 0,
  
            event.excused || 0,
  
            event.notMarked || 0,
  
            `${
              event.attendanceRate ||
              0
            }%`,
  
            event.type || "",
  
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
  
      const eventsSheet =
        XLSX.utils.aoa_to_sheet(
          eventsSheetData
        );
  
      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Résumé"
      );
  
      XLSX.utils.book_append_sheet(
        workbook,
        eventsSheet,
        "Par événement"
      );
  
      XLSX.writeFile(
        workbook,
        "attendance-stats-eldior-management-church.xlsx"
      );
    };
  
    const formatDate = (value) => {
      if (!value) {
        return "—";
      }
  
      const date =
        new Date(value);
  
      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return value;
      }
  
      return new Intl.DateTimeFormat(
        "fr-FR",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ).format(date);
    };
  
    if (
      loading &&
      !analytics
    ) {
      return (
        <Layout>
          <div className="management-page">
            <div className="management-card">
              <div className="management-loading">
                <div className="management-spinner" />
  
                <div>
                  Chargement des
                  statistiques de
                  présence...
                </div>
              </div>
            </div>
          </div>
        </Layout>
      );
    }
  
    return (
      <Layout>
        <div className="management-page">
          <div className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">
                Statistiques de présence
              </h1>
  
              <p className="page-subtitle">
                Analysez les présences,
                les absences et les
                performances de vos
                événements.
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
                onClick={() =>
                  window.print()
                }
              >
                🖨️ Export PDF
              </button>
            </div>
          </div>
  
          <div className="management-card">
            <div className="management-toolbar">
              <div>
                <div className="management-card-title">
                  Période d'analyse
                </div>
  
                <div className="page-subtitle">
                  Sélectionnez la période
                  à analyser.
                </div>
              </div>
  
              <div className="management-filters">
                <select
                  className="management-select"
                  value={period}
                  onChange={(event) =>
                    setPeriod(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    Toute la période
                  </option>
  
                  <option value="week">
                    Cette semaine
                  </option>
  
                  <option value="month">
                    Ce mois
                  </option>
  
                  <option value="year">
                    Cette année
                  </option>
  
                  <option value="custom">
                    Période personnalisée
                  </option>
                </select>
  
                {period ===
                  "custom" && (
                  <>
                    <input
                      className="form-input"
                      type="date"
                      value={
                        customStart
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomStart(
                          event.target
                            .value
                        )
                      }
                      style={{
                        width: "auto",
                      }}
                    />
  
                    <input
                      className="form-input"
                      type="date"
                      value={
                        customEnd
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomEnd(
                          event.target
                            .value
                        )
                      }
                      style={{
                        width: "auto",
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
  
          <div
            className="management-stats-grid"
            style={{
              marginTop: 24,
            }}
          >
            <div className="management-stat-card">
              <div className="management-stat-label">
                Total membres
              </div>
  
              <div className="management-stat-value">
                {overview.totalMembers ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Membres pris en compte
                dans l'analyse
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Présents
              </div>
  
              <div className="management-stat-value">
                {overview.presentCount ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Présences enregistrées
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Absents
              </div>
  
              <div className="management-stat-value">
                {overview.absentCount ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Absences enregistrées
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Excusés
              </div>
  
              <div className="management-stat-value">
                {overview.excusedCount ||
                  0}
              </div>
  
              <div className="management-stat-description">
                Absences justifiées
              </div>
            </div>
          </div>
  
          <div
            className="content-grid"
            style={{
              marginTop: 24,
            }}
          >
            <div className="management-card">
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Répartition globale
                  </h2>
  
                  <p className="page-subtitle">
                    Présents, absents et
                    excusés
                  </p>
                </div>
              </div>
  
              <div
                style={{
                  padding: 20,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <PieChart>
                    <Pie
                      data={
                        globalStatusData
                      }
                      dataKey="value"
                      nameKey="name"
                      outerRadius={95}
                      label
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#dc2626" />
                      <Cell fill="#d97706" />
                    </Pie>
  
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
  
            <div className="management-card">
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Meilleure présence
                  </h2>
  
                  <p className="page-subtitle">
                    Événement avec le
                    meilleur taux de
                    participation
                  </p>
                </div>
              </div>
  
              <div
                style={{
                  padding: 24,
                }}
              >
                {bestAttendanceEvent ? (
                  <>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color:
                          "#111827",
                        marginBottom: 8,
                      }}
                    >
                      {
                        bestAttendanceEvent.title
                      }
                    </div>
  
                    <div
                      style={{
                        fontSize: 38,
                        fontWeight: 800,
                        color:
                          "#4f46e5",
                        marginBottom: 20,
                      }}
                    >
                      {bestAttendanceEvent.attendanceRate ||
                        0}
                      %
                    </div>
                  </>
                ) : (
                  <div className="management-empty">
                    <div className="management-empty-icon">
                      📊
                    </div>
  
                    <h3>
                      Aucune donnée
                    </h3>
  
                    <p>
                      Les statistiques
                      apparaîtront après
                      l'enregistrement
                      des présences.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
  
          <div
            className="management-card"
            style={{
              marginTop: 24,
            }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Présence par événement
                </h2>
  
                <p className="page-subtitle">
                  Comparaison des
                  présents, absents et
                  excusés
                </p>
              </div>
            </div>
  
            <div
              style={{
                padding: 20,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height={360}
              >
                <BarChart
                  data={
                    eventChartData
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />
  
                  <XAxis
                    dataKey="name"
                  />
  
                  <YAxis
                    allowDecimals={
                      false
                    }
                  />
  
                  <Tooltip />
                  <Legend />
  
                  <Bar
                    dataKey="presents"
                    name="Présents"
                    fill="#16a34a"
                  />
  
                  <Bar
                    dataKey="absents"
                    name="Absents"
                    fill="#dc2626"
                  />
  
                  <Bar
                    dataKey="excuses"
                    name="Excusés"
                    fill="#d97706"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          <div
            className="management-card"
            style={{
              marginTop: 24,
            }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Détail par événement
                </h2>
  
                <p className="page-subtitle">
                  Analyse détaillée de
                  toutes les présences
                </p>
              </div>
            </div>
  
            {eventsAnalytics.length >
            0 ? (
              <div className="management-table-wrapper">
                <table className="management-table">
                  <thead>
                    <tr>
                      <th>
                        Événement
                      </th>
                      <th>
                        Date
                      </th>
                      <th>
                        Présents
                      </th>
                      <th>
                        Absents
                      </th>
                      <th>
                        Excusés
                      </th>
                      <th>
                        Non marqués
                      </th>
                      <th>
                        Taux
                      </th>
                    </tr>
                  </thead>
  
                  <tbody>
                    {eventsAnalytics.map(
                      (event) => (
                        <tr
                          key={
                            event.eventId
                          }
                        >
                          <td>
                            {
                              event.title ||
                              "Événement"
                            }
                          </td>
  
                          <td>
                            {formatDate(
                              event.date
                            )}
                          </td>
  
                          <td>
                            {event.present ||
                              0}
                          </td>
  
                          <td>
                            {event.absent ||
                              0}
                          </td>
  
                          <td>
                            {event.excused ||
                              0}
                          </td>
  
                          <td>
                            {event.notMarked ||
                              0}
                          </td>
  
                          <td>
                            <strong>
                              {event.attendanceRate ||
                                0}
                              %
                            </strong>
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
                  📈
                </div>
  
                <h3>
                  Aucune statistique
                  disponible
                </h3>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }