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

import "../styles/ManagementPages.css";
import "./MemberProfile.css";

// ======================================================
// PARCOURS SPIRITUEL
// ======================================================

const SPIRITUAL_STAGES = [
  "Visiteur",
  "Nouveau",
  "Suivi",
  "Intégration",
  "Membre",
  "Baptisé",
  "Formation",
  "Serviteur",
  "Responsable",
];

// ======================================================
// HELPERS
// ======================================================

const calculateAge = (birthDate) => {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(birthDate);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();

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
      today.getDate() < birth.getDate()
    )
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const formatDate = (value) => {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (
  firstName,
  lastName
) => {
  const first =
    firstName?.[0] || "";

  const last =
    lastName?.[0] || "";

  return (
    `${first}${last}`.toUpperCase() ||
    "P"
  );
};

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

  if (ageGroup === "15-17") {
    return "Adolescent";
  }

  if (ageGroup === "18+") {
    return "Adulte";
  }

  return "Non renseigné";
};

const getAttendanceClass = (
  status
) => {
  switch (status) {
    case "Présent":
      return "status-badge status-active";

    case "En retard":
      return "status-badge status-warning";

    case "Absent":
      return "status-badge status-inactive";

    case "Excusé":
      return "status-badge status-planned";

    default:
      return "status-badge status-pending";
  }
};

const getPastoralAlertStyle = (
  level
) => {
  switch (level) {
    case "Critique":
      return {
        background:
          "rgba(239, 68, 68, 0.08)",
        border:
          "1px solid rgba(239, 68, 68, 0.22)",
        color: "#b91c1c",
      };

    case "À suivre":
      return {
        background:
          "rgba(249, 115, 22, 0.08)",
        border:
          "1px solid rgba(249, 115, 22, 0.22)",
        color: "#c2410c",
      };

    default:
      return {
        background:
          "rgba(245, 158, 11, 0.08)",
        border:
          "1px solid rgba(245, 158, 11, 0.22)",
        color: "#b45309",
      };
  }
};

// ======================================================
// PAGE
// ======================================================

export default function MemberProfile() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [
    member,
    setMember,
  ] = useState(null);

  const [
    attendances,
    setAttendances,
  ] = useState([]);

  const [
    family,
    setFamily,
  ] = useState(null);

  const [
    spiritualJourney,
    setSpiritualJourney,
  ] = useState(null);

  const [
    pastoralAlerts,
    setPastoralAlerts,
  ] = useState([]);

  const [
    groups,
    setGroups,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ======================================================
  // MODALE PARCOURS
  // ======================================================

  const [
    journeyModalOpen,
    setJourneyModalOpen,
  ] = useState(false);

  const [
    selectedStage,
    setSelectedStage,
  ] = useState("");

  const [
    stageNote,
    setStageNote,
  ] = useState("");

  const [
    savingStage,
    setSavingStage,
  ] = useState(false);

  const [
    stageError,
    setStageError,
  ] = useState("");

  const [
    stageSuccess,
    setStageSuccess,
  ] = useState("");

  // ======================================================
  // CHARGEMENT DU PROFIL
  // ======================================================

  const fetchProfile =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setLoading(true);
          }

          setError("");

          const results =
            await Promise.allSettled([
              API.get(
                `/members/${id}`
              ),

              API.get(
                "/attendances",
                {
                  params: {
                    member: id,
                    limit: 1000,
                  },
                }
              ),

              API.get(
                `/families/member/${id}`
              ),

              API.get(
                `/spiritual-journey/member/${id}`
              ),

              API.get(
                `/pastoral-alerts/member/${id}`
              ),

              API.get(
                `/groups/member/${id}`
              ),
            ]);

          const [
            memberResult,
            attendanceResult,
            familyResult,
            journeyResult,
            pastoralAlertResult,
            groupsResult,
          ] = results;

          // ==================================================
          // PERSONNE OBLIGATOIRE
          // ==================================================

          if (
            memberResult.status ===
            "rejected"
          ) {
            throw memberResult.reason;
          }

          setMember(
            memberResult.value
              .data
              ?.data ||
              null
          );

          // ==================================================
          // PRÉSENCES
          // ==================================================

          if (
            attendanceResult.status ===
            "fulfilled"
          ) {
            const attendanceData =
              attendanceResult.value
                .data
                ?.data ||
              [];

            setAttendances(
              Array.isArray(
                attendanceData
              )
                ? attendanceData
                : []
            );
          } else {
            setAttendances([]);
          }

          // ==================================================
          // FAMILLE
          // ==================================================

          if (
            familyResult.status ===
            "fulfilled"
          ) {
            setFamily(
              familyResult.value
                .data
                ?.data ||
                null
            );
          } else {
            setFamily(null);
          }

          // ==================================================
          // PARCOURS SPIRITUEL
          // ==================================================

          if (
            journeyResult.status ===
            "fulfilled"
          ) {
            setSpiritualJourney(
              journeyResult.value
                .data
                ?.data ||
                null
            );
          } else {
            console.error(
              "Erreur parcours spirituel :",
              journeyResult.reason
            );

            setSpiritualJourney(null);
          }

          // ==================================================
          // ALERTES PASTORALES
          // ==================================================

          if (
            pastoralAlertResult.status ===
            "fulfilled"
          ) {
            const alertData =
              pastoralAlertResult.value
                .data
                ?.data
                ?.alerts ||
              [];

            setPastoralAlerts(
              Array.isArray(alertData)
                ? alertData
                : []
            );
          } else {
            console.error(
              "Erreur alertes pastorales :",
              pastoralAlertResult.reason
            );

            setPastoralAlerts([]);
          }

          // ==================================================
          // GROUPES / CELLULES
          // ==================================================

          if (
            groupsResult.status ===
            "fulfilled"
          ) {
            const groupData =
              groupsResult.value
                .data
                ?.data
                ?.groups ||
              [];

            setGroups(
              Array.isArray(groupData)
                ? groupData
                : []
            );
          } else {
            console.error(
              "Erreur groupes / cellules :",
              groupsResult.reason
            );

            setGroups([]);
          }
        } catch (err) {
          console.error(
            "Erreur profil personne :",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Impossible de charger le profil de cette personne."
          );
        } finally {
          if (showLoader) {
            setLoading(false);
          }
        }
      },
      [id]
    );

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [
    id,
    fetchProfile,
  ]);

  // ======================================================
  // STATISTIQUES DE PRÉSENCE
  // ======================================================

  const attendanceStats =
    useMemo(() => {
      const total =
        attendances.length;

      const present =
        attendances.filter(
          (attendance) =>
            attendance.status ===
              "Présent" ||
            attendance.status ===
              "En retard"
        ).length;

      const absent =
        attendances.filter(
          (attendance) =>
            attendance.status ===
            "Absent"
        ).length;

      const excused =
        attendances.filter(
          (attendance) =>
            attendance.status ===
            "Excusé"
        ).length;

      const late =
        attendances.filter(
          (attendance) =>
            attendance.status ===
            "En retard"
        ).length;

      const rate =
        total > 0
          ? Math.round(
              (
                present /
                total
              ) *
                100
            )
          : 0;

      return {
        total,
        present,
        absent,
        excused,
        late,
        rate,
      };
    }, [attendances]);

  // ======================================================
  // ALERTE PASTORALE ACTIVE
  // ======================================================

  const activePastoralAlerts =
    useMemo(
      () =>
        pastoralAlerts.filter(
          (alert) =>
            alert.status !==
            "Résolue"
        ),
      [pastoralAlerts]
    );

  const primaryPastoralAlert =
    useMemo(() => {
      if (
        activePastoralAlerts.length ===
        0
      ) {
        return null;
      }

      const priorities = {
        Critique: 3,
        "À suivre": 2,
        Attention: 1,
      };

      return [
        ...activePastoralAlerts,
      ].sort(
        (a, b) =>
          (
            priorities[
              b.level
            ] || 0
          ) -
          (
            priorities[
              a.level
            ] || 0
          )
      )[0];
    }, [
      activePastoralAlerts,
    ]);

  // ======================================================
  // DONNÉES CALCULÉES
  // ======================================================

  const age =
    calculateAge(
      member?.birthDate
    );

  const category =
    getPersonCategory(
      member?.ageGroup
    );

  const isVisitor =
    member?.membershipType ===
    "Visiteur";

  const wasVisitor =
    member?.wasVisitor ===
    true;

  // ======================================================
  // DONNÉES FAMILIALES
  // ======================================================

  const currentFamilyMember =
    useMemo(() => {
      if (
        !family ||
        !Array.isArray(
          family.members
        )
      ) {
        return null;
      }

      return (
        family.members.find(
          (item) =>
            item.member?._id ===
            id
        ) || null
      );
    }, [
      family,
      id,
    ]);

  const familyRole =
    currentFamilyMember
      ?.relationship ||
    member?.familyRole ||
    "Non renseigné";

  const familyMembers =
    Array.isArray(
      family?.members
    )
      ? family.members
      : [];

  // ======================================================
  // DONNÉES PARCOURS SPIRITUEL
  // ======================================================

  const currentStage =
    spiritualJourney
      ?.currentStage ||
    member?.spiritualStage ||
    (
      isVisitor
        ? "Visiteur"
        : "Membre"
    );

  const stageSince =
    spiritualJourney
      ?.stageSince ||
    member?.spiritualStageSince ||
    null;

  const journeyHistory =
    Array.isArray(
      spiritualJourney?.history
    )
      ? [
          ...spiritualJourney.history,
        ].sort(
          (a, b) =>
            new Date(
              b.enteredAt
            ) -
            new Date(
              a.enteredAt
            )
        )
      : [];

  const availableStages =
    Array.isArray(
      spiritualJourney
        ?.availableStages
    ) &&
    spiritualJourney
      .availableStages
      .length > 0
      ? spiritualJourney
          .availableStages
      : SPIRITUAL_STAGES;

  const currentStageIndex =
    availableStages.indexOf(
      currentStage
    );

  // ======================================================
  // GROUPES / CELLULES
  // ======================================================

  const activeGroups =
    useMemo(
      () =>
        groups.filter(
          (group) =>
            group.status !==
            "Inactif"
        ),
      [groups]
    );

  const getGroupMembership =
    (group) => {
      if (
        !Array.isArray(
          group?.members
        )
      ) {
        return null;
      }

      return (
        group.members.find(
          (entry) => {
            const memberId =
              entry?.member?._id ||
              entry?.member;

            return (
              String(
                memberId
              ) ===
                String(id) &&
              entry.isActive !==
                false
            );
          }
        ) || null
      );
    };

  // ======================================================
  // OUVRIR MODALE
  // ======================================================

  const openJourneyModal =
    () => {
      setSelectedStage(
        currentStage ||
          ""
      );

      setStageNote("");
      setStageError("");
      setStageSuccess("");
      setJourneyModalOpen(true);
    };

  // ======================================================
  // FERMER MODALE
  // ======================================================

  const closeJourneyModal =
    () => {
      if (savingStage) {
        return;
      }

      setJourneyModalOpen(false);
      setSelectedStage("");
      setStageNote("");
      setStageError("");
      setStageSuccess("");
    };

  // ======================================================
  // CHANGER D'ÉTAPE
  // ======================================================

  const handleStageChange =
    async (event) => {
      event.preventDefault();

      setStageError("");
      setStageSuccess("");

      if (!selectedStage) {
        setStageError(
          "Choisis une nouvelle étape."
        );

        return;
      }

      if (
        selectedStage ===
        currentStage
      ) {
        setStageError(
          `Cette personne est déjà à l’étape « ${currentStage} ».`
        );

        return;
      }

      try {
        setSavingStage(true);

        const response =
          await API.put(
            `/spiritual-journey/member/${id}/stage`,
            {
              stage:
                selectedStage,

              note:
                stageNote.trim(),
            }
          );

        setStageSuccess(
          response.data
            ?.message ||
            "Parcours mis à jour."
        );

        await fetchProfile(false);

        setTimeout(() => {
          setJourneyModalOpen(false);
          setStageSuccess("");
          setStageNote("");
        }, 700);
      } catch (err) {
        console.error(
          "Erreur changement parcours :",
          err
        );

        setStageError(
          err.response?.data
            ?.message ||
            "Impossible de modifier le parcours."
        );
      } finally {
        setSavingStage(false);
      }
    };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-loading">
            <div className="management-spinner" />

            <div>
              Chargement du profil 360°...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // ERREUR
  // ======================================================

  if (
    error ||
    !member
  ) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-empty">
            <div className="management-empty-icon">
              ⚠️
            </div>

            <h3>
              Profil indisponible
            </h3>

            <p>
              {error ||
                "Cette personne est introuvable."}
            </p>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                navigate(
                  "/members"
                )
              }
            >
              ← Retour aux membres
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <Layout>
      <div className="management-page member-profile-page">

        <button
          type="button"
          className="member-profile-back"
          onClick={() =>
            navigate(
              "/members"
            )
          }
        >
          ← Retour aux personnes
        </button>

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="member-profile-hero">
          <div className="member-profile-identity">

            <div className="member-profile-avatar">
              {getInitials(
                member.firstName,
                member.lastName
              )}
            </div>

            <div>
              <div className="member-profile-eyebrow">
                PROFIL PERSONNE 360°
              </div>

              <h1>
                {member.firstName}{" "}
                {member.lastName}
              </h1>

              <div className="member-profile-badges">

                <span
                  className={`status-badge ${
                    isVisitor
                      ? "status-warning"
                      : "status-active"
                  }`}
                >
                  {member.membershipType ||
                    "Membre"}
                </span>

                <span
                  className={`status-badge ${
                    member.status ===
                    "Actif"
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {member.status ||
                    "—"}
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
                    style={{
                      background:
                        primaryPastoralAlert.level ===
                        "Critique"
                          ? "rgba(239,68,68,.12)"
                          : "rgba(245,158,11,.12)",

                      color:
                        primaryPastoralAlert.level ===
                        "Critique"
                          ? "#b91c1c"
                          : "#b45309",
                    }}
                  >
                    🛟{" "}
                    {
                      primaryPastoralAlert.level
                    }
                  </span>
                )}

                {family && (
                  <span className="member-profile-family-badge">
                    👨‍👩‍👧 {family.name}
                  </span>
                )}

                {activeGroups.length > 0 && (
                  <span
                    className="member-profile-family-badge"
                    style={{
                      background:
                        "rgba(99, 72, 223, 0.08)",
                      color:
                        "#6048df",
                    }}
                  >
                    🏘️{" "}
                    {activeGroups.length === 1
                      ? activeGroups[0].name
                      : `${activeGroups.length} groupes`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="member-profile-hero-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                navigate(
                  "/members"
                )
              }
            >
              👥 Liste des personnes
            </button>
          </div>
        </section>

        {/* ==================================================
            KPI
        ================================================== */}

        <div className="member-profile-kpis">

          <div className="member-profile-kpi">
            <span>Âge</span>

            <strong>
              {age !== null
                ? `${age} ans`
                : "—"}
            </strong>

            <small>
              {member.ageGroup ||
                "Non renseigné"}
            </small>
          </div>

          <div className="member-profile-kpi">
            <span>
              Présences
            </span>

            <strong>
              {
                attendanceStats.present
              }
            </strong>

            <small>
              {
                attendanceStats.rate
              }
              % de participation
            </small>
          </div>

          <div className="member-profile-kpi">
            <span>
              Parcours actuel
            </span>

            <strong className="member-profile-kpi-status">
              {currentStage}
            </strong>

            <small>
              Depuis{" "}
              {formatShortDate(
                stageSince
              )}
            </small>
          </div>

          <div className="member-profile-kpi">
            <span>
              Vigilance pastorale
            </span>

            <strong
              className="member-profile-kpi-status"
              style={{
                color:
                  primaryPastoralAlert
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
                ? `${primaryPastoralAlert.consecutiveMissedServices || 0} culte(s) manqué(s)`
                : "Aucune alerte active"}
            </small>
          </div>
        </div>

        {/* ==================================================
            VIGILANCE PASTORALE
        ================================================== */}

        <section
          className="management-card member-profile-card"
          style={{
            marginBottom:
              "24px",
          }}
        >
          <div className="member-profile-card-header">
            <div>
              <div className="member-profile-section-icon">
                🛟
              </div>

              <div>
                <h2>
                  Vigilance pastorale
                </h2>

                <p>
                  Détection automatique des situations nécessitant une attention pastorale.
                </p>
              </div>
            </div>

            {primaryPastoralAlert ? (
              <span
                style={{
                  ...getPastoralAlertStyle(
                    primaryPastoralAlert.level
                  ),
                  padding:
                    "8px 12px",
                  borderRadius:
                    "999px",
                  fontSize:
                    "12px",
                  fontWeight:
                    800,
                }}
              >
                {
                  primaryPastoralAlert.level
                }
              </span>
            ) : (
              <span className="status-badge status-active">
                ✓ Situation normale
              </span>
            )}
          </div>

          {primaryPastoralAlert ? (
            <>
              <div
                style={{
                  ...getPastoralAlertStyle(
                    primaryPastoralAlert.level
                  ),
                  padding:
                    "18px",
                  borderRadius:
                    "14px",
                  marginTop:
                    "16px",
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "16px",
                    marginBottom: "6px",
                  }}
                >
                  🚨 Alerte :{" "}
                  {
                    primaryPastoralAlert.type
                  }
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Cette personne a manqué{" "}
                  <strong>
                    {
                      primaryPastoralAlert.consecutiveMissedServices
                    }
                  </strong>{" "}
                  culte(s) dominical(aux)
                  consécutif(s).
                </div>
              </div>

              <div
                className="member-profile-info-grid"
                style={{
                  marginTop:
                    "18px",
                }}
              >
                <div className="member-profile-info">
                  <span>
                    Niveau
                  </span>

                  <strong>
                    {
                      primaryPastoralAlert.level
                    }
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Statut du suivi
                  </span>

                  <strong>
                    {
                      primaryPastoralAlert.status
                    }
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Cultes manqués
                  </span>

                  <strong>
                    {
                      primaryPastoralAlert.consecutiveMissedServices
                    }
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Dernière présence
                  </span>

                  <strong>
                    {primaryPastoralAlert.lastPresenceDate
                      ? formatDate(
                          primaryPastoralAlert.lastPresenceDate
                        )
                      : "Aucune présence enregistrée"}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Dernier culte analysé
                  </span>

                  <strong>
                    {formatDate(
                      primaryPastoralAlert.lastCheckedServiceDate
                    )}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Responsable
                  </span>

                  <strong>
                    {primaryPastoralAlert
                      .assignedTo
                      ?.name ||
                      "Non assigné"}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Dernier contact
                  </span>

                  <strong>
                    {primaryPastoralAlert.contactedAt
                      ? formatDate(
                          primaryPastoralAlert.contactedAt
                        )
                      : "Pas encore contacté"}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Détectée le
                  </span>

                  <strong>
                    {formatDate(
                      primaryPastoralAlert.detectedAt
                    )}
                  </strong>
                </div>
              </div>

              {primaryPastoralAlert.note && (
                <div
                  className="member-profile-note"
                  style={{
                    marginTop:
                      "16px",
                  }}
                >
                  <strong>
                    Note pastorale
                  </strong>

                  <p>
                    {
                      primaryPastoralAlert.note
                    }
                  </p>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  marginTop:
                    "18px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(
                      "/pastoral-alerts"
                    )
                  }
                >
                  🛟 Gérer l’alerte
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop:
                  "16px",
                padding:
                  "18px",
                borderRadius:
                  "14px",
                background:
                  "rgba(34,197,94,.07)",
                border:
                  "1px solid rgba(34,197,94,.16)",
              }}
            >
              <strong
                style={{
                  color:
                    "#15803d",
                }}
              >
                ✓ Aucune alerte pastorale active
              </strong>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  fontSize:
                    "13px",
                  opacity:
                    0.75,
                }}
              >
                Aucun signal nécessitant une intervention pastorale n’est actuellement détecté pour cette personne.
              </p>
            </div>
          )}
        </section>

        {/* ==================================================
            PARCOURS SPIRITUEL
        ================================================== */}

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

                <h2>
                  Parcours spirituel & intégration
                </h2>

                <p>
                  Visualisez l’évolution de la personne depuis son arrivée jusqu’à ses responsabilités.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                openJourneyModal
              }
            >
              Faire évoluer le parcours
            </button>
          </div>

          <div className="spiritual-stage-wrapper">

            <div className="spiritual-stage-track">

              {availableStages.map(
                (
                  stage,
                  index
                ) => {
                  const isCurrent =
                    stage ===
                    currentStage;

                  const isPassed =
                    currentStageIndex >
                    index;

                  return (
                    <div
                      key={stage}
                      className={`spiritual-stage ${
                        isCurrent
                          ? "spiritual-stage-current"
                          : ""
                      } ${
                        isPassed
                          ? "spiritual-stage-passed"
                          : ""
                      }`}
                    >
                      <div className="spiritual-stage-marker">
                        {isPassed
                          ? "✓"
                          : isCurrent
                            ? "●"
                            : index + 1}
                      </div>

                      <div className="spiritual-stage-name">
                        {stage}
                      </div>
                    </div>
                  );
                }
              )}

            </div>
          </div>

          <div className="spiritual-journey-summary">

            <div>
              <span>
                Étape actuelle
              </span>

              <strong>
                {currentStage}
              </strong>
            </div>

            <div>
              <span>
                Depuis
              </span>

              <strong>
                {formatDate(
                  stageSince
                )}
              </strong>
            </div>

            <div>
              <span>
                Accompagnateur
              </span>

              <strong>
                {spiritualJourney
                  ?.mentor
                  ?.name ||
                  "Non assigné"}
              </strong>
            </div>

            <div>
              <span>
                Prochain suivi
              </span>

              <strong>
                {formatShortDate(
                  spiritualJourney
                    ?.nextFollowUpDate
                )}
              </strong>
            </div>

          </div>

          {spiritualJourney
            ?.note && (
            <div className="spiritual-journey-general-note">
              <strong>
                Note d’accompagnement
              </strong>

              <p>
                {
                  spiritualJourney.note
                }
              </p>
            </div>
          )}

        </section>

        {/* ==================================================
            COLONNES
        ================================================== */}

        <div className="member-profile-grid">

          <div className="member-profile-main">

            {/* IDENTITÉ */}

            <section className="management-card member-profile-card">
              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    👤
                  </div>

                  <div>
                    <h2>
                      Identité
                    </h2>

                    <p>
                      Informations personnelles et coordonnées.
                    </p>
                  </div>
                </div>
              </div>

              <div className="member-profile-info-grid">

                <div className="member-profile-info">
                  <span>Prénom</span>

                  <strong>
                    {member.firstName ||
                      "—"}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>Nom</span>

                  <strong>
                    {member.lastName ||
                      "—"}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>Sexe</span>

                  <strong>
                    {member.gender ||
                      "Non renseigné"}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Date de naissance
                  </span>

                  <strong>
                    {formatDate(
                      member.birthDate
                    )}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>
                    Téléphone
                  </span>

                  <strong>
                    {member.phone ||
                      "Non renseigné"}
                  </strong>
                </div>

                <div className="member-profile-info">
                  <span>Email</span>

                  <strong>
                    {member.email ||
                      "Non renseigné"}
                  </strong>
                </div>

                <div className="member-profile-info member-profile-info-full">
                  <span>Adresse</span>

                  <strong>
                    {member.address ||
                      "Non renseignée"}
                  </strong>
                </div>

              </div>
            </section>

            {/* FAMILLE */}

            <section className="management-card member-profile-card">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    👨‍👩‍👧
                  </div>

                  <div>
                    <h2>
                      Famille / Foyer
                    </h2>

                    <p>
                      Liens familiaux et personnes du même foyer.
                    </p>
                  </div>
                </div>

                {family && (
                  <span className="status-badge status-active">
                    {familyMembers.length}{" "}
                    personne
                    {familyMembers.length >
                    1
                      ? "s"
                      : ""}
                  </span>
                )}
              </div>

              {family ? (
                <>
                  <div className="member-family-summary">

                    <div className="member-family-summary-main">
                      <div className="member-family-house-icon">
                        🏠
                      </div>

                      <div>
                        <span>Foyer</span>

                        <h3>
                          {family.name}
                        </h3>

                        <p>
                          Votre rôle :{" "}
                          <strong>
                            {familyRole}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="member-family-contact">

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
                          Téléphone familial
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
                  </div>

                  <div className="member-family-members">

                    <div className="member-family-members-title">
                      Membres du foyer
                    </div>

                    <div className="member-family-members-list">

                      {familyMembers.map(
                        (
                          familyMember
                        ) => {
                          const person =
                            familyMember.member;

                          if (!person) {
                            return null;
                          }

                          const personAge =
                            calculateAge(
                              person.birthDate
                            );

                          const isCurrentPerson =
                            person._id ===
                            id;

                          const isHead =
                            family
                              .headOfHousehold
                              ?._id ===
                            person._id;

                          return (
                            <button
                              key={
                                person._id
                              }
                              type="button"
                              className={`member-family-person ${
                                isCurrentPerson
                                  ? "member-family-person-current"
                                  : ""
                              }`}
                              onClick={() => {
                                if (
                                  !isCurrentPerson
                                ) {
                                  navigate(
                                    `/members/${person._id}`
                                  );
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
                                  {
                                    person.firstName
                                  }{" "}
                                  {
                                    person.lastName
                                  }

                                  {isCurrentPerson && (
                                    <span>
                                      Vous
                                    </span>
                                  )}
                                </div>

                                <div className="member-family-person-meta">
                                  {
                                    familyMember.relationship
                                  }

                                  {personAge !==
                                    null &&
                                    ` • ${personAge} ans`}

                                  {isHead &&
                                    " • Responsable du foyer"}
                                </div>

                              </div>

                              {!isCurrentPerson && (
                                <div className="member-family-arrow">
                                  →
                                </div>
                              )}
                            </button>
                          );
                        }
                      )}

                    </div>
                  </div>

                  {family.notes && (
                    <div className="member-profile-note member-family-note">
                      <strong>
                        Note familiale
                      </strong>

                      <p>
                        {family.notes}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="member-family-empty">
                  <div className="member-family-empty-icon">
                    🏠
                  </div>

                  <div>
                    <strong>
                      Aucun foyer associé
                    </strong>

                    <p>
                      Cette personne n’est actuellement rattachée à aucune famille.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* GROUPES / CELLULES */}

            <section className="management-card member-profile-card">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    🏘️
                  </div>

                  <div>
                    <h2>
                      Groupes & Cellules
                    </h2>

                    <p>
                      Communautés auxquelles cette personne est actuellement rattachée.
                    </p>
                  </div>
                </div>

                {activeGroups.length > 0 && (
                  <span className="status-badge status-active">
                    {activeGroups.length}{" "}
                    groupe
                    {activeGroups.length > 1
                      ? "s"
                      : ""}
                  </span>
                )}
              </div>

              {activeGroups.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {activeGroups.map(
                    (group) => {
                      const membership =
                        getGroupMembership(
                          group
                        );

                      const activeMemberCount =
                        Array.isArray(
                          group.members
                        )
                          ? group.members.filter(
                              (entry) =>
                                entry.isActive !==
                                false
                            ).length
                          : 0;

                      return (
                        <button
                          key={
                            group._id
                          }
                          type="button"
                          onClick={() =>
                            navigate(
                              `/groups/${group._id}`
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "18px",
                            border:
                              "1px solid rgba(99,72,223,.14)",
                            borderRadius:
                              "16px",
                            background:
                              "linear-gradient(135deg, rgba(99,72,223,.055), rgba(59,130,246,.035))",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily:
                              "inherit",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              gap: "14px",
                              alignItems:
                                "flex-start",
                            }}
                          >
                            <div
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  color:
                                    "#6953e5",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    900,
                                  letterSpacing:
                                    ".8px",
                                  textTransform:
                                    "uppercase",
                                  marginBottom:
                                    "6px",
                                }}
                              >
                                {group.type ||
                                  "Groupe"}
                              </div>

                              <strong
                                style={{
                                  display:
                                    "block",
                                  color:
                                    "#1f2937",
                                  fontSize:
                                    "15px",
                                  fontWeight:
                                    900,
                                }}
                              >
                                {
                                  group.name
                                }
                              </strong>

                              <div
                                style={{
                                  marginTop:
                                    "8px",
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap: "6px",
                                }}
                              >
                                <span
                                  className="status-badge status-active"
                                  style={{
                                    fontSize:
                                      "9px",
                                  }}
                                >
                                  {membership?.role ||
                                    "Membre"}
                                </span>

                                {group.meetingDay && (
                                  <span
                                    className="status-badge status-planned"
                                    style={{
                                      fontSize:
                                        "9px",
                                    }}
                                  >
                                    🗓️{" "}
                                    {
                                      group.meetingDay
                                    }
                                    {group.meetingTime
                                      ? ` • ${group.meetingTime}`
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              style={{
                                color:
                                  "#6048df",
                                fontSize:
                                  "18px",
                                fontWeight:
                                  900,
                              }}
                            >
                              →
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "1fr 1fr",
                              gap: "10px",
                              marginTop:
                                "16px",
                            }}
                          >
                            <div
                              style={{
                                padding:
                                  "10px",
                                background:
                                  "rgba(255,255,255,.72)",
                                borderRadius:
                                  "10px",
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "block",
                                  color:
                                    "#9ca3af",
                                  fontSize:
                                    "9px",
                                  fontWeight:
                                    800,
                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                Responsable
                              </span>

                              <strong
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "3px",
                                  color:
                                    "#374151",
                                  fontSize:
                                    "11px",
                                }}
                              >
                                {group.leader
                                  ? `${group.leader.firstName || ""} ${group.leader.lastName || ""}`.trim()
                                  : "Non assigné"}
                              </strong>
                            </div>

                            <div
                              style={{
                                padding:
                                  "10px",
                                background:
                                  "rgba(255,255,255,.72)",
                                borderRadius:
                                  "10px",
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "block",
                                  color:
                                    "#9ca3af",
                                  fontSize:
                                    "9px",
                                  fontWeight:
                                    800,
                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                Membres
                              </span>

                              <strong
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "3px",
                                  color:
                                    "#374151",
                                  fontSize:
                                    "11px",
                                }}
                              >
                                {activeMemberCount}
                                {group.capacity > 0
                                  ? ` / ${group.capacity}`
                                  : ""}
                              </strong>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop:
                                "12px",
                              color:
                                "#7b8495",
                              fontSize:
                                "10px",
                              fontWeight:
                                700,
                            }}
                          >
                            📍{" "}
                            {group.location ||
                              group.city ||
                              "Lieu non renseigné"}
                            {group.location &&
                            group.city
                              ? ` • ${group.city}`
                              : ""}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="member-family-empty">
                  <div className="member-family-empty-icon">
                    🏘️
                  </div>

                  <div>
                    <strong>
                      Aucun groupe associé
                    </strong>

                    <p>
                      Cette personne n’est actuellement rattachée à aucune cellule ou groupe actif.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* HISTORIQUE PARCOURS */}

            <section className="management-card member-profile-card">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    ✨
                  </div>

                  <div>
                    <h2>
                      Historique du parcours
                    </h2>

                    <p>
                      Toutes les évolutions de la personne sont conservées.
                    </p>
                  </div>
                </div>

                <span className="status-badge status-planned">
                  {journeyHistory.length}{" "}
                  étape
                  {journeyHistory.length >
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              {journeyHistory.length >
              0 ? (
                <div className="spiritual-history">

                  {journeyHistory.map(
                    (
                      historyItem,
                      index
                    ) => (
                      <div
                        key={
                          historyItem._id ||
                          `${historyItem.stage}-${index}`
                        }
                        className={`spiritual-history-item ${
                          !historyItem.exitedAt
                            ? "spiritual-history-current"
                            : ""
                        }`}
                      >
                        <div className="spiritual-history-line">
                          <div className="spiritual-history-dot">
                            {!historyItem.exitedAt
                              ? "●"
                              : "✓"}
                          </div>
                        </div>

                        <div className="spiritual-history-content">

                          <div className="spiritual-history-top">

                            <div>
                              <span className="spiritual-history-date">
                                {formatDate(
                                  historyItem.enteredAt
                                )}
                              </span>

                              <h3>
                                {
                                  historyItem.stage
                                }
                              </h3>
                            </div>

                            {!historyItem.exitedAt && (
                              <span className="spiritual-current-badge">
                                Étape actuelle
                              </span>
                            )}
                          </div>

                          {historyItem.note && (
                            <p>
                              {
                                historyItem.note
                              }
                            </p>
                          )}

                          <div className="spiritual-history-meta">

                            <span>
                              Modifié par :{" "}
                              <strong>
                                {historyItem
                                  .changedBy
                                  ?.name ||
                                  "Système"}
                              </strong>
                            </span>

                            {historyItem.exitedAt && (
                              <span>
                                Jusqu’au{" "}
                                {formatShortDate(
                                  historyItem.exitedAt
                                )}
                              </span>
                            )}

                          </div>
                        </div>
                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    ✨
                  </div>

                  <h3>
                    Parcours non initialisé
                  </h3>

                  <p>
                    Aucun historique spirituel n’est encore disponible.
                  </p>
                </div>
              )}
            </section>

            {/* PARCOURS ÉGLISE */}

            <section className="management-card member-profile-card">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    ⛪
                  </div>

                  <div>
                    <h2>
                      Parcours dans l’église
                    </h2>

                    <p>
                      Historique administratif de son arrivée et de son intégration.
                    </p>
                  </div>
                </div>
              </div>

              <div className="member-profile-journey">

                <div className="member-profile-journey-item">
                  <div className="member-profile-journey-dot" />

                  <div>
                    <span>
                      Première visite
                    </span>

                    <strong>
                      {formatDate(
                        member.firstVisitDate
                      )}
                    </strong>
                  </div>
                </div>

                {wasVisitor && (
                  <div className="member-profile-journey-item">
                    <div className="member-profile-journey-dot" />

                    <div>
                      <span>
                        Parcours visiteur
                      </span>

                      <strong>
                        Ancien visiteur
                      </strong>
                    </div>
                  </div>
                )}

                {member.integratedAt && (
                  <div className="member-profile-journey-item">
                    <div className="member-profile-journey-dot" />

                    <div>
                      <span>
                        Intégration
                      </span>

                      <strong>
                        {formatDate(
                          member.integratedAt
                        )}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="member-profile-journey-item">
                  <div className="member-profile-journey-dot" />

                  <div>
                    <span>
                      Membre depuis
                    </span>

                    <strong>
                      {formatDate(
                        member.membershipDate
                      )}
                    </strong>
                  </div>
                </div>

                <div className="member-profile-journey-item">
                  <div className="member-profile-journey-dot member-profile-journey-dot-current" />

                  <div>
                    <span>
                      Situation actuelle
                    </span>

                    <strong>
                      {member.membershipType ||
                        "—"}{" "}
                      •{" "}
                      {member.status ||
                        "—"}
                    </strong>
                  </div>
                </div>

              </div>
            </section>

            {/* PRÉSENCES */}

            <section className="management-card member-profile-card">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    ✅
                  </div>

                  <div>
                    <h2>
                      Historique des présences
                    </h2>

                    <p>
                      Participation aux événements de l’église.
                    </p>
                  </div>
                </div>

                <span className="status-badge status-planned">
                  {attendanceStats.total}{" "}
                  pointage
                  {attendanceStats.total >
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              {attendances.length >
              0 ? (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>
                          Événement
                        </th>

                        <th>Date</th>

                        <th>
                          Statut
                        </th>

                        <th>
                          Première visite
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {attendances.map(
                        (
                          attendance
                        ) => (
                          <tr
                            key={
                              attendance._id
                            }
                          >
                            <td>
                              <strong>
                                {attendance
                                  .event
                                  ?.title ||
                                  "Événement"}
                              </strong>

                              {attendance
                                .event
                                ?.location && (
                                <div className="person-secondary">
                                  {
                                    attendance
                                      .event
                                      .location
                                  }
                                </div>
                              )}
                            </td>

                            <td>
                              {formatShortDate(
                                attendance
                                  .event
                                  ?.date
                              )}
                            </td>

                            <td>
                              <span
                                className={getAttendanceClass(
                                  attendance.status
                                )}
                              >
                                {attendance.status ||
                                  "—"}
                              </span>
                            </td>

                            <td>
                              {attendance.isFirstVisit
                                ? "⭐ Oui"
                                : "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    ✅
                  </div>

                  <h3>
                    Aucune présence
                  </h3>

                  <p>
                    Cette personne n’a encore aucun historique de présence.
                  </p>
                </div>
              )}
            </section>

          </div>

          {/* ==================================================
              SIDEBAR PROFIL
          ================================================== */}

          <aside className="member-profile-sidebar">

            {/* SUIVI PASTORAL */}

            <section className="management-card member-profile-card">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    🤝
                  </div>

                  <div>
                    <h2>
                      Suivi pastoral
                    </h2>

                    <p>
                      Accompagnement de la personne.
                    </p>
                  </div>
                </div>
              </div>

              <div className="member-profile-sidebar-list">

                <div>
                  <span>Statut</span>

                  <strong>
                    {member.followUpStatus ||
                      "Non commencé"}
                  </strong>
                </div>

                <div>
                  <span>
                    Responsable
                  </span>

                  <strong>
                    {member
                      .followUpAssignedTo
                      ?.name ||
                      "Non assigné"}
                  </strong>
                </div>

                <div>
                  <span>
                    Dernier contact
                  </span>

                  <strong>
                    {formatDate(
                      member.lastContactDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Prochaine relance
                  </span>

                  <strong>
                    {formatDate(
                      member.nextFollowUpDate
                    )}
                  </strong>
                </div>

              </div>

              {member.followUpNote && (
                <div className="member-profile-note">
                  <strong>
                    Note pastorale
                  </strong>

                  <p>
                    {
                      member.followUpNote
                    }
                  </p>
                </div>
              )}
            </section>

            {/* PARTICIPATION */}

            <section className="management-card member-profile-card">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    📊
                  </div>

                  <div>
                    <h2>
                      Participation
                    </h2>

                    <p>
                      Synthèse individuelle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="member-profile-mini-stats">

                <div>
                  <strong>
                    {
                      attendanceStats.present
                    }
                  </strong>

                  <span>
                    Présences
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      attendanceStats.absent
                    }
                  </strong>

                  <span>
                    Absences
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      attendanceStats.late
                    }
                  </strong>

                  <span>
                    Retards
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      attendanceStats.excused
                    }
                  </strong>

                  <span>
                    Excusé
                  </span>
                </div>

              </div>

              <div className="member-profile-rate">
                <div>
                  <span>
                    Taux de participation
                  </span>

                  <strong>
                    {
                      attendanceStats.rate
                    }
                    %
                  </strong>
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

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    🏢
                  </div>

                  <div>
                    <h2>
                      Engagement
                    </h2>

                    <p>
                      Service et responsabilités.
                    </p>
                  </div>
                </div>
              </div>

              <div className="member-profile-sidebar-list">
                <div>
                  <span>
                    Département
                  </span>

                  <strong>
                    {member.department
                      ?.name ||
                      "Aucun département"}
                  </strong>
                </div>

                <div>
                  <span>
                    Étape spirituelle
                  </span>

                  <strong>
                    {currentStage}
                  </strong>
                </div>

                <div>
                  <span>
                    Groupe / Cellule
                  </span>

                  <strong>
                    {activeGroups.length === 0
                      ? "Aucun groupe"
                      : activeGroups.length === 1
                        ? activeGroups[0].name
                        : `${activeGroups.length} groupes`}
                  </strong>
                </div>
              </div>

              <div className="member-profile-coming">
                <span>
                  Prochainement
                </span>

                <p>
                  Responsabilités, bénévolat, ministères et historique d’engagement seront reliés ici.
                </p>
              </div>
            </section>

            {/* PROFIL UNIFIÉ */}

            <section className="management-card member-profile-card member-profile-future">

              <div className="member-profile-card-header">
                <div>
                  <div className="member-profile-section-icon">
                    ✨
                  </div>

                  <div>
                    <h2>
                      Profil unifié
                    </h2>

                    <p>
                      Le cœur humain d’Eldior.
                    </p>
                  </div>
                </div>
              </div>

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

                <span>
                  📚 Formations
                </span>

                <span>
                  🕓 Historique complet
                </span>

              </div>
            </section>

          </aside>
        </div>

        {/* ==================================================
            MODALE PARCOURS
        ================================================== */}

        {journeyModalOpen && (
          <div
            className="spiritual-modal-overlay"
            onMouseDown={
              closeJourneyModal
            }
          >
            <div
              className="spiritual-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="spiritual-modal-header">

                <div>
                  <span>
                    PARCOURS SPIRITUEL
                  </span>

                  <h2>
                    Faire évoluer{" "}
                    {member.firstName}
                  </h2>

                  <p>
                    Étape actuelle :{" "}
                    <strong>
                      {currentStage}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="spiritual-modal-close"
                  onClick={
                    closeJourneyModal
                  }
                  disabled={
                    savingStage
                  }
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleStageChange
                }
              >
                <div className="spiritual-modal-body">

                  <div className="spiritual-form-group">
                    <label>
                      Nouvelle étape
                    </label>

                    <select
                      value={
                        selectedStage
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedStage(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        savingStage
                      }
                    >
                      {availableStages.map(
                        (
                          stage
                        ) => (
                          <option
                            key={
                              stage
                            }
                            value={
                              stage
                            }
                          >
                            {stage}
                            {stage ===
                            currentStage
                              ? " — actuelle"
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="spiritual-form-group">
                    <label>
                      Note
                    </label>

                    <textarea
                      rows="4"
                      value={
                        stageNote
                      }
                      onChange={(
                        event
                      ) =>
                        setStageNote(
                          event.target
                            .value
                        )
                      }
                      placeholder="Ex. Baptême effectué, formation commencée, intégration terminée..."
                      disabled={
                        savingStage
                      }
                    />

                    <small>
                      Cette note sera conservée dans l’historique du parcours.
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
                    onClick={
                      closeJourneyModal
                    }
                    disabled={
                      savingStage
                    }
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      savingStage
                    }
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