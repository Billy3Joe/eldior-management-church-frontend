import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import Layout from "../components/Layout";
import "../styles/ManagementPages.css";

import API from "../api/axios";

const initialForm = {
  member: "",
  event: "",
  department: "",
  role: "",
  note: "",
};

export default function Assignments() {
  const [assignments, setAssignments] =
    useState([]);

  const [members, setMembers] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [resendingId, setResendingId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState(initialForm);

  const [filters, setFilters] =
    useState({
      event: "",
      department: "",
      status: "",
    });

  // ======================================================
  // CHARGER LES PROGRAMMATIONS
  // ======================================================

  const fetchAssignments = async (
    customFilters = filters
  ) => {
    try {
      const params =
        new URLSearchParams();

      if (customFilters.event) {
        params.append(
          "event",
          customFilters.event
        );
      }

      if (customFilters.department) {
        params.append(
          "department",
          customFilters.department
        );
      }

      if (customFilters.status) {
        params.append(
          "status",
          customFilters.status
        );
      }

      params.append("limit", "100");

      const res = await API.get(
        `/assignments?${params.toString()}`
      );

      setAssignments(
        res.data?.data || []
      );
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

  // ======================================================
  // CHARGER LES OPTIONS
  // ======================================================

  const fetchOptions = async () => {
    try {
      const [
        membersRes,
        eventsRes,
        departmentsRes,
      ] = await Promise.all([
        API.get(
          "/members?limit=100"
        ),

        API.get(
          "/events?limit=100"
        ),

        API.get(
          "/departments?limit=100"
        ),
      ]);

      setMembers(
        membersRes.data?.data ||
          []
      );

      setEvents(
        eventsRes.data?.data ||
          []
      );

      setDepartments(
        departmentsRes.data
          ?.data || []
      );
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

  // ======================================================
  // CHARGEMENT INITIAL
  // ======================================================

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

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleMemberChange = (
    event
  ) => {
    const memberId =
      event.target.value;

    const selectedMember =
      members.find(
        (member) =>
          member._id === memberId
      );

    setForm((previous) => ({
      ...previous,

      member: memberId,

      department:
        selectedMember
          ?.department?._id ||
        selectedMember
          ?.department ||
        "",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(initialForm);
  };

  // ======================================================
  // CRÉER PROGRAMMATION
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.member) {
      toast.warning(
        "Sélectionnez un membre"
      );

      return;
    }

    if (!form.event) {
      toast.warning(
        "Sélectionnez un événement"
      );

      return;
    }

    if (!form.role.trim()) {
      toast.warning(
        "Indiquez le rôle ou le poste"
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        member: form.member,

        event: form.event,

        role:
          form.role.trim(),

        note:
          form.note.trim(),
      };

      if (form.department) {
        payload.department =
          form.department;
      }

      const res = await API.post(
        "/assignments",
        payload
      );

      const emailStatus =
        res.data?.data
          ?.emailStatus ||
        "not_sent";

      if (
        emailStatus === "sent"
      ) {
        toast.success(
          "Programmation créée et email envoyé"
        );
      } else if (
        emailStatus === "failed"
      ) {
        toast.warning(
          "Programmation créée mais l'email a échoué"
        );
      } else {
        toast.success(
          "Programmation créée"
        );
      }

      closeForm();

      await fetchAssignments(
        filters
      );
    } catch (error) {
      console.error(
        "Erreur création programmation :",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Impossible de créer la programmation"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // RENVOYER EMAIL
  // ======================================================

  const resendEmail = async (
    assignment
  ) => {
    try {
      setResendingId(
        assignment._id
      );

      const res = await API.post(
        `/assignments/${assignment._id}/resend-email`
      );

      toast.success(
        res.data?.message ||
          "Email renvoyé avec succès"
      );

      await fetchAssignments(
        filters
      );
    } catch (error) {
      console.error(
        "Erreur renvoi email :",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Impossible de renvoyer l'email"
      );
    } finally {
      setResendingId(null);
    }
  };

  // ======================================================
  // SUPPRIMER
  // ======================================================

  const deleteAssignment = async (
    assignment
  ) => {
    const memberName = `${
      assignment.member
        ?.firstName || ""
    } ${
      assignment.member
        ?.lastName || ""
    }`.trim();

    const confirmed =
      window.confirm(
        `Supprimer la programmation de ${
          memberName ||
          "ce membre"
        } ?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/assignments/${assignment._id}`
      );

      toast.success(
        "Programmation supprimée"
      );

      await fetchAssignments(
        filters
      );
    } catch (error) {
      console.error(
        "Erreur suppression programmation :",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Impossible de supprimer la programmation"
      );
    }
  };

  // ======================================================
  // FILTRES
  // ======================================================

  const handleFilterChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    const newFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(newFilters);

    fetchAssignments(
      newFilters
    );
  };

  const resetFilters = () => {
    const emptyFilters = {
      event: "",
      department: "",
      status: "",
    };

    setFilters(
      emptyFilters
    );

    fetchAssignments(
      emptyFilters
    );
  };

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const stats = useMemo(() => {
    return {
      total:
        assignments.length,

      pending:
        assignments.filter(
          (item) =>
            item.status ===
            "pending"
        ).length,

      confirmed:
        assignments.filter(
          (item) =>
            item.status ===
            "confirmed"
        ).length,

      declined:
        assignments.filter(
          (item) =>
            item.status ===
            "declined"
        ).length,
    };
  }, [assignments]);

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "—";
    }

    return parsed.toLocaleString(
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

  // ======================================================
  // STATUT PROGRAMMATION
  // ======================================================

  const getStatusLabel = (
    status
  ) => {
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

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "confirmed":
        return "status-active";

      case "declined":
        return "status-inactive";

      case "cancelled":
        return "status-cancelled";

      default:
        return "status-pending";
    }
  };

  // ======================================================
  // STATUT EMAIL
  // ======================================================

  const getEmailLabel = (
    status
  ) => {
    switch (status) {
      case "sent":
        return "Email envoyé";

      case "failed":
        return "Échec email";

      default:
        return "Non envoyé";
    }
  };

  const getEmailClass = (
    status
  ) => {
    switch (status) {
      case "sent":
        return "status-active";

      case "failed":
        return "status-inactive";

      default:
        return "status-pending";
    }
  };

  // ======================================================
  // INITIALS
  // ======================================================

  const getInitials = (
    member
  ) => {
    const first =
      member?.firstName
        ?.charAt(0)
        ?.toUpperCase() ||
      "";

    const last =
      member?.lastName
        ?.charAt(0)
        ?.toUpperCase() ||
      "";

    return (
      `${first}${last}` ||
      "M"
    );
  };

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <Layout>
      <div className="management-page">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Programmations
            </h1>

            <p className="page-subtitle">
              Organisez les équipes,
              envoyez les invitations
              et suivez les réponses
              des membres.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setForm(
                  initialForm
                );

                setShowForm(
                  true
                );
              }}
            >
              + Nouvelle programmation
            </button>
          </div>
        </div>

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total
            </div>

            <div className="management-stat-value">
              {stats.total}
            </div>

            <div className="management-stat-description">
              Programmations
              enregistrées
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              En attente
            </div>

            <div className="management-stat-value">
              {stats.pending}
            </div>

            <div className="management-stat-description">
              En attente de réponse
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Confirmées
            </div>

            <div className="management-stat-value">
              {stats.confirmed}
            </div>

            <div className="management-stat-description">
              Membres disponibles
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Refusées
            </div>

            <div className="management-stat-value">
              {stats.declined}
            </div>

            <div className="management-stat-description">
              Membres indisponibles
            </div>
          </div>
        </div>

        {/* ==================================================
            FILTRES
        ================================================== */}

        <div className="management-card">
          <div className="management-toolbar">
            <div>
              <h2 className="management-card-title">
                Filtres
              </h2>

              <p className="page-subtitle">
                Affinez la liste des
                programmations.
              </p>
            </div>

            <div className="management-filters">
              <select
                className="management-select"
                name="event"
                value={
                  filters.event
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  Tous les événements
                </option>

                {events.map(
                  (event) => (
                    <option
                      key={
                        event._id
                      }
                      value={
                        event._id
                      }
                    >
                      {event.title}
                    </option>
                  )
                )}
              </select>

              <select
                className="management-select"
                name="department"
                value={
                  filters.department
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  Tous les départements
                </option>

                {departments.map(
                  (
                    department
                  ) => (
                    <option
                      key={
                        department._id
                      }
                      value={
                        department._id
                      }
                    >
                      {
                        department.name
                      }
                    </option>
                  )
                )}
              </select>

              <select
                className="management-select"
                name="status"
                value={
                  filters.status
                }
                onChange={
                  handleFilterChange
                }
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
                className="btn btn-secondary"
                onClick={
                  resetFilters
                }
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            TABLEAU
        ================================================== */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Équipe programmée
              </h2>

              <p className="page-subtitle">
                {
                  assignments.length
                }{" "}
                programmation
                {assignments.length >
                1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des
                programmations...
              </div>
            </div>
          ) : assignments.length ===
            0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                📅
              </div>

              <h3>
                Aucune programmation
              </h3>

              <p>
                Commencez par
                programmer une
                personne pour un
                événement.
              </p>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Membre
                    </th>

                    <th>
                      Événement
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Département
                    </th>

                    <th>
                      Poste
                    </th>

                    <th>
                      Notification
                    </th>

                    <th>
                      Réponse
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map(
                    (
                      assignment
                    ) => (
                      <tr
                        key={
                          assignment._id
                        }
                      >
                        {/* MEMBRE */}

                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              {getInitials(
                                assignment.member
                              )}
                            </div>

                            <div>
                              <div className="person-name">
                                {assignment
                                  .member
                                  ?.firstName ||
                                  ""}{" "}
                                {assignment
                                  .member
                                  ?.lastName ||
                                  ""}
                              </div>

                              <div className="person-secondary">
                                {assignment
                                  .member
                                  ?.email ||
                                  "Sans email"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ÉVÉNEMENT */}

                        <td>
                          <div className="person-name">
                            {assignment
                              .event
                              ?.title ||
                              "—"}
                          </div>
                        </td>

                        {/* DATE */}

                        <td>
                          {formatDate(
                            assignment
                              .event
                              ?.date
                          )}
                        </td>

                        {/* DÉPARTEMENT */}

                        <td>
                          {assignment
                            .department
                            ?.name ||
                            "—"}
                        </td>

                        {/* POSTE */}

                        <td>
                          <strong>
                            {assignment.role ||
                              "—"}
                          </strong>

                          {assignment.note && (
                            <div className="person-secondary">
                              {
                                assignment.note
                              }
                            </div>
                          )}
                        </td>

                        {/* EMAIL */}

                        <td>
                          <span
                            className={`status-badge ${getEmailClass(
                              assignment.emailStatus
                            )}`}
                          >
                            {getEmailLabel(
                              assignment.emailStatus
                            )}
                          </span>

                          <div
                            className="person-secondary"
                            style={{
                              marginTop: 8,
                              lineHeight:
                                1.6,
                            }}
                          >
                            <div>
                              Envois :{" "}
                              <strong>
                                {assignment.emailSendCount ||
                                  0}
                              </strong>
                            </div>

                            {assignment.emailSentAt && (
                              <div>
                                Dernier :{" "}
                                {formatDate(
                                  assignment.emailSentAt
                                )}
                              </div>
                            )}

                            {assignment.reminderCount >
                              0 && (
                              <div>
                                🔔{" "}
                                {
                                  assignment.reminderCount
                                }{" "}
                                rappel
                                {assignment.reminderCount >
                                1
                                  ? "s"
                                  : ""}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* RÉPONSE */}

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              assignment.status
                            )}`}
                          >
                            {getStatusLabel(
                              assignment.status
                            )}
                          </span>

                          <div
                            className="person-secondary"
                            style={{
                              marginTop: 8,
                              lineHeight:
                                1.5,
                            }}
                          >
                            {assignment.status ===
                              "pending" &&
                              "En attente du membre"}

                            {assignment.status ===
                              "confirmed" && (
                              <>
                                Confirmé par
                                le membre

                                {assignment.confirmedAt && (
                                  <>
                                    <br />

                                    {formatDate(
                                      assignment.confirmedAt
                                    )}
                                  </>
                                )}
                              </>
                            )}

                            {assignment.status ===
                              "declined" && (
                              <>
                                Indisponible

                                {assignment.declinedAt && (
                                  <>
                                    <br />

                                    {formatDate(
                                      assignment.declinedAt
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              disabled={
                                resendingId ===
                                assignment._id
                              }
                              onClick={() =>
                                resendEmail(
                                  assignment
                                )
                              }
                            >
                              {resendingId ===
                              assignment._id
                                ? "Envoi..."
                                : "✉️ Renvoyer"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-small"
                              onClick={() =>
                                deleteAssignment(
                                  assignment
                                )
                              }
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          MODAL NOUVELLE PROGRAMMATION
      ================================================== */}

      {showForm && (
        <div
          className="management-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="management-modal">
            {/* HEADER */}

            <div className="management-modal-header">
              <div>
                <h2>
                  Nouvelle programmation
                </h2>

                <p className="page-subtitle">
                  Programmez un membre
                  et envoyez-lui
                  automatiquement son
                  invitation.
                </p>
              </div>

              <button
                type="button"
                className="management-modal-close"
                onClick={
                  closeForm
                }
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* FORMULAIRE */}

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="management-modal-body">
                <div className="management-form-grid">
                  {/* MEMBRE */}

                  <div className="form-group">
                    <label className="form-label">
                      Membre *
                    </label>

                    <select
                      className="form-select"
                      name="member"
                      value={
                        form.member
                      }
                      onChange={
                        handleMemberChange
                      }
                      required
                    >
                      <option value="">
                        Sélectionner un
                        membre
                      </option>

                      {members.map(
                        (
                          member
                        ) => (
                          <option
                            key={
                              member._id
                            }
                            value={
                              member._id
                            }
                          >
                            {
                              member.firstName
                            }{" "}
                            {
                              member.lastName
                            }
                            {member.email
                              ? ` — ${member.email}`
                              : " — sans email"}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* ÉVÉNEMENT */}

                  <div className="form-group">
                    <label className="form-label">
                      Événement *
                    </label>

                    <select
                      className="form-select"
                      name="event"
                      value={
                        form.event
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >
                      <option value="">
                        Sélectionner un
                        événement
                      </option>

                      {events.map(
                        (event) => (
                          <option
                            key={
                              event._id
                            }
                            value={
                              event._id
                            }
                          >
                            {
                              event.title
                            }{" "}
                            —{" "}
                            {formatDate(
                              event.date
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* DÉPARTEMENT */}

                  <div className="form-group">
                    <label className="form-label">
                      Département
                    </label>

                    <select
                      className="form-select"
                      name="department"
                      value={
                        form.department
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        Aucun département
                      </option>

                      {departments.map(
                        (
                          department
                        ) => (
                          <option
                            key={
                              department._id
                            }
                            value={
                              department._id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* POSTE */}

                  <div className="form-group">
                    <label className="form-label">
                      Rôle / Poste *
                    </label>

                    <input
                      className="form-input"
                      type="text"
                      name="role"
                      value={
                        form.role
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Ex. Alto, Accueil, Piano..."
                      required
                    />
                  </div>

                  {/* CONSIGNES */}

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Consignes
                    </label>

                    <textarea
                      className="form-textarea"
                      name="note"
                      value={
                        form.note
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                      placeholder="Ex. Arriver 30 minutes avant le début..."
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="management-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    closeForm
                  }
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Programmation..."
                    : "Programmer le membre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}