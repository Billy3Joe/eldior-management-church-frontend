import axios from "axios";

// ======================================================
// INSTANCE AXIOS
// ======================================================

const API = axios.create({
  baseURL: "http://localhost:8000/api",

  headers: {
    "Content-Type":
      "application/json",
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
    // ==================================================
    // TOKEN EXPIRE / NON AUTORISÉ
    //
    // On ne déconnecte pas automatiquement sur /auth/login,
    // sinon une erreur de mot de passe viderait inutilement
    // la session.
    // ==================================================

    const isLoginRequest =
      error.config?.url?.includes(
        "/auth/login"
      );

    if (
      error.response?.status ===
        401 &&
      !isLoginRequest
    ) {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "admin"
      );
    }

    return Promise.reject(
      error
    );
  }
);

export default API;