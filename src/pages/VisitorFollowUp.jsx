import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import Layout from "../components/Layout";
  import API from "../api/axios";
  
  import "../styles/ManagementPages.css";
  
  // ======================================================
  // CONSTANTES
  // ======================================================
  
  const FOLLOW_UP_STATUSES = [
    "Non commencé",
    "À contacter",
    "Contacté",
    "En suivi",
    "Clôturé",
  ];
  
  const INITIAL_FORM = {
    followUpStatus:
      "À contacter",
  
    followUpAssignedTo:
      "",
  
    followUpNote:
      "",
  
    lastContactDate:
      "",
  
    nextFollowUpDate:
      "",
  };
  
  // ======================================================
  // HELPERS
  // ======================================================
  
  const formatDate = (
    value
  ) => {
    if (!value) {
      return "—";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }
  
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(date);
  };
  
  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "—";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }
  
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  };
  
  const toDateInputValue = (
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
  
    const year =
      date.getFullYear();
  
    const month =
      String(
        date.getMonth() +
          1
      ).padStart(
        2,
        "0"
      );
  
    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );
  
    return `${year}-${month}-${day}`;
  };
  
  const getInitials = (
    visitor
  ) => {
    const first =
      visitor?.firstName
        ?.trim()
        ?.charAt(0) ||
      "";
  
    const last =
      visitor?.lastName
        ?.trim()
        ?.charAt(0) ||
      "";
  
    return (
      `${first}${last}`
        .toUpperCase() ||
      "V"
    );
  };
  
  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "À contacter":
        return "visitor-status-to-contact";
  
      case "Contacté":
        return "visitor-status-contacted";
  
      case "En suivi":
        return "visitor-status-following";
  
      case "Clôturé":
        return "visitor-status-closed";
  
      case "Intégré":
        return "visitor-status-integrated";
  
      default:
        return "visitor-status-not-started";
    }
  };
  
  const getErrorMessage = (
    error,
    fallback
  ) => {
    return (
      error?.response?.data
        ?.message ||
      error?.message ||
      fallback
    );
  };
  
  // ======================================================
  // PAGE
  // ======================================================
  
  export default function VisitorFollowUp() {
    // ====================================================
    // DONNÉES
    // ====================================================
  
    const [
      visitors,
      setVisitors,
    ] = useState([]);
  
    const [
      stats,
      setStats,
    ] = useState({
      totalVisitors: 0,
      toContact: 0,
      contacted: 0,
      inFollowUp: 0,
      integrated: 0,
      closed: 0,
      overdue: 0,
      upcomingFollowUps: 0,
      recentVisitors: 0,
      conversionRate: 0,
    });
  
    const [
      churchUsers,
      setChurchUsers,
    ] = useState([]);
  
    // ====================================================
    // CHARGEMENT
    // ====================================================
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      actionLoading,
      setActionLoading,
    ] = useState(false);
  
    // ====================================================
    // PAGINATION
    // ====================================================
  
    const [
      page,
      setPage,
    ] = useState(1);
  
    const [
      totalPages,
      setTotalPages,
    ] = useState(1);
  
    const [
      total,
      setTotal,
    ] = useState(0);
  
    const limit = 20;
  
    // ====================================================
    // FILTRES
    // ====================================================
  
    const [
      search,
      setSearch,
    ] = useState("");
  
    const [
      searchValue,
      setSearchValue,
    ] = useState("");
  
    const [
      statusFilter,
      setStatusFilter,
    ] = useState("");
  
    const [
      overdueOnly,
      setOverdueOnly,
    ] = useState(false);
  
    // ====================================================
    // MODAL
    // ====================================================
  
    const [
      selectedVisitor,
      setSelectedVisitor,
    ] = useState(null);
  
    const [
      modalOpen,
      setModalOpen,
    ] = useState(false);
  
    const [
      form,
      setForm,
    ] = useState(
      INITIAL_FORM
    );
  
    // ====================================================
    // MESSAGES
    // ====================================================
  
    const [
      error,
      setError,
    ] = useState("");
  
    const [
      success,
      setSuccess,
    ] = useState("");
  
    // ====================================================
    // STAT CARDS
    // ====================================================
  
    const statCards =
      useMemo(
        () => [
          {
            label:
              "Visiteurs à suivre",
            value:
              stats.totalVisitors ||
              0,
            description:
              "Visiteurs actuellement dans le parcours",
          },
  
          {
            label:
              "À contacter",
            value:
              stats.toContact ||
              0,
            description:
              "Premier contact à effectuer",
          },
  
          {
            label:
              "En suivi",
            value:
              stats.inFollowUp ||
              0,
            description:
              "Accompagnement actuellement en cours",
          },
  
          {
            label:
              "Relances en retard",
            value:
              stats.overdue ||
              0,
            description:
              "Actions pastorales à traiter",
          },
  
          {
            label:
              "Contactés",
            value:
              stats.contacted ||
              0,
            description:
              "Personnes déjà contactées",
          },
  
          {
            label:
              "Intégrés",
            value:
              stats.integrated ||
              0,
            description:
              "Anciens visiteurs devenus membres",
          },
  
          {
            label:
              "Relances prévues",
            value:
              stats.upcomingFollowUps ||
              0,
            description:
              "Prochains suivis programmés",
          },
  
          {
            label:
              "Taux d'intégration",
            value:
              `${stats.conversionRate || 0}%`,
            description:
              "Conversion visiteurs vers membres",
          },
        ],
        [stats]
      );
  
    // ====================================================
    // CHARGER LES STATISTIQUES
    // ====================================================
  
    const fetchStats =
      useCallback(
        async () => {
          try {
            const response =
              await API.get(
                "/visitor-follow-up/stats"
              );
  
            setStats(
              response?.data
                ?.data || {
                totalVisitors: 0,
                toContact: 0,
                contacted: 0,
                inFollowUp: 0,
                integrated: 0,
                closed: 0,
                overdue: 0,
                upcomingFollowUps: 0,
                recentVisitors: 0,
                conversionRate: 0,
              }
            );
          } catch (err) {
            console.error(
              "Erreur statistiques visiteurs :",
              err
            );
          }
        },
        []
      );
  
    // ====================================================
    // CHARGER LES VISITEURS
    // ====================================================
  
    const fetchVisitors =
      useCallback(
        async () => {
          try {
            setLoading(true);
            setError("");
  
            const params = {
              page,
              limit,
            };
  
            if (
              search.trim()
            ) {
              params.search =
                search.trim();
            }
  
            if (
              statusFilter
            ) {
              params.followUpStatus =
                statusFilter;
            }
  
            if (
              overdueOnly
            ) {
              params.overdue =
                "true";
            }
  
            const response =
              await API.get(
                "/visitor-follow-up",
                {
                  params,
                }
              );
  
            const payload =
              response?.data ||
              {};
  
            setVisitors(
              Array.isArray(
                payload.data
              )
                ? payload.data
                : []
            );
  
            setTotal(
              payload.total ||
                0
            );
  
            setTotalPages(
              Math.max(
                payload.totalPages ||
                  1,
                1
              )
            );
          } catch (err) {
            console.error(
              "Erreur visiteurs :",
              err
            );
  
            setError(
              getErrorMessage(
                err,
                "Impossible de charger le suivi des visiteurs."
              )
            );
          } finally {
            setLoading(false);
          }
        },
        [
          page,
          search,
          statusFilter,
          overdueOnly,
        ]
      );
  
    // ====================================================
    // CHARGER LES UTILISATEURS DE L'ÉGLISE
    // ====================================================
  
    const fetchChurchUsers =
      useCallback(
        async () => {
          try {
            const response =
              await API.get(
                "/users"
              );
  
            const payload =
              response?.data;
  
            let users = [];
  
            if (
              Array.isArray(
                payload
              )
            ) {
              users =
                payload;
            } else if (
              Array.isArray(
                payload?.data
              )
            ) {
              users =
                payload.data;
            } else if (
              Array.isArray(
                payload?.users
              )
            ) {
              users =
                payload.users;
            } else if (
              Array.isArray(
                payload?.data
                  ?.users
              )
            ) {
              users =
                payload.data
                  .users;
            }
  
            setChurchUsers(
              users.filter(
                (user) =>
                  user &&
                  user.isActive !==
                    false
              )
            );
          } catch (err) {
            console.error(
              "Impossible de charger les responsables :",
              err
            );
  
            setChurchUsers(
              []
            );
          }
        },
        []
      );
  
    // ====================================================
    // PREMIER CHARGEMENT
    // ====================================================
  
    useEffect(() => {
      fetchStats();
      fetchChurchUsers();
    }, [
      fetchStats,
      fetchChurchUsers,
    ]);
  
    useEffect(() => {
      fetchVisitors();
    }, [fetchVisitors]);
  
    // ====================================================
    // RECHERCHE
    // ====================================================
  
    const handleSearchSubmit =
      (event) => {
        event.preventDefault();
  
        setPage(1);
        setSearch(
          searchValue
        );
      };
  
    // ====================================================
    // RESET FILTRES
    // ====================================================
  
    const resetFilters =
      () => {
        setSearchValue("");
        setSearch("");
        setStatusFilter("");
        setOverdueOnly(false);
        setPage(1);
      };
  
    // ====================================================
    // OUVRIR MODAL
    // ====================================================
  
    const openFollowUpModal =
      (visitor) => {
        setSelectedVisitor(
          visitor
        );
  
        setForm({
          followUpStatus:
            visitor.followUpStatus ||
            "À contacter",
  
          followUpAssignedTo:
            visitor
              .followUpAssignedTo
              ?._id ||
            visitor
              .followUpAssignedTo ||
            "",
  
          followUpNote:
            visitor.followUpNote ||
            "",
  
          lastContactDate:
            toDateInputValue(
              visitor.lastContactDate
            ),
  
          nextFollowUpDate:
            toDateInputValue(
              visitor.nextFollowUpDate
            ),
        });
  
        setError("");
        setSuccess("");
        setModalOpen(true);
      };
  
    // ====================================================
    // FERMER MODAL
    // ====================================================
  
    const closeModal =
      () => {
        if (
          actionLoading
        ) {
          return;
        }
  
        setModalOpen(false);
        setSelectedVisitor(
          null
        );
  
        setForm(
          INITIAL_FORM
        );
      };
  
    // ====================================================
    // FORMULAIRE
    // ====================================================
  
    const handleFormChange =
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
  
    // ====================================================
    // ACTUALISER TOUT
    // ====================================================
  
    const refreshAll =
      async () => {
        await Promise.all([
          fetchVisitors(),
          fetchStats(),
        ]);
      };
  
    // ====================================================
    // ENREGISTRER LE SUIVI
    // ====================================================
  
    const handleSaveFollowUp =
      async (event) => {
        event.preventDefault();
  
        if (
          !selectedVisitor
        ) {
          return;
        }
  
        try {
          setActionLoading(
            true
          );
  
          setError("");
          setSuccess("");
  
          const payload = {
            followUpStatus:
              form.followUpStatus,
  
            followUpAssignedTo:
              form.followUpAssignedTo ||
              null,
  
            followUpNote:
              form.followUpNote,
  
            lastContactDate:
              form.lastContactDate ||
              null,
  
            nextFollowUpDate:
              form.nextFollowUpDate ||
              null,
          };
  
          await API.put(
            `/visitor-follow-up/${selectedVisitor._id}`,
            payload
          );
  
          setSuccess(
            "Le suivi a été mis à jour avec succès."
          );
  
          await refreshAll();
  
          setTimeout(() => {
            setModalOpen(
              false
            );
  
            setSelectedVisitor(
              null
            );
          }, 500);
        } catch (err) {
          console.error(
            "Erreur mise à jour suivi :",
            err
          );
  
          setError(
            getErrorMessage(
              err,
              "Impossible de mettre à jour le suivi."
            )
          );
        } finally {
          setActionLoading(
            false
          );
        }
      };
  
    // ====================================================
    // MARQUER CONTACTÉ
    // ====================================================
  
    const handleMarkContacted =
      async (visitor) => {
        const confirmed =
          window.confirm(
            `Confirmer que ${visitor.firstName} ${visitor.lastName} a été contacté(e) ?`
          );
  
        if (!confirmed) {
          return;
        }
  
        try {
          setActionLoading(
            true
          );
  
          setError("");
          setSuccess("");
  
          await API.patch(
            `/visitor-follow-up/${visitor._id}/contact`,
            {}
          );
  
          setSuccess(
            `${visitor.firstName} ${visitor.lastName} a été marqué(e) comme contacté(e).`
          );
  
          await refreshAll();
        } catch (err) {
          console.error(
            "Erreur contact visiteur :",
            err
          );
  
          setError(
            getErrorMessage(
              err,
              "Impossible d'enregistrer le contact."
            )
          );
        } finally {
          setActionLoading(
            false
          );
        }
      };
  
    // ====================================================
    // INTÉGRER COMME MEMBRE
    // ====================================================
  
    const handleIntegrate =
      async (visitor) => {
        const confirmed =
          window.confirm(
            `Voulez-vous intégrer ${visitor.firstName} ${visitor.lastName} comme membre de l'église ?`
          );
  
        if (!confirmed) {
          return;
        }
  
        try {
          setActionLoading(
            true
          );
  
          setError("");
          setSuccess("");
  
          await API.patch(
            `/visitor-follow-up/${visitor._id}/integrate`,
            {}
          );
  
          setSuccess(
            `${visitor.firstName} ${visitor.lastName} est maintenant membre.`
          );
  
          if (
            visitors.length ===
              1 &&
            page > 1
          ) {
            setPage(
              (previous) =>
                Math.max(
                  previous - 1,
                  1
                )
            );
          } else {
            await refreshAll();
          }
        } catch (err) {
          console.error(
            "Erreur intégration visiteur :",
            err
          );
  
          setError(
            getErrorMessage(
              err,
              "Impossible d'intégrer ce visiteur comme membre."
            )
          );
        } finally {
          setActionLoading(
            false
          );
        }
      };
  
    // ====================================================
    // PAGES PAGINATION
    // ====================================================
  
    const paginationPages =
      useMemo(() => {
        const pages = [];
  
        const start =
          Math.max(
            1,
            page - 2
          );
  
        const end =
          Math.min(
            totalPages,
            page + 2
          );
  
        for (
          let current =
            start;
          current <= end;
          current += 1
        ) {
          pages.push(
            current
          );
        }
  
        return pages;
      }, [
        page,
        totalPages,
      ]);
  
    // ====================================================
    // RENDER
    // ====================================================
  
    return (
      <Layout>
        <div className="management-page">
          {/* ==================================================
              HEADER
          ================================================== */}
  
          <div className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">
                Suivi des visiteurs
              </h1>
  
              <p className="page-subtitle">
                Accompagnez les nouvelles personnes depuis leur première visite jusqu'à leur intégration dans l'église.
              </p>
            </div>
  
            <div className="page-header-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  refreshAll
                }
                disabled={
                  loading ||
                  actionLoading
                }
              >
                ↻ Actualiser
              </button>
            </div>
          </div>
  
          {/* ==================================================
              MESSAGES
          ================================================== */}
  
          {error && (
            <div className="visitor-alert visitor-alert-error">
              <span>
                ⚠️
              </span>
  
              <span>
                {error}
              </span>
  
              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                ✕
              </button>
            </div>
          )}
  
          {success && (
            <div className="visitor-alert visitor-alert-success">
              <span>
                ✅
              </span>
  
              <span>
                {success}
              </span>
  
              <button
                type="button"
                onClick={() =>
                  setSuccess(
                    ""
                  )
                }
              >
                ✕
              </button>
            </div>
          )}
  
          {/* ==================================================
              STATISTIQUES
          ================================================== */}
  
          <div className="management-stats-grid visitor-stats-grid">
            {statCards.map(
              (card) => (
                <div
                  className="management-stat-card"
                  key={
                    card.label
                  }
                >
                  <div className="management-stat-label">
                    {
                      card.label
                    }
                  </div>
  
                  <div className="management-stat-value">
                    {
                      card.value
                    }
                  </div>
  
                  <div className="management-stat-description">
                    {
                      card.description
                    }
                  </div>
                </div>
              )
            )}
          </div>
  
          {/* ==================================================
              LISTE
          ================================================== */}
  
          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Parcours des visiteurs
                </h2>
  
                <div className="visitor-card-subtitle">
                  {total} visiteur
                  {total > 1
                    ? "s"
                    : ""}{" "}
                  actuellement à suivre
                </div>
              </div>
  
              {stats.overdue >
                0 && (
                <button
                  type="button"
                  className="btn btn-warning btn-small"
                  onClick={() => {
                    setOverdueOnly(
                      true
                    );
  
                    setStatusFilter(
                      ""
                    );
  
                    setPage(1);
                  }}
                >
                  ⏰ {
                    stats.overdue
                  } en retard
                </button>
              )}
            </div>
  
            {/* ==================================================
                TOOLBAR
            ================================================== */}
  
            <div className="management-toolbar">
              <form
                className="management-search"
                onSubmit={
                  handleSearchSubmit
                }
              >
                <span className="management-search-icon">
                  🔎
                </span>
  
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone ou email..."
                  value={
                    searchValue
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchValue(
                      event
                        .target
                        .value
                    )
                  }
                />
              </form>
  
              <div className="management-filters">
                <select
                  className="management-select"
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) => {
                    setStatusFilter(
                      event
                        .target
                        .value
                    );
  
                    setOverdueOnly(
                      false
                    );
  
                    setPage(1);
                  }}
                >
                  <option value="">
                    Tous les statuts
                  </option>
  
                  {FOLLOW_UP_STATUSES.map(
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
  
                <button
                  type="button"
                  className={`btn btn-small ${
                    overdueOnly
                      ? "btn-warning"
                      : "btn-secondary"
                  }`}
                  onClick={() => {
                    setOverdueOnly(
                      (
                        previous
                      ) =>
                        !previous
                    );
  
                    setStatusFilter(
                      ""
                    );
  
                    setPage(1);
                  }}
                >
                  ⏰ Relances en retard
                </button>
  
                {(search ||
                  statusFilter ||
                  overdueOnly) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={
                      resetFilters
                    }
                  >
                    ✕ Réinitialiser
                  </button>
                )}
              </div>
            </div>
  
            {/* ==================================================
                LOADING
            ================================================== */}
  
            {loading ? (
              <div className="management-loading">
                <div className="management-spinner" />
  
                <div>
                  Chargement du suivi...
                </div>
              </div>
            ) : visitors.length ===
              0 ? (
              <div className="management-empty">
                <div className="management-empty-icon">
                  🤝
                </div>
  
                <h3>
                  Aucun visiteur à afficher
                </h3>
  
                <p>
                  {search ||
                  statusFilter ||
                  overdueOnly
                    ? "Aucun visiteur ne correspond aux filtres sélectionnés."
                    : "Les nouveaux visiteurs apparaîtront ici dès qu'ils seront enregistrés."}
                </p>
              </div>
            ) : (
              <>
                {/* ==================================================
                    TABLE
                ================================================== */}
  
                <div className="management-table-wrapper">
                  <table className="management-table visitor-table">
                    <thead>
                      <tr>
                        <th>
                          Visiteur
                        </th>
  
                        <th>
                          Contact
                        </th>
  
                        <th>
                          Première visite
                        </th>
  
                        <th>
                          Visites
                        </th>
  
                        <th>
                          Statut
                        </th>
  
                        <th>
                          Responsable
                        </th>
  
                        <th>
                          Prochaine relance
                        </th>
  
                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>
  
                    <tbody>
                      {visitors.map(
                        (
                          visitor
                        ) => {
                          const assigned =
                            visitor
                              .followUpAssignedTo;
  
                          const nextDate =
                            visitor
                              .nextFollowUpDate;
  
                          const isOverdue =
                            nextDate &&
                            new Date(
                              nextDate
                            ) <
                              new Date() &&
                            ![
                              "Intégré",
                              "Clôturé",
                            ].includes(
                              visitor.followUpStatus
                            );
  
                          return (
                            <tr
                              key={
                                visitor._id
                              }
                            >
                              <td>
                                <div className="person-cell">
                                  <div className="person-avatar">
                                    {getInitials(
                                      visitor
                                    )}
                                  </div>
  
                                  <div>
                                    <div className="person-name">
                                      {
                                        visitor.firstName
                                      }{" "}
                                      {
                                        visitor.lastName
                                      }
                                    </div>
  
                                    <div className="person-secondary">
                                      {visitor.gender ||
                                        "Genre non renseigné"}
                                    </div>
                                  </div>
                                </div>
                              </td>
  
                              <td>
                                <div className="visitor-contact-cell">
                                  <div>
                                    📞{" "}
                                    {visitor.phone ||
                                      "—"}
                                  </div>
  
                                  <div>
                                    ✉️{" "}
                                    {visitor.email ||
                                      "—"}
                                  </div>
                                </div>
                              </td>
  
                              <td>
                                {formatDate(
                                  visitor.firstVisitDate
                                )}
                              </td>
  
                              <td>
                                <span className="visitor-visit-count">
                                  {visitor.visitCount ||
                                    0}
                                </span>
                              </td>
  
                              <td>
                                <span
                                  className={`visitor-status-badge ${getStatusClass(
                                    visitor.followUpStatus
                                  )}`}
                                >
                                  {visitor.followUpStatus ||
                                    "Non commencé"}
                                </span>
                              </td>
  
                              <td>
                                {assigned ? (
                                  <div>
                                    <div className="visitor-assigned-name">
                                      {assigned.name ||
                                        "Responsable"}
                                    </div>
  
                                    <div className="person-secondary">
                                      {assigned.role ||
                                        ""}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="visitor-unassigned">
                                    Non attribué
                                  </span>
                                )}
                              </td>
  
                              <td>
                                <div
                                  className={
                                    isOverdue
                                      ? "visitor-date-overdue"
                                      : ""
                                  }
                                >
                                  {formatDate(
                                    nextDate
                                  )}
                                </div>
  
                                {isOverdue && (
                                  <div className="visitor-overdue-label">
                                    En retard
                                  </div>
                                )}
                              </td>
  
                              <td>
                                <div className="table-actions">
                                  {visitor.followUpStatus !==
                                    "Contacté" &&
                                    visitor.followUpStatus !==
                                      "En suivi" && (
                                      <button
                                        type="button"
                                        className="btn btn-success btn-small"
                                        disabled={
                                          actionLoading
                                        }
                                        onClick={() =>
                                          handleMarkContacted(
                                            visitor
                                          )
                                        }
                                      >
                                        ✓ Contacté
                                      </button>
                                    )}
  
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-small"
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      openFollowUpModal(
                                        visitor
                                      )
                                    }
                                  >
                                    ✏️ Suivi
                                  </button>
  
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-small"
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      handleIntegrate(
                                        visitor
                                      )
                                    }
                                  >
                                    👤 Intégrer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
  
                {/* ==================================================
                    PAGINATION
                ================================================== */}
  
                <div className="management-pagination">
                  <div className="pagination-info">
                    Page {page} sur{" "}
                    {totalPages} •{" "}
                    {total} résultat
                    {total > 1
                      ? "s"
                      : ""}
                  </div>
  
                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-button"
                      disabled={
                        page <= 1
                      }
                      onClick={() =>
                        setPage(
                          (
                            previous
                          ) =>
                            Math.max(
                              previous -
                                1,
                              1
                            )
                        )
                      }
                    >
                      ‹
                    </button>
  
                    {paginationPages.map(
                      (
                        paginationPage
                      ) => (
                        <button
                          type="button"
                          key={
                            paginationPage
                          }
                          className={`pagination-button ${
                            paginationPage ===
                            page
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setPage(
                              paginationPage
                            )
                          }
                        >
                          {
                            paginationPage
                          }
                        </button>
                      )
                    )}
  
                    <button
                      type="button"
                      className="pagination-button"
                      disabled={
                        page >=
                        totalPages
                      }
                      onClick={() =>
                        setPage(
                          (
                            previous
                          ) =>
                            Math.min(
                              previous +
                                1,
                              totalPages
                            )
                        )
                      }
                    >
                      ›
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
  
        {/* ====================================================
            MODAL SUIVI
        ==================================================== */}
  
        {modalOpen &&
          selectedVisitor && (
            <div
              className="management-modal-overlay"
              onMouseDown={(
                event
              ) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closeModal();
                }
              }}
            >
              <form
                className="management-modal"
                onSubmit={
                  handleSaveFollowUp
                }
              >
                <div className="management-modal-header">
                  <div>
                    <h2>
                      Suivi de{" "}
                      {
                        selectedVisitor.firstName
                      }{" "}
                      {
                        selectedVisitor.lastName
                      }
                    </h2>
  
                    <div className="visitor-modal-subtitle">
                      Organisez le prochain contact et l'accompagnement pastoral.
                    </div>
                  </div>
  
                  <button
                    type="button"
                    className="management-modal-close"
                    onClick={
                      closeModal
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    ✕
                  </button>
                </div>
  
                <div className="management-modal-body">
                  <div className="visitor-profile-summary">
                    <div className="person-avatar visitor-profile-avatar">
                      {getInitials(
                        selectedVisitor
                      )}
                    </div>
  
                    <div>
                      <div className="person-name">
                        {
                          selectedVisitor.firstName
                        }{" "}
                        {
                          selectedVisitor.lastName
                        }
                      </div>
  
                      <div className="person-secondary">
                        {selectedVisitor.phone ||
                          "Aucun téléphone"}{" "}
                        •{" "}
                        {selectedVisitor.email ||
                          "Aucun email"}
                      </div>
  
                      <div className="person-secondary">
                        Dernier contact :{" "}
                        {formatDateTime(
                          selectedVisitor.lastContactDate
                        )}
                      </div>
                    </div>
                  </div>
  
                  <div className="management-form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        Statut du suivi
                      </label>
  
                      <select
                        className="form-select"
                        name="followUpStatus"
                        value={
                          form.followUpStatus
                        }
                        onChange={
                          handleFormChange
                        }
                      >
                        {FOLLOW_UP_STATUSES.map(
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
  
                    <div className="form-group">
                      <label className="form-label">
                        Responsable du suivi
                      </label>
  
                      <select
                        className="form-select"
                        name="followUpAssignedTo"
                        value={
                          form.followUpAssignedTo
                        }
                        onChange={
                          handleFormChange
                        }
                      >
                        <option value="">
                          Aucun responsable
                        </option>
  
                        {churchUsers.map(
                          (
                            user
                          ) => (
                            <option
                              key={
                                user._id
                              }
                              value={
                                user._id
                              }
                            >
                              {user.name ||
                                user.email ||
                                "Utilisateur"}
                              {user.role
                                ? ` — ${user.role}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>
  
                    <div className="form-group">
                      <label className="form-label">
                        Dernier contact
                      </label>
  
                      <input
                        type="date"
                        className="form-input"
                        name="lastContactDate"
                        value={
                          form.lastContactDate
                        }
                        onChange={
                          handleFormChange
                        }
                      />
                    </div>
  
                    <div className="form-group">
                      <label className="form-label">
                        Prochaine relance
                      </label>
  
                      <input
                        type="date"
                        className="form-input"
                        name="nextFollowUpDate"
                        value={
                          form.nextFollowUpDate
                        }
                        onChange={
                          handleFormChange
                        }
                      />
                    </div>
  
                    <div className="form-group form-group-full">
                      <label className="form-label">
                        Notes de suivi
                      </label>
  
                      <textarea
                        className="form-textarea"
                        name="followUpNote"
                        value={
                          form.followUpNote
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Exemple : Premier échange positif. La personne souhaite revenir dimanche prochain..."
                      />
                    </div>
                  </div>
  
                  {selectedVisitor.followUpNote && (
                    <div className="visitor-current-note">
                      <div className="visitor-current-note-title">
                        Note actuellement enregistrée
                      </div>
  
                      <div>
                        {
                          selectedVisitor.followUpNote
                        }
                      </div>
                    </div>
                  )}
                </div>
  
                <div className="management-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={
                      closeModal
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    Annuler
                  </button>
  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      actionLoading
                    }
                  >
                    {actionLoading
                      ? "Enregistrement..."
                      : "💾 Enregistrer le suivi"}
                  </button>
                </div>
              </form>
            </div>
          )}
      </Layout>
    );
  }