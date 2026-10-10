// src/pages/finance/FinanceDashboard.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import API from "../../api/axios";
import Layout from "../../components/Layout";
import {
  formatCurrency,
} from "../../constants/currencies";

import "../../styles/ManagementPages.css";

// ======================================================
// CONSTANTES
// ======================================================

const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

const ACCOUNT_TYPES = {
  cash: "Caisse",
  bank: "Compte bancaire",
  mobile_money: "Mobile Money",
  card: "Carte",
  online: "Compte en ligne",
  other: "Autre",
};

const TRANSACTION_TYPES = {
  income: "Entrée",
  expense: "Sortie",
  transfer: "Transfert",
};

// ======================================================
// HELPERS
// ======================================================

const getCurrentPeriod = () => {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    fallback
  );
};

// ======================================================
// COMPOSANT
// ======================================================

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const currentPeriod = getCurrentPeriod();

  const buildTransactionUrl = (extraParams = {}) => {
    const params = new URLSearchParams({
      month: `${year}-${String(month).padStart(2, "0")}`,
      currency: selectedCurrency,
      status: "confirmed",
      ...extraParams,
    });

    return `/finance/transactions?${params.toString()}`;
  };

  const clickableCardStyle = {
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  };

  const handleCardKeyDown = (event, target) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(target);
    }
  };

  const [month, setMonth] = useState(
    currentPeriod.month
  );

  const [year, setYear] = useState(
    currentPeriod.year
  );

  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState(null);

  const [
    defaultCurrency,
    setDefaultCurrency,
  ] = useState("");

  const [
    selectedCurrency,
    setSelectedCurrency,
  ] = useState("");

  // ====================================================
  // CHARGEMENT
  // ====================================================

  const fetchDashboard =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          dashboardResponse,
          settingsResponse,
        ] = await Promise.all([
          API.get(
            "/finance/dashboard",
            {
              params: {
                month,
                year,
              },
            }
          ),

          API.get("/settings"),
        ]);

        const dashboardData =
          dashboardResponse?.data?.data ||
          null;

        const churchCurrency = String(
          settingsResponse?.data?.data
            ?.defaultCurrency ||
            settingsResponse?.data?.church
              ?.defaultCurrency ||
            settingsResponse?.data
              ?.defaultCurrency ||
            "EUR"
        )
          .trim()
          .toUpperCase();

        setDefaultCurrency(
          churchCurrency
        );

        setData(
          dashboardData
        );

        /*
         * On applique la devise principale
         * uniquement si aucune devise n'est
         * actuellement sélectionnée.
         *
         * Le choix manuel EUR / XAF / USD...
         * reste donc respecté.
         */
        setSelectedCurrency(
          (currentCurrency) =>
            currentCurrency ||
            churchCurrency
        );
      } catch (error) {
        console.error(
          "Erreur dashboard financier :",
          error
        );

        toast.error(
          getErrorMessage(
            error,
            "Impossible de charger le tableau de bord financier."
          )
        );

        setData(null);
      } finally {
        setLoading(false);
      }
    }, [
      month,
      year,
    ]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ====================================================
  // DEVISES DISPONIBLES
  // ====================================================

  const currencies = useMemo(() => {
    const values = new Set();

    /*
     * Toujours inclure la devise principale
     * de l'église même s'il n'existe encore
     * aucun mouvement dans cette devise.
     */
    if (defaultCurrency) {
      values.add(
        defaultCurrency
      );
    }

    Object.keys(
      data?.accounts?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency)
            .trim()
            .toUpperCase()
        );
      }
    });

    Object.keys(
      data?.movements?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency)
            .trim()
            .toUpperCase()
        );
      }
    });

    Object.keys(
      data?.budgets?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency)
            .trim()
            .toUpperCase()
        );
      }
    });

    Object.keys(
      data?.reconciliation
        ?.currencies || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency)
            .trim()
            .toUpperCase()
        );
      }
    });

    return Array
      .from(values)
      .sort();
  }, [
    data,
    defaultCurrency,
  ]);

  /*
   * Sécurité :
   * si la devise sélectionnée n'existe
   * réellement plus, retour sur la devise
   * principale de l'église.
   */
  useEffect(() => {
    if (!defaultCurrency) {
      return;
    }

    if (!selectedCurrency) {
      setSelectedCurrency(
        defaultCurrency
      );

      return;
    }

    if (
      currencies.length > 0 &&
      !currencies.includes(
        selectedCurrency
      )
    ) {
      if (
        currencies.includes(
          defaultCurrency
        )
      ) {
        setSelectedCurrency(
          defaultCurrency
        );
      } else {
        setSelectedCurrency(
          currencies[0]
        );
      }
    }
  }, [
    currencies,
    selectedCurrency,
    defaultCurrency,
  ]);

  // ====================================================
  // DONNÉES DE LA DEVISE
  // ====================================================

  const accountStats =
    data?.accounts?.byCurrency?.[
      selectedCurrency
    ] || {
      totalBalance: 0,
      openingBalance: 0,
      totalAccounts: 0,
      activeAccounts: 0,
    };

  const movementStats =
    data?.movements?.byCurrency?.[
      selectedCurrency
    ] || {
      income: 0,
      expense: 0,
      transfer: 0,

      incomeCount: 0,
      expenseCount: 0,
      transferCount: 0,

      net: 0,

      tithe: 0,
      offering: 0,
      donation: 0,

      titheCount: 0,
      offeringCount: 0,
      donationCount: 0,

      // IMPORTANT :
      // compteur par devise
      donorCount: 0,
    };

  const budgetStats =
    data?.budgets?.byCurrency?.[
      selectedCurrency
    ] || {
      budgetedExpense: 0,
      actualExpense: 0,

      budgetedIncome: 0,
      actualIncome: 0,

      activeBudgets: 0,
      draftBudgets: 0,

      alertBudgets: 0,
      exceededBudgets: 0,
    };

  const reconciliationStats =
    data?.reconciliation
      ?.currencies?.[
        selectedCurrency
      ] || {
      openingBalance: 0,
      income: 0,
      expense: 0,
      transferIn: 0,
      transferOut: 0,
      theoreticalBalance: 0,
      storedBalance: 0,
      difference: 0,
    };

  // ====================================================
  // GRAPHIQUE
  // ====================================================

  const chartData = useMemo(() => {
    return (
      data?.movements
        ?.dailyEvolution || []
    )
      .filter(
        (item) =>
          String(
            item.currency || ""
          ).toUpperCase() ===
          selectedCurrency
      )
      .map((item) => ({
        jour: item.day,

        Entrées: Number(
          item.income || 0
        ),

        Sorties: Number(
          item.expense || 0
        ),
      }));
  }, [
    data,
    selectedCurrency,
  ]);

  // ====================================================
  // COMPTES
  // ====================================================

  const currencyAccounts =
    useMemo(() => {
      return (
        data?.accounts?.list || []
      ).filter(
        (account) =>
          String(
            account.currency || ""
          ).toUpperCase() ===
          selectedCurrency
      );
    }, [
      data,
      selectedCurrency,
    ]);

  // ====================================================
  // TRANSACTIONS RÉCENTES
  // ====================================================

  const recentTransactions =
    useMemo(() => {
      return (
        data?.recentTransactions || []
      ).filter(
        (transaction) =>
          String(
            transaction.currency ||
              ""
          ).toUpperCase() ===
          selectedCurrency
      );
    }, [
      data,
      selectedCurrency,
    ]);

  // ====================================================
  // PÉRIODE
  // ====================================================

  const selectedMonthLabel =
    MONTHS.find(
      (item) =>
        item.value ===
        Number(month)
    )?.label || "";

  // ====================================================
  // LOADING
  // ====================================================

  if (loading && !data) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-empty">
              <div className="management-empty-icon">
                ⏳
              </div>

              <p>
                Chargement du tableau de
                bord financier...
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Layout>
      <div className="management-page">
        {/* HEADER */}

        <div className="page-header">
          <div>
            <h1 className="page-title">
              Tableau de bord financier
            </h1>

            <p className="page-subtitle">
              Vue financière de l'église —
              {` ${selectedMonthLabel} ${year}`}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            disabled={loading}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "10px 14px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontWeight: 700,
            }}
          >
            {loading
              ? "Actualisation..."
              : "↻ Actualiser"}
          </button>
        </div>

        {/* FILTRES */}

        <div
          className="management-card"
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "end",
            }}
          >
            <div
              style={{
                minWidth: "180px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 700,
                }}
              >
                Mois
              </label>

              <select
                value={month}
                onChange={(event) =>
                  setMonth(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                {MONTHS.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div
              style={{
                minWidth: "130px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 700,
                }}
              >
                Année
              </label>

              <input
                type="number"
                min="2000"
                max="2200"
                value={year}
                onChange={(event) =>
                  setYear(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  boxSizing:
                    "border-box",
                }}
              />
            </div>

            <div
              style={{
                minWidth: "150px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 700,
                }}
              >
                Devise
              </label>

              <select
                value={
                  selectedCurrency
                }
                onChange={(event) =>
                  setSelectedCurrency(
                    event.target.value
                  )
                }
                disabled={
                  currencies.length === 0
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                {currencies.length ===
                0 ? (
                  <option value="">
                    Aucune devise
                  </option>
                ) : (
                  currencies.map(
                    (currency) => (
                      <option
                        key={
                          currency
                        }
                        value={
                          currency
                        }
                      >
                        {currency}
                      </option>
                    )
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {!selectedCurrency ? (
          <div className="management-card">
            <div className="management-empty">
              <div className="management-empty-icon">
                💰
              </div>

              <h3>
                Aucune donnée financière
              </h3>

              <p>
                Crée d'abord un compte
                financier pour commencer.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* STATISTIQUES PRINCIPALES */}

            <div className="management-stats-grid">
              <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() => navigate("/finance/accounts")}
                  onKeyDown={(event) =>
                    handleCardKeyDown(event, "/finance/accounts")
                  }
                >
                <div className="management-stat-label">
                  Solde disponible
                </div>

                <div className="management-stat-value">
                  {formatCurrency(
                    accountStats.totalBalance,
                    selectedCurrency
                  )}
                </div>

                <div className="management-stat-description">
                  {
                    accountStats.activeAccounts
                  }{" "}
                  compte(s) actif(s)
                </div>
              </div>

              <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() => navigate(buildTransactionUrl({ type: "income" }))}
                  onKeyDown={(event) =>
                    handleCardKeyDown(event, buildTransactionUrl({ type: "income" }))
                  }
                >
                <div className="management-stat-label">
                  Entrées du mois
                </div>

                <div className="management-stat-value">
                  {formatCurrency(
                    movementStats.income,
                    selectedCurrency
                  )}
                </div>

                <div className="management-stat-description">
                  {
                    movementStats.incomeCount
                  }{" "}
                  mouvement(s)
                </div>
              </div>

              <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() => navigate(buildTransactionUrl({ type: "expense" }))}
                  onKeyDown={(event) =>
                    handleCardKeyDown(event, buildTransactionUrl({ type: "expense" }))
                  }
                >
                <div className="management-stat-label">
                  Sorties du mois
                </div>

                <div className="management-stat-value">
                  {formatCurrency(
                    movementStats.expense,
                    selectedCurrency
                  )}
                </div>

                <div className="management-stat-description">
                  {
                    movementStats.expenseCount
                  }{" "}
                  mouvement(s)
                </div>
              </div>

              <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() => navigate(buildTransactionUrl())}
                  onKeyDown={(event) =>
                    handleCardKeyDown(event, buildTransactionUrl())
                  }
                >
                <div className="management-stat-label">
                  Solde net du mois
                </div>

                <div className="management-stat-value">
                  {formatCurrency(
                    movementStats.net,
                    selectedCurrency
                  )}
                </div>

                <div className="management-stat-description">
                  Entrées - sorties
                </div>
              </div>
            </div>

            {/* ENTRÉES ÉGLISE */}

            <div
              className="management-card"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Entrées de l'église
                  </h2>

                  <p className="page-subtitle">
                    Dîmes, offrandes et dons
                    pour la période
                  </p>
                </div>
              </div>

              <div className="management-stats-grid">
                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate(buildTransactionUrl({ type: "income", search: "Dîme" }))}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, buildTransactionUrl({ type: "income", search: "Dîme" }))
                    }
                  >
                  <div className="management-stat-label">
                    Dîmes
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      movementStats.tithe,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    {
                      movementStats.titheCount
                    }{" "}
                    mouvement(s)
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate(buildTransactionUrl({ type: "income", search: "Offrande" }))}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, buildTransactionUrl({ type: "income", search: "Offrande" }))
                    }
                  >
                  <div className="management-stat-label">
                    Offrandes
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      movementStats.offering,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    {
                      movementStats.offeringCount
                    }{" "}
                    mouvement(s)
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate(buildTransactionUrl({ type: "income", search: "Don" }))}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, buildTransactionUrl({ type: "income", search: "Don" }))
                    }
                  >
                  <div className="management-stat-label">
                    Dons
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      movementStats.donation,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    {
                      movementStats.donationCount
                    }{" "}
                    mouvement(s)
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate(buildTransactionUrl({ type: "income" }))}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, buildTransactionUrl({ type: "income" }))
                    }
                  >
                  <div className="management-stat-label">
                    Donateurs identifiés
                  </div>

                  <div className="management-stat-value">
                    {
                      movementStats.donorCount ||
                      0
                    }
                  </div>

                  <div className="management-stat-description">
                    Hors dons anonymes
                  </div>
                </div>
              </div>
            </div>

            {/* GRAPHIQUE */}

            <div
              className="management-card"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Évolution du mois
                  </h2>

                  <p className="page-subtitle">
                    Entrées et sorties —{" "}
                    {selectedCurrency}
                  </p>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    📊
                  </div>

                  <p>
                    Aucun mouvement sur
                    cette période.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "320px",
                    marginTop: "20px",
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={chartData}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="jour"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value
                        ) =>
                          formatCurrency(
                            value,
                            selectedCurrency
                          )
                        }
                      />

                      <Legend />

                      <Bar
                        dataKey="Entrées"
                        fill="#22c55e"
                      />

                      <Bar
                        dataKey="Sorties"
                        fill="#ef4444"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* BUDGETS */}

            <div
              className="management-card"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Situation budgétaire
                  </h2>

                  <p className="page-subtitle">
                    Suivi des budgets en{" "}
                    {selectedCurrency}
                  </p>
                </div>
              </div>

              <div className="management-stats-grid">
                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/budgets")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/budgets")
                    }
                  >
                  <div className="management-stat-label">
                    Sorties prévues
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      budgetStats.budgetedExpense,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Budget de sorties
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/budgets")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/budgets")
                    }
                  >
                  <div className="management-stat-label">
                    Sorties réalisées
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      budgetStats.actualExpense,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Sorties enregistrées
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/budgets")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/budgets")
                    }
                  >
                  <div className="management-stat-label">
                    Alertes budget
                  </div>

                  <div className="management-stat-value">
                    {
                      budgetStats.alertBudgets
                    }
                  </div>

                  <div className="management-stat-description">
                    Seuil atteint
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/budgets")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/budgets")
                    }
                  >
                  <div className="management-stat-label">
                    Budgets dépassés
                  </div>

                  <div className="management-stat-value">
                    {
                      budgetStats.exceededBudgets
                    }
                  </div>

                  <div className="management-stat-description">
                    Montant prévu dépassé
                  </div>
                </div>
              </div>
            </div>

            {/* RAPPROCHEMENT */}

            <div
              className="management-card"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Contrôle des soldes
                  </h2>

                  <p className="page-subtitle">
                    Rapprochement financier
                  </p>
                </div>
              </div>

              <div className="management-stats-grid">
                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/reconciliation")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/reconciliation")
                    }
                  >
                  <div className="management-stat-label">
                    Solde théorique
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      reconciliationStats.theoreticalBalance,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Calculé depuis les
                    mouvements
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/reconciliation")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/reconciliation")
                    }
                  >
                  <div className="management-stat-label">
                    Solde enregistré
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      reconciliationStats.storedBalance,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Solde actuel des comptes
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/reconciliation")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/reconciliation")
                    }
                  >
                  <div className="management-stat-label">
                    Écart
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      reconciliationStats.difference,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Enregistré - théorique
                  </div>
                </div>

                <div
                    className="management-stat-card"
                    role="button"
                    tabIndex={0}
                    style={clickableCardStyle}
                    onClick={() => navigate("/finance/reconciliation")}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, "/finance/reconciliation")
                    }
                  >
                  <div className="management-stat-label">
                    État général
                  </div>

                  <div className="management-stat-value">
                    {data?.reconciliation
                      ?.isBalanced
                      ? "✓ Équilibré"
                      : "⚠ Écart"}
                  </div>

                  <div className="management-stat-description">
                    {data?.reconciliation
                      ?.discrepancyAccounts ||
                      0}{" "}
                    compte(s) avec écart
                  </div>
                </div>
              </div>
            </div>

            {/* COMPTES */}

            <div
              className="management-card"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Comptes financiers
                  </h2>

                  <p className="page-subtitle">
                    Comptes en{" "}
                    {selectedCurrency}
                  </p>
                </div>
              </div>

              {currencyAccounts.length ===
              0 ? (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    💰
                  </div>

                  <p>
                    Aucun compte dans cette
                    devise.
                  </p>
                </div>
              ) : (
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
                          Solde initial
                        </th>

                        <th>
                          Solde actuel
                        </th>

                        <th>
                          État
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {currencyAccounts.map(
                        (account) => (
                          <tr
                            key={account._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate("/finance/accounts")}
                            onKeyDown={(event) =>
                              handleCardKeyDown(event, "/finance/accounts")
                            }
                            style={{ cursor: "pointer" }}
                            title="Ouvrir les comptes financiers"
                          >
                            <td>
                              <strong>
                                {
                                  account.name
                                }
                              </strong>

                              {account.isDefault && (
                                <div
                                  style={{
                                    fontSize:
                                      "11px",
                                    opacity:
                                      0.7,
                                    marginTop:
                                      "3px",
                                  }}
                                >
                                  Compte par
                                  défaut
                                </div>
                              )}
                            </td>

                            <td>
                              {ACCOUNT_TYPES[
                                account.type
                              ] ||
                                account.type}
                            </td>

                            <td>
                              {formatCurrency(
                                account.openingBalance,
                                selectedCurrency
                              )}
                            </td>

                            <td>
                              <strong>
                                {formatCurrency(
                                  account.currentBalance,
                                  selectedCurrency
                                )}
                              </strong>
                            </td>

                            <td>
                              {account.isActive
                                ? "Actif"
                                : "Inactif"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TRANSACTIONS RÉCENTES */}

            <div
              className="management-card"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Derniers mouvements
                  </h2>

                  <p className="page-subtitle">
                    Transactions confirmées
                    récentes
                  </p>
                </div>
              </div>

              {recentTransactions.length ===
              0 ? (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    💳
                  </div>

                  <p>
                    Aucun mouvement récent
                    dans cette devise.
                  </p>
                </div>
              ) : (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>
                          Date
                        </th>

                        <th>
                          Libellé
                        </th>

                        <th>
                          Type
                        </th>

                        <th>
                          Catégorie
                        </th>

                        <th>
                          Compte
                        </th>

                        <th>
                          Montant
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentTransactions.map(
                        (transaction) => (
                          <tr
                            key={transaction._id}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              navigate(
                                buildTransactionUrl({
                                  search: transaction.title || "",
                                })
                              )
                            }
                            onKeyDown={(event) =>
                              handleCardKeyDown(
                                event,
                                buildTransactionUrl({
                                  search: transaction.title || "",
                                })
                              )
                            }
                            style={{ cursor: "pointer" }}
                            title="Voir dans l'historique des transactions"
                          >
                            <td>
                              {formatDate(
                                transaction.transactionDate
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  transaction.title
                                }
                              </strong>
                            </td>

                            <td>
                              {TRANSACTION_TYPES[
                                transaction.type
                              ] ||
                                transaction.type}
                            </td>

                            <td>
                              {transaction
                                .category
                                ?.name ||
                                "—"}
                            </td>

                            <td>
                              {transaction.type ===
                              "transfer"
                                ? `${
                                    transaction
                                      .fromAccount
                                      ?.name ||
                                    "—"
                                  } → ${
                                    transaction
                                      .toAccount
                                      ?.name ||
                                    "—"
                                  }`
                                : transaction
                                    .account
                                    ?.name ||
                                  "—"}
                            </td>

                            <td>
                              <strong>
                                {formatCurrency(
                                  transaction.amount,
                                  transaction.currency
                                )}
                              </strong>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}