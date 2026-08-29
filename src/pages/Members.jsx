import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "react-toastify";

import Layout from "../components/Layout";
import "../styles/ManagementPages.css";

import API from "../api/axios";

import {
  getCurrentAdmin,
} from "../utils/auth";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "active",
};

export default function Members() {
  const currentUser =
    getCurrentAdmin();

  const isAdmin =
    currentUser?.role ===
    "admin";

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    form,
    setForm,
  ] = useState(initialForm);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  // ======================================================
  // CHARGER LES MEMBRES
  // ======================================================

  const fetchMembers =
    async () => {
      try {
        setLoading(true);

        const response =
          await API.get(
            "/members",
            {
              params: {
                limit: 1000,
              },
            }
          );

        const data =
          response.data
            ?.data ||
          response.data
            ?.members ||
          [];

        setMembers(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Erreur chargement membres :",
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
            "Impossible de charger les membres"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchMembers();
  }, []);

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const stats =
    useMemo(() => {
      const total =
        members.length;

      const active =
        members.filter(
          (member) =>
            member.status ===
            "active"
        ).length;

      const inactive =
        members.filter(
          (member) =>
            member.status ===
            "inactive"
        ).length;

      const withEmail =
        members.filter(
          (member) =>
            Boolean(
              member.email
            )
        ).length;

      return {
        total,
        active,
        inactive,
        withEmail,
      };
    }, [members]);

  // ======================================================
  // RECHERCHE + FILTRE
  // ======================================================

  const filteredMembers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return members.filter(
        (member) => {
          const matchesStatus =
            statusFilter ===
              "all" ||
            member.status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!value) {
            return true;
          }

          const text = [
            member.firstName,
            member.lastName,
            member.email,
            member.phone,
            member.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(
            value
          );
        }
      );
    }, [
      members,
      search,
      statusFilter,
    ]);

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
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

  const openEditForm = (
    member
  ) => {
    setEditingId(
      member._id
    );

    setForm({
      firstName:
        member.firstName ||
        "",

      lastName:
        member.lastName ||
        "",

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      status:
        member.status ||
        "active",
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

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      toast.warning(
        "Le prénom et le nom sont obligatoires"
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        status:
          form.status,
      };

      if (editingId) {
        await API.put(
          `/members/${editingId}`,
          payload
        );

        toast.success(
          "Membre modifié avec succès"
        );
      } else {
        await API.post(
          "/members",
          payload
        );

        toast.success(
          "Membre ajouté avec succès"
        );
      }

      resetForm();

      await fetchMembers();
    } catch (error) {
      console.error(
        "Erreur enregistrement membre :",
        error
      );

      toast.error(
        error.response
          ?.data
          ?.message ||
          "Impossible d'enregistrer le membre"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // SUPPRESSION
  // ======================================================

  const handleDelete = async (
    id
  ) => {
    if (!isAdmin) {
      toast.error(
        "Seul un administrateur peut supprimer un membre"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer ce membre ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/members/${id}`
      );

      toast.success(
        "Membre supprimé avec succès"
      );

      await fetchMembers();
    } catch (error) {
      console.error(
        "Erreur suppression membre :",
        error
      );

      toast.error(
        error.response
          ?.data
          ?.message ||
          "Impossible de supprimer ce membre"
      );
    }
  };

  // ======================================================
  // INITIALS AVATAR
  // ======================================================

  const getInitials = (
    member
  ) => {
    const first =
      member.firstName
        ?.charAt(0)
        ?.toUpperCase() ||
      "";

    const last =
      member.lastName
        ?.charAt(0)
        ?.toUpperCase() ||
      "";

    return (
      `${first}${last}` ||
      "M"
    );
  };

  return (
    <Layout>
      <div className="management-page">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Membres
            </h1>

            <p className="page-subtitle">
              Gérez les membres
              de votre église,
              leurs coordonnées
              et leur statut.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={
                openCreateForm
              }
            >
              + Ajouter un membre
            </button>
          </div>
        </div>

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total membres
            </div>

            <div className="management-stat-value">
              {stats.total}
            </div>

            <div className="management-stat-description">
              Tous les membres
              enregistrés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Membres actifs
            </div>

            <div className="management-stat-value">
              {stats.active}
            </div>

            <div className="management-stat-description">
              Membres actuellement
              actifs
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Membres inactifs
            </div>

            <div className="management-stat-value">
              {stats.inactive}
            </div>

            <div className="management-stat-description">
              Membres actuellement
              inactifs
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Avec email
            </div>

            <div className="management-stat-value">
              {stats.withEmail}
            </div>

            <div className="management-stat-description">
              Membres avec une
              adresse email
            </div>
          </div>
        </div>

        {/* ==================================================
            CARD TABLE
        ================================================== */}

        <div className="management-card">
          {/* TOOLBAR */}

          <div className="management-toolbar">
            <div className="management-search">
              <span className="management-search-icon">
                🔎
              </span>

              <input
                type="search"
                placeholder="Rechercher un membre..."
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="management-filters">
              <select
                className="management-select"
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  Tous les statuts
                </option>

                <option value="active">
                  Actifs
                </option>

                <option value="inactive">
                  Inactifs
                </option>
              </select>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des
                membres...
              </div>
            </div>
          ) : filteredMembers.length ===
            0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                👥
              </div>

              <h3>
                Aucun membre
                trouvé
              </h3>

              <p>
                Ajoutez un
                nouveau membre
                ou modifiez vos
                critères de
                recherche.
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
                      Email
                    </th>

                    <th>
                      Téléphone
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
                  {filteredMembers.map(
                    (
                      member
                    ) => (
                      <tr
                        key={
                          member._id
                        }
                      >
                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              {getInitials(
                                member
                              )}
                            </div>

                            <div>
                              <div className="person-name">
                                {member.firstName}{" "}
                                {member.lastName}
                              </div>

                              <div className="person-secondary">
                                Membre
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {member.email ||
                            "—"}
                        </td>

                        <td>
                          {member.phone ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              member.status ===
                              "active"
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {member.status ===
                            "active"
                              ? "Actif"
                              : "Inactif"}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() =>
                                openEditForm(
                                  member
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
                                    member._id
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

      {/* ==================================================
          MODAL AJOUT / MODIFICATION
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
              resetForm();
            }
          }}
        >
          <div className="management-modal">
            <div className="management-modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Modifier le membre"
                    : "Ajouter un membre"}
                </h2>

                <p className="page-subtitle">
                  {editingId
                    ? "Modifiez les informations de ce membre."
                    : "Renseignez les informations du nouveau membre."}
                </p>
              </div>

              <button
                type="button"
                className="management-modal-close"
                onClick={
                  resetForm
                }
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="management-modal-body">
                <div className="management-form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Prénom *
                    </label>

                    <input
                      className="form-input"
                      name="firstName"
                      value={
                        form.firstName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Prénom"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Nom *
                    </label>

                    <input
                      className="form-input"
                      name="lastName"
                      value={
                        form.lastName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Nom"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Email
                    </label>

                    <input
                      className="form-input"
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="membre@email.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Téléphone
                    </label>

                    <input
                      className="form-input"
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="06 00 00 00 00"
                    />
                  </div>

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
                      <option value="active">
                        Actif
                      </option>

                      <option value="inactive">
                        Inactif
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="management-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    resetForm
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
                    ? "Enregistrement..."
                    : editingId
                    ? "Enregistrer les modifications"
                    : "Ajouter le membre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}