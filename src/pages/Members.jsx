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

// ======================================================
// CONSTANTES
// ======================================================

const AGE_GROUPS = [
  "0-3",
  "4-6",
  "7-10",
  "11-14",
  "15-17",
  "18+",
  "Non renseigné",
];

const initialForm = {
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  ageGroup: "Non renseigné",
  email: "",
  phone: "",
  address: "",
  membershipType: "Membre",
  membershipDate: "",
  status: "Actif",
};

// ======================================================
// HELPERS
// ======================================================

const normalizeStatus = (
  status
) => {
  if (
    status === "active" ||
    status === "Actif"
  ) {
    return "Actif";
  }

  if (
    status === "inactive" ||
    status === "Inactif"
  ) {
    return "Inactif";
  }

  return "Actif";
};

const calculateAge = (
  birthDate
) => {
  if (!birthDate) {
    return null;
  }

  const birth =
    new Date(birthDate);

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return null;
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const monthDifference =
    today.getMonth() -
    birth.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() <
        birth.getDate()
    )
  ) {
    age -= 1;
  }

  return age >= 0
    ? age
    : null;
};

const getAgeGroupFromAge = (
  age
) => {
  if (
    age === null ||
    typeof age === "undefined"
  ) {
    return "Non renseigné";
  }

  if (age <= 3) {
    return "0-3";
  }

  if (age <= 6) {
    return "4-6";
  }

  if (age <= 10) {
    return "7-10";
  }

  if (age <= 14) {
    return "11-14";
  }

  if (age <= 17) {
    return "15-17";
  }

  return "18+";
};

// ======================================================
// CATÉGORIE DÉMOGRAPHIQUE
// ======================================================

const getPersonCategory = (
  ageGroup
) => {
  if (
    [
      "0-3",
      "4-6",
      "7-10",
      "11-14",
    ].includes(ageGroup)
  ) {
    return "Enfant";
  }

  if (
    ageGroup === "15-17"
  ) {
    return "Adolescent";
  }

  if (
    ageGroup === "18+"
  ) {
    return "Adulte";
  }

  return "Non renseigné";
};

const getPersonCategoryIcon = (
  category
) => {
  switch (category) {
    case "Enfant":
      return "🧒";

    case "Adolescent":
      return "🧑";

    case "Adulte":
      return "👤";

    default:
      return "❔";
  }
};

const formatDateForInput = (
  value
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
};

// ======================================================
// PAGE
// ======================================================

export default function Members() {
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
        : currentUser?.church?.plan ||
            "free"
    );

  const memberLimit =
    getPlanLimit(
      currentPlan,
      "members"
    );

  const isUnlimited =
    memberLimit === null;

  // ======================================================
  // STATES
  // ======================================================

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
    typeFilter,
    setTypeFilter,
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
  // MEMBRES
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
          response.data?.data ||
          response.data?.members ||
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
  // LIMITE
  // ======================================================

  const memberCount =
    members.length;

  const limitReached =
    !isUnlimited &&
    memberCount >=
      memberLimit;

  const remainingMembers =
    isUnlimited
      ? null
      : Math.max(
          memberLimit -
            memberCount,
          0
        );

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
            normalizeStatus(
              member.status
            ) === "Actif"
        ).length;

      const inactive =
        members.filter(
          (member) =>
            normalizeStatus(
              member.status
            ) === "Inactif"
        ).length;

      const visitors =
        members.filter(
          (member) =>
            member.membershipType ===
            "Visiteur"
        ).length;

      const children =
        members.filter(
          (member) => {
            const age =
              calculateAge(
                member.birthDate
              );

            const ageGroup =
              age !== null
                ? getAgeGroupFromAge(
                    age
                  )
                : member.ageGroup ||
                  "Non renseigné";

            return (
              getPersonCategory(
                ageGroup
              ) === "Enfant"
            );
          }
        ).length;

      const teenagers =
        members.filter(
          (member) => {
            const age =
              calculateAge(
                member.birthDate
              );

            const ageGroup =
              age !== null
                ? getAgeGroupFromAge(
                    age
                  )
                : member.ageGroup ||
                  "Non renseigné";

            return (
              getPersonCategory(
                ageGroup
              ) ===
              "Adolescent"
            );
          }
        ).length;

      const adults =
        members.filter(
          (member) => {
            const age =
              calculateAge(
                member.birthDate
              );

            const ageGroup =
              age !== null
                ? getAgeGroupFromAge(
                    age
                  )
                : member.ageGroup ||
                  "Non renseigné";

            return (
              getPersonCategory(
                ageGroup
              ) === "Adulte"
            );
          }
        ).length;

      return {
        total,
        active,
        inactive,
        visitors,
        children,
        teenagers,
        adults,
      };
    }, [members]);

  // ======================================================
  // FILTRES
  // ======================================================

  const filteredMembers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return members.filter(
        (member) => {
          const memberStatus =
            normalizeStatus(
              member.status
            );

          const memberType =
            member.membershipType ||
            "Membre";

          const matchesStatus =
            statusFilter ===
              "all" ||
            memberStatus ===
              statusFilter;

          const matchesType =
            typeFilter ===
              "all" ||
            memberType ===
              typeFilter;

          if (
            !matchesStatus ||
            !matchesType
          ) {
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
            member.gender,
            member.ageGroup,
            memberType,
            memberStatus,
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
      typeFilter,
    ]);

  // ======================================================
  // CATÉGORIE ACTUELLE DU FORMULAIRE
  // ======================================================

  const currentFormCategory =
    getPersonCategory(
      form.ageGroup
    );

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

    if (
      name === "birthDate"
    ) {
      const age =
        calculateAge(value);

      setForm(
        (previous) => ({
          ...previous,

          birthDate:
            value,

          ageGroup:
            value
              ? getAgeGroupFromAge(
                  age
                )
              : "Non renseigné",
        })
      );

      return;
    }

    if (
      name ===
      "membershipType"
    ) {
      setForm(
        (previous) => ({
          ...previous,

          membershipType:
            value,

          membershipDate:
            value ===
            "Visiteur"
              ? ""
              : previous
                  .membershipDate,
        })
      );

      return;
    }

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
        )} autorise au maximum ${memberLimit} membres.`
      );

      return;
    }

    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (
    member
  ) => {
    const birthDate =
      formatDateForInput(
        member.birthDate
      );

    const calculatedAge =
      calculateAge(
        birthDate
      );

    const calculatedAgeGroup =
      calculatedAge !== null
        ? getAgeGroupFromAge(
            calculatedAge
          )
        : member.ageGroup ||
          "Non renseigné";

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

      gender:
        member.gender ||
        "",

      birthDate,

      ageGroup:
        calculatedAgeGroup,

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      address:
        member.address ||
        "",

      membershipType:
        member.membershipType ||
        "Membre",

      membershipDate:
        formatDateForInput(
          member.membershipDate
        ),

      status:
        normalizeStatus(
          member.status
        ),
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

    if (
      !editingId &&
      limitReached
    ) {
      toast.warning(
        `Vous avez atteint la limite de ${memberLimit} membres de votre abonnement ${getPlanName(
          currentPlan
        )}.`
      );

      return;
    }

    try {
      setSaving(true);

      const finalAge =
        calculateAge(
          form.birthDate
        );

      const finalAgeGroup =
        form.birthDate
          ? getAgeGroupFromAge(
              finalAge
            )
          : form.ageGroup;

      const payload = {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        gender:
          form.gender,

        birthDate:
          form.birthDate ||
          null,

        ageGroup:
          finalAgeGroup,

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        address:
          form.address.trim(),

        membershipType:
          form.membershipType,

        membershipDate:
          form.membershipType ===
            "Membre"
            ? form.membershipDate ||
              null
            : null,

        status:
          form.status,
      };

      if (editingId) {
        await API.put(
          `/members/${editingId}`,
          payload
        );

        toast.success(
          "Personne modifiée avec succès"
        );
      } else {
        await API.post(
          "/members",
          payload
        );

        toast.success(
          form.membershipType ===
            "Visiteur"
            ? "Visiteur ajouté avec succès"
            : "Membre ajouté avec succès"
        );
      }

      resetForm();

      await fetchMembers();
    } catch (error) {
      console.error(
        "Erreur enregistrement membre :",
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
            "La limite de membres de votre abonnement est atteinte."
        );

        return;
      }

      toast.error(
        error.response
          ?.data
          ?.message ||
          "Impossible d'enregistrer la personne"
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
        "Seul un administrateur peut supprimer une personne"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer cette personne ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/members/${id}`
      );

      toast.success(
        "Personne supprimée avec succès"
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
          "Impossible de supprimer cette personne"
      );
    }
  };

  // ======================================================
  // INITIALS
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
              Membres
            </h1>

            <p className="page-subtitle">
              Gérez les membres et visiteurs de votre église ainsi que leurs informations démographiques.
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
                : "+ Ajouter une personne"}
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
              Personnes utilisées :{" "}
              {memberCount}
              {" / "}
              {isUnlimited
                ? "Illimité"
                : memberLimit}
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
                  {remainingMembers} personne
                  {remainingMembers >
                  1
                    ? "s"
                    : ""}{" "}
                  restante
                  {remainingMembers >
                  1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>
          )}

          {isUnlimited && (
            <div>
              ✓ Personnes illimitées
            </div>
          )}
        </div>

        {/* STATISTIQUES */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total
            </div>

            <div className="management-stat-value">
              {stats.total}
            </div>

            <div className="management-stat-description">
              Personnes enregistrées
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Adultes
            </div>

            <div className="management-stat-value">
              {stats.adults}
            </div>

            <div className="management-stat-description">
              18 ans et plus
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Enfants
            </div>

            <div className="management-stat-value">
              {stats.children}
            </div>

            <div className="management-stat-description">
              0 à 14 ans
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Adolescents
            </div>

            <div className="management-stat-value">
              {stats.teenagers}
            </div>

            <div className="management-stat-description">
              15 à 17 ans
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="management-card">
          <div className="management-toolbar">

            <div className="management-search">
              <span className="management-search-icon">
                🔎
              </span>

              <input
                type="search"
                placeholder="Rechercher une personne..."
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
                  typeFilter
                }
                onChange={(
                  event
                ) =>
                  setTypeFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  Tous les profils
                </option>

                <option value="Membre">
                  Membres
                </option>

                <option value="Visiteur">
                  Visiteurs
                </option>
              </select>

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

                <option value="Actif">
                  Actifs
                </option>

                <option value="Inactif">
                  Inactifs
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des personnes...
              </div>
            </div>
          ) : filteredMembers.length ===
            0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                👥
              </div>

              <h3>
                Aucune personne trouvée
              </h3>

              <p>
                Ajoutez un membre ou un visiteur.
              </p>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Personne</th>
                    <th>Profil</th>
                    <th>Sexe</th>
                    <th>Catégorie</th>
                    <th>Âge</th>
                    <th>Contact</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map(
                    (member) => {
                      const memberStatus =
                        normalizeStatus(
                          member.status
                        );

                      const memberType =
                        member.membershipType ||
                        "Membre";

                      const age =
                        calculateAge(
                          member.birthDate
                        );

                      const ageGroup =
                        age !== null
                          ? getAgeGroupFromAge(
                              age
                            )
                          : member.ageGroup ||
                            "Non renseigné";

                      const category =
                        getPersonCategory(
                          ageGroup
                        );

                      return (
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
                                  {member.address ||
                                    "Adresse non renseignée"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                memberType ===
                                "Membre"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {
                                memberType
                              }
                            </span>
                          </td>

                          <td>
                            {member.gender ||
                              "—"}
                          </td>

                          <td>
                            <strong>
                              {getPersonCategoryIcon(
                                category
                              )}{" "}
                              {category}
                            </strong>
                          </td>

                          <td>
                            <div>
                              {age !== null
                                ? `${age} ans`
                                : "—"}

                              <div className="person-secondary">
                                {ageGroup}
                              </div>
                            </div>
                          </td>

                          <td>
                            <div>
                              {member.phone ||
                                "—"}

                              {member.email && (
                                <div className="person-secondary">
                                  {
                                    member.email
                                  }
                                </div>
                              )}
                            </div>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                memberStatus ===
                                "Actif"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {
                                memberStatus
                              }
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
          MODAL
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
                    ? "Modifier la personne"
                    : "Ajouter une personne"}
                </h2>

                <p className="page-subtitle">
                  Renseignez les informations nécessaires aux statistiques et au suivi pastoral.
                </p>
              </div>

              <button
                type="button"
                className="management-modal-close"
                onClick={
                  resetForm
                }
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
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Profil *
                    </label>

                    <select
                      className="form-select"
                      name="membershipType"
                      value={
                        form.membershipType
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Membre">
                        Membre
                      </option>

                      <option value="Visiteur">
                        Visiteur
                      </option>
                    </select>
                  </div>

                  {/* SEXE */}

                  <div className="form-group">
                    <label className="form-label">
                      Sexe
                    </label>

                    <select
                      className="form-select"
                      name="gender"
                      value={
                        form.gender
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        Non renseigné
                      </option>

                      <option value="Homme">
                        Homme / Garçon
                      </option>

                      <option value="Femme">
                        Femme / Fille
                      </option>
                    </select>

                    <div className="person-secondary">
                      Pour un enfant : choisissez Garçon ou Fille. La catégorie Enfant est calculée avec son âge.
                    </div>
                  </div>

                  {/* DATE DE NAISSANCE */}

                  <div className="form-group">
                    <label className="form-label">
                      Date de naissance
                    </label>

                    <input
                      className="form-input"
                      type="date"
                      name="birthDate"
                      value={
                        form.birthDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                    {form.birthDate && (
                      <div className="person-secondary">
                        Âge actuel :{" "}
                        {calculateAge(
                          form.birthDate
                        ) ?? "—"}{" "}
                        ans
                      </div>
                    )}
                  </div>

                  {/* TRANCHE */}

                  <div className="form-group">
                    <label className="form-label">
                      Tranche d'âge
                    </label>

                    <select
                      className="form-select"
                      name="ageGroup"
                      value={
                        form.ageGroup
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        Boolean(
                          form.birthDate
                        )
                      }
                    >
                      {AGE_GROUPS.map(
                        (group) => (
                          <option
                            key={
                              group
                            }
                            value={
                              group
                            }
                          >
                            {group ===
                            "18+"
                              ? "18 ans et +"
                              : group ===
                                "Non renseigné"
                              ? "Non renseigné"
                              : `${group} ans`}
                          </option>
                        )
                      )}
                    </select>

                    {form.birthDate && (
                      <div className="person-secondary">
                        Calculée automatiquement depuis la date de naissance.
                      </div>
                    )}
                  </div>

                  {/* CATÉGORIE AUTOMATIQUE */}

                  <div className="form-group form-group-full">
                    <div
                      style={{
                        padding:
                          "14px 16px",

                        borderRadius:
                          "12px",

                        border:
                          "1px solid rgba(99, 102, 241, 0.18)",

                        background:
                          "rgba(99, 102, 241, 0.05)",
                      }}
                    >
                      <strong>
                        {getPersonCategoryIcon(
                          currentFormCategory
                        )}{" "}
                        Catégorie :{" "}
                        {
                          currentFormCategory
                        }
                      </strong>

                      <div
                        className="person-secondary"
                        style={{
                          marginTop:
                            "5px",
                        }}
                      >
                        Enfant : 0–14 ans • Adolescent : 15–17 ans • Adulte : 18 ans et plus.
                      </div>
                    </div>
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
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      Adresse
                    </label>

                    <input
                      className="form-input"
                      name="address"
                      value={
                        form.address
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  {form.membershipType ===
                    "Membre" && (
                    <div className="form-group">
                      <label className="form-label">
                        Date d'intégration
                      </label>

                      <input
                        className="form-input"
                        type="date"
                        name="membershipDate"
                        value={
                          form.membershipDate
                        }
                        onChange={
                          handleChange
                        }
                      />
                    </div>
                  )}

                  <div
                    className={`form-group ${
                      form.membershipType ===
                      "Visiteur"
                        ? "form-group-full"
                        : ""
                    }`}
                  >
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
                      <option value="Actif">
                        Actif
                      </option>

                      <option value="Inactif">
                        Inactif
                      </option>
                    </select>
                  </div>

                  {form.membershipType ===
                    "Visiteur" && (
                    <div className="form-group form-group-full">
                      <div
                        style={{
                          padding:
                            "12px 14px",

                          borderRadius:
                            "10px",

                          border:
                            "1px solid rgba(99, 102, 241, 0.2)",

                          background:
                            "rgba(99, 102, 241, 0.06)",

                          fontSize:
                            "13px",

                          lineHeight:
                            "1.6",
                        }}
                      >
                        👋 Les présences de ce visiteur permettront à ElDior de déterminer automatiquement sa première visite, sa dernière visite et son nombre de visites.
                      </div>
                    </div>
                  )}
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
                    : form.membershipType ===
                      "Visiteur"
                    ? "Ajouter le visiteur"
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