import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import API from "../api/axios";

const initialForm = {
  member: "",
  event: "",
  department: "",
  role: "",
  note: "",
};

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [filters, setFilters] = useState({
    event: "",
    department: "",
    status: "",
  });

  const fetchAssignments = async (customFilters = filters) => {
    try {
      const params = new URLSearchParams();

      if (customFilters.event) {
        params.append("event", customFilters.event);
      }

      if (customFilters.department) {
        params.append("department", customFilters.department);
      }

      if (customFilters.status) {
        params.append("status", customFilters.status);
      }

      params.append("limit", "100");

      const res = await API.get(
        `/assignments?${params.toString()}`
      );

      setAssignments(res.data.data || []);
    } catch (error) {
      console.error(
        "Erreur chargement programmations :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de charger les programmations"
      );
    }
  };

  const fetchOptions = async () => {
    try {
      const [membersRes, eventsRes, departmentsRes] =
        await Promise.all([
          API.get("/members?limit=100"),
          API.get("/events?limit=100"),
          API.get("/departments?limit=100"),
        ]);

      setMembers(membersRes.data.data || []);
      setEvents(eventsRes.data.data || []);
      setDepartments(departmentsRes.data.data || []);
    } catch (error) {
      console.error(
        "Erreur chargement options :",
        error
      );

      toast.error(
        "Impossible de charger les membres, événements ou départements"
      );
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchAssignments(),
          fetchOptions(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPage();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMemberChange = (e) => {
    const memberId = e.target.value;

    const selectedMember = members.find(
      (member) => member._id === memberId
    );

    setForm((prev) => ({
      ...prev,
      member: memberId,
      department:
        selectedMember?.department?._id ||
        selectedMember?.department ||
        "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.member) {
      toast.warning("Sélectionnez un membre");
      return;
    }

    if (!form.event) {
      toast.warning("Sélectionnez un événement");
      return;
    }

    if (!form.role.trim()) {
      toast.warning("Indiquez le rôle ou le poste");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        member: form.member,
        event: form.event,
        role: form.role.trim(),
        note: form.note.trim(),
      };

      if (form.department) {
        payload.department = form.department;
      }

      const res = await API.post(
        "/assignments",
        payload
      );

      const emailStatus =
        res.data?.data?.emailStatus || "not_sent";

      if (emailStatus === "sent") {
        toast.success(
          "Programmation créée et email envoyé"
        );
      } else if (emailStatus === "failed") {
        toast.warning(
          "Programmation créée mais l'email a échoué"
        );
      } else {
        toast.success("Programmation créée");
      }

      setForm(initialForm);
      setShowForm(false);

      await fetchAssignments(filters);
    } catch (error) {
      console.error(
        "Erreur création programmation :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de créer la programmation"
      );
    } finally {
      setSaving(false);
    }
  };

  const resendEmail = async (assignment) => {
    try {
      setResendingId(assignment._id);

      const res = await API.post(
        `/assignments/${assignment._id}/resend-email`
      );

      toast.success(
        res.data?.message ||
          "Email renvoyé avec succès"
      );

      await fetchAssignments(filters);
    } catch (error) {
      console.error(
        "Erreur renvoi email :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de renvoyer l'email"
      );
    } finally {
      setResendingId(null);
    }
  };

  const deleteAssignment = async (assignment) => {
    const memberName = `${
      assignment.member?.firstName || ""
    } ${assignment.member?.lastName || ""}`.trim();

    const confirmed = window.confirm(
      `Supprimer la programmation de ${
        memberName || "ce membre"
      } ?`
    );

    if (!confirmed) return;

    try {
      await API.delete(
        `/assignments/${assignment._id}`
      );

      toast.success("Programmation supprimée");

      await fetchAssignments(filters);
    } catch (error) {
      console.error(
        "Erreur suppression programmation :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer la programmation"
      );
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    const newFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(newFilters);
    fetchAssignments(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      event: "",
      department: "",
      status: "",
    };

    setFilters(emptyFilters);
    fetchAssignments(emptyFilters);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "declined":
        return "Refusé";
      case "cancelled":
        return "Annulé";
      default:
        return "En attente";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "confirmed":
        return "assignment-status confirmed";
      case "declined":
        return "assignment-status declined";
      case "cancelled":
        return "assignment-status cancelled";
      default:
        return "assignment-status pending";
    }
  };

  const getEmailLabel = (status) => {
    switch (status) {
      case "sent":
        return "Email envoyé";
      case "failed":
        return "Échec email";
      default:
        return "Non envoyé";
    }
  };

  const getEmailClass = (status) => {
    switch (status) {
      case "sent":
        return "assignment-status confirmed";
      case "failed":
        return "assignment-status declined";
      default:
        return "assignment-status pending";
    }
  };

  const total = assignments.length;

  const pending = assignments.filter(
    (item) => item.status === "pending"
  ).length;

  const confirmed = assignments.filter(
    (item) => item.status === "confirmed"
  ).length;

  const declined = assignments.filter(
    (item) => item.status === "declined"
  ).length;

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Programmations</h2>

          <p className="page-subtitle">
            Organisez les équipes, envoyez les invitations
            et suivez les réponses des membres.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowForm((prev) => !prev)
          }
        >
          {showForm
            ? "Fermer"
            : "+ Nouvelle programmation"}
        </button>
      </div>

      <div className="assignment-stats">
        <div className="card assignment-stat">
          <span>Total</span>
          <strong>{total}</strong>
        </div>

        <div className="card assignment-stat">
          <span>En attente</span>
          <strong>{pending}</strong>
        </div>

        <div className="card assignment-stat">
          <span>Confirmées</span>
          <strong>{confirmed}</strong>
        </div>

        <div className="card assignment-stat">
          <span>Refusées</span>
          <strong>{declined}</strong>
        </div>
      </div>

      {showForm && (
        <div className="card section-gap">
          <div className="section-header">
            <div>
              <h2>Nouvelle programmation</h2>

              <p className="page-subtitle">
                Le membre reçoit automatiquement un email
                s’il possède une adresse email.
              </p>
            </div>
          </div>

          <form
            className="assignment-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label>Membre *</label>

              <select
                name="member"
                value={form.member}
                onChange={handleMemberChange}
                required
              >
                <option value="">
                  Sélectionner un membre
                </option>

                {members.map((member) => (
                  <option
                    key={member._id}
                    value={member._id}
                  >
                    {member.firstName} {member.lastName}
                    {member.email
                      ? ` — ${member.email}`
                      : " — sans email"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Événement *</label>

              <select
                name="event"
                value={form.event}
                onChange={handleChange}
                required
              >
                <option value="">
                  Sélectionner un événement
                </option>

                {events.map((event) => (
                  <option
                    key={event._id}
                    value={event._id}
                  >
                    {event.title} — {formatDate(event.date)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Département</label>

              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="">
                  Aucun département
                </option>

                {departments.map((department) => (
                  <option
                    key={department._id}
                    value={department._id}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Rôle / Poste *</label>

              <input
                type="text"
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="Ex : Alto, Accueil, Piano..."
                required
              />
            </div>

            <div className="form-group assignment-note">
              <label>Consignes</label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows="3"
                placeholder="Ex : Arriver 30 minutes avant..."
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Programmation..."
                  : "Programmer"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowForm(false);
                  setForm(initialForm);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card section-gap">
        <div className="filters-panel">
          <select
            name="event"
            value={filters.event}
            onChange={handleFilterChange}
          >
            <option value="">
              Tous les événements
            </option>

            {events.map((event) => (
              <option
                key={event._id}
                value={event._id}
              >
                {event.title}
              </option>
            ))}
          </select>

          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
          >
            <option value="">
              Tous les départements
            </option>

            {departments.map((department) => (
              <option
                key={department._id}
                value={department._id}
              >
                {department.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">
              Tous les statuts
            </option>

            <option value="pending">
              En attente
            </option>

            <option value="confirmed">
              Confirmé
            </option>

            <option value="declined">
              Refusé
            </option>

            <option value="cancelled">
              Annulé
            </option>
          </select>

          <button
            type="button"
            className="secondary-btn"
            onClick={resetFilters}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="card section-gap">
        <div className="section-header">
          <div>
            <h2>Équipe programmée</h2>

            <span className="results-count">
              {assignments.length} programmation(s)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="assignment-empty">
            Chargement...
          </div>
        ) : assignments.length === 0 ? (
          <div className="assignment-empty">
            <h3>Aucune programmation</h3>

            <p>
              Commencez par programmer une personne.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Événement</th>
                  <th>Date</th>
                  <th>Département</th>
                  <th>Poste</th>
                  <th>Notification</th>
                  <th>Réponse</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td>
                      <strong>
                        {assignment.member?.firstName}{" "}
                        {assignment.member?.lastName}
                      </strong>

                      {assignment.member?.email && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            color: "#6b7280",
                          }}
                        >
                          {assignment.member.email}
                        </div>
                      )}
                    </td>

                    <td>
                      {assignment.event?.title || "-"}
                    </td>

                    <td>
                      {formatDate(
                        assignment.event?.date
                      )}
                    </td>

                    <td>
                      {assignment.department?.name || "-"}
                    </td>

                    <td>
                      {assignment.role}
                    </td>

                    <td>
                      <span
                        className={getEmailClass(
                          assignment.emailStatus
                        )}
                      >
                        {getEmailLabel(
                          assignment.emailStatus
                        )}
                      </span>

                      <div
                        style={{
                          marginTop: 7,
                          fontSize: 12,
                          color: "#6b7280",
                          lineHeight: 1.5,
                        }}
                      >
                        <div>
                          Envois :{" "}
                          <strong>
                            {assignment.emailSendCount || 0}
                          </strong>
                        </div>

                        {assignment.firstEmailSentAt && (
                          <div>
                            Premier :{" "}
                            {formatDate(
                              assignment.firstEmailSentAt
                            )}
                          </div>
                        )}

                        {assignment.emailSentAt && (
                          <div>
                            Dernier :{" "}
                            {formatDate(
                              assignment.emailSentAt
                            )}
                          </div>
                        )}

                        {assignment.reminderCount > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop:
                                "1px solid #e5e7eb",
                            }}
                          >
                            🔔 Rappels :{" "}
                            <strong>
                              {assignment.reminderCount}
                            </strong>

                            {assignment.lastReminderAt && (
                              <div>
                                Dernier rappel :{" "}
                                {formatDate(
                                  assignment.lastReminderAt
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          assignment.status
                        )}
                      >
                        {getStatusLabel(
                          assignment.status
                        )}
                      </span>

                      {assignment.status === "pending" && (
                        <div className="waiting-response">
                          En attente du membre
                        </div>
                      )}

                      {assignment.status === "confirmed" && (
                        <div className="confirmed-response">
                          Confirmé par le membre

                          {assignment.confirmedAt && (
                            <>
                              <br />
                              {formatDate(
                                assignment.confirmedAt
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {assignment.status === "declined" && (
                        <div className="declined-response">
                          Indisponible

                          {assignment.declinedAt && (
                            <>
                              <br />
                              {formatDate(
                                assignment.declinedAt
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="assignment-actions">
                        <button
                          type="button"
                          className="secondary-btn small-btn"
                          disabled={
                            resendingId === assignment._id
                          }
                          onClick={() =>
                            resendEmail(assignment)
                          }
                        >
                          {resendingId === assignment._id
                            ? "Envoi..."
                            : "Renvoyer l'email"}
                        </button>

                        <button
                          type="button"
                          className="danger-btn small-btn"
                          onClick={() =>
                            deleteAssignment(assignment)
                          }
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}