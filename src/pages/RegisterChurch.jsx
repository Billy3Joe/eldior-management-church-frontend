import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import API from "../api/axios";

export default function RegisterChurch() {
  const navigate =
    useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] =
    useState({
      churchName: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      city: "",
      country: "France",
    });

  // ======================================================
  // CHAMPS
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
        [name]: value,
      })
    );

    setError("");
    setSuccess("");
  };

  // ======================================================
  // SOUMISSION
  // ======================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      // ==================================================
      // VALIDATION
      // ==================================================

      if (
        !form.churchName.trim() ||
        !form.name.trim() ||
        !form.email.trim() ||
        !form.password ||
        !form.confirmPassword
      ) {
        setError(
          "Veuillez remplir tous les champs obligatoires."
        );

        return;
      }

      if (
        form.password.length <
        6
      ) {
        setError(
          "Le mot de passe doit contenir au moins 6 caractères."
        );

        return;
      }

      if (
        form.password !==
        form.confirmPassword
      ) {
        setError(
          "Les deux mots de passe ne correspondent pas."
        );

        return;
      }

      try {
        setLoading(true);

        console.log(
          "=================================="
        );

        console.log(
          "⏳ ENVOI CRÉATION ÉGLISE"
        );

        console.log(
          "Email :",
          form.email
        );

        // ==================================================
        // REQUÊTE
        // ==================================================

        const response =
          await API.post(
            "/auth/register-church",
            {
              churchName:
                form.churchName.trim(),

              name:
                form.name.trim(),

              email:
                form.email
                  .trim()
                  .toLowerCase(),

              password:
                form.password,

              phone:
                form.phone.trim(),

              city:
                form.city.trim(),

              country:
                form.country.trim() ||
                "France",
            }
          );

        console.log(
          "✅ RÉPONSE SERVEUR :",
          response.data
        );

        // ==================================================
        // COMPATIBILITÉ AVEC LES DEUX FORMATS
        // ==================================================

        const token =
          response.data?.token;

        const user =
          response.data?.user ||
          response.data?.data;

        // ==================================================
        // RÉPONSE INCOMPLÈTE
        // ==================================================

        if (!token) {
          setError(
            "L'église semble avoir été créée, mais aucun token de connexion n'a été retourné par le serveur."
          );

          console.error(
            "❌ Token absent",
            response.data
          );

          return;
        }

        if (!user) {
          setError(
            "Le serveur n'a pas retourné les informations de l'administrateur."
          );

          console.error(
            "❌ Utilisateur absent",
            response.data
          );

          return;
        }

        // ==================================================
        // SESSION
        // ==================================================

        localStorage.setItem(
          "token",
          token
        );

        localStorage.setItem(
          "admin",
          JSON.stringify(
            user
          )
        );

        console.log(
          "✅ Utilisateur enregistré :",
          user
        );

        // ==================================================
        // SUCCÈS
        // ==================================================

        setSuccess(
          response.data
            ?.message ||
            "Votre église a été créée avec succès."
        );

        // Petit délai pour voir le message
        setTimeout(() => {
          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );
        }, 800);
      } catch (err) {
        console.error(
          "=================================="
        );

        console.error(
          "❌ ERREUR CRÉATION ÉGLISE"
        );

        console.error(
          "Erreur complète :",
          err
        );

        console.error(
          "Status :",
          err.response?.status
        );

        console.error(
          "Réponse :",
          err.response?.data
        );

        console.error(
          "URL :",
          err.config?.url
        );

        // ==================================================
        // ERREUR SERVEUR
        // ==================================================

        if (
          err.response
            ?.data
            ?.message
        ) {
          setError(
            err.response.data
              .message
          );

          return;
        }

        // ==================================================
        // ROUTE ABSENTE
        // ==================================================

        if (
          err.response?.status ===
          404
        ) {
          setError(
            "La route /api/auth/register-church n'existe pas actuellement sur le backend."
          );

          return;
        }

        // ==================================================
        // SERVEUR INACCESSIBLE
        // ==================================================

        if (!err.response) {
          setError(
            "Impossible de contacter le serveur backend sur http://localhost:8000."
          );

          return;
        }

        setError(
          err.message ||
            "Impossible de créer l'église."
        );
      } finally {
        setLoading(false);
      }
    };

  // ======================================================
  // STYLES
  // ======================================================

  const fieldStyle = {
    marginBottom: 18,
  };

  const labelStyle = {
    display: "block",
    marginBottom: 7,
    fontWeight: 700,
    color: "#111827",
    fontSize: 15,
  };

  const inputStyle = {
    width: "100%",
    height: 52,
    padding: "0 16px",
    border:
      "1px solid #d1d5db",
    borderRadius: 10,
    boxSizing: "border-box",
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
  };

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#f3f4f6",
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        padding:
          "30px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#fff",
          borderRadius: 22,
          padding: 38,
          boxSizing:
            "border-box",
          boxShadow:
            "0 12px 35px rgba(15,23,42,0.08)",
        }}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            textAlign:
              "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              margin:
                "0 auto 14px",
              borderRadius: 16,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "#111827",
              color: "#fff",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            E
          </div>

          <h1
            style={{
              margin:
                "0 0 7px",
              color:
                "#0f172a",
            }}
          >
            Créer mon église
          </h1>

          <p
            style={{
              margin: 0,
              color:
                "#64748b",
            }}
          >
            Créez votre espace
            ElDior Management
            Church
          </p>
        </div>

        {/* ==================================================
            PLAN
        ================================================== */}

        <div
          style={{
            padding: 16,
            marginBottom: 25,
            borderRadius: 12,
            background:
              "#eef2ff",
            border:
              "1px solid #c7d2fe",
          }}
        >
          <strong>
            Offre de démarrage :
            Free
          </strong>

          <div
            style={{
              marginTop: 4,
              color:
                "#64748b",
              fontSize: 13,
            }}
          >
            L'église démarre automatiquement avec l'offre gratuite.
          </div>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
        >
          {/* NOM EGLISE */}

          <div style={fieldStyle}>
            <label
              htmlFor="churchName"
              style={labelStyle}
            >
              Nom de l'église *
            </label>

            <input
              id="churchName"
              name="churchName"
              value={
                form.churchName
              }
              onChange={
                handleChange
              }
              required
              placeholder="Ex. CIEL"
              style={
                inputStyle
              }
            />
          </div>

          {/* RESPONSABLE */}

          <div style={fieldStyle}>
            <label
              htmlFor="name"
              style={labelStyle}
            >
              Nom du responsable *
            </label>

            <input
              id="name"
              name="name"
              value={
                form.name
              }
              onChange={
                handleChange
              }
              required
              placeholder="Ex. Pasteur Jean Dupont"
              style={
                inputStyle
              }
            />
          </div>

          {/* EMAIL */}

          <div style={fieldStyle}>
            <label
              htmlFor="email"
              style={labelStyle}
            >
              Adresse email *
            </label>

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
              placeholder="responsable@eglise.fr"
              style={
                inputStyle
              }
            />
          </div>

          {/* PASSWORD */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <div>
              <label
                htmlFor="password"
                style={labelStyle}
              >
                Mot de passe *
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                minLength={6}
                required
                style={
                  inputStyle
                }
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                style={labelStyle}
              >
                Confirmer *
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={
                  form.confirmPassword
                }
                onChange={
                  handleChange
                }
                minLength={6}
                required
                style={
                  inputStyle
                }
              />
            </div>
          </div>

          {/* PHONE CITY */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <div>
              <label
                htmlFor="phone"
                style={labelStyle}
              >
                Téléphone
              </label>

              <input
                id="phone"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
                style={
                  inputStyle
                }
              />
            </div>

            <div>
              <label
                htmlFor="city"
                style={labelStyle}
              >
                Ville
              </label>

              <input
                id="city"
                name="city"
                value={
                  form.city
                }
                onChange={
                  handleChange
                }
                style={
                  inputStyle
                }
              />
            </div>
          </div>

          {/* COUNTRY */}

          <div style={fieldStyle}>
            <label
              htmlFor="country"
              style={labelStyle}
            >
              Pays
            </label>

            <input
              id="country"
              name="country"
              value={
                form.country
              }
              onChange={
                handleChange
              }
              style={
                inputStyle
              }
            />
          </div>

          {/* ==================================================
              ERREUR VISIBLE
          ================================================== */}

          {error && (
            <div
              style={{
                marginBottom: 18,
                padding:
                  "14px 16px",
                borderRadius: 10,
                background:
                  "#fef2f2",
                border:
                  "1px solid #fecaca",
                color:
                  "#b91c1c",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* ==================================================
              SUCCÈS VISIBLE
          ================================================== */}

          {success && (
            <div
              style={{
                marginBottom: 18,
                padding:
                  "14px 16px",
                borderRadius: 10,
                background:
                  "#f0fdf4",
                border:
                  "1px solid #bbf7d0",
                color:
                  "#15803d",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ✅ {success}
            </div>
          )}

          {/* ==================================================
              SUBMIT
          ================================================== */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 56,
              border: "none",
              borderRadius: 11,
              background:
                loading
                  ? "#64748b"
                  : "#111827",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 800,
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Création en cours..."
              : "Créer mon église"}
          </button>
        </form>

        {/* ==================================================
            LOGIN
        ================================================== */}

        <div
          style={{
            marginTop: 23,
            textAlign:
              "center",
            color:
              "#64748b",
          }}
        >
          Vous avez déjà un
          compte ?{" "}

          <Link
            to="/login"
            style={{
              color:
                "#4f46e5",
              fontWeight: 800,
            }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}