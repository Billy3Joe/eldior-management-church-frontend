import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";
import Layout from "../components/Layout";

export default function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [membersAttendance, setMembersAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);

      const [eventRes, summaryRes, membersRes] = await Promise.all([
        API.get(`/events/${id}`),
        API.get(`/attendances/event/${id}/summary`),
        API.get(`/attendances/event/${id}/members`),
      ]);

      setEvent(eventRes.data.data || null);
      setSummary(summaryRes.data.data || null);
      setMembersAttendance(membersRes.data.data || []);
    } catch (err) {
      console.error("Erreur fetch event details :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const getStatusClass = (status) => {
    if (status === "Présent") return "status-badge status-present";
    if (status === "Absent") return "status-badge status-absent";
    if (status === "Excusé") return "status-badge status-excused";
    return "status-badge status-pending";
  };

  if (loading) {
    return (
      <Layout>
        <div className="card">Chargement des détails de l’événement...</div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="card">Événement introuvable.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="card">
        <div className="section-header">
          <div>
            <h2>{event.title}</h2>
            <p style={{ color: "#6b7280", marginTop: 6 }}>
              Détails de l’événement
            </p>
          </div>

          <Link to={`/attendance?eventId=${event._id}`} className="link-button">
            Ouvrir le pointage
          </Link>
        </div>

        <div className="details-grid">
          <div className="detail-box">
            <strong>Type</strong>
            <span>{event.type || "-"}</span>
          </div>

          <div className="detail-box">
            <strong>Date</strong>
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="detail-box">
            <strong>Lieu</strong>
            <span>{event.location || "-"}</span>
          </div>

          <div className="detail-box">
            <strong>Responsable</strong>
            <span>{event.leader || "-"}</span>
          </div>

          <div className="detail-box">
            <strong>Statut</strong>
            <span>{event.status || "-"}</span>
          </div>

          <div className="detail-box detail-box-full">
            <strong>Description</strong>
            <span>{event.description || "-"}</span>
          </div>
        </div>
      </div>

      {summary && (
        <div className="cards-grid section-gap">
          <div className="stat-card">
            <h3>Total membres</h3>
            <p>{summary.totalMembers || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Présents</h3>
            <p>{summary.present || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Absents</h3>
            <p>{summary.absent || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Excusés</h3>
            <p>{summary.excused || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Non marqués</h3>
            <p>{summary.notMarked || 0}</p>
          </div>
        </div>
      )}

      <div className="card section-gap">
        <h2>Présences des membres</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Département</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {membersAttendance.length ? (
                membersAttendance.map((item) => (
                  <tr key={item.member._id}>
                    <td>
                      {item.member.firstName} {item.member.lastName}
                    </td>
                    <td>{item.member.department?.name || "-"}</td>
                    <td>
                      <span className={getStatusClass(item.status)}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">Aucune donnée de présence</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}