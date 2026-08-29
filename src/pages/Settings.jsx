import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import API from "../api/axios";
import { getCurrentAdmin } from "../utils/auth";

const AVAILABLE_DAYS = [1, 2, 3, 7];

export default function Settings() {
  const currentUser = getCurrentAdmin();

  const isAdmin =
    currentUser?.role === "admin";

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [settings, setSettings] =
    useState({
      churchName:
        "ElDior Management Church",

      reminderEnabled: true,

      reminderDays: [2, 1],

      reminderHour: 9,

      timezone:
        "Europe/Paris",

      emailNotificationsEnabled:
        true,

      primaryColor: "",

      logo: "",
    });

  // ======================================================
  // CHARGER LES PARAMÈTRES
  // ======================================================

  const fetchSettings = async () => {
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
              .reminderEnabled !==
            false,

          reminderDays:
            Array.isArray(
              res.data.data
                .reminderDays
            )
              ? res.data.data
                  .reminderDays
              : [2, 1],

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
              .emailNotificationsEnabled !==
            false,

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

  const handleChurchNameChange = (
    e
  ) => {
    if (!isAdmin) {
      return;
    }

    setSettings((prev) => ({
      ...prev,

      churchName:
        e.target.value,
    }));
  };

  // ======================================================
  // RAPPELS ON / OFF
  // ======================================================

  const handleReminderEnabled = (
    e
  ) => {
    if (!isAdmin) {
      return;
    }

    setSettings((prev) => ({
      ...prev,

      reminderEnabled:
        e.target.checked,
    }));
  };

  // ======================================================
  // EMAILS ON / OFF
  // ======================================================

  const handleEmailNotifications =
    (e) => {
      if (!isAdmin) {
        return;
      }

      setSettings((prev) => ({
        ...prev,

        emailNotificationsEnabled:
          e.target.checked,
      }));
    };

  // ======================================================
  // JOURS DE RAPPEL
  // ======================================================

  const handleReminderDay = (
    day
  ) => {
    if (!isAdmin) {
      return;
    }

    setSettings((prev) => {
      const exists =
        prev.reminderDays.includes(
          day
        );

      let newDays;

      if (exists) {
        newDays =
          prev.reminderDays.filter(
            (item) =>
              item !== day
          );
      } else {
        newDays = [
          ...prev.reminderDays,
          day,
        ];
      }

      newDays.sort(
        (a, b) =>
          b - a
      );

      return {
        ...prev,
        reminderDays:
          newDays,
      };
    });
  };

  // ======================================================
  // HEURE
  // ======================================================

  const handleHourChange = (
    e
  ) => {
    if (!isAdmin) {
      return;
    }

    setSettings((prev) => ({
      ...prev,

      reminderHour:
        Number(
          e.target.value
        ),
    }));
  };

  // ======================================================
  // TIMEZONE
  // ======================================================

  const handleTimezoneChange = (
    e
  ) => {
    if (!isAdmin) {
      return;
    }

    setSettings((prev) => ({
      ...prev,

      timezone:
        e.target.value,
    }));
  };

  // ======================================================
  // ENREGISTRER
  // ======================================================

  const handleSave = async (
    e
  ) => {
    e.preventDefault();

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

      const payload = {
        churchName:
          settings.churchName.trim(),

        reminderEnabled:
          settings.reminderEnabled,

        reminderDays:
          settings.reminderDays,

        reminderHour:
          Number(
            settings.reminderHour
          ),

        timezone:
          settings.timezone,

        emailNotificationsEnabled:
          settings.emailNotificationsEnabled,

        primaryColor:
          settings.primaryColor,

        logo:
          settings.logo,
      };

      const res =
        await API.put(
          "/settings",
          payload
        );

      if (res.data?.data) {
        setSettings({
          churchName:
            res.data.data
              .churchName,

          reminderEnabled:
            res.data.data
              .reminderEnabled,

          reminderDays:
            res.data.data
              .reminderDays,

          reminderHour:
            res.data.data
              .reminderHour,

          timezone:
            res.data.data
              .timezone,

          emailNotificationsEnabled:
            res.data.data
              .emailNotificationsEnabled !==
            false,

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

      toast.success(
        res.data?.message ||
          "Paramètres enregistrés avec succès"
      );
    } catch (error) {
      console.error(
        "Erreur enregistrement paramètres :",
        error
      );

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
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="card">
          <p>
            Chargement des paramètres...
          </p>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>
            Paramètres
          </h2>

          <p className="page-subtitle">
            Configurez votre église
            et les notifications
            automatiques.
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div
          className="card section-gap"
          style={{
            borderLeft:
              "4px solid #f59e0b",
          }}
        >
          <strong>
            Consultation uniquement
          </strong>

          <p
            style={{
              marginBottom: 0,
              marginTop: 6,
            }}
          >
            Vous êtes connecté en
            tant que manager. Seul
            un administrateur peut
            modifier les paramètres
            de l'église.
          </p>
        </div>
      )}

      <form
        onSubmit={
          handleSave
        }
      >
        {/* ========================================= */}
        {/* ÉGLISE */}
        {/* ========================================= */}

        <div className="card section-gap">
          <div className="section-header">
            <div>
              <h2>
                Informations de
                l'église
              </h2>

              <p className="page-subtitle">
                Informations générales
                de votre organisation.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>
              Nom de l'église
            </label>

            <input
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
            />
          </div>
        </div>

        {/* ========================================= */}
        {/* EMAILS */}
        {/* ========================================= */}

        <div className="card section-gap">
          <div className="section-header">
            <div>
              <h2>
                Notifications email
              </h2>

              <p className="page-subtitle">
                Activez ou désactivez
                les notifications
                envoyées aux membres.
              </p>
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: 12,
              cursor:
                isAdmin
                  ? "pointer"
                  : "default",
            }}
          >
            <input
              type="checkbox"
              checked={
                settings.emailNotificationsEnabled
              }
              onChange={
                handleEmailNotifications
              }
              disabled={
                !isAdmin
              }
            />

            Activer les notifications
            email
          </label>
        </div>

        {/* ========================================= */}
        {/* RAPPELS */}
        {/* ========================================= */}

        <div className="card section-gap">
          <div className="section-header">
            <div>
              <h2>
                🔔 Rappels
                automatiques
              </h2>

              <p className="page-subtitle">
                Relancez les membres
                qui n'ont pas encore
                répondu à leur
                programmation.
              </p>
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: 12,
              marginBottom:
                25,
            }}
          >
            <input
              type="checkbox"
              checked={
                settings.reminderEnabled
              }
              onChange={
                handleReminderEnabled
              }
              disabled={
                !isAdmin
              }
            />

            Activer les rappels
            automatiques
          </label>

          {settings.reminderEnabled && (
            <>
              <div className="form-group">
                <label>
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
                      12,
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
                            gap: 7,
                            padding:
                              "10px 14px",
                            border:
                              "1px solid #e5e7eb",
                            borderRadius:
                              8,
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

              <div
                className="form-group"
                style={{
                  marginTop:
                    25,
                }}
              >
                <label>
                  Heure d'envoi
                </label>

                <select
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
                      length: 24,
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

              <div
                className="form-group"
                style={{
                  marginTop:
                    20,
                }}
              >
                <label>
                  Fuseau horaire
                </label>

                <select
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
                    Amérique / New York
                  </option>

                  <option value="America/Toronto">
                    Amérique / Toronto
                  </option>
                </select>
              </div>

              <div
                style={{
                  marginTop:
                    25,
                  padding:
                    16,
                  background:
                    "#f8fafc",
                  borderRadius:
                    10,
                  border:
                    "1px solid #e5e7eb",
                }}
              >
                <strong>
                  Configuration
                  actuelle
                </strong>

                <p
                  style={{
                    marginTop:
                      8,
                    marginBottom:
                      0,
                  }}
                >
                  Les membres sans
                  réponse recevront
                  un rappel à{" "}
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
                </p>
              </div>
            </>
          )}
        </div>

        {/* ========================================= */}
        {/* ENREGISTRER */}
        {/* ========================================= */}

        {isAdmin && (
          <div
            className="form-actions"
            style={{
              marginTop:
                25,
            }}
          >
            <button
              type="submit"
              disabled={
                saving
              }
            >
              {saving
                ? "Enregistrement..."
                : "Enregistrer les paramètres"}
            </button>
          </div>
        )}
      </form>
    </Layout>
  );
}