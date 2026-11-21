
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import API from "../api/axios";

import "../styles/ManagementPages.css";
import "./MemberProfile.css";

const SPIRITUAL_STAGES = [
  "Visiteur", "Nouveau", "Suivi", "Intégration",
  "Membre", "Baptisé", "Formation", "Serviteur", "Responsable",
];

const getId = (value) =>
  String(value?._id || value?.id || value || "");

const getName = (value) => {
  if (!value) return "Non assigné";
  if (typeof value === "string") return value;
  return (
    value.name ||
    [value.firstName, value.lastName].filter(Boolean).join(" ") ||
    "Non assigné"
  );
};

const formatDate = (value) => {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignée";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPeriod = (value) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || "")) {
    return "Période non renseignée";
  }
  return new Date(`${value}-01T12:00:00`).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" }
  );
};

const calculateAge = (value) => {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() &&
      now.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : null;
};

const getInitials = (firstName, lastName) =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "P";

const getPersonCategory = (ageGroup) => {
  if (["0-3", "4-6", "7-10", "11-14"].includes(ageGroup)) {
    return "Enfant";
  }
  if (ageGroup === "15-17") return "Adolescent";
  if (ageGroup === "18+") return "Adulte";
  return "Non renseigné";
};

const getAttendanceClass = (status) => {
  const classes = {
    Présent: "status-active",
    "En retard": "status-warning",
    Absent: "status-inactive",
    Excusé: "status-planned",
  };
  return `status-badge ${classes[status] || "status-pending"}`;
};

const getPastoralAlertStyle = (level) => {
  const colors = {
    Critique: ["#b91c1c", "rgba(239,68,68,.08)"],
    "À suivre": ["#c2410c", "rgba(249,115,22,.08)"],
    Attention: ["#b45309", "rgba(245,158,11,.08)"],
  };
  const [color, background] = colors[level] || colors.Attention;
  return {
    color,
    background,
    border: `1px solid ${color}33`,
  };
};

const getHistoryIcon = (category) => {
  const icons = {
    Identité: "👤",
    Visiteur: "👋",
    Intégration: "🤝",
    "Parcours spirituel": "✨",
    Famille: "👨‍👩‍👧",
    Groupe: "🏘️",
    Département: "🏢",
    Responsabilité: "🎯",
    Présence: "✅",
    "Suivi pastoral": "🛟",
    Administration: "⚙️",
  };
  return icons[category] || "🕓";
};

const getHistoryAccent = (category) => {
  const colors = {
    Identité: "#475569",
    Visiteur: "#d97706",
    Intégration: "#059669",
    "Parcours spirituel": "#7c3aed",
    Famille: "#db2777",
    Groupe: "#6048df",
    Département: "#2563eb",
    Responsabilité: "#0f766e",
    Présence: "#16a34a",
    "Suivi pastoral": "#dc2626",
    Administration: "#64748b",
  };
  return colors[category] || "#6b7280";
};

function Info({ label, children, full = false }) {
  return (
    <div
      className={`member-profile-info ${
        full ? "member-profile-info-full" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{children ?? "—"}</strong>
    </div>
  );
}

function SectionHeader({ icon, title, description, action }) {
  return (
    <div className="member-profile-card-header">
      <div>
        <div className="member-profile-section-icon">{icon}</div>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptySection({ icon, title, description }) {
  return (
    <div className="member-family-empty">
      <div className="member-family-empty-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showContact, setShowContact] = useState(true);

  const [member, setMember] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [family, setFamily] = useState(null);
  const [spiritualJourney, setSpiritualJourney] = useState(null);
  const [pastoralAlerts, setPastoralAlerts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [personHistory, setPersonHistory] = useState([]);
  const [historyCategories, setHistoryCategories] = useState([]);
  const [selectedHistoryCategory, setSelectedHistoryCategory] =
    useState("Tous");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [journeyModalOpen, setJourneyModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");
  const [stageNote, setStageNote] = useState("");
  const [savingStage, setSavingStage] = useState(false);
  const [stageError, setStageError] = useState("");
  const [stageSuccess, setStageSuccess] = useState("");

  const fetchProfile = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          API.get(`/members/${id}`),
          API.get("/attendances", {
            params: { member: id, limit: 1000 },
          }),
          API.get(`/families/member/${id}`),
          API.get(`/spiritual-journey/member/${id}`),
          API.get(`/pastoral-alerts/member/${id}`),
          API.get(`/groups/member/${id}`),
          API.get(`/departments/member/${id}`),
          API.get(`/person-history/member/${id}`, {
            params: { limit: 100 },
          }),
        ]);

        const [
          memberResult,
          attendanceResult,
          familyResult,
          journeyResult,
          alertResult,
          groupsResult,
          departmentsResult,
          historyResult,
        ] = results;

        if (memberResult.status === "rejected") {
          throw memberResult.reason;
        }

        setMember(memberResult.value.data?.data || null);

        const dataOr = (result, fallback) =>
          result.status === "fulfilled"
            ? result.value.data?.data ?? fallback
            : fallback;

        const attendanceData = dataOr(attendanceResult, []);
        setAttendances(
          Array.isArray(attendanceData) ? attendanceData : []
        );

        setFamily(dataOr(familyResult, null));
        setSpiritualJourney(dataOr(journeyResult, null));

        const alertData = dataOr(alertResult, {});
        const alerts = Array.isArray(alertData)
          ? alertData
          : alertData?.alerts || [];
        setPastoralAlerts(Array.isArray(alerts) ? alerts : []);

        const groupData = dataOr(groupsResult, {});
        const groupList = Array.isArray(groupData)
          ? groupData
          : groupData?.groups || [];
        setGroups(Array.isArray(groupList) ? groupList : []);

        const departmentData = dataOr(departmentsResult, {});
        const departmentList = Array.isArray(departmentData)
          ? departmentData
          : departmentData?.departments || [];
        setDepartments(
          Array.isArray(departmentList) ? departmentList : []
        );

        const historyData = dataOr(historyResult, {});
        setPersonHistory(
          Array.isArray(historyData?.history)
            ? historyData.history
            : []
        );
        setHistoryCategories(
          Array.isArray(historyData?.categories)
            ? historyData.categories
            : []
        );
      } catch (err) {
        console.error("Erreur profil personne :", err);
        setError(
          err.response?.data?.message ||
            "Impossible de charger le profil de cette personne."
        );
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (id) fetchProfile();
  }, [id, fetchProfile]);

  const attendanceStats = useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter(
      (a) => a.status === "Présent" || a.status === "En retard"
    ).length;
    const absent = attendances.filter(
      (a) => a.status === "Absent"
    ).length;
    const excused = attendances.filter(
      (a) => a.status === "Excusé"
    ).length;
    const late = attendances.filter(
      (a) => a.status === "En retard"
    ).length;

    return {
      total,
      present,
      absent,
      excused,
      late,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  }, [attendances]);

  const activePastoralAlerts = useMemo(
    () => pastoralAlerts.filter((a) => a.status !== "Résolue"),
    [pastoralAlerts]
  );

  const primaryPastoralAlert = useMemo(() => {
    const priority = { Critique: 3, "À suivre": 2, Attention: 1 };
    return (
      [...activePastoralAlerts].sort(
        (a, b) =>
          (priority[b.level] || 0) - (priority[a.level] || 0)
      )[0] || null
    );
  }, [activePastoralAlerts]);

  const age = calculateAge(member?.birthDate);
  const category = getPersonCategory(member?.ageGroup);
  const isVisitor = member?.membershipType === "Visiteur";
  const wasVisitor = member?.wasVisitor === true;

  const familyMembers = Array.isArray(family?.members)
    ? family.members
    : [];

  const currentFamilyMember = familyMembers.find(
    (entry) => getId(entry.member) === String(id)
  );

  const familyRole =
    currentFamilyMember?.relationship ||
    member?.familyRole ||
    "Non renseigné";

  const currentStage =
    spiritualJourney?.currentStage ||
    member?.spiritualStage ||
    (isVisitor ? "Visiteur" : "Membre");

  const stageSince =
    spiritualJourney?.stageSince ||
    member?.spiritualStageSince ||
    null;

  const journeyHistory = useMemo(
    () =>
      Array.isArray(spiritualJourney?.history)
        ? [...spiritualJourney.history].sort(
            (a, b) =>
              new Date(b.enteredAt) - new Date(a.enteredAt)
          )
        : [],
    [spiritualJourney]
  );

  const availableStages =
    Array.isArray(spiritualJourney?.availableStages) &&
    spiritualJourney.availableStages.length
      ? spiritualJourney.availableStages
      : SPIRITUAL_STAGES;

  const currentStageIndex = availableStages.indexOf(currentStage);

  const activeGroups = useMemo(
    () => groups.filter((g) => g.status !== "Inactif"),
    [groups]
  );

  const activeDepartments = useMemo(
    () => departments.filter((d) => d.status !== "inactive"),
    [departments]
  );

  const getMembership = (entity) =>
    Array.isArray(entity?.members)
      ? entity.members.find(
          (entry) =>
            getId(entry.member) === String(id) &&
            entry.isActive !== false
        )
      : null;

  const filteredPersonHistory = useMemo(
    () =>
      selectedHistoryCategory === "Tous"
        ? personHistory
        : personHistory.filter(
            (item) => item.category === selectedHistoryCategory
          ),
    [personHistory, selectedHistoryCategory]
  );

  const availableHistoryCategories = [
    "Tous",
    ...historyCategories,
  ];

  const openJourneyModal = () => {
    setSelectedStage(currentStage);
    setStageNote("");
    setStageError("");
    setStageSuccess("");
    setJourneyModalOpen(true);
  };

  const closeJourneyModal = () => {
    if (savingStage) return;
    setJourneyModalOpen(false);
    setSelectedStage("");
    setStageNote("");
    setStageError("");
    setStageSuccess("");
  };

  const handleStageChange = async (event) => {
    event.preventDefault();
    setStageError("");
    setStageSuccess("");

    if (!selectedStage) {
      setStageError("Choisis une nouvelle étape.");
      return;
    }

    if (selectedStage === currentStage) {
      setStageError(
        `Cette personne est déjà à l’étape « ${currentStage} ».`
      );
      return;
    }

    try {
      setSavingStage(true);
      const response = await API.put(
        `/spiritual-journey/member/${id}/stage`,
        {
          stage: selectedStage,
          note: stageNote.trim(),
        }
      );

      setStageSuccess(
        response.data?.message || "Parcours mis à jour."
      );
      await fetchProfile(false);
      setJourneyModalOpen(false);
      setStageNote("");
    } catch (err) {
      console.error("Erreur changement parcours :", err);
      setStageError(
        err.response?.data?.message ||
          "Impossible de modifier le parcours."
      );
    } finally {
      setSavingStage(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-loading">
            <div className="management-spinner" />
            <div>Chargement du profil 360°...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !member) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-empty">
            <div className="management-empty-icon">⚠️</div>
            <h3>Profil indisponible</h3>
            <p>{error || "Cette personne est introuvable."}</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/members")}
            >
              ← Retour aux membres
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="management-page member-profile-page">
        <button
          type="button"
          className="member-profile-back"
          onClick={() => navigate("/members")}
        >
          ← Retour aux personnes
        </button>

        <section className="member-profile-hero">
          <div className="member-profile-identity">
            <div className="member-profile-avatar">
              {getInitials(member.firstName, member.lastName)}
            </div>
            <div>
              <div className="member-profile-eyebrow">
                PROFIL PERSONNE 360°
              </div>
              <h1>
                {member.firstName} {member.lastName}
              </h1>
              <div className="member-profile-badges">
                <span className="status-badge status-active">
                  {member.membershipType || "Membre"}
                </span>
                <span
                  className={`status-badge ${
                    member.status === "Actif"
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {member.status || "—"}
                </span>
                <span className="member-profile-category">
                  {category}
                </span>
                <span className="member-profile-spiritual-badge">
                  ✨ {currentStage}
                </span>
                {primaryPastoralAlert && (
                  <span
                    className="status-badge"
                    style={getPastoralAlertStyle(
                      primaryPastoralAlert.level
                    )}
                  >
                    🛟 {primaryPastoralAlert.level}
                  </span>
                )}
                {family && (
                  <span className="member-profile-family-badge">
                    👨‍👩‍👧 {family.name}
                  </span>
                )}
                {activeGroups.length > 0 && (
                  <span className="member-profile-family-badge">
                    🏘️ {activeGroups.length} groupe(s)
                  </span>
                )}
                {activeDepartments.length > 0 && (
                  <span className="member-profile-family-badge">
                    🏢 {activeDepartments.length} département(s)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/members")}
          >
            👥 Liste des personnes
          </button>
        </section>

        <div className="member-profile-kpis">
          <div className="member-profile-kpi">
            <span>Âge</span>
            <strong>{age === null ? "—" : `${age} ans`}</strong>
            <small>{member.ageGroup || "Non renseigné"}</small>
          </div>
          <div className="member-profile-kpi">
            <span>Présences</span>
            <strong>{attendanceStats.present}</strong>
            <small>{attendanceStats.rate}% de participation</small>
          </div>
          <div className="member-profile-kpi">
            <span>Parcours actuel</span>
            <strong className="member-profile-kpi-status">
              {currentStage}
            </strong>
            <small>Depuis {formatShortDate(stageSince)}</small>
          </div>
          <div className="member-profile-kpi">
            <span>Vigilance pastorale</span>
            <strong
              className="member-profile-kpi-status"
              style={{
                color: primaryPastoralAlert
                  ? getPastoralAlertStyle(
                      primaryPastoralAlert.level
                    ).color
                  : "#15803d",
              }}
            >
              {primaryPastoralAlert
                ? primaryPastoralAlert.level
                : "RAS"}
            </strong>
            <small>
              {primaryPastoralAlert
                ? `${primaryPastoralAlert.absenceCount ?? 0} absence(s) détectée(s)`
                : "Aucune alerte active"}
            </small>
          </div>
        </div>

        <section
          className="management-card member-profile-card"
          style={{ marginBottom: 24 }}
        >
          <SectionHeader
            icon="🛟"
            title="Vigilance pastorale"
            description="Détection automatique des situations nécessitant une attention pastorale."
            action={
              primaryPastoralAlert ? (
                <span
                  style={{
                    ...getPastoralAlertStyle(
                      primaryPastoralAlert.level
                    ),
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {primaryPastoralAlert.level}
                </span>
              ) : (
                <span className="status-badge status-active">
                  ✓ Situation normale
                </span>
              )
            }
          />

          {primaryPastoralAlert ? (
            <>
              <div
                style={{
                  ...getPastoralAlertStyle(
                    primaryPastoralAlert.level
                  ),
                  padding: 18,
                  borderRadius: 14,
                  marginTop: 16,
                }}
              >
                <strong>
                  🚨 Alerte : {primaryPastoralAlert.type}
                </strong>
                <p>
                  Cette personne présente{" "}
                  <strong>
                    {primaryPastoralAlert.absenceCount ?? 0}
                  </strong>{" "}
                  absence(s) détectée(s) sur la période analysée
                  {primaryPastoralAlert.periodKey
                    ? ` (${formatPeriod(
                        primaryPastoralAlert.periodKey
                      )})`
                    : ""}
                  .
                </p>
              </div>

              <div
                className="member-profile-info-grid"
                style={{ marginTop: 18 }}
              >
                <Info label="Niveau">
                  {primaryPastoralAlert.level}
                </Info>
                <Info label="Statut du suivi">
                  {primaryPastoralAlert.status}
                </Info>
                <Info label="Absences détectées">
                  {primaryPastoralAlert.absenceCount ?? 0}
                </Info>
                <Info label="Dernière présence">
                  {primaryPastoralAlert.lastPresenceDate
                    ? formatDate(
                        primaryPastoralAlert.lastPresenceDate
                      )
                    : "Aucune présence enregistrée"}
                </Info>
                <Info label="Dernier culte analysé">
                  {formatDate(
                    primaryPastoralAlert.lastCheckedServiceDate
                  )}
                </Info>
                <Info label="Responsable">
                  {getName(primaryPastoralAlert.assignedTo)}
                </Info>
                <Info label="Dernier contact">
                  {primaryPastoralAlert.contactedAt
                    ? formatDate(primaryPastoralAlert.contactedAt)
                    : "Pas encore contacté"}
                </Info>
                <Info label="Détectée le">
                  {formatDate(primaryPastoralAlert.detectedAt)}
                </Info>
              </div>

              {primaryPastoralAlert.note && (
                <div
                  className="member-profile-note"
                  style={{ marginTop: 16 }}
                >
                  <strong>Note pastorale</strong>
                  <p>{primaryPastoralAlert.note}</p>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate("/pastoral-alerts")}
                >
                  🛟 Gérer l’alerte
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: 16,
                padding: 18,
                borderRadius: 14,
                background: "rgba(34,197,94,.07)",
                border: "1px solid rgba(34,197,94,.16)",
              }}
            >
              <strong style={{ color: "#15803d" }}>
                ✓ Aucune alerte pastorale active
              </strong>
              <p>
                Aucun signal nécessitant une intervention pastorale
                n’est actuellement détecté pour cette personne.
              </p>
            </div>
          )}
        </section>

        <section className="management-card spiritual-journey-card">
          <div className="spiritual-journey-header">
            <div className="spiritual-journey-header-content">
              <div className="spiritual-journey-header-icon">
                ✨
              </div>
              <div>
                <div className="spiritual-journey-eyebrow">
                  PARCOURS DE LA PERSONNE
                </div>
                <h2>Parcours spirituel & intégration</h2>
                <p>
                  Visualisez l’évolution de la personne depuis
                  son arrivée jusqu’à ses responsabilités.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openJourneyModal}
            >
              Faire évoluer le parcours
            </button>
          </div>

          <div className="spiritual-stage-wrapper">
            <div className="spiritual-stage-track">
              {availableStages.map((stage, index) => {
                const isCurrent = stage === currentStage;
                const isPassed = currentStageIndex > index;
                return (
                  <div
                    key={stage}
                    className={`spiritual-stage ${
                      isCurrent ? "spiritual-stage-current" : ""
                    } ${
                      isPassed ? "spiritual-stage-passed" : ""
                    }`}
                  >
                    <div className="spiritual-stage-marker">
                      {isPassed ? "✓" : isCurrent ? "●" : index + 1}
                    </div>
                    <div className="spiritual-stage-name">
                      {stage}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="spiritual-journey-summary">
            <div>
              <span>Étape actuelle</span>
              <strong>{currentStage}</strong>
            </div>
            <div>
              <span>Depuis</span>
              <strong>{formatDate(stageSince)}</strong>
            </div>
            <div>
              <span>Accompagnateur</span>
              <strong>{getName(spiritualJourney?.mentor)}</strong>
            </div>
            <div>
              <span>Prochain suivi</span>
              <strong>
                {formatShortDate(
                  spiritualJourney?.nextFollowUpDate
                )}
              </strong>
            </div>
          </div>

          {spiritualJourney?.note && (
            <div className="spiritual-journey-general-note">
              <strong>Note d’accompagnement</strong>
              <p>{spiritualJourney.note}</p>
            </div>
          )}
        </section>

        <div className="member-profile-grid">
          <div className="member-profile-main">

            {/* IDENTITÉ */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="👤"
                title="Identité"
                description="Informations personnelles et coordonnées."
                action={
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setShowContact((previous) => !previous)
                    }
                    aria-expanded={showContact}
                  >
                    {showContact
                      ? "🔒 Masquer contact"
                      : "👁️ Afficher contact"}
                  </button>
                }
              />
              <div className="member-profile-info-grid">
                <Info label="Prénom">
                  {member.firstName || "—"}
                </Info>
                <Info label="Nom">
                  {member.lastName || "—"}
                </Info>
                <Info label="Sexe">
                  {member.gender || "Non renseigné"}
                </Info>
                <Info label="Date de naissance">
                  {formatDate(member.birthDate)}
                </Info>
                {showContact ? (
                  <>
                    <Info label="Téléphone">
                      {member.phone || "Non renseigné"}
                    </Info>
                    <Info label="Email">
                      {member.email || "Non renseigné"}
                    </Info>
                    <Info label="Adresse" full>
                      {member.address || "Non renseignée"}
                    </Info>
                  </>
                ) : (
                  <div
                    className="member-profile-info member-profile-info-full"
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <span>🔒 Coordonnées masquées</span>
                    <strong>
                      Clique sur « Afficher contact » pour les consulter.
                    </strong>
                  </div>
                )}
              </div>
            </section>

            {/* FAMILLE */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="👨‍👩‍👧"
                title="Famille / Foyer"
                description="Liens familiaux et personnes du même foyer."
                action={
                  family && (
                    <span className="status-badge status-active">
                      {familyMembers.length} personne(s)
                    </span>
                  )
                }
              />

              {family ? (
                <>
                  <div className="member-family-summary">
                    <div className="member-family-summary-main">
                      <div className="member-family-house-icon">🏠</div>
                      <div>
                        <span>Foyer</span>
                        <h3>{family.name}</h3>
                        <p>
                          Votre rôle : <strong>{familyRole}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="member-family-contact">
                      <div>
                        <span>Responsable</span>
                        <strong>
                          {getName(family.headOfHousehold)}
                        </strong>
                      </div>
                      <div>
                        <span>Téléphone familial</span>
                        <strong>
                          {family.phone || "Non renseigné"}
                        </strong>
                      </div>
                      <div>
                        <span>Adresse</span>
                        <strong>
                          {family.address || "Non renseignée"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="member-family-members">
                    <div className="member-family-members-title">
                      Membres du foyer
                    </div>
                    <div className="member-family-members-list">
                      {familyMembers.map((entry, index) => {
                        const person = entry.member;
                        if (!person || typeof person !== "object") {
                          return null;
                        }

                        const current = getId(person) === String(id);
                        const head =
                          getId(family.headOfHousehold) ===
                          getId(person);
                        const personAge = calculateAge(
                          person.birthDate
                        );

                        return (
                          <button
                            key={person._id || index}
                            type="button"
                            className={`member-family-person ${
                              current
                                ? "member-family-person-current"
                                : ""
                            }`}
                            onClick={() => {
                              if (!current) {
                                navigate(`/members/${person._id}`);
                              }
                            }}
                          >
                            <div className="member-family-avatar">
                              {getInitials(
                                person.firstName,
                                person.lastName
                              )}
                            </div>
                            <div className="member-family-person-info">
                              <div className="member-family-person-name">
                                {person.firstName} {person.lastName}
                                {current && <span>Vous</span>}
                              </div>
                              <div className="member-family-person-meta">
                                {entry.relationship || "Membre du foyer"}
                                {personAge !== null &&
                                  ` • ${personAge} ans`}
                                {head && " • Responsable du foyer"}
                              </div>
                            </div>
                            {!current && (
                              <div className="member-family-arrow">
                                →
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {family.notes && (
                    <div className="member-profile-note">
                      <strong>Note familiale</strong>
                      <p>{family.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <EmptySection
                  icon="🏠"
                  title="Aucun foyer associé"
                  description="Cette personne n’est actuellement rattachée à aucune famille."
                />
              )}
            </section>

            {/* GROUPES ET CELLULES */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="🏘️"
                title="Groupes & Cellules"
                description="Communautés auxquelles cette personne est actuellement rattachée."
                action={
                  activeGroups.length > 0 && (
                    <span className="status-badge status-active">
                      {activeGroups.length} groupe(s)
                    </span>
                  )
                }
              />

              {activeGroups.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(260px,1fr))",
                    gap: 14,
                    padding: 18,
                  }}
                >
                  {activeGroups.map((group) => {
                    const membership = getMembership(group);
                    const memberCount = Array.isArray(group.members)
                      ? group.members.filter(
                          (entry) => entry.isActive !== false
                        ).length
                      : 0;

                    return (
                      <button
                        key={group._id}
                        type="button"
                        onClick={() =>
                          navigate(`/groups/${group._id}`)
                        }
                        style={{
                          textAlign: "left",
                          padding: 18,
                          borderRadius: 16,
                          border: "1px solid #ddd6fe",
                          background: "#faf9ff",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            color: "#6048df",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {group.type || "Groupe"}
                        </div>
                        <h3>{group.name}</h3>
                        <span className="status-badge status-active">
                          {membership?.role || "Membre"}
                        </span>
                        <p>
                          Responsable : {getName(group.leader)}
                        </p>
                        <p>
                          Membres : {memberCount}
                          {group.capacity > 0
                            ? ` / ${group.capacity}`
                            : ""}
                        </p>
                        {(group.meetingDay || group.meetingTime) && (
                          <p>
                            🗓️ {group.meetingDay || "—"}{" "}
                            {group.meetingTime || ""}
                          </p>
                        )}
                        <p>
                          📍{" "}
                          {[group.location, group.city]
                            .filter(Boolean)
                            .join(" • ") || "Lieu non renseigné"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptySection
                  icon="🏘️"
                  title="Aucun groupe associé"
                  description="Cette personne n’est rattachée à aucun groupe actif."
                />
              )}
            </section>

            {/* DÉPARTEMENTS */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="🏢"
                title="Départements & Responsabilités"
                description="Services, fonctions et responsabilités exercés actuellement dans l’église."
                action={
                  activeDepartments.length > 0 && (
                    <span className="status-badge status-active">
                      {activeDepartments.length} département(s)
                    </span>
                  )
                }
              />

              {activeDepartments.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(280px,1fr))",
                    gap: 14,
                    padding: 18,
                  }}
                >
                  {activeDepartments.map((department) => {
                    const membership = getMembership(department);
                    const count = Array.isArray(department.members)
                      ? department.members.filter(
                          (entry) => entry.isActive !== false
                        ).length
                      : 0;

                    return (
                      <button
                        key={department._id}
                        type="button"
                        onClick={() =>
                          navigate(
                            `/departments/${department._id}`
                          )
                        }
                        style={{
                          padding: 18,
                          border: "1px solid #dbeafe",
                          borderRadius: 16,
                          background: "#f8fbff",
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            color: "#2563eb",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          DÉPARTEMENT
                        </div>
                        <h3>{department.name}</h3>
                        <span className="status-badge status-active">
                          {membership?.role || "Membre"}
                        </span>
                        {membership?.responsibility && (
                          <p>
                            🎯 {membership.responsibility}
                          </p>
                        )}
                        <p>
                          Responsable :{" "}
                          {getName(department.leader)}
                        </p>
                        <p>Équipe active : {count} personne(s)</p>
                        <p>
                          🗓️ {department.meetingDay || "—"}{" "}
                          {department.meetingTime || ""}
                        </p>
                        <p>
                          📍{" "}
                          {department.location ||
                            "Lieu non renseigné"}
                        </p>
                        {membership?.joinedAt && (
                          <small>
                            Engagé depuis le{" "}
                            {formatShortDate(membership.joinedAt)}
                          </small>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptySection
                  icon="🏢"
                  title="Aucun département associé"
                  description="Cette personne n’exerce actuellement aucune responsabilité dans un département."
                />
              )}
            </section>

            {/* HISTORIQUE COMPLET */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="🕓"
                title="Historique complet"
                description="Timeline unifiée de toutes les étapes, actions et évolutions de cette personne."
                action={
                  <span className="status-badge status-active">
                    {personHistory.length} événement(s)
                  </span>
                }
              />

              {availableHistoryCategories.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: "16px 22px",
                  }}
                >
                  {availableHistoryCategories.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        setSelectedHistoryCategory(name)
                      }
                      style={{
                        border:
                          selectedHistoryCategory === name
                            ? "1px solid #6048df"
                            : "1px solid #e5e7eb",
                        background:
                          selectedHistoryCategory === name
                            ? "#eef2ff"
                            : "#fff",
                        color:
                          selectedHistoryCategory === name
                            ? "#6048df"
                            : "#64748b",
                        borderRadius: 999,
                        padding: "8px 12px",
                        cursor: "pointer",
                      }}
                    >
                      {name === "Tous"
                        ? "Tous"
                        : `${getHistoryIcon(name)} ${name}`}
                    </button>
                  ))}
                </div>
              )}

              {filteredPersonHistory.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    padding: 22,
                  }}
                >
                  {filteredPersonHistory.map((item, index) => {
                    const accent = getHistoryAccent(item.category);

                    return (
                      <article
                        key={item._id || index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "42px 1fr",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 14,
                            background: `${accent}12`,
                            fontSize: 20,
                          }}
                        >
                          {getHistoryIcon(item.category)}
                        </div>

                        <div
                          style={{
                            padding: 16,
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                          }}
                        >
                          <small>
                            {formatDateTime(item.occurredAt)}
                          </small>
                          <h3>{item.title || "Événement"}</h3>
                          <span
                            style={{
                              color: accent,
                              fontWeight: 800,
                              fontSize: 11,
                            }}
                          >
                            {item.category || "Autre"}
                          </span>

                          {item.description && (
                            <p>{item.description}</p>
                          )}

                          {(item.previousValue ||
                            item.newValue) && (
                            <p>
                              {item.previousValue || "—"}
                              {" → "}
                              <strong>
                                {item.newValue || "—"}
                              </strong>
                            </p>
                          )}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 8,
                              fontSize: 11,
                              color: "#64748b",
                            }}
                          >
                            <span>
                              Par :{" "}
                              {item.createdBy?.name ||
                                item.createdByName ||
                                "Système"}
                            </span>
                            <span>
                              {item.origin === "manual"
                                ? "✍️ Action manuelle"
                                : "⚙️ Automatique"}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptySection
                  icon="🕓"
                  title="Aucun événement historique"
                  description="Aucun événement n’est disponible pour le filtre sélectionné."
                />
              )}
            </section>

            {/* HISTORIQUE DU PARCOURS */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="✨"
                title="Historique du parcours"
                description="Toutes les évolutions de la personne sont conservées."
                action={
                  <span className="status-badge status-planned">
                    {journeyHistory.length} étape(s)
                  </span>
                }
              />

              {journeyHistory.length > 0 ? (
                <div className="spiritual-history">
                  {journeyHistory.map((item, index) => (
                    <div
                      key={item._id || `${item.stage}-${index}`}
                      className={`spiritual-history-item ${
                        !item.exitedAt
                          ? "spiritual-history-current"
                          : ""
                      }`}
                    >
                      <div className="spiritual-history-line">
                        <div className="spiritual-history-dot">
                          {!item.exitedAt ? "●" : "✓"}
                        </div>
                      </div>
                      <div className="spiritual-history-content">
                        <div className="spiritual-history-top">
                          <div>
                            <span className="spiritual-history-date">
                              {formatDate(item.enteredAt)}
                            </span>
                            <h3>{item.stage}</h3>
                          </div>
                          {!item.exitedAt && (
                            <span className="spiritual-current-badge">
                              Étape actuelle
                            </span>
                          )}
                        </div>
                        {item.note && <p>{item.note}</p>}
                        <div className="spiritual-history-meta">
                          <span>
                            Modifié par :{" "}
                            <strong>
                              {getName(item.changedBy) ===
                              "Non assigné"
                                ? "Système"
                                : getName(item.changedBy)}
                            </strong>
                          </span>
                          {item.exitedAt && (
                            <span>
                              Jusqu’au{" "}
                              {formatShortDate(item.exitedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptySection
                  icon="✨"
                  title="Parcours non initialisé"
                  description="Aucun historique spirituel n’est encore disponible."
                />
              )}
            </section>

            {/* PARCOURS DANS L'ÉGLISE */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="⛪"
                title="Parcours dans l’église"
                description="Historique administratif de son arrivée et de son intégration."
              />
              <div className="member-profile-journey">
                <div className="member-profile-journey-item">
                  <div className="member-profile-journey-dot" />
                  <div>
                    <span>Première visite</span>
                    <strong>
                      {formatDate(member.firstVisitDate)}
                    </strong>
                  </div>
                </div>

                {wasVisitor && (
                  <div className="member-profile-journey-item">
                    <div className="member-profile-journey-dot" />
                    <div>
                      <span>Parcours visiteur</span>
                      <strong>Ancien visiteur</strong>
                    </div>
                  </div>
                )}

                {member.integratedAt && (
                  <div className="member-profile-journey-item">
                    <div className="member-profile-journey-dot" />
                    <div>
                      <span>Intégration</span>
                      <strong>
                        {formatDate(member.integratedAt)}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="member-profile-journey-item">
                  <div className="member-profile-journey-dot" />
                  <div>
                    <span>Membre depuis</span>
                    <strong>
                      {formatDate(member.membershipDate)}
                    </strong>
                  </div>
                </div>

                <div className="member-profile-journey-item">
                  <div className="member-profile-journey-dot member-profile-journey-dot-current" />
                  <div>
                    <span>Situation actuelle</span>
                    <strong>
                      {member.membershipType || "—"} •{" "}
                      {member.status || "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* HISTORIQUE DES PRÉSENCES */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="✅"
                title="Historique des présences"
                description="Participation aux événements de l’église."
                action={
                  <span className="status-badge status-planned">
                    {attendanceStats.total} pointage(s)
                  </span>
                }
              />

              {attendances.length > 0 ? (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Événement</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th>Première visite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendances.map((attendance, index) => (
                        <tr key={attendance._id || index}>
                          <td>
                            <strong>
                              {attendance.event?.title ||
                                "Événement"}
                            </strong>
                            {attendance.event?.location && (
                              <div className="person-secondary">
                                {attendance.event.location}
                              </div>
                            )}
                          </td>
                          <td>
                            {formatShortDate(
                              attendance.event?.date
                            )}
                          </td>
                          <td>
                            <span
                              className={getAttendanceClass(
                                attendance.status
                              )}
                            >
                              {attendance.status || "—"}
                            </span>
                          </td>
                          <td>
                            {attendance.isFirstVisit
                              ? "⭐ Oui"
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptySection
                  icon="✅"
                  title="Aucune présence"
                  description="Cette personne n’a encore aucun historique de présence."
                />
              )}
            </section>
          </div>

          {/* BARRE LATÉRALE */}
          <aside className="member-profile-sidebar">
            {/* SUIVI PASTORAL */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="🤝"
                title="Suivi pastoral"
                description="Accompagnement de la personne."
              />
              <div className="member-profile-sidebar-list">
                <div>
                  <span>Statut</span>
                  <strong>
                    {member.followUpStatus || "Non commencé"}
                  </strong>
                </div>
                <div>
                  <span>Responsable</span>
                  <strong>
                    {getName(member.followUpAssignedTo)}
                  </strong>
                </div>
                <div>
                  <span>Dernier contact</span>
                  <strong>
                    {formatDate(member.lastContactDate)}
                  </strong>
                </div>
                <div>
                  <span>Prochaine relance</span>
                  <strong>
                    {formatDate(member.nextFollowUpDate)}
                  </strong>
                </div>
              </div>
              {member.followUpNote && (
                <div className="member-profile-note">
                  <strong>Note pastorale</strong>
                  <p>{member.followUpNote}</p>
                </div>
              )}
            </section>

            {/* PARTICIPATION */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="📊"
                title="Participation"
                description="Synthèse individuelle."
              />
              <div className="member-profile-mini-stats">
                <div>
                  <strong>{attendanceStats.present}</strong>
                  <span>Présences</span>
                </div>
                <div>
                  <strong>{attendanceStats.absent}</strong>
                  <span>Absences</span>
                </div>
                <div>
                  <strong>{attendanceStats.late}</strong>
                  <span>Retards</span>
                </div>
                <div>
                  <strong>{attendanceStats.excused}</strong>
                  <span>Excusé</span>
                </div>
              </div>
              <div className="member-profile-rate">
                <div>
                  <span>Taux de participation</span>
                  <strong>{attendanceStats.rate}%</strong>
                </div>
                <div className="member-profile-progress">
                  <div
                    style={{
                      width: `${Math.min(
                        attendanceStats.rate,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* ENGAGEMENT */}
            <section className="management-card member-profile-card">
              <SectionHeader
                icon="🏢"
                title="Engagement"
                description="Service et responsabilités."
              />
              <div className="member-profile-sidebar-list">
                <div>
                  <span>Département(s)</span>
                  <strong>
                    {activeDepartments.length === 0
                      ? "Aucun département"
                      : activeDepartments.length === 1
                        ? activeDepartments[0].name
                        : `${activeDepartments.length} départements`}
                  </strong>
                </div>
                <div>
                  <span>Responsabilité principale</span>
                  <strong>
                    {activeDepartments.length > 0
                      ? getMembership(activeDepartments[0])
                          ?.responsibility ||
                        getMembership(activeDepartments[0])
                          ?.role ||
                        "Non renseignée"
                      : "Aucune responsabilité"}
                  </strong>
                </div>
                <div>
                  <span>Étape spirituelle</span>
                  <strong>{currentStage}</strong>
                </div>
                <div>
                  <span>Groupe / Cellule</span>
                  <strong>
                    {activeGroups.length === 0
                      ? "Aucun groupe"
                      : activeGroups.length === 1
                        ? activeGroups[0].name
                        : `${activeGroups.length} groupes`}
                  </strong>
                </div>
              </div>
            </section>

            {/* PROFIL UNIFIÉ */}
            <section className="management-card member-profile-card member-profile-future">
              <SectionHeader
                icon="✨"
                title="Profil unifié"
                description="Le cœur humain d’Eldior."
              />
              <div className="member-profile-future-list">
                <span className="member-profile-feature-done">
                  ✅ Famille
                </span>
                <span className="member-profile-feature-done">
                  ✅ Parcours spirituel
                </span>
                <span className="member-profile-feature-done">
                  ✅ Vigilance pastorale
                </span>
                <span className="member-profile-feature-done">
                  ✅ Cellules / Groupes
                </span>
                <span className="member-profile-feature-done">
                  ✅ Départements / Responsabilités
                </span>
                <span>📚 Formations</span>
                <span className="member-profile-feature-done">
                  ✅ Historique complet
                </span>
              </div>
            </section>
          </aside>
        </div>

        {/* MODALE PARCOURS SPIRITUEL */}
        {journeyModalOpen && (
          <div
            className="spiritual-modal-overlay"
            onMouseDown={closeJourneyModal}
          >
            <div
              className="spiritual-modal"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="spiritual-modal-header">
                <div>
                  <span>PARCOURS SPIRITUEL</span>
                  <h2>
                    Faire évoluer {member.firstName}
                  </h2>
                  <p>
                    Étape actuelle :{" "}
                    <strong>{currentStage}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="spiritual-modal-close"
                  onClick={closeJourneyModal}
                  disabled={savingStage}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleStageChange}>
                <div className="spiritual-modal-body">
                  <div className="spiritual-form-group">
                    <label htmlFor="member-stage">
                      Nouvelle étape
                    </label>
                    <select
                      id="member-stage"
                      value={selectedStage}
                      onChange={(event) =>
                        setSelectedStage(event.target.value)
                      }
                      disabled={savingStage}
                    >
                      {availableStages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                          {stage === currentStage
                            ? " — actuelle"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="spiritual-form-group">
                    <label htmlFor="member-stage-note">
                      Note
                    </label>
                    <textarea
                      id="member-stage-note"
                      rows={4}
                      value={stageNote}
                      onChange={(event) =>
                        setStageNote(event.target.value)
                      }
                      placeholder="Ex. Baptême effectué, formation commencée, intégration terminée..."
                      disabled={savingStage}
                    />
                    <small>
                      Cette note sera conservée dans
                      l’historique du parcours.
                    </small>
                  </div>

                  {stageError && (
                    <div className="spiritual-form-error">
                      ⚠️ {stageError}
                    </div>
                  )}

                  {stageSuccess && (
                    <div className="spiritual-form-success">
                      ✓ {stageSuccess}
                    </div>
                  )}
                </div>

                <div className="spiritual-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeJourneyModal}
                    disabled={savingStage}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingStage}
                  >
                    {savingStage
                      ? "Enregistrement..."
                      : "Confirmer l’évolution"}
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
