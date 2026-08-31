import { Navigate } from "react-router-dom";

import { getCurrentAdmin } from "../utils/auth";

import {
  hasFeature,
  getRequiredPlanLabel,
} from "../utils/subscription";

import {
  useSubscription,
} from "../context/SubscriptionContext";

export default function SubscriptionRoute({
  feature,
  children,
}) {
  // ======================================================
  // UTILISATEUR CONNECTÉ
  // ======================================================

  const admin =
    getCurrentAdmin();

  // ======================================================
  // ABONNEMENT SYNCHRONISÉ
  // ======================================================

  const {
    plan,
    initialized,
    loading,
  } = useSubscription();

  // ======================================================
  // SÉCURITÉ
  // ======================================================

  if (!admin) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ======================================================
  // SUPER ADMIN ELDIOR
  // ======================================================

  if (
    admin?.platformRole ===
    "superadmin"
  ) {
    return children;
  }

  // ======================================================
  // ATTENDRE LA PREMIÈRE SYNCHRONISATION
  // ======================================================

  if (
    !initialized ||
    loading
  ) {
    return (
      <div
        style={{
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          color: "#64748b",
        }}
      >
        Vérification de l’abonnement...
      </div>
    );
  }

  // ======================================================
  // VÉRIFICATION DE LA FONCTIONNALITÉ
  // ======================================================

  const allowed =
    hasFeature(
      plan,
      feature
    );

  if (!allowed) {
    const requiredPlan =
      getRequiredPlanLabel(
        feature
      );

    sessionStorage.setItem(
      "subscriptionBlockedFeature",
      feature
    );

    sessionStorage.setItem(
      "subscriptionRequiredPlan",
      requiredPlan
    );

    return (
      <Navigate
        to="/subscription"
        replace
      />
    );
  }

  // ======================================================
  // NETTOYAGE DES ANCIENNES INFORMATIONS DE BLOCAGE
  // ======================================================

  sessionStorage.removeItem(
    "subscriptionBlockedFeature"
  );

  sessionStorage.removeItem(
    "subscriptionRequiredPlan"
  );

  // ======================================================
  // AUTORISÉ
  // ======================================================

  return children;
}