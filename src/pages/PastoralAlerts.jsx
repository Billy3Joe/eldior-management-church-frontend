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

import "./PastoralAlerts.css";

// ======================================================
// HELPERS
// ======================================================

const formatDate = (
  value
) => {
  if (!value) {
    return "Jamais enregistrée";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

const getLevelClass = (
  level
) => {
  switch (level) {
    case "Critique":
      return "critical";

    case "À suivre":
      return "follow-up";

    default:
      return "attention";
  }
};

const getStatusClass = (
  status
) => {
  switch (status) {
    case "Résolue":
      return "resolved";

    case "En cours":
      return "progress";

    default:
      return "open";
  }
};

// ======================================================
// PAGE
// ======================================================

export default function PastoralAlerts() {
  const navigate =
    useNavigate();

  // ====================================================
  // ÉTATS
  // ====================================================

  const [
    alerts,
    setAlerts,
  ] = useState([]);

  const [
    stats,
    setStats,
  ] = useState({
    totalOpen: 0,

    byLevel: {
      attention: 0,
      followUp: 0,
      critical: 0,
    },

    inProgress: 0,
    resolved: 0,
    unassigned: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    scanning,
    setScanning,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    levelFilter,
    setLevelFilter,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    showResolved,
    setShowResolved,
  ] = useState(false);

  const [
    selectedAlert,
    setSelectedAlert,
  ] = useState(null);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    modalSaving,
    setModalSaving,
  ] = useState(false);

  const [
    quickActionId,
    setQuickActionId,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState({
    status: "Ouverte",
    note: "",
    contacted: false,
  });

  // ====================================================
  // STATS
  // ====================================================

  const loadStats =
    useCallback(
      async () => {
        const response =
          await API.get(
            "/pastoral-alerts/stats"
          );

        setStats(
          response.data?.data ||
            {
              totalOpen: 0,

              byLevel: {
                attention: 0,
                followUp: 0,
                critical: 0,
              },

              inProgress: 0,
              resolved: 0,
              unassigned: 0,
            }
        );
      },
      []
    );

  // ====================================================
  // ALERTES
  // ====================================================

  const loadAlerts =
    useCallback(
      async () => {
        const params = {};

        if (
          search.trim()
        ) {
          params.search =
            search.trim();
        }

        if (
          levelFilter
        ) {
          params.level =
            levelFilter;
        }

        if (
          statusFilter
        ) {
          params.status =
            statusFilter;
        }

        const response =
          await API.get(
            "/pastoral-alerts",
            {
              params,
            }
          );

        setAlerts(
          Array.isArray(
            response.data?.data
          )
            ? response.data.data
            : []
        );
      },
      [
        search,
        levelFilter,
        statusFilter,
      ]
    );

  // ====================================================
  // CHARGEMENT GLOBAL
  // ====================================================

  const loadPage =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          await Promise.all([
            loadStats(),
            loadAlerts(),
          ]);
        } catch (err) {
          console.error(
            "Erreur chargement alertes pastorales :",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Impossible de charger les alertes pastorales."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        loadStats,
        loadAlerts,
      ]
    );

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadPage();
      }, 250);

    return () => {
      clearTimeout(
        timer
      );
    };
  }, [loadPage]);

  // ====================================================
  // ALERTES VISIBLES
  // ====================================================

  const visibleAlerts =
    useMemo(() => {
      if (
        showResolved
      ) {
        return alerts;
      }

      return alerts.filter(
        (alert) =>
          alert.status !==
          "Résolue"
      );
    }, [
      alerts,
      showResolved,
    ]);

  // ====================================================
  // ANALYSE
  // ====================================================

  const handleScan =
    async () => {
      try {
        setScanning(true);

        setError("");

        setSuccessMessage(
          ""
        );

        const response =
          await API.post(
            "/pastoral-alerts/scan"
          );

        const data =
          response.data?.data ||
          {};

        setSuccessMessage(
          `Analyse terminée : ${
            data.activeAlerts ||
            0
          } alerte(s) active(s), ${
            data.created || 0
          } créée(s), ${
            data.updated || 0
          } mise(s) à jour, ${
            data.automaticallyResolved ||
            0
          } résolue(s) automatiquement.`
        );

        await Promise.all([
          loadStats(),
          loadAlerts(),
        ]);
      } catch (err) {
        console.error(
          "Erreur scan alertes pastorales :",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "L'analyse des absences a échoué."
        );
      } finally {
        setScanning(false);
      }
    };

  // ====================================================
  // MODAL
  // ====================================================

  const openAlertModal =
    (alert) => {
      setSelectedAlert(
        alert
      );

      setForm({
        status:
          alert.status ||
          "Ouverte",

        note:
          alert.note || "",

        contacted: false,
      });

      setModalOpen(
        true
      );
    };

  const closeModal =
    () => {
      if (
        modalSaving
      ) {
        return;
      }

      setModalOpen(
        false
      );

      setSelectedAlert(
        null
      );

      setForm({
        status: "Ouverte",
        note: "",
        contacted: false,
      });
    };

  // ====================================================
  // ENREGISTRER UNE ALERTE
  // ====================================================

  const saveAlert =
    async () => {
      if (
        !selectedAlert?._id
      ) {
        return;
      }

      try {
        setModalSaving(
          true
        );

        setError("");

        setSuccessMessage(
          ""
        );

        await API.put(
          `/pastoral-alerts/${selectedAlert._id}`,
          {
            status:
              form.status,

            note:
              form.note,

            contacted:
              form.contacted,
          }
        );

        setSuccessMessage(
          "Alerte pastorale mise à jour avec succès."
        );

        await Promise.all([
          loadStats(),
          loadAlerts(),
        ]);

        setModalOpen(
          false
        );

        setSelectedAlert(
          null
        );

        setForm({
          status: "Ouverte",
          note: "",
          contacted: false,
        });
      } catch (err) {
        console.error(
          "Erreur mise à jour alerte :",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Impossible de mettre à jour l'alerte."
        );
      } finally {
        setModalSaving(
          false
        );
      }
    };

  // ====================================================
  // MARQUER CONTACTÉ
  // ====================================================

  const markContacted =
    async (alert) => {
      if (
        !alert?._id
      ) {
        return;
      }

      try {
        setQuickActionId(
          alert._id
        );

        setError("");

        setSuccessMessage(
          ""
        );

        await API.put(
          `/pastoral-alerts/${alert._id}`,
          {
            contacted: true,
          }
        );

        setSuccessMessage(
          `${
            alert.member
              ?.firstName ||
            "La personne"
          } a été marquée comme contactée.`
        );

        await Promise.all([
          loadStats(),
          loadAlerts(),
        ]);
      } catch (err) {
        console.error(
          "Erreur contact pastoral :",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Impossible d'enregistrer le contact."
        );
      } finally {
        setQuickActionId(
          null
        );
      }
    };

  // ====================================================
  // PROFIL
  // ====================================================

  const openMemberProfile =
    (memberId) => {
      if (!memberId) {
        return;
      }

      navigate(
        `/members/${memberId}`
      );
    };

  // ====================================================
  // RENDU
  // ====================================================

  return (
    <Layout>

      <div className="pastoral-alerts-page">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="pastoral-alerts-header">

          <div>

            <div className="pastoral-alerts-eyebrow">
              SUIVI PASTORAL INTELLIGENT
            </div>

            <h1>
              Alertes pastorales
            </h1>

            <p>
              Détectez les absences
              prolongées et intervenez
              avant qu'une personne ne
              décroche durablement.
            </p>

          </div>

          <button
            type="button"
            className="pastoral-scan-button"
            onClick={
              handleScan
            }
            disabled={
              scanning
            }
          >
            {scanning
              ? "Analyse en cours..."
              : "🔎 Analyser les absences"}
          </button>

        </div>

        {/* ==================================================
            MESSAGES
        ================================================== */}

        {error && (
          <div className="pastoral-message error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="pastoral-message success">
            {successMessage}
          </div>
        )}

        {/* ==================================================
            KPI
        ================================================== */}

        <div className="pastoral-kpi-grid">

          <div className="pastoral-kpi-card">

            <div className="pastoral-kpi-icon">
              🚨
            </div>

            <div>
              <span>
                Alertes actives
              </span>

              <strong>
                {
                  stats.totalOpen ||
                  0
                }
              </strong>
            </div>

          </div>

          <div className="pastoral-kpi-card attention">

            <div className="pastoral-kpi-icon">
              ⚠️
            </div>

            <div>
              <span>
                Attention
              </span>

              <strong>
                {
                  stats.byLevel
                    ?.attention ||
                  0
                }
              </strong>
            </div>

          </div>

          <div className="pastoral-kpi-card follow-up">

            <div className="pastoral-kpi-icon">
              👀
            </div>

            <div>
              <span>
                À suivre
              </span>

              <strong>
                {
                  stats.byLevel
                    ?.followUp ||
                  0
                }
              </strong>
            </div>

          </div>

          <div className="pastoral-kpi-card critical">

            <div className="pastoral-kpi-icon">
              🛟
            </div>

            <div>
              <span>
                Critiques
              </span>

              <strong>
                {
                  stats.byLevel
                    ?.critical ||
                  0
                }
              </strong>
            </div>

          </div>

          <div className="pastoral-kpi-card">

            <div className="pastoral-kpi-icon">
              🤝
            </div>

            <div>
              <span>
                En cours
              </span>

              <strong>
                {
                  stats.inProgress ||
                  0
                }
              </strong>
            </div>

          </div>

          <div className="pastoral-kpi-card">

            <div className="pastoral-kpi-icon">
              ✅
            </div>

            <div>
              <span>
                Résolues
              </span>

              <strong>
                {
                  stats.resolved ||
                  0
                }
              </strong>
            </div>

          </div>

        </div>

        {/* ==================================================
            FILTRES
        ================================================== */}

        <div className="pastoral-filters">

          <div className="pastoral-search">

            <span>
              🔎
            </span>

            <input
              type="text"
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
              placeholder="Rechercher une personne..."
            />

          </div>

          <select
            value={
              levelFilter
            }
            onChange={(
              event
            ) =>
              setLevelFilter(
                event.target
                  .value
              )
            }
          >
            <option value="">
              Tous les niveaux
            </option>

            <option value="Attention">
              Attention
            </option>

            <option value="À suivre">
              À suivre
            </option>

            <option value="Critique">
              Critique
            </option>
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

            <option value="Ouverte">
              Ouverte
            </option>

            <option value="En cours">
              En cours
            </option>

            <option value="Résolue">
              Résolue
            </option>
          </select>

          <label className="pastoral-resolved-toggle">

            <input
              type="checkbox"
              checked={
                showResolved
              }
              onChange={(
                event
              ) =>
                setShowResolved(
                  event.target
                    .checked
                )
              }
            />

            Afficher les résolues

          </label>

        </div>

        {/* ==================================================
            CHARGEMENT / LISTE
        ================================================== */}

        {loading ? (
          <div className="pastoral-state-card">
            Analyse des données
            pastorales...
          </div>
        ) : visibleAlerts.length ===
          0 ? (
          <div className="pastoral-state-card success-state">

            <div className="pastoral-state-icon">
              🌱
            </div>

            <h3>
              Aucune alerte pastorale
            </h3>

            <p>
              Aucun membre ne nécessite
              d'attention selon les
              critères actuels.
            </p>

          </div>
        ) : (
          <div className="pastoral-alert-list">

            {visibleAlerts.map(
              (alert) => {
                const member =
                  alert.member ||
                  {};

                return (
                  <article
                    key={
                      alert._id
                    }
                    className={`pastoral-alert-card ${getLevelClass(
                      alert.level
                    )}`}
                  >

                    {/* PERSONNE */}

                    <div className="pastoral-alert-main">

                      <div className="pastoral-member-avatar">
                        {member.firstName
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "?"}
                      </div>

                      <div className="pastoral-alert-person">

                        <div className="pastoral-alert-badges">

                          <span
                            className={`pastoral-level-badge ${getLevelClass(
                              alert.level
                            )}`}
                          >
                            {
                              alert.level
                            }
                          </span>

                          <span
                            className={`pastoral-status-badge ${getStatusClass(
                              alert.status
                            )}`}
                          >
                            {
                              alert.status
                            }
                          </span>

                        </div>

                        <h3>
                          {
                            member.firstName
                          }{" "}
                          {
                            member.lastName
                          }
                        </h3>

                        <div className="pastoral-member-meta">

                          {member.phone && (
                            <span>
                              📞{" "}
                              {
                                member.phone
                              }
                            </span>
                          )}

                          {member.email && (
                            <span>
                              ✉️{" "}
                              {
                                member.email
                              }
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    {/* MÉTRIQUES */}

                    <div className="pastoral-alert-metrics">

                      <div>
                        <span>
                          Cultes manqués
                        </span>

                        <strong>
                          {
                            alert.consecutiveMissedServices ||
                            0
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Dernière présence
                        </span>

                        <strong>
                          {
                            formatDate(
                              alert.lastPresenceDate
                            )
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Dernier culte analysé
                        </span>

                        <strong>
                          {
                            formatDate(
                              alert.lastCheckedServiceDate
                            )
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Responsable
                        </span>

                        <strong>
                          {alert.assignedTo
                            ?.name ||
                            "Non assigné"}
                        </strong>
                      </div>

                    </div>

                    {/* NOTE */}

                    {alert.note && (
                      <div className="pastoral-alert-note">

                        <strong>
                          Note pastorale
                        </strong>

                        <p>
                          {
                            alert.note
                          }
                        </p>

                      </div>
                    )}

                    {/* ACTIONS */}

                    <div className="pastoral-alert-actions">

                      <button
                        type="button"
                        className="pastoral-button secondary"
                        onClick={() =>
                          openMemberProfile(
                            member._id
                          )
                        }
                      >
                        👤 Profil 360°
                      </button>

                      {alert.status !==
                        "Résolue" && (
                        <button
                          type="button"
                          className="pastoral-button contact"
                          onClick={() =>
                            markContacted(
                              alert
                            )
                          }
                          disabled={
                            quickActionId ===
                            alert._id
                          }
                        >
                          {quickActionId ===
                          alert._id
                            ? "Enregistrement..."
                            : "📞 Marquer contacté"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="pastoral-button primary"
                        onClick={() =>
                          openAlertModal(
                            alert
                          )
                        }
                      >
                        📝 Gérer l'alerte
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

        {/* ==================================================
            MODAL
        ================================================== */}

        {modalOpen &&
          selectedAlert && (
          <div
            className="pastoral-modal-overlay"
            onMouseDown={
              closeModal
            }
          >

            <div
              className="pastoral-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div className="pastoral-modal-header">

                <div>

                  <span>
                    Suivi pastoral
                  </span>

                  <h2>
                    {
                      selectedAlert
                        .member
                        ?.firstName
                    }{" "}
                    {
                      selectedAlert
                        .member
                        ?.lastName
                    }
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    modalSaving
                  }
                >
                  ✕
                </button>

              </div>

              <div className="pastoral-modal-summary">

                <div>

                  <span>
                    Niveau
                  </span>

                  <strong>
                    {
                      selectedAlert.level
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    Absences
                  </span>

                  <strong>
                    {
                      selectedAlert.consecutiveMissedServices
                    }{" "}
                    culte(s)
                  </strong>

                </div>

              </div>

              <div className="pastoral-form-group">

                <label>
                  Statut de l'alerte
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        status:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  <option value="Ouverte">
                    Ouverte
                  </option>

                  <option value="En cours">
                    En cours
                  </option>

                  <option value="Résolue">
                    Résolue
                  </option>
                </select>

              </div>

              <div className="pastoral-form-group">

                <label>
                  Note pastorale
                </label>

                <textarea
                  rows="5"
                  value={
                    form.note
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        note:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Ex. Appel effectué, situation familiale, rendez-vous prévu..."
                />

              </div>

              <label className="pastoral-contact-checkbox">

                <input
                  type="checkbox"
                  checked={
                    form.contacted
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        contacted:
                          event.target
                            .checked,
                      })
                    )
                  }
                />

                J'ai contacté cette
                personne aujourd'hui

              </label>

              <div className="pastoral-modal-actions">

                <button
                  type="button"
                  className="pastoral-button secondary"
                  onClick={
                    closeModal
                  }
                  disabled={
                    modalSaving
                  }
                >
                  Annuler
                </button>

                <button
                  type="button"
                  className="pastoral-button primary"
                  onClick={
                    saveAlert
                  }
                  disabled={
                    modalSaving
                  }
                >
                  {modalSaving
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </Layout>
  );
}