
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import Layout from "../components/Layout";
import "../styles/ManagementPages.css";
import API from "../api/axios";

const COLORS = { blue: "#2554f4", green: "#16a34a", purple: "#8736ef", red: "#dc2626", orange: "#ea8b10" };
const dateISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monthName = (d) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(d);
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
};
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const box = { background: "#fff", border: "1px solid #e1e7f5", borderRadius: 17, boxShadow: "0 4px 15px rgba(20,39,100,.045)" };

function getRange(mode, anchor, customStart, customEnd) {
  const y = anchor.getFullYear(), m = anchor.getMonth();
  if (mode === "week") {
    const start = new Date(y, m, anchor.getDate() - ((anchor.getDay() + 6) % 7));
    return [dateISO(start), dateISO(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))];
  }
  if (mode === "month") return [dateISO(new Date(y, m, 1)), dateISO(new Date(y, m + 1, 0))];
  if (mode === "quarter") {
    const startMonth = Math.floor(m / 3) * 3;
    return [dateISO(new Date(y, startMonth, 1)), dateISO(new Date(y, startMonth + 3, 0))];
  }
  if (mode === "year") return [`${y}-01-01`, `${y}-12-31`];
  if (mode === "custom") return [customStart, customEnd];
  return ["", ""];
}

export default function AttendanceStats() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("month");
  const [anchorMonth, setAnchorMonth] = useState(dateISO(new Date()).slice(0, 7));
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const anchor = useMemo(() => {
    const [y, m] = anchorMonth.split("-").map(Number);
    return new Date(y, m - 1, 15);
  }, [anchorMonth]);
  const range = useMemo(() => getRange(mode, anchor, customStart, customEnd), [mode, anchor, customStart, customEnd]);
  const validRange = mode !== "custom" || (Boolean(customStart && customEnd) && customStart <= customEnd);

  useEffect(() => {
    if (!validRange) { setLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (mode === "all") params.set("period", "all");
        else {
          params.set("period", "custom");
          params.set("startDate", range[0]);
          params.set("endDate", range[1]);
        }
        const response = await API.get(`/attendances/analytics/global?${params.toString()}`, { signal: controller.signal });
        if (active) setAnalytics(response.data?.data ?? null);
      } catch (e) {
        if (active) { setError("Impossible de charger les statistiques. Vérifie la connexion et réessaie."); setAnalytics(null); }
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [mode, range, validRange]);

  const overview = analytics?.overview ?? {};
  const events = Array.isArray(analytics?.eventsAnalytics) ? analytics.eventsAnalytics : [];
  const best = analytics?.bestAttendanceEvent;
  const chart = useMemo(() => [...events].sort((a, b) => new Date(a.date) - new Date(b.date)).map((event, i) => ({
    id: event.eventId || `${event.date}-${i}`,
    date: formatDate(event.date),
    title: event.title || "Événement",
    presents: number(event.present),
    absents: number(event.absent),
    excuses: number(event.excused),
    unmarked: number(event.notMarked),
    rate: number(event.attendanceRate),
  })), [events]);
  const distribution = [
    { name: "Présents", value: number(overview.presentCount), color: COLORS.green },
    { name: "Absents", value: number(overview.absentCount), color: COLORS.red },
    { name: "Excusés", value: number(overview.excusedCount), color: COLORS.orange },
  ];
  const hasDistribution = distribution.some((entry) => entry.value > 0);
  const mean = chart.length ? chart.reduce((sum, item) => sum + item.presents, 0) / chart.length : 0;
  const latest = chart.at(-1);
  const previous = chart.at(-2);
  const change = latest && previous && previous.presents > 0 ? ((latest.presents - previous.presents) / previous.presents) * 100 : null;
  const subtitle = mode === "all" ? "Toutes les périodes" : mode === "custom" ? `${range[0] || "…"} au ${range[1] || "…"}` : monthName(anchor);

  function exportExcel() {
    if (!analytics) return;
    const workbook = XLSX.utils.book_new();
    const summary = XLSX.utils.aoa_to_sheet([
      ["ELDIOR MANAGEMENT CHURCH — STATISTIQUES DE PRÉSENCE"],
      ["Période", subtitle], ["Début", range[0]], ["Fin", range[1]], [],
      ["Total membres", number(overview.totalMembers)],
      ["Présences enregistrées", number(overview.presentCount)],
      ["Absences explicites", number(overview.absentCount)],
      ["Excusés", number(overview.excusedCount)],
      ["Moyenne des présents par événement", mean],
      [], ["Meilleur événement", best?.title || ""], ["Taux", best?.attendanceRate ?? ""],
    ]);
    const details = XLSX.utils.aoa_to_sheet([
      ["Événement", "Date", "Présents", "Absents", "Excusés", "Non marqués", "Taux (%)"],
      ...chart.map((e) => [e.title, e.date, e.presents, e.absents, e.excuses, e.unmarked, e.rate]),
    ]);
    XLSX.utils.book_append_sheet(workbook, summary, "Résumé");
    XLSX.utils.book_append_sheet(workbook, details, "Par événement");
    XLSX.writeFile(workbook, `eldior-presences-${anchorMonth}.xlsx`);
  }

  const tabs = [
    ["week", "Culte (hebdomadaire)"], ["month", "Bilan mensuel"],
    ["quarter", "Bilan trimestriel"], ["year", "Bilan annuel"],
  ];
  const statCards = [
    ["Présents (dernier événement)", latest?.presents ?? "—", change === null ? "Pas de comparaison disponible" : `${change > 0 ? "+" : ""}${change.toFixed(1)} % vs précédent`, COLORS.blue],
    ["Moyenne par événement", chart.length ? mean.toFixed(1).replace(".", ",") : "—", `${chart.length} événement(s) analysé(s)`, COLORS.green],

    ["Absences explicites", number(overview.absentCount), "Non marqués exclus", COLORS.red],
    ["Excusés", number(overview.excusedCount), "Absences justifiées", COLORS.orange],
    ["Événements analysés", chart.length, subtitle, COLORS.purple],
  ];

  return (
    <Layout>
      <div className="management-page" style={{ paddingBottom: 40 }}>
        <div className="page-header" style={{ alignItems: "flex-start", gap: 16 }}>
          <div className="page-header-left">
            <h1 className="page-title">Analyse des présences et accompagnement pastoral</h1>
            <p className="page-subtitle">Suivi des cultes, évolution des présences et bilans périodiques.</p>
          </div>
          <div className="page-header-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-success" onClick={exportExcel} disabled={!analytics || loading}>📊 Export Excel</button>
            <button type="button" className="btn btn-secondary" onClick={() => window.print()}>🖨️ Export PDF</button>
          </div>
        </div>

        <section style={{ ...box, padding: 16, marginTop: 20, marginBottom: 20 }} aria-label="Période d'analyse">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tabs.map(([value, label]) => (
                <button key={value} type="button" onClick={() => setMode(value)} aria-pressed={mode === value}
                  style={{ border: "1px solid #dedcff", borderRadius: 10, padding: "11px 14px", cursor: "pointer", fontWeight: 700, background: mode === value ? "#5334ed" : "#f7f8ff", color: mode === value ? "#fff" : "#171c60" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <label htmlFor="eldior-month" style={{ fontWeight: 600 }}>Période</label>
              <input id="eldior-month" type="month" className="form-input" value={anchorMonth} onChange={(e) => setAnchorMonth(e.target.value)} style={{ width: "auto" }} />
              <select className="management-select" aria-label="Autre période" value={mode === "all" || mode === "custom" ? mode : "selection"} onChange={(e) => setMode(e.target.value)}>
                <option value="selection" disabled>Options</option>
                <option value="all">Toute la période</option>
                <option value="custom">Dates personnalisées</option>
              </select>
            </div>
          </div>
          {mode === "custom" && <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <label>Du <input type="date" className="form-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /></label>
            <label>Au <input type="date" className="form-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></label>
          </div>}
          <p className="page-subtitle" style={{ marginTop: 10 }}>Période affichée : {subtitle}</p>
          {!validRange && <p role="alert" style={{ color: COLORS.red }}>Sélectionne une date de début et une date de fin valides.</p>}
        </section>

        {error && <div role="alert" style={{ ...box, padding: 16, color: COLORS.red, marginBottom: 16 }}>{error}</div>}
        {loading && <p role="status" style={{ marginBottom: 12 }}>Actualisation des statistiques…</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 12 }}>
          {statCards.map(([label, value, description, color]) => <div key={label} style={{ ...box, padding: 18, borderTop: `4px solid ${color}` }}>
            <div style={{ color: "#303d6b", fontSize: 13, fontWeight: 700, minHeight: 36 }}>{label}</div>
            <div style={{ color: "#0d1755", fontSize: 34, fontWeight: 800, margin: "8px 0" }}>{value}</div>
            <div style={{ color: "#697a9d", fontSize: 12 }}>{description}</div>
          </div>)}
        </div>

        <section style={{ ...box, marginTop: 18, padding: 20 }}>
          <h2 className="management-card-title">Évolution des présences — {subtitle}</h2>
          <p className="page-subtitle">Comparaison des présences, absences explicites et excusés par événement.</p>
          {chart.length ? <div style={{ width: "100%", height: 330, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 10, right: 24, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e9f4" />
                <XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                <Line type="monotone" dataKey="presents" name="Présents" stroke={COLORS.blue} strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="absents" name="Absents" stroke={COLORS.red} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="excuses" name="Excusés" stroke={COLORS.orange} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div> : <p style={{ padding: 24 }}>Aucun événement avec des données pour cette période.</p>}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 18 }}>
          <section style={{ ...box, padding: 20 }}>
            <h2 className="management-card-title">Répartition globale</h2>
            <p className="page-subtitle">Présents, absents et excusés enregistrés.</p>
            {hasDistribution ? <div style={{ height: 270 }}><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={distribution} dataKey="value" nameKey="name" outerRadius={85} label>
                {distribution.map((item) => <Cell key={item.name} fill={item.color} />)}
              </Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer></div> : <p style={{ padding: 24 }}>Aucune présence enregistrée sur la période.</p>}
          </section>
          <section style={{ ...box, padding: 20 }}>
            <h2 className="management-card-title">Meilleure participation</h2>
            {best ? <><p style={{ marginTop: 18, fontSize: 22, fontWeight: 800 }}>{best.title || "Événement"}</p>
              <div style={{ fontSize: 42, fontWeight: 800, color: "#5334ed", marginTop: 8 }}>{number(best.attendanceRate).toFixed(2)} %</div>
              <p className="page-subtitle">Taux de présence calculé par l'API.</p></> : <p style={{ padding: 24 }}>Aucune donnée disponible.</p>}
            <div style={{ marginTop: 20, padding: 14, background: "#f4f6ff", borderRadius: 12 }}>
              <strong>Membres pris en compte : {number(overview.totalMembers)}</strong>
              <p className="page-subtitle">Les membres non marqués ne sont pas comptés comme absents.</p>
            </div>
          </section>
        </div>

        <section style={{ ...box, padding: 20, marginTop: 18 }}>
          <h2 className="management-card-title">Présences par événement</h2>
          {chart.length ? <div style={{ width: "100%", height: 300, marginTop: 16 }}><ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              <Bar dataKey="presents" name="Présents" fill={COLORS.green} />
              <Bar dataKey="absents" name="Absents" fill={COLORS.red} />
              <Bar dataKey="excuses" name="Excusés" fill={COLORS.orange} />
            </BarChart>
          </ResponsiveContainer></div> : <p>Aucun événement à afficher.</p>}
        </section>

        <section style={{ ...box, marginTop: 18, overflow: "hidden" }}>
          <div style={{ padding: 20 }}><h2 className="management-card-title">Détail par événement</h2>
            <p className="page-subtitle">Données réelles enregistrées dans l'application.</p></div>
          {chart.length ? <div className="management-table-wrapper"><table className="management-table">
            <thead><tr><th>Événement</th><th>Date</th><th>Présents</th><th>Absents</th><th>Excusés</th><th>Non marqués</th><th>Taux</th></tr></thead>
            <tbody>{chart.map((e) => <tr key={e.id}><td>{e.title}</td><td>{e.date}</td><td>{e.presents}</td><td>{e.absents}</td><td>{e.excuses}</td><td>{e.unmarked}</td><td><strong>{e.rate} %</strong></td></tr>)}</tbody>
          </table></div> : <p style={{ padding: 20 }}>Aucune statistique disponible.</p>}
        </section>

        <section style={{ ...box, marginTop: 18, padding: 20, borderLeft: "4px solid #5334ed" }}>
          <h2 className="management-card-title">Suivi pastoral et alertes mensuelles</h2>
          <p className="page-subtitle" style={{ marginTop: 8 }}>
            Le tableau nominatif des membres et les alertes pastorales nécessitent les données individuelles et les routes dédiées du backend.
            Cette page n'invente pas de membres ni d'alertes. Les absences non marquées restent distinctes des absences explicites.
          </p>
        </section>
      </div>
    </Layout>
  );
}
