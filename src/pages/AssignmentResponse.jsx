import { useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
} from "react-router-dom";
import API from "../api/axios";

export default function AssignmentResponse() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  const actionFromEmail = searchParams.get("action");

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const res = await API.get(
          `/assignments/public/${token}`
        );

        setAssignment(res.data.data);
      } catch (error) {
        console.error(
          "Erreur programmation publique :",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            "Ce lien est invalide ou a expiré."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [token]);

  const respond = async (selectedAction) => {
    console.log("ACTION CLIQUÉE :", selectedAction);

    if (!["confirm", "decline"].includes(selectedAction)) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setErrorMessage("");

      const res = await API.post(
        `/assignments/public/${token}/respond`,
        {
          action: selectedAction,
        }
      );

      setMessage(res.data.message);

      setAssignment((prev) => ({
        ...prev,
        status:
          selectedAction === "confirm"
            ? "confirmed"
            : "declined",
      }));
    } catch (error) {
      console.error(
        "Erreur réponse programmation :",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Impossible d’enregistrer votre réponse."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "fr-FR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (loading) {
    return (
      <div className="assignment-response-page">
        <div className="assignment-response-card">
          <h2>ElDior Management Church</h2>

          <p>
            Chargement de votre programmation...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage && !assignment) {
    return (
      <div className="assignment-response-page">
        <div className="assignment-response-card">
          <div className="response-logo">
            EMC
          </div>

          <h1>
            ElDior Management Church
          </h1>

          <h2>
            Programmation indisponible
          </h2>

          <p className="response-error">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  const memberName = `${
    assignment.member?.firstName || ""
  } ${
    assignment.member?.lastName || ""
  }`.trim();

  return (
    <div className="assignment-response-page">
      <div className="assignment-response-card">
        <div className="response-logo">
          EMC
        </div>

        <h1>
          ElDior Management Church
        </h1>

        <p className="response-subtitle">
          Confirmation de programmation
        </p>

        <div className="response-welcome">
          <h2>
            Bonjour{" "}
            {memberName || "cher membre"}
          </h2>

          <p>
            Vous avez été programmé(e)
            pour participer à l’événement suivant.
          </p>
        </div>

        <div className="response-details">
          <div className="response-detail-line">
            <span>Événement</span>

            <strong>
              {assignment.event?.title || "-"}
            </strong>
          </div>

          <div className="response-detail-line">
            <span>Date</span>

            <strong>
              {formatDate(
                assignment.event?.date
              )}
            </strong>
          </div>

          <div className="response-detail-line">
            <span>Lieu</span>

            <strong>
              {assignment.event?.location || "-"}
            </strong>
          </div>

          <div className="response-detail-line">
            <span>Département</span>

            <strong>
              {assignment.department?.name || "-"}
            </strong>
          </div>

          <div className="response-detail-line">
            <span>Votre poste</span>

            <strong>
              {assignment.role || "-"}
            </strong>
          </div>

          {assignment.note && (
            <div className="response-note">
              <span>Consignes</span>

              <p>{assignment.note}</p>
            </div>
          )}
        </div>

        {message && (
          <div className="response-message">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="response-error">
            {errorMessage}
          </div>
        )}

        {assignment.status === "pending" && (
          <>
            {actionFromEmail === "confirm" && (
              <p className="response-hint">
                Vous avez choisi de confirmer votre disponibilité.
                Cliquez ci-dessous pour valider.
              </p>
            )}

            {actionFromEmail === "decline" && (
              <p className="response-hint">
                Vous avez indiqué ne pas être disponible.
                Cliquez ci-dessous pour valider.
              </p>
            )}

            <div className="response-actions">
              <button
                type="button"
                className="confirm-response-btn"
                disabled={submitting}
                onClick={() => respond("confirm")}
              >
                {submitting
                  ? "Enregistrement..."
                  : "Je confirme ma présence"}
              </button>

              <button
                type="button"
                className="decline-response-btn"
                disabled={submitting}
                onClick={() => respond("decline")}
              >
                Je ne suis pas disponible
              </button>
            </div>
          </>
        )}

        {assignment.status === "confirmed" && (
          <div className="response-success">
            <strong>
              Participation confirmée
            </strong>

            <p>
              Merci. Votre responsable peut maintenant voir votre confirmation.
            </p>
          </div>
        )}

        {assignment.status === "declined" && (
          <div className="response-declined">
            <strong>
              Indisponibilité enregistrée
            </strong>

            <p>
              Votre responsable peut maintenant voir votre réponse.
            </p>
          </div>
        )}

        {assignment.status === "cancelled" && (
          <div className="response-declined">
            Cette programmation a été annulée.
          </div>
        )}

        <p className="response-footer">
          ElDior Management Church · Service de programmation
        </p>
      </div>
    </div>
  );
}