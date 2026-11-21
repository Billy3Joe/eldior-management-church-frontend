
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./PastoralAlerts.css";

// ======================================================
// HELPERS
// ======================================================

const getPreviousMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getCurrentMonth = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const formatDate = (value) => {
  if (!value) return "Jamais enregistrée";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatPeriod = (periodKey) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey || "")) {
    return "Période inconnue";
  }

  const [year, month] = periodKey.split("-").map(Number);

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const getLevelClass = (level) => {
  if (level === "Critique") return "critical";
  if (level === "À suivre") return "follow-up";
  return "attention";
};

const getStatusClass = (status) => {
  if (status === "Résolue") return "resolved";
  if (status === "En cours") return "progress";
  return "open";
};

const getMemberName = (member) =>
  [member?.firstName, member?.lastName]
    .filter(Boolean)
    .join(" ") || "Membre inconnu";

const initialStats = {
  totalOpen: 0,
  byLevel: {
    attention: 0,
    followUp: 0,
    critical: 0,
  },
  inProgress: 0,
  resolved: 0,
  unassigned: 0,
};

const initialForm = {
  status: "Ouverte",
  note: "",
  contacted: false,
};

// ======================================================
// PAGE
// ======================================================

export default function PastoralAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(initialStats);

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [quickActionId, setQuickActionId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [periodKey, setPeriodKey] = useState(getPreviousMonth);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const isCurrentOrFuturePeriod =
    Boolean(periodKey) && periodKey >= getCurrentMonth();

  // ====================================================
  // CHARGEMENT DES DONNÉES
  // ====================================================

  const loadStats = useCallback(async () => {
    const response = await API.get("/pastoral-alerts/stats");

    setStats(response.data?.data || initialStats);
  }, []);

  const loadAlerts = useCallback(async () => {
    const response = await API.get("/pastoral-alerts", {
      params: {
        periodKey,
        ...(search.trim() && { search: search.trim() }),
        ...(levelFilter && { level: levelFilter }),
        ...(statusFilter && { status: statusFilter }),
      },
    });

    setAlerts(
      Array.isArray(response.data?.data)
        ? response.data.data
        : []
    );
  }, [periodKey, search, levelFilter, statusFilter]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadStats(), loadAlerts()]);
  }, [loadStats, loadAlerts]);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const [statsResponse, alertsResponse] = await Promise.all([
          API.get("/pastoral-alerts/stats"),
          API.get("/pastoral-alerts", {
            params: {
              periodKey,
              ...(search.trim() && { search: search.trim() }),
              ...(levelFilter && { level: levelFilter }),
              ...(statusFilter && { status: statusFilter }),
            },
          }),
        ]);

        if (cancelled) return;

        setStats(statsResponse.data?.data || initialStats);
        setAlerts(
          Array.isArray(alertsResponse.data?.data)
            ? alertsResponse.data.data
            : []
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Erreur chargement pastoral :", err);

        setError(
          err.response?.data?.message ||
            "Impossible de charger les alertes pastorales."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [periodKey, search, levelFilter, statusFilter]);

  // ====================================================
  // FILTRAGE LOCAL
  // ====================================================

  const visibleAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (!showResolved && alert.status === "Résolue") {
        return false;
      }

      // Protection si l'API renvoie plusieurs périodes.
      if (periodKey && alert.periodKey !== periodKey) {
        return false;
      }

      return true;
    });
  }, [alerts, showResolved, periodKey]);

  // ====================================================
  // ANALYSE MENSUELLE
  // ====================================================

  const handleScan = async () => {
    if (scanning || loading || isCurrentOrFuturePeriod) return;

    try {
      setScanning(true);
      setError("");
      setSuccessMessage("");

      const response = await API.post("/pastoral-alerts/scan", {
        periodKey,
      });

      const data = response.data?.data || {};

      setSuccessMessage(
        `Analyse de ${formatPeriod(periodKey)} terminée : ` +
          `${data.activeAlerts ?? 0} alerte(s) active(s), ` +
          `${data.created ?? 0} créée(s), ` +
          `${data.updated ?? 0} mise(s) à jour, ` +
          `${data.unchanged ?? 0} inchangée(s).`
      );

      await refreshData();
    } catch (err) {
      console.error("Erreur analyse pastorale :", err);

      setError(
        err.response?.data?.message ||
          "L'analyse des absences a échoué."
      );
    } finally {
      setScanning(false);
    }
  };

  // ====================================================
  // MODAL DE SUIVI
  // ====================================================

  const openAlertModal = (alert) => {
    setSelectedAlert(alert);

    setForm({
      status: alert.status || "Ouverte",
      note: alert.note || "",
      contacted: false,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalSaving) return;

    setModalOpen(false);
    setSelectedAlert(null);
    setForm(initialForm);
  };

  // ====================================================
  // ENREGISTREMENT
  // ====================================================

  const saveAlert = async () => {
    if (!selectedAlert?._id || modalSaving) return;

    try {
      setModalSaving(true);
      setError("");
      setSuccessMessage("");

      await API.put(`/pastoral-alerts/${selectedAlert._id}`, {
        status: form.status,
        note: form.note,
        contacted: form.contacted,
      });

      await refreshData();

      setModalOpen(false);
      setSelectedAlert(null);
      setForm(initialForm);

      setSuccessMessage(
        "Le suivi pastoral a été enregistré avec succès."
      );
    } catch (err) {
      console.error("Erreur mise à jour pastorale :", err);

      setError(
        err.response?.data?.message ||
          "Impossible de mettre à jour l'alerte."
      );
    } finally {
      setModalSaving(false);
    }
  };

  // ====================================================
  // CONTACT PASTORAL
  // ====================================================

  const markContacted = async (alert) => {
    if (!alert?._id || quickActionId) return;

    try {
      setQuickActionId(alert._id);
      setError("");
      setSuccessMessage("");

      await API.put(`/pastoral-alerts/${alert._id}`, {
        contacted: true,
      });

      await refreshData();

      setSuccessMessage(
        `Contact pastoral enregistré pour ${getMemberName(
          alert.member
        )}.`
      );
    } catch (err) {
      console.error("Erreur contact pastoral :", err);

      setError(
        err.response?.data?.message ||
          "Impossible d'enregistrer le contact."
      );
    } finally {
      setQuickActionId(null);
    }
  };

  const openMemberProfile = (memberId) => {
    if (memberId) navigate(`/members/${memberId}`);
  };

  // ====================================================
  // RENDU : PARTIE 2 CI-DESSOUS
  // ====================================================

  return (
    <Layout>
      <div className="pastoral-alerts-page">

        {/* EN-TÊTE */}

        <div className="pastoral-alerts-header">
          <div>
            <div className="pastoral-alerts-eyebrow">
              SUIVI PASTORAL INTELLIGENT
            </div>

            <h1>Alertes pastorales</h1>

            <p>
              Détectez les absences prolongées et organisez
              un accompagnement pastoral adapté.
            </p>
          </div>

          <div className="pastoral-header-actions">
            <label className="pastoral-period-control">
              <span>Mois à analyser</span>

              <input
                type="month"
                value={periodKey}
                max={getPreviousMonth()}
                onChange={(event) => {
                  setPeriodKey(event.target.value);
                  setSuccessMessage("");
                }}
              />
            </label>

            <button
              type="button"
              className="pastoral-scan-button"
              onClick={handleScan}
              disabled={
                scanning ||
                loading ||
                isCurrentOrFuturePeriod ||
                !periodKey
              }
            >
              {scanning
                ? "Analyse en cours..."
                : "🔎 Analyser les absences"}
            </button>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="pastoral-message error" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="pastoral-message success" role="status">
            {successMessage}
          </div>
        )}

        {/* INDICATEURS */}

        <div className="pastoral-kpi-grid">
          {[
            {
              label: "Alertes actives",
              value: stats.totalOpen ?? 0,
              icon: "🚨",
              className: "",
            },
            {
              label: "Attention",
              value: stats.byLevel?.attention ?? 0,
              icon: "⚠️",
              className: "attention",
            },
            {
              label: "À suivre",
              value: stats.byLevel?.followUp ?? 0,
              icon: "👀",
              className: "follow-up",
            },
            {
              label: "Critiques",
              value: stats.byLevel?.critical ?? 0,
              icon: "🛟",
              className: "critical",
            },
            {
              label: "En cours",
              value: stats.inProgress ?? 0,
              icon: "🤝",
              className: "",
            },
            {
              label: "Résolues",
              value: stats.resolved ?? 0,
              icon: "✅",
              className: "",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`pastoral-kpi-card ${item.className}`}
            >
              <div className="pastoral-kpi-icon">
                {item.icon}
              </div>

              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* FILTRES */}

        <div className="pastoral-filters">
          <div className="pastoral-search">
            <span>🔎</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une personne..."
            />
          </div>

          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            aria-label="Filtrer par niveau"
          >
            <option value="">Tous les niveaux</option>
            <option value="Attention">Attention</option>
            <option value="À suivre">À suivre</option>
            <option value="Critique">Critique</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            <option value="Ouverte">Ouverte</option>
            <option value="En cours">En cours</option>
            <option value="Résolue">Résolue</option>
          </select>

          <label className="pastoral-resolved-toggle">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(event) =>
                setShowResolved(event.target.checked)
              }
            />
            Afficher les résolues
          </label>
        </div>

        {/* LISTE DES ALERTES */}

        {loading ? (
          <div className="pastoral-state-card">
            Chargement des données pastorales...
          </div>
        ) : visibleAlerts.length === 0 ? (
          <div className="pastoral-state-card success-state">
            <div className="pastoral-state-icon">🌱</div>

            <h3>Aucune alerte à afficher</h3>

            <p>
              Aucune alerte ne correspond aux critères
              sélectionnés pour {formatPeriod(periodKey)}.
            </p>
          </div>
        ) : (
          <div className="pastoral-alert-list">
            {visibleAlerts.map((alert) => {
              const member = alert.member || {};
              const absenceCount = alert.absenceCount ?? 0;

              return (
                <article
                  key={alert._id}
                  className={`pastoral-alert-card ${getLevelClass(
                    alert.level
                  )}`}
                >
                  {/* IDENTITÉ */}

                  <div className="pastoral-alert-main">
                    <div className="pastoral-member-avatar">
                      {member.firstName
                        ?.charAt(0)
                        ?.toUpperCase() || "?"}
                    </div>

                    <div className="pastoral-alert-person">
                      <div className="pastoral-alert-badges">
                        <span
                          className={`pastoral-level-badge ${getLevelClass(
                            alert.level
                          )}`}
                        >
                          {alert.level}
                        </span>

                        <span
                          className={`pastoral-status-badge ${getStatusClass(
                            alert.status
                          )}`}
                        >
                          {alert.status}
                        </span>
                      </div>

                      <h3>{getMemberName(member)}</h3>

                      <div className="pastoral-member-meta">
                        {member.phone && (
                          <span>📞 {member.phone}</span>
                        )}

                        {member.email && (
                          <span>✉️ {member.email}</span>
                        )}

                        <span>
                          📅 {formatPeriod(alert.periodKey)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MÉTRIQUES */}

                  <div className="pastoral-alert-metrics">
                    <div>
                      <span>Absences détectées</span>
                      <strong>{absenceCount}</strong>
                    </div>

                    <div>
                      <span>Dernière présence</span>
                      <strong>
                        {formatDate(alert.lastPresenceDate)}
                      </strong>
                    </div>

                    <div>
                      <span>Dernier culte analysé</span>
                      <strong>
                        {formatDate(
                          alert.lastCheckedServiceDate
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Responsable</span>
                      <strong>
                        {alert.assignedTo?.name ||
                          [
                            alert.assignedTo?.firstName,
                            alert.assignedTo?.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ") ||
                          "Non assigné"}
                      </strong>
                    </div>
                  </div>

                  {/* INFORMATIONS COMPLÉMENTAIRES */}

                  <div className="pastoral-alert-details">
                    
                    <span>
                      Contact pastoral :{" "}
                      <strong>
                        {alert.contactedAt
                          ? formatDate(alert.contactedAt)
                          : "Non enregistré"}
                      </strong>
                    </span>
                  </div>

                  {/* NOTE */}

                  {alert.note && (
                    <div className="pastoral-alert-note">
                      <strong>Note pastorale</strong>
                      <p>{alert.note}</p>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="pastoral-alert-actions">
                    <button
                      type="button"
                      className="pastoral-button secondary"
                      onClick={() =>
                        openMemberProfile(member._id)
                      }
                    >
                      👤 Profil 360°
                    </button>

                    {alert.status !== "Résolue" &&
                      !alert.contactedAt && (
                        <button
                          type="button"
                          className="pastoral-button contact"
                          onClick={() => markContacted(alert)}
                          disabled={Boolean(quickActionId)}
                        >
                          {quickActionId === alert._id
                            ? "Enregistrement..."
                            : "📞 Marquer contacté"}
                        </button>
                      )}

                    <button
                      type="button"
                      className="pastoral-button primary"
                      onClick={() => openAlertModal(alert)}
                    >
                      📝 Gérer l'alerte
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* FENÊTRE DE SUIVI */}

        {modalOpen && selectedAlert && (
          <div
            className="pastoral-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <div
              className="pastoral-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pastoral-modal-title"
            >
              <div className="pastoral-modal-header">
                <div>
                  <span>Suivi pastoral</span>

                  <h2 id="pastoral-modal-title">
                    {getMemberName(selectedAlert.member)}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalSaving}
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              <div className="pastoral-modal-summary">
                <div>
                  <span>Niveau</span>
                  <strong>{selectedAlert.level}</strong>
                </div>

                <div>
                  <span>Absences détectées</span>
                  <strong>
                    {selectedAlert.absenceCount ?? 0} culte(s)
                  </strong>
                </div>
              </div>

              <div className="pastoral-form-group">
                <label htmlFor="pastoral-status">
                  Statut de l'alerte
                </label>

                <select
                  id="pastoral-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="Ouverte">Ouverte</option>
                  <option value="En cours">En cours</option>
                  <option value="Résolue">Résolue</option>
                </select>
              </div>

              <div className="pastoral-form-group">
                <label htmlFor="pastoral-note">
                  Note pastorale
                </label>

                <textarea
                  id="pastoral-note"
                  rows={5}
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Ex. Appel effectué, entretien prévu..."
                />
              </div>

              <label className="pastoral-contact-checkbox">
                <input
                  type="checkbox"
                  checked={form.contacted}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contacted: event.target.checked,
                    }))
                  }
                />

                J'ai contacté cette personne aujourd'hui
              </label>

              {selectedAlert.contactedAt && (
                <p className="pastoral-contact-info">
                  Dernier contact enregistré :{" "}
                  {formatDate(selectedAlert.contactedAt)}
                </p>
              )}

              <div className="pastoral-modal-actions">
                <button
                  type="button"
                  className="pastoral-button secondary"
                  onClick={closeModal}
                  disabled={modalSaving}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  className="pastoral-button primary"
                  onClick={saveAlert}
                  disabled={modalSaving}
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
