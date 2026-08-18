import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { toast } from "react-toastify";

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
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [filters, setFilters] = useState({
    event: "",
    department: "",
    status: "",
  });

  // =========================
  // CHARGEMENT
  // =========================

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
      console.error(error);

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
      console.error(error);

      toast.error(
        "Impossible de charger les données nécessaires"
      );
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);

      await Promise.all([
        fetchAssignments(),
        fetchOptions(),
      ]);

      setLoading(false);
    };

    loadPage();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // FORMULAIRE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Quand on choisit un membre,
  // sélectionner automatiquement son département
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
      toast.warning("Sélectionne un membre");
      return;
    }

    if (!form.event) {
      toast.warning("Sélectionne un événement");
      return;
    }

    if (!form.role.trim()) {
      toast.warning("Indique le rôle ou le poste");
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

      await API.post("/assignments", payload);

      toast.success("Programmation créée avec succès");

      setForm(initialForm);
      setShowForm(false);

      await fetchAssignments();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Impossible de créer la programmation"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // STATUT
  // =========================

  const confirmAssignment = async (id) => {
    try {
      await API.put(`/assignments/${id}/confirm`);

      toast.success("Participation confirmée");

      await fetchAssignments(filters);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Impossible de confirmer"
      );
    }
  };

  const declineAssignment = async (id) => {
    try {
      await API.put(`/assignments/${id}/decline`);

      toast.success("Participation refusée");

      await fetchAssignments(filters);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Impossible de modifier la programmation"
      );
    }
  };

  // =========================
  // SUPPRESSION
  // =========================

  const deleteAssignment = async (assignment) => {
    const memberName = `${
      assignment.member?.firstName || ""
    } ${assignment.member?.lastName || ""}`.trim();

    const confirmed = window.confirm(
      `Supprimer la programmation de ${memberName} ?`
    );

    if (!confirmed) return;

    try {
      await API.delete(
        `/assignments/${assignment._id}`
      );

      toast.success("Programmation supprimée");

      await fetchAssignments(filters);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer la programmation"
      );
    }
  };

  // =========================
  // FILTRES
  // =========================

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

  // =========================
  // FORMAT
  // =========================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
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

  // =========================
  // STATISTIQUES
  // =========================

  const total = assignments.length;

  const confirmed = assignments.filter(
    (item) => item.status === "confirmed"
  ).length;

  const pending = assignments.filter(
    (item) => item.status === "pending"
  ).length;

  const declined = assignments.filter(
    (item) => item.status === "declined"
  ).length;

  return (
    <Layout>
      {/* HEADER */}

      <div className="section-header">
        <div>
          <h2>Programmations</h2>

          <p className="page-subtitle">
            Organisez les équipes et suivez les confirmations.
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

      {/* STATS */}

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

      {/* FORMULAIRE */}

      {showForm && (
        <div className="card section-gap">
          <div className="section-header">
            <div>
              <h2>Nouvelle programmation</h2>

              <p className="page-subtitle">
                Sélectionnez la personne et son
                affectation.
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
                    {member.firstName}{" "}
                    {member.lastName}
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
                    {event.title} —{" "}
                    {formatDate(event.date)}
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
                placeholder="Ex : Accueil - Entrée principale"
                required
              />
            </div>

            <div className="form-group assignment-note">
              <label>Consignes</label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Ex : Arriver 30 minutes avant..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
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

      {/* FILTRES */}

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

      {/* LISTE */}

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
          <p className="assignment-empty">
            Chargement...
          </p>
        ) : assignments.length === 0 ? (
          <div className="assignment-empty">
            <h3>Aucune programmation</h3>

            <p>
              Commencez par programmer une personne
              sur un événement.
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
                  <th>Statut</th>
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
                      {assignment.department?.name ||
                        "-"}
                    </td>

                    <td>{assignment.role}</td>

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
                    </td>

                    <td>
                      <div className="assignment-actions">
                        {assignment.status !==
                          "confirmed" && (
                          <button
                            type="button"
                            className="small-btn"
                            onClick={() =>
                              confirmAssignment(
                                assignment._id
                              )
                            }
                          >
                            Confirmer
                          </button>
                        )}

                        {assignment.status !==
                          "declined" && (
                          <button
                            type="button"
                            className="secondary-btn small-btn"
                            onClick={() =>
                              declineAssignment(
                                assignment._id
                              )
                            }
                          >
                            Refuser
                          </button>
                        )}

                        <button
                          type="button"
                          className="danger-btn small-btn"
                          onClick={() =>
                            deleteAssignment(
                              assignment
                            )
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