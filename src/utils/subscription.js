// ======================================================
// ELDIOR MANAGEMENT CHURCH
// Gestion frontend des abonnements et fonctionnalités
// ======================================================

export const PLAN_CONFIG = {
  free: {
    key: "free",
    name: "Free",

    limits: {
      members: 50,
      users: 2,
      departments: 5,
      events: 10,
    },

    features: {
      dashboard: true,
      members: true,
      departments: true,
      events: true,
      attendance: true,
      assignments: false,
      reports: false,
      emailNotifications: false,
      reminders: false,
      activityLogs: false,
      advancedSettings: false,
    },
  },

  standard: {
    key: "standard",
    name: "Standard",

    limits: {
      members: 300,
      users: 5,
      departments: 20,
      events: 100,
    },

    features: {
      dashboard: true,
      members: true,
      departments: true,
      events: true,
      attendance: true,
      assignments: true,
      reports: true,
      emailNotifications: true,
      reminders: false,
      activityLogs: false,
      advancedSettings: true,
    },
  },

  premium: {
    key: "premium",
    name: "Premium",

    limits: {
      members: null,
      users: null,
      departments: null,
      events: null,
    },

    features: {
      dashboard: true,
      members: true,
      departments: true,
      events: true,
      attendance: true,
      assignments: true,
      reports: true,
      emailNotifications: true,
      reminders: true,
      activityLogs: true,
      advancedSettings: true,
    },
  },
};

// ======================================================
// NORMALISATION DU PLAN
// ======================================================

export const normalizePlan = (plan) => {
  const normalized = String(
    plan || "free"
  )
    .trim()
    .toLowerCase();

  if (PLAN_CONFIG[normalized]) {
    return normalized;
  }

  return "free";
};

// ======================================================
// CONFIGURATION COMPLÈTE DU PLAN
// ======================================================

export const getPlanConfig = (plan) => {
  const normalizedPlan =
    normalizePlan(plan);

  return PLAN_CONFIG[
    normalizedPlan
  ];
};

// ======================================================
// NOM DU PLAN
// ======================================================

export const getPlanName = (plan) => {
  return getPlanConfig(plan).name;
};

// ======================================================
// VÉRIFICATION D'UNE FONCTIONNALITÉ
// ======================================================

export const hasFeature = (
  plan,
  feature
) => {
  const config =
    getPlanConfig(plan);

  return (
    config?.features?.[
      feature
    ] === true
  );
};

// ======================================================
// RÉCUPÉRATION D'UNE LIMITE
// null = illimité
// ======================================================

export const getPlanLimit = (
  plan,
  resource
) => {
  const config =
    getPlanConfig(plan);

  return config?.limits?.[
    resource
  ];
};

// ======================================================
// SAVOIR SI UNE RESSOURCE EST ILLIMITÉE
// ======================================================

export const isUnlimited = (
  plan,
  resource
) => {
  return (
    getPlanLimit(
      plan,
      resource
    ) === null
  );
};

// ======================================================
// NOMBRE RESTANT
// ======================================================

export const getRemaining = (
  plan,
  resource,
  current = 0
) => {
  const limit =
    getPlanLimit(
      plan,
      resource
    );

  if (limit === null) {
    return null;
  }

  const remaining =
    Number(limit) -
    Number(current || 0);

  return Math.max(
    remaining,
    0
  );
};

// ======================================================
// VÉRIFIER SI LA LIMITE EST ATTEINTE
// ======================================================

export const hasReachedLimit = (
  plan,
  resource,
  current = 0
) => {
  const limit =
    getPlanLimit(
      plan,
      resource
    );

  if (limit === null) {
    return false;
  }

  return (
    Number(current || 0) >=
    Number(limit)
  );
};

// ======================================================
// TEXTE D'AFFICHAGE D'UNE LIMITE
// ======================================================

export const formatLimit = (
  plan,
  resource
) => {
  const limit =
    getPlanLimit(
      plan,
      resource
    );

  if (limit === null) {
    return "Illimité";
  }

  return String(limit);
};

// ======================================================
// NIVEAU DU PLAN
// ======================================================

export const PLAN_LEVELS = {
  free: 1,
  standard: 2,
  premium: 3,
};

export const getPlanLevel = (
  plan
) => {
  const normalizedPlan =
    normalizePlan(plan);

  return (
    PLAN_LEVELS[
      normalizedPlan
    ] || 1
  );
};

// ======================================================
// VÉRIFIER SI LE PLAN EST AU MOINS D'UN CERTAIN NIVEAU
// ======================================================

export const isPlanAtLeast = (
  currentPlan,
  requiredPlan
) => {
  return (
    getPlanLevel(
      currentPlan
    ) >=
    getPlanLevel(
      requiredPlan
    )
  );
};

// ======================================================
// PLAN MINIMUM POUR UNE FONCTIONNALITÉ
// ======================================================

export const FEATURE_REQUIRED_PLAN = {
  dashboard: "free",
  members: "free",
  departments: "free",
  events: "free",
  attendance: "free",

  assignments: "standard",
  reports: "standard",
  emailNotifications:
    "standard",
  advancedSettings:
    "standard",

  reminders: "premium",
  activityLogs: "premium",
};

// ======================================================
// RÉCUPÉRER LE PLAN MINIMUM POUR UNE FONCTIONNALITÉ
// ======================================================

export const getRequiredPlan = (
  feature
) => {
  return (
    FEATURE_REQUIRED_PLAN[
      feature
    ] || "free"
  );
};

// ======================================================
// LABEL POUR L'INTERFACE
// ======================================================

export const getRequiredPlanLabel = (
  feature
) => {
  const requiredPlan =
    getRequiredPlan(
      feature
    );

  return getPlanName(
    requiredPlan
  );
};