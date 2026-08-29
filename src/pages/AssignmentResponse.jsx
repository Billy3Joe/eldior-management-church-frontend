import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

export default function AssignmentResponse() {
  const { token } = useParams();

  const [searchParams] =
    useSearchParams();

  const initialAction =
    searchParams.get("action");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [assignment, setAssignment] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ======================================================
  // CHARGER LA PROGRAMMATION PUBLIQUE
  // ======================================================

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/assignments/public/${token}`
      );

      if (response.data?.success) {
        setAssignment(
          response.data.data
        );
      }
    } catch (err) {
      console.error(
        "Erreur chargement programmation :",
        err
      );

      setError(
        err.response?.data?.message ||
          "Impossible de charger cette programmation."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // ENVOYER LA RÉPONSE
  // ======================================================

  const respond = async (action) => {
    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response =
        await axios.post(
          `${API_URL}/assignments/public/${token}/respond`,
          {
            action,
          }
        );

      if (response.data?.success) {
        setMessage(
          response.data.message
        );

        setAssignment(
          (previous) => ({
            ...previous,
            status:
              response.data.data
                ?.status,
            confirmedAt:
              response.data.data
                ?.confirmedAt,
            declinedAt:
              response.data.data
                ?.declinedAt,
          })
        );
      }
    } catch (err) {
      console.error(
        "Erreur réponse programmation :",
        err
      );

      setError(
        err.response?.data?.message ||
          "Impossible d'enregistrer votre réponse."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // CHARGEMENT INITIAL
  // ======================================================

  useEffect(() => {
    if (!token) {
      setError(
        "Lien de programmation invalide."
      );

      setLoading(false);

      return;
    }

    fetchAssignment();
  }, [token]);

  // ======================================================
  // ACTION DIRECTE DEPUIS URL
  // ======================================================

  useEffect(() => {
    if (
      loading ||
      !assignment ||
      submitting
    ) {
      return;
    }

    if (
      initialAction !==
        "confirm" &&
      initialAction !==
        "decline"
    ) {
      return;
    }

    if (
      assignment.status !==
      "pending"
    ) {
      return;
    }

    respond(initialAction);
  }, [
    loading,
    assignment,
    initialAction,
  ]);

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "Date non renseignée";
    }

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(date)
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          padding: 20,
          background:
            "#f5f7fb",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 30,
            borderRadius: 16,
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
            maxWidth: 600,
            width: "100%",
            textAlign:
              "center",
          }}
        >
          Chargement de votre
          programmation...
        </div>
      </div>
    );
  }

  // ======================================================
  // ERREUR SANS PROGRAMMATION
  // ======================================================

  if (
    error &&
    !assignment
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          padding: 20,
          background:
            "#f5f7fb",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 30,
            borderRadius: 16,
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
            maxWidth: 600,
            width: "100%",
            textAlign:
              "center",
          }}
        >
          <h2>
            Lien indisponible
          </h2>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ======================================================
  // DONNÉES
  // ======================================================

  const member =
    assignment?.member;

  const event =
    assignment?.event;

  const department =
    assignment?.department;

  const church =
    assignment?.church;

  const status =
    assignment?.status;

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#f5f7fb",
        padding:
          "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          boxShadow:
            "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        {/* ÉGLISE */}

        <div
          style={{
            textAlign:
              "center",
            marginBottom: 30,
          }}
        >
          <h1
            style={{
              marginBottom: 6,
            }}
          >
            {church?.name ||
              "ElDior Management Church"}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Confirmation de
            programmation
          </p>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              marginBottom: 20,
              background:
                "#ecfdf5",
              border:
                "1px solid #a7f3d0",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              marginBottom: 20,
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        {/* MEMBRE */}

        <div
          style={{
            marginBottom: 25,
          }}
        >
          <p
            style={{
              fontSize: 18,
              marginBottom: 5,
            }}
          >
            Bonjour
          </p>

          <h2
            style={{
              marginTop: 0,
            }}
          >
            {member?.firstName}{" "}
            {member?.lastName}
          </h2>
        </div>

        {/* INFORMATIONS */}

        <div
          style={{
            display: "grid",
            gap: 16,
            marginBottom: 30,
          }}
        >
          <div>
            <strong>
              Événement
            </strong>

            <div>
              {event?.title ||
                "Non renseigné"}
            </div>
          </div>

          <div>
            <strong>
              Date
            </strong>

            <div>
              {formatDate(
                event?.date
              )}
            </div>
          </div>

          <div>
            <strong>
              Lieu
            </strong>

            <div>
              {event?.location ||
                "Non renseigné"}
            </div>
          </div>

          <div>
            <strong>
              Département
            </strong>

            <div>
              {department?.name ||
                "Non renseigné"}
            </div>
          </div>

          <div>
            <strong>
              Votre poste
            </strong>

            <div>
              {assignment?.role ||
                "Non renseigné"}
            </div>
          </div>

          {assignment?.note && (
            <div>
              <strong>
                Note
              </strong>

              <div>
                {
                  assignment.note
                }
              </div>
            </div>
          )}
        </div>

        {/* STATUT CONFIRMÉ */}

        {status ===
          "confirmed" && (
          <div
            style={{
              padding: 18,
              background:
                "#ecfdf5",
              border:
                "1px solid #a7f3d0",
              borderRadius: 12,
              textAlign:
                "center",
            }}
          >
            <strong>
              ✓ Participation
              confirmée
            </strong>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Merci. Votre
              présence a bien été
              enregistrée.
            </p>
          </div>
        )}

        {/* STATUT REFUSÉ */}

        {status ===
          "declined" && (
          <div
            style={{
              padding: 18,
              background:
                "#fff7ed",
              border:
                "1px solid #fed7aa",
              borderRadius: 12,
              textAlign:
                "center",
            }}
          >
            <strong>
              Indisponibilité
              enregistrée
            </strong>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Votre réponse a bien
              été prise en compte.
            </p>
          </div>
        )}

        {/* ACTIONS */}

        {status ===
          "pending" && (
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginTop: 25,
            }}
          >
            <button
              type="button"
              disabled={
                submitting
              }
              onClick={() =>
                respond(
                  "confirm"
                )
              }
              style={{
                flex: 1,
                minWidth: 220,
                padding:
                  "14px 18px",
                border: "none",
                borderRadius: 10,
                cursor:
                  submitting
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
              }}
            >
              {submitting
                ? "Enregistrement..."
                : "Je confirme ma présence"}
            </button>

            <button
              type="button"
              disabled={
                submitting
              }
              onClick={() =>
                respond(
                  "decline"
                )
              }
              style={{
                flex: 1,
                minWidth: 220,
                padding:
                  "14px 18px",
                borderRadius: 10,
                cursor:
                  submitting
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
              }}
            >
              Je ne suis pas
              disponible
            </button>
          </div>
        )}
      </div>
    </div>
  );
}