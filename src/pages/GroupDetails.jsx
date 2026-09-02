import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Layout from "../components/Layout";
import API from "../api/axios";

import "./GroupDetails.css";

// ======================================================
// CONSTANTES
// ======================================================

const MEMBER_ROLES = [
  "Membre",
  "Responsable",
  "Assistant",
  "Hôte",
];

const GROUP_TYPES = [
  "Cellule",
  "Groupe de maison",
  "Groupe de croissance",
  "Groupe de jeunes",
  "Groupe de femmes",
  "Groupe d'hommes",
  "Groupe de prière",
  "Groupe de formation",
  "Autre",
];

const GROUP_STATUSES = [
  "Actif",
  "En pause",
  "Inactif",
];

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const MEETING_FREQUENCIES = [
  "Hebdomadaire",
  "Toutes les 2 semaines",
  "Mensuelle",
  "Occasionnelle",
  "Autre",
];

// ======================================================
// HELPERS
// ======================================================

const getFullName = (
  member
) => {
  if (!member) {
    return "Non renseigné";
  }

  return [
    member.firstName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");
};

const getInitials = (
  member
) => {
  if (!member) {
    return "?";
  }

  return [
    member.firstName,
    member.lastName,
  ]
    .filter(Boolean)
    .map((value) =>
      value
        .charAt(0)
        .toUpperCase()
    )
    .slice(0, 2)
    .join("");
};

const formatDate = (
  value
) => {
  if (!value) {
    return "Non renseignée";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
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
    .slice(0, 10);
};

// ======================================================
// PAGE
// ======================================================

export default function GroupDetails() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  // ====================================================
  // DONNÉES
  // ====================================================

  const [
    group,
    setGroup,
  ] = useState(null);

  const [
    churchMembers,
    setChurchMembers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    actionSuccess,
    setActionSuccess,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  // ====================================================
  // MODALS
  // ====================================================

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false);

  const [
    showLeaderModal,
    setShowLeaderModal,
  ] = useState(false);

  const [
    showEditMemberModal,
    setShowEditMemberModal,
  ] = useState(false);

  const [
    showEditGroupModal,
    setShowEditGroupModal,
  ] = useState(false);

  // ====================================================
  // MEMBRE SÉLECTIONNÉ
  // ====================================================

  const [
    selectedMember,
    setSelectedMember,
  ] = useState(null);

  // ====================================================
  // FORMULAIRE AJOUT MEMBRE
  // ====================================================

  const [
    addForm,
    setAddForm,
  ] = useState({
    memberId: "",
    role: "Membre",
    note: "",
  });

  // ====================================================
  // FORMULAIRE PARTICIPATION
  // ====================================================

  const [
    memberEditForm,
    setMemberEditForm,
  ] = useState({
    role: "Membre",
    note: "",
  });

  // ====================================================
  // RESPONSABLE
  // ====================================================

  const [
    selectedLeader,
    setSelectedLeader,
  ] = useState("");

  // ====================================================
  // FORMULAIRE GROUPE
  // ====================================================

  const [
    editGroupForm,
    setEditGroupForm,
  ] = useState({
    name: "",
    type: "Cellule",
    description: "",
    status: "Actif",
    meetingDay: "",
    meetingTime: "",
    meetingFrequency:
      "Hebdomadaire",
    location: "",
    address: "",
    city: "",
    capacity: 0,
    startedAt: "",
    notes: "",
  });

  // ====================================================
  // CHARGEMENT GROUPE
  // ====================================================

  const fetchGroup =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await API.get(
              `/groups/${id}`
            );

          setGroup(
            response.data
              ?.data ||
              null
          );
        } catch (err) {
          console.error(
            "Erreur chargement groupe :",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Impossible de charger cette cellule."
          );
        } finally {
          setLoading(false);
        }
      },
      [id]
    );

  // ====================================================
  // CHARGEMENT MEMBRES ÉGLISE
  // ====================================================

  const fetchChurchMembers =
    useCallback(
      async () => {
        try {
          const response =
            await API.get(
              "/members",
              {
                params: {
                  limit: 100,
                },
              }
            );

          const payload =
            response.data
              ?.data;

          if (
            Array.isArray(
              payload
            )
          ) {
            setChurchMembers(
              payload
            );

            return;
          }

          if (
            Array.isArray(
              payload?.members
            )
          ) {
            setChurchMembers(
              payload.members
            );

            return;
          }

          if (
            Array.isArray(
              response.data
                ?.members
            )
          ) {
            setChurchMembers(
              response.data
                .members
            );

            return;
          }

          setChurchMembers(
            []
          );
        } catch (err) {
          console.error(
            "Erreur membres église :",
            err
          );
        }
      },
      []
    );

  useEffect(() => {
    fetchGroup();
    fetchChurchMembers();
  }, [
    fetchGroup,
    fetchChurchMembers,
  ]);

  // ====================================================
  // DONNÉES DÉRIVÉES
  // ====================================================

  const activeMemberships =
    useMemo(() => {
      return (
        group?.members ||
        []
      ).filter(
        (entry) =>
          entry.isActive !==
            false &&
          entry.member
      );
    }, [group]);

  const activeMemberIds =
    useMemo(() => {
      return new Set(
        activeMemberships.map(
          (entry) =>
            String(
              entry.member
                ._id
            )
        )
      );
    }, [
      activeMemberships,
    ]);

  const availableMembers =
    useMemo(() => {
      return churchMembers.filter(
        (member) =>
          !activeMemberIds.has(
            String(
              member._id
            )
          )
      );
    }, [
      churchMembers,
      activeMemberIds,
    ]);

  const capacity =
    Number(
      group?.capacity
    ) || 0;

  const memberCount =
    activeMemberships.length;

  const occupancy =
    capacity > 0
      ? Math.min(
          Math.round(
            (
              memberCount /
              capacity
            ) * 100
          ),
          100
        )
      : 0;

  const remainingPlaces =
    capacity > 0
      ? Math.max(
          capacity -
            memberCount,
          0
        )
      : null;

  // ====================================================
  // MESSAGES
  // ====================================================

  const showSuccess =
    (message) => {
      setActionSuccess(
        message
      );

      setActionError("");

      window.setTimeout(
        () => {
          setActionSuccess(
            ""
          );
        },
        3500
      );
    };

  // ====================================================
  // MODIFIER LE GROUPE
  // ====================================================

  const openEditGroupModal =
    () => {
      setEditGroupForm({
        name:
          group?.name ||
          "",

        type:
          group?.type ||
          "Cellule",

        description:
          group
            ?.description ||
          "",

        status:
          group?.status ||
          "Actif",

        meetingDay:
          group
            ?.meetingDay ||
          "",

        meetingTime:
          group
            ?.meetingTime ||
          "",

        meetingFrequency:
          group
            ?.meetingFrequency ||
          "Hebdomadaire",

        location:
          group
            ?.location ||
          "",

        address:
          group
            ?.address ||
          "",

        city:
          group?.city ||
          "",

        capacity:
          Number(
            group
              ?.capacity
          ) || 0,

        startedAt:
          formatDateForInput(
            group
              ?.startedAt
          ),

        notes:
          group?.notes ||
          "",
      });

      setActionError("");

      setShowEditGroupModal(
        true
      );
    };

  const handleEditGroupChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setEditGroupForm(
        (previous) => ({
          ...previous,

          [name]:
            value,
        })
      );
    };

  const handleUpdateGroup =
    async (event) => {
      event.preventDefault();

      if (
        !editGroupForm
          .name
          .trim()
      ) {
        setActionError(
          "Le nom du groupe est obligatoire."
        );

        return;
      }

      const newCapacity =
        Number(
          editGroupForm
            .capacity
        ) || 0;

      if (
        newCapacity > 0 &&
        newCapacity <
          memberCount
      ) {
        setActionError(
          `La capacité ne peut pas être inférieure au nombre actuel de membres (${memberCount}).`
        );

        return;
      }

      try {
        setSaving(true);
        setActionError("");

        const response =
          await API.put(
            `/groups/${id}`,
            {
              name:
                editGroupForm
                  .name
                  .trim(),

              type:
                editGroupForm
                  .type,

              description:
                editGroupForm
                  .description
                  .trim(),

              status:
                editGroupForm
                  .status,

              meetingDay:
                editGroupForm
                  .meetingDay,

              meetingTime:
                editGroupForm
                  .meetingTime,

              meetingFrequency:
                editGroupForm
                  .meetingFrequency,

              location:
                editGroupForm
                  .location
                  .trim(),

              address:
                editGroupForm
                  .address
                  .trim(),

              city:
                editGroupForm
                  .city
                  .trim(),

              capacity:
                newCapacity,

              startedAt:
                editGroupForm
                  .startedAt ||
                null,

              notes:
                editGroupForm
                  .notes
                  .trim(),
            }
          );

        setShowEditGroupModal(
          false
        );

        await fetchGroup();

        showSuccess(
          response.data
            ?.message ||
            "Groupe mis à jour avec succès."
        );
      } catch (err) {
        console.error(
          "Erreur modification groupe :",
          err
        );

        setActionError(
          err.response?.data
            ?.message ||
            "Impossible de modifier le groupe."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // AJOUTER MEMBRE
  // ====================================================

  const openAddMemberModal =
    () => {
      setAddForm({
        memberId: "",
        role: "Membre",
        note: "",
      });

      setActionError("");

      setShowAddModal(
        true
      );
    };

  const handleAddMember =
    async (event) => {
      event.preventDefault();

      if (
        !addForm.memberId
      ) {
        setActionError(
          "Sélectionnez une personne."
        );

        return;
      }

      try {
        setSaving(true);
        setActionError("");

        const response =
          await API.post(
            `/groups/${id}/members`,
            addForm
          );

        setShowAddModal(
          false
        );

        await fetchGroup();

        showSuccess(
          response.data
            ?.message ||
            "Personne ajoutée au groupe."
        );
      } catch (err) {
        setActionError(
          err.response?.data
            ?.message ||
            "Impossible d'ajouter cette personne."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // MODIFIER PARTICIPATION
  // ====================================================

  const openMemberEditor =
    (entry) => {
      setSelectedMember(
        entry
      );

      setMemberEditForm({
        role:
          entry.role ||
          "Membre",

        note:
          entry.note ||
          "",
      });

      setActionError("");

      setShowEditMemberModal(
        true
      );
    };

  const handleUpdateMember =
    async (event) => {
      event.preventDefault();

      if (
        !selectedMember
          ?.member?._id
      ) {
        return;
      }

      try {
        setSaving(true);
        setActionError("");

        const response =
          await API.put(
            `/groups/${id}/members/${selectedMember.member._id}`,
            memberEditForm
          );

        setShowEditMemberModal(
          false
        );

        await fetchGroup();

        showSuccess(
          response.data
            ?.message ||
            "Participation mise à jour."
        );
      } catch (err) {
        setActionError(
          err.response?.data
            ?.message ||
            "Impossible de modifier cette participation."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // RETIRER MEMBRE
  // ====================================================

  const handleRemoveMember =
    async (entry) => {
      const memberName =
        getFullName(
          entry.member
        );

      const confirmed =
        window.confirm(
          `Retirer ${memberName} de cette cellule ?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionError("");

        const response =
          await API.delete(
            `/groups/${id}/members/${entry.member._id}`
          );

        await fetchGroup();

        showSuccess(
          response.data
            ?.message ||
            "Personne retirée du groupe."
        );
      } catch (err) {
        setActionError(
          err.response?.data
            ?.message ||
            "Impossible de retirer cette personne."
        );
      }
    };

  // ====================================================
  // RESPONSABLE
  // ====================================================

  const openLeaderModal =
    () => {
      setSelectedLeader(
        group?.leader
          ?._id ||
          ""
      );

      setActionError("");

      setShowLeaderModal(
        true
      );
    };

  const handleSaveLeader =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setActionError("");

        const response =
          await API.put(
            `/groups/${id}`,
            {
              leader:
                selectedLeader ||
                null,
            }
          );

        setShowLeaderModal(
          false
        );

        await fetchGroup();

        showSuccess(
          response.data
            ?.message ||
            "Responsable mis à jour."
        );
      } catch (err) {
        setActionError(
          err.response?.data
            ?.message ||
            "Impossible de modifier le responsable."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <Layout>

        <div className="group-details-loading">

          <div className="group-details-spinner" />

          <strong>
            Chargement de la cellule...
          </strong>

        </div>

      </Layout>
    );
  }

  // ====================================================
  // ERREUR
  // ====================================================

  if (
    error ||
    !group
  ) {
    return (
      <Layout>

        <div className="group-details-error-page">

          <div>
            ⚠️
          </div>

          <h2>
            Cellule indisponible
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/groups"
              )
            }
          >
            ← Retour aux groupes
          </button>

        </div>

      </Layout>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Layout>

      <div className="group-details-page">

        {/* ==================================================
            RETOUR
        ================================================== */}

        <button
          type="button"
          className="group-details-back"
          onClick={() =>
            navigate(
              "/groups"
            )
          }
        >
          ← Groupes & Cellules
        </button>

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="group-details-hero">

          <div className="group-details-hero-main">

            <div className="group-details-logo">
              {group.name
                ?.split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(
                  (word) =>
                    word[0]
                      ?.toUpperCase()
                )
                .join("") ||
                "G"}
            </div>

            <div>

              <div className="group-details-badges">

                <span className="group-details-type">
                  {
                    group.type
                  }
                </span>

                <span
                  className={`group-details-status ${
                    group.status ===
                    "Actif"
                      ? "active"
                      : group.status ===
                          "En pause"
                        ? "paused"
                        : "inactive"
                  }`}
                >
                  {
                    group.status
                  }
                </span>

              </div>

              <h1>
                {
                  group.name
                }
              </h1>

              <p>
                {group.description ||
                  "Aucune description renseignée."}
              </p>

            </div>

          </div>

          <div className="group-details-hero-actions">

            <button
              type="button"
              className="group-details-secondary"
              onClick={
                openLeaderModal
              }
            >
              👤 Responsable
            </button>

            <button
              type="button"
              className="group-details-secondary"
              onClick={
                openEditGroupModal
              }
            >
              ✏️ Modifier le groupe
            </button>

            <button
              type="button"
              className="group-details-primary"
              onClick={
                openAddMemberModal
              }
              disabled={
                group.isFull
              }
            >
              ＋ Ajouter une personne
            </button>

          </div>

        </section>

        {/* ==================================================
            MESSAGES
        ================================================== */}

        {actionSuccess && (
          <div className="group-details-success">
            ✅{" "}
            {
              actionSuccess
            }
          </div>
        )}

        {actionError && (
          <div className="group-details-alert">
            ⚠️{" "}
            {
              actionError
            }
          </div>
        )}

        {/* ==================================================
            KPI
        ================================================== */}

        <section className="group-details-kpis">

          <article>

            <span className="group-details-kpi-icon">
              👥
            </span>

            <div>

              <small>
                Membres actifs
              </small>

              <strong>
                {
                  memberCount
                }
              </strong>

              <p>
                {capacity > 0
                  ? `sur ${capacity} places`
                  : "capacité illimitée"}
              </p>

            </div>

          </article>

          <article>

            <span className="group-details-kpi-icon">
              👤
            </span>

            <div>

              <small>
                Responsable
              </small>

              <strong className="group-details-kpi-name">
                {group.leader
                  ? getFullName(
                      group.leader
                    )
                  : "Non assigné"}
              </strong>

              <p>
                supervision du groupe
              </p>

            </div>

          </article>

          <article>

            <span className="group-details-kpi-icon">
              🗓️
            </span>

            <div>

              <small>
                Rencontre
              </small>

              <strong className="group-details-kpi-name">
                {group.meetingDay ||
                  "Non définie"}
              </strong>

              <p>
                {group.meetingTime ||
                  "Horaire non défini"}
              </p>

            </div>

          </article>

          <article>

            <span className="group-details-kpi-icon">
              📍
            </span>

            <div>

              <small>
                Localisation
              </small>

              <strong className="group-details-kpi-name">
                {group.location ||
                  group.city ||
                  "Non renseignée"}
              </strong>

              <p>
                {group.city ||
                  "Ville non renseignée"}
              </p>

            </div>

          </article>

        </section>

        {/* ==================================================
            CONTENU
        ================================================== */}

        <div className="group-details-grid">

          <div className="group-details-main-column">

            {/* ================================================
                MEMBRES
            ================================================ */}

            <section className="group-details-card">

              <div className="group-details-card-heading">

                <div>

                  <span>
                    COMMUNAUTÉ
                  </span>

                  <h2>
                    Membres de la cellule
                  </h2>

                </div>

                <div className="group-details-member-count">
                  {
                    memberCount
                  }{" "}
                  membre
                  {memberCount >
                  1
                    ? "s"
                    : ""}
                </div>

              </div>

              {activeMemberships.length ===
              0 ? (
                <div className="group-details-empty">

                  <div>
                    👥
                  </div>

                  <h3>
                    Aucun membre
                  </h3>

                  <p>
                    Commencez par intégrer les premières personnes à cette cellule.
                  </p>

                  <button
                    type="button"
                    onClick={
                      openAddMemberModal
                    }
                  >
                    Ajouter une personne
                  </button>

                </div>
              ) : (
                <div className="group-details-member-list">

                  {activeMemberships.map(
                    (
                      entry
                    ) => {
                      const member =
                        entry.member;

                      return (
                        <article
                          key={
                            entry._id
                          }
                          className="group-details-member"
                        >

                          <button
                            type="button"
                            className="group-details-member-profile"
                            onClick={() =>
                              navigate(
                                `/members/${member._id}`
                              )
                            }
                          >

                            <div className="group-details-member-avatar">
                              {
                                getInitials(
                                  member
                                )
                              }
                            </div>

                            <div className="group-details-member-identity">

                              <strong>
                                {
                                  getFullName(
                                    member
                                  )
                                }
                              </strong>

                              <div>

                                <span>
                                  {
                                    member.membershipType ||
                                    "Personne"
                                  }
                                </span>

                                {member.ageGroup && (
                                  <span>
                                    {
                                      member.ageGroup
                                    }
                                  </span>
                                )}

                                {member.spiritualStage && (
                                  <span>
                                    {
                                      member.spiritualStage
                                    }
                                  </span>
                                )}

                              </div>

                            </div>

                          </button>

                          <div className="group-details-member-meta">

                            <div>

                              <small>
                                Rôle
                              </small>

                              <strong>
                                {
                                  entry.role
                                }
                              </strong>

                            </div>

                            <div>

                              <small>
                                Depuis
                              </small>

                              <strong>
                                {
                                  formatDate(
                                    entry.joinedAt
                                  )
                                }
                              </strong>

                            </div>

                          </div>

                          <div className="group-details-member-actions">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/members/${member._id}`
                                )
                              }
                              title="Profil 360°"
                            >
                              👁️
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openMemberEditor(
                                  entry
                                )
                              }
                              title="Modifier"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                handleRemoveMember(
                                  entry
                                )
                              }
                              title="Retirer"
                            >
                              ✕
                            </button>

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>

            {/* ================================================
                LEADERSHIP
            ================================================ */}

            <section className="group-details-card">

              <div className="group-details-card-heading">

                <div>

                  <span>
                    ÉQUIPE DE LEADERSHIP
                  </span>

                  <h2>
                    Responsables & assistants
                  </h2>

                </div>

              </div>

              <div className="group-details-leadership-grid">

                <article className="group-details-leader-card">

                  <div className="group-details-leader-icon">
                    👤
                  </div>

                  <small>
                    RESPONSABLE PRINCIPAL
                  </small>

                  <strong>
                    {group.leader
                      ? getFullName(
                          group.leader
                        )
                      : "Aucun responsable"}
                  </strong>

                  <p>
                    {group.leader
                      ?.email ||
                      "Responsable à désigner"}
                  </p>

                  <button
                    type="button"
                    onClick={
                      openLeaderModal
                    }
                  >
                    Modifier
                  </button>

                </article>

                {group.assistantLeaders
                  ?.length >
                0 ? (
                  group.assistantLeaders.map(
                    (
                      assistant
                    ) => (
                      <article
                        key={
                          assistant._id
                        }
                        className="group-details-leader-card"
                      >

                        <div className="group-details-leader-icon assistant">
                          🤝
                        </div>

                        <small>
                          ASSISTANT
                        </small>

                        <strong>
                          {
                            getFullName(
                              assistant
                            )
                          }
                        </strong>

                        <p>
                          {assistant.email ||
                            assistant.phone ||
                            "Coordonnées non renseignées"}
                        </p>

                      </article>
                    )
                  )
                ) : (
                  <article className="group-details-leader-card muted">

                    <div className="group-details-leader-icon assistant">
                      🤝
                    </div>

                    <small>
                      ASSISTANTS
                    </small>

                    <strong>
                      Aucun assistant
                    </strong>

                    <p>
                      Aucun assistant n'a encore été désigné.
                    </p>

                  </article>
                )}

              </div>

            </section>

          </div>

          {/* ==================================================
              SIDEBAR
          ================================================== */}

          <aside className="group-details-side-column">

            {/* CAPACITÉ */}

            <section className="group-details-card">

              <div className="group-details-side-title">

                <span>
                  📊
                </span>

                <div>

                  <small>
                    SANTÉ DU GROUPE
                  </small>

                  <h3>
                    Capacité
                  </h3>

                </div>

              </div>

              <div className="group-details-capacity-number">

                <strong>
                  {
                    memberCount
                  }
                </strong>

                <span>
                  {capacity > 0
                    ? `/ ${capacity}`
                    : " / ∞"}
                </span>

              </div>

              {capacity > 0 && (
                <>

                  <div className="group-details-progress">

                    <div
                      style={{
                        width: `${occupancy}%`,
                      }}
                    />

                  </div>

                  <div className="group-details-progress-footer">

                    <span>
                      {
                        occupancy
                      }
                      % occupé
                    </span>

                    <span>
                      {
                        remainingPlaces
                      }{" "}
                      place
                      {remainingPlaces >
                      1
                        ? "s"
                        : ""}{" "}
                      disponible
                      {remainingPlaces >
                      1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                </>
              )}

              <button
                type="button"
                className="group-details-inline-edit"
                onClick={
                  openEditGroupModal
                }
              >
                ✏️ Modifier la capacité
              </button>

            </section>

            {/* RENCONTRE */}

            <section className="group-details-card">

              <div className="group-details-side-title">

                <span>
                  🗓️
                </span>

                <div>

                  <small>
                    ORGANISATION
                  </small>

                  <h3>
                    Rencontre
                  </h3>

                </div>

              </div>

              <div className="group-details-information-list">

                <div>
                  <span>
                    Jour
                  </span>

                  <strong>
                    {group.meetingDay ||
                      "Non renseigné"}
                  </strong>
                </div>

                <div>
                  <span>
                    Heure
                  </span>

                  <strong>
                    {group.meetingTime ||
                      "Non renseignée"}
                  </strong>
                </div>

                <div>
                  <span>
                    Fréquence
                  </span>

                  <strong>
                    {group.meetingFrequency ||
                      "Non renseignée"}
                  </strong>
                </div>

                <div>
                  <span>
                    Lieu
                  </span>

                  <strong>
                    {group.location ||
                      "Non renseigné"}
                  </strong>
                </div>

                <div>
                  <span>
                    Ville
                  </span>

                  <strong>
                    {group.city ||
                      "Non renseignée"}
                  </strong>
                </div>

                {group.address && (
                  <div>

                    <span>
                      Adresse
                    </span>

                    <strong>
                      {
                        group.address
                      }
                    </strong>

                  </div>
                )}

              </div>

              <button
                type="button"
                className="group-details-inline-edit"
                onClick={
                  openEditGroupModal
                }
              >
                ✏️ Modifier l'organisation
              </button>

            </section>

            {/* INFORMATIONS */}

            <section className="group-details-card">

              <div className="group-details-side-title">

                <span>
                  🕘
                </span>

                <div>

                  <small>
                    TRAÇABILITÉ
                  </small>

                  <h3>
                    Informations
                  </h3>

                </div>

              </div>

              <div className="group-details-information-list">

                <div>
                  <span>
                    Créé le
                  </span>

                  <strong>
                    {
                      formatDate(
                        group.createdAt
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Créé par
                  </span>

                  <strong>
                    {group.createdBy
                      ?.name ||
                      "Non renseigné"}
                  </strong>
                </div>

                <div>
                  <span>
                    Dernière modification
                  </span>

                  <strong>
                    {
                      formatDate(
                        group.updatedAt
                      )
                    }
                  </strong>
                </div>

                {group.startedAt && (
                  <div>

                    <span>
                      Lancement
                    </span>

                    <strong>
                      {
                        formatDate(
                          group.startedAt
                        )
                      }
                    </strong>

                  </div>
                )}

              </div>

            </section>

            {/* NOTES */}

            {group.notes && (
              <section className="group-details-card">

                <div className="group-details-side-title">

                  <span>
                    📝
                  </span>

                  <div>

                    <small>
                      INTERNE
                    </small>

                    <h3>
                      Notes
                    </h3>

                  </div>

                </div>

                <p className="group-details-notes">
                  {
                    group.notes
                  }
                </p>

              </section>
            )}

          </aside>

        </div>

        {/* ==================================================
            MODAL MODIFIER GROUPE
        ================================================== */}

        {showEditGroupModal && (
          <div className="group-details-modal-overlay">

            <div className="group-details-modal group-details-modal-large">

              <div className="group-details-modal-header">

                <div>

                  <small>
                    PARAMÈTRES DU GROUPE
                  </small>

                  <h2>
                    Modifier la cellule
                  </h2>

                  <p>
                    Mettez à jour l'organisation,
                    la capacité et les informations
                    principales du groupe.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowEditGroupModal(
                      false
                    )
                  }
                >
                  ✕
                </button>

              </div>

              <form
                onSubmit={
                  handleUpdateGroup
                }
              >

                <div className="group-details-edit-grid">

                  <div className="group-details-form-field full">

                    <label>
                      Nom du groupe *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        editGroupForm.name
                      }
                      onChange={
                        handleEditGroupChange
                      }
                      required
                    />

                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Type
                    </label>

                    <select
                      name="type"
                      value={
                        editGroupForm.type
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    >

                      {GROUP_TYPES.map(
                        (type) => (
                          <option
                            key={
                              type
                            }
                            value={
                              type
                            }
                          >
                            {
                              type
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Statut
                    </label>

                    <select
                      name="status"
                      value={
                        editGroupForm.status
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    >

                      {GROUP_STATUSES.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {
                              status
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="group-details-form-field full">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows="3"
                      value={
                        editGroupForm.description
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    />

                  </div>

                  <div className="group-details-form-section full">
                    Organisation des rencontres
                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Jour
                    </label>

                    <select
                      name="meetingDay"
                      value={
                        editGroupForm.meetingDay
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    >

                      <option value="">
                        Non défini
                      </option>

                      {DAYS.map(
                        (day) => (
                          <option
                            key={
                              day
                            }
                            value={
                              day
                            }
                          >
                            {
                              day
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Heure
                    </label>

                    <input
                      type="time"
                      name="meetingTime"
                      value={
                        editGroupForm.meetingTime
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    />

                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Fréquence
                    </label>

                    <select
                      name="meetingFrequency"
                      value={
                        editGroupForm.meetingFrequency
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    >

                      {MEETING_FREQUENCIES.map(
                        (
                          frequency
                        ) => (
                          <option
                            key={
                              frequency
                            }
                            value={
                              frequency
                            }
                          >
                            {
                              frequency
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Capacité maximale
                    </label>

                    <input
                      type="number"
                      min={
                        memberCount
                      }
                      name="capacity"
                      value={
                        editGroupForm.capacity
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    />

                    <small className="group-details-field-help">
                      0 = capacité illimitée. Le groupe contient actuellement{" "}
                      {memberCount}{" "}
                      personne
                      {memberCount >
                      1
                        ? "s"
                        : ""}.
                    </small>

                  </div>

                  <div className="group-details-form-section full">
                    Localisation
                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Lieu
                    </label>

                    <input
                      type="text"
                      name="location"
                      value={
                        editGroupForm.location
                      }
                      onChange={
                        handleEditGroupChange
                      }
                      placeholder="Ex. CIEL"
                    />

                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Ville
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={
                        editGroupForm.city
                      }
                      onChange={
                        handleEditGroupChange
                      }
                      placeholder="Ex. Paris"
                    />

                  </div>

                  <div className="group-details-form-field full">

                    <label>
                      Adresse
                    </label>

                    <input
                      type="text"
                      name="address"
                      value={
                        editGroupForm.address
                      }
                      onChange={
                        handleEditGroupChange
                      }
                      placeholder="Adresse complète"
                    />

                  </div>

                  <div className="group-details-form-field">

                    <label>
                      Date de lancement
                    </label>

                    <input
                      type="date"
                      name="startedAt"
                      value={
                        editGroupForm.startedAt
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    />

                  </div>

                  <div className="group-details-form-field full">

                    <label>
                      Notes internes
                    </label>

                    <textarea
                      name="notes"
                      rows="4"
                      value={
                        editGroupForm.notes
                      }
                      onChange={
                        handleEditGroupChange
                      }
                    />

                  </div>

                </div>

                <div className="group-details-modal-actions">

                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setShowEditGroupModal(
                        false
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Enregistrement..."
                      : "Enregistrer les modifications"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* ==================================================
            MODAL AJOUT MEMBRE
        ================================================== */}

        {showAddModal && (
          <div className="group-details-modal-overlay">

            <div className="group-details-modal">

              <div className="group-details-modal-header">

                <div>

                  <small>
                    COMMUNAUTÉ
                  </small>

                  <h2>
                    Ajouter une personne
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddModal(
                      false
                    )
                  }
                >
                  ✕
                </button>

              </div>

              <form
                onSubmit={
                  handleAddMember
                }
              >

                <label>
                  Personne
                </label>

                <select
                  value={
                    addForm.memberId
                  }
                  onChange={(
                    event
                  ) =>
                    setAddForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        memberId:
                          event.target
                            .value,
                      })
                    )
                  }
                  required
                >

                  <option value="">
                    Sélectionner une personne
                  </option>

                  {availableMembers.map(
                    (
                      member
                    ) => (
                      <option
                        key={
                          member._id
                        }
                        value={
                          member._id
                        }
                      >
                        {getFullName(
                          member
                        )}
                      </option>
                    )
                  )}

                </select>

                <label>
                  Rôle dans le groupe
                </label>

                <select
                  value={
                    addForm.role
                  }
                  onChange={(
                    event
                  ) =>
                    setAddForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        role:
                          event.target
                            .value,
                      })
                    )
                  }
                >

                  {MEMBER_ROLES.map(
                    (role) => (
                      <option
                        key={
                          role
                        }
                        value={
                          role
                        }
                      >
                        {
                          role
                        }
                      </option>
                    )
                  )}

                </select>

                <label>
                  Note
                </label>

                <textarea
                  rows="3"
                  value={
                    addForm.note
                  }
                  onChange={(
                    event
                  ) =>
                    setAddForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        note:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Note facultative..."
                />

                <div className="group-details-modal-actions">

                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setShowAddModal(
                        false
                      )
                    }
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Ajout..."
                      : "Ajouter"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* ==================================================
            MODAL RESPONSABLE
        ================================================== */}

        {showLeaderModal && (
          <div className="group-details-modal-overlay">

            <div className="group-details-modal">

              <div className="group-details-modal-header">

                <div>

                  <small>
                    LEADERSHIP
                  </small>

                  <h2>
                    Responsable principal
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowLeaderModal(
                      false
                    )
                  }
                >
                  ✕
                </button>

              </div>

              <form
                onSubmit={
                  handleSaveLeader
                }
              >

                <label>
                  Responsable
                </label>

                <select
                  value={
                    selectedLeader
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedLeader(
                      event.target
                        .value
                    )
                  }
                >

                  <option value="">
                    Aucun responsable
                  </option>

                  {churchMembers.map(
                    (
                      member
                    ) => (
                      <option
                        key={
                          member._id
                        }
                        value={
                          member._id
                        }
                      >
                        {getFullName(
                          member
                        )}
                      </option>
                    )
                  )}

                </select>

                <div className="group-details-modal-actions">

                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setShowLeaderModal(
                        false
                      )
                    }
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Enregistrement..."
                      : "Enregistrer"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* ==================================================
            MODAL MODIFIER MEMBRE
        ================================================== */}

        {showEditMemberModal &&
          selectedMember && (
            <div className="group-details-modal-overlay">

              <div className="group-details-modal">

                <div className="group-details-modal-header">

                  <div>

                    <small>
                      PARTICIPATION
                    </small>

                    <h2>
                      {getFullName(
                        selectedMember
                          .member
                      )}
                    </h2>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowEditMemberModal(
                        false
                      )
                    }
                  >
                    ✕
                  </button>

                </div>

                <form
                  onSubmit={
                    handleUpdateMember
                  }
                >

                  <label>
                    Rôle
                  </label>

                  <select
                    value={
                      memberEditForm.role
                    }
                    onChange={(
                      event
                    ) =>
                      setMemberEditForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          role:
                            event.target
                              .value,
                        })
                      )
                    }
                  >

                    {MEMBER_ROLES.map(
                      (
                        role
                      ) => (
                        <option
                          key={
                            role
                          }
                          value={
                            role
                          }
                        >
                          {
                            role
                          }
                        </option>
                      )
                    )}

                  </select>

                  <label>
                    Note
                  </label>

                  <textarea
                    rows="4"
                    value={
                      memberEditForm.note
                    }
                    onChange={(
                      event
                    ) =>
                      setMemberEditForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          note:
                            event.target
                              .value,
                        })
                      )
                    }
                  />

                  <div className="group-details-modal-actions">

                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setShowEditMemberModal(
                          false
                        )
                      }
                    >
                      Annuler
                    </button>

                    <button
                      type="submit"
                      className="primary"
                      disabled={
                        saving
                      }
                    >
                      {saving
                        ? "Enregistrement..."
                        : "Enregistrer"}
                    </button>

                  </div>

                </form>

              </div>

            </div>
          )}

      </div>

    </Layout>
  );
}