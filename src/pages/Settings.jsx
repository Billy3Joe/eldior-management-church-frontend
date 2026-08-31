import {
  useEffect,
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
  getPlanName,
  hasFeature,
  normalizePlan,
} from "../utils/subscription";

import {
  useSubscription,
} from "../context/SubscriptionContext";

const AVAILABLE_DAYS = [
  1,
  2,
  3,
  7,
];

export default function Settings() {
  // ======================================================
  // UTILISATEUR
  // ======================================================

  const currentUser =
    getCurrentAdmin();

  const isAdmin =
    currentUser?.role ===
      "admin" ||
    currentUser?.platformRole ===
      "superadmin";

  // ======================================================
  // ABONNEMENT SYNCHRONISÉ
  // ======================================================

  const {
    plan,
    initialized,
  } = useSubscription();

  const currentPlan =
    normalizePlan(
      initialized
        ? plan
        : currentUser?.church
            ?.plan ||
            "free"
    );

  const canUseEmailNotifications =
    currentUser?.platformRole ===
      "superadmin" ||
    hasFeature(
      currentPlan,
      "emailNotifications"
    );

  const canUseReminders =
    currentUser?.platformRole ===
      "superadmin" ||
    hasFeature(
      currentPlan,
      "reminders"
    );

  // ======================================================
  // STATES
  // ======================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    settings,
    setSettings,
  ] = useState({
    churchName:
      "ElDior Management Church",

    reminderEnabled: false,

    reminderDays: [
      2,
      1,
    ],

    reminderHour: 9,

    timezone:
      "Europe/Paris",

    emailNotificationsEnabled:
      false,

    primaryColor: "",

    logo: "",
  });

  // ======================================================
  // CHARGER LES PARAMÈTRES
  // ======================================================

  const fetchSettings =
    async () => {
      try {
        setLoading(true);

        const res =
          await API.get(
            "/settings"
          );

        if (res.data?.data) {
          setSettings({
            churchName:
              res.data.data
                .churchName ||
              "ElDior Management Church",

            reminderEnabled:
              res.data.data
                .reminderEnabled ===
              true,

            reminderDays:
              Array.isArray(
                res.data.data
                  .reminderDays
              )
                ? res.data.data
                    .reminderDays
                : [
                    2,
                    1,
                  ],

            reminderHour:
              res.data.data
                .reminderHour ??
              9,

            timezone:
              res.data.data
                .timezone ||
              "Europe/Paris",

            emailNotificationsEnabled:
              res.data.data
                .emailNotificationsEnabled ===
              true,

            primaryColor:
              res.data.data
                .primaryColor ||
              "",

            logo:
              res.data.data
                .logo ||
              "",
          });
        }
      } catch (error) {
        console.error(
          "Erreur chargement paramètres :",
          error
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Impossible de charger les paramètres"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ======================================================
  // NOM ÉGLISE
  // ======================================================

  const handleChurchNameChange =
    (event) => {
      if (!isAdmin) {
        return;
      }

      setSettings(
        (previous) => ({
          ...previous,

          churchName:
            event.target.value,
        })
      );
    };

  // ======================================================
  // EMAILS ON / OFF
  // ======================================================

  const handleEmailNotifications =
    (event) => {
      if (!isAdmin) {
        return;
      }

      if (
        !canUseEmailNotifications
      ) {
        toast.warning(
          "Les notifications email sont disponibles à partir du plan Standard."
        );

        return;
      }

      setSettings(
        (previous) => ({
          ...previous,

          emailNotificationsEnabled:
            event.target.checked,
        })
      );
    };

  // ======================================================
  // RAPPELS ON / OFF
  // ======================================================

  const handleReminderEnabled =
    (event) => {
      if (!isAdmin) {
        return;
      }

      if (!canUseReminders) {
        toast.warning(
          "Les rappels automatiques sont réservés au plan Premium."
        );

        return;
      }

      setSettings(
        (previous) => ({
          ...previous,

          reminderEnabled:
            event.target.checked,
        })
      );
    };

  // ======================================================
  // JOURS DE RAPPEL
  // ======================================================

  const handleReminderDay = (
    day
  ) => {
    if (
      !isAdmin ||
      !canUseReminders
    ) {
      return;
    }

    setSettings(
      (previous) => {
        const exists =
          previous.reminderDays.includes(
            day
          );

        let newDays;

        if (exists) {
          newDays =
            previous.reminderDays.filter(
              (item) =>
                item !== day
            );
        } else {
          newDays = [
            ...previous.reminderDays,
            day,
          ];
        }

        newDays.sort(
          (a, b) =>
            b - a
        );

        return {
          ...previous,

          reminderDays:
            newDays,
        };
      }
    );
  };

  // ======================================================
  // HEURE
  // ======================================================

  const handleHourChange =
    (event) => {
      if (
        !isAdmin ||
        !canUseReminders
      ) {
        return;
      }

      setSettings(
        (previous) => ({
          ...previous,

          reminderHour:
            Number(
              event.target.value
            ),
        })
      );
    };

  // ======================================================
  // TIMEZONE
  // ======================================================

  const handleTimezoneChange =
    (event) => {
      if (
        !isAdmin ||
        !canUseReminders
      ) {
        return;
      }

      setSettings(
        (previous) => ({
          ...previous,

          timezone:
            event.target.value,
        })
      );
    };

  // ======================================================
  // ENREGISTRER
  // ======================================================

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      toast.warning(
        "Seul un administrateur peut modifier les paramètres"
      );

      return;
    }

    if (
      !settings.churchName.trim()
    ) {
      toast.warning(
        "Le nom de l'église est obligatoire"
      );

      return;
    }

    if (
      canUseReminders &&
      settings.reminderEnabled &&
      settings.reminderDays
        .length === 0
    ) {
      toast.warning(
        "Sélectionnez au moins un jour de rappel"
      );

      return;
    }

    try {
      setSaving(true);

      // IMPORTANT :
      // On envoie les champs avancés seulement
      // si le plan les autorise.

      const payload = {
        churchName:
          settings.churchName.trim(),
      };

      if (
        canUseEmailNotifications
      ) {
        payload.emailNotificationsEnabled =
          settings.emailNotificationsEnabled;
      }

      if (canUseReminders) {
        payload.reminderEnabled =
          settings.reminderEnabled;

        payload.reminderDays =
          settings.reminderDays;

        payload.reminderHour =
          Number(
            settings.reminderHour
          );

        payload.timezone =
          settings.timezone;
      }

      const res =
        await API.put(
          "/settings",
          payload
        );

      if (res.data?.data) {
        const data =
          res.data.data;

        setSettings(
          (previous) => ({
            ...previous,

            churchName:
              data.churchName ||
              previous.churchName,

            reminderEnabled:
              data.reminderEnabled ??
              previous.reminderEnabled,

            reminderDays:
              Array.isArray(
                data.reminderDays
              )
                ? data.reminderDays
                : previous.reminderDays,

            reminderHour:
              data.reminderHour ??
              previous.reminderHour,

            timezone:
              data.timezone ||
              previous.timezone,

            emailNotificationsEnabled:
              data.emailNotificationsEnabled ??
              previous.emailNotificationsEnabled,

            primaryColor:
              data.primaryColor ||
              previous.primaryColor,

            logo:
              data.logo ||
              previous.logo,
          })
        );
      }

      toast.success(
        res.data?.message ||
          "Paramètres enregistrés avec succès"
      );
    } catch (error) {
      console.error(
        "Erreur enregistrement paramètres :",
        error
      );

      if (
        error.response?.status ===
        403
      ) {
        toast.error(
          error.response?.data
            ?.message ||
            "Votre abonnement ne permet pas de modifier ce paramètre."
        );

        return;
      }

      toast.error(
        error.response?.data
          ?.message ||
          "Impossible d'enregistrer les paramètres"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // CHARGEMENT
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des
                paramètres...
              </div>
            </div>
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
      <div className="management-page">

        {/* ================================================
            HEADER
        ================================================ */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Paramètres
            </h1>

            <p className="page-subtitle">
              Configurez votre église,
              les notifications et les
              rappels automatiques.
            </p>
          </div>

          {isAdmin && (
            <div className="page-header-actions">
              <button
                type="submit"
                form="settings-form"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : "💾 Enregistrer"}
              </button>
            </div>
          )}
        </div>

        {/* ================================================
            PLAN ACTUEL
        ================================================ */}

        <div
          className="management-card"
          style={{
            marginBottom: 24,
            padding: 18,
            borderLeft:
              "4px solid #6366f1",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                Plan{" "}
                {getPlanName(
                  currentPlan
                )}
              </div>

              <div className="person-secondary">
                Les paramètres
                disponibles dépendent
                de votre formule.
              </div>
            </div>

            <span className="status-badge status-active">
              {getPlanName(
                currentPlan
              )}
            </span>
          </div>
        </div>

        {/* ================================================
            CONSULTATION SEULE
        ================================================ */}

        {!isAdmin && (
          <div
            className="management-card"
            style={{
              marginBottom: 24,
              borderLeft:
                "4px solid #f59e0b",
              background:
                "#fffbeb",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems:
                  "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                }}
              >
                🔒
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    color:
                      "#92400e",
                    marginBottom: 4,
                  }}
                >
                  Consultation
                  uniquement
                </div>

                <div
                  style={{
                    color:
                      "#78350f",
                    lineHeight: 1.6,
                  }}
                >
                  Vous êtes connecté
                  en tant que manager.
                  Seul un
                  administrateur peut
                  modifier les
                  paramètres de
                  l'église.
                </div>
              </div>
            </div>
          </div>
        )}

        <form
          id="settings-form"
          onSubmit={handleSave}
        >

          {/* ==============================================
              INFORMATIONS ÉGLISE
          ============================================== */}

          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Informations de
                  l'église
                </h2>

                <p className="page-subtitle">
                  Informations
                  générales de votre
                  organisation.
                </p>
              </div>

              <span className="status-badge status-active">
                Organisation
              </span>
            </div>

            <div
              style={{
                padding: 24,
              }}
            >
              <div className="management-form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">
                    Nom de l'église
                  </label>

                  <input
                    className="form-input"
                    type="text"
                    value={
                      settings.churchName
                    }
                    onChange={
                      handleChurchNameChange
                    }
                    disabled={
                      !isAdmin
                    }
                    placeholder="Nom de votre église"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==============================================
              EMAIL
          ============================================== */}

          <div
            className="management-card"
            style={{
              marginTop: 24,
              opacity:
                canUseEmailNotifications
                  ? 1
                  : 0.72,
            }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Notifications email
                </h2>

                <p className="page-subtitle">
                  Gérez les emails
                  envoyés aux membres.
                </p>
              </div>

              {canUseEmailNotifications ? (
                <span
                  className={`status-badge ${
                    settings.emailNotificationsEnabled
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {settings.emailNotificationsEnabled
                    ? "Activées"
                    : "Désactivées"}
                </span>
              ) : (
                <span className="status-badge status-inactive">
                  🔒 Standard
                </span>
              )}
            </div>

            <div
              style={{
                padding: 24,
              }}
            >
              {!canUseEmailNotifications && (
                <div
                  style={{
                    marginBottom: 16,
                    padding:
                      "14px 16px",
                    borderRadius: 10,
                    background:
                      "#fff7ed",
                    border:
                      "1px solid #fed7aa",
                    color:
                      "#9a3412",
                    lineHeight: 1.6,
                  }}
                >
                  🔒 Les notifications
                  email sont disponibles
                  à partir du plan{" "}
                  <strong>
                    Standard
                  </strong>
                  .
                </div>
              )}

              <label
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  padding:
                    "18px 20px",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: 12,
                  background:
                    "#f8fafc",

                  cursor:
                    isAdmin &&
                    canUseEmailNotifications
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        "#111827",
                    }}
                  >
                    Activer les
                    notifications email
                  </div>

                  <div className="person-secondary">
                    Les membres peuvent
                    recevoir les emails
                    liés à leurs
                    programmations.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={
                    canUseEmailNotifications &&
                    settings.emailNotificationsEnabled
                  }
                  onChange={
                    handleEmailNotifications
                  }
                  disabled={
                    !isAdmin ||
                    !canUseEmailNotifications
                  }
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              </label>
            </div>
          </div>

          {/* ==============================================
              RAPPELS
          ============================================== */}

          <div
            className="management-card"
            style={{
              marginTop: 24,

              opacity:
                canUseReminders
                  ? 1
                  : 0.72,
            }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Rappels automatiques
                </h2>

                <p className="page-subtitle">
                  Relancez les membres
                  qui n'ont pas encore
                  répondu à une
                  programmation.
                </p>
              </div>

              {canUseReminders ? (
                <span
                  className={`status-badge ${
                    settings.reminderEnabled
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {settings.reminderEnabled
                    ? "Activés"
                    : "Désactivés"}
                </span>
              ) : (
                <span className="status-badge status-inactive">
                  🔒 Premium
                </span>
              )}
            </div>

            <div
              style={{
                padding: 24,
              }}
            >
              {!canUseReminders && (
                <div
                  style={{
                    marginBottom: 16,
                    padding:
                      "14px 16px",
                    borderRadius: 10,
                    background:
                      "#fff7ed",
                    border:
                      "1px solid #fed7aa",
                    color:
                      "#9a3412",
                    lineHeight: 1.6,
                  }}
                >
                  🔒 Les rappels
                  automatiques sont
                  réservés au plan{" "}
                  <strong>
                    Premium
                  </strong>
                  .
                </div>
              )}

              {/* ACTIVATION */}

              <label
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  padding:
                    "18px 20px",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: 12,
                  background:
                    "#f8fafc",

                  cursor:
                    isAdmin &&
                    canUseReminders
                      ? "pointer"
                      : "not-allowed",

                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        "#111827",
                    }}
                  >
                    🔔 Activer les
                    rappels automatiques
                  </div>

                  <div className="person-secondary">
                    Les membres sans
                    réponse seront
                    relancés avant
                    l'événement.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={
                    canUseReminders &&
                    settings.reminderEnabled
                  }
                  onChange={
                    handleReminderEnabled
                  }
                  disabled={
                    !isAdmin ||
                    !canUseReminders
                  }
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              </label>

              {canUseReminders &&
                settings.reminderEnabled && (
                  <div className="management-form-grid">

                    {/* JOURS */}

                    <div className="form-group form-group-full">
                      <label className="form-label">
                        Jours de rappel
                      </label>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: 12,
                          flexWrap:
                            "wrap",
                          marginTop:
                            10,
                        }}
                      >
                        {AVAILABLE_DAYS.map(
                          (day) => {
                            const selected =
                              settings.reminderDays.includes(
                                day
                              );

                            return (
                              <label
                                key={
                                  day
                                }
                                style={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  gap: 8,

                                  padding:
                                    "11px 15px",

                                  border:
                                    selected
                                      ? "1px solid #6366f1"
                                      : "1px solid #e5e7eb",

                                  borderRadius:
                                    10,

                                  background:
                                    selected
                                      ? "#eef2ff"
                                      : "#ffffff",

                                  fontWeight:
                                    selected
                                      ? 700
                                      : 500,

                                  cursor:
                                    isAdmin
                                      ? "pointer"
                                      : "default",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    selected
                                  }
                                  disabled={
                                    !isAdmin
                                  }
                                  onChange={() =>
                                    handleReminderDay(
                                      day
                                    )
                                  }
                                />

                                J-{day}
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* HEURE */}

                    <div className="form-group">
                      <label className="form-label">
                        Heure d'envoi
                      </label>

                      <select
                        className="form-select"
                        value={
                          settings.reminderHour
                        }
                        onChange={
                          handleHourChange
                        }
                        disabled={
                          !isAdmin
                        }
                      >
                        {Array.from(
                          {
                            length:
                              24,
                          },
                          (
                            _,
                            hour
                          ) => (
                            <option
                              key={
                                hour
                              }
                              value={
                                hour
                              }
                            >
                              {String(
                                hour
                              ).padStart(
                                2,
                                "0"
                              )}
                              :00
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* TIMEZONE */}

                    <div className="form-group">
                      <label className="form-label">
                        Fuseau horaire
                      </label>

                      <select
                        className="form-select"
                        value={
                          settings.timezone
                        }
                        onChange={
                          handleTimezoneChange
                        }
                        disabled={
                          !isAdmin
                        }
                      >
                        <option value="Europe/Paris">
                          Europe / Paris
                        </option>

                        <option value="Africa/Douala">
                          Afrique / Douala
                        </option>

                        <option value="Europe/London">
                          Europe / Londres
                        </option>

                        <option value="America/New_York">
                          Amérique / New
                          York
                        </option>

                        <option value="America/Toronto">
                          Amérique /
                          Toronto
                        </option>
                      </select>
                    </div>

                    {/* RÉSUMÉ */}

                    <div className="form-group form-group-full">
                      <div
                        style={{
                          padding: 18,
                          borderRadius:
                            12,
                          background:
                            "#eef2ff",
                          border:
                            "1px solid #c7d2fe",
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              800,

                            color:
                              "#3730a3",

                            marginBottom:
                              8,
                          }}
                        >
                          Configuration
                          actuelle
                        </div>

                        <div
                          style={{
                            color:
                              "#4338ca",

                            lineHeight:
                              1.7,
                          }}
                        >
                          Les membres
                          sans réponse
                          recevront un
                          rappel à{" "}

                          <strong>
                            {String(
                              settings.reminderHour
                            ).padStart(
                              2,
                              "0"
                            )}
                            :00
                          </strong>{" "}

                          à{" "}

                          {[
                            ...settings.reminderDays,
                          ]
                            .sort(
                              (
                                a,
                                b
                              ) =>
                                b -
                                a
                            )
                            .map(
                              (
                                day
                              ) =>
                                `J-${day}`
                            )
                            .join(
                              ", "
                            )}
                          .
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* ==============================================
              BOUTON BAS
          ============================================== */}

          {isAdmin && (
            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent:
                  "flex-end",
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : "💾 Enregistrer les paramètres"}
              </button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}