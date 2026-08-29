import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import API from "../api/axios";

import "./Login.css";

export default function Login() {
  const navigate =
    useNavigate();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    email: "",
    password: "",
  });

  // ======================================================
  // CHANGEMENT DES CHAMPS
  // ======================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,

        [name]:
          value,
      })
    );
  };

  // ======================================================
  // CONNEXION
  // ======================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      // ==================================================
      // VALIDATION
      // ==================================================

      if (
        !form.email.trim() ||
        !form.password
      ) {
        toast.error(
          "Veuillez saisir votre email et votre mot de passe"
        );

        return;
      }

      try {
        setLoading(true);

        // ==================================================
        // REQUÊTE API
        // ==================================================

        const response =
          await API.post(
            "/auth/login",
            {
              email:
                form.email
                  .trim()
                  .toLowerCase(),

              password:
                form.password,
            }
          );

        // ==================================================
        // RÉPONSE BACKEND
        //
        // authController renvoie :
        //
        // {
        //   success: true,
        //   message: "...",
        //   token: "...",
        //   user: {...}
        // }
        // ==================================================

        const token =
          response.data
            ?.token;

        const user =
          response.data
            ?.user;

        // ==================================================
        // VÉRIFICATION
        // ==================================================

        if (
          !token ||
          !user
        ) {
          console.error(
            "Réponse API reçue :",
            response.data
          );

          throw new Error(
            "Réponse de connexion invalide"
          );
        }

        // ==================================================
        // SAUVEGARDE DU JWT
        // ==================================================

        localStorage.setItem(
          "token",
          token
        );

        // ==================================================
        // SAUVEGARDE DE L'UTILISATEUR
        // ==================================================

        localStorage.setItem(
          "admin",
          JSON.stringify(
            user
          )
        );

        // ==================================================
        // DEBUG TEMPORAIRE
        // ==================================================

        console.log(
          "✅ Utilisateur connecté :",
          user
        );

        console.log(
          "🛡️ Platform role :",
          user.platformRole
        );

        console.log(
          "⛪ Church role :",
          user.role
        );

        // ==================================================
        // MESSAGE
        // ==================================================

        toast.success(
          response.data
            ?.message ||
            "Connexion réussie"
        );

        // ==================================================
        // REDIRECTION
        //
        // SUPER ADMIN
        // → espace propriétaire
        //
        // ADMIN / MANAGER
        // → dashboard de l'église
        // ==================================================

        if (
          user.platformRole ===
          "superadmin"
        ) {
          navigate(
            "/platform",
            {
              replace: true,
            }
          );

          return;
        }

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "❌ Erreur login :",
          error
        );

        console.error(
          "Réponse backend :",
          error.response
            ?.data
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
            error.message ||
            "Impossible de vous connecter"
        );
      } finally {
        setLoading(false);
      }
    };

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <div className="login-page">

      {/* ==================================================
          COLONNE GAUCHE
      ================================================== */}

      <section className="login-brand-panel">

        <div className="login-brand-content">

          {/* LOGO */}

          <div className="login-brand-logo">
            E
          </div>

          <div className="login-brand-name">
            ElDior
          </div>

          <div className="login-brand-subname">
            Management Church
          </div>

          {/* TITRE */}

          <h1 className="login-brand-title">
            Gérez votre église
            simplement.
          </h1>

          <p className="login-brand-description">
            Membres, départements,
            événements, présences,
            programmations et rapports
            dans un seul espace.
          </p>

          {/* FEATURES */}

          <div className="login-features">

            <div className="login-feature">

              <div className="login-feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  Gestion centralisée
                </strong>

                <span>
                  Retrouvez toutes les
                  informations de votre
                  église au même endroit.
                </span>
              </div>

            </div>

            <div className="login-feature">

              <div className="login-feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  Organisation des équipes
                </strong>

                <span>
                  Programmez vos membres
                  et suivez leurs réponses.
                </span>
              </div>

            </div>

            <div className="login-feature">

              <div className="login-feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  Analyse et rapports
                </strong>

                <span>
                  Suivez votre activité
                  grâce aux statistiques
                  et rapports.
                </span>
              </div>

            </div>

          </div>
        </div>

        <div className="login-brand-footer">
          ©{" "}
          {new Date().getFullYear()}{" "}
          ElDior Management Church
        </div>

      </section>

      {/* ==================================================
          COLONNE DROITE
      ================================================== */}

      <main className="login-main">

        <div className="login-card">

          {/* ==================================================
              MOBILE BRAND
          ================================================== */}

          <div className="login-mobile-brand">

            <div className="login-mobile-logo">
              E
            </div>

            <div>

              <div className="login-mobile-title">
                ElDior
              </div>

              <div className="login-mobile-subtitle">
                Management Church
              </div>

            </div>
          </div>

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="login-card-header">

            <div className="login-eyebrow">
              ESPACE DE GESTION
            </div>

            <h2>
              Bon retour 👋
            </h2>

            <p>
              Connectez-vous pour accéder
              à votre espace d'administration.
            </p>

          </div>

          {/* ==================================================
              FORMULAIRE
          ================================================== */}

          <form
            className="login-form"
            onSubmit={
              handleSubmit
            }
          >

            {/* EMAIL */}

            <div className="login-field">

              <label htmlFor="email">
                Adresse email
              </label>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  required
                  autoComplete="email"
                  placeholder="vous@eglise.fr"
                />

              </div>
            </div>

            {/* PASSWORD */}

            <div className="login-field">

              <div className="login-label-row">

                <label htmlFor="password">
                  Mot de passe
                </label>

              </div>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁"}
                </button>

              </div>
            </div>

            {/* ==================================================
                BOUTON CONNEXION
            ================================================== */}

            <button
              type="submit"
              className="login-submit"
              disabled={
                loading
              }
            >

              {loading && (
                <span className="login-button-spinner" />
              )}

              {loading
                ? "Connexion en cours..."
                : "Se connecter"}

            </button>

          </form>

          {/* ==================================================
              SÉPARATEUR
          ================================================== */}

          <div className="login-divider">
            <span>
              ou
            </span>
          </div>

          {/* ==================================================
              CRÉATION ÉGLISE
          ================================================== */}

          <div className="login-register">

            <div className="login-register-text">

              <strong>
                Nouvelle église ?
              </strong>

              <span>
                Créez votre espace de
                gestion en quelques
                instants.
              </span>

            </div>

            <Link
              to="/register-church"
              className="login-register-button"
            >
              Créer mon église
            </Link>

            <div className="login-free-plan">

              <span>
                ✓
              </span>

              Démarrage avec l'offre Free

            </div>

          </div>

          {/* ==================================================
              SÉCURITÉ
          ================================================== */}

          <div className="login-security">

            <span>
              🔒
            </span>

            Connexion sécurisée à votre
            espace ElDior Management Church

          </div>

        </div>
      </main>
    </div>
  );
}