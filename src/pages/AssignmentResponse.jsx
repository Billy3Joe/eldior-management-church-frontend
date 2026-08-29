import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "react-router-dom";

import axios from "axios";

import "./AssignmentResponse.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

export default function AssignmentResponse() {
  const { token } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const initialAction =
    searchParams.get("action");

  const actionProcessed =
    useRef(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    assignment,
    setAssignment,
  ] = useState(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // ======================================================
  // CHARGER LA PROGRAMMATION
  // ======================================================

  const fetchAssignment =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            `${API_URL}/assignments/public/${token}`
          );

        if (
          response.data?.success
        ) {
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
          err.response?.data
            ?.message ||
            "Impossible de charger cette programmation."
        );
      } finally {
        setLoading(false);
      }
    };

  // ======================================================
  // ENVOYER LA RÉPONSE
  // ======================================================

  const respond = async (
    action
  ) => {
    if (submitting) {
      return;
    }

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

      if (
        response.data?.success
      ) {
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
        err.response?.data
          ?.message ||
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
      submitting ||
      actionProcessed.current
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

    actionProcessed.current =
      true;

    respond(
      initialAction
    );
  }, [
    loading,
    assignment,
    initialAction,
    submitting,
  ]);

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Date non renseignée";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
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
      parsedDate
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="assignment-public-page">
        <div className="assignment-state-card">
          <div className="assignment-loader" />

          <h2>
            Chargement...
          </h2>

          <p>
            Nous préparons votre
            programmation.
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // ERREUR
  // ======================================================

  if (
    error &&
    !assignment
  ) {
    return (
      <div className="assignment-public-page">
        <div className="assignment-state-card">
          <div className="assignment-state-icon assignment-error-icon">
            !
          </div>

          <h2>
            Lien indisponible
          </h2>

          <p>
            {error}
          </p>

          <div className="assignment-state-help">
            Ce lien peut être
            invalide, expiré ou ne
            plus être disponible.
          </div>
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

  const memberName =
    `${member?.firstName || ""} ${
      member?.lastName || ""
    }`.trim() ||
    "Membre";

  const churchName =
    church?.name ||
    "ElDior Management Church";

  const initials =
    `${member?.firstName?.[0] || ""}${
      member?.lastName?.[0] || ""
    }`.toUpperCase() ||
    "M";

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="assignment-public-page">
      <div className="assignment-public-wrapper">
        {/* ================================================
            BRAND
        ================================================ */}

        <header className="assignment-public-header">
          <div className="assignment-church-logo">
            {church?.logo ? (
              <img
                src={
                  church.logo
                }
                alt={
                  churchName
                }
              />
            ) : (
              <span>
                {churchName
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div className="assignment-church-name">
              {churchName}
            </div>

            <div className="assignment-brand-subtitle">
              Programmation
              ministérielle
            </div>
          </div>
        </header>

        {/* ================================================
            CARTE
        ================================================ */}

        <main className="assignment-response-card">
          {/* TOP */}

          <div className="assignment-response-top">
            <div className="assignment-member-avatar">
              {initials}
            </div>

            <div className="assignment-response-intro">
              <span>
                Bonjour
              </span>

              <h1>
                {memberName}
              </h1>

              <p>
                Vous avez été
                programmé(e) pour
                participer à
                l'événement suivant.
              </p>
            </div>
          </div>

          {/* ================================================
              MESSAGES
          ================================================ */}

          {message && (
            <div className="assignment-alert assignment-alert-success">
              <div className="assignment-alert-icon">
                ✓
              </div>

              <div>
                <strong>
                  Réponse enregistrée
                </strong>

                <p>
                  {message}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="assignment-alert assignment-alert-error">
              <div className="assignment-alert-icon">
                !
              </div>

              <div>
                <strong>
                  Une erreur est
                  survenue
                </strong>

                <p>
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* ================================================
              EVENT
          ================================================ */}

          <section className="assignment-event-card">
            <div className="assignment-event-label">
              VOTRE PROGRAMMATION
            </div>

            <h2>
              {event?.title ||
                "Événement"}
            </h2>

            <div className="assignment-information-grid">
              <div className="assignment-information-item">
                <div className="assignment-information-icon">
                  📅
                </div>

                <div>
                  <span>
                    Date et heure
                  </span>

                  <strong>
                    {formatDate(
                      event?.date
                    )}
                  </strong>
                </div>
              </div>

              <div className="assignment-information-item">
                <div className="assignment-information-icon">
                  📍
                </div>

                <div>
                  <span>
                    Lieu
                  </span>

                  <strong>
                    {event?.location ||
                      "Non renseigné"}
                  </strong>
                </div>
              </div>

              <div className="assignment-information-item">
                <div className="assignment-information-icon">
                  👥
                </div>

                <div>
                  <span>
                    Département
                  </span>

                  <strong>
                    {department?.name ||
                      "Non renseigné"}
                  </strong>
                </div>
              </div>

              <div className="assignment-information-item">
                <div className="assignment-information-icon">
                  ⭐
                </div>

                <div>
                  <span>
                    Votre poste
                  </span>

                  <strong>
                    {assignment?.role ||
                      "Non renseigné"}
                  </strong>
                </div>
              </div>
            </div>

            {assignment?.note && (
              <div className="assignment-note">
                <div className="assignment-note-title">
                  Note du responsable
                </div>

                <p>
                  {assignment.note}
                </p>
              </div>
            )}
          </section>

          {/* ================================================
              PENDING
          ================================================ */}

          {status ===
            "pending" && (
            <section className="assignment-response-section">
              <div className="assignment-question">
                <h3>
                  Êtes-vous disponible ?
                </h3>

                <p>
                  Merci de confirmer
                  votre disponibilité
                  afin d'aider les
                  responsables à
                  organiser le service.
                </p>
              </div>

              <div className="assignment-actions">
                <button
                  type="button"
                  className="assignment-confirm-button"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    respond(
                      "confirm"
                    )
                  }
                >
                  {submitting ? (
                    <>
                      <span className="assignment-button-loader" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <span>
                        ✓
                      </span>

                      Je confirme ma
                      présence
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="assignment-decline-button"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    respond(
                      "decline"
                    )
                  }
                >
                  Je ne suis pas
                  disponible
                </button>
              </div>
            </section>
          )}

          {/* ================================================
              CONFIRMED
          ================================================ */}

          {status ===
            "confirmed" && (
            <section className="assignment-final-status assignment-confirmed-status">
              <div className="assignment-final-icon">
                ✓
              </div>

              <h2>
                Participation confirmée
              </h2>

              <p>
                Merci{" "}
                <strong>
                  {member?.firstName}
                </strong>
                . Votre présence a
                bien été enregistrée.
              </p>

              <div className="assignment-final-message">
                Nous comptons sur
                vous pour cette
                programmation.
              </div>
            </section>
          )}

          {/* ================================================
              DECLINED
          ================================================ */}

          {status ===
            "declined" && (
            <section className="assignment-final-status assignment-declined-status">
              <div className="assignment-final-icon">
                ✓
              </div>

              <h2>
                Indisponibilité
                enregistrée
              </h2>

              <p>
                Merci pour votre
                réponse. Les
                responsables ont
                bien été informés de
                votre indisponibilité.
              </p>
            </section>
          )}

          {/* ================================================
              CANCELLED
          ================================================ */}

          {status ===
            "cancelled" && (
            <section className="assignment-final-status assignment-cancelled-status">
              <div className="assignment-final-icon">
                !
              </div>

              <h2>
                Programmation annulée
              </h2>

              <p>
                Cette programmation
                n'est plus active.
                Aucune réponse n'est
                nécessaire.
              </p>
            </section>
          )}
        </main>

        {/* ================================================
            FOOTER
        ================================================ */}

        <footer className="assignment-public-footer">
          <div>
            {churchName}
          </div>

          <p>
            Gestion des
            programmations avec
            ElDior Management Church
          </p>

          <div className="assignment-security">
            🔒 Lien personnel et
            sécurisé
          </div>
        </footer>
      </div>
    </div>
  );
}