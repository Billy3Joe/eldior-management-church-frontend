import axios from "axios";

// ======================================================
// INSTANCE AXIOS
// ======================================================

const API = axios.create({
  baseURL: "http://localhost:8000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// INTERCEPTEUR REQUÊTES
//
// Ajoute automatiquement le JWT aux requêtes protégées.
// ======================================================

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(
      error
    );
  }
);

// ======================================================
// INTERCEPTEUR RÉPONSES
// ======================================================

API.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url || "";

    // ==================================================
    // REQUÊTES D'AUTHENTIFICATION
    //
    // Une erreur 401 pendant la connexion ne doit pas
    // supprimer une éventuelle session existante.
    // ==================================================

    const isAuthRequest =
      requestUrl.includes(
        "/auth/login"
      ) ||
      requestUrl.includes(
        "/auth/register"
      ) ||
      requestUrl.includes(
        "/auth/register-church"
      );

    // ==================================================
    // TOKEN EXPIRÉ / INVALIDE
    // ==================================================

    if (
      status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "admin"
      );

      sessionStorage.removeItem(
        "subscriptionBlockedFeature"
      );

      sessionStorage.removeItem(
        "subscriptionRequiredPlan"
      );

      // On évite d'utiliser React Router ici,
      // car Axios est en dehors des composants React.
      //
      // PrivateRoute prendra ensuite en charge
      // la redirection vers la connexion.
    }

    return Promise.reject(
      error
    );
  }
);

export default API;