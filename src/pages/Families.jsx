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
  import API from "../api/axios";
  
  import "../styles/ManagementPages.css";
  import "./Families.css";
  
  // ======================================================
  // CONSTANTES
  // ======================================================
  
  const RELATIONSHIPS = [
    "Père",
    "Mère",
    "Conjoint(e)",
    "Enfant",
    "Tuteur",
    "Responsable du foyer",
    "Autre",
  ];
  
  const initialForm = {
    name: "",
    phone: "",
    address: "",
    notes: "",
    headOfHousehold: "",
    members: [],
  };
  
  // ======================================================
  // HELPERS
  // ======================================================
  
  const getInitials = (
    firstName,
    lastName
  ) => {
    const first =
      firstName?.[0] || "";
  
    const last =
      lastName?.[0] || "";
  
    return (
      `${first}${last}`
        .toUpperCase() ||
      "F"
    );
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
  
  // ======================================================
  // PAGE
  // ======================================================
  
  export default function Families() {
    const navigate =
      useNavigate();
  
    // ======================================================
    // STATES
    // ======================================================
  
    const [
      families,
      setFamilies,
    ] = useState([]);
  
    const [
      members,
      setMembers,
    ] = useState([]);
  
    const [
      stats,
      setStats,
    ] = useState({
      totalFamilies: 0,
      totalPeopleInFamilies: 0,
      averageFamilySize: 0,
      familiesWithHead: 0,
      membersWithoutFamily: 0,
    });
  
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
      showForm,
      setShowForm,
    ] = useState(false);
  
    const [
      editingId,
      setEditingId,
    ] = useState(null);
  
    const [
      form,
      setForm,
    ] = useState(initialForm);
  
    // ======================================================
    // CHARGEMENT
    // ======================================================
  
    const fetchFamilies =
      async () => {
        const response =
          await API.get(
            "/families",
            {
              params: {
                limit: 1000,
              },
            }
          );
  
        const data =
          response.data?.data ||
          [];
  
        setFamilies(
          Array.isArray(data)
            ? data
            : []
        );
      };
  
    const fetchMembers =
      async () => {
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
      };
  
    const fetchStats =
      async () => {
        const response =
          await API.get(
            "/families/stats"
          );
  
        setStats(
          response.data?.data ||
            {
              totalFamilies: 0,
              totalPeopleInFamilies: 0,
              averageFamilySize: 0,
              familiesWithHead: 0,
              membersWithoutFamily: 0,
            }
        );
      };
  
    const fetchAll =
      async () => {
        try {
          setLoading(true);
  
          await Promise.all([
            fetchFamilies(),
            fetchMembers(),
            fetchStats(),
          ]);
        } catch (error) {
          console.error(
            "Erreur chargement familles :",
            error
          );
  
          toast.error(
            error.response
              ?.data
              ?.message ||
              "Impossible de charger les familles"
          );
        } finally {
          setLoading(false);
        }
      };
  
    useEffect(() => {
      fetchAll();
    }, []);
  
    // ======================================================
    // FILTRAGE
    // ======================================================
  
    const filteredFamilies =
      useMemo(() => {
        const value =
          search
            .trim()
            .toLowerCase();
  
        if (!value) {
          return families;
        }
  
        return families.filter(
          (family) => {
            const people =
              family.members
                ?.map(
                  (item) =>
                    `${item.member?.firstName || ""} ${item.member?.lastName || ""}`
                )
                .join(" ") ||
              "";
  
            const text = [
              family.name,
              family.phone,
              family.address,
              people,
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
        families,
        search,
      ]);
  
    // ======================================================
    // MEMBRES DISPONIBLES
    // ======================================================
  
    const availableMembers =
      useMemo(() => {
        return members.filter(
          (member) => {
            if (
              editingId &&
              member.family ===
                editingId
            ) {
              return true;
            }
  
            return !member.family;
          }
        );
      }, [
        members,
        editingId,
      ]);
  
    // ======================================================
    // FORMULAIRE
    // ======================================================
  
    const resetForm = () => {
      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);
    };
  
    const openCreateForm =
      () => {
        setEditingId(null);
        setForm(initialForm);
        setShowForm(true);
      };
  
    const openEditForm =
      (family) => {
        setEditingId(
          family._id
        );
  
        setForm({
          name:
            family.name ||
            "",
  
          phone:
            family.phone ||
            "",
  
          address:
            family.address ||
            "",
  
          notes:
            family.notes ||
            "",
  
          headOfHousehold:
            family
              .headOfHousehold
              ?._id ||
            "",
  
          members:
            Array.isArray(
              family.members
            )
              ? family.members.map(
                  (item) => ({
                    member:
                      item.member
                        ?._id ||
                      "",
  
                    relationship:
                      item.relationship ||
                      "Autre",
                  })
                )
              : [],
        });
  
        setShowForm(true);
      };
  
    const handleChange =
      (event) => {
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
  
    // ======================================================
    // AJOUT / RETRAIT PERSONNE DANS FORMULAIRE
    // ======================================================
  
    const isSelected =
      (memberId) => {
        return form.members.some(
          (item) =>
            item.member ===
            memberId
        );
      };
  
    const toggleMember =
      (memberId) => {
        setForm(
          (previous) => {
            const exists =
              previous.members.some(
                (item) =>
                  item.member ===
                  memberId
              );
  
            if (exists) {
              const updated =
                previous.members.filter(
                  (item) =>
                    item.member !==
                    memberId
                );
  
              return {
                ...previous,
  
                members:
                  updated,
  
                headOfHousehold:
                  previous.headOfHousehold ===
                  memberId
                    ? ""
                    : previous.headOfHousehold,
              };
            }
  
            return {
              ...previous,
  
              members: [
                ...previous.members,
                {
                  member:
                    memberId,
  
                  relationship:
                    "Autre",
                },
              ],
            };
          }
        );
      };
  
    const changeRelationship =
      (
        memberId,
        relationship
      ) => {
        setForm(
          (previous) => ({
            ...previous,
  
            members:
              previous.members.map(
                (item) =>
                  item.member ===
                  memberId
                    ? {
                        ...item,
                        relationship,
                      }
                    : item
              ),
          })
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
            "Le nom de la famille est obligatoire"
          );
  
          return;
        }
  
        try {
          setSaving(true);
  
          if (editingId) {
            await API.put(
              `/families/${editingId}`,
              {
                name:
                  form.name.trim(),
  
                phone:
                  form.phone.trim(),
  
                address:
                  form.address.trim(),
  
                notes:
                  form.notes.trim(),
  
                headOfHousehold:
                  form.headOfHousehold ||
                  null,
              }
            );
  
            const original =
              families.find(
                (family) =>
                  family._id ===
                  editingId
              );
  
            const originalIds =
              new Set(
                (
                  original?.members ||
                  []
                ).map(
                  (item) =>
                    item.member?._id
                )
              );
  
            const formIds =
              new Set(
                form.members.map(
                  (item) =>
                    item.member
                )
              );
  
            // ==================================================
            // AJOUTS
            // ==================================================
  
            for (
              const item of
                form.members
            ) {
              if (
                !originalIds.has(
                  item.member
                )
              ) {
                await API.post(
                  `/families/${editingId}/members`,
                  {
                    memberId:
                      item.member,
  
                    relationship:
                      item.relationship,
                  }
                );
              }
            }
  
            // ==================================================
            // MODIFICATION RÔLES
            // ==================================================
  
            for (
              const item of
                form.members
            ) {
              if (
                originalIds.has(
                  item.member
                )
              ) {
                const old =
                  original.members.find(
                    (entry) =>
                      entry.member
                        ?._id ===
                      item.member
                  );
  
                if (
                  old &&
                  old.relationship !==
                    item.relationship
                ) {
                  await API.put(
                    `/families/${editingId}/members/${item.member}`,
                    {
                      relationship:
                        item.relationship,
                    }
                  );
                }
              }
            }
  
            // ==================================================
            // RETRAITS
            // ==================================================
  
            for (
              const item of
                original?.members ||
                []
            ) {
              const memberId =
                item.member?._id;
  
              if (
                memberId &&
                !formIds.has(
                  memberId
                )
              ) {
                await API.delete(
                  `/families/${editingId}/members/${memberId}`
                );
              }
            }
  
            toast.success(
              "Famille modifiée avec succès"
            );
          } else {
            await API.post(
              "/families",
              {
                name:
                  form.name.trim(),
  
                phone:
                  form.phone.trim(),
  
                address:
                  form.address.trim(),
  
                notes:
                  form.notes.trim(),
  
                headOfHousehold:
                  form.headOfHousehold ||
                  null,
  
                members:
                  form.members,
              }
            );
  
            toast.success(
              "Famille créée avec succès"
            );
          }
  
          resetForm();
  
          await fetchAll();
        } catch (error) {
          console.error(
            "Erreur sauvegarde famille :",
            error
          );
  
          toast.error(
            error.response
              ?.data
              ?.message ||
              "Impossible d'enregistrer la famille"
          );
        } finally {
          setSaving(false);
        }
      };
  
    // ======================================================
    // SUPPRESSION
    // ======================================================
  
    const handleDelete =
      async (family) => {
        const confirmed =
          window.confirm(
            `Supprimer définitivement "${family.name}" ? Les personnes seront détachées du foyer.`
          );
  
        if (!confirmed) {
          return;
        }
  
        try {
          await API.delete(
            `/families/${family._id}`
          );
  
          toast.success(
            "Famille supprimée avec succès"
          );
  
          await fetchAll();
        } catch (error) {
          console.error(
            "Erreur suppression famille :",
            error
          );
  
          toast.error(
            error.response
              ?.data
              ?.message ||
              "Impossible de supprimer la famille"
          );
        }
      };
  
    // ======================================================
    // RENDER
    // ======================================================
  
    return (
      <Layout>
        <div className="management-page families-page">
  
          {/* HEADER */}
  
          <div className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">
                Familles
              </h1>
  
              <p className="page-subtitle">
                Gérez les foyers, les liens familiaux et les relations entre les personnes de votre église.
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
                + Nouvelle famille
              </button>
            </div>
          </div>
  
          {/* STATISTIQUES */}
  
          <div className="management-stats-grid">
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Familles
              </div>
  
              <div className="management-stat-value">
                {
                  stats.totalFamilies
                }
              </div>
  
              <div className="management-stat-description">
                Foyers enregistrés
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Personnes en famille
              </div>
  
              <div className="management-stat-value">
                {
                  stats.totalPeopleInFamilies
                }
              </div>
  
              <div className="management-stat-description">
                Personnes rattachées
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Taille moyenne
              </div>
  
              <div className="management-stat-value">
                {
                  stats.averageFamilySize
                }
              </div>
  
              <div className="management-stat-description">
                Personnes par foyer
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Sans famille
              </div>
  
              <div className="management-stat-value">
                {
                  stats.membersWithoutFamily
                }
              </div>
  
              <div className="management-stat-description">
                Personnes non rattachées
              </div>
            </div>
  
          </div>
  
          {/* TOOLBAR */}
  
          <div className="management-card">
            <div className="management-toolbar">
  
              <div className="management-search">
                <span className="management-search-icon">
                  🔎
                </span>
  
                <input
                  type="search"
                  placeholder="Rechercher une famille..."
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
            </div>
  
            {/* LISTE */}
  
            {loading ? (
              <div className="management-loading">
                <div className="management-spinner" />
  
                <div>
                  Chargement des familles...
                </div>
              </div>
            ) : filteredFamilies.length ===
              0 ? (
              <div className="management-empty">
                <div className="management-empty-icon">
                  👨‍👩‍👧
                </div>
  
                <h3>
                  Aucune famille
                </h3>
  
                <p>
                  Créez votre premier foyer pour relier les personnes de votre église.
                </p>
  
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    openCreateForm
                  }
                >
                  + Créer une famille
                </button>
              </div>
            ) : (
              <div className="families-grid">
  
                {filteredFamilies.map(
                  (family) => {
                    const familyMembers =
                      family.members ||
                      [];
  
                    return (
                      <article
                        key={
                          family._id
                        }
                        className="family-card"
                      >
  
                        <div className="family-card-header">
  
                          <div className="family-card-title">
  
                            <div className="family-home-icon">
                              🏠
                            </div>
  
                            <div>
                              <h3>
                                {
                                  family.name
                                }
                              </h3>
  
                              <p>
                                {
                                  familyMembers.length
                                }{" "}
                                personne
                                {familyMembers.length >
                                1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>
  
                          <span
                            className={`status-badge ${
                              family.isActive
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {family.isActive
                              ? "Actif"
                              : "Inactif"}
                          </span>
  
                        </div>
  
                        <div className="family-card-details">
  
                          <div>
                            <span>
                              Responsable
                            </span>
  
                            <strong>
                              {family
                                .headOfHousehold
                                ? `${family.headOfHousehold.firstName} ${family.headOfHousehold.lastName}`
                                : "Non défini"}
                            </strong>
                          </div>
  
                          <div>
                            <span>
                              Téléphone
                            </span>
  
                            <strong>
                              {family.phone ||
                                "Non renseigné"}
                            </strong>
                          </div>
  
                          <div>
                            <span>
                              Adresse
                            </span>
  
                            <strong>
                              {family.address ||
                                "Non renseignée"}
                            </strong>
                          </div>
  
                        </div>
  
                        <div className="family-members-preview">
  
                          <div className="family-members-preview-title">
                            Membres du foyer
                          </div>
  
                          {familyMembers.length ===
                          0 ? (
                            <div className="family-no-members">
                              Aucun membre
                            </div>
                          ) : (
                            familyMembers
                              .slice(
                                0,
                                4
                              )
                              .map(
                                (
                                  item
                                ) => {
                                  const person =
                                    item.member;
  
                                  if (!person) {
                                    return null;
                                  }
  
                                  const age =
                                    calculateAge(
                                      person.birthDate
                                    );
  
                                  return (
                                    <button
                                      type="button"
                                      key={
                                        person._id
                                      }
                                      className="family-person-preview"
                                      onClick={() =>
                                        navigate(
                                          `/members/${person._id}`
                                        )
                                      }
                                    >
                                      <div className="family-person-avatar">
                                        {getInitials(
                                          person.firstName,
                                          person.lastName
                                        )}
                                      </div>
  
                                      <div className="family-person-text">
  
                                        <strong>
                                          {
                                            person.firstName
                                          }{" "}
                                          {
                                            person.lastName
                                          }
                                        </strong>
  
                                        <span>
                                          {
                                            item.relationship
                                          }
  
                                          {age !==
                                            null &&
                                            ` • ${age} ans`}
                                        </span>
  
                                      </div>
  
                                      <div className="family-person-arrow">
                                        →
                                      </div>
                                    </button>
                                  );
                                }
                              )
                          )}
  
                          {familyMembers.length >
                            4 && (
                            <div className="family-more-members">
                              +{" "}
                              {familyMembers.length -
                                4}{" "}
                              autre
                              {familyMembers.length -
                                4 >
                              1
                                ? "s"
                                : ""}
                            </div>
                          )}
  
                        </div>
  
                        <div className="family-card-actions">
  
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() =>
                              openEditForm(
                                family
                              )
                            }
                          >
                            ✏️ Modifier
                          </button>
  
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            onClick={() =>
                              handleDelete(
                                family
                              )
                            }
                          >
                            🗑️ Supprimer
                          </button>
  
                        </div>
  
                      </article>
                    );
                  }
                )}
  
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
            <div className="management-modal family-modal">
  
              <div className="management-modal-header">
  
                <div>
                  <h2>
                    {editingId
                      ? "Modifier la famille"
                      : "Créer une famille"}
                  </h2>
  
                  <p className="page-subtitle">
                    Rattachez les personnes à un même foyer et définissez leurs liens familiaux.
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
                        Nom du foyer *
                      </label>
  
                      <input
                        className="form-input"
                        name="name"
                        placeholder="Ex. Famille Kamze"
                        value={
                          form.name
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />
                    </div>
  
                    <div className="form-group">
                      <label className="form-label">
                        Téléphone familial
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
                        Adresse du foyer
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
  
                    <div className="form-group form-group-full">
                      <label className="form-label">
                        Notes
                      </label>
  
                      <textarea
                        className="form-input family-textarea"
                        name="notes"
                        rows="3"
                        value={
                          form.notes
                        }
                        onChange={
                          handleChange
                        }
                      />
                    </div>
  
                  </div>
  
                  {/* ==================================================
                      PERSONNES
                  ================================================== */}
  
                  <div className="family-form-section">
  
                    <div className="family-form-section-header">
                      <div>
                        <h3>
                          Membres du foyer
                        </h3>
  
                        <p>
                          Sélectionnez les personnes appartenant à cette famille.
                        </p>
                      </div>
  
                      <span className="family-selection-count">
                        {
                          form.members.length
                        }{" "}
                        sélectionnée
                        {form.members.length >
                        1
                          ? "s"
                          : ""}
                      </span>
                    </div>
  
                    <div className="family-member-selection">
  
                      {availableMembers.length ===
                      0 ? (
                        <div className="family-selection-empty">
                          Toutes les personnes sont déjà rattachées à une famille.
                        </div>
                      ) : (
                        availableMembers.map(
                          (member) => {
                            const selected =
                              isSelected(
                                member._id
                              );
  
                            const current =
                              form.members.find(
                                (item) =>
                                  item.member ===
                                  member._id
                              );
  
                            const age =
                              calculateAge(
                                member.birthDate
                              );
  
                            return (
                              <div
                                key={
                                  member._id
                                }
                                className={`family-select-person ${
                                  selected
                                    ? "selected"
                                    : ""
                                }`}
                              >
  
                                <button
                                  type="button"
                                  className="family-select-person-main"
                                  onClick={() =>
                                    toggleMember(
                                      member._id
                                    )
                                  }
                                >
  
                                  <div className="family-select-check">
                                    {selected
                                      ? "✓"
                                      : ""}
                                  </div>
  
                                  <div className="family-person-avatar">
                                    {getInitials(
                                      member.firstName,
                                      member.lastName
                                    )}
                                  </div>
  
                                  <div className="family-person-text">
  
                                    <strong>
                                      {
                                        member.firstName
                                      }{" "}
                                      {
                                        member.lastName
                                      }
                                    </strong>
  
                                    <span>
                                      {member.membershipType ||
                                        "Membre"}
  
                                      {age !==
                                        null &&
                                        ` • ${age} ans`}
                                    </span>
  
                                  </div>
  
                                </button>
  
                                {selected && (
                                  <select
                                    className="form-select family-role-select"
                                    value={
                                      current
                                        ?.relationship ||
                                      "Autre"
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      changeRelationship(
                                        member._id,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  >
                                    {RELATIONSHIPS.map(
                                      (
                                        relationship
                                      ) => (
                                        <option
                                          key={
                                            relationship
                                          }
                                          value={
                                            relationship
                                          }
                                        >
                                          {
                                            relationship
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>
                                )}
  
                              </div>
                            );
                          }
                        )
                      )}
  
                    </div>
  
                  </div>
  
                  {/* ==================================================
                      RESPONSABLE DU FOYER
                  ================================================== */}
  
                  <div className="family-form-section">
  
                    <div className="family-form-section-header">
                      <div>
                        <h3>
                          Responsable du foyer
                        </h3>
  
                        <p>
                          Choisissez une personne parmi les membres sélectionnés.
                        </p>
                      </div>
                    </div>
  
                    <select
                      className="form-select"
                      name="headOfHousehold"
                      value={
                        form.headOfHousehold
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        Aucun responsable
                      </option>
  
                      {form.members.map(
                        (item) => {
                          const person =
                            members.find(
                              (member) =>
                                member._id ===
                                item.member
                            );
  
                          if (!person) {
                            return null;
                          }
  
                          return (
                            <option
                              key={
                                person._id
                              }
                              value={
                                person._id
                              }
                            >
                              {
                                person.firstName
                              }{" "}
                              {
                                person.lastName
                              }
                            </option>
                          );
                        }
                      )}
                    </select>
  
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
                      : "Créer la famille"}
                  </button>
  
                </div>
  
              </form>
  
            </div>
          </div>
        )}
  
      </Layout>
    );
  }