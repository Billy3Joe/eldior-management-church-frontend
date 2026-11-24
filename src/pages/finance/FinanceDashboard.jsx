import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

import API from "../../api/axios";
import Layout from "../../components/Layout";
import { formatCurrency } from "../../constants/currencies";

import "../../styles/ManagementPages.css";

// ======================================================
// CONSTANTES
// ======================================================

const COLORS = {
  blue: "#2554f4",
  green: "#16a34a",
  purple: "#8736ef",
  red: "#dc2626",
  orange: "#ea8b10",
};

const box = {
  background: "#fff",
  border: "1px solid #e1e7f5",
  borderRadius: 17,
  boxShadow: "0 4px 15px rgba(20,39,100,.045)",
};

const statGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
  gap: 12,
};

const statColors = {
  "Solde disponible": COLORS.blue,
  "Entrées de la période": COLORS.green,
  "Sorties de la période": COLORS.red,
  "Solde net de la période": COLORS.purple,
  "Dîmes": COLORS.blue,
  "Offrandes": COLORS.orange,
  "Dons": COLORS.green,
  "Sorties prévues": COLORS.blue,
  "Sorties réalisées": COLORS.red,
  "Alertes budget": COLORS.orange,
  "Budgets dépassés": COLORS.red,
  "Solde théorique": COLORS.blue,
  "Solde enregistré": COLORS.green,
  "Écart": COLORS.orange,
  "État général": COLORS.purple,
};

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
  return error?.response?.data?.message || fallback;
};

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const PERIOD_OPTIONS = [
  { value: "week", label: "Hebdomadaire" },
  { value: "month", label: "Mensuel" },
  { value: "quarter", label: "Trimestriel" },
  { value: "year", label: "Annuel" },
  { value: "all", label: "Toute la période" },
  { value: "custom", label: "Dates personnalisées" },
];

const getPeriodTitle = (
  period,
  month,
  year,
  startDate,
  endDate
) => {
  if (period === "all") {
    return "Toute la période";
  }

  if (period === "custom") {
    return `Du ${startDate} au ${endDate}`;
  }

  const monthLabel =
    MONTHS.find((item) => item.value === month)?.label || "";

  if (period === "year") {
    return `Année ${year}`;
  }

  if (period === "quarter") {
    return `Trimestre ${Math.ceil(month / 3)} — ${year}`;
  }

  if (period === "week") {
    return `Semaine de référence — ${monthLabel} ${year}`;
  }

  return `${monthLabel} ${year}`;
};

// ======================================================
// COMPOSANT PRINCIPAL
// ======================================================

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const currentPeriod = getCurrentPeriod();

  const [month, setMonth] = useState(currentPeriod.month);
  const [year, setYear] = useState(currentPeriod.year);

  const [period, setPeriod] = useState("month");

  const [weekDate, setWeekDate] = useState(
    () => isoDate(new Date())
  );

  const [customStart, setCustomStart] = useState(() =>
    isoDate(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
    )
  );

  const [customEnd, setCustomEnd] = useState(() =>
    isoDate(new Date())
  );

  const validPeriod =
    period !== "custom" ||
    (!!customStart &&
      !!customEnd &&
      customStart <= customEnd);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [defaultCurrency, setDefaultCurrency] =
    useState("");

  const [selectedCurrency, setSelectedCurrency] =
    useState("");

  // ====================================================
  // CALCUL DE LA SEMAINE
  // ====================================================

  const weekStart = new Date(`${weekDate}T00:00:00Z`);

  weekStart.setUTCDate(
    weekStart.getUTCDate() -
      (weekStart.getUTCDay() + 6) % 7
  );

  const weekEnd = new Date(
    weekStart.getTime() + 6 * 86400000
  );

  const periodTitle =
    period === "week"
      ? `Du ${weekStart.toISOString().slice(0, 10)} au ${weekEnd
          .toISOString()
          .slice(0, 10)}`
      : getPeriodTitle(
          period,
          month,
          year,
          customStart,
          customEnd
        );

  const periodParams = useMemo(
    () => ({
      period,
      month,
      year,

      ...(period === "week"
        ? { weekDate }
        : {}),

      ...(period === "custom"
        ? {
            startDate: customStart,
            endDate: customEnd,
          }
        : {}),
    }),
    [
      period,
      month,
      year,
      customStart,
      customEnd,
      weekDate,
    ]
  );

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
    transition:
      "transform 0.15s ease, box-shadow 0.15s ease",
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
    if (!validPeriod) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        dashboardResponse,
        settingsResponse,
      ] = await Promise.all([
        API.get("/finance/dashboard", {
          params: periodParams,
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
  }, [periodParams, validPeriod]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ====================================================
  // ANALYSE FINANCIÈRE ANNUELLE
  // ====================================================

  const [annualData, setAnnualData] = useState(null);

  const [annualError, setAnnualError] =
    useState(false);

  useEffect(() => {
    let active = true;

    setAnnualData(null);
    setAnnualError(false);

    API.get("/finance/dashboard", {
      params: {
        period: "year",
        year,
        month: 1,
      },
    })
      .then((response) => {
        if (active) {
          setAnnualData(response.data.data);
        }
      })
      .catch(() => {
        if (active) {
          setAnnualError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [year, data]);

  // ====================================================
  // COMPARAISON DES 12 MOIS
  // ====================================================

  const annualRows = useMemo(() => {
    if (!annualData || !selectedCurrency) {
      return [];
    }

    const now = new Date();

    const rows = MONTHS.map(({ value, label }) => ({
      Mois: label,

      Entrées: 0,
      Sorties: 0,

      Dîmes: 0,
      Offrandes: 0,
      Dons: 0,

      "Autres recettes": 0,

      future:
        new Date(Date.UTC(year, value - 1, 1)) > now,

      partial:
        year === now.getUTCFullYear() &&
        value === now.getUTCMonth() + 1,
    }));

    for (
      const item of
      annualData.movements?.dailyEvolution || []
    ) {
      if (
        String(item.currency).toUpperCase() !==
        selectedCurrency
      ) {
        continue;
      }

      const index =
        Number(String(item.day).slice(5, 7)) - 1;

      if (!rows[index]) continue;

      const fields = {
        Entrées: "income",
        Sorties: "expense",
        Dîmes: "tithe",
        Offrandes: "offering",
        Dons: "donation",
        "Autres recettes": "otherIncome",
      };

      for (
        const [label, key] of Object.entries(fields)
      ) {
        rows[index][label] += Number(item[key] || 0);
      }
    }

    return rows.map((row) => {
      const result = { ...row };

      for (const key of [
        "Entrées",
        "Sorties",
        "Dîmes",
        "Offrandes",
        "Dons",
        "Autres recettes",
      ]) {
        result[key] =
          row.future && !row[key]
            ? null
            : Math.round(row[key] * 100) / 100;
      }

      return result;
    });
  }, [annualData, selectedCurrency, year]);

  const categoriesReady =
    annualData?.movements?.categoryEvolutionVersion === 1;

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
        values.add(currency.toUpperCase());
      }
    });

    Object.keys(
      data?.movements?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(currency.toUpperCase());
      }
    });

    Object.keys(
      data?.budgets?.byCurrency || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(currency.toUpperCase());
      }
    });

    Object.keys(
      data?.reconciliation?.currencies || {}
    ).forEach((currency) => {
      if (currency) {
        values.add(currency.toUpperCase());
      }
    });

    return Array.from(values).sort();
  }, [data, defaultCurrency]);

  useEffect(() => {
    if (
      currencies.length &&
      !currencies.includes(selectedCurrency)
    ) {
      setSelectedCurrency(
        currencies.includes(defaultCurrency)
          ? defaultCurrency
          : currencies[0]
      );
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
      activeAccounts: 0,
      totalAccounts: 0,
      inactiveAccounts: 0,
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
      net: 0,

      incomeCount: 0,
      expenseCount: 0,

      tithe: 0,
      offering: 0,
      donation: 0,

      titheCount: 0,
      offeringCount: 0,
      donationCount: 0,

      donorCount: 0,
    };

  // ====================================================
  // STATISTIQUES BUDGÉTAIRES
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
  // RÉCONCILIATION FINANCIÈRE
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

  // ====================================================
  // GRAPHIQUES
  // ====================================================

  const chartData = useMemo(() => {
    if (!data || !selectedCurrency) {
      return [];
    }

    const DAY = 86400000;

    const movements = (
      data?.movements?.dailyEvolution || []
    ).filter(
      (item) =>
        String(item.currency || "").toUpperCase() ===
        selectedCurrency
    );

    const dailyMap = new Map();

    const toISO = (date) =>
      date.toISOString().slice(0, 10);

    const parseDate = (value) => {
      if (!value) return null;

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      date.setUTCHours(0, 0, 0, 0);

      return date;
    };

    // ==================================================
    // NORMALISATION DES MOUVEMENTS
    // ==================================================

    movements.forEach((item) => {
      const rawDay = String(item.day);

      const day = /^\d{1,2}$/.test(rawDay)
        ? `${year}-${String(month).padStart(
            2,
            "0"
          )}-${rawDay.padStart(2, "0")}`
        : rawDay.slice(0, 10);

      const date = parseDate(day);

      if (!date) return;

      const key = toISO(date);

      const previous = dailyMap.get(key) || {
        jour: key,
        Entrées: 0,
        Sorties: 0,
      };

      dailyMap.set(key, {
        jour: key,

        Entrées:
          previous.Entrées +
          Number(item.income || 0),

        Sorties:
          previous.Sorties +
          Number(item.expense || 0),
      });
    });

    // ==================================================
    // DATES DE LA PÉRIODE
    // ==================================================

    let start = parseDate(
      data?.period?.startDate
    );

    let end = parseDate(
      data?.period?.endDate
    );

    const availableDays = Array.from(
      dailyMap.keys()
    ).sort();

    if (period === "all") {
      if (availableDays.length === 0) {
        return [];
      }

      start = parseDate(availableDays[0]);

      end = parseDate(
        availableDays[availableDays.length - 1]
      );
    }

    if (!start || !end || start > end) {
      return Array.from(dailyMap.values()).sort(
        (a, b) => a.jour.localeCompare(b.jour)
      );
    }

    const duration =
      Math.floor((end - start) / DAY) + 1;

    // ==================================================
    // GRANULARITÉ DU GRAPHIQUE
    // ==================================================

    let granularity = "day";

    if (period === "quarter") {
      granularity = "week";
    }

    if (period === "year") {
      granularity = "month";
    }

    if (
      period === "all" ||
      period === "custom"
    ) {
      if (duration > 366 * 3) {
        granularity = "year";
      } else if (duration > 120) {
        granularity = "month";
      } else if (duration > 31) {
        granularity = "week";
      }
    }

    // ==================================================
    // REGROUPEMENT DES DATES
    // ==================================================

    const getBucket = (date) => {
      const result = new Date(date);

      if (granularity === "week") {
        const offset =
          (result.getUTCDay() + 6) % 7;

        result.setUTCDate(
          result.getUTCDate() - offset
        );
      }

      if (granularity === "month") {
        result.setUTCDate(1);
      }

      if (granularity === "year") {
        result.setUTCMonth(0, 1);
      }

      return toISO(result);
    };

    const grouped = new Map();

    // ==================================================
    // INITIALISATION DES PÉRIODES À ZÉRO
    // ==================================================

    let cursor = new Date(start);

    while (cursor <= end) {
      const key = getBucket(cursor);

      if (!grouped.has(key)) {
        grouped.set(key, {
          jour: key,

          Entrées: 0,
          Sorties: 0,

          granularite: granularity,
        });
      }

      if (granularity === "month") {
        cursor.setUTCDate(1);

        cursor.setUTCMonth(
          cursor.getUTCMonth() + 1
        );
      } else if (granularity === "year") {
        cursor.setUTCMonth(0, 1);

        cursor.setUTCFullYear(
          cursor.getUTCFullYear() + 1
        );
      } else if (granularity === "week") {
        cursor = new Date(
          parseDate(key).getTime() + 7 * DAY
        );
      } else {
        cursor = new Date(
          cursor.getTime() + DAY
        );
      }
    }

    // ==================================================
    // INTÉGRATION DES MONTANTS RÉELS
    // ==================================================

    dailyMap.forEach((item, day) => {
      const date = parseDate(day);

      if (
        !date ||
        date < start ||
        date > end
      ) {
        return;
      }

      const key = getBucket(date);

      const previous = grouped.get(key) || {
        jour: key,
        Entrées: 0,
        Sorties: 0,
        granularite: granularity,
      };

      grouped.set(key, {
        ...previous,

        Entrées: Number(
          (
            previous.Entrées +
            item.Entrées
          ).toFixed(2)
        ),

        Sorties: Number(
          (
            previous.Sorties +
            item.Sorties
          ).toFixed(2)
        ),
      });
    });

    // ==================================================
    // DISTINCTION DES PÉRIODES FUTURES
    // ==================================================

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    return Array.from(grouped.values())
      .map((row) =>
        row.jour > today &&
        !row.Entrées &&
        !row.Sorties
          ? {
              ...row,
              Entrées: null,
              Sorties: null,
            }
          : row
      )
      .sort(
        (a, b) =>
          a.jour.localeCompare(b.jour)
      );
  }, [
    data,
    selectedCurrency,
    month,
    year,
    period,
  ]);

  // ====================================================
  // COMPTES FINANCIERS
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
  }, [data, selectedCurrency]);

  // ====================================================
  // TRANSACTIONS RÉCENTES
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
  }, [data, selectedCurrency]);

  // ====================================================
  // PÉRIODE SÉLECTIONNÉE
  // ====================================================

  const selectedMonthLabel =
    MONTHS.find(
      (item) => item.value === Number(month)
    )?.label || "";

  // ====================================================
  // EXPORT EXCEL
  // ====================================================

  const exportExcel = () => {
    if (!data || !selectedCurrency) {
      return;
    }

    const summary = [
      ["Bilan financier", periodTitle],

      ["Devise", selectedCurrency],

      ["Entrées", movementStats.income],

      ["Sorties", movementStats.expense],

      [
        "Solde net des mouvements",
        movementStats.net,
      ],

      ["Dîmes", movementStats.tithe],

      ["Offrandes", movementStats.offering],

      ["Dons", movementStats.donation],

      [
        "Donateurs identifiés",
        movementStats.donorCount,
      ],

      [
        "Solde actuel des comptes (non historique)",
        accountStats.totalBalance,
      ],
    ];

    const workbook = XLSX.utils.book_new();

    // SYNTHÈSE FINANCIÈRE

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(summary),
      "Synthèse"
    );

    // ÉVOLUTION FINANCIÈRE

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(chartData),
      "Évolution"
    );

    // COMPTES FINANCIERS

    XLSX.utils.book_append_sheet(
      workbook,

      XLSX.utils.json_to_sheet(
        currencyAccounts.map((account) => ({
          Compte: account.name,

          Type:
            ACCOUNT_TYPES[account.type] ||
            account.type,

          Devise: account.currency,

          "Solde initial":
            account.openingBalance,

          "Solde actuel":
            account.currentBalance,

          Statut:
            account.isActive
              ? "Actif"
              : "Inactif",
        }))
      ),

      "Comptes"
    );

    // COMPARATIF ANNUEL

    if (annualRows.length) {
      const annualExport = annualRows.map(
        ({ future, partial, ...row }) => {
          if (!categoriesReady) {
            delete row.Dîmes;
            delete row.Offrandes;
            delete row.Dons;
            delete row["Autres recettes"];
          }

          return {
            ...row,

            État: future
              ? "Futur"
              : partial
              ? "En cours"
              : "Clôturé",
          };
        }
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(annualExport),
        "Comparatif annuel"
      );
    }

    // ENREGISTREMENT DU FICHIER

    XLSX.writeFile(
      workbook,
      `finances_${period}_${selectedCurrency}_${year}.xlsx`
    );
  };

  // ====================================================
  // EXPORT PDF
  // ====================================================

  const exportPDF = () => {
    window.print();
  };

  // ====================================================
  // CHARGEMENT INITIAL
  // ====================================================

  if (loading && !data) {
    return (
      <Layout>
        <div
          className="management-page"
          style={{ paddingBottom: 40 }}
        >
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
  }  // ====================================================
  // COMPOSANTS ET OUTILS D'AFFICHAGE
  // ====================================================

  const money = (value) =>
    value === null || value === undefined
      ? "—"
      : formatCurrency(Number(value), selectedCurrency);

  const numberValue = (value) => Number(value || 0);

  const primary = "#5030ef";

  const shortMonths = [
    "Jan.", "Fév.", "Mars", "Avr.",
    "Mai", "Juin", "Juil.", "Août",
    "Sept.", "Oct.", "Nov.", "Déc.",
  ];

  const buttonStyle = (active) => ({
    border: "1px solid #dedcff",
    borderRadius: 10,
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: 700,
    background: active ? primary : "#f7f8ff",
    color: active ? "#fff" : "#171c60",
  });

  const budgetedExpense = numberValue(
    budgetStats.budgetedExpense
  );

  const actualExpense = numberValue(
    budgetStats.actualExpense
  );

  const budgetConsumption =
    budgetedExpense > 0
      ? (actualExpense / budgetedExpense) * 100
      : null;

  const budgetColor =
    budgetConsumption >= 100
      ? COLORS.red
      : budgetConsumption >= 80
      ? COLORS.orange
      : COLORS.green;

  const hasReconciliation = Boolean(
    data?.reconciliation?.currencies?.[selectedCurrency]
  );

  const reconciliationBalanced =
    Math.abs(
      numberValue(reconciliationStats.difference)
    ) < 0.01;

  // ====================================================
  // COMPOSANT CARTE STATISTIQUE
  // ====================================================

  const StatCard = ({
    label,
    value,
    description,
    color,
    onClick,
  }) => (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        ...box,
        borderTop: `4px solid ${color || COLORS.blue}`,
        padding: 20,
        minHeight: 145,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#171c60",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "clamp(24px, 3vw, 36px)",
          fontWeight: 800,
          color: "#11184d",
          marginTop: 20,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#64799c",
          fontSize: 12,
          marginTop: 8,
        }}
      >
        {description}
      </div>
    </div>
  );

  // ====================================================
  // COMPOSANT SECTION FINANCIÈRE
  // ====================================================

  const FinanceSection = ({
    title,
    subtitle,
    actionLabel,
    onAction,
    children,
  }) => (
    <section
      style={{
        ...box,
        padding: 20,
        marginTop: 20,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: "#10172e",
            }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              style={{
                fontSize: 12,
                color: "#64799c",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {children}
    </section>
  );

  // ====================================================
  // COMPOSANT ÉTAT VIDE
  // ====================================================

  const EmptyState = ({
    icon = "📊",
    title,
    message,
  }) => (
    <div
      style={{
        minHeight: 170,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          display: "grid",
          placeItems: "center",
          borderRadius: 16,
          background: "#f0f3f8",
          fontSize: 25,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>

      {title && (
        <strong style={{ color: "#171c60" }}>
          {title}
        </strong>
      )}

      <p
        style={{
          fontSize: 13,
          color: "#8292b0",
        }}
      >
        {message}
      </p>
    </div>
  );

  // ====================================================
  // FORMATAGE DES ABSCISSES
  // ====================================================

  const formatChartDate = (value, granularity) => {
    const date = new Date(`${value}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    if (granularity === "year") {
      return String(date.getUTCFullYear());
    }

    if (granularity === "month") {
      return shortMonths[date.getUTCMonth()];
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }).format(date);
  };

  // ====================================================
  // INFOBULLE DES GRAPHIQUES
  // ====================================================

  const FinancialTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #dce4f2",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 5px 20px rgba(0,0,0,.08)",
        }}
      >
        <strong style={{ color: "#171c60" }}>
          {label}
        </strong>

        {payload.map((item) => (
          <div
            key={item.dataKey}
            style={{
              marginTop: 8,
              color: item.color,
              fontSize: 13,
            }}
          >
            {item.name} :{" "}
            <strong>{money(item.value)}</strong>
          </div>
        ))}
      </div>
    );
  };

  // ====================================================
  // COMPOSANT GRAPHIQUE FINANCIER
  // ====================================================

  const FinancialChart = ({
    rows,
    xKey,
    series,
    annual = false,
  }) => {
    if (!rows.length) {
      return (
        <EmptyState
          message="Aucune donnée disponible pour cette période."
        />
      );
    }

    const granularity =
      rows[0]?.granularite || "day";

    return (
      <div
        style={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            minWidth: annual ? 700 : 450,
            height: 340,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={rows}
              margin={{
                top: 15,
                right: 20,
                left: 15,
                bottom: 15,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#dce5f4"
              />

              <XAxis
                dataKey={xKey}
                interval={
                  annual ||
                  granularity === "month" ||
                  rows.length <= 12
                    ? 0
                    : "preserveStartEnd"
                }
                tick={{
                  fontSize: 12,
                  fill: "#64748b",
                }}
                tickMargin={10}
                tickFormatter={(value) => {
                  if (annual) {
                    const index = MONTHS.findIndex(
                      (item) => item.label === value
                    );

                    return index >= 0
                      ? shortMonths[index]
                      : value;
                  }

                  return formatChartDate(
                    value,
                    granularity
                  );
                }}
              />

              <YAxis
                width={75}
                tick={{
                  fontSize: 12,
                  fill: "#64748b",
                }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat(
                    "fr-FR",
                    {
                      maximumFractionDigits: 2,
                    }
                  ).format(value)
                }
              />

              <Tooltip
                content={<FinancialTooltip />}
              />

              <Legend
                verticalAlign="bottom"
                wrapperStyle={{
                  paddingTop: 15,
                }}
              />

              {series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label || item.key}
                  stroke={item.color}
                  strokeWidth={3}
                  connectNulls={false}
                  isAnimationActive={false}
                  dot={{
                    r: 3.5,
                    fill: "#fff",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ====================================================
  // SÉRIES DES GRAPHIQUES
  // ====================================================

  const financialSeries = [
    {
      key: "Entrées",
      color: COLORS.green,
    },
    {
      key: "Sorties",
      color: COLORS.red,
    },
  ];

  const contributionSeries = [
    {
      key: "Dîmes",
      color: COLORS.blue,
    },
    {
      key: "Offrandes",
      color: COLORS.orange,
    },
    {
      key: "Dons",
      color: COLORS.green,
    },
    {
      key: "Autres recettes",
      color: COLORS.purple,
    },
  ];

  // ====================================================
  // ANALYSE DES VARIATIONS MENSUELLES
  // ====================================================

  const calculateVariation = (
    current,
    previous
  ) => {
    if (
      current === null ||
      current === undefined ||
      previous === null ||
      previous === undefined
    ) {
      return {
        label: "—",
        color: "#64748b",
      };
    }

    if (previous === 0 && current === 0) {
      return {
        label: "Stable",
        color: "#64748b",
      };
    }

    if (previous === 0 && current > 0) {
      return {
        label: "Reprise",
        color: COLORS.green,
      };
    }

    const percentage =
      ((current - previous) / previous) * 100;

    if (Math.abs(percentage) < 0.01) {
      return {
        label: "0 %",
        color: "#64748b",
      };
    }

    return {
      label: `${
        percentage > 0 ? "+" : ""
      }${percentage.toLocaleString("fr-FR", {
        maximumFractionDigits: 1,
      })} %`,

      color:
        percentage > 0
          ? COLORS.green
          : COLORS.red,
    };
  };

  // ====================================================
  // VARIATION D'UN MOIS CLÔTURÉ
  // ====================================================

  const getMonthlyVariation = (
    index,
    field
  ) => {
    const current = annualRows[index];
    const previous = annualRows[index - 1];

    if (!current) {
      return {
        label: "—",
        color: "#64748b",
      };
    }

    if (current.future) {
      return {
        label: "Mois futur",
        color: "#94a3b8",
      };
    }

    if (current.partial) {
      return {
        label: "En cours",
        color: COLORS.orange,
      };
    }

    if (
      !previous ||
      previous.future ||
      previous.partial
    ) {
      return {
        label: "—",
        color: "#64748b",
      };
    }

    return calculateVariation(
      current[field],
      previous[field]
    );
  };

  // ====================================================
  // DERNIERS MOIS CLÔTURÉS
  // ====================================================

  const closedMonths = annualRows.filter(
    (row) => !row.future && !row.partial
  );

  const lastClosedMonth =
    closedMonths[closedMonths.length - 1];

  const previousClosedMonth =
    closedMonths[closedMonths.length - 2];

  const trendFields = [
    {
      key: "Entrées",
      label: "Évolution des entrées",
      color: COLORS.green,
    },
    {
      key: "Dîmes",
      label: "Évolution des dîmes",
      color: COLORS.blue,
    },
    {
      key: "Offrandes",
      label: "Évolution des offrandes",
      color: COLORS.orange,
    },
    {
      key: "Dons",
      label: "Évolution des dons",
      color: COLORS.purple,
    },
    {
      key: "Autres recettes",
      label: "Évolution des autres recettes",
      color: COLORS.purple,
    },
  ];

  const otherIncome = Math.max(
    0,
    numberValue(movementStats.income) -
      numberValue(movementStats.tithe) -
      numberValue(movementStats.offering) -
      numberValue(movementStats.donation)
  );

  // ====================================================
  // ANNÉES DISPONIBLES
  // ====================================================

  const yearOptions = Array.from(
    { length: 101 },
    (_, index) => 2000 + index
  );

  // ====================================================
  // INTERFACE PRINCIPALE
  // ====================================================

  return (
    <Layout>
      <div
        className="management-page"
        style={{
          paddingBottom: 40,
        }}
      >
        {/* ============================================ */}
        {/* EN-TÊTE                                     */}
        {/* ============================================ */}

        <div
          className="page-header"
          style={{
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <h1 className="page-title">
              Tableau de bord financier
            </h1>

            <p className="page-subtitle">
              Pilotage financier de l'église —{" "}
              {periodTitle}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-success"
              onClick={exportExcel}
              disabled={
                !data ||
                loading ||
                !validPeriod ||
                !selectedCurrency
              }
            >
              📊 Export Excel
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={exportPDF}
              disabled={
                !data ||
                loading ||
                !validPeriod ||
                !selectedCurrency
              }
            >
              🖨️ Export PDF
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchDashboard}
              disabled={loading || !validPeriod}
            >
              {loading
                ? "Actualisation..."
                : "↻ Actualiser"}
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* FILTRES                                     */}
        {/* ============================================ */}

        <section
          style={{
            ...box,
            padding: 16,
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* TYPES DE BILAN */}

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {PERIOD_OPTIONS.slice(0, 4).map(
                (option) => (
                  <button
                    key={option.value}
                    type="button"
                    style={buttonStyle(
                      period === option.value
                    )}
                    aria-pressed={
                      period === option.value
                    }
                    onClick={() =>
                      setPeriod(option.value)
                    }
                  >
                    {option.label}
                  </button>
                )
              )}
            </div>

            {/* SÉLECTEURS DYNAMIQUES */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {/* SEMAINE */}

              {period === "week" && (
                <>
                  <label
                    htmlFor="finance-week"
                    style={{ fontWeight: 700 }}
                  >
                    Semaine
                  </label>

                  <input
                    id="finance-week"
                    type="date"
                    className="form-input"
                    value={weekDate}
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      if (!value) return;

                      setWeekDate(value);

                      const [y, m] = value
                        .split("-")
                        .map(Number);

                      setYear(y);
                      setMonth(m);
                    }}
                    style={{
                      width: "auto",
                    }}
                  />
                </>
              )}

              {/* MOIS */}

              {period === "month" && (
                <>
                  <label
                    htmlFor="finance-month"
                    style={{ fontWeight: 700 }}
                  >
                    Période
                  </label>

                  <input
                    id="finance-month"
                    type="month"
                    className="form-input"
                    value={`${year}-${String(
                      month
                    ).padStart(2, "0")}`}
                    onChange={(event) => {
                      if (!event.target.value) {
                        return;
                      }

                      const [y, m] =
                        event.target.value
                          .split("-")
                          .map(Number);

                      setYear(y);
                      setMonth(m);
                    }}
                    style={{
                      width: "auto",
                    }}
                  />
                </>
              )}

              {/* TRIMESTRE */}

              {period === "quarter" && (
                <>
                  <label
                    htmlFor="finance-quarter"
                    style={{ fontWeight: 700 }}
                  >
                    Trimestre
                  </label>

                  <select
                    id="finance-quarter"
                    className="management-select"
                    value={Math.ceil(month / 3)}
                    onChange={(event) =>
                      setMonth(
                        (Number(
                          event.target.value
                        ) -
                          1) *
                          3 +
                          1
                      )
                    }
                  >
                    <option value={1}>
                      T1 — Janvier à mars
                    </option>

                    <option value={2}>
                      T2 — Avril à juin
                    </option>

                    <option value={3}>
                      T3 — Juillet à septembre
                    </option>

                    <option value={4}>
                      T4 — Octobre à décembre
                    </option>
                  </select>
                </>
              )}

              {/* ANNÉE */}

              {(period === "quarter" ||
                period === "year") && (
                <>
                  <label
                    htmlFor="finance-year"
                    style={{ fontWeight: 700 }}
                  >
                    Année
                  </label>

                  <select
                    id="finance-year"
                    className="management-select"
                    value={year}
                    onChange={(event) =>
                      setYear(
                        Number(event.target.value)
                      )
                    }
                  >
                    {yearOptions.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* AUTRES OPTIONS */}

              <select
                className="management-select"
                aria-label="Options de période"
                value={
                  period === "all" ||
                  period === "custom"
                    ? period
                    : "selection"
                }
                onChange={(event) =>
                  setPeriod(event.target.value)
                }
              >
                <option
                  value="selection"
                  disabled
                >
                  Options
                </option>

                <option value="all">
                  Toute la période
                </option>

                <option value="custom">
                  Dates personnalisées
                </option>
              </select>

              {/* DEVISE */}

              <label
                htmlFor="finance-currency"
                style={{ fontWeight: 700 }}
              >
                Devise
              </label>

              <select
                id="finance-currency"
                className="management-select"
                value={selectedCurrency}
                onChange={(event) =>
                  setSelectedCurrency(
                    event.target.value
                  )
                }
                disabled={!currencies.length}
              >
                {!currencies.length && (
                  <option value="">
                    Aucune devise
                  </option>
                )}

                {currencies.map((currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DATES PERSONNALISÉES */}

          {period === "custom" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 16,
              }}
            >
              <label htmlFor="finance-start">
                Du
              </label>

              <input
                id="finance-start"
                type="date"
                className="form-input"
                value={customStart}
                max={customEnd}
                onChange={(event) =>
                  setCustomStart(
                    event.target.value
                  )
                }
                style={{ width: "auto" }}
              />

              <label htmlFor="finance-end">
                Au
              </label>

              <input
                id="finance-end"
                type="date"
                className="form-input"
                value={customEnd}
                min={customStart}
                onChange={(event) =>
                  setCustomEnd(
                    event.target.value
                  )
                }
                style={{ width: "auto" }}
              />
            </div>
          )}

          <p
            className="page-subtitle"
            style={{
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Période affichée : {periodTitle}
          </p>

          {period === "week" && (
            <p
              style={{
                fontSize: 12,
                color: "#64799c",
                marginBottom: 0,
              }}
            >
              Sélectionne n'importe quel jour
              de la semaine à analyser.
              Le bilan couvre le lundi au dimanche.
            </p>
          )}

          {!validPeriod && (
            <p
              style={{
                color: COLORS.red,
                fontSize: 13,
              }}
            >
              La date de début doit être
              antérieure ou égale à la date de fin.
            </p>
          )}
        </section>

        {/* ============================================ */}
        {/* ÉTATS DE CHARGEMENT                         */}
        {/* ============================================ */}

        {!validPeriod ? (
          <div className="management-card">
            <EmptyState
              icon="📅"
              title="Période invalide"
              message="Vérifie les dates sélectionnées."
            />
          </div>
        ) : loading ? (
          <div className="management-card">
            <EmptyState
              icon="⏳"
              message="Actualisation des données financières..."
            />
          </div>
        ) : !data || !selectedCurrency ? (
          <div className="management-card">
            <EmptyState
              icon="💰"
              title="Données indisponibles"
              message="Vérifie la connexion puis actualise le tableau de bord."
            />
          </div>
        ) : (
          <>
            {/* ======================================== */}
            {/* INDICATEURS FINANCIERS                   */}
            {/* ======================================== */}

            <div style={statGrid}>
              <StatCard
                label="Solde disponible"
                value={money(
                  accountStats.totalBalance
                )}
                description={`${accountStats.activeAccounts} compte(s) actif(s) — solde actuel`}
                color={COLORS.blue}
                onClick={() =>
                  navigate("/finance/accounts")
                }
              />

              <StatCard
                label="Entrées de la période"
                value={money(
                  movementStats.income
                )}
                description={`${movementStats.incomeCount} mouvement(s)`}
                color={COLORS.green}
                onClick={() =>
                  navigate(
                    buildTransactionUrl({
                      type: "income",
                    })
                  )
                }
              />

              <StatCard
                label="Sorties de la période"
                value={money(
                  movementStats.expense
                )}
                description={`${movementStats.expenseCount} mouvement(s)`}
                color={COLORS.red}
                onClick={() =>
                  navigate(
                    buildTransactionUrl({
                      type: "expense",
                    })
                  )
                }
              />

              <StatCard
                label="Solde net de la période"
                value={money(
                  movementStats.net
                )}
                description="Entrées - sorties"
                color={COLORS.purple}
                onClick={() =>
                  navigate(
                    buildTransactionUrl()
                  )
                }
              />
            </div>

            {/* ======================================== */}
            {/* ÉVOLUTION DE LA PÉRIODE                  */}
            {/* ======================================== */}

            <FinanceSection
              title={`Évolution financière — ${periodTitle}`}
              subtitle={`Comparaison des entrées et sorties — ${selectedCurrency}`}
            >
              <FinancialChart
                rows={chartData}
                xKey="jour"
                series={financialSeries}
              />
            </FinanceSection>

            {/* ======================================== */}
            {/* ENTRÉES DE L'ÉGLISE                      */}
            {/* ======================================== */}

            <FinanceSection
              title="Entrées de l'église"
              subtitle={`Répartition des recettes — ${periodTitle}`}
            >
              <div style={statGrid}>
                <StatCard
                  label="Dîmes"
                  value={money(
                    movementStats.tithe
                  )}
                  description={`${movementStats.titheCount} mouvement(s)`}
                  color={COLORS.blue}
                  onClick={() =>
                    navigate(
                      buildTransactionUrl({
                        type: "income",
                        search: "Dîme",
                      })
                    )
                  }
                />

                <StatCard
                  label="Offrandes"
                  value={money(
                    movementStats.offering
                  )}
                  description={`${movementStats.offeringCount} mouvement(s)`}
                  color={COLORS.orange}
                  onClick={() =>
                    navigate(
                      buildTransactionUrl({
                        type: "income",
                        search: "Offrande",
                      })
                    )
                  }
                />

                <StatCard
                  label="Dons"
                  value={money(
                    movementStats.donation
                  )}
                  description={`${movementStats.donationCount} mouvement(s)`}
                  color={COLORS.green}
                  onClick={() =>
                    navigate(
                      buildTransactionUrl({
                        type: "income",
                        search: "Don",
                      })
                    )
                  }
                />

                <StatCard
                  label="Autres recettes"
                  value={money(otherIncome)}
                  description="Recettes hors dîmes, offrandes et dons"
                  color={COLORS.purple}
                />

                <StatCard
                  label="Donateurs identifiés"
                  value={
                    movementStats.donorCount || 0
                  }
                  description="Hors dons anonymes"
                  color={COLORS.blue}
                />
              </div>
            </FinanceSection>

            {/* ======================================== */}
            {/* ANALYSE COMPARATIVE ANNUELLE             */}
            {/* ======================================== */}

            <FinanceSection
              title="Analyse comparative annuelle"
              subtitle="Suivi de la santé financière et de l'évolution des recettes de l'église."
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  padding: 14,
                  background: "#f5f6ff",
                  borderRadius: 12,
                  marginBottom: 18,
                }}
              >
                <div>
                  <strong
                    style={{
                      color: "#171c60",
                    }}
                  >
                    Année d'analyse : {year}
                  </strong>

                  <p
                    style={{
                      color: "#64799c",
                      fontSize: 12,
                      marginBottom: 0,
                      marginTop: 5,
                    }}
                  >
                    Comparaison de janvier à
                    décembre, indépendamment
                    du type de bilan sélectionné.
                  </p>
                </div>

                <select
                  className="management-select"
                  aria-label="Année d'analyse"
                  value={year}
                  onChange={(event) => {
                    const nextYear = Number(
                      event.target.value
                    );

                    setYear(nextYear);

                    if (period === "week") {
                      setPeriod("year");
                    }
                  }}
                >
                  {yearOptions.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {annualError ? (
                <EmptyState
                  icon="⚠️"
                  message="Impossible de charger le comparatif annuel."
                />
              ) : !annualData ? (
                <EmptyState
                  icon="⏳"
                  message="Chargement du comparatif annuel..."
                />
              ) : (
                <>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#171c60",
                      marginBottom: 8,
                    }}
                  >
                    Entrées et sorties mensuelles
                  </h3>

                  <FinancialChart
                    rows={annualRows}
                    xKey="Mois"
                    series={financialSeries}
                    annual
                  />

                  <p
                    style={{
                      color: "#64799c",
                      fontSize: 12,
                    }}
                  >
                    Les mois futurs sans mouvement
                    ne sont pas représentés à zéro
                    afin de ne pas fausser la lecture
                    de l'évolution financière.
                  </p>
                </>
              )}
            </FinanceSection>

            {/* ======================================== */}
            {/* ÉVOLUTION DES CONTRIBUTIONS              */}
            {/* ======================================== */}

            <FinanceSection
              title={`Évolution des contributions — ${year}`}
              subtitle="Comparaison mensuelle des dîmes, offrandes, dons et autres recettes."
            >
              {annualError ? (
                <EmptyState
                  icon="⚠️"
                  message="Les données annuelles sont indisponibles."
                />
              ) : !annualData ? (
                <EmptyState
                  icon="⏳"
                  message="Chargement des contributions..."
                />
              ) : !categoriesReady ? (
                <EmptyState
                  icon="📊"
                  title="Statistiques détaillées indisponibles"
                  message="Le contrôleur financier doit transmettre les données d'évolution par catégorie."
                />
              ) : (
                <FinancialChart
                  rows={annualRows}
                  xKey="Mois"
                  series={contributionSeries}
                  annual
                />
              )}
            </FinanceSection>

            {/* ======================================== */}
            {/* GRAPHIQUE DES DÎMES                       */}
            {/* ======================================== */}

            {categoriesReady && (
              <FinanceSection
                title={`Évolution des dîmes — ${year}`}
                subtitle="Suivi des dîmes enregistrées chaque mois."
              >
                <FinancialChart
                  rows={annualRows}
                  xKey="Mois"
                  series={[
                    {
                      key: "Dîmes",
                      color: COLORS.blue,
                    },
                  ]}
                  annual
                />
              </FinanceSection>
            )}

            {/* ======================================== */}
            {/* GRAPHIQUE DES OFFRANDES                   */}
            {/* ======================================== */}

            {categoriesReady && (
              <FinanceSection
                title={`Évolution des offrandes — ${year}`}
                subtitle="Comparaison des offrandes mensuelles de l'église."
              >
                <FinancialChart
                  rows={annualRows}
                  xKey="Mois"
                  series={[
                    {
                      key: "Offrandes",
                      color: COLORS.orange,
                    },
                  ]}
                  annual
                />
              </FinanceSection>
            )}

            {/* ======================================== */}
            {/* GRAPHIQUE DES DONS                        */}
            {/* ======================================== */}

            {categoriesReady && (
              <FinanceSection
                title={`Évolution des dons — ${year}`}
                subtitle="Suivi des dons et des autres sources de financement."
              >
                <FinancialChart
                  rows={annualRows}
                  xKey="Mois"
                  series={[
                    {
                      key: "Dons",
                      color: COLORS.green,
                    },
                    {
                      key: "Autres recettes",
                      color: COLORS.purple,
                    },
                  ]}
                  annual
                />
              </FinanceSection>
            )}

            {/* ======================================== */}
            {/* TENDANCES FINANCIÈRES                     */}
            {/* ======================================== */}

            <FinanceSection
              title="Tendances financières"
              subtitle={
                lastClosedMonth &&
                previousClosedMonth
                  ? `Comparaison : ${lastClosedMonth.Mois} / ${previousClosedMonth.Mois} ${year}`
                  : "Comparaison des deux derniers mois écoulés."
              }
            >
              {!lastClosedMonth ||
              !previousClosedMonth ? (
                <EmptyState
                  message="Deux mois écoulés sont nécessaires pour calculer une tendance mensuelle."
                />
              ) : (
                <div style={statGrid}>
                  {trendFields
                    .filter(
                      (field) =>
                        categoriesReady ||
                        field.key === "Entrées"
                    )
                    .map((field) => {
                      const variation =
                        calculateVariation(
                          lastClosedMonth[
                            field.key
                          ],
                          previousClosedMonth[
                            field.key
                          ]
                        );

                      return (
                        <StatCard
                          key={field.key}
                          label={field.label}
                          value={variation.label}
                          color={variation.color}
                          description={`${money(
                            lastClosedMonth[
                              field.key
                            ]
                          )} contre ${money(
                            previousClosedMonth[
                              field.key
                            ]
                          )}`}
                        />
                      );
                    })}
                </div>
              )}

              <p
                style={{
                  fontSize: 12,
                  color: "#64799c",
                  marginTop: 15,
                  marginBottom: 0,
                }}
              >
                Une variation positive indique
                une augmentation des recettes.
                Une variation négative indique
                une diminution. Le mois en cours
                est exclu du calcul.
              </p>
            </FinanceSection>

            {/* ======================================== */}
            {/* TABLEAU COMPARATIF MENSUEL               */}
            {/* ======================================== */}

            <FinanceSection
              title={`Comparatif mensuel détaillé — ${year}`}
              subtitle="Montants enregistrés pour chaque mois de l'année."
            >
              {!annualRows.length ? (
                <EmptyState
                  message="Aucune donnée annuelle disponible."
                />
              ) : (
                <div
                  className="management-table-wrapper"
                  style={{
                    overflowX: "auto",
                  }}
                >
                  <table
                    className="management-table"
                    style={{
                      minWidth: 850,
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Mois</th>

                        <th>Entrées</th>

                        {categoriesReady && (
                          <>
                            <th>Dîmes</th>
                            <th>Offrandes</th>
                            <th>Dons</th>
                            <th>Autres recettes</th>
                          </>
                        )}

                        <th>Sorties</th>
                        <th>Solde net</th>
                        <th>Variation des entrées</th>
                      </tr>
                    </thead>

                    <tbody>
                      {annualRows.map(
                        (row, index) => {
                          const variation =
                            getMonthlyVariation(
                              index,
                              "Entrées"
                            );

                          return (
                            <tr
                              key={row.Mois}
                              style={{
                                background:
                                  row.partial
                                    ? "#f5f3ff"
                                    : undefined,
                              }}
                            >
                              <td>
                                <strong>
                                  {row.Mois}
                                </strong>

                                {row.partial && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color:
                                        COLORS.orange,
                                    }}
                                  >
                                    Mois en cours
                                  </div>
                                )}

                                {row.future && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "#94a3b8",
                                    }}
                                  >
                                    Mois futur
                                  </div>
                                )}
                              </td>

                              <td
                                style={{
                                  color:
                                    COLORS.green,
                                  fontWeight: 700,
                                }}
                              >
                                {money(
                                  row.Entrées
                                )}
                              </td>

                              {categoriesReady && (
                                <>
                                  <td>
                                    {money(
                                      row.Dîmes
                                    )}
                                  </td>

                                  <td>
                                    {money(
                                      row.Offrandes
                                    )}
                                  </td>

                                  <td>
                                    {money(
                                      row.Dons
                                    )}
                                  </td>

                                  <td>
                                    {money(
                                      row[
                                        "Autres recettes"
                                      ]
                                    )}
                                  </td>
                                </>
                              )}

                              <td
                                style={{
                                  color: COLORS.red,
                                }}
                              >
                                {money(
                                  row.Sorties
                                )}
                              </td>

                              <td
                                style={{
                                  fontWeight: 700,
                                }}
                              >
                                {row.Entrées ===
                                  null &&
                                row.Sorties ===
                                  null
                                  ? "—"
                                  : money(
                                      numberValue(
                                        row.Entrées
                                      ) -
                                        numberValue(
                                          row.Sorties
                                        )
                                    )}
                              </td>

                              <td
                                style={{
                                  fontWeight: 700,
                                  color:
                                    variation.color,
                                }}
                              >
                                {variation.label}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>

                    <tfoot>
                      <tr
                        style={{
                          background: "#f1f4ff",
                          fontWeight: 800,
                        }}
                      >
                        <td>TOTAL ANNUEL</td>

                        <td
                          style={{
                            color: COLORS.green,
                          }}
                        >
                          {money(
                            annualRows.reduce(
                              (total, row) =>
                                total +
                                numberValue(
                                  row.Entrées
                                ),
                              0
                            )
                          )}
                        </td>

                        {categoriesReady &&
                          [
                            "Dîmes",
                            "Offrandes",
                            "Dons",
                            "Autres recettes",
                          ].map((field) => (
                            <td key={field}>
                              {money(
                                annualRows.reduce(
                                  (total, row) =>
                                    total +
                                    numberValue(
                                      row[field]
                                    ),
                                  0
                                )
                              )}
                            </td>
                          ))}

                        <td
                          style={{
                            color: COLORS.red,
                          }}
                        >
                          {money(
                            annualRows.reduce(
                              (total, row) =>
                                total +
                                numberValue(
                                  row.Sorties
                                ),
                              0
                            )
                          )}
                        </td>

                        <td>
                          {money(
                            annualRows.reduce(
                              (total, row) =>
                                total +
                                numberValue(
                                  row.Entrées
                                ) -
                                numberValue(
                                  row.Sorties
                                ),
                              0
                            )
                          )}
                        </td>

                        <td>—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </FinanceSection>

            {/* ======================================== */}
            {/* VARIATIONS PAR CATÉGORIE                 */}
            {/* ======================================== */}

            {categoriesReady && (
              <FinanceSection
                title="Variations mensuelles par catégorie"
                subtitle="Identification des sources de recettes en hausse ou en baisse."
              >
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Mois</th>
                        <th>Entrées</th>
                        <th>Dîmes</th>
                        <th>Offrandes</th>
                        <th>Dons</th>
                        <th>Autres recettes</th>
                      </tr>
                    </thead>

                    <tbody>
                      {annualRows.map(
                        (row, index) => (
                          <tr key={row.Mois}>
                            <td>
                              <strong>
                                {row.Mois}
                              </strong>
                            </td>

                            {[
                              "Entrées",
                              "Dîmes",
                              "Offrandes",
                              "Dons",
                              "Autres recettes",
                            ].map((field) => {
                              const variation =
                                getMonthlyVariation(
                                  index,
                                  field
                                );

                              return (
                                <td
                                  key={field}
                                  style={{
                                    color:
                                      variation.color,
                                    fontWeight: 700,
                                  }}
                                >
                                  {variation.label}
                                </td>
                              );
                            })}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <p
                  style={{
                    color: "#64799c",
                    fontSize: 12,
                    marginTop: 15,
                  }}
                >
                  Les variations sont calculées
                  par rapport au mois précédent.
                  Une reprise depuis zéro est
                  signalée sans pourcentage,
                  car la division par zéro
                  est impossible.
                </p>
              </FinanceSection>
            )}

            {/* ======================================== */}
            {/* SUIVI BUDGÉTAIRE                         */}
            {/* ======================================== */}

            <FinanceSection
              title="Suivi budgétaire"
              subtitle="Prévisions, réalisations et alertes budgétaires."
              actionLabel="Voir les budgets"
              onAction={() =>
                navigate("/finance/budgets")
              }
            >
              <div style={statGrid}>
                <StatCard
                  label="Sorties prévues"
                  value={money(
                    budgetStats.budgetedExpense
                  )}
                  description="Dépenses budgétisées"
                  color={COLORS.blue}
                  onClick={() =>
                    navigate("/finance/budgets")
                  }
                />

                <StatCard
                  label="Sorties réalisées"
                  value={money(
                    budgetStats.actualExpense
                  )}
                  description="Dépenses enregistrées"
                  color={COLORS.red}
                  onClick={() =>
                    navigate("/finance/budgets")
                  }
                />

                <StatCard
                  label="Alertes budget"
                  value={
                    budgetStats.alertBudgets || 0
                  }
                  description="Seuils atteints"
                  color={COLORS.orange}
                  onClick={() =>
                    navigate("/finance/budgets")
                  }
                />

                <StatCard
                  label="Budgets dépassés"
                  value={
                    budgetStats.exceededBudgets ||
                    0
                  }
                  description="Dépassements constatés"
                  color={COLORS.red}
                  onClick={() =>
                    navigate("/finance/budgets")
                  }
                />
              </div>

              {/* CONSOMMATION BUDGÉTAIRE */}

              <div
                style={{
                  background: "#f5f6ff",
                  borderRadius: 12,
                  padding: 18,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <strong>
                    Consommation des budgets
                    de dépenses
                  </strong>

                  <strong
                    style={{
                      color: budgetColor,
                    }}
                  >
                    {budgetConsumption !== null
                      ? `${budgetConsumption.toFixed(
                          1
                        )} %`
                      : "—"}
                  </strong>
                </div>

                <div
                  role="progressbar"
                  aria-label="Consommation du budget"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.max(
                    0,
                    Math.min(
                      100,
                      budgetConsumption || 0
                    )
                  )}
                  style={{
                    height: 10,
                    background: "#e1e7f5",
                    borderRadius: 20,
                    overflow: "hidden",
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          budgetConsumption || 0
                        )
                      )}%`,
                      background: budgetColor,
                      borderRadius: 20,
                    }}
                  />
                </div>

                <p
                  className="page-subtitle"
                  style={{ marginTop: 10 }}
                >
                  {money(actualExpense)}
                  {" / "}
                  {money(budgetedExpense)}
                </p>

                {actualExpense >
                  budgetedExpense &&
                  budgetedExpense > 0 && (
                    <p
                      style={{
                        color: COLORS.red,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Dépassement :{" "}
                      {money(
                        actualExpense -
                          budgetedExpense
                      )}
                    </p>
                  )}
              </div>
            </FinanceSection>

            {/* ======================================== */}
            {/* RÉCONCILIATION FINANCIÈRE                */}
            {/* ======================================== */}

            <FinanceSection
              title="Réconciliation financière"
              subtitle="Contrôle de cohérence des soldes financiers."
              actionLabel="Voir la réconciliation"
              onAction={() =>
                navigate(
                  "/finance/reconciliation"
                )
              }
            >
              <div style={statGrid}>
                <StatCard
                  label="Solde théorique"
                  value={
                    hasReconciliation
                      ? money(
                          reconciliationStats
                            .theoreticalBalance
                        )
                      : "—"
                  }
                  description="Solde calculé"
                  color={COLORS.blue}
                  onClick={() =>
                    navigate(
                      "/finance/reconciliation"
                    )
                  }
                />

                <StatCard
                  label="Solde enregistré"
                  value={
                    hasReconciliation
                      ? money(
                          reconciliationStats
                            .storedBalance
                        )
                      : "—"
                  }
                  description="Solde des comptes"
                  color={COLORS.green}
                  onClick={() =>
                    navigate(
                      "/finance/reconciliation"
                    )
                  }
                />

                <StatCard
                  label="Écart"
                  value={
                    hasReconciliation
                      ? money(
                          reconciliationStats
                            .difference
                        )
                      : "—"
                  }
                  description="Différence constatée"
                  color={
                    !hasReconciliation
                      ? COLORS.orange
                      : reconciliationBalanced
                      ? COLORS.green
                      : COLORS.red
                  }
                />

                <StatCard
                  label="État général"
                  value={
                    !hasReconciliation
                      ? "—"
                      : reconciliationBalanced
                      ? "✓ Équilibré"
                      : "⚠ Écart"
                  }
                  description={`${
                    data?.reconciliation
                      ?.discrepancyAccounts || 0
                  } compte(s) avec écart — toutes devises`}
                  color={COLORS.purple}
                  onClick={() =>
                    navigate(
                      "/finance/reconciliation"
                    )
                  }
                />
              </div>
            </FinanceSection>

            {/* ======================================== */}
            {/* COMPTES FINANCIERS                       */}
            {/* ======================================== */}

            <FinanceSection
              title="Comptes financiers"
              subtitle={`Soldes actuels des comptes en ${selectedCurrency}`}
              actionLabel="Voir les comptes"
              onAction={() =>
                navigate("/finance/accounts")
              }
            >
              {!currencyAccounts.length ? (
                <EmptyState
                  icon="💰"
                  message="Aucun compte dans cette devise."
                />
              ) : (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Compte</th>
                        <th>Type</th>
                        <th>Solde initial</th>
                        <th>Solde actuel</th>
                        <th>État</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currencyAccounts.map(
                        (account) => (
                          <tr
                            key={account._id}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              navigate(
                                "/finance/accounts"
                              )
                            }
                            onKeyDown={(event) =>
                              handleCardKeyDown(
                                event,
                                "/finance/accounts"
                              )
                            }
                            style={{
                              cursor: "pointer",
                            }}
                          >
                            <td>
                              <strong>
                                {account.name}
                              </strong>

                              {account.isDefault && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#64799c",
                                    marginTop: 4,
                                  }}
                                >
                                  Compte par défaut
                                </div>
                              )}
                            </td>

                            <td>
                              {ACCOUNT_TYPES[
                                account.type
                              ] || account.type}
                            </td>

                            <td>
                              {money(
                                account.openingBalance
                              )}
                            </td>

                            <td>
                              <strong
                                style={{
                                  color:
                                    numberValue(
                                      account.currentBalance
                                    ) < 0
                                      ? COLORS.red
                                      : COLORS.blue,
                                }}
                              >
                                {money(
                                  account.currentBalance
                                )}
                              </strong>
                            </td>

                            <td>
                              <span
                                style={{
                                  display:
                                    "inline-block",
                                  padding: "5px 10px",
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background:
                                    account.isActive !==
                                    false
                                      ? "#dcfce7"
                                      : "#f1f5f9",
                                  color:
                                    account.isActive !==
                                    false
                                      ? "#15803d"
                                      : "#64748b",
                                }}
                              >
                                {account.isActive !==
                                false
                                  ? "Actif"
                                  : "Inactif"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </FinanceSection>

            {/* ======================================== */}
            {/* DERNIERS MOUVEMENTS                      */}
            {/* ======================================== */}

            <FinanceSection
              title="Derniers mouvements"
              subtitle="Transactions financières récentes."
              actionLabel="Voir les transactions"
              onAction={() =>
                navigate(
                  "/finance/transactions"
                )
              }
            >
              {!recentTransactions.length ? (
                <EmptyState
                  icon="💳"
                  message="Aucun mouvement récent dans cette devise."
                />
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
                      </tr>
                    </thead>

                    <tbody>
                      {recentTransactions.map(
                        (transaction) => {
                          const color =
                            transaction.type ===
                            "income"
                              ? COLORS.green
                              : transaction.type ===
                                "expense"
                              ? COLORS.red
                              : COLORS.blue;

                          const sign =
                            transaction.type ===
                            "income"
                              ? "+ "
                              : transaction.type ===
                                "expense"
                              ? "- "
                              : "";

                          const transactionDate =
                            new Date(
                              transaction.transactionDate
                            );

                          const transactionMonth =
                            Number.isNaN(
                              transactionDate.getTime()
                            )
                              ? `${year}-${String(
                                  month
                                ).padStart(2, "0")}`
                              : transactionDate
                                  .toISOString()
                                  .slice(0, 7);

                          const url =
                            buildTransactionUrl({
                              month:
                                transactionMonth,
                              search:
                                transaction.title ||
                                "",
                            });

                          return (
                            <tr
                              key={transaction._id}
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                navigate(url)
                              }
                              onKeyDown={(event) =>
                                handleCardKeyDown(
                                  event,
                                  url
                                )
                              }
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <td>
                                {formatDate(
                                  transaction.transactionDate
                                )}
                              </td>

                              <td>
                                <strong>
                                  {transaction.title}
                                </strong>
                              </td>

                              <td>
                                <span
                                  style={{
                                    color,
                                    fontWeight: 700,
                                  }}
                                >
                                  {TRANSACTION_TYPES[
                                    transaction.type
                                  ] ||
                                    transaction.type}
                                </span>
                              </td>

                              <td>
                                {transaction.category
                                  ?.name || "—"}
                              </td>

                              <td>
                                {transaction.type ===
                                "transfer"
                                  ? `${
                                      transaction
                                        .fromAccount
                                        ?.name || "—"
                                    } → ${
                                      transaction
                                        .toAccount
                                        ?.name || "—"
                                    }`
                                  : transaction.account
                                      ?.name || "—"}
                              </td>

                              <td>
                                <strong
                                  style={{
                                    color,
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {sign}

                                  {formatCurrency(
                                    transaction.amount,
                                    transaction.currency
                                  )}
                                </strong>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </FinanceSection>

            {/* ======================================== */}
            {/* PIED DE PAGE                             */}
            {/* ======================================== */}

            <div
              style={{
                marginTop: 25,
                paddingTop: 15,
                borderTop:
                  "1px solid #e1e7f5",
                textAlign: "right",
                color: "#64799c",
                fontSize: 12,
              }}
            >
              Eldior Management Church —
              Pilotage et gestion financière

              {data.generatedAt && (
                <span>
                  {" • Dernière actualisation : "}

                  {new Date(
                    data.generatedAt
                  ).toLocaleString("fr-FR")}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}