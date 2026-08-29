import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import Layout from "../components/Layout";
import "../styles/ManagementPages.css";

import API from "../api/axios";
import { getCurrentAdmin } from "../utils/auth";

const initialForm = {
  title: "",
  date: "",
  type: "",
  location: "",
  status: "planned",
};

export default function Events() {
  const currentUser = getCurrentAdmin();
  const isAdmin = currentUser?.role === "admin";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [form, setForm] =
    useState(initialForm);

  const [editingId, setEditingId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  // ======================================================
  // CHARGEMENT
  // ======================================================

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const response = await API.get(
        "/events",
        {
          params: {
            limit: 1000,
          },
        }
      );

      const data =
        response.data?.data ||
        response.data?.events ||
        [];

      setEvents(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Erreur événements :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de charger les événements"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const stats = useMemo(() => {
    const total = events.length;

    const planned = events.filter(
      (event) =>
        event.status === "planned"
    ).length;

    const ongoing = events.filter(
      (event) =>
        event.status === "ongoing"
    ).length;

    const completed = events.filter(
      (event) =>
        event.status === "completed"
    ).length;

    const cancelled = events.filter(
      (event) =>
        event.status === "cancelled"
    ).length;

    return {
      total,
      planned,
      ongoing,
      completed,
      cancelled,
    };
  }, [events]);

  // ======================================================
  // RECHERCHE + FILTRE
  // ======================================================

  const filteredEvents = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    return events.filter((event) => {
      const matchesStatus =
        statusFilter === "all" ||
        event.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!value) {
        return true;
      }

      const searchableText = [
        event.title,
        event.type,
        event.location,
        event.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(value);
    });
  }, [events, search, statusFilter]);

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  // ======================================================
  // DATE POUR INPUT
  // ======================================================

  const formatDateForInput = (date) => {
    if (!date) {
      return "";
    }

    const parsed = new Date(date);

    if (
      Number.isNaN(parsed.getTime())
    ) {
      return "";
    }

    const offset =
      parsed.getTimezoneOffset();

    const localDate = new Date(
      parsed.getTime() -
        offset * 60000
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  };

  const openEditForm = (event) => {
    setEditingId(event._id);

    setForm({
      title: event.title || "",

      date: formatDateForInput(
        event.date
      ),

      type: event.type || "",

      location:
        event.location || "",

      status:
        event.status || "planned",
    });

    setShowForm(true);
  };

  // ======================================================
  // CRÉER / MODIFIER
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.warning(
        "Le titre est obligatoire"
      );

      return;
    }

    if (!form.date) {
      toast.warning(
        "La date est obligatoire"
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),

        date: new Date(
          form.date
        ).toISOString(),

        type: form.type.trim(),

        location:
          form.location.trim(),

        status: form.status,
      };

      if (editingId) {
        await API.put(
          `/events/${editingId}`,
          payload
        );

        toast.success(
          "Événement modifié avec succès"
        );
      } else {
        await API.post(
          "/events",
          payload
        );

        toast.success(
          "Événement créé avec succès"
        );
      }

      resetForm();

      await fetchEvents();
    } catch (error) {
      console.error(
        "Erreur événement :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible d'enregistrer l'événement"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // SUPPRESSION
  // ======================================================

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error(
        "Seul un administrateur peut supprimer un événement"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer cet événement ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/events/${id}`
      );

      toast.success(
        "Événement supprimé avec succès"
      );

      await fetchEvents();
    } catch (error) {
      console.error(
        "Erreur suppression :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer l'événement"
      );
    }
  };

  // ======================================================
  // DATE AFFICHAGE
  // ======================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
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

  // ======================================================
  // LIBELLÉ STATUT
  // ======================================================

  const getStatusLabel = (status) => {
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
  // CLASSE STATUT
  // ======================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "planned":
        return "status-planned";

      case "ongoing":
        return "status-pending";

      case "completed":
        return "status-completed";

      case "cancelled":
        return "status-cancelled";

      default:
        return "status-pending";
    }
  };

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
              Événements
            </h1>

            <p className="page-subtitle">
              Planifiez et gérez le
              calendrier des événements
              de votre église.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreateForm}
            >
              + Nouvel événement
            </button>
          </div>
        </div>

        {/* ================================================
            STATISTIQUES
        ================================================ */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total événements
            </div>

            <div className="management-stat-value">
              {stats.total}
            </div>

            <div className="management-stat-description">
              Tous les événements
              enregistrés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              À venir
            </div>

            <div className="management-stat-value">
              {stats.planned}
            </div>

            <div className="management-stat-description">
              Événements planifiés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              En cours
            </div>

            <div className="management-stat-value">
              {stats.ongoing}
            </div>

            <div className="management-stat-description">
              Événements actuellement
              en cours
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Terminés
            </div>

            <div className="management-stat-value">
              {stats.completed}
            </div>

            <div className="management-stat-description">
              Événements déjà terminés
            </div>
          </div>
        </div>

        {/* ================================================
            TABLEAU
        ================================================ */}

        <div className="management-card">
          {/* RECHERCHE */}

          <div className="management-toolbar">
            <div className="management-search">
              <span className="management-search-icon">
                🔎
              </span>

              <input
                type="search"
                placeholder="Rechercher un événement..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="management-filters">
              <select
                className="management-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  Tous les statuts
                </option>

                <option value="planned">
                  Planifiés
                </option>

                <option value="ongoing">
                  En cours
                </option>

                <option value="completed">
                  Terminés
                </option>

                <option value="cancelled">
                  Annulés
                </option>
              </select>
            </div>
          </div>

          {/* CHARGEMENT */}

          {loading ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des
                événements...
              </div>
            </div>
          ) : filteredEvents.length ===
            0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                🗓️
              </div>

              <h3>
                Aucun événement trouvé
              </h3>

              <p>
                Créez un nouvel
                événement ou modifiez
                vos critères de
                recherche.
              </p>
            </div>
          ) : (
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
                      Type
                    </th>

                    <th>
                      Lieu
                    </th>

                    <th>
                      Statut
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.map(
                    (event) => (
                      <tr
                        key={event._id}
                      >
                        {/* ÉVÉNEMENT */}

                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              🗓️
                            </div>

                            <div>
                              <div className="person-name">
                                {event.title}
                              </div>

                              <div className="person-secondary">
                                Événement
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* DATE */}

                        <td>
                          <div className="person-name">
                            {formatDate(
                              event.date
                            )}
                          </div>
                        </td>

                        {/* TYPE */}

                        <td>
                          {event.type ||
                            "—"}
                        </td>

                        {/* LIEU */}

                        <td>
                          {event.location ||
                            "—"}
                        </td>

                        {/* STATUT */}

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              event.status
                            )}`}
                          >
                            {getStatusLabel(
                              event.status
                            )}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() =>
                                openEditForm(
                                  event
                                )
                              }
                            >
                              ✏️ Modifier
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-danger btn-small"
                                onClick={() =>
                                  handleDelete(
                                    event._id
                                  )
                                }
                              >
                                🗑️ Supprimer
                              </button>
                            )}
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

      {/* ================================================
          MODAL
      ================================================ */}

      {showForm && (
        <div
          className="management-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              resetForm();
            }
          }}
        >
          <div className="management-modal">
            {/* HEADER */}

            <div className="management-modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Modifier l'événement"
                    : "Nouvel événement"}
                </h2>

                <p className="page-subtitle">
                  {editingId
                    ? "Modifiez les informations de cet événement."
                    : "Planifiez un nouvel événement pour votre église."}
                </p>
              </div>

              <button
                type="button"
                className="management-modal-close"
                onClick={resetForm}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* FORMULAIRE */}

            <form
              onSubmit={handleSubmit}
            >
              <div className="management-modal-body">
                <div className="management-form-grid">
                  {/* TITRE */}

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Titre de
                      l'événement *
                    </label>

                    <input
                      className="form-input"
                      name="title"
                      value={form.title}
                      onChange={
                        handleChange
                      }
                      placeholder="Ex. Culte du dimanche"
                      required
                    />
                  </div>

                  {/* DATE */}

                  <div className="form-group">
                    <label className="form-label">
                      Date et heure *
                    </label>

                    <input
                      className="form-input"
                      type="datetime-local"
                      name="date"
                      value={form.date}
                      onChange={
                        handleChange
                      }
                      required
                    />
                  </div>

                  {/* TYPE */}

                  <div className="form-group">
                    <label className="form-label">
                      Type
                    </label>

                    <input
                      className="form-input"
                      name="type"
                      value={form.type}
                      onChange={
                        handleChange
                      }
                      placeholder="Culte, conférence..."
                    />
                  </div>

                  {/* LIEU */}

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Lieu
                    </label>

                    <input
                      className="form-input"
                      name="location"
                      value={
                        form.location
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Lieu de l'événement"
                    />
                  </div>

                  {/* STATUT */}

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Statut
                    </label>

                    <select
                      className="form-select"
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="planned">
                        Planifié
                      </option>

                      <option value="ongoing">
                        En cours
                      </option>

                      <option value="completed">
                        Terminé
                      </option>

                      <option value="cancelled">
                        Annulé
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="management-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingId
                    ? "Enregistrer les modifications"
                    : "Créer l'événement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}