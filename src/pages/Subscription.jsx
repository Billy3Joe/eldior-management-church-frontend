import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../components/Layout";

import {
  getRequiredPlanLabel,
  normalizePlan,
} from "../utils/subscription";

import {
  useSubscription,
} from "../context/SubscriptionContext";

import "../styles/ManagementPages.css";
import "./Subscription.css";

// ======================================================
// PAGE ABONNEMENT
// ======================================================

export default function Subscription() {
  // ====================================================
  // CONTEXTE ABONNEMENT
  // ====================================================

  const {
    plan,
    subscription: contextSubscription,
    loading,
    initialized,
    error: contextError,
    refreshSubscription,
  } = useSubscription();

  // ====================================================
  // STATES LOCAUX
  // ====================================================

  const [
    blockedFeature,
    setBlockedFeature,
  ] = useState("");

  const [
    requiredPlan,
    setRequiredPlan,
  ] = useState("");

  // ====================================================
  // FONCTIONNALITÉ BLOQUÉE
  // ====================================================

  useEffect(() => {
    const feature =
      sessionStorage.getItem(
        "subscriptionBlockedFeature"
      );

    const storedPlan =
      sessionStorage.getItem(
        "subscriptionRequiredPlan"
      );

    if (feature) {
      setBlockedFeature(feature);

      setRequiredPlan(
        storedPlan ||
          getRequiredPlanLabel(
            feature
          )
      );

      sessionStorage.removeItem(
        "subscriptionBlockedFeature"
      );

      sessionStorage.removeItem(
        "subscriptionRequiredPlan"
      );
    }
  }, []);

  // ====================================================
  // NORMALISATION DE LA RÉPONSE DU CONTEXTE
  // ====================================================

  const subscriptionData =
    useMemo(() => {
      if (!contextSubscription) {
        return null;
      }

      return (
        contextSubscription?.data ||
        contextSubscription
      );
    }, [
      contextSubscription,
    ]);

  // ====================================================
  // DONNÉES
  // ====================================================

  const church =
    subscriptionData?.church || {};

  const subscription =
    subscriptionData?.subscription ||
    {};

  const limits =
    subscriptionData?.limits || {};

  const features =
    subscriptionData?.features || {};

  const usage =
    subscriptionData?.usage || {};

  // ====================================================
  // PLAN ACTUEL
  // ====================================================

  const currentPlan =
    normalizePlan(
      plan ||
        subscription?.plan ||
        church?.plan ||
        subscriptionData?.plan ||
        "free"
    );

  // ====================================================
  // LABEL DU PLAN
  // ====================================================

  const getPlanLabel = (
    selectedPlan
  ) => {
    switch (
      String(
        selectedPlan || ""
      ).toLowerCase()
    ) {
      case "premium":
        return "Premium";

      case "standard":
        return "Standard";

      default:
        return "Free";
    }
  };

  // ====================================================
  // DESCRIPTION DU PLAN
  // ====================================================

  const getPlanDescription = (
    selectedPlan
  ) => {
    switch (
      String(
        selectedPlan || ""
      ).toLowerCase()
    ) {
      case "premium":
        return "Accès complet à toutes les fonctionnalités de gestion ElDior Management Church.";

      case "standard":
        return "Une formule complète pour accompagner les églises en croissance.";

      default:
        return "Les fonctionnalités essentielles pour commencer la gestion numérique de votre église.";
    }
  };

  // ====================================================
  // LABEL DES FONCTIONNALITÉS
  // ====================================================

  const getFeatureLabel = (
    feature
  ) => {
    const labels = {
      dashboard:
        "Tableau de bord",

      members:
        "Gestion des membres",

      departments:
        "Gestion des départements",

      events:
        "Gestion des événements",

      attendance:
        "Gestion des présences",

      assignments:
        "Programmations",

      reports:
        "Rapports avancés",

      emailNotifications:
        "Notifications email",

      reminders:
        "Rappels automatiques",

      activityLogs:
        "Journal d'activité",

      advancedSettings:
        "Paramètres avancés",
    };

    return (
      labels[feature] ||
      "Cette fonctionnalité"
    );
  };

  // ====================================================
  // CALCUL DU POURCENTAGE
  // ====================================================

  function calculatePercentage(
    current,
    limit
  ) {
    const numericCurrent =
      Number(current || 0);

    const numericLimit =
      Number(limit || 0);

    if (
      !numericLimit ||
      numericLimit <= 0
    ) {
      return 0;
    }

    return Math.min(
      Math.round(
        (numericCurrent /
          numericLimit) *
          100
      ),
      100
    );
  }

  // ====================================================
  // NORMALISATION D'UNE RESSOURCE
  // ====================================================

  const normalizeResource = (
    usageValue,
    limitValue
  ) => {
    if (
      usageValue &&
      typeof usageValue ===
        "object" &&
      !Array.isArray(
        usageValue
      )
    ) {
      const current =
        Number(
          usageValue.current ??
            0
        );

      const unlimited =
        usageValue.unlimited ===
          true ||
        usageValue.limit ===
          null ||
        usageValue.limit ===
          -1 ||
        usageValue.limit ===
          "unlimited";

      const limit =
        unlimited
          ? null
          : usageValue.limit ??
            limitValue ??
            0;

      const percentage =
        unlimited
          ? 0
          : Number(
              usageValue.percentage ??
                calculatePercentage(
                  current,
                  limit
                )
            );

      const remaining =
        unlimited
          ? null
          : Number(
              usageValue.remaining ??
                Math.max(
                  Number(
                    limit || 0
                  ) - current,
                  0
                )
            );

      const reached =
        usageValue.reached ??
        (!unlimited &&
          Number(
            limit || 0
          ) > 0 &&
          current >=
            Number(limit));

      return {
        current,
        limit,
        unlimited,
        percentage,
        remaining,
        reached,
      };
    }

    const current =
      Number(
        usageValue || 0
      );

    const unlimited =
      limitValue === null ||
      limitValue === undefined ||
      limitValue === -1 ||
      limitValue === Infinity ||
      limitValue ===
        "unlimited";

    const limit =
      unlimited
        ? null
        : Number(
            limitValue || 0
          );

    const percentage =
      unlimited
        ? 0
        : calculatePercentage(
            current,
            limit
          );

    const remaining =
      unlimited
        ? null
        : Math.max(
            Number(
              limit || 0
            ) - current,
            0
          );

    const reached =
      !unlimited &&
      Number(
        limit || 0
      ) > 0 &&
      current >=
        Number(limit);

    return {
      current,
      limit,
      unlimited,
      percentage,
      remaining,
      reached,
    };
  };

  // ====================================================
  // RESSOURCES
  // ====================================================

  const resources =
    useMemo(() => {
      return [
        {
          key: "members",
          label: "Membres",

          description:
            "Membres enregistrés dans votre église",

          ...normalizeResource(
            usage.members ??
              usage.totalMembers ??
              0,

            limits.members ??
              limits.maxMembers
          ),
        },

        {
          key: "users",
          label:
            "Utilisateurs",

          description:
            "Administrateurs et managers",

          ...normalizeResource(
            usage.users ??
              usage.totalUsers ??
              0,

            limits.users ??
              limits.maxUsers
          ),
        },

        {
          key:
            "departments",

          label:
            "Départements",

          description:
            "Départements et équipes",

          ...normalizeResource(
            usage.departments ??
              usage.totalDepartments ??
              0,

            limits.departments ??
              limits.maxDepartments
          ),
        },

        {
          key: "events",

          label:
            "Événements",

          description:
            "Événements enregistrés",

          ...normalizeResource(
            usage.events ??
              usage.totalEvents ??
              0,

            limits.events ??
              limits.maxEvents
          ),
        },
      ];
    }, [
      usage,
      limits,
    ]);

  // ====================================================
  // FONCTIONNALITÉS
  // ====================================================

  const featureList = [
    {
      key: "dashboard",
      label:
        "Tableau de bord",
    },

    {
      key: "members",
      label:
        "Gestion des membres",
    },

    {
      key: "departments",
      label:
        "Gestion des départements",
    },

    {
      key: "events",
      label:
        "Gestion des événements",
    },

    {
      key: "attendance",
      label:
        "Gestion des présences",
    },

    {
      key: "assignments",
      label:
        "Programmations",
    },

    {
      key: "reports",
      label:
        "Rapports avancés",
    },

    {
      key:
        "emailNotifications",

      label:
        "Notifications email",
    },

    {
      key: "reminders",
      label:
        "Rappels automatiques",
    },

    {
      key: "activityLogs",
      label:
        "Journal d'activité",
    },

    {
      key:
        "advancedSettings",

      label:
        "Paramètres avancés",
    },
  ];

  // ====================================================
  // STATUT
  // ====================================================

  const subscriptionStatus =
    subscription?.status ||
    church?.status ||
    subscriptionData?.status ||
    "active";

  // ====================================================
  // ERREUR
  // ====================================================

  const errorMessage =
    contextError
      ? contextError.response
          ?.data?.message ||
        contextError.message ||
        "Impossible de charger les informations de l'abonnement."
      : "";

  // ====================================================
  // LOADING
  // ====================================================

  if (
    !initialized ||
    loading
  ) {
    return (
      <Layout>
        <div className="management-page">
          <div className="subscription-loading">
            <div className="subscription-spinner" />

            <h3>
              Chargement de votre
              abonnement
            </h3>

            <p>
              Récupération des
              informations de votre
              formule...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ====================================================
  // ERREUR
  // ====================================================

  if (
    contextError &&
    !subscriptionData
  ) {
    return (
      <Layout>
        <div className="management-page">
          <div className="subscription-error-card">
            <div className="subscription-error-icon">
              !
            </div>

            <h2>
              Impossible de charger
              l'abonnement
            </h2>

            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                refreshSubscription()
              }
            >
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <Layout>
      <div className="management-page subscription-page">

        {/* ==============================================
            ALERTE FONCTIONNALITÉ BLOQUÉE
        ============================================== */}

        {blockedFeature && (
          <div
            style={{
              marginBottom:
                "22px",

              padding:
                "18px 20px",

              borderRadius:
                "14px",

              border:
                "1px solid rgba(245, 158, 11, 0.28)",

              background:
                "rgba(245, 158, 11, 0.08)",

              display:
                "flex",

              gap:
                "14px",

              alignItems:
                "flex-start",
            }}
          >
            <div
              style={{
                width:
                  "42px",

                minWidth:
                  "42px",

                height:
                  "42px",

                borderRadius:
                  "12px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(245, 158, 11, 0.14)",

                fontSize:
                  "20px",
              }}
            >
              🔒
            </div>

            <div>
              <strong
                style={{
                  display:
                    "block",

                  marginBottom:
                    "5px",

                  fontSize:
                    "15px",
                }}
              >
                {getFeatureLabel(
                  blockedFeature
                )}{" "}
                n'est pas inclus dans
                votre formule
              </strong>

              <span
                style={{
                  fontSize:
                    "13px",

                  lineHeight:
                    1.6,
                }}
              >
                Cette fonctionnalité
                nécessite au minimum
                le plan{" "}

                <strong>
                  {requiredPlan}
                </strong>

                . Votre plan actuel
                est{" "}

                <strong>
                  {getPlanLabel(
                    currentPlan
                  )}
                </strong>
                .
              </span>
            </div>
          </div>
        )}

        {/* ==============================================
            HEADER
        ============================================== */}

        <div className="page-header">
          <div className="page-header-left">
            <div className="subscription-eyebrow">
              ABONNEMENT
            </div>

            <h1 className="page-title">
              Votre abonnement
            </h1>

            <p className="page-subtitle">
              Consultez votre formule,
              vos limites et les
              fonctionnalités
              accessibles.
            </p>
          </div>

          <div
            className={
              `subscription-plan-badge ` +
              `subscription-plan-${currentPlan}`
            }
          >
            {getPlanLabel(
              currentPlan
            )}
          </div>
        </div>

        {/* ==============================================
            HERO
        ============================================== */}

        <div
          className={
            `subscription-hero ` +
            `subscription-hero-${currentPlan}`
          }
        >
          <div className="subscription-hero-content">
            <div className="subscription-hero-label">
              PLAN ACTUEL
            </div>

            <h2>
              {getPlanLabel(
                currentPlan
              )}
            </h2>

            <p>
              {getPlanDescription(
                currentPlan
              )}
            </p>

            <div className="subscription-church">
              {church?.name ||
                "ElDior Management Church"}
            </div>
          </div>

          <div className="subscription-status">
            <span />

            {subscriptionStatus ===
            "active"
              ? "Abonnement actif"
              : subscriptionStatus}
          </div>
        </div>

        {/* ==============================================
            UTILISATION
        ============================================== */}

        <section className="subscription-section">
          <div className="subscription-section-header">
            <h2>
              Utilisation de votre
              formule
            </h2>

            <p>
              Suivez les ressources
              utilisées par votre
              église.
            </p>
          </div>

          <div className="subscription-resource-grid">
            {resources.map(
              (resource) => (
                <div
                  key={
                    resource.key
                  }
                  className={
                    `subscription-resource-card ` +
                    (resource.reached
                      ? "subscription-resource-reached"
                      : "")
                  }
                >
                  <div className="subscription-resource-header">
                    <div>
                      <h3>
                        {
                          resource.label
                        }
                      </h3>

                      <p>
                        {
                          resource.description
                        }
                      </p>
                    </div>

                    <div className="subscription-resource-value">
                      <strong>
                        {
                          resource.current
                        }
                      </strong>

                      <span>
                        {" / "}

                        {resource.unlimited
                          ? "Illimité"
                          : resource.limit}
                      </span>
                    </div>
                  </div>

                  {resource.unlimited ? (
                    <div className="subscription-unlimited">
                      ✓ Utilisation
                      illimitée
                    </div>
                  ) : (
                    <>
                      <div className="subscription-progress">
                        <div
                          className={
                            `subscription-progress-value ` +
                            (resource.reached
                              ? "subscription-progress-danger"
                              : "")
                          }
                          style={{
                            width: `${Math.min(
                              Number(
                                resource.percentage ||
                                  0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="subscription-progress-info">
                        <span>
                          {
                            resource.percentage
                          }
                          % utilisé
                        </span>

                        <span>
                          {
                            resource.remaining
                          }{" "}
                          restant
                        </span>
                      </div>

                      {resource.reached && (
                        <div className="subscription-limit-warning">
                          Limite du plan
                          atteinte
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        {/* ==============================================
            FONCTIONNALITÉS
        ============================================== */}

        <section className="subscription-section">
          <div className="management-card subscription-features-card">
            <div className="subscription-features-header">
              <h2>
                Fonctionnalités
              </h2>

              <p>
                Modules disponibles
                avec votre formule
                actuelle.
              </p>
            </div>

            <div className="subscription-features-grid">
              {featureList.map(
                (feature) => {
                  const enabled =
                    features?.[
                      feature.key
                    ] === true;

                  return (
                    <div
                      key={
                        feature.key
                      }
                      className={
                        `subscription-feature ` +
                        (enabled
                          ? "enabled"
                          : "disabled")
                      }
                    >
                      <div className="subscription-feature-icon">
                        {enabled
                          ? "✓"
                          : "×"}
                      </div>

                      <div>
                        <strong>
                          {
                            feature.label
                          }
                        </strong>

                        <span>
                          {enabled
                            ? "Disponible"
                            : "Non inclus"}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ==============================================
            FORMULES
        ============================================== */}

        <section className="subscription-section">
          <div className="subscription-section-header">
            <h2>
              Les formules ElDior
            </h2>

            <p>
              Des offres adaptées à
              la croissance de votre
              église.
            </p>
          </div>

          <div className="subscription-plans-grid">

            {/* FREE */}

            <div
              className={
                `subscription-plan-card ` +
                (currentPlan ===
                "free"
                  ? "current"
                  : "")
              }
            >
              <div className="subscription-plan-top">
                <span className="subscription-plan-name">
                  FREE
                </span>

                {currentPlan ===
                  "free" && (
                  <span className="subscription-current">
                    Plan actuel
                  </span>
                )}
              </div>

              <h3>
                Gratuit
              </h3>

              <p>
                Pour commencer
                simplement la gestion
                numérique de votre
                église.
              </p>

              <ul>
                <li>
                  ✓ 50 membres
                </li>

                <li>
                  ✓ 2 utilisateurs
                </li>

                <li>
                  ✓ 5 départements
                </li>

                <li>
                  ✓ 10 événements
                </li>

                <li>
                  ✓ Présences
                </li>

                <li className="disabled-item">
                  × Programmations
                </li>

                <li className="disabled-item">
                  × Rapports avancés
                </li>

                <li className="disabled-item">
                  × Notifications email
                </li>
              </ul>
            </div>

            {/* STANDARD */}

            <div
              className={
                `subscription-plan-card ` +
                (currentPlan ===
                "standard"
                  ? "current"
                  : "")
              }
            >
              <div className="subscription-plan-top">
                <span className="subscription-plan-name">
                  STANDARD
                </span>

                {currentPlan ===
                  "standard" && (
                  <span className="subscription-current">
                    Plan actuel
                  </span>
                )}
              </div>

              <h3>
                Standard
              </h3>

              <p>
                Pour les églises en
                croissance qui ont
                besoin de plus de
                capacité.
              </p>

              <ul>
                <li>
                  ✓ 300 membres
                </li>

                <li>
                  ✓ 5 utilisateurs
                </li>

                <li>
                  ✓ 20 départements
                </li>

                <li>
                  ✓ 100 événements
                </li>

                <li>
                  ✓ Programmations
                </li>

                <li>
                  ✓ Rapports avancés
                </li>

                <li>
                  ✓ Notifications email
                </li>

                <li className="disabled-item">
                  × Rappels automatiques
                </li>

                <li className="disabled-item">
                  × Journal d'activité
                </li>
              </ul>
            </div>

            {/* PREMIUM */}

            <div
              className={
                `subscription-plan-card premium ` +
                (currentPlan ===
                "premium"
                  ? "current"
                  : "")
              }
            >
              <div className="subscription-plan-top">
                <span className="subscription-plan-name">
                  PREMIUM
                </span>

                {currentPlan ===
                  "premium" && (
                  <span className="subscription-current">
                    Plan actuel
                  </span>
                )}
              </div>

              <h3>
                Premium
              </h3>

              <p>
                Une gestion complète
                et professionnelle
                sans limite.
              </p>

              <ul>
                <li>
                  ✓ Membres illimités
                </li>

                <li>
                  ✓ Utilisateurs
                  illimités
                </li>

                <li>
                  ✓ Départements
                  illimités
                </li>

                <li>
                  ✓ Événements
                  illimités
                </li>

                <li>
                  ✓ Programmations
                </li>

                <li>
                  ✓ Rapports avancés
                </li>

                <li>
                  ✓ Notifications email
                </li>

                <li>
                  ✓ Rappels automatiques
                </li>

                <li>
                  ✓ Journal d'activité
                </li>

                <li>
                  ✓ Paramètres avancés
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}