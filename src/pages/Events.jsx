import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
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
  const currentUser =
    getCurrentAdmin();

  const isAdmin =
    currentUser?.role ===
    "admin";

  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

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

      const response =
        await API.get(
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
        Array.isArray(data)
          ? data
          : []
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
  // RECHERCHE
  // ======================================================

  const filteredEvents =
    useMemo(() => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return events;
      }

      return events.filter(
        (event) =>
          [
            event.title,
            event.type,
            event.location,
            event.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(value)
      );
    }, [events, search]);

  // ======================================================
  // FORM
  // ======================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

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

  const formatDateForInput = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "";
    }

    const offset =
      parsed.getTimezoneOffset();

    const localDate =
      new Date(
        parsed.getTime() -
          offset * 60000
      );

    return localDate
      .toISOString()
      .slice(0, 16);
  };

  const openEditForm = (
    event
  ) => {
    setEditingId(
      event._id
    );

    setForm({
      title:
        event.title || "",

      date:
        formatDateForInput(
          event.date
        ),

      type:
        event.type || "",

      location:
        event.location || "",

      status:
        event.status ||
        "planned",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================================
  // CREATE / UPDATE
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !form.title.trim()
    ) {
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
        title:
          form.title.trim(),

        date:
          new Date(
            form.date
          ).toISOString(),

        type:
          form.type.trim(),

        location:
          form.location.trim(),

        status:
          form.status,
      };

      if (editingId) {
        await API.put(
          `/events/${editingId}`,
          payload
        );

        toast.success(
          "Événement modifié"
        );
      } else {
        await API.post(
          "/events",
          payload
        );

        toast.success(
          "Événement créé"
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
  // DELETE ADMIN
  // ======================================================

  const handleDelete = async (
    id
  ) => {
    if (!isAdmin) {
      toast.error(
        "Seul un administrateur peut supprimer un événement"
      );

      return;
    }

    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cet événement ?"
      )
    ) {
      return;
    }

    try {
      await API.delete(
        `/events/${id}`
      );

      toast.success(
        "Événement supprimé"
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

  const formatDate = (
    value
  ) => {
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
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  };

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Événements</h2>

          <p className="page-subtitle">
            Gérez le calendrier des
            événements de votre
            église.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
        >
          + Nouvel événement
        </button>
      </div>

      {showForm && (
        <div className="card section-gap">
          <h3>
            {editingId
              ? "Modifier l'événement"
              : "Nouvel événement"}
          </h3>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="form-group">
              <label>Titre</label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>

              <input
                type="datetime-local"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Type</label>

              <input
                name="type"
                value={form.type}
                onChange={handleChange}
                placeholder="Culte, conférence, réunion..."
              />
            </div>

            <div className="form-group">
              <label>Lieu</label>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Statut</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
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

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : editingId
                  ? "Enregistrer"
                  : "Créer l'événement"}
              </button>

              <button
                type="button"
                onClick={resetForm}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card section-gap">
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

        <div
          style={{
            marginTop: 20,
            overflowX: "auto",
          }}
        >
          {loading ? (
            <p>
              Chargement...
            </p>
          ) : filteredEvents.length ===
            0 ? (
            <p>
              Aucun événement.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Lieu</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map(
                  (event) => (
                    <tr
                      key={
                        event._id
                      }
                    >
                      <td>
                        {event.title}
                      </td>

                      <td>
                        {formatDate(
                          event.date
                        )}
                      </td>

                      <td>
                        {event.type ||
                          "—"}
                      </td>

                      <td>
                        {event.location ||
                          "—"}
                      </td>

                      <td>
                        {event.status ||
                          "—"}
                      </td>

                      <td>
                        <div
                          style={{
                            display:
                              "flex",
                            gap: 8,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                event
                              )
                            }
                          >
                            Modifier
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  event._id
                                )
                              }
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}