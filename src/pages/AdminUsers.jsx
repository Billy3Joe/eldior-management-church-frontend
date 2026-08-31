import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "react-toastify";

import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";

import API from "../api/axios";

import {
  getCurrentAdmin,
} from "../utils/auth";

import {
  getPlanLimit,
  getPlanName,
  normalizePlan,
} from "../utils/subscription";

import {
  useSubscription,
} from "../context/SubscriptionContext";

import "../styles/ManagementPages.css";

export default function AdminUsers() {
  // ======================================================
  // UTILISATEUR CONNECTÉ
  // ======================================================

  const currentUser =
    getCurrentAdmin();

  // ======================================================
  // ABONNEMENT SYNCHRONISÉ
  // ======================================================

  const {
    plan,
    initialized,
  } = useSubscription();

  const currentPlan =
    normalizePlan(
      initialized
        ? plan
        : currentUser?.church?.plan ||
            "free"
    );

  const userLimit =
    getPlanLimit(
      currentPlan,
      "users"
    );

  const isUnlimited =
    userLimit === null;

  // ======================================================
  // STATES
  // ======================================================

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    editingUserId,
    setEditingUserId,
  ] = useState(null);

  const [
    deleteTargetId,
    setDeleteTargetId,
  ] = useState(null);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  // ======================================================
  // FILTRES
  // ======================================================

  const [
    filters,
    setFilters,
  ] = useState({
    search: "",
    role: "",
    isActive: "",
    page: 1,
    limit: 10,
  });

  // ======================================================
  // PAGINATION
  // ======================================================

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    isActive: true,
  });

  // ======================================================
  // CHARGER LES UTILISATEURS
  // ======================================================

  const fetchUsers = async (
    customFilters = filters
  ) => {
    try {
      setLoading(true);

      const query =
        new URLSearchParams();

      if (
        customFilters.search
      ) {
        query.append(
          "search",
          customFilters.search
        );
      }

      if (
        customFilters.role
      ) {
        query.append(
          "role",
          customFilters.role
        );
      }

      if (
        customFilters.isActive !==
        ""
      ) {
        query.append(
          "isActive",
          customFilters.isActive
        );
      }

      query.append(
        "page",
        customFilters.page
      );

      query.append(
        "limit",
        customFilters.limit
      );

      const res =
        await API.get(
          `/users?${query.toString()}`
        );

      setUsers(
        res.data?.data || []
      );

      setPagination({
        page:
          res.data?.page || 1,

        totalPages:
          res.data
            ?.totalPages || 1,

        total:
          res.data?.total || 0,

        limit:
          res.data?.limit || 10,
      });
    } catch (error) {
      console.error(
        "Erreur chargement users :",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Erreur lors du chargement des utilisateurs"
      );
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
  }, [
    filters.page,
    filters.limit,
  ]);

  // ======================================================
  // LIMITE DU PLAN
  // ======================================================

  const totalUsers =
    Number(
      pagination.total || 0
    );

  const limitReached =
    !isUnlimited &&
    totalUsers >= userLimit;

  const remainingUsers =
    isUnlimited
      ? null
      : Math.max(
          userLimit -
            totalUsers,
          0
        );

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const stats =
    useMemo(() => {
      const admins =
        users.filter(
          (user) =>
            user.role ===
            "admin"
        ).length;

      const managers =
        users.filter(
          (user) =>
            user.role ===
            "manager"
        ).length;

      const active =
        users.filter(
          (user) =>
            user.isActive
        ).length;

      const inactive =
        users.filter(
          (user) =>
            !user.isActive
        ).length;

      return {
        admins,
        managers,
        active,
        inactive,
      };
    }, [users]);

  // ======================================================
  // FILTRES
  // ======================================================

  const handleFilterChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFilters(
      (prev) => ({
        ...prev,
        [name]: value,
        page: 1,
      })
    );
  };

  const applyFilters = (
    e
  ) => {
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

    setFilters(
      newFilters
    );

    fetchUsers(
      newFilters
    );
  };

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "admin",
      isActive: true,
    });

    setEditingUserId(
      null
    );
  };

  // ======================================================
  // CRÉER / MODIFIER
  // ======================================================

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (
      !editingUserId &&
      limitReached
    ) {
      toast.warning(
        `Limite atteinte : votre abonnement ${getPlanName(
          currentPlan
        )} autorise au maximum ${userLimit} utilisateurs.`
      );

      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,

        email:
          formData.email
            .trim()
            .toLowerCase(),

        name:
          formData.name.trim(),
      };

      if (
        editingUserId &&
        !payload.password
      ) {
        delete payload.password;
      }

      if (
        editingUserId
      ) {
        await API.put(
          `/users/${editingUserId}`,
          payload
        );

        toast.success(
          "Utilisateur mis à jour avec succès"
        );
      } else {
        await API.post(
          "/users",
          payload
        );

        toast.success(
          "Utilisateur créé avec succès"
        );
      }

      resetForm();

      await fetchUsers(
        filters
      );
    } catch (error) {
      console.error(
        "Erreur enregistrement utilisateur :",
        error
      );

      if (
        error.response
          ?.data
          ?.code ===
        "PLAN_LIMIT_REACHED"
      ) {
        toast.error(
          error.response
            ?.data
            ?.message ||
            "La limite d'utilisateurs de votre abonnement est atteinte."
        );

        return;
      }

      toast.error(
        error.response?.data
          ?.message ||
          "Erreur lors de l'enregistrement de l'utilisateur"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // MODIFIER
  // ======================================================

  const handleEdit = async (
    userId
  ) => {
    try {
      setLoading(true);

      const res =
        await API.get(
          `/users/${userId}`
        );

      const user =
        res.data?.data;

      if (!user) {
        toast.error(
          "Utilisateur introuvable"
        );

        return;
      }

      setEditingUserId(
        user._id
      );

      setFormData({
        name:
          user.name || "",

        email:
          user.email || "",

        password: "",

        role:
          user.role ||
          "admin",

        isActive:
          !!user.isActive,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Impossible de charger cet utilisateur"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // SUPPRESSION
  // ======================================================

  const handleDelete = (
    userId
  ) => {
    setDeleteTargetId(
      userId
    );
  };

  const confirmDelete =
    async () => {
      if (
        !deleteTargetId
      ) {
        return;
      }

      try {
        setDeleteLoading(
          true
        );

        await API.delete(
          `/users/${deleteTargetId}`
        );

        toast.success(
          "Utilisateur supprimé avec succès"
        );

        if (
          editingUserId ===
          deleteTargetId
        ) {
          resetForm();
        }

        setDeleteTargetId(
          null
        );

        await fetchUsers(
          filters
        );
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Erreur lors de la suppression de l'utilisateur"
        );
      } finally {
        setDeleteLoading(
          false
        );
      }
    };

  // ======================================================
  // PAGINATION
  // ======================================================

  const goToPage = (
    page
  ) => {
    if (
      page < 1 ||
      page >
        pagination.totalPages
    ) {
      return;
    }

    setFilters(
      (prev) => ({
        ...prev,
        page,
      })
    );
  };

  // ======================================================
  // INITIALS
  // ======================================================

  const getInitials = (
    name
  ) => {
    if (!name) {
      return "U";
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0] || ""
      )
      .join("")
      .toUpperCase();
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <Layout>
      <div className="management-page">

        {/* HEADER */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Utilisateurs
            </h1>

            <p className="page-subtitle">
              Gérez les administrateurs
              et managers autorisés à
              accéder à votre espace.
            </p>
          </div>
        </div>

        {/* ABONNEMENT */}

        <div
          style={{
            marginBottom:
              "20px",

            padding:
              "14px 18px",

            borderRadius:
              "12px",

            border:
              limitReached
                ? "1px solid rgba(239, 68, 68, 0.25)"
                : "1px solid rgba(99, 102, 241, 0.18)",

            background:
              limitReached
                ? "rgba(239, 68, 68, 0.06)"
                : "rgba(99, 102, 241, 0.05)",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              "16px",

            flexWrap:
              "wrap",
          }}
        >
          <div>
            <strong>
              Utilisateurs utilisés :{" "}
              {totalUsers}
              {" / "}
              {isUnlimited
                ? "Illimité"
                : userLimit}
            </strong>

            <div
              style={{
                marginTop:
                  "4px",

                fontSize:
                  "12px",

                opacity:
                  0.75,
              }}
            >
              Plan{" "}
              {getPlanName(
                currentPlan
              )}
            </div>
          </div>

          {!isUnlimited && (
            <div>
              {limitReached ? (
                <strong>
                  🔒 Limite atteinte
                </strong>
              ) : (
                <span>
                  {
                    remainingUsers
                  }{" "}
                  utilisateur
                  {remainingUsers >
                  1
                    ? "s"
                    : ""}{" "}
                  restant
                  {remainingUsers >
                  1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>
          )}

          {isUnlimited && (
            <div>
              ✓ Utilisateurs
              illimités
            </div>
          )}
        </div>

        {/* STATISTIQUES */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total utilisateurs
            </div>

            <div className="management-stat-value">
              {pagination.total}
            </div>

            <div className="management-stat-description">
              Comptes enregistrés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Administrateurs
            </div>

            <div className="management-stat-value">
              {stats.admins}
            </div>

            <div className="management-stat-description">
              Sur cette page
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Managers
            </div>

            <div className="management-stat-value">
              {stats.managers}
            </div>

            <div className="management-stat-description">
              Sur cette page
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Comptes actifs
            </div>

            <div className="management-stat-value">
              {stats.active}
            </div>

            <div className="management-stat-description">
              {stats.inactive} inactif
              {stats.inactive > 1
                ? "s"
                : ""}
            </div>
          </div>
        </div>

        {/* FORMULAIRE */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                {editingUserId
                  ? "Modifier l'utilisateur"
                  : limitReached
                  ? "Limite d'utilisateurs atteinte"
                  : "Nouvel utilisateur"}
              </h2>

              <p className="page-subtitle">
                {editingUserId
                  ? "Modifiez les informations et les droits de ce compte."
                  : limitReached
                  ? `Votre abonnement ${getPlanName(
                      currentPlan
                    )} autorise au maximum ${userLimit} utilisateurs.`
                  : "Créez un compte administrateur ou manager."}
              </p>
            </div>

            {editingUserId && (
              <span className="status-badge status-warning">
                Mode modification
              </span>
            )}

            {!editingUserId &&
              limitReached && (
                <span className="status-badge status-inactive">
                  🔒 Limite atteinte
                </span>
              )}
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            style={{
              padding: 24,
            }}
          >
            <div className="management-form-grid">

              <div className="form-group">
                <label className="form-label">
                  Nom complet
                </label>

                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Ex : Jean Dupont"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    limitReached &&
                    !editingUserId
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Adresse email
                </label>

                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Ex : jean@email.com"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    limitReached &&
                    !editingUserId
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingUserId
                    ? "Nouveau mot de passe"
                    : "Mot de passe"}
                </label>

                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder={
                    editingUserId
                      ? "Laisser vide pour conserver l'actuel"
                      : "Minimum 6 caractères"
                  }
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  required={
                    !editingUserId &&
                    !limitReached
                  }
                  minLength={
                    formData.password
                      ? 6
                      : undefined
                  }
                  disabled={
                    limitReached &&
                    !editingUserId
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Rôle
                </label>

                <select
                  name="role"
                  className="form-select"
                  value={
                    formData.role
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    limitReached &&
                    !editingUserId
                  }
                >
                  <option value="admin">
                    Administrateur
                  </option>

                  <option value="manager">
                    Manager
                  </option>
                </select>
              </div>

              <div className="form-group form-group-full">
                <label
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap: 12,

                    padding: 16,

                    border:
                      "1px solid #e5e7eb",

                    borderRadius:
                      12,

                    background:
                      "#f8fafc",

                    cursor:
                      limitReached &&
                      !editingUserId
                        ? "not-allowed"
                        : "pointer",

                    opacity:
                      limitReached &&
                      !editingUserId
                        ? 0.6
                        : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      formData.isActive
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      limitReached &&
                      !editingUserId
                    }
                    style={{
                      width: 18,
                      height: 18,
                    }}
                  />

                  <div>
                    <strong
                      style={{
                        display:
                          "block",

                        fontSize:
                          14,
                      }}
                    >
                      Compte actif
                    </strong>

                    <span
                      style={{
                        color:
                          "#64748b",

                        fontSize:
                          12,
                      }}
                    >
                      L'utilisateur
                      pourra se
                      connecter à
                      l'application.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",

                gap: 10,

                marginTop:
                  22,

                flexWrap:
                  "wrap",
              }}
            >
              {editingUserId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    resetForm
                  }
                  disabled={
                    loading
                  }
                >
                  Annuler
                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading ||
                  (limitReached &&
                    !editingUserId)
                }
                style={
                  limitReached &&
                  !editingUserId
                    ? {
                        opacity:
                          0.55,

                        cursor:
                          "not-allowed",
                      }
                    : undefined
                }
              >
                {loading
                  ? editingUserId
                    ? "Modification..."
                    : "Création..."
                  : editingUserId
                  ? "✓ Enregistrer les modifications"
                  : limitReached
                  ? "🔒 Limite atteinte"
                  : "+ Créer l'utilisateur"}
              </button>
            </div>
          </form>
        </div>

        {/* LISTE */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Comptes utilisateurs
              </h2>

              <p className="page-subtitle">
                {pagination.total}{" "}
                utilisateur
                {pagination.total > 1
                  ? "s"
                  : ""}{" "}
                au total
              </p>
            </div>
          </div>

          <form
            className="management-toolbar"
            onSubmit={
              applyFilters
            }
          >
            <div className="management-search">
              <span className="management-search-icon">
                ⌕
              </span>

              <input
                type="text"
                name="search"
                placeholder="Rechercher par nom ou email..."
                value={
                  filters.search
                }
                onChange={
                  handleFilterChange
                }
              />
            </div>

            <div className="management-filters">
              <select
                name="role"
                className="management-select"
                value={
                  filters.role
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  Tous les rôles
                </option>

                <option value="admin">
                  Administrateurs
                </option>

                <option value="manager">
                  Managers
                </option>
              </select>

              <select
                name="isActive"
                className="management-select"
                value={
                  filters.isActive
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  Tous les statuts
                </option>

                <option value="true">
                  Actifs
                </option>

                <option value="false">
                  Inactifs
                </option>
              </select>

              <select
                name="limit"
                className="management-select"
                value={
                  filters.limit
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="5">
                  5 / page
                </option>

                <option value="10">
                  10 / page
                </option>

                <option value="20">
                  20 / page
                </option>

                <option value="50">
                  50 / page
                </option>
              </select>

              <button
                type="submit"
                className="btn btn-primary btn-small"
              >
                Appliquer
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={
                  resetFilters
                }
              >
                Réinitialiser
              </button>
            </div>
          </form>

          {loading &&
          users.length === 0 ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <span>
                Chargement des
                utilisateurs...
              </span>
            </div>
          ) : users.length > 0 ? (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Utilisateur
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Rôle
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
                  {users.map(
                    (user) => (
                      <tr
                        key={
                          user._id
                        }
                      >
                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              {getInitials(
                                user.name
                              )}
                            </div>

                            <div>
                              <div className="person-name">
                                {
                                  user.name
                                }
                              </div>

                              <div className="person-secondary">
                                Compte{" "}
                                {user.role ===
                                "admin"
                                  ? "administrateur"
                                  : "manager"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {
                            user.email
                          }
                        </td>

                        <td>
                          <span
                            className={
                              user.role ===
                              "admin"
                                ? "status-badge status-planned"
                                : "status-badge status-pending"
                            }
                          >
                            {user.role ===
                            "admin"
                              ? "Administrateur"
                              : "Manager"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              user.isActive
                                ? "status-badge status-active"
                                : "status-badge status-inactive"
                            }
                          >
                            {user.isActive
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
                                handleEdit(
                                  user._id
                                )
                              }
                            >
                              Modifier
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-small"
                              onClick={() =>
                                handleDelete(
                                  user._id
                                )
                              }
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="management-empty">
              <div className="management-empty-icon">
                👤
              </div>

              <h3>
                Aucun utilisateur
              </h3>

              <p>
                Aucun compte ne
                correspond aux
                critères sélectionnés.
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  resetFilters
                }
              >
                Réinitialiser les
                filtres
              </button>
            </div>
          )}

          {pagination.totalPages >
            1 && (
            <div className="management-pagination">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() =>
                  goToPage(
                    pagination.page -
                      1
                  )
                }
                disabled={
                  pagination.page <=
                  1
                }
              >
                ← Précédent
              </button>

              <div className="management-pagination-info">
                Page{" "}
                <strong>
                  {
                    pagination.page
                  }
                </strong>{" "}
                sur{" "}
                <strong>
                  {
                    pagination.totalPages
                  }
                </strong>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() =>
                  goToPage(
                    pagination.page +
                      1
                  )
                }
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
              >
                Suivant →
              </button>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={
            !!deleteTargetId
          }
          title="Supprimer cet utilisateur"
          message="Cette action supprimera définitivement l'utilisateur sélectionné. Voulez-vous continuer ?"
          confirmText="Supprimer"
          onConfirm={
            confirmDelete
          }
          onClose={() =>
            setDeleteTargetId(
              null
            )
          }
          loading={
            deleteLoading
          }
        />
      </div>
    </Layout>
  );
}