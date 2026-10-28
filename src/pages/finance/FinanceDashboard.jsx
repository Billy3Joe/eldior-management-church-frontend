
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
import { formatCurrency } from "../../constants/currencies";

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
// FONCTIONS UTILITAIRES
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
  return error?.response?.data?.message || fallback;
};

// ======================================================
// COMPOSANT PRINCIPAL
// ======================================================

export default function FinanceDashboard() {
  const navigate = useNavigate();

  const currentPeriod = getCurrentPeriod();

  // ====================================================
  // ÉTATS
  // ====================================================

  const [month, setMonth] = useState(
    currentPeriod.month
  );

  const [year, setYear] = useState(
    currentPeriod.year
  );

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState(null);

  const [
    defaultCurrency,
    setDefaultCurrency,
  ] = useState("");

  const [
    selectedCurrency,
    setSelectedCurrency,
  ] = useState("");

  // ====================================================
  // NAVIGATION
  // ====================================================

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

  // ====================================================
  // CHARGEMENT DU DASHBOARD
  // ====================================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        settingsResponse,
      ] = await Promise.all([
        API.get("/finance/dashboard", {
          params: {
            month,
            year,
          },
        }),

        API.get("/settings"),
      ]);

      const dashboardData =
        dashboardResponse?.data?.data || null;

      const churchCurrency = String(
        settingsResponse?.data?.data?.defaultCurrency ||
        settingsResponse?.data?.church?.defaultCurrency ||
        settingsResponse?.data?.defaultCurrency ||
        "EUR"
      )
        .trim()
        .toUpperCase();

      setDefaultCurrency(churchCurrency);

      setData(dashboardData);

      // Conserver le choix manuel de la devise.
      setSelectedCurrency(
        (currentCurrency) =>
          currentCurrency || churchCurrency
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
  }, [month, year]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ====================================================
  // DEVISES DISPONIBLES
  // ====================================================

  const currencies = useMemo(() => {
    const values = new Set();

    if (defaultCurrency) {
      values.add(defaultCurrency);
    }

    Object.keys(
      data?.accounts?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency).trim().toUpperCase()
        );
      }
    });

    Object.keys(
      data?.movements?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency).trim().toUpperCase()
        );
      }
    });

    Object.keys(
      data?.budgets?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency).trim().toUpperCase()
        );
      }
    });

    Object.keys(
      data?.reconciliation?.currencies || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(
          String(currency).trim().toUpperCase()
        );
      }
    });

    return Array.from(values).sort();
  }, [data, defaultCurrency]);

  // ====================================================
  // VALIDATION DE LA DEVISE SÉLECTIONNÉE
  // ====================================================

  useEffect(() => {
    if (!defaultCurrency) {
      return;
    }

    if (!selectedCurrency) {
      setSelectedCurrency(defaultCurrency);
      return;
    }

    if (
      currencies.length > 0 &&
      !currencies.includes(selectedCurrency)
    ) {
      if (currencies.includes(defaultCurrency)) {
        setSelectedCurrency(defaultCurrency);
      } else {
        setSelectedCurrency(currencies[0]);
      }
    }
  }, [
    currencies,
    selectedCurrency,
    defaultCurrency,
  ]);

  // ====================================================
  // STATISTIQUES DES COMPTES
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

  // ====================================================
  // STATISTIQUES DES MOUVEMENTS
  // ====================================================

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

      donorCount: 0,
    };

  // ====================================================
  // STATISTIQUES DES BUDGETS
  // ====================================================

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

  // ====================================================
  // RAPPROCHEMENT FINANCIER
  // ====================================================

  const reconciliationStats =
    data?.reconciliation?.currencies?.[
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

  // L'état affiché doit correspondre à la devise
  // sélectionnée, et non à toutes les devises.
  const selectedCurrencyIsBalanced =
    Math.abs(
      Number(reconciliationStats.difference || 0)
    ) < 0.005;

  // ====================================================
  // GRAPHIQUE : ÉVOLUTION QUOTIDIENNE
  // ====================================================

  const chartData = useMemo(() => {
    const daysInMonth = new Date(
      Number(year),
      Number(month),
      0
    ).getDate();

    if (
      !Number.isInteger(daysInMonth) ||
      daysInMonth < 28 ||
      daysInMonth > 31
    ) {
      return [];
    }

    const daily = new Map();

    const movements =
      data?.movements?.dailyEvolution || [];

    movements
      .filter(
        (item) =>
          String(
            item.currency || ""
          ).toUpperCase() === selectedCurrency
      )
      .forEach((item) => {
        const day = Number(item.day);

        if (
          !Number.isInteger(day) ||
          day < 1 ||
          day > daysInMonth
        ) {
          return;
        }

        const previous = daily.get(day) || {
          income: 0,
          expense: 0,
        };

        daily.set(day, {
          income:
            previous.income +
            Number(item.income || 0),

          expense:
            previous.expense +
            Number(item.expense || 0),
        });
      });

    // Tous les jours du mois sont représentés.
    return Array.from(
      { length: daysInMonth },
      (_, index) => {
        const day = index + 1;

        const values = daily.get(day) || {
          income: 0,
          expense: 0,
        };

        return {
          jour: day,
          Entrées: values.income,
          Sorties: values.expense,
        };
      }
    );
  }, [
    data,
    selectedCurrency,
    month,
    year,
  ]);

  const hasChartMovements = chartData.some(
    (item) =>
      item.Entrées !== 0 ||
      item.Sorties !== 0
  );

  // ====================================================
  // LISTE DES COMPTES PAR DEVISE
  // ====================================================

  const currencyAccounts = useMemo(() => {
    return (
      data?.accounts?.list || []
    ).filter(
      (account) =>
        String(
          account.currency || ""
        ).toUpperCase() === selectedCurrency
    );
  }, [
    data,
    selectedCurrency,
  ]);

  // ====================================================
  // TRANSACTIONS RÉCENTES PAR DEVISE
  // ====================================================

  const recentTransactions = useMemo(() => {
    return (
      data?.recentTransactions || []
    ).filter(
      (transaction) =>
        String(
          transaction.currency || ""
        ).toUpperCase() === selectedCurrency
    );
  }, [
    data,
    selectedCurrency,
  ]);

  // ====================================================
  // PÉRIODE AFFICHÉE
  // ====================================================

  const selectedMonthLabel =
    MONTHS.find(
      (item) =>
        item.value === Number(month)
    )?.label || "";

  // ====================================================
  // AFFICHAGE PENDANT LE CHARGEMENT
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
                Chargement du tableau de bord financier...
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ====================================================
  // DÉBUT DE L'AFFICHAGE PRINCIPAL
  // ====================================================

  return (
    <Layout>
      <div className="management-page">

        {/* ============================================= */}
        {/* EN-TÊTE DU TABLEAU DE BORD */}
        {/* ============================================= */}

        <div className="page-header">
          <div>
            <h1 className="page-title">
              Tableau de bord des finances de l’église
            </h1>

            <p className="page-subtitle">
              Vue des finances de l’église —
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

        {/* ============================================= */}
        {/* FILTRES : MOIS, ANNÉE ET DEVISE */}
        {/* ============================================= */}

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
            {/* MOIS */}

            <div
              style={{
                minWidth: "180px",
              }}
            >
              <label
                htmlFor="finance-dashboard-month"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 700,
                }}
              >
                Mois
              </label>

              <select
                id="finance-dashboard-month"
                value={month}
                onChange={(event) =>
                  setMonth(
                    Number(event.target.value)
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                {MONTHS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ANNÉE */}

            <div
              style={{
                minWidth: "130px",
              }}
            >
              <label
                htmlFor="finance-dashboard-year"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 700,
                }}
              >
                Année
              </label>

              <input
                id="finance-dashboard-year"
                type="number"
                min="2000"
                max="2200"
                value={year}
                onChange={(event) =>
                  setYear(
                    Number(event.target.value)
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* DEVISE */}

            <div
              style={{
                minWidth: "150px",
              }}
            >
              <label
                htmlFor="finance-dashboard-currency"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 700,
                }}
              >
                Devise
              </label>

              <select
                id="finance-dashboard-currency"
                value={selectedCurrency}
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
                {currencies.length === 0 ? (
                  <option value="">
                    Aucune devise
                  </option>
                ) : (
                  currencies.map((currency) => (
                    <option
                      key={currency}
                      value={currency}
                    >
                      {currency}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* ============================================= */}
        {/* ABSENCE DE DEVISE */}
        {/* ============================================= */}

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
                Crée d'abord un compte financier
                pour commencer.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ====================================== */}
            {/* STATISTIQUES PRINCIPALES */}
            {/* ====================================== */}

            <div className="management-stats-grid">

              {/* SOLDE DISPONIBLE */}

              <div
                className="management-stat-card"
                role="button"
                tabIndex={0}
                style={clickableCardStyle}
                onClick={() =>
                  navigate("/finance/accounts")
                }
                onKeyDown={(event) =>
                  handleCardKeyDown(
                    event,
                    "/finance/accounts"
                  )
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
                  {accountStats.activeAccounts}{" "}
                  compte(s) actif(s)
                </div>
              </div>

              {/* ENTRÉES DU MOIS */}

              <div
                className="management-stat-card"
                role="button"
                tabIndex={0}
                style={clickableCardStyle}
                onClick={() =>
                  navigate(
                    buildTransactionUrl({
                      type: "income",
                    })
                  )
                }
                onKeyDown={(event) =>
                  handleCardKeyDown(
                    event,
                    buildTransactionUrl({
                      type: "income",
                    })
                  )
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
                  {movementStats.incomeCount}{" "}
                  mouvement(s)
                </div>
              </div>

              {/* SORTIES DU MOIS */}

              <div
                className="management-stat-card"
                role="button"
                tabIndex={0}
                style={clickableCardStyle}
                onClick={() =>
                  navigate(
                    buildTransactionUrl({
                      type: "expense",
                    })
                  )
                }
                onKeyDown={(event) =>
                  handleCardKeyDown(
                    event,
                    buildTransactionUrl({
                      type: "expense",
                    })
                  )
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
                  {movementStats.expenseCount}{" "}
                  mouvement(s)
                </div>
              </div>

              {/* SOLDE NET DU MOIS */}

              <div
                className="management-stat-card"
                role="button"
                tabIndex={0}
                style={clickableCardStyle}
                onClick={() =>
                  navigate(
                    buildTransactionUrl()
                  )
                }
                onKeyDown={(event) =>
                  handleCardKeyDown(
                    event,
                    buildTransactionUrl()
                  )
                }
              >
                <div className="management-stat-label">
                  Solde des mouvements du mois
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

            {/* ====================================== */}
            {/* ENTRÉES DE L'ÉGLISE */}
            {/* ====================================== */}

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

                {/* DÎMES */}

                <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() =>
                    navigate(
                      buildTransactionUrl({
                        type: "income",
                        search: "Dîme",
                      })
                    )
                  }
                  onKeyDown={(event) =>
                    handleCardKeyDown(
                      event,
                      buildTransactionUrl({
                        type: "income",
                        search: "Dîme",
                      })
                    )
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
                    {movementStats.titheCount}{" "}
                    mouvement(s)
                  </div>
                </div>

                {/* OFFRANDES */}

                <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() =>
                    navigate(
                      buildTransactionUrl({
                        type: "income",
                        search: "Offrande",
                      })
                    )
                  }
                  onKeyDown={(event) =>
                    handleCardKeyDown(
                      event,
                      buildTransactionUrl({
                        type: "income",
                        search: "Offrande",
                      })
                    )
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
                    {movementStats.offeringCount}{" "}
                    mouvement(s)
                  </div>
                </div>

                {/* DONS */}

                <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() =>
                    navigate(
                      buildTransactionUrl({
                        type: "income",
                        search: "Don",
                      })
                    )
                  }
                  onKeyDown={(event) =>
                    handleCardKeyDown(
                      event,
                      buildTransactionUrl({
                        type: "income",
                        search: "Don",
                      })
                    )
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
                    {movementStats.donationCount}{" "}
                    mouvement(s)
                  </div>
                </div>

                {/* DONATEURS IDENTIFIÉS */}

                <div
                  className="management-stat-card"
                  role="button"
                  tabIndex={0}
                  style={clickableCardStyle}
                  onClick={() =>
                    navigate(
                      buildTransactionUrl({
                        type: "income",
                      })
                    )
                  }
                  onKeyDown={(event) =>
                    handleCardKeyDown(
                      event,
                      buildTransactionUrl({
                        type: "income",
                      })
                    )
                  }
                >
                  <div className="management-stat-label">
                    Contributeurs identifiés
                  </div>

                  <div className="management-stat-value">
                    {movementStats.donorCount || 0}
                  </div>

                  <div className="management-stat-description">
                    Hors dons anonymes
                  </div>
                </div>
              </div>
            </div>

            {/* ====================================== */}
            {/* GRAPHIQUE D'ÉVOLUTION DU MOIS */}
            {/* ====================================== */}

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

              {!hasChartMovements ? (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    📊
                  </div>

                  <p>
                    Aucun mouvement sur cette période.
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
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis dataKey="jour" />

                      <YAxis />

                      <Tooltip
                        formatter={(value) =>
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

            {/* ====================================== */}
            {/* SUITE : BUDGETS ET RAPPROCHEMENT */}
            {/* ====================================== */}

            {/* ====================================== */}
            {/* SITUATION BUDGÉTAIRE */}
            {/* ====================================== */}

            <div
              className="management-card"
              style={{
                marginTop: 20,
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Suivi du budget de l’église
                  </h2>

                  <p className="page-subtitle">
                    Prévisions et mouvements du mois
                    en {selectedCurrency}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate("/finance/budgets")
                  }
                >
                  Voir les budgets
                </button>
              </div>

              <div className="management-stats-grid">
                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Dépenses prévues
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      budgetStats.budgetedExpense || 0,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Prévisions des dépenses
                  </div>
                </div>

                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Dépenses effectuées
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      budgetStats.actualExpense || 0,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Dépenses enregistrées dans le budget
                  </div>
                </div>

                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Entrées de fonds prévues
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      budgetStats.budgetedIncome || 0,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Prévisions des entrées de fonds
                  </div>
                </div>

                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Entrées de fonds enregistrées
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      budgetStats.actualIncome || 0,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Entrées enregistrées dans le budget
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <span className="status-badge">
                  Budgets actifs :{" "}
                  {budgetStats.activeBudgets || 0}
                </span>

                <span className="status-badge">
                  Brouillons :{" "}
                  {budgetStats.draftBudgets || 0}
                </span>

                <span className="status-badge">
                  Alertes :{" "}
                  {budgetStats.alertBudgets || 0}
                </span>

                <span className="status-badge">
                  Dépassements :{" "}
                  {budgetStats.exceededBudgets || 0}
                </span>
              </div>
            </div>

            {/* ====================================== */}
            {/* RAPPROCHEMENT FINANCIER */}
            {/* ====================================== */}

            <div
              className="management-card"
              style={{
                marginTop: 20,
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Vérification des soldes
                  </h2>

                  <p className="page-subtitle">
                    Contrôle de cohérence des soldes
                    en {selectedCurrency}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate("/finance/reconciliation")
                  }
                >
                  Voir la vérification des soldes
                </button>
              </div>

              <div
                style={{
                  marginBottom: 20,
                }}
              >
                <span
                  className={`status-badge ${
                    selectedCurrencyIsBalanced
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {selectedCurrencyIsBalanced
                    ? "✓ Aucun écart calculé"
                    : "⚠ Écart détecté"}
                </span>
              </div>

              <div className="management-stats-grid">
                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Solde calculé
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      reconciliationStats.theoreticalBalance || 0,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Solde calculé à partir des mouvements
                  </div>
                </div>

                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Solde comptabilisé
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      reconciliationStats.storedBalance || 0,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Solde comptabilisé dans les comptes
                  </div>
                </div>

                <div className="management-stat-card">
                  <div className="management-stat-label">
                    Écart
                  </div>

                  <div className="management-stat-value">
                    {formatCurrency(
                      reconciliationStats.difference || 0,
                      selectedCurrency
                    )}
                  </div>

                  <div className="management-stat-description">
                    Différence entre les soldes
                  </div>
                </div>
              </div>
            </div>

            {/* ====================================== */}
            {/* COMPTES FINANCIERS */}
            {/* ====================================== */}

            <div
              className="management-card"
              style={{
                marginTop: 20,
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Comptes et caisses de l’église
                  </h2>

                  <p className="page-subtitle">
                    Comptes et caisses enregistrés en{" "}
                    {selectedCurrency}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate("/finance/accounts")
                  }
                >
                  Gérer les comptes
                </button>
              </div>

              {currencyAccounts.length === 0 ? (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    🏦
                  </div>

                  <h3>Aucun compte financier</h3>

                  <p>
                    Aucun compte enregistré pour cette
                    devise.
                  </p>
                </div>
              ) : (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Compte</th>
                        <th>Type</th>
                        <th>Devise</th>
                        <th>Solde</th>
                        <th>Statut</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currencyAccounts.map((account) => (
                        <tr key={account._id}>
                          <td>
                            <strong>
                              {account.name || "—"}
                            </strong>
                          </td>

                          <td>
                            {ACCOUNT_TYPES[account.type] ||
                              account.type ||
                              "—"}
                          </td>

                          <td>
                            {account.currency ||
                              selectedCurrency}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                account.currentBalance ??
                                  account.balance ??
                                  0,
                                selectedCurrency
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                account.isActive !== false
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {account.isActive !== false
                                ? "Actif"
                                : "Inactif"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ====================================== */}
            {/* TRANSACTIONS RÉCENTES */}
            {/* ====================================== */}

            <div
              className="management-card"
              style={{
                marginTop: 20,
                marginBottom: 24,
              }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Dernières transactions
                  </h2>

                  <p className="page-subtitle">
                    Opérations récentes en{" "}
                    {selectedCurrency}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate(
                      buildTransactionUrl()
                    )
                  }
                >
                  Voir toutes les transactions
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="management-empty">
                  <div className="management-empty-icon">
                    💳
                  </div>

                  <h3>Aucune transaction récente</h3>

                  <p>
                    Aucune opération disponible pour
                    cette devise.
                  </p>
                </div>
              ) : (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Libellé</th>
                        <th>Type</th>
                        <th>Catégorie</th>
                        <th>Compte</th>
                        <th>Montant</th>
                        <th>Statut</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentTransactions.map(
                        (transaction) => (
                          <tr key={transaction._id}>
                            <td>
                              {formatDate(
                                transaction.transactionDate
                              )}
                            </td>

                            <td>
                              <strong>
                                {transaction.title || "—"}
                              </strong>
                            </td>

                            <td>
                              {TRANSACTION_TYPES[
                                transaction.type
                              ] ||
                                transaction.type ||
                                "—"}
                            </td>

                            <td>
                              {transaction.category?.name ||
                                "—"}
                            </td>

                            <td>
                              {transaction.type === "transfer"
                                ? `${
                                    transaction.fromAccount
                                      ?.name || "—"
                                  } → ${
                                    transaction.toAccount
                                      ?.name || "—"
                                  }`
                                : transaction.account?.name ||
                                  "—"}
                            </td>

                            <td>
                              <strong>
                                {formatCurrency(
                                  transaction.amount || 0,
                                  transaction.currency ||
                                    selectedCurrency
                                )}
                              </strong>
                            </td>

                            <td>
                            <span
                              className={`status-badge ${
                                transaction.status === "confirmed"
                                  ? "status-active"
                                  : transaction.status === "draft"
                                  ? "status-pending"
                                  : transaction.status === "cancelled"
                                  ? "status-inactive"
                                  : ""
                              }`}
                            >
                              {transaction.status === "confirmed"
                                ? "Confirmée"
                                : transaction.status === "draft"
                                ? "Brouillon"
                                : transaction.status === "cancelled"
                                ? "Annulée"
                                : transaction.status || "—"}
                            </span>
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
