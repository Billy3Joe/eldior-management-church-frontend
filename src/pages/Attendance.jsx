import { useEffect, useState } from "react";
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
import API from "../api/axios";

export default function AttendanceStats() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchAnalytics = async (selectedPeriod = period) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (selectedPeriod) {
        query.append("period", selectedPeriod);
      }

      if (selectedPeriod === "custom" && customStart && customEnd) {
        query.append("startDate", customStart);
        query.append("endDate", customEnd);
      }

      const res = await API.get(
        `/attendances/analytics/global?${query.toString()}`
      );

      setAnalytics(res.data.data || null);
    } catch (err) {
      console.error("Erreur analytics attendance :", err);
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
    } else if (customStart && customEnd) {
      fetchAnalytics(period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStart, customEnd]);

  const overview = analytics?.overview || {};
  const bestAttendanceEvent = analytics?.bestAttendanceEvent || null;
  const eventsAnalytics = analytics?.eventsAnalytics || [];

  const globalStatusData = [
    { name: "Présents", value: overview.presentCount || 0 },
    { name: "Absents", value: overview.absentCount || 0 },
    { name: "Excusés", value: overview.excusedCount || 0 },
  ];

  const eventChartData = eventsAnalytics.map((event) => ({
    name: event.title || "Événement",
    presents: event.present || 0,
    absents: event.absent || 0,
    excuses: event.excused || 0,
    taux: event.attendanceRate || 0,
  }));

  const handleExportExcel = () => {
    const summarySheetData = [
      ["STATISTIQUES AVANCÉES DE PRÉSENCE"],
      [],
      ["Période sélectionnée", analytics?.period || period],
      ["Date début", analytics?.startDate || customStart || ""],
      ["Date fin", analytics?.endDate || customEnd || ""],
      [],
      ["Résumé global"],
      ["Total membres", overview.totalMembers || 0],
      ["Présents", overview.presentCount || 0],
      ["Absents", overview.absentCount || 0],
      ["Excusés", overview.excusedCount || 0],
      ["Total présences", overview.totalAttendances || 0],
      [],
      ["Meilleur événement"],
      ["Titre", bestAttendanceEvent?.title || ""],
      ["Taux de présence", `${bestAttendanceEvent?.attendanceRate || 0}%`],
      ["Présents", bestAttendanceEvent?.present || 0],
      ["Absents", bestAttendanceEvent?.absent || 0],
      ["Excusés", bestAttendanceEvent?.excused || 0],
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
      ...eventsAnalytics.map((event) => [
        event.title || "",
        event.date ? new Date(event.date).toLocaleString() : "",
        event.present || 0,
        event.absent || 0,
        event.excused || 0,
        event.notMarked || 0,
        `${event.attendanceRate || 0}%`,
        event.type || "",
        event.status || "",
      ]),
    ];

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
    const eventsSheet = XLSX.utils.aoa_to_sheet(eventsSheetData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Résumé");
    XLSX.utils.book_append_sheet(workbook, eventsSheet, "Par événement");

    XLSX.writeFile(workbook, "attendance-stats-eldior-management-church.xlsx");
  };

  if (loading) {
    return (
      <Layout>
        <div className="card">Chargement des statistiques de présence...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Statistiques avancées de présence</h2>
          <p style={{ color: "#6b7280", marginTop: 6 }}>
            Analyse globale des présences par événement
          </p>
        </div>

        <div className="export-actions">
          <button
            type="button"
            className="export-btn excel-btn"
            onClick={handleExportExcel}
          >
            Export Excel
          </button>

          <button
            type="button"
            className="print-btn"
            onClick={() => window.print()}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters-panel">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">Toute la période</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="custom">Période personnalisée</option>
          </select>

          {period === "custom" && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      <div className="cards-grid section-gap">
        <div className="stat-card">
          <h3>Total membres</h3>
          <p>{overview.totalMembers || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Présents</h3>
          <p>{overview.presentCount || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Absents</h3>
          <p>{overview.absentCount || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Excusés</h3>
          <p>{overview.excusedCount || 0}</p>
        </div>
      </div>

      <div className="content-grid section-gap">
        <div className="card chart-card">
          <h2>Répartition globale des statuts</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={globalStatusData}
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

        <div className="card">
          <h2>Événement avec la meilleure présence</h2>
          {bestAttendanceEvent ? (
            <div className="detail-box" style={{ marginTop: 12 }}>
              <strong>{bestAttendanceEvent.title}</strong>
              <span>
                Taux de présence : {bestAttendanceEvent.attendanceRate}%
              </span>
              <span>
                Présents : {bestAttendanceEvent.present} | Absents :{" "}
                {bestAttendanceEvent.absent} | Excusés :{" "}
                {bestAttendanceEvent.excused}
              </span>
            </div>
          ) : (
            <p>Aucune donnée disponible.</p>
          )}
        </div>
      </div>

      <div className="card section-gap chart-card">
        <h2>Présence par événement</h2>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={eventChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="presents" fill="#16a34a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absents" fill="#dc2626" radius={[6, 6, 0, 0]} />
              <Bar dataKey="excuses" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card section-gap chart-card">
        <h2>Taux de présence par événement</h2>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={eventChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="taux" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card section-gap">
        <h2>Détail par événement</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Événement</th>
                <th>Date</th>
                <th>Présents</th>
                <th>Absents</th>
                <th>Excusés</th>
                <th>Non marqués</th>
                <th>Taux de présence</th>
              </tr>
            </thead>
            <tbody>
              {eventsAnalytics.length > 0 ? (
                eventsAnalytics.map((event) => (
                  <tr key={event.eventId}>
                    <td>{event.title}</td>
                    <td>
                      {event.date ? new Date(event.date).toLocaleString() : "-"}
                    </td>
                    <td>{event.present}</td>
                    <td>{event.absent}</td>
                    <td>{event.excused}</td>
                    <td>{event.notMarked}</td>
                    <td>{event.attendanceRate}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">Aucune statistique disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}