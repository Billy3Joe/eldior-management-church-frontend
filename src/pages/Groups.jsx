import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import Layout from "../components/Layout";
  
  import API from "../api/axios";
  
  import "./Groups.css";
  
  // ======================================================
  // CONSTANTES
  // ======================================================
  
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
  
  const MEETING_FREQUENCIES = [
    "Hebdomadaire",
    "Toutes les 2 semaines",
    "Mensuelle",
    "Occasionnelle",
    "Autre",
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
  // FORMULAIRE VIDE
  // ======================================================
  
  const EMPTY_FORM = {
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
  };
  
  // ======================================================
  // HELPERS
  // ======================================================
  
  const getInitials = (
    name = ""
  ) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");
  };
  
  const getLeaderName = (
    leader
  ) => {
    if (!leader) {
      return "Non assigné";
    }
  
    return [
      leader.firstName,
      leader.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  };
  
  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "Actif":
        return "active";
  
      case "En pause":
        return "paused";
  
      case "Inactif":
        return "inactive";
  
      default:
        return "";
    }
  };
  
  // ======================================================
  // PAGE
  // ======================================================
  
  export default function Groups() {
    const navigate =
      useNavigate();
  
    // ====================================================
    // DONNÉES
    // ====================================================
  
    const [
      groups,
      setGroups,
    ] = useState([]);
  
    const [
      stats,
      setStats,
    ] = useState({
      totalGroups: 0,
      activeGroups: 0,
      inactiveGroups: 0,
      pausedGroups: 0,
      totalMembers: 0,
      membersInGroups: 0,
      membersWithoutGroup: 0,
      averageGroupSize: 0,
      coverageRate: 0,
      groupsByType: {},
    });
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      error,
      setError,
    ] = useState("");
  
    // ====================================================
    // FILTRES
    // ====================================================
  
    const [
      search,
      setSearch,
    ] = useState("");
  
    const [
      typeFilter,
      setTypeFilter,
    ] = useState("");
  
    const [
      statusFilter,
      setStatusFilter,
    ] = useState("");
  
    // ====================================================
    // MODAL
    // ====================================================
  
    const [
      showCreateModal,
      setShowCreateModal,
    ] = useState(false);
  
    const [
      form,
      setForm,
    ] = useState(
      EMPTY_FORM
    );
  
    const [
      saving,
      setSaving,
    ] = useState(false);
  
    const [
      formError,
      setFormError,
    ] = useState("");
  
    // ====================================================
    // CHARGEMENT
    // ====================================================
  
    const fetchGroups =
      useCallback(
        async () => {
          try {
            setLoading(true);
            setError("");
  
            const params =
              {};
  
            if (
              search.trim()
            ) {
              params.search =
                search.trim();
            }
  
            if (
              typeFilter
            ) {
              params.type =
                typeFilter;
            }
  
            if (
              statusFilter
            ) {
              params.status =
                statusFilter;
            }
  
            const [
              groupsResponse,
              statsResponse,
            ] =
              await Promise.all([
                API.get(
                  "/groups",
                  {
                    params,
                  }
                ),
  
                API.get(
                  "/groups/stats"
                ),
              ]);
  
            const groupData =
              groupsResponse
                .data?.data ||
              [];
  
            const statsData =
              statsResponse
                .data?.data ||
              {};
  
            setGroups(
              Array.isArray(
                groupData
              )
                ? groupData
                : []
            );
  
            setStats(
              (previous) => ({
                ...previous,
                ...statsData,
              })
            );
          } catch (err) {
            console.error(
              "Erreur chargement groupes :",
              err
            );
  
            setError(
              err.response?.data
                ?.message ||
                "Impossible de charger les groupes."
            );
          } finally {
            setLoading(
              false
            );
          }
        },
        [
          search,
          typeFilter,
          statusFilter,
        ]
      );
  
    useEffect(() => {
      const timer =
        setTimeout(
          () => {
            fetchGroups();
          },
          250
        );
  
      return () =>
        clearTimeout(
          timer
        );
    }, [fetchGroups]);
  
    // ====================================================
    // DONNÉES DÉRIVÉES
    // ====================================================
  
    const hasFilters =
      useMemo(
        () =>
          Boolean(
            search ||
              typeFilter ||
              statusFilter
          ),
        [
          search,
          typeFilter,
          statusFilter,
        ]
      );
  
    // ====================================================
    // FORMULAIRE
    // ====================================================
  
    const handleChange =
      (event) => {
        const {
          name,
          value,
        } = event.target;
  
        setForm(
          (previous) => ({
            ...previous,
  
            [name]:
              value,
          })
        );
      };
  
    const openCreateModal =
      () => {
        setForm({
          ...EMPTY_FORM,
        });
  
        setFormError(
          ""
        );
  
        setShowCreateModal(
          true
        );
      };
  
    const closeCreateModal =
      () => {
        if (saving) {
          return;
        }
  
        setShowCreateModal(
          false
        );
  
        setFormError(
          ""
        );
      };
  
    const handleCreateGroup =
      async (event) => {
        event.preventDefault();
  
        if (
          !form.name.trim()
        ) {
          setFormError(
            "Le nom du groupe est obligatoire."
          );
  
          return;
        }
  
        try {
          setSaving(true);
          setFormError("");
  
          await API.post(
            "/groups",
            {
              ...form,
  
              name:
                form.name.trim(),
  
              description:
                form.description.trim(),
  
              location:
                form.location.trim(),
  
              address:
                form.address.trim(),
  
              city:
                form.city.trim(),
  
              notes:
                form.notes.trim(),
  
              capacity:
                Number(
                  form.capacity
                ) || 0,
  
              startedAt:
                form.startedAt ||
                null,
            }
          );
  
          setShowCreateModal(
            false
          );
  
          setForm({
            ...EMPTY_FORM,
          });
  
          await fetchGroups();
        } catch (err) {
          console.error(
            "Erreur création groupe :",
            err
          );
  
          setFormError(
            err.response?.data
              ?.message ||
              "Impossible de créer le groupe."
          );
        } finally {
          setSaving(
            false
          );
        }
      };
  
    // ====================================================
    // RESET FILTRES
    // ====================================================
  
    const clearFilters =
      () => {
        setSearch("");
        setTypeFilter("");
        setStatusFilter("");
      };
  
    // ====================================================
    // RENDER
    // ====================================================
  
    return (
      <Layout>
        <div className="groups-page">
  
          {/* ===============================================
              HERO
          =============================================== */}
  
          <section className="groups-hero">
  
            <div className="groups-hero-content">
  
              <div className="groups-eyebrow">
                COMMUNAUTÉ & INTÉGRATION
              </div>
  
              <h1>
                Groupes & Cellules
              </h1>
  
              <p>
                Organisez les cellules,
                accompagnez les responsables
                et veillez à ce que chaque
                personne trouve une communauté
                où grandir.
              </p>
  
            </div>
  
            <button
              type="button"
              className="groups-primary-button"
              onClick={
                openCreateModal
              }
            >
              <span>
                ＋
              </span>
  
              Nouveau groupe
            </button>
  
          </section>
  
          {/* ===============================================
              KPI
          =============================================== */}
  
          <section className="groups-kpi-grid">
  
            <article className="groups-kpi-card">
  
              <div className="groups-kpi-icon purple">
                🏘️
              </div>
  
              <div>
                <span>
                  Groupes
                </span>
  
                <strong>
                  {
                    stats.totalGroups
                  }
                </strong>
  
                <small>
                  {
                    stats.activeGroups
                  }{" "}
                  actif
                  {stats.activeGroups >
                  1
                    ? "s"
                    : ""}
                </small>
              </div>
  
            </article>
  
            <article className="groups-kpi-card">
  
              <div className="groups-kpi-icon blue">
                👥
              </div>
  
              <div>
                <span>
                  Personnes intégrées
                </span>
  
                <strong>
                  {
                    stats.membersInGroups
                  }
                </strong>
  
                <small>
                  sur{" "}
                  {
                    stats.totalMembers
                  }{" "}
                  membres actifs
                </small>
              </div>
  
            </article>
  
            <article className="groups-kpi-card">
  
              <div className="groups-kpi-icon orange">
                🧭
              </div>
  
              <div>
                <span>
                  Sans groupe
                </span>
  
                <strong>
                  {
                    stats.membersWithoutGroup
                  }
                </strong>
  
                <small>
                  à accompagner
                </small>
              </div>
  
            </article>
  
            <article className="groups-kpi-card">
  
              <div className="groups-kpi-icon green">
                📈
              </div>
  
              <div>
                <span>
                  Couverture
                </span>
  
                <strong>
                  {
                    stats.coverageRate
                  }
                  %
                </strong>
  
                <small>
                  moyenne{" "}
                  {
                    stats.averageGroupSize
                  }{" "}
                  / groupe
                </small>
              </div>
  
            </article>
  
          </section>
  
          {/* ===============================================
              COUVERTURE
          =============================================== */}
  
          <section className="groups-coverage-card">
  
            <div className="groups-coverage-top">
  
              <div>
                <span className="groups-section-label">
                  INTÉGRATION COMMUNAUTAIRE
                </span>
  
                <h2>
                  Couverture des groupes
                </h2>
              </div>
  
              <strong>
                {
                  stats.coverageRate
                }
                %
              </strong>
  
            </div>
  
            <div className="groups-progress">
  
              <div
                className="groups-progress-value"
                style={{
                  width: `${Math.min(
                    Number(
                      stats.coverageRate
                    ) || 0,
                    100
                  )}%`,
                }}
              />
  
            </div>
  
            <div className="groups-coverage-footer">
  
              <span>
                {
                  stats.membersInGroups
                }{" "}
                personnes dans au moins
                un groupe
              </span>
  
              <span>
                {
                  stats.membersWithoutGroup
                }{" "}
                encore sans groupe
              </span>
  
            </div>
  
          </section>
  
          {/* ===============================================
              BARRE D'OUTILS
          =============================================== */}
  
          <section className="groups-toolbar">
  
            <div className="groups-search">
  
              <span>
                🔎
              </span>
  
              <input
                type="text"
                placeholder="Rechercher un groupe, une ville, un lieu..."
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
              />
  
            </div>
  
            <select
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
              <option value="">
                Tous les types
              </option>
  
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
                    {type}
                  </option>
                )
              )}
            </select>
  
            <select
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
              <option value="">
                Tous les statuts
              </option>
  
              {GROUP_STATUSES.map(
                (status) => (
                  <option
                    key={
                      status
                    }
                    value={
                      status
                    }
                  >
                    {status}
                  </option>
                )
              )}
            </select>
  
            {hasFilters && (
              <button
                type="button"
                className="groups-clear-button"
                onClick={
                  clearFilters
                }
              >
                Réinitialiser
              </button>
            )}
  
          </section>
  
          {/* ===============================================
              ERREUR
          =============================================== */}
  
          {error && (
            <div className="groups-error">
              ⚠️ {error}
            </div>
          )}
  
          {/* ===============================================
              LISTE
          =============================================== */}
  
          <section className="groups-list-section">
  
            <div className="groups-list-heading">
  
              <div>
                <span className="groups-section-label">
                  VOS COMMUNAUTÉS
                </span>
  
                <h2>
                  Groupes de l'église
                </h2>
              </div>
  
              <span className="groups-result-count">
                {
                  groups.length
                }{" "}
                résultat
                {groups.length >
                1
                  ? "s"
                  : ""}
              </span>
  
            </div>
  
            {loading ? (
              <div className="groups-state-card">
                <div className="groups-loader" />
  
                <strong>
                  Chargement des groupes...
                </strong>
              </div>
            ) : groups.length ===
              0 ? (
              <div className="groups-empty-state">
  
                <div className="groups-empty-icon">
                  🏘️
                </div>
  
                <h3>
                  {hasFilters
                    ? "Aucun groupe ne correspond à votre recherche."
                    : "Aucun groupe pour le moment."}
                </h3>
  
                <p>
                  {hasFilters
                    ? "Modifiez vos filtres pour retrouver d'autres groupes."
                    : "Créez votre première cellule pour commencer à organiser la vie communautaire de l'église."}
                </p>
  
                {!hasFilters && (
                  <button
                    type="button"
                    className="groups-primary-button"
                    onClick={
                      openCreateModal
                    }
                  >
                    ＋ Créer un groupe
                  </button>
                )}
  
              </div>
            ) : (
              <div className="groups-grid">
  
                {groups.map(
                  (group) => {
                    const leaderName =
                      getLeaderName(
                        group.leader
                      );
  
                    const memberCount =
                      Number(
                        group.memberCount
                      ) || 0;
  
                    const capacity =
                      Number(
                        group.capacity
                      ) || 0;
  
                    const occupancy =
                      capacity > 0
                        ? Math.min(
                            Math.round(
                              (
                                memberCount /
                                capacity
                              ) *
                                100
                            ),
                            100
                          )
                        : 0;
  
                    return (
                      <article
                        key={
                          group._id
                        }
                        className="group-card"
                      >
  
                        <div className="group-card-top">
  
                          <div className="group-avatar">
                            {getInitials(
                              group.name
                            ) ||
                              "G"}
                          </div>
  
                          <div className="group-card-heading">
  
                            <div className="group-badges">
  
                              <span className="group-type-badge">
                                {
                                  group.type
                                }
                              </span>
  
                              <span
                                className={`group-status-badge ${getStatusClass(
                                  group.status
                                )}`}
                              >
                                {
                                  group.status
                                }
                              </span>
  
                            </div>
  
                            <h3>
                              {
                                group.name
                              }
                            </h3>
  
                            <p>
                              {group.description ||
                                "Aucune description renseignée."}
                            </p>
  
                          </div>
  
                        </div>
  
                        <div className="group-info-grid">
  
                          <div>
                            <span>
                              Responsable
                            </span>
  
                            <strong>
                              {
                                leaderName
                              }
                            </strong>
                          </div>
  
                          <div>
                            <span>
                              Membres
                            </span>
  
                            <strong>
                              {
                                memberCount
                              }
                              {capacity >
                                0 &&
                                ` / ${capacity}`}
                            </strong>
                          </div>
  
                          <div>
                            <span>
                              Rencontre
                            </span>
  
                            <strong>
                              {group.meetingDay ||
                                "Non défini"}
                            </strong>
                          </div>
  
                          <div>
                            <span>
                              Horaire
                            </span>
  
                            <strong>
                              {group.meetingTime ||
                                "—"}
                            </strong>
                          </div>
  
                        </div>
  
                        {capacity >
                          0 && (
                          <div className="group-capacity">
  
                            <div className="group-capacity-header">
  
                              <span>
                                Capacité
                              </span>
  
                              <strong>
                                {
                                  occupancy
                                }
                                %
                              </strong>
  
                            </div>
  
                            <div className="group-capacity-track">
  
                              <div
                                className="group-capacity-value"
                                style={{
                                  width: `${occupancy}%`,
                                }}
                              />
  
                            </div>
  
                          </div>
                        )}
  
                        <div className="group-location">
  
                          <span>
                            📍
                          </span>
  
                          <div>
                            <strong>
                              {group.location ||
                                group.city ||
                                "Lieu non renseigné"}
                            </strong>
  
                            {group.location &&
                              group.city && (
                                <small>
                                  {
                                    group.city
                                  }
                                </small>
                              )}
                          </div>
  
                        </div>
  
                        <div className="group-card-footer">
  
                          <div className="group-frequency">
                            🗓️{" "}
                            {group.meetingFrequency ||
                              "Fréquence non définie"}
                          </div>
  
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/groups/${group._id}`
                              )
                            }
                          >
                            Ouvrir
                            <span>
                              →
                            </span>
                          </button>
  
                        </div>
  
                      </article>
                    );
                  }
                )}
  
              </div>
            )}
  
          </section>
  
          {/* ===============================================
              MODAL CRÉATION
          =============================================== */}
  
          {showCreateModal && (
            <div
              className="groups-modal-overlay"
              onMouseDown={(
                event
              ) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closeCreateModal();
                }
              }}
            >
  
              <div className="groups-modal">
  
                <div className="groups-modal-header">
  
                  <div>
                    <span className="groups-section-label">
                      NOUVELLE COMMUNAUTÉ
                    </span>
  
                    <h2>
                      Créer un groupe
                    </h2>
  
                    <p>
                      Configurez la cellule.
                      Les responsables et les
                      membres pourront ensuite
                      être gérés depuis sa fiche.
                    </p>
                  </div>
  
                  <button
                    type="button"
                    className="groups-modal-close"
                    onClick={
                      closeCreateModal
                    }
                  >
                    ✕
                  </button>
  
                </div>
  
                <form
                  onSubmit={
                    handleCreateGroup
                  }
                >
  
                  {formError && (
                    <div className="groups-form-error">
                      ⚠️{" "}
                      {
                        formError
                      }
                    </div>
                  )}
  
                  <div className="groups-form-grid">
  
                    <div className="groups-field full">
  
                      <label>
                        Nom du groupe *
                      </label>
  
                      <input
                        type="text"
                        name="name"
                        value={
                          form.name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Ex. Cellule CIEL Antony"
                        required
                      />
  
                    </div>
  
                    <div className="groups-field">
  
                      <label>
                        Type
                      </label>
  
                      <select
                        name="type"
                        value={
                          form.type
                        }
                        onChange={
                          handleChange
                        }
                      >
                        {GROUP_TYPES.map(
                          (
                            type
                          ) => (
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
  
                    <div className="groups-field">
  
                      <label>
                        Statut
                      </label>
  
                      <select
                        name="status"
                        value={
                          form.status
                        }
                        onChange={
                          handleChange
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
  
                    <div className="groups-field full">
  
                      <label>
                        Description
                      </label>
  
                      <textarea
                        name="description"
                        value={
                          form.description
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Objectif et vision de ce groupe..."
                        rows="3"
                      />
  
                    </div>
  
                    <div className="groups-field">
  
                      <label>
                        Jour de rencontre
                      </label>
  
                      <select
                        name="meetingDay"
                        value={
                          form.meetingDay
                        }
                        onChange={
                          handleChange
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
  
                    <div className="groups-field">
  
                      <label>
                        Heure
                      </label>
  
                      <input
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
  
                    <div className="groups-field">
  
                      <label>
                        Fréquence
                      </label>
  
                      <select
                        name="meetingFrequency"
                        value={
                          form.meetingFrequency
                        }
                        onChange={
                          handleChange
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
  
                    <div className="groups-field">
  
                      <label>
                        Capacité
                      </label>
  
                      <input
                        type="number"
                        min="0"
                        name="capacity"
                        value={
                          form.capacity
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="0 = illimitée"
                      />
  
                    </div>
  
                    <div className="groups-field">
  
                      <label>
                        Lieu
                      </label>
  
                      <input
                        type="text"
                        name="location"
                        value={
                          form.location
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Ex. Chez la famille..."
                      />
  
                    </div>
  
                    <div className="groups-field">
  
                      <label>
                        Ville
                      </label>
  
                      <input
                        type="text"
                        name="city"
                        value={
                          form.city
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Paris"
                      />
  
                    </div>
  
                    <div className="groups-field full">
  
                      <label>
                        Adresse
                      </label>
  
                      <input
                        type="text"
                        name="address"
                        value={
                          form.address
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Adresse de rencontre"
                      />
  
                    </div>
  
                    <div className="groups-field">
  
                      <label>
                        Date de lancement
                      </label>
  
                      <input
                        type="date"
                        name="startedAt"
                        value={
                          form.startedAt
                        }
                        onChange={
                          handleChange
                        }
                      />
  
                    </div>
  
                    <div className="groups-field full">
  
                      <label>
                        Notes internes
                      </label>
  
                      <textarea
                        name="notes"
                        value={
                          form.notes
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Informations internes..."
                        rows="3"
                      />
  
                    </div>
  
                  </div>
  
                  <div className="groups-modal-actions">
  
                    <button
                      type="button"
                      className="groups-secondary-button"
                      onClick={
                        closeCreateModal
                      }
                      disabled={
                        saving
                      }
                    >
                      Annuler
                    </button>
  
                    <button
                      type="submit"
                      className="groups-primary-button"
                      disabled={
                        saving
                      }
                    >
                      {saving
                        ? "Création..."
                        : "Créer le groupe"}
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