import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

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

// ======================================================
// FORMULAIRE INITIAL
// ======================================================

const initialForm = {
  name: "",
  description: "",
  status: "active",
  meetingDay: "",
  meetingTime: "",
  location: "",
  notes: "",
};

// ======================================================
// PAGE
// ======================================================

export default function Departments() {
  const navigate =
    useNavigate();

  const currentUser =
    getCurrentAdmin();

  const isAdmin =
    currentUser?.role ===
      "admin" ||
    currentUser?.platformRole ===
      "superadmin";

  // ======================================================
  // ABONNEMENT
  // ======================================================

  const {
    plan,
    initialized,
  } = useSubscription();

  const currentPlan =
    normalizePlan(
      initialized
        ? plan
        : currentUser?.church
            ?.plan ||
            "free"
    );

  const departmentLimit =
    getPlanLimit(
      currentPlan,
      "departments"
    );

  const isUnlimited =
    departmentLimit ===
    null;

  // ======================================================
  // STATES
  // ======================================================

  const [
    departments,
    setDepartments,
  ] = useState([]);

  const [
    backendStats,
    setBackendStats,
  ] = useState(null);

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
  ] = useState(
    initialForm
  );

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

        const [
          departmentsResponse,
          statsResponse,
        ] =
          await Promise.all([
            API.get(
              "/departments",
              {
                params: {
                  limit: 1000,
                },
              }
            ),

            API.get(
              "/departments/stats/all"
            ),
          ]);

        const departmentData =
          departmentsResponse
            .data?.data ||
          departmentsResponse
            .data
            ?.departments ||
          [];

        setDepartments(
          Array.isArray(
            departmentData
          )
            ? departmentData
            : []
        );

        setBackendStats(
          statsResponse.data
            ?.summary ||
            null
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
  // LIMITE ABONNEMENT
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
  // HELPERS
  // ======================================================

  const getPersonName = (
    person
  ) => {
    if (!person) {
      return "";
    }

    if (
      typeof person ===
      "string"
    ) {
      return person;
    }

    const fullName = [
      person.firstName,
      person.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      person.name ||
      person.email ||
      ""
    );
  };

  const getMemberCount = (
    department
  ) => {
    if (
      typeof department
        ?.memberCount ===
      "number"
    ) {
      return department
        .memberCount;
    }

    if (
      typeof department
        ?.totalMembers ===
      "number"
    ) {
      return department
        .totalMembers;
    }

    return (
      department?.members ||
      []
    ).filter(
      (entry) =>
        entry.isActive !==
        false
    ).length;
  };

  const getDepartmentInitial =
    (department) =>
      department?.name
        ?.charAt(0)
        ?.toUpperCase() ||
      "D";

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

      const totalAssignments =
        departments.reduce(
          (
            totalValue,
            department
          ) =>
            totalValue +
            getMemberCount(
              department
            ),
          0
        );

      return {
        total:
          backendStats
            ?.totalDepartments ??
          total,

        active:
          backendStats
            ?.activeDepartments ??
          active,

        inactive:
          backendStats
            ?.inactiveDepartments ??
          inactive,

        withLeader,

        totalAssignments,

        membersInDepartments:
          backendStats
            ?.membersInDepartments ??
          0,

        membersWithoutDepartment:
          backendStats
            ?.membersWithoutDepartment ??
          0,

        totalChurchMembers:
          backendStats
            ?.totalChurchMembers ??
          0,

        coverageRate:
          backendStats
            ?.coverageRate ??
          0,

        averageDepartmentSize:
          backendStats
            ?.averageDepartmentSize ??
          0,
      };
    }, [
      departments,
      backendStats,
    ]);

  // ======================================================
  // RECHERCHE + FILTRES
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

          const leaderName =
            getPersonName(
              department.leader
            );

          const memberNames =
            (
              department.members ||
              []
            )
              .map(
                (entry) =>
                  getPersonName(
                    entry.member
                  )
              )
              .join(" ");

          const text = [
            department.name,
            department.description,
            leaderName,
            department.location,
            department.meetingDay,
            memberNames,
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
    setForm(
      initialForm
    );

    setEditingId(
      null
    );

    setShowForm(
      false
    );
  };

  const openCreateForm =
    () => {
      if (
        limitReached
      ) {
        toast.warning(
          `Limite atteinte : votre abonnement ${getPlanName(
            currentPlan
          )} autorise au maximum ${departmentLimit} départements.`
        );

        return;
      }

      setForm(
        initialForm
      );

      setEditingId(
        null
      );

      setShowForm(
        true
      );
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

      description:
        department.description ||
        "",

      status:
        department.status ||
        "active",

      meetingDay:
        department.meetingDay ||
        "",

      meetingTime:
        department.meetingTime ||
        "",

      location:
        department.location ||
        "",

      notes:
        department.notes ||
        "",
    });

    setShowForm(
      true
    );
  };

  // ======================================================
  // CRÉATION / MODIFICATION
  // ======================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !form.name.trim()
      ) {
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

          description:
            form.description.trim(),

          status:
            form.status,

          meetingDay:
            form.meetingDay.trim(),

          meetingTime:
            form.meetingTime.trim(),

          location:
            form.location.trim(),

          notes:
            form.notes.trim(),
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

  const handleDelete =
    async (
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
              Départements &
              Responsabilités
            </h1>

            <p className="page-subtitle">
              Organisez les équipes,
              responsables et
              responsabilités de votre
              église.
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
            >
              {limitReached
                ? "🔒 Limite atteinte"
                : "+ Nouveau département"}
            </button>
          </div>
        </div>

        {/* ==================================================
            ABONNEMENT
        ================================================== */}

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

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="management-stats-grid">

          <div className="management-stat-card">
            <div className="management-stat-label">
              Départements
            </div>

            <div className="management-stat-value">
              {stats.total}
            </div>

            <div className="management-stat-description">
              {stats.active} actif
              {stats.active !== 1
                ? "s"
                : ""}
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Personnes engagées
            </div>

            <div className="management-stat-value">
              {
                stats.membersInDepartments
              }
            </div>

            <div className="management-stat-description">
              Personnes dans au moins
              un département
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Sans département
            </div>

            <div className="management-stat-value">
              {
                stats.membersWithoutDepartment
              }
            </div>

            <div className="management-stat-description">
              Sur{" "}
              {
                stats.totalChurchMembers
              }{" "}
              membre
              {stats.totalChurchMembers !==
              1
                ? "s"
                : ""}{" "}
              actif
              {stats.totalChurchMembers !==
              1
                ? "s"
                : ""}
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Couverture
            </div>

            <div className="management-stat-value">
              {
                stats.coverageRate
              }
              %
            </div>

            <div className="management-stat-description">
              Membres intégrés dans
              les départements
            </div>
          </div>

        </div>

        {/* ==================================================
            COUVERTURE
        ================================================== */}

        <div
          className="management-card"
          style={{
            marginBottom:
              "20px",
          }}
        >
          <div
            style={{
              padding:
                "20px",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap:
                  "16px",

                flexWrap:
                  "wrap",

                marginBottom:
                  "10px",
              }}
            >
              <div>
                <strong>
                  Engagement dans les
                  départements
                </strong>

                <div className="person-secondary">
                  {
                    stats.membersInDepartments
                  }{" "}
                  personne
                  {stats.membersInDepartments !==
                  1
                    ? "s"
                    : ""}{" "}
                  engagée
                  {stats.membersInDepartments !==
                  1
                    ? "s"
                    : ""}{" "}
                  sur{" "}
                  {
                    stats.totalChurchMembers
                  }
                </div>
              </div>

              <strong>
                {
                  stats.coverageRate
                }
                %
              </strong>
            </div>

            <div
              style={{
                height:
                  "10px",

                borderRadius:
                  "999px",

                background:
                  "rgba(148, 163, 184, 0.18)",

                overflow:
                  "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    Math.max(
                      stats.coverageRate,
                      0
                    ),
                    100
                  )}%`,

                  height:
                    "100%",

                  borderRadius:
                    "999px",

                  background:
                    "currentColor",

                  transition:
                    "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* ==================================================
            LISTE
        ================================================== */}

        <div className="management-card">

          <div className="management-toolbar">

            <div className="management-search">
              <span className="management-search-icon">
                🔎
              </span>

              <input
                type="search"
                placeholder="Rechercher un département, responsable ou personne..."
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
                modifiez vos critères
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
                      Équipe
                    </th>

                    <th>
                      Organisation
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
                    ) => {
                      const leaderName =
                        getPersonName(
                          department.leader
                        );

                      const memberCount =
                        getMemberCount(
                          department
                        );

                      return (
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
                                  {department.description ||
                                    "Département de l'église"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            {leaderName ? (
                              <div>
                                <div className="person-name">
                                  {
                                    leaderName
                                  }
                                </div>

                                <div className="person-secondary">
                                  Responsable
                                  principal
                                </div>
                              </div>
                            ) : (
                              <span className="person-secondary">
                                Non assigné
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="person-name">
                              {
                                memberCount
                              }{" "}
                              personne
                              {memberCount !==
                              1
                                ? "s"
                                : ""}
                            </div>

                            <div className="person-secondary">
                              Équipe active
                            </div>
                          </td>

                          <td>
                            <div>
                              {department.meetingDay ||
                              department.meetingTime ? (
                                <>
                                  <div className="person-name">
                                    {department.meetingDay ||
                                      "Jour non défini"}

                                    {department.meetingTime
                                      ? ` • ${department.meetingTime}`
                                      : ""}
                                  </div>

                                  <div className="person-secondary">
                                    {department.location ||
                                      "Lieu non renseigné"}
                                  </div>
                                </>
                              ) : (
                                <span className="person-secondary">
                                  Non renseigné
                                </span>
                              )}
                            </div>
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
                                className="btn btn-primary btn-small"
                                onClick={() =>
                                  navigate(
                                    `/departments/${department._id}`
                                  )
                                }
                              >
                                👁 Ouvrir
                              </button>

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
                      );
                    }
                  )}
                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* ==================================================
          MODAL CRÉATION / MODIFICATION
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
                    ? "Modifier le département"
                    : "Créer un département"}
                </h2>

                <p className="page-subtitle">
                  {editingId
                    ? "Modifiez l'organisation générale de ce département."
                    : "Créez une nouvelle équipe de service dans votre église."}
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
                      Description
                    </label>

                    <textarea
                      className="form-input"
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Mission et rôle du département..."
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Jour
                    </label>

                    <input
                      className="form-input"
                      name="meetingDay"
                      value={
                        form.meetingDay
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Ex. Samedi"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Heure
                    </label>

                    <input
                      className="form-input"
                      type="time"
                      name="meetingTime"
                      value={
                        form.meetingTime
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

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
                      placeholder="Ex. Salle principale"
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

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Notes internes
                    </label>

                    <textarea
                      className="form-input"
                      name="notes"
                      value={
                        form.notes
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Informations complémentaires..."
                      rows="3"
                    />
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