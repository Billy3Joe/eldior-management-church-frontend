import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import { isAdmin } from "../utils/auth";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const [formData, setFormData] = useState({
    title: "",
    type: "Culte",
    description: "",
    date: "",
    location: "",
    leader: "",
    status: "Prévu",
  });

  const fetchEvents = async (customFilters = filters) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (customFilters.search) query.append("search", customFilters.search);
      if (customFilters.type) query.append("type", customFilters.type);
      if (customFilters.status) query.append("status", customFilters.status);
      query.append("page", customFilters.page);
      query.append("limit", customFilters.limit);

      const res = await API.get(`/events?${query.toString()}`);

      setEvents(res.data.data || []);
      setPagination({
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0,
        limit: res.data.limit || 10,
      });
    } catch (err) {
      console.error("Erreur fetch events :", err);
      toast.error("Erreur lors du chargement des événements");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchEvents(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchEvents(filters);
  };

  const resetFilters = () => {
    const newFilters = {
      search: "",
      type: "",
      status: "",
      page: 1,
      limit: 10,
    };
    setFilters(newFilters);
    fetchEvents(newFilters);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: "Culte",
      description: "",
      date: "",
      location: "",
      leader: "",
      status: "Prévu",
    });
    setEditingEventId(null);
  };

  const toInputDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEventId) {
        await API.put(`/events/${editingEventId}`, formData);
        toast.success("Événement modifié avec succès");
      } else {
        await API.post("/events", formData);
        toast.success("Événement ajouté avec succès");
      }

      resetForm();
      fetchEvents(filters);
    } catch (err) {
      console.error("Erreur submit event :", err);
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de l’enregistrement de l’événement"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (eventId) => {
    try {
      const res = await API.get(`/events/${eventId}`);
      const event = res.data.data;

      setEditingEventId(event._id);
      setFormData({
        title: event.title || "",
        type: event.type || "Culte",
        description: event.description || "",
        date: toInputDateTime(event.date),
        location: event.location || "",
        leader: event.leader || "",
        status: event.status || "Prévu",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erreur chargement événement :", err);
      toast.error("Impossible de charger cet événement");
    }
  };

  const handleDelete = (eventId) => {
    setDeleteTargetId(eventId);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleteLoading(true);

      await API.delete(`/events/${deleteTargetId}`);
      toast.success("Événement supprimé avec succès");

      if (editingEventId === deleteTargetId) {
        resetForm();
      }

      setDeleteTargetId(null);
      fetchEvents(filters);
    } catch (err) {
      console.error("Erreur suppression événement :", err);
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de la suppression de l’événement"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportExcel = () => {
    const sheetData = [
      [
        "Titre",
        "Type",
        "Date",
        "Lieu",
        "Responsable",
        "Statut",
        "Description",
      ],
      ...events.map((event) => [
        event.title || "",
        event.type || "",
        event.date ? new Date(event.date).toLocaleString() : "",
        event.location || "",
        event.leader || "",
        event.status || "",
        event.description || "",
      ]),
    ];
  
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Événements");
    XLSX.writeFile(workbook, "evenements-eldior-management-church.xlsx");
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;

    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  return (
    <Layout>
      <div className="card">
        <div className="section-header">
          <h2>
            {editingEventId ? "Modifier un événement" : "Ajouter un événement"}
          </h2>
        </div>

        <form className="member-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Titre de l’événement"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Culte">Culte</option>
            <option value="Réunion">Réunion</option>
            <option value="Conférence">Conférence</option>
            <option value="Répétition">Répétition</option>
            <option value="Veillée">Veillée</option>
            <option value="Autre">Autre</option>
          </select>

          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Lieu"
            value={formData.location}
            onChange={handleChange}
          />

          <input
            type="text"
            name="leader"
            placeholder="Responsable"
            value={formData.leader}
            onChange={handleChange}
          />

          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Prévu">Prévu</option>
            <option value="Terminé">Terminé</option>
            <option value="Annulé">Annulé</option>
          </select>

          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            style={{ gridColumn: "span 2" }}
          />

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading
                ? editingEventId
                  ? "Modification..."
                  : "Ajout..."
                : editingEventId
                ? "Mettre à jour"
                : "Ajouter l’événement"}
            </button>

            {editingEventId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card section-gap">
      <div className="section-header">
        <div>
          <h2>Liste des événements</h2>
          <span className="results-count">
            {pagination.total} événement(s) au total
          </span>
        </div>

        <button
          type="button"
          className="export-btn excel-btn"
          onClick={handleExportExcel}
        >
          Export Excel
        </button>
      </div>

        <form className="filters-panel" onSubmit={applyFilters}>
          <input
            type="text"
            name="search"
            placeholder="Rechercher un événement..."
            value={filters.search}
            onChange={handleFilterChange}
          />

          <select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="">Tous les types</option>
            <option value="Culte">Culte</option>
            <option value="Réunion">Réunion</option>
            <option value="Conférence">Conférence</option>
            <option value="Répétition">Répétition</option>
            <option value="Veillée">Veillée</option>
            <option value="Autre">Autre</option>
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tous les statuts</option>
            <option value="Prévu">Prévu</option>
            <option value="Terminé">Terminé</option>
            <option value="Annulé">Annulé</option>
          </select>

          <select
            name="limit"
            value={filters.limit}
            onChange={handleFilterChange}
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>

          <div className="filter-actions">
            <button type="submit">Appliquer</button>
            <button
              type="button"
              className="secondary-btn"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          </div>
        </form>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Date</th>
                <th>Lieu</th>
                <th>Responsable</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length ? (
                events.map((event) => (
                  <tr key={event._id}>
                    <td>{event.title || "-"}</td>
                    <td>{event.type || "-"}</td>
                    <td>{formatDate(event.date)}</td>
                    <td>{event.location || "-"}</td>
                    <td>{event.leader || "-"}</td>
                    <td>{event.status || "-"}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="details-btn" to={`/events/${event._id}`}>
                          Détails
                        </Link>

                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(event._id)}
                        >
                          Modifier
                        </button>
                        {isAdmin() && (
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(event._id)}
                        >
                          Supprimer
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">Aucun événement trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Précédent
          </button>

          <span>
            Page {pagination.page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Suivant
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Supprimer cet événement"
        message="Cette action supprimera définitivement l’événement sélectionné. Voulez-vous continuer ?"
        confirmText="Supprimer"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}