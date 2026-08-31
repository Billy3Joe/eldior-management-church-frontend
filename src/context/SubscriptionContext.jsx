import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import API from "../api/axios";
import { getCurrentAdmin } from "../utils/auth";

import {
  getPlanConfig,
  normalizePlan,
} from "../utils/subscription";

// ======================================================
// CONTEXTE
// ======================================================

const SubscriptionContext = createContext(null);

// ======================================================
// EXTRACTION DU PLAN DEPUIS LA RÉPONSE BACKEND
// ======================================================

const extractPlanFromResponse = (responseData) => {
  const candidates = [
    responseData?.plan,
    responseData?.subscription?.plan,
    responseData?.church?.plan,
    responseData?.data?.plan,
    responseData?.data?.subscription?.plan,
    responseData?.data?.church?.plan,
  ];

  const foundPlan = candidates.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );

  return normalizePlan(foundPlan || "free");
};

// ======================================================
// EXTRACTION DE L'ÉGLISE
// ======================================================

const extractChurchFromResponse = (responseData) => {
  return (
    responseData?.church ||
    responseData?.subscription?.church ||
    responseData?.data?.church ||
    responseData?.data?.subscription?.church ||
    null
  );
};

// ======================================================
// PROVIDER
// ======================================================

export function SubscriptionProvider({ children }) {
  const storedUser = getCurrentAdmin();

  const initialPlan = normalizePlan(
    storedUser?.church?.plan || "free"
  );

  const [plan, setPlan] = useState(initialPlan);

  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [initialized, setInitialized] =
    useState(false);

  const [error, setError] =
    useState(null);

  // ====================================================
  // MISE À JOUR DU PLAN DANS LE LOCALSTORAGE
  // ====================================================

  const updateStoredUserPlan = useCallback(
    (nextPlan, churchData = null) => {
      try {
        const currentStoredUser =
          getCurrentAdmin();

        if (!currentStoredUser) {
          return;
        }

        const currentChurch =
          currentStoredUser.church &&
          typeof currentStoredUser.church === "object"
            ? currentStoredUser.church
            : {};

        const updatedChurch = {
          ...currentChurch,
          ...(churchData || {}),
          plan: nextPlan,
        };

        const updatedUser = {
          ...currentStoredUser,
          church: updatedChurch,
        };

        localStorage.setItem(
          "admin",
          JSON.stringify(updatedUser)
        );
      } catch (storageError) {
        console.error(
          "Impossible de synchroniser le plan dans localStorage :",
          storageError
        );
      }
    },
    []
  );

  // ====================================================
  // CHARGEMENT DE L'ABONNEMENT
  // ====================================================

  const refreshSubscription = useCallback(
    async ({ silent = false } = {}) => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setSubscription(null);
        setPlan("free");
        setInitialized(true);
        setLoading(false);
        setError(null);

        return null;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        setError(null);

        const response =
          await API.get("/subscription/me");

        const responseData =
          response.data;

        const nextPlan =
          extractPlanFromResponse(responseData);

        const churchData =
          extractChurchFromResponse(responseData);

        setPlan(nextPlan);
        setSubscription(responseData);

        updateStoredUserPlan(
          nextPlan,
          churchData
        );

        return responseData;
      } catch (requestError) {
        console.error(
          "Erreur synchronisation abonnement :",
          requestError
        );

        setError(requestError);

        const currentUser =
          getCurrentAdmin();

        const fallbackPlan =
          normalizePlan(
            currentUser?.church?.plan ||
              initialPlan ||
              "free"
          );

        setPlan(fallbackPlan);

        return null;
      } finally {
        setInitialized(true);

        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      initialPlan,
      updateStoredUserPlan,
    ]
  );

  // ====================================================
  // PREMIER CHARGEMENT
  // ====================================================

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // ====================================================
  // SYNCHRONISATION AUTOMATIQUE
  // ====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return undefined;
    }

    const handleFocus = () => {
      refreshSubscription({
        silent: true,
      });
    };

    const handleVisibility = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshSubscription({
          silent: true,
        });
      }
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    const interval =
      window.setInterval(() => {
        refreshSubscription({
          silent: true,
        });
      }, 60000);

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      window.clearInterval(interval);
    };
  }, [refreshSubscription]);

  // ====================================================
  // CONFIGURATION DU PLAN
  // ====================================================

  const planConfig = useMemo(
    () => getPlanConfig(plan),
    [plan]
  );

  // ====================================================
  // VALEUR FOURNIE À L'APPLICATION
  // ====================================================

  const value = useMemo(
    () => ({
      plan,
      planConfig,
      subscription,
      loading,
      initialized,
      error,
      refreshSubscription,
    }),
    [
      plan,
      planConfig,
      subscription,
      loading,
      initialized,
      error,
      refreshSubscription,
    ]
  );

  return (
    <SubscriptionContext.Provider
      value={value}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ======================================================
// HOOK
// ======================================================

export function useSubscription() {
  const context = useContext(
    SubscriptionContext
  );

  if (!context) {
    throw new Error(
      "useSubscription doit être utilisé dans SubscriptionProvider"
    );
  }

  return context;
}