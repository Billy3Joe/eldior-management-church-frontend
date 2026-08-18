import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import API from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import { isAdmin } from "../utils/auth";
export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    leader: "",
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
    description: "",
    leader: "",
    status: "Actif",
  });

  const fetchDepartments = async (customFilters = filters) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (customFilters.search) query.append("search", customFilters.search);
      if (customFilters.status) query.append("status", customFilters.status);
      if (customFilters.leader) query.append("leader", customFilters.leader);
      query.append("page", customFilters.page);
      query.append("limit", customFilters.limit);

      const [listRes, statsRes] = await Promise.all([
        API.get(`/departments?${query.toString()}`),
        API.get("/departments/stats/all"),
      ]);

      const pagedDepartments = listRes.data.data || [];
      const stats = statsRes.data.data || [];

      const merged = pagedDepartments.map((dep) => {
        const stat = stats.find((s) => s._id === dep._id) || {};
        return {
          ...dep,
          totalMembers: stat.totalMembers || 0,
          activeMembers: stat.activeMembers || 0,
          inactiveMembers: stat.inactiveMembers || 0,
        };
      });

      setDepartments(merged);
      setPagination({
        page: listRes.data.page || 1,
        totalPages: listRes.data.totalPages || 1,
        total: listRes.data.total || 0,
        limit: listRes.data.limit || 10,
      });
    } catch (err) {
      console.error("Erreur fetch departments :", err);
      toast.error("Erreur lors du chargement des départements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDepartments(filters);
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
    fetchDepartments(filters);
  };

  const resetFilters = () => {
    const newFilters = {
      search: "",
      status: "",
      leader: "",
      page: 1,
      limit: 10,
    };
    setFilters(newFilters);
    fetchDepartments(newFilters);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      leader: "",
      status: "Actif",
    });
    setEditingDepartmentId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDepartmentId) {
        await API.put(`/departments/${editingDepartmentId}`, formData);
        toast.success("Département modifié avec succès");
      } else {
        await API.post("/departments", formData);
        toast.success("Département ajouté avec succès");
      }

      resetForm();
      fetchDepartments(filters);
    } catch (err) {
      console.error("Erreur submit department :", err);
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de l’enregistrement du département"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (departmentId) => {
    try {
      const res = await API.get(`/departments/${departmentId}`);
      const department = res.data.data;

      setEditingDepartmentId(department._id);
      setFormData({
        name: department.name || "",
        description: department.description || "",
        leader: department.leader || "",
        status: department.status || "Actif",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erreur chargement département :", err);
      toast.error("Impossible de charger ce département");
    }
  };

  const handleDelete = (departmentId) => {
    setDeleteTargetId(departmentId);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleteLoading(true);

      await API.delete(`/departments/${deleteTargetId}`);
      toast.success("Département supprimé avec succès");

      if (editingDepartmentId === deleteTargetId) {
        resetForm();
      }

      setDeleteTargetId(null);
      fetchDepartments(filters);
    } catch (err) {
      console.error("Erreur suppression département :", err);
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de la suppression du département"
      );
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleExportExcel = () => {
    const sheetData = [
      [
        "Nom",
        "Leader",
        "Statut",
        "Total membres",
        "Actifs",
        "Inactifs",
        "Description",
      ],
      ...departments.map((dep) => [
        dep.name || "",
        dep.leader || "",
        dep.status || "",
        dep.totalMembers || 0,
        dep.activeMembers || 0,
        dep.inactiveMembers || 0,
        dep.description || "",
      ]),
    ];
  
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Départements");
    XLSX.writeFile(workbook, "departements-eldior-management-church.xlsx");
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
            {editingDepartmentId
              ? "Modifier un département"
              : "Ajouter un département"}
          </h2>
        </div>

        <form className="member-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nom du département"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="leader"
            placeholder="Responsable / Leader"
            value={formData.leader}
            onChange={handleChange}
          />

          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />

          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading
                ? editingDepartmentId
                  ? "Modification..."
                  : "Ajout..."
                : editingDepartmentId
                ? "Mettre à jour"
                : "Ajouter le département"}
            </button>

            {editingDepartmentId && (
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
          <h2>Départements</h2>
          <span className="results-count">
            {pagination.total} département(s) au total
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
            placeholder="Rechercher un département..."
            value={filters.search}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="leader"
            placeholder="Filtrer par leader..."
            value={filters.leader}
            onChange={handleFilterChange}
          />

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
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
                <th>Leader</th>
                <th>Statut</th>
                <th>Total membres</th>
                <th>Actifs</th>
                <th>Inactifs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length ? (
                departments.map((dep) => (
                  <tr key={dep._id}>
                    <td>{dep.name}</td>
                    <td>{dep.leader || "-"}</td>
                    <td>{dep.status}</td>
                    <td>{dep.totalMembers}</td>
                    <td>{dep.activeMembers}</td>
                    <td>{dep.inactiveMembers}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(dep._id)}
                        >
                          Modifier
                        </button>
                        {isAdmin() && (
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(dep._id)}
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
                  <td colSpan="7">Aucun département trouvé</td>
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
        title="Supprimer ce département"
        message="Cette action supprimera définitivement le département sélectionné. Voulez-vous continuer ?"
        confirmText="Supprimer"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}