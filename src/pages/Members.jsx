import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import API from "../api/axios";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import { isAdmin } from "../utils/auth";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
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
    firstName: "",
    lastName: "",
    gender: "Homme",
    phone: "",
    email: "",
    address: "",
    department: "",
    status: "Actif",
  });

  const fetchMembers = async (customFilters = filters) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (customFilters.search) query.append("search", customFilters.search);
      if (customFilters.department) query.append("department", customFilters.department);
      if (customFilters.status) query.append("status", customFilters.status);
      query.append("page", customFilters.page);
      query.append("limit", customFilters.limit);

      const res = await API.get(`/members?${query.toString()}`);

      setMembers(res.data.data || []);
      setPagination({
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0,
        limit: res.data.limit || 10,
      });
    } catch (err) {
      console.error("Erreur fetch members :", err);
      toast.error("Erreur lors du chargement des membres");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error("Erreur fetch departments :", err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMembers(filters);
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
    fetchMembers(filters);
  };

  const resetFilters = () => {
    const newFilters = {
      search: "",
      department: "",
      status: "",
      page: 1,
      limit: 10,
    };
    setFilters(newFilters);
    fetchMembers(newFilters);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gender: "Homme",
      phone: "",
      email: "",
      address: "",
      department: "",
      status: "Actif",
    });
    setEditingMemberId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        department: formData.department || null,
      };

      if (editingMemberId) {
        await API.put(`/members/${editingMemberId}`, payload);
        toast.success("Membre modifié avec succès");
      } else {
        await API.post("/members", payload);
        toast.success("Membre ajouté avec succès");
      }

      resetForm();
      fetchMembers(filters);
    } catch (err) {
      console.error("Erreur submit member :", err);
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de l’enregistrement du membre"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingMemberId(member._id);
    setFormData({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      gender: member.gender || "Homme",
      phone: member.phone || "",
      email: member.email || "",
      address: member.address || "",
      department: member.department?._id || "",
      status: member.status || "Actif",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (memberId) => {
    setDeleteTargetId(memberId);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleteLoading(true);

      await API.delete(`/members/${deleteTargetId}`);
      toast.success("Membre supprimé avec succès");

      if (editingMemberId === deleteTargetId) {
        resetForm();
      }

      setDeleteTargetId(null);
      fetchMembers(filters);
    } catch (err) {
      console.error("Erreur suppression membre :", err);
      toast.error(
        err.response?.data?.message || "Erreur lors de la suppression du membre"
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
  const handleExportExcel = () => {
    const sheetData = [
      [
        "Prénom",
        "Nom",
        "Genre",
        "Téléphone",
        "Email",
        "Adresse",
        "Département",
        "Statut",
      ],
      ...members.map((member) => [
        member.firstName || "",
        member.lastName || "",
        member.gender || "",
        member.phone || "",
        member.email || "",
        member.address || "",
        member.department?.name || "",
        member.status || "",
      ]),
    ];
  
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");
    XLSX.writeFile(workbook, "membres-eldior-management-church.xlsx");
  };

  return (
    <Layout>
      <div className="card">
        <div className="section-header">
          <h2>{editingMemberId ? "Modifier un membre" : "Ajouter un membre"}</h2>
        </div>

        <form className="member-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            placeholder="Prénom"
            value={formData.firstName}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="lastName"
            placeholder="Nom"
            value={formData.lastName}
            onChange={handleChange}
            required
          />

          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>

          <input
            type="text"
            name="phone"
            placeholder="Téléphone"
            value={formData.phone}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="address"
            placeholder="Adresse"
            value={formData.address}
            onChange={handleChange}
          />

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
          >
            <option value="">Sélectionner un département</option>
            {departments.map((dep) => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>

          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading
                ? editingMemberId
                  ? "Modification..."
                  : "Ajout..."
                : editingMemberId
                ? "Mettre à jour"
                : "Ajouter le membre"}
            </button>

            {editingMemberId && (
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
          <h2>Gestion des membres</h2>
          <span className="results-count">
            {pagination.total} membre(s) au total
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
            placeholder="Rechercher un membre..."
            value={filters.search}
            onChange={handleFilterChange}
          />

          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
          >
            <option value="">Tous les départements</option>
            {departments.map((dep) => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>

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
                <th>Genre</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Département</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length ? (
                members.map((member) => (
                  <tr key={member._id}>
                    <td>
                      {member.firstName} {member.lastName}
                    </td>
                    <td>{member.gender}</td>
                    <td>{member.phone || "-"}</td>
                    <td>{member.email || "-"}</td>
                    <td>{member.department?.name || "-"}</td>
                    <td>{member.status}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(member)}
                        >
                          Modifier
                        </button>
                        {isAdmin() && (
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(member._id)}
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
                  <td colSpan="7">Aucun membre trouvé</td>
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
        title="Supprimer ce membre"
        message="Cette action supprimera définitivement le membre sélectionné. Voulez-vous continuer ?"
        confirmText="Supprimer"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}