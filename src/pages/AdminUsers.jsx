import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import API from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    isActive: "",
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
    name: "",
    email: "",
    password: "",
    role: "admin",
    isActive: true,
  });

  const fetchUsers = async (customFilters = filters) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (customFilters.search) query.append("search", customFilters.search);
      if (customFilters.role) query.append("role", customFilters.role);
      if (customFilters.isActive !== "") {
        query.append("isActive", customFilters.isActive);
      }

      query.append("page", customFilters.page);
      query.append("limit", customFilters.limit);

      const res = await API.get(`/users?${query.toString()}`);

      setUsers(res.data.data || []);
      setPagination({
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0,
        limit: res.data.limit || 10,
      });
    } catch (error) {
      console.error("Erreur chargement users :", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers(filters);
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
    fetchUsers(filters);
  };

  const resetFilters = () => {
    const newFilters = {
      search: "",
      role: "",
      isActive: "",
      page: 1,
      limit: 10,
    };

    setFilters(newFilters);
    fetchUsers(newFilters);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "admin",
      isActive: true,
    });
    setEditingUserId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData };

      if (editingUserId && !payload.password) {
        delete payload.password;
      }

      if (editingUserId) {
        await API.put(`/users/${editingUserId}`, payload);
        toast.success("Utilisateur mis à jour avec succès");
      } else {
        await API.post("/users", payload);
        toast.success("Utilisateur créé avec succès");
      }

      resetForm();
      fetchUsers(filters);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'enregistrement de l'utilisateur"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (userId) => {
    try {
      const res = await API.get(`/users/${userId}`);
      const user = res.data.data;

      setEditingUserId(user._id);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "admin",
        isActive: !!user.isActive,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
    
      toast.error(
        error.response?.data?.message ||
          "Impossible de charger cet utilisateur"
      );
    }
  };

  const handleDelete = (userId) => {
    setDeleteTargetId(userId);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleteLoading(true);
      await API.delete(`/users/${deleteTargetId}`);
      toast.success("Utilisateur supprimé avec succès");
      setDeleteTargetId(null);

      if (editingUserId === deleteTargetId) {
        resetForm();
      }

      fetchUsers(filters);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la suppression de l'utilisateur"
      );
    } finally {
      setDeleteLoading(false);
    }
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
            {editingUserId ? "Modifier un admin" : "Ajouter un admin"}
          </h2>
        </div>

        <form className="member-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nom"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Adresse email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder={
              editingUserId
                ? "Nouveau mot de passe (optionnel)"
                : "Mot de passe"
            }
            value={formData.password}
            onChange={handleChange}
            required={!editingUserId}
          />

          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
          </select>

          <label className="checkbox-line">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            Compte actif
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading
                ? editingUserId
                  ? "Modification..."
                  : "Création..."
                : editingUserId
                ? "Mettre à jour"
                : "Créer l'admin"}
            </button>

            {editingUserId && (
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
            <h2>Utilisateurs admin</h2>
            <span className="results-count">
              {pagination.total} utilisateur(s) au total
            </span>
          </div>
        </div>

        <form className="filters-panel" onSubmit={applyFilters}>
          <input
            type="text"
            name="search"
            placeholder="Rechercher un utilisateur..."
            value={filters.search}
            onChange={handleFilterChange}
          />

          <select name="role" value={filters.role} onChange={handleFilterChange}>
            <option value="">Tous les rôles</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
          </select>

          <select
            name="isActive"
            value={filters.isActive}
            onChange={handleFilterChange}
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
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
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.isActive ? "Oui" : "Non"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(user._id)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(user._id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Aucun utilisateur trouvé</td>
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
        title="Supprimer cet utilisateur"
        message="Cette action supprimera définitivement l'utilisateur sélectionné. Voulez-vous continuer ?"
        confirmText="Supprimer"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}