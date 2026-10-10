import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import API from "../../api/axios";
import Layout from "../../components/Layout";

import {
  CURRENCIES,
  formatCurrency,
} from "../../constants/currencies";

import "../../styles/ManagementPages.css";

// ======================================================
// TYPES DE COMPTES
// ======================================================

const ACCOUNT_TYPES = [
  {
    value: "cash",
    label: "Caisse",
    icon: "💵",
  },
  {
    value: "bank",
    label: "Compte bancaire",
    icon: "🏦",
  },
  {
    value: "mobile_money",
    label: "Mobile Money",
    icon: "📱",
  },
  {
    value: "card",
    label: "Carte",
    icon: "💳",
  },
  {
    value: "online",
    label: "Compte en ligne",
    icon: "🌐",
  },
  {
    value: "other",
    label: "Autre",
    icon: "💰",
  },
];

// ======================================================
// FORMULAIRE INITIAL
// ======================================================

const createInitialForm = (
  currency = "EUR"
) => ({
  name: "",
  type: "cash",
  currency,
  openingBalance: "",
  description: "",
});

// ======================================================
// HELPERS
// ======================================================

const extractAccounts = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.accounts)) {
    return data.accounts;
  }

  return [];
};

const normalizeCurrency = (
  currency
) => {
  const code = String(
    currency || "EUR"
  )
    .trim()
    .toUpperCase();

  const exists = CURRENCIES.some(
    (item) =>
      item.code === code
  );

  return exists ? code : "EUR";
};

// ======================================================
// PAGE
// ======================================================

export default function FinanceAccounts() {
  const [accounts, setAccounts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [error, setError] =
    useState("");

  // ====================================================
  // DEVISE PRINCIPALE DE L'ÉGLISE
  // ====================================================

  const [
    defaultCurrency,
    setDefaultCurrency,
  ] = useState("EUR");

  const [form, setForm] =
    useState(() =>
      createInitialForm("EUR")
    );

  // ======================================================
  // CHARGEMENT
  // ======================================================

  const fetchData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          accountsResponse,
          settingsResponse,
        ] = await Promise.all([
          API.get(
            "/finance/accounts"
          ),

          API.get(
            "/settings"
          ),
        ]);

        // ================================================
        // COMPTES
        // ================================================

        setAccounts(
          extractAccounts(
            accountsResponse
          )
        );

        // ================================================
        // DEVISE ÉGLISE
        // ================================================

        const churchCurrency =
          normalizeCurrency(
            settingsResponse
              ?.data?.data
              ?.defaultCurrency ||
              settingsResponse
                ?.data?.church
                ?.defaultCurrency ||
              "EUR"
          );

        setDefaultCurrency(
          churchCurrency
        );

        // On initialise le formulaire avec
        // la devise principale de l'église.
        setForm((previous) => {
          if (
            previous.name ||
            previous.openingBalance ||
            previous.description
          ) {
            return previous;
          }

          return createInitialForm(
            churchCurrency
          );
        });
      } catch (err) {
        console.error(
          "Erreur chargement comptes financiers :",
          err
        );

        const message =
          err?.response?.data
            ?.message ||
          "Impossible de charger les comptes financiers.";

        setError(message);

        toast.error(message);

        setAccounts([]);
      } finally {
        setLoading(false);
      }
    }, []);

  // ======================================================
  // RAFRAÎCHIR UNIQUEMENT LES COMPTES
  // ======================================================

  const fetchAccounts =
    useCallback(async () => {
      try {
        const response =
          await API.get(
            "/finance/accounts"
          );

        setAccounts(
          extractAccounts(response)
        );
      } catch (err) {
        console.error(
          "Erreur chargement comptes financiers :",
          err
        );

        const message =
          err?.response?.data
            ?.message ||
          "Impossible de charger les comptes financiers.";

        toast.error(message);
      }
    }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const stats = useMemo(() => {
    const total =
      accounts.length;

    const active =
      accounts.filter(
        (account) =>
          account.isActive !== false
      ).length;

    const cash =
      accounts.filter(
        (account) =>
          account.type === "cash"
      ).length;

    const bank =
      accounts.filter(
        (account) =>
          account.type === "bank"
      ).length;

    const mobileMoney =
      accounts.filter(
        (account) =>
          account.type ===
          "mobile_money"
      ).length;

    return {
      total,
      active,
      cash,
      bank,
      mobileMoney,
    };
  }, [accounts]);

  // ======================================================
  // SOLDES PAR DEVISE
  // ======================================================

  const balancesByCurrency =
    useMemo(() => {
      const balances = {};

      accounts
        .filter(
          (account) =>
            account.isActive !== false
        )
        .forEach((account) => {
          const currency =
            normalizeCurrency(
              account.currency
            );

          if (!balances[currency]) {
            balances[currency] = {
              currency,
              balance: 0,
              accounts: 0,
            };
          }

          balances[
            currency
          ].balance +=
            Number(
              account.currentBalance ??
                account.openingBalance ??
                0
            );

          balances[
            currency
          ].accounts += 1;
        });

      return Object.values(
        balances
      ).sort((a, b) =>
        a.currency.localeCompare(
          b.currency
        )
      );
    }, [accounts]);

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(
      createInitialForm(
        defaultCurrency
      )
    );
  };

  const openForm = () => {
    resetForm();

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeForm = () => {
    resetForm();

    setShowForm(false);
  };

  // ======================================================
  // CRÉATION DU COMPTE
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(
        "Le nom du compte est obligatoire."
      );

      return;
    }

    if (!form.type) {
      toast.error(
        "Le type de compte est obligatoire."
      );

      return;
    }

    if (!form.currency) {
      toast.error(
        "La devise est obligatoire."
      );

      return;
    }

    const validType =
      ACCOUNT_TYPES.some(
        (type) =>
          type.value === form.type
      );

    if (!validType) {
      toast.error(
        "Type de compte invalide."
      );

      return;
    }

    const validCurrency =
      CURRENCIES.some(
        (currency) =>
          currency.code ===
          form.currency
      );

    if (!validCurrency) {
      toast.error(
        "Devise invalide."
      );

      return;
    }

    const openingBalance =
      form.openingBalance === ""
        ? 0
        : Number(
            form.openingBalance
          );

    if (
      Number.isNaN(
        openingBalance
      ) ||
      openingBalance < 0
    ) {
      toast.error(
        "Le solde initial doit être un montant valide."
      );

      return;
    }

    try {
      setSubmitting(true);

      await API.post(
        "/finance/accounts",
        {
          name:
            form.name.trim(),

          type:
            form.type,

          currency:
            form.currency.toUpperCase(),

          openingBalance,

          description:
            form.description.trim(),
        }
      );

      toast.success(
        "Compte financier créé avec succès."
      );

      closeForm();

      await fetchAccounts();
    } catch (err) {
      console.error(
        "Erreur création compte financier :",
        err
      );

      toast.error(
        err?.response?.data
          ?.message ||
          "Impossible de créer le compte financier."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // HELPERS
  // ======================================================

  const getAccountType = (
    type
  ) => {
    return (
      ACCOUNT_TYPES.find(
        (item) =>
          item.value === type
      ) || {
        label:
          type || "Autre",

        icon: "💰",
      }
    );
  };

  const getCurrencyName = (
    code
  ) => {
    const currency =
      CURRENCIES.find(
        (item) =>
          item.code === code
      );

    return (
      currency?.name ||
      code ||
      "—"
    );
  };

  // ======================================================
  // CHARGEMENT
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des comptes
                financiers...
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <Layout>
      <div className="management-page">

        {/* HEADER */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Comptes financiers
            </h1>

            <p className="page-subtitle">
              Gérez les caisses,
              comptes bancaires,
              Mobile Money, cartes et
              autres comptes financiers
              de votre église.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (showForm) {
                  closeForm();
                } else {
                  openForm();
                }
              }}
            >
              {showForm
                ? "✕ Fermer"
                : "＋ Nouveau compte"}
            </button>
          </div>
        </div>

        {/* DEVISE PRINCIPALE */}

        <div
          className="management-card"
          style={{
            marginBottom: 24,
            padding: 18,
            borderLeft:
              "4px solid #6366f1",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 16,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                Devise principale
              </div>

              <div className="person-secondary">
                Les nouveaux comptes
                utiliseront cette devise
                par défaut.
              </div>
            </div>

            <span className="status-badge status-active">
              {defaultCurrency} —{" "}
              {getCurrencyName(
                defaultCurrency
              )}
            </span>
          </div>
        </div>

        {/* ERREUR */}

        {error && (
          <div
            className="management-card"
            style={{
              marginBottom: 24,
              border:
                "1px solid #fecaca",
              background:
                "#fef2f2",
            }}
          >
            <div
              style={{
                padding: 20,
                color:
                  "#b91c1c",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* STATISTIQUES */}

        <div className="management-stats-grid">
          <StatCard
            label="Total comptes"
            value={stats.total}
            description="Comptes financiers enregistrés"
          />

          <StatCard
            label="Comptes actifs"
            value={stats.active}
            description="Comptes actuellement utilisables"
          />

          <StatCard
            label="Caisses"
            value={stats.cash}
            description="Comptes de caisse"
          />

          <StatCard
            label="Banques"
            value={stats.bank}
            description="Comptes bancaires"
          />
        </div>

        {/* SOLDES PAR DEVISE */}

        {balancesByCurrency.length >
          0 && (
          <div
            className="management-card"
            style={{
              marginTop: 24,
            }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Soldes par devise
                </h2>

                <p className="page-subtitle">
                  Les devises sont
                  comptabilisées
                  séparément.
                </p>
              </div>
            </div>

            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Devise
                    </th>

                    <th>
                      Comptes actifs
                    </th>

                    <th>
                      Solde total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {balancesByCurrency.map(
                    (item) => (
                      <tr
                        key={
                          item.currency
                        }
                      >
                        <td>
                          <strong>
                            {
                              item.currency
                            }
                          </strong>

                          <div className="person-secondary">
                            {getCurrencyName(
                              item.currency
                            )}
                          </div>
                        </td>

                        <td>
                          {
                            item.accounts
                          }
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              item.balance,
                              item.currency
                            )}
                          </strong>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FORMULAIRE */}

        {showForm && (
          <div
            className="management-card"
            style={{
              marginTop: 24,
            }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Nouveau compte
                  financier
                </h2>

                <p className="page-subtitle">
                  Créez une caisse,
                  un compte bancaire,
                  Mobile Money ou un
                  autre compte
                  financier.
                </p>
              </div>

              <span className="status-badge status-active">
                Par défaut :{" "}
                {defaultCurrency}
              </span>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              style={{
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",

                  gap: 18,
                }}
              >

                {/* NOM */}

                <Field
                  label="Nom du compte *"
                  htmlFor="name"
                >
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Ex. Caisse principale"
                    required
                    style={
                      inputStyle
                    }
                  />
                </Field>

                {/* TYPE */}

                <Field
                  label="Type *"
                  htmlFor="type"
                >
                  <select
                    id="type"
                    name="type"
                    value={
                      form.type
                    }
                    onChange={
                      handleChange
                    }
                    required
                    style={
                      inputStyle
                    }
                  >
                    {ACCOUNT_TYPES.map(
                      (type) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {
                            type.icon
                          }{" "}
                          {
                            type.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                {/* DEVISE */}

                <Field
                  label="Devise *"
                  htmlFor="currency"
                >
                  <select
                    id="currency"
                    name="currency"
                    value={
                      form.currency
                    }
                    onChange={
                      handleChange
                    }
                    required
                    style={
                      inputStyle
                    }
                  >
                    {CURRENCIES.map(
                      (
                        currency
                      ) => (
                        <option
                          key={
                            currency.code
                          }
                          value={
                            currency.code
                          }
                        >
                          {
                            currency.code
                          }{" "}
                          —{" "}
                          {
                            currency.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                {/* SOLDE INITIAL */}

                <Field
                  label="Solde initial"
                  htmlFor="openingBalance"
                >
                  <input
                    id="openingBalance"
                    type="number"
                    name="openingBalance"
                    min="0"
                    step="0.01"
                    value={
                      form.openingBalance
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                    style={
                      inputStyle
                    }
                  />
                </Field>
              </div>

              {/* DESCRIPTION */}

              <div
                style={{
                  marginTop: 18,
                }}
              >
                <Field
                  label="Description"
                  htmlFor="description"
                >
                  <textarea
                    id="description"
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Description facultative du compte..."
                    rows={3}
                    style={{
                      ...inputStyle,

                      resize:
                        "vertical",

                      fontFamily:
                        "inherit",
                    }}
                  />
                </Field>
              </div>

              {/* ACTIONS */}

              <div
                style={{
                  display: "flex",

                  alignItems:
                    "center",

                  gap: 12,

                  marginTop: 24,

                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Création..."
                    : "✓ Créer le compte"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={
                    submitting
                  }
                  onClick={
                    closeForm
                  }
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LISTE DES COMPTES */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Liste des comptes
              </h2>

              <p className="page-subtitle">
                Ensemble des comptes
                financiers enregistrés
                pour cette église.
              </p>
            </div>

            <span className="status-badge status-planned">
              {accounts.length}{" "}
              compte
              {accounts.length > 1
                ? "s"
                : ""}
            </span>
          </div>

          {accounts.length > 0 ? (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Compte
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Devise
                    </th>

                    <th>
                      Solde initial
                    </th>

                    <th>
                      Solde actuel
                    </th>

                    <th>
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map(
                    (account) => {
                      const type =
                        getAccountType(
                          account.type
                        );

                      return (
                        <tr
                          key={
                            account._id
                          }
                        >

                          {/* COMPTE */}

                          <td>
                            <div className="person-cell">
                              <div className="person-avatar">
                                {
                                  type.icon
                                }
                              </div>

                              <div>
                                <div className="person-name">
                                  {
                                    account.name
                                  }
                                </div>

                                <div className="person-secondary">
                                  {account.description ||
                                    "Compte financier"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* TYPE */}

                          <td>
                            {
                              type.label
                            }
                          </td>

                          {/* DEVISE */}

                          <td>
                            <div>
                              <strong>
                                {
                                  account.currency
                                }
                              </strong>

                              <div className="person-secondary">
                                {getCurrencyName(
                                  account.currency
                                )}
                              </div>
                            </div>
                          </td>

                          {/* SOLDE INITIAL */}

                          <td>
                            {formatCurrency(
                              account.openingBalance,
                              account.currency
                            )}
                          </td>

                          {/* SOLDE ACTUEL */}

                          <td>
                            <strong>
                              {formatCurrency(
                                account.currentBalance ??
                                  account.openingBalance,

                                account.currency
                              )}
                            </strong>
                          </td>

                          {/* STATUT */}

                          <td>
                            {account.isActive !==
                            false ? (
                              <span className="status-badge status-active">
                                Actif
                              </span>
                            ) : (
                              <span className="status-badge status-inactive">
                                Inactif
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="management-empty">
              <div className="management-empty-icon">
                💰
              </div>

              <h3>
                Aucun compte
                financier
              </h3>

              <p>
                Commencez par créer
                le premier compte
                financier de cette
                église.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  openForm
                }
              >
                ＋ Créer un compte
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ======================================================
// COMPOSANTS
// ======================================================

function StatCard({
  label,
  value,
  description,
}) {
  return (
    <div className="management-stat-card">
      <div className="management-stat-label">
        {label}
      </div>

      <div className="management-stat-value">
        {value}
      </div>

      <div className="management-stat-description">
        {description}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={labelStyle}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

// ======================================================
// STYLES
// ======================================================

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,

  border:
    "1px solid #dbe2ea",

  background:
    "#ffffff",

  outline: "none",

  fontSize: 14,

  boxSizing:
    "border-box",
};