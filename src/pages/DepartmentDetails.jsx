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
    "Serviteur",
    "Responsable",
    "Assistant",
    "Coordinateur",
  ];
  
  const DEPARTMENT_STATUSES = [
    {
      value: "active",
      label: "Actif",
    },
    {
      value: "inactive",
      label: "Inactif",
    },
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
  
  // ======================================================
  // HELPERS
  // ======================================================
  
  const getFullName = (member) => {
    if (!member) {
      return "Non renseigné";
    }
  
    if (typeof member === "string") {
      return member;
    }
  
    const fullName = [
      member.firstName,
      member.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  
    return (
      fullName ||
      member.name ||
      member.email ||
      "Non renseigné"
    );
  };
  
  const getInitials = (member) => {
    if (!member) {
      return "?";
    }
  
    const firstName =
      member.firstName ||
      member.name ||
      "";
  
    const lastName =
      member.lastName ||
      "";
  
    return [
      firstName,
      lastName,
    ]
      .filter(Boolean)
      .map((value) =>
        value
          .charAt(0)
          .toUpperCase()
      )
      .slice(0, 2)
      .join("") || "?";
  };
  
  const getDepartmentInitials = (name) => {
    if (!name) {
      return "D";
    }
  
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word
          .charAt(0)
          .toUpperCase()
      )
      .join("");
  };
  
  const formatDate = (value) => {
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
  
  const getStatusLabel = (status) => {
    return status === "active"
      ? "Actif"
      : "Inactif";
  };
  
  // ======================================================
  // PAGE
  // ======================================================
  
  export default function DepartmentDetails() {
    const {
      id,
    } = useParams();
  
    const navigate =
      useNavigate();
  
    // ====================================================
    // DONNÉES
    // ====================================================
  
    const [
      department,
      setDepartment,
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
      showEditDepartmentModal,
      setShowEditDepartmentModal,
    ] = useState(false);
  
    // ====================================================
    // MEMBRE SÉLECTIONNÉ
    // ====================================================
  
    const [
      selectedMember,
      setSelectedMember,
    ] = useState(null);
  
    // ====================================================
    // FORMULAIRE AJOUT
    // ====================================================
  
    const [
      addForm,
      setAddForm,
    ] = useState({
      memberId: "",
      role: "Membre",
      responsibility: "",
      note: "",
    });
  
    // ====================================================
    // FORMULAIRE RESPONSABILITÉ
    // ====================================================
  
    const [
      memberEditForm,
      setMemberEditForm,
    ] = useState({
      role: "Membre",
      responsibility: "",
      note: "",
    });
  
    // ====================================================
    // RESPONSABLE PRINCIPAL
    // ====================================================
  
    const [
      selectedLeader,
      setSelectedLeader,
    ] = useState("");
  
    // ====================================================
    // FORMULAIRE DÉPARTEMENT
    // ====================================================
  
    const [
      editDepartmentForm,
      setEditDepartmentForm,
    ] = useState({
      name: "",
      description: "",
      status: "active",
      meetingDay: "",
      meetingTime: "",
      location: "",
      notes: "",
    });
  
    // ====================================================
    // CHARGEMENT DÉPARTEMENT
    // ====================================================
  
    const fetchDepartment =
      useCallback(
        async () => {
          try {
            setLoading(true);
            setError("");
  
            const response =
              await API.get(
                `/departments/${id}`
              );
  
            setDepartment(
              response.data?.data ||
              null
            );
          } catch (err) {
            console.error(
              "Erreur chargement département :",
              err
            );
  
            setError(
              err.response?.data
                ?.message ||
              "Impossible de charger ce département."
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
                    limit: 1000,
                  },
                }
              );
  
            const payload =
              response.data?.data;
  
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
  
            setChurchMembers(
              []
            );
          }
        },
        []
      );
  
    useEffect(() => {
      fetchDepartment();
      fetchChurchMembers();
    }, [
      fetchDepartment,
      fetchChurchMembers,
    ]);
  
    // ====================================================
    // DONNÉES DÉRIVÉES
    // ====================================================
  
    const activeMemberships =
      useMemo(() => {
        return (
          department?.members ||
          []
        ).filter(
          (entry) =>
            entry.isActive !==
              false &&
            entry.member
        );
      }, [
        department,
      ]);
  
    const activeMemberIds =
      useMemo(() => {
        return new Set(
          activeMemberships.map(
            (entry) =>
              String(
                entry.member?._id ||
                entry.member
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
  
    const memberCount =
      activeMemberships.length;
  
    const responsibilitiesCount =
      useMemo(() => {
        return activeMemberships.filter(
          (entry) =>
            Boolean(
              entry.responsibility
                ?.trim()
            )
        ).length;
      }, [
        activeMemberships,
      ]);
  
    const leadershipCount =
      useMemo(() => {
        return activeMemberships.filter(
          (entry) =>
            [
              "Responsable",
              "Assistant",
              "Coordinateur",
            ].includes(
              entry.role
            )
        ).length;
      }, [
        activeMemberships,
      ]);
  
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
    // MODIFIER DÉPARTEMENT
    // ====================================================
  
    const openEditDepartmentModal =
      () => {
        setEditDepartmentForm({
          name:
            department?.name ||
            "",
  
          description:
            department
              ?.description ||
            "",
  
          status:
            department?.status ||
            "active",
  
          meetingDay:
            department
              ?.meetingDay ||
            "",
  
          meetingTime:
            department
              ?.meetingTime ||
            "",
  
          location:
            department
              ?.location ||
            "",
  
          notes:
            department?.notes ||
            "",
        });
  
        setActionError("");
  
        setShowEditDepartmentModal(
          true
        );
      };
  
    const handleEditDepartmentChange =
      (event) => {
        const {
          name,
          value,
        } = event.target;
  
        setEditDepartmentForm(
          (previous) => ({
            ...previous,
            [name]: value,
          })
        );
      };
  
    const handleUpdateDepartment =
      async (event) => {
        event.preventDefault();
  
        if (
          !editDepartmentForm
            .name
            .trim()
        ) {
          setActionError(
            "Le nom du département est obligatoire."
          );
  
          return;
        }
  
        try {
          setSaving(true);
          setActionError("");
  
          const response =
            await API.put(
              `/departments/${id}`,
              {
                name:
                  editDepartmentForm
                    .name
                    .trim(),
  
                description:
                  editDepartmentForm
                    .description
                    .trim(),
  
                status:
                  editDepartmentForm
                    .status,
  
                meetingDay:
                  editDepartmentForm
                    .meetingDay,
  
                meetingTime:
                  editDepartmentForm
                    .meetingTime,
  
                location:
                  editDepartmentForm
                    .location
                    .trim(),
  
                notes:
                  editDepartmentForm
                    .notes
                    .trim(),
              }
            );
  
          setShowEditDepartmentModal(
            false
          );
  
          await fetchDepartment();
  
          showSuccess(
            response.data?.message ||
            "Département mis à jour avec succès."
          );
        } catch (err) {
          console.error(
            "Erreur modification département :",
            err
          );
  
          setActionError(
            err.response?.data
              ?.message ||
            "Impossible de modifier le département."
          );
        } finally {
          setSaving(false);
        }
      };
  
    // ====================================================
    // AJOUTER UNE PERSONNE
    // ====================================================
  
    const openAddMemberModal =
      () => {
        setAddForm({
          memberId: "",
          role: "Membre",
          responsibility: "",
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
              `/departments/${id}/members`,
              {
                memberId:
                  addForm.memberId,
  
                role:
                  addForm.role,
  
                responsibility:
                  addForm.responsibility
                    .trim(),
  
                note:
                  addForm.note
                    .trim(),
              }
            );
  
          setShowAddModal(
            false
          );
  
          await fetchDepartment();
  
          showSuccess(
            response.data?.message ||
            "Personne ajoutée au département."
          );
        } catch (err) {
          console.error(
            "Erreur ajout département :",
            err
          );
  
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
    // MODIFIER RESPONSABILITÉ
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
  
          responsibility:
            entry.responsibility ||
            "",
  
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
              `/departments/${id}/members/${selectedMember.member._id}`,
              {
                role:
                  memberEditForm.role,
  
                responsibility:
                  memberEditForm
                    .responsibility
                    .trim(),
  
                note:
                  memberEditForm
                    .note
                    .trim(),
              }
            );
  
          setShowEditMemberModal(
            false
          );
  
          setSelectedMember(
            null
          );
  
          await fetchDepartment();
  
          showSuccess(
            response.data?.message ||
            "Responsabilité mise à jour."
          );
        } catch (err) {
          console.error(
            "Erreur modification responsabilité :",
            err
          );
  
          setActionError(
            err.response?.data
              ?.message ||
            "Impossible de modifier cette responsabilité."
          );
        } finally {
          setSaving(false);
        }
      };
  
    // ====================================================
    // RETIRER UNE PERSONNE
    // ====================================================
  
    const handleRemoveMember =
      async (entry) => {
        const memberName =
          getFullName(
            entry.member
          );
  
        const confirmed =
          window.confirm(
            `Retirer ${memberName} du département ${department.name} ?`
          );
  
        if (!confirmed) {
          return;
        }
  
        try {
          setActionError("");
  
          const response =
            await API.delete(
              `/departments/${id}/members/${entry.member._id}`
            );
  
          await fetchDepartment();
  
          showSuccess(
            response.data?.message ||
            "Personne retirée du département."
          );
        } catch (err) {
          console.error(
            "Erreur retrait département :",
            err
          );
  
          setActionError(
            err.response?.data
              ?.message ||
            "Impossible de retirer cette personne."
          );
        }
      };
  
    // ====================================================
    // RESPONSABLE PRINCIPAL
    // ====================================================
  
    const openLeaderModal =
      () => {
        setSelectedLeader(
          department?.leader?._id ||
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
              `/departments/${id}`,
              {
                leader:
                  selectedLeader ||
                  null,
              }
            );
  
          setShowLeaderModal(
            false
          );
  
          await fetchDepartment();
  
          showSuccess(
            response.data?.message ||
            "Responsable principal mis à jour."
          );
        } catch (err) {
          console.error(
            "Erreur responsable département :",
            err
          );
  
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
              Chargement du département...
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
      !department
    ) {
      return (
        <Layout>
          <div className="group-details-error-page">
  
            <div>
              ⚠️
            </div>
  
            <h2>
              Département indisponible
            </h2>
  
            <p>
              {error ||
                "Impossible de retrouver ce département."}
            </p>
  
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/departments"
                )
              }
            >
              ← Retour aux départements
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
                "/departments"
              )
            }
          >
            ← Départements & Responsabilités
          </button>
  
          {/* ==================================================
              HERO
          ================================================== */}
  
          <section className="group-details-hero">
  
            <div className="group-details-hero-main">
  
              <div className="group-details-logo">
                {getDepartmentInitials(
                  department.name
                )}
              </div>
  
              <div>
  
                <div className="group-details-badges">
  
                  <span className="group-details-type">
                    Département
                  </span>
  
                  <span
                    className={`group-details-status ${
                      department.status ===
                      "active"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {getStatusLabel(
                      department.status
                    )}
                  </span>
  
                </div>
  
                <h1>
                  {department.name}
                </h1>
  
                <p>
                  {department.description ||
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
                  openEditDepartmentModal
                }
              >
                ✏️ Modifier le département
              </button>
  
              <button
                type="button"
                className="group-details-primary"
                onClick={
                  openAddMemberModal
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
              ✅ {actionSuccess}
            </div>
          )}
  
          {actionError && (
            <div className="group-details-alert">
              ⚠️ {actionError}
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
                  Équipe active
                </small>
  
                <strong>
                  {memberCount}
                </strong>
  
                <p>
                  personne
                  {memberCount !== 1
                    ? "s"
                    : ""}{" "}
                  dans le département
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
                  {department.leader
                    ? getFullName(
                        department.leader
                      )
                    : "Non assigné"}
                </strong>
  
                <p>
                  responsable principal
                </p>
  
              </div>
  
            </article>
  
            <article>
  
              <span className="group-details-kpi-icon">
                🧭
              </span>
  
              <div>
  
                <small>
                  Responsabilités
                </small>
  
                <strong>
                  {responsibilitiesCount}
                </strong>
  
                <p>
                  fonction
                  {responsibilitiesCount !==
                  1
                    ? "s"
                    : ""}{" "}
                  renseignée
                  {responsibilitiesCount !==
                  1
                    ? "s"
                    : ""}
                </p>
  
              </div>
  
            </article>
  
            <article>
  
              <span className="group-details-kpi-icon">
                🗓️
              </span>
  
              <div>
  
                <small>
                  Organisation
                </small>
  
                <strong className="group-details-kpi-name">
                  {department.meetingDay ||
                    "Non définie"}
                </strong>
  
                <p>
                  {department.meetingTime ||
                    "Horaire non défini"}
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
                  ÉQUIPE
              ================================================ */}
  
              <section className="group-details-card">
  
                <div className="group-details-card-heading">
  
                  <div>
  
                    <span>
                      ÉQUIPE DE SERVICE
                    </span>
  
                    <h2>
                      Personnes & responsabilités
                    </h2>
  
                  </div>
  
                  <div className="group-details-member-count">
                    {memberCount} personne
                    {memberCount !== 1
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
                      Aucune personne
                    </h3>
  
                    <p>
                      Ajoutez les premières personnes et attribuez-leur leurs responsabilités.
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
                      (entry) => {
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
                                {getInitials(
                                  member
                                )}
                              </div>
  
                              <div className="group-details-member-identity">
  
                                <strong>
                                  {getFullName(
                                    member
                                  )}
                                </strong>
  
                                <div>
  
                                  <span>
                                    {member.membershipType ||
                                      "Personne"}
                                  </span>
  
                                  {member.ageGroup && (
                                    <span>
                                      {member.ageGroup}
                                    </span>
                                  )}
  
                                  {member.spiritualStage && (
                                    <span>
                                      {member.spiritualStage}
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
                                  {entry.role ||
                                    "Membre"}
                                </strong>
  
                              </div>
  
                              <div>
  
                                <small>
                                  Responsabilité
                                </small>
  
                                <strong>
                                  {entry.responsibility ||
                                    "Non renseignée"}
                                </strong>
  
                              </div>
  
                              <div>
  
                                <small>
                                  Depuis
                                </small>
  
                                <strong>
                                  {formatDate(
                                    entry.joinedAt
                                  )}
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
                                title="Modifier la responsabilité"
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
                                title="Retirer du département"
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
                      LEADERSHIP
                    </span>
  
                    <h2>
                      Responsables du département
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
                      {department.leader
                        ? getFullName(
                            department.leader
                          )
                        : "Aucun responsable"}
                    </strong>
  
                    <p>
                      {department.leader
                        ?.email ||
                      department.leader
                        ?.phone ||
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
  
                  <article className="group-details-leader-card">
  
                    <div className="group-details-leader-icon assistant">
                      🧭
                    </div>
  
                    <small>
                      ÉQUIPE DE COORDINATION
                    </small>
  
                    <strong>
                      {leadershipCount} personne
                      {leadershipCount !==
                      1
                        ? "s"
                        : ""}
                    </strong>
  
                    <p>
                      Responsables, assistants et coordinateurs actifs.
                    </p>
  
                  </article>
  
                </div>
  
              </section>
  
            </div>
  
            {/* ==================================================
                SIDEBAR
            ================================================== */}
  
            <aside className="group-details-side-column">
  
              {/* ORGANISATION */}
  
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
                      Fonctionnement
                    </h3>
  
                  </div>
  
                </div>
  
                <div className="group-details-information-list">
  
                  <div>
                    <span>
                      Jour
                    </span>
  
                    <strong>
                      {department.meetingDay ||
                        "Non renseigné"}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Heure
                    </span>
  
                    <strong>
                      {department.meetingTime ||
                        "Non renseignée"}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Lieu
                    </span>
  
                    <strong>
                      {department.location ||
                        "Non renseigné"}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Statut
                    </span>
  
                    <strong>
                      {getStatusLabel(
                        department.status
                      )}
                    </strong>
                  </div>
  
                </div>
  
                <button
                  type="button"
                  className="group-details-inline-edit"
                  onClick={
                    openEditDepartmentModal
                  }
                >
                  ✏️ Modifier l'organisation
                </button>
  
              </section>
  
              {/* RESPONSABILITÉS */}
  
              <section className="group-details-card">
  
                <div className="group-details-side-title">
  
                  <span>
                    🧭
                  </span>
  
                  <div>
  
                    <small>
                      ENGAGEMENT
                    </small>
  
                    <h3>
                      Responsabilités
                    </h3>
  
                  </div>
  
                </div>
  
                <div className="group-details-information-list">
  
                  <div>
                    <span>
                      Équipe active
                    </span>
  
                    <strong>
                      {memberCount}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Fonctions renseignées
                    </span>
  
                    <strong>
                      {responsibilitiesCount}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Leadership
                    </span>
  
                    <strong>
                      {leadershipCount}
                    </strong>
                  </div>
  
                </div>
  
              </section>
  
              {/* TRAÇABILITÉ */}
  
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
                      {formatDate(
                        department.createdAt
                      )}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Créé par
                    </span>
  
                    <strong>
                      {department.createdBy
                        ?.name ||
                        "Non renseigné"}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Dernière modification
                    </span>
  
                    <strong>
                      {formatDate(
                        department.updatedAt
                      )}
                    </strong>
                  </div>
  
                  <div>
                    <span>
                      Modifié par
                    </span>
  
                    <strong>
                      {department.updatedBy
                        ?.name ||
                        "Non renseigné"}
                    </strong>
                  </div>
  
                </div>
  
              </section>
  
              {/* NOTES */}
  
              {department.notes && (
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
                    {department.notes}
                  </p>
  
                </section>
              )}
  
            </aside>
  
          </div>
  
          {/* ==================================================
              MODAL MODIFIER DÉPARTEMENT
          ================================================== */}
  
          {showEditDepartmentModal && (
            <div className="group-details-modal-overlay">
  
              <div className="group-details-modal group-details-modal-large">
  
                <div className="group-details-modal-header">
  
                  <div>
  
                    <small>
                      PARAMÈTRES DU DÉPARTEMENT
                    </small>
  
                    <h2>
                      Modifier le département
                    </h2>
  
                    <p>
                      Mettez à jour les informations et l'organisation du département.
                    </p>
  
                  </div>
  
                  <button
                    type="button"
                    onClick={() =>
                      setShowEditDepartmentModal(
                        false
                      )
                    }
                  >
                    ✕
                  </button>
  
                </div>
  
                <form
                  onSubmit={
                    handleUpdateDepartment
                  }
                >
  
                  <div className="group-details-edit-grid">
  
                    <div className="group-details-form-field full">
  
                      <label>
                        Nom du département *
                      </label>
  
                      <input
                        type="text"
                        name="name"
                        value={
                          editDepartmentForm.name
                        }
                        onChange={
                          handleEditDepartmentChange
                        }
                        required
                      />
  
                    </div>
  
                    <div className="group-details-form-field">
  
                      <label>
                        Statut
                      </label>
  
                      <select
                        name="status"
                        value={
                          editDepartmentForm.status
                        }
                        onChange={
                          handleEditDepartmentChange
                        }
                      >
  
                        {DEPARTMENT_STATUSES.map(
                          (status) => (
                            <option
                              key={
                                status.value
                              }
                              value={
                                status.value
                              }
                            >
                              {status.label}
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
                          editDepartmentForm.description
                        }
                        onChange={
                          handleEditDepartmentChange
                        }
                      />
  
                    </div>
  
                    <div className="group-details-form-section full">
                      Organisation
                    </div>
  
                    <div className="group-details-form-field">
  
                      <label>
                        Jour
                      </label>
  
                      <select
                        name="meetingDay"
                        value={
                          editDepartmentForm.meetingDay
                        }
                        onChange={
                          handleEditDepartmentChange
                        }
                      >
  
                        <option value="">
                          Non défini
                        </option>
  
                        {DAYS.map(
                          (day) => (
                            <option
                              key={day}
                              value={day}
                            >
                              {day}
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
                          editDepartmentForm.meetingTime
                        }
                        onChange={
                          handleEditDepartmentChange
                        }
                      />
  
                    </div>
  
                    <div className="group-details-form-field full">
  
                      <label>
                        Lieu
                      </label>
  
                      <input
                        type="text"
                        name="location"
                        value={
                          editDepartmentForm.location
                        }
                        onChange={
                          handleEditDepartmentChange
                        }
                        placeholder="Ex. Salle principale"
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
                          editDepartmentForm.notes
                        }
                        onChange={
                          handleEditDepartmentChange
                        }
                      />
  
                    </div>
  
                  </div>
  
                  <div className="group-details-modal-actions">
  
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setShowEditDepartmentModal(
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
              MODAL AJOUTER UNE PERSONNE
          ================================================== */}
  
          {showAddModal && (
            <div className="group-details-modal-overlay">
  
              <div className="group-details-modal">
  
                <div className="group-details-modal-header">
  
                  <div>
  
                    <small>
                      ÉQUIPE DE SERVICE
                    </small>
  
                    <h2>
                      Ajouter une personne
                    </h2>
  
                    <p>
                      Affectez une personne au département avec son rôle et sa responsabilité.
                    </p>
  
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
                    onChange={(event) =>
                      setAddForm(
                        (previous) => ({
                          ...previous,
  
                          memberId:
                            event.target.value,
                        })
                      )
                    }
                    required
                  >
  
                    <option value="">
                      Sélectionner une personne
                    </option>
  
                    {availableMembers.map(
                      (member) => (
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
                    Rôle
                  </label>
  
                  <select
                    value={
                      addForm.role
                    }
                    onChange={(event) =>
                      setAddForm(
                        (previous) => ({
                          ...previous,
  
                          role:
                            event.target.value,
                        })
                      )
                    }
                  >
  
                    {MEMBER_ROLES.map(
                      (role) => (
                        <option
                          key={role}
                          value={role}
                        >
                          {role}
                        </option>
                      )
                    )}
  
                  </select>
  
                  <label>
                    Responsabilité précise
                  </label>
  
                  <input
                    type="text"
                    value={
                      addForm.responsibility
                    }
                    onChange={(event) =>
                      setAddForm(
                        (previous) => ({
                          ...previous,
  
                          responsibility:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Ex. Accueil porte principale, Pianiste, Responsable technique..."
                  />
  
                  <label>
                    Note
                  </label>
  
                  <textarea
                    rows="3"
                    value={
                      addForm.note
                    }
                    onChange={(event) =>
                      setAddForm(
                        (previous) => ({
                          ...previous,
  
                          note:
                            event.target.value,
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
                        ? "Ajout..."
                        : "Ajouter au département"}
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
  
                    <p>
                      Désignez la personne qui supervise ce département.
                    </p>
  
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
                    onChange={(event) =>
                      setSelectedLeader(
                        event.target.value
                      )
                    }
                  >
  
                    <option value="">
                      Aucun responsable
                    </option>
  
                    {churchMembers.map(
                      (member) => (
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
                        : "Enregistrer"}
                    </button>
  
                  </div>
  
                </form>
  
              </div>
  
            </div>
          )}
  
          {/* ==================================================
              MODAL MODIFIER RESPONSABILITÉ
          ================================================== */}
  
          {showEditMemberModal &&
            selectedMember && (
              <div className="group-details-modal-overlay">
  
                <div className="group-details-modal">
  
                  <div className="group-details-modal-header">
  
                    <div>
  
                      <small>
                        RESPONSABILITÉ
                      </small>
  
                      <h2>
                        {getFullName(
                          selectedMember.member
                        )}
                      </h2>
  
                      <p>
                        Modifiez son rôle ou sa fonction dans le département.
                      </p>
  
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
                      onChange={(event) =>
                        setMemberEditForm(
                          (previous) => ({
                            ...previous,
  
                            role:
                              event.target.value,
                          })
                        )
                      }
                    >
  
                      {MEMBER_ROLES.map(
                        (role) => (
                          <option
                            key={role}
                            value={role}
                          >
                            {role}
                          </option>
                        )
                      )}
  
                    </select>
  
                    <label>
                      Responsabilité précise
                    </label>
  
                    <input
                      type="text"
                      value={
                        memberEditForm.responsibility
                      }
                      onChange={(event) =>
                        setMemberEditForm(
                          (previous) => ({
                            ...previous,
  
                            responsibility:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Ex. Coordination de l'accueil principal"
                    />
  
                    <label>
                      Note
                    </label>
  
                    <textarea
                      rows="4"
                      value={
                        memberEditForm.note
                      }
                      onChange={(event) =>
                        setMemberEditForm(
                          (previous) => ({
                            ...previous,
  
                            note:
                              event.target.value,
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