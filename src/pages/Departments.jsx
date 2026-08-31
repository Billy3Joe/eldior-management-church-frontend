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

import {
  getPlanLimit,
  getPlanName,
  normalizePlan,
} from "../utils/subscription";

import {
  useSubscription,
} from "../context/SubscriptionContext";

const initialForm = {
  name: "",
  leader: "",
  status: "active",
};

export default function Departments() {
  const currentUser =
    getCurrentAdmin();

  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.platformRole ===
      "superadmin";

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

  const departmentLimit =
    getPlanLimit(
      currentPlan,
      "departments"
    );

  const isUnlimited =
    departmentLimit === null;

  // ======================================================
  // STATES
  // ======================================================

  const [
    departments,
    setDepartments,
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
  // CHARGEMENT
  // ======================================================

  const fetchDepartments =
    async () => {
      try {
        setLoading(true);

        const response =
          await API.get(
            "/departments",
            {
              params: {
                limit: 1000,
              },
            }
          );

        const data =
          response.data?.data ||
          response.data
            ?.departments ||
          [];

        setDepartments(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Erreur départements :",
          error
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Impossible de charger les départements"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // ======================================================
  // LIMITE DU PLAN
  // ======================================================

  const departmentCount =
    departments.length;

  const limitReached =
    !isUnlimited &&
    departmentCount >=
      departmentLimit;

  const remainingDepartments =
    isUnlimited
      ? null
      : Math.max(
          departmentLimit -
            departmentCount,
          0
        );

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const stats =
    useMemo(() => {
      const total =
        departments.length;

      const active =
        departments.filter(
          (department) =>
            department.status ===
            "active"
        ).length;

      const inactive =
        departments.filter(
          (department) =>
            department.status ===
            "inactive"
        ).length;

      const withLeader =
        departments.filter(
          (department) =>
            Boolean(
              department.leader
            )
        ).length;

      return {
        total,
        active,
        inactive,
        withLeader,
      };
    }, [departments]);

  // ======================================================
  // RECHERCHE + FILTRE
  // ======================================================

  const filteredDepartments =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return departments.filter(
        (department) => {
          const matchesStatus =
            statusFilter ===
              "all" ||
            department.status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!value) {
            return true;
          }

          const text = [
            department.name,
            department.leader,
            department.status,
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
      departments,
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
    if (limitReached) {
      toast.warning(
        `Limite atteinte : votre abonnement ${getPlanName(
          currentPlan
        )} autorise au maximum ${departmentLimit} départements.`
      );

      return;
    }

    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (
    department
  ) => {
    setEditingId(
      department._id
    );

    setForm({
      name:
        department.name ||
        "",

      leader:
        department.leader ||
        "",

      status:
        department.status ||
        "active",
    });

    setShowForm(true);
  };

  // ======================================================
  // CRÉATION / MODIFICATION
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.warning(
        "Le nom du département est obligatoire"
      );

      return;
    }

    if (
      !editingId &&
      limitReached
    ) {
      toast.warning(
        `Vous avez atteint la limite de ${departmentLimit} départements de votre abonnement ${getPlanName(
          currentPlan
        )}.`
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name:
          form.name.trim(),

        leader:
          form.leader.trim(),

        status:
          form.status,
      };

      if (editingId) {
        await API.put(
          `/departments/${editingId}`,
          payload
        );

        toast.success(
          "Département modifié avec succès"
        );
      } else {
        await API.post(
          "/departments",
          payload
        );

        toast.success(
          "Département créé avec succès"
        );
      }

      resetForm();

      await fetchDepartments();
    } catch (error) {
      console.error(
        "Erreur département :",
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
            "La limite de départements de votre abonnement est atteinte."
        );

        return;
      }

      toast.error(
        error.response?.data
          ?.message ||
          "Impossible d'enregistrer le département"
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
        "Suppression réservée aux administrateurs"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer ce département ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/departments/${id}`
      );

      toast.success(
        "Département supprimé avec succès"
      );

      await fetchDepartments();
    } catch (error) {
      console.error(
        "Erreur suppression département :",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Impossible de supprimer le département"
      );
    }
  };

  // ======================================================
  // INITIAL DU DÉPARTEMENT
  // ======================================================

  const getDepartmentInitial = (
    department
  ) => {
    return (
      department.name
        ?.charAt(0)
        ?.toUpperCase() ||
      "D"
    );
  };

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <Layout>
      <div className="management-page">

        {/* HEADER */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Départements
            </h1>

            <p className="page-subtitle">
              Organisez les différents
              départements de votre
              église et leurs
              responsables.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={
                openCreateForm
              }
              disabled={
                limitReached
              }
              title={
                limitReached
                  ? `Limite de ${departmentLimit} départements atteinte`
                  : "Créer un département"
              }
              style={
                limitReached
                  ? {
                      opacity:
                        0.55,
                      cursor:
                        "not-allowed",
                    }
                  : undefined
              }
            >
              {limitReached
                ? "🔒 Limite atteinte"
                : "+ Nouveau département"}
            </button>
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
              Départements utilisés :{" "}
              {departmentCount}
              {" / "}
              {isUnlimited
                ? "Illimité"
                : departmentLimit}
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
                    remainingDepartments
                  }{" "}
                  département
                  {remainingDepartments >
                  1
                    ? "s"
                    : ""}{" "}
                  restant
                  {remainingDepartments >
                  1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>
          )}

          {isUnlimited && (
            <div>
              ✓ Départements
              illimités
            </div>
          )}
        </div>

        {/* STATISTIQUES */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total départements
            </div>

            <div className="management-stat-value">
              {stats.total}
            </div>

            <div className="management-stat-description">
              Tous les départements
              enregistrés
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Départements actifs
            </div>

            <div className="management-stat-value">
              {stats.active}
            </div>

            <div className="management-stat-description">
              Départements actuellement
              actifs
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Départements inactifs
            </div>

            <div className="management-stat-value">
              {stats.inactive}
            </div>

            <div className="management-stat-description">
              Départements actuellement
              inactifs
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Avec responsable
            </div>

            <div className="management-stat-value">
              {stats.withLeader}
            </div>

            <div className="management-stat-description">
              Départements ayant un
              responsable
            </div>
          </div>
        </div>

        {/* LISTE DES DÉPARTEMENTS */}

        <div className="management-card">

          <div className="management-toolbar">
            <div className="management-search">
              <span className="management-search-icon">
                🔎
              </span>

              <input
                type="search"
                placeholder="Rechercher un département..."
                value={search}
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

          {loading ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des
                départements...
              </div>
            </div>
          ) : filteredDepartments.length ===
            0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                🏢
              </div>

              <h3>
                Aucun département
                trouvé
              </h3>

              <p>
                Créez votre premier
                département ou
                modifiez les critères
                de recherche.
              </p>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Département
                    </th>

                    <th>
                      Responsable
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
                  {filteredDepartments.map(
                    (
                      department
                    ) => (
                      <tr
                        key={
                          department._id
                        }
                      >
                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              {getDepartmentInitial(
                                department
                              )}
                            </div>

                            <div>
                              <div className="person-name">
                                {
                                  department.name
                                }
                              </div>

                              <div className="person-secondary">
                                Département
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {department.leader ? (
                            <div>
                              <div className="person-name">
                                {
                                  department.leader
                                }
                              </div>

                              <div className="person-secondary">
                                Responsable
                              </div>
                            </div>
                          ) : (
                            <span className="person-secondary">
                              Non renseigné
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              department.status ===
                              "active"
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {department.status ===
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
                                  department
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
                                    department._id
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

      {/* MODAL CRÉATION / MODIFICATION */}

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
                    ? "Modifier le département"
                    : "Créer un département"}
                </h2>

                <p className="page-subtitle">
                  {editingId
                    ? "Modifiez les informations de ce département."
                    : "Renseignez les informations du nouveau département."}
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

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Nom du département *
                    </label>

                    <input
                      className="form-input"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Ex. Accueil, Louange, Communication..."
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Responsable
                    </label>

                    <input
                      className="form-input"
                      name="leader"
                      value={
                        form.leader
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Nom du responsable"
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
                    : "Créer le département"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}