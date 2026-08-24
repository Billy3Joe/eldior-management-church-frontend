import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import API from "../api/axios";

const AVAILABLE_DAYS = [1, 2, 3, 7];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    churchName: "ElDior Management Church",
    reminderEnabled: true,
    reminderDays: [2, 1],
    reminderHour: 9,
    timezone: "Europe/Paris",
  });

  // ======================================================
  // CHARGER LES PARAMÈTRES
  // ======================================================

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await API.get("/settings");

      if (res.data?.data) {
        setSettings({
          churchName:
            res.data.data.churchName ||
            "ElDior Management Church",

          reminderEnabled:
            res.data.data.reminderEnabled !== false,

          reminderDays:
            res.data.data.reminderDays || [2, 1],

          reminderHour:
            res.data.data.reminderHour ?? 9,

          timezone:
            res.data.data.timezone ||
            "Europe/Paris",
        });
      }
    } catch (error) {
      console.error(
        "Erreur chargement paramètres :",
        error
      );

      toast.error(
        error.response?.data?.message ||
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
  // CHANGEMENT NOM ÉGLISE
  // ======================================================

  const handleChurchNameChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      churchName: e.target.value,
    }));
  };

  // ======================================================
  // ACTIVER / DÉSACTIVER RAPPELS
  // ======================================================

  const handleReminderEnabled = (e) => {
    setSettings((prev) => ({
      ...prev,
      reminderEnabled: e.target.checked,
    }));
  };

  // ======================================================
  // JOURS DE RAPPEL
  // ======================================================

  const handleReminderDay = (day) => {
    setSettings((prev) => {
      const exists =
        prev.reminderDays.includes(day);

      let newDays;

      if (exists) {
        newDays = prev.reminderDays.filter(
          (item) => item !== day
        );
      } else {
        newDays = [
          ...prev.reminderDays,
          day,
        ];
      }

      newDays.sort((a, b) => b - a);

      return {
        ...prev,
        reminderDays: newDays,
      };
    });
  };

  // ======================================================
  // HEURE
  // ======================================================

  const handleHourChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      reminderHour: Number(e.target.value),
    }));
  };

  // ======================================================
  // FUSEAU HORAIRE
  // ======================================================

  const handleTimezoneChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      timezone: e.target.value,
    }));
  };

  // ======================================================
  // ENREGISTRER
  // ======================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!settings.churchName.trim()) {
      toast.warning(
        "Le nom de l'église est obligatoire"
      );

      return;
    }

    if (
      settings.reminderEnabled &&
      settings.reminderDays.length === 0
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
          Number(settings.reminderHour),

        timezone:
          settings.timezone,
      };

      const res = await API.put(
        "/settings",
        payload
      );

      if (res.data?.data) {
        setSettings({
          churchName:
            res.data.data.churchName,

          reminderEnabled:
            res.data.data.reminderEnabled,

          reminderDays:
            res.data.data.reminderDays,

          reminderHour:
            res.data.data.reminderHour,

          timezone:
            res.data.data.timezone,
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
        error.response?.data?.message ||
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
          <p>Chargement des paramètres...</p>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Paramètres</h2>

          <p className="page-subtitle">
            Configurez votre église et les rappels
            automatiques des programmations.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* ========================================= */}
        {/* INFORMATIONS ÉGLISE */}
        {/* ========================================= */}

        <div className="card section-gap">
          <div className="section-header">
            <div>
              <h2>Informations de l'église</h2>

              <p className="page-subtitle">
                Informations générales de votre
                organisation.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Nom de l'église</label>

            <input
              type="text"
              value={settings.churchName}
              onChange={handleChurchNameChange}
              placeholder="Nom de l'église"
            />
          </div>
        </div>

        {/* ========================================= */}
        {/* RAPPELS */}
        {/* ========================================= */}

        <div className="card section-gap">
          <div className="section-header">
            <div>
              <h2>🔔 Rappels automatiques</h2>

              <p className="page-subtitle">
                Relancez automatiquement les membres
                qui n'ont pas encore répondu à leur
                programmation.
              </p>
            </div>
          </div>

          {/* ACTIVATION */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "25px",
            }}
          >
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={
                settings.reminderEnabled
              }
              onChange={
                handleReminderEnabled
              }
              style={{
                width: "20px",
                height: "20px",
              }}
            />

            <label
              htmlFor="reminderEnabled"
              style={{
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Activer les rappels automatiques
            </label>
          </div>

          {settings.reminderEnabled && (
            <>
              {/* =============================== */}
              {/* JOURS */}
              {/* =============================== */}

              <div className="form-group">
                <label>
                  Jours d'envoi des rappels
                </label>

                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    marginTop: "5px",
                    marginBottom: "15px",
                  }}
                >
                  Sélectionnez quand relancer les
                  membres qui n'ont pas répondu.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
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
                          key={day}
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "7px",
                            padding:
                              "10px 14px",
                            border:
                              "1px solid #e5e7eb",
                            borderRadius:
                              "8px",
                            cursor:
                              "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selected
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

              {/* =============================== */}
              {/* HEURE */}
              {/* =============================== */}

              <div
                className="form-group"
                style={{
                  marginTop: "25px",
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
                >
                  {Array.from(
                    { length: 24 },
                    (_, hour) => (
                      <option
                        key={hour}
                        value={hour}
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

              {/* =============================== */}
              {/* TIMEZONE */}
              {/* =============================== */}

              <div
                className="form-group"
                style={{
                  marginTop: "20px",
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

              {/* =============================== */}
              {/* RÉSUMÉ */}
              {/* =============================== */}

              <div
                style={{
                  marginTop: "25px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border:
                    "1px solid #e5e7eb",
                }}
              >
                <strong>
                  Configuration actuelle
                </strong>

                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: "0",
                  }}
                >
                  Les membres sans réponse
                  recevront un rappel à{" "}
                  <strong>
                    {String(
                      settings.reminderHour
                    ).padStart(2, "0")}
                    :00
                  </strong>{" "}
                  à{" "}
                  {settings.reminderDays
                    .sort(
                      (a, b) => b - a
                    )
                    .map(
                      (day) =>
                        `J-${day}`
                    )
                    .join(", ")}
                  .
                </p>
              </div>
            </>
          )}
        </div>

        {/* ========================================= */}
        {/* BOUTON SAVE */}
        {/* ========================================= */}

        <div
          className="form-actions"
          style={{
            marginTop: "25px",
          }}
        >
          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer les paramètres"}
          </button>
        </div>
      </form>
    </Layout>
  );
}