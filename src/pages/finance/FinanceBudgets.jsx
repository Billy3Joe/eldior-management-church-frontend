// src/pages/finance/FinanceBudgets.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import API from "../../api/axios";
import Layout from "../../components/Layout";
import {
  CURRENCIES,
  formatCurrency,
} from "../../constants/currencies";

import "../../styles/ManagementPages.css";

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPeriodDates = (periodType, referenceDate = new Date()) => {
  const reference = new Date(referenceDate);
  const year = reference.getFullYear();
  const month = reference.getMonth();

  if (periodType === "monthly") {
    return {
      startDate: toDateInput(new Date(year, month, 1)),
      endDate: toDateInput(new Date(year, month + 1, 0)),
    };
  }

  if (periodType === "quarterly") {
    const quarterStart = Math.floor(month / 3) * 3;
    return {
      startDate: toDateInput(new Date(year, quarterStart, 1)),
      endDate: toDateInput(new Date(year, quarterStart + 3, 0)),
    };
  }

  if (periodType === "yearly") {
    return {
      startDate: toDateInput(new Date(year, 0, 1)),
      endDate: toDateInput(new Date(year, 11, 31)),
    };
  }

  return null;
};

const isPeriodConsistent = (periodType, startDate, endDate) => {
  if (periodType === "custom") return true;
  if (!startDate || !endDate) return false;

  const expected = getPeriodDates(periodType, `${startDate}T12:00:00`);
  return (
    expected?.startDate === startDate &&
    expected?.endDate === endDate
  );
};

const getInitialForm = (defaultCurrency = "EUR") => {
  const period = getPeriodDates("monthly");

  return {
    name: "",
    description: "",
    budgetType: "expense",
    scopeType: "global",
    category: "",
    department: "",
    amount: "",
    currency: defaultCurrency,
    periodType: "monthly",
    startDate: period.startDate,
    endDate: period.endDate,
    warningThresholdPercent: 80,
    enableAlerts: true,
    status: "draft",
    note: "",
  };
};

const PERIODS = [
  { value: "monthly", label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "yearly", label: "Annuel" },
  { value: "custom", label: "Personnalisé" },
];

const STATUS_LABELS = {
  draft: "Brouillon",
  active: "Actif",
  closed: "Clôturé",
  cancelled: "Annulé",
};

export default function FinanceBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [backendStats, setBackendStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [viewingBudget, setViewingBudget] = useState(null);

  const [defaultCurrency, setDefaultCurrency] = useState("EUR");

  const [form, setForm] = useState(() =>
    getInitialForm("EUR")
  );

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [filterCurrency, setFilterCurrency] =
    useState("all");

  // ======================================================
  // CHARGEMENT
  // ======================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        budgetsResponse,
        categoriesResponse,
        departmentsResponse,
        statsResponse,
        settingsResponse,
      ] = await Promise.all([
        API.get("/finance/budgets", {
          params: { limit: 500 },
        }),

        API.get("/finance/categories", {
          params: {
            limit: 500,
            isActive: true,
          },
        }),

        API.get("/departments", {
          params: {
            limit: 1000,
          },
        }),

        API.get("/finance/budgets/stats/summary"),

        API.get("/settings"),
      ]);

      const churchCurrency = String(
        settingsResponse?.data?.data?.defaultCurrency ||
          settingsResponse?.data?.data?.church
            ?.defaultCurrency ||
          settingsResponse?.data?.church?.defaultCurrency ||
          settingsResponse?.data?.defaultCurrency ||
          "EUR"
      )
        .trim()
        .toUpperCase();

      setDefaultCurrency(churchCurrency);

      setForm((previous) => {
        if (editingBudget) {
          return previous;
        }

        return {
          ...previous,
          currency: churchCurrency,
        };
      });

      setBudgets(
        Array.isArray(budgetsResponse?.data?.data)
          ? budgetsResponse.data.data
          : []
      );

      setCategories(
        Array.isArray(categoriesResponse?.data?.data)
          ? categoriesResponse.data.data
          : []
      );

      const departmentData =
        departmentsResponse?.data?.data ||
        departmentsResponse?.data?.departments ||
        [];

      setDepartments(
        Array.isArray(departmentData)
          ? departmentData
          : []
      );

      setBackendStats(
        statsResponse?.data?.data || null
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible de charger les budgets."
      );
    } finally {
      setLoading(false);
    }
  }, [editingBudget]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ======================================================
  // CATÉGORIES / DÉPARTEMENTS
  // ======================================================

  const availableCategories = useMemo(() => {
    return categories.filter(
      (category) =>
        category.isActive !== false &&
        category.type === form.budgetType
    );
  }, [categories, form.budgetType]);

  const activeDepartments = useMemo(() => {
    return departments.filter(
      (department) =>
        !department.status ||
        department.status === "active"
    );
  }, [departments]);

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const counts = useMemo(() => {
    return {
      total: backendStats?.total ?? budgets.length,

      active:
        backendStats?.active ??
        budgets.filter(
          (budget) => budget.status === "active"
        ).length,

      draft:
        backendStats?.draft ??
        budgets.filter(
          (budget) => budget.status === "draft"
        ).length,

      closed:
        backendStats?.closed ??
        budgets.filter(
          (budget) => budget.status === "closed"
        ).length,

      cancelled:
        backendStats?.cancelled ??
        budgets.filter(
          (budget) => budget.status === "cancelled"
        ).length,
    };
  }, [backendStats, budgets]);

  const alertCount = useMemo(() => {
    return budgets.filter(
      (budget) =>
        budget.summary?.alertTriggered === true
    ).length;
  }, [budgets]);

  const exceededCount = useMemo(() => {
    return budgets.filter(
      (budget) =>
        budget.summary?.exceeded === true
    ).length;
  }, [budgets]);

  const currencyStats = useMemo(() => {
    if (
      backendStats?.byCurrency &&
      typeof backendStats.byCurrency === "object"
    ) {
      return Object.entries(backendStats.byCurrency);
    }

    return [];
  }, [backendStats]);

  // ======================================================
  // FILTRES
  // ======================================================

  const filteredBudgets = useMemo(() => {
    const value = search.trim().toLowerCase();

    return budgets.filter((budget) => {
      const matchesSearch =
        !value ||
        budget.name?.toLowerCase().includes(value) ||
        budget.description
          ?.toLowerCase()
          .includes(value) ||
        budget.note?.toLowerCase().includes(value) ||
        budget.category?.name
          ?.toLowerCase()
          .includes(value) ||
        budget.department?.name
          ?.toLowerCase()
          .includes(value);

      const matchesStatus =
        filterStatus === "all" ||
        budget.status === filterStatus;

      const matchesType =
        filterType === "all" ||
        budget.budgetType === filterType;

      const matchesScope =
        filterScope === "all" ||
        budget.scopeType === filterScope;

      const matchesCurrency =
        filterCurrency === "all" ||
        budget.currency === filterCurrency;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesScope &&
        matchesCurrency
      );
    });
  }, [
    budgets,
    search,
    filterStatus,
    filterType,
    filterScope,
    filterCurrency,
  ]);

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const resetForm = () => {
    setForm(getInitialForm(defaultCurrency));
    setEditingBudget(null);
  };

  const openCreateForm = () => {
    setViewingBudget(null);
    setEditingBudget(null);
    setForm(getInitialForm(defaultCurrency));
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

  const openEditForm = (budget) => {
    if (
      budget.status === "closed" ||
      budget.status === "cancelled"
    ) {
      toast.info(
        "Réouvrez ou réactivez d'abord ce budget pour le modifier."
      );

      return;
    }

    setViewingBudget(null);
    setEditingBudget(budget);

    setForm({
      name: budget.name || "",
      description: budget.description || "",
      budgetType: budget.budgetType || "expense",
      scopeType: budget.scopeType || "global",

      category:
        typeof budget.category === "object"
          ? budget.category?._id || ""
          : budget.category || "",

      department:
        typeof budget.department === "object"
          ? budget.department?._id || ""
          : budget.department || "",

      amount: budget.amount ?? "",

      currency:
        budget.currency || defaultCurrency,

      periodType: budget.periodType || "monthly",

      startDate: budget.startDate
        ? new Date(budget.startDate)
            .toISOString()
            .slice(0, 10)
        : "",

      endDate: budget.endDate
        ? new Date(budget.endDate)
            .toISOString()
            .slice(0, 10)
        : "",

      warningThresholdPercent:
        budget.warningThresholdPercent ?? 80,

      enableAlerts:
        budget.enableAlerts !== false,

      status: budget.status || "draft",

      note: budget.note || "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================================
  // CONSULTATION
  // ======================================================

  const openViewBudget = (budget) => {
    setViewingBudget(budget);
  };

  const closeViewBudget = () => {
    setViewingBudget(null);
  };

  // ======================================================
  // PÉRIODES
  // ======================================================

  const setPeriodDates = (periodType, previous) => {
    if (periodType === "custom") {
      return {
        ...previous,
        periodType,
      };
    }

    const referenceDate = previous.startDate
      ? `${previous.startDate}T12:00:00`
      : new Date();

    const period = getPeriodDates(periodType, referenceDate);

    return {
      ...previous,
      periodType,
      startDate: period.startDate,
      endDate: period.endDate,
    };
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    if (name === "periodType") {
      setForm((previous) =>
        setPeriodDates(value, previous)
      );

      return;
    }

    if (
      (name === "startDate" || name === "endDate") &&
      form.periodType !== "custom"
    ) {
      setForm((previous) => {
        const referenceValue =
          name === "startDate" ? value : previous.startDate;

        if (!referenceValue) return previous;

        const period = getPeriodDates(
          previous.periodType,
          `${referenceValue}T12:00:00`
        );

        return {
          ...previous,
          startDate: period.startDate,
          endDate: period.endDate,
        };
      });

      return;
    }

    setForm((previous) => {
      const next = {
        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      };

      if (name === "budgetType") {
        next.category = "";
      }

      if (name === "scopeType") {
        if (value !== "category") {
          next.category = "";
        }

        if (value !== "department") {
          next.department = "";
        }
      }

      return next;
    });
  };

  // ======================================================
  // ENREGISTREMENT
  // ======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(
        "Le nom du budget est obligatoire."
      );
      return;
    }

    if (
      form.amount === "" ||
      Number(form.amount) < 0
    ) {
      toast.error(
        "Le montant du budget est invalide."
      );
      return;
    }

    if (
      !form.startDate ||
      !form.endDate
    ) {
      toast.error(
        "La période est obligatoire."
      );
      return;
    }

    if (
      !isPeriodConsistent(
        form.periodType,
        form.startDate,
        form.endDate
      )
    ) {
      toast.error(
        "Les dates ne correspondent pas à la période sélectionnée."
      );
      return;
    }

    if (
      new Date(form.endDate) <
      new Date(form.startDate)
    ) {
      toast.error(
        "La date de fin doit être après la date de début."
      );
      return;
    }

    if (
      form.scopeType === "category" &&
      !form.category
    ) {
      toast.error(
        "Sélectionnez une catégorie."
      );
      return;
    }

    if (
      form.scopeType === "department" &&
      !form.department
    ) {
      toast.error(
        "Sélectionnez un département."
      );
      return;
    }

    const threshold = Number(
      form.warningThresholdPercent
    );

    if (
      threshold < 0 ||
      threshold > 100
    ) {
      toast.error(
        "Le seuil d'alerte doit être compris entre 0 et 100 %."
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),

      periodType: form.periodType,

      startDate: form.startDate,
      endDate: form.endDate,

      amount: Number(form.amount),

      currency: String(
        form.currency ||
          defaultCurrency ||
          "EUR"
      )
        .trim()
        .toUpperCase(),

      scopeType: form.scopeType,

      category:
        form.scopeType === "category"
          ? form.category
          : null,

      department:
        form.scopeType === "department"
          ? form.department
          : null,

      budgetType: form.budgetType,

      warningThresholdPercent:
        threshold,

      enableAlerts:
        form.enableAlerts,

      status:
        form.status,

      isActive:
        form.status === "active",

      note:
        form.note.trim(),
    };

    try {
      setSubmitting(true);

      if (editingBudget) {
        await API.put(
          `/finance/budgets/${editingBudget._id}`,
          payload
        );

        toast.success(
          "Budget modifié avec succès."
        );
      } else {
        await API.post(
          "/finance/budgets",
          payload
        );

        toast.success(
          "Budget créé avec succès."
        );
      }

      closeForm();
      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible d'enregistrer le budget."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // CHANGEMENT DE STATUT
  // ======================================================

  const changeStatus = async (
    budget,
    status
  ) => {
    let actionLabel = "modifier";

    if (status === "draft") {
      actionLabel = "désactiver";
    }

    if (status === "closed") {
      actionLabel = "clôturer";
    }

    if (status === "cancelled") {
      actionLabel = "annuler";
    }

    if (status === "active") {
      if (budget.status === "closed") {
        actionLabel = "réouvrir";
      } else if (
        budget.status === "cancelled"
      ) {
        actionLabel = "réactiver";
      } else {
        actionLabel = "activer";
      }
    }

    const confirmed =
      window.confirm(
        `Voulez-vous ${actionLabel} le budget « ${budget.name} » ?`
      );

    if (!confirmed) return;

    try {
      setActionLoading(
        `${budget._id}-${status}`
      );

      await API.patch(
        `/finance/budgets/${budget._id}/status`,
        {
          status,
        }
      );

      if (status === "draft") {
        toast.success(
          "Budget désactivé."
        );
      } else if (
        status === "active" &&
        budget.status === "closed"
      ) {
        toast.success(
          "Budget réouvert."
        );
      } else if (
        status === "active" &&
        budget.status === "cancelled"
      ) {
        toast.success(
          "Budget réactivé."
        );
      } else if (
        status === "active"
      ) {
        toast.success(
          "Budget activé."
        );
      } else if (
        status === "closed"
      ) {
        toast.success(
          "Budget clôturé."
        );
      } else if (
        status === "cancelled"
      ) {
        toast.success(
          "Budget annulé."
        );
      }

      if (
        viewingBudget?._id ===
        budget._id
      ) {
        setViewingBudget(null);
      }

      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible de modifier le statut."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ======================================================
  // SUPPRESSION
  // ======================================================

  const deleteBudget = async (
    budget
  ) => {
    if (budget.status !== "draft") {
      toast.info(
        "Seuls les budgets en brouillon peuvent être supprimés."
      );

      return;
    }

    if (
      !window.confirm(
        `Supprimer définitivement le budget « ${budget.name} » ?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(
        `${budget._id}-delete`
      );

      await API.delete(
        `/finance/budgets/${budget._id}`
      );

      if (
        viewingBudget?._id ===
        budget._id
      ) {
        setViewingBudget(null);
      }

      toast.success(
        "Budget supprimé."
      );

      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible de supprimer le budget."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ======================================================
  // HELPERS
  // ======================================================

  const getTypeLabel = (type) => {
    if (type === "income") {
      return "Entrée";
    }

    if (type === "expense") {
      return "Sortie";
    }

    return "—";
  };

  const getScopeLabel = (budget) => {
    if (
      budget.scopeType === "category"
    ) {
      return budget.category?.name
        ? `Catégorie : ${budget.category.name}`
        : "Catégorie";
    }

    if (
      budget.scopeType === "department"
    ) {
      return budget.department?.name
        ? `Département : ${budget.department.name}`
        : "Département";
    }

    return "Église";
  };

  const getPeriodLabel = (
    periodType
  ) => {
    return (
      PERIODS.find(
        (period) =>
          period.value === periodType
      )?.label || "—"
    );
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "fr-FR"
    ).format(date);
  };

  const getSummary = (budget) => {
    return (
      budget.summary || {
        actual: 0,
        remaining:
          Number(budget.amount || 0),
        usagePercent: 0,
        alertTriggered: false,
        exceeded: false,
        exceededAmount: 0,
        transactionCount: 0,

        trackingAvailable:
          budget.scopeType !==
          "department",
      }
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div
              style={{
                padding: 30,
                textAlign: "center",
              }}
            >
              Chargement des budgets...
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
          <div>
            <h1 className="page-title">
              Budgets financiers
            </h1>

            <p className="page-subtitle">
              Planifiez et contrôlez les ressources
              financières de l'église.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={
              showForm
                ? closeForm
                : openCreateForm
            }
          >
            {showForm
              ? "✕ Fermer"
              : "+ Nouveau budget"}
          </button>
        </div>

        {/* STATS */}

        <div className="management-stats-grid">
          <StatCard
            label="Budgets"
            value={counts.total}
            description="Total enregistré"
          />

          <StatCard
            label="Actifs"
            value={counts.active}
            description="Budgets actuellement actifs"
          />

          <StatCard
            label="Brouillons"
            value={counts.draft}
            description="Budgets en préparation"
          />

          <StatCard
            label="Alertes"
            value={alertCount}
            description="Seuil budgétaire atteint"
          />

          <StatCard
            label="Dépassés"
            value={exceededCount}
            description="Budget dépassé"
          />
        </div>

        {/* STATISTIQUES PAR DEVISE */}

        {currencyStats.length > 0 && (
          <div
            className="management-card"
            style={{ marginTop: 24 }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Situation budgétaire par devise
                </h2>

                <p className="page-subtitle">
                  Les devises sont séparées afin
                  d'éviter de mélanger EUR, FCFA,
                  USD, etc.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                padding: 20,
              }}
            >
              {currencyStats.map(
                ([currency, stat]) => (
                  <div
                    key={currency}
                    style={{
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: 18,
                    }}
                  >
                    <strong>
                      {currency}
                    </strong>

                    <div
                      style={{
                        marginTop: 12,
                        lineHeight: 1.8,
                        fontSize: 14,
                      }}
                    >
                      <div>
                        Sorties prévues :{" "}
                        <strong>
                          {formatCurrency(
                            stat.budgetedExpense ||
                              0,
                            currency
                          )}
                        </strong>
                      </div>

                      <div>
                        Sorties réalisées :{" "}
                        <strong>
                          {formatCurrency(
                            stat.actualExpense ||
                              0,
                            currency
                          )}
                        </strong>
                      </div>

                      <div>
                        Entrées prévues :{" "}
                        <strong>
                          {formatCurrency(
                            stat.budgetedIncome ||
                              0,
                            currency
                          )}
                        </strong>
                      </div>

                      <div>
                        Entrées réalisées :{" "}
                        <strong>
                          {formatCurrency(
                            stat.actualIncome ||
                              0,
                            currency
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* FORMULAIRE */}

        {showForm && (
          <div
            className="management-card"
            style={{ marginTop: 24 }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  {editingBudget
                    ? "Modifier le budget"
                    : "Créer un budget"}
                </h2>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ padding: 20 }}
            >
              <div style={formGridStyle}>

                <Field label="Nom du budget">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Type">
                  <select
                    name="budgetType"
                    value={form.budgetType}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="expense">
                      Sorties
                    </option>

                    <option value="income">
                      Entrées
                    </option>
                  </select>
                </Field>

                <Field label="Portée">
                  <select
                    name="scopeType"
                    value={form.scopeType}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="global">
                      Église entière
                    </option>

                    <option value="category">
                      Catégorie financière
                    </option>

                    <option value="department">
                      Département
                    </option>
                  </select>
                </Field>

                {form.scopeType ===
                  "category" && (
                  <Field label="Catégorie">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    >
                      <option value="">
                        Sélectionner...
                      </option>

                      {availableCategories.map(
                        (category) => (
                          <option
                            key={category._id}
                            value={category._id}
                          >
                            {category.name}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                )}

                {form.scopeType ===
                  "department" && (
                  <Field label="Département">
                    <select
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    >
                      <option value="">
                        Sélectionner...
                      </option>

                      {activeDepartments.map(
                        (department) => (
                          <option
                            key={department._id}
                            value={department._id}
                          >
                            {department.name}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                )}

                <Field label="Montant prévu">
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Devise">
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    {CURRENCIES.map(
                      (currency) => (
                        <option
                          key={currency.code}
                          value={currency.code}
                        >
                          {currency.code} —{" "}
                          {currency.name}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Période">
                  <select
                    name="periodType"
                    value={form.periodType}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    {PERIODS.map(
                      (period) => (
                        <option
                          key={period.value}
                          value={period.value}
                        >
                          {period.label}
                        </option>
                      )
                    )}
                  </select>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      opacity: 0.7,
                      lineHeight: 1.4,
                    }}
                  >
                    {form.periodType === "custom"
                      ? "Choisissez librement les dates de début et de fin."
                      : "Les dates sont ajustées automatiquement selon la période choisie."}
                  </div>
                </Field>

                <Field label="Date de début">
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Date de fin">
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      background:
                        form.periodType === "custom"
                          ? "#ffffff"
                          : "#f8fafc",
                    }}
                    readOnly={form.periodType !== "custom"}
                    title={
                      form.periodType === "custom"
                        ? ""
                        : "Calculée automatiquement selon la période"
                    }
                    required
                  />
                </Field>

                <Field label="Seuil d'alerte (%)">
                  <input
                    type="number"
                    name="warningThresholdPercent"
                    value={
                      form.warningThresholdPercent
                    }
                    onChange={handleChange}
                    min="0"
                    max="100"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Statut">
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    style={inputStyle}
                    disabled={Boolean(editingBudget)}
                  >
                    <option value="draft">
                      Brouillon
                    </option>

                    <option value="active">
                      Actif
                    </option>
                  </select>
                </Field>
              </div>

              <div
                style={{
                  marginTop: 18,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 700,
                  }}
                >
                  <input
                    type="checkbox"
                    name="enableAlerts"
                    checked={
                      form.enableAlerts
                    }
                    onChange={handleChange}
                  />

                  Activer les alertes budgétaires
                </label>
              </div>

              <div
                style={{
                  marginTop: 18,
                }}
              >
                <Field label="Description">
                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={handleChange}
                    rows={3}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div
                style={{
                  marginTop: 18,
                }}
              >
                <Field label="Note interne">
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={2}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 20,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Enregistrement..."
                    : editingBudget
                    ? "Enregistrer les modifications"
                    : "Créer le budget"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LISTE */}

        <div
          className="management-card"
          style={{ marginTop: 24 }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Suivi budgétaire
              </h2>

              <p className="page-subtitle">
                {filteredBudgets.length} budget(s)
              </p>
            </div>
          </div>

          {/* FILTRES */}

          <div style={filterGridStyle}>
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher un budget..."
              style={inputStyle}
            />

            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="all">
                Tous les statuts
              </option>

              <option value="draft">
                Brouillons
              </option>

              <option value="active">
                Actifs
              </option>

              <option value="closed">
                Clôturés
              </option>

              <option value="cancelled">
                Annulés
              </option>
            </select>

            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="all">
                Tous les types
              </option>

              <option value="expense">
                Sorties
              </option>

              <option value="income">
                Entrées
              </option>
            </select>

            <select
              value={filterScope}
              onChange={(event) =>
                setFilterScope(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="all">
                Toutes les portées
              </option>

              <option value="global">
                Église
              </option>

              <option value="category">
                Catégorie
              </option>

              <option value="department">
                Département
              </option>
            </select>

            <select
              value={filterCurrency}
              onChange={(event) =>
                setFilterCurrency(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="all">
                Toutes les devises
              </option>

              {CURRENCIES.map(
                (currency) => (
                  <option
                    key={currency.code}
                    value={currency.code}
                  >
                    {currency.code}
                  </option>
                )
              )}
            </select>
          </div>

          {filteredBudgets.length === 0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                📊
              </div>

              <h3>
                Aucun budget
              </h3>

              <p>
                Aucun budget ne correspond aux
                critères.
              </p>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Budget</th>
                    <th>Type</th>
                    <th>Portée</th>
                    <th>Période</th>
                    <th>Prévu</th>
                    <th>Réalisé</th>
                    <th>Restant</th>
                    <th>Progression</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBudgets.map(
                    (budget) => {
                      const summary =
                        getSummary(
                          budget
                        );

                      const progress =
                        Number(
                          summary.usagePercent ||
                            0
                        );

                      return (
                        <tr
                          key={budget._id}
                        >
                          <td>
                            <strong>
                              {budget.name}
                            </strong>

                            <div
                              style={{
                                fontSize: 12,
                                opacity: 0.7,
                                marginTop: 4,
                              }}
                            >
                              {formatDate(
                                budget.startDate
                              )}{" "}
                              →{" "}
                              {formatDate(
                                budget.endDate
                              )}
                            </div>

                            {budget.scopeType ===
                              "department" &&
                              summary.trackingAvailable ===
                                false && (
                                <div
                                  style={{
                                    marginTop: 5,
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  ⚠️ Suivi automatique
                                  indisponible
                                </div>
                              )}
                          </td>

                          <td>
                            {getTypeLabel(
                              budget.budgetType
                            )}
                          </td>

                          <td>
                            {getScopeLabel(
                              budget
                            )}
                          </td>

                          <td>
                            {getPeriodLabel(
                              budget.periodType
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                budget.amount ||
                                  0,
                                budget.currency
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              summary.actual ||
                                0,
                              budget.currency
                            )}

                            <div
                              style={{
                                fontSize: 11,
                                opacity: 0.65,
                              }}
                            >
                              {summary.transactionCount ||
                                0}{" "}
                              mouvement(s)
                            </div>
                          </td>

                          <td>
                            {formatCurrency(
                              summary.remaining ??
                                0,
                              budget.currency
                            )}
                          </td>

                          <td
                            style={{
                              minWidth: 170,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                marginBottom: 6,
                                gap: 8,
                              }}
                            >
                              <span>
                                {progress.toFixed(
                                  1
                                )}
                                %
                              </span>

                              {summary.exceeded ? (
                                <strong>
                                  Dépassé
                                </strong>
                              ) : summary.alertTriggered ? (
                                <strong>
                                  Alerte
                                </strong>
                              ) : null}
                            </div>

                            <div
                              style={{
                                height: 8,
                                borderRadius: 20,
                                background:
                                  "#e9eef5",
                                overflow:
                                  "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      progress,
                                      0
                                    ),
                                    100
                                  )}%`,

                                  height:
                                    "100%",

                                  background:
                                    summary.exceeded
                                      ? "#dc2626"
                                      : summary.alertTriggered
                                      ? "#f59e0b"
                                      : "#2563eb",
                                }}
                              />
                            </div>
                          </td>

                          <td>
                            <strong>
                              {STATUS_LABELS[
                                budget.status
                              ] ||
                                budget.status}
                            </strong>
                          </td>

                          {/* ACTIONS */}

                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() =>
                                  openViewBudget(
                                    budget
                                  )
                                }
                              >
                                👁 Voir
                              </button>

                              {(budget.status ===
                                "draft" ||
                                budget.status ===
                                  "active") && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() =>
                                    openEditForm(
                                      budget
                                    )
                                  }
                                >
                                  ✏️ Modifier
                                </button>
                              )}

                              {budget.status ===
                                "draft" && (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={
                                    actionLoading ===
                                    `${budget._id}-active`
                                  }
                                  onClick={() =>
                                    changeStatus(
                                      budget,
                                      "active"
                                    )
                                  }
                                >
                                  ✓ Activer
                                </button>
                              )}

                              {budget.status ===
                                "active" && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  disabled={
                                    actionLoading ===
                                    `${budget._id}-draft`
                                  }
                                  onClick={() =>
                                    changeStatus(
                                      budget,
                                      "draft"
                                    )
                                  }
                                >
                                  ⏸ Désactiver
                                </button>
                              )}

                              {budget.status ===
                                "active" && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  disabled={
                                    actionLoading ===
                                    `${budget._id}-closed`
                                  }
                                  onClick={() =>
                                    changeStatus(
                                      budget,
                                      "closed"
                                    )
                                  }
                                >
                                  🔒 Clôturer
                                </button>
                              )}

                              {(budget.status ===
                                "draft" ||
                                budget.status ===
                                  "active") && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  disabled={
                                    actionLoading ===
                                    `${budget._id}-cancelled`
                                  }
                                  onClick={() =>
                                    changeStatus(
                                      budget,
                                      "cancelled"
                                    )
                                  }
                                >
                                  ✕ Annuler
                                </button>
                              )}

                              {budget.status ===
                                "closed" && (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={
                                    actionLoading ===
                                    `${budget._id}-active`
                                  }
                                  onClick={() =>
                                    changeStatus(
                                      budget,
                                      "active"
                                    )
                                  }
                                >
                                  ↻ Réouvrir
                                </button>
                              )}

                              {budget.status ===
                                "cancelled" && (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={
                                    actionLoading ===
                                    `${budget._id}-active`
                                  }
                                  onClick={() =>
                                    changeStatus(
                                      budget,
                                      "active"
                                    )
                                  }
                                >
                                  ↻ Réactiver
                                </button>
                              )}

                              {budget.status ===
                                "draft" && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  disabled={
                                    actionLoading ===
                                    `${budget._id}-delete`
                                  }
                                  onClick={() =>
                                    deleteBudget(
                                      budget
                                    )
                                  }
                                >
                                  🗑️ Supprimer
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODALE */}

        {viewingBudget && (
          <div
            style={modalOverlayStyle}
            onClick={closeViewBudget}
          >
            <div
              style={modalStyle}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div style={modalHeaderStyle}>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.65,
                      marginBottom: 4,
                    }}
                  >
                    Budget financier
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 24,
                    }}
                  >
                    {viewingBudget.name}
                  </h2>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeViewBudget}
                >
                  ✕ Fermer
                </button>
              </div>

              {(() => {
                const summary =
                  getSummary(
                    viewingBudget
                  );

                const progress =
                  Number(
                    summary.usagePercent ||
                      0
                  );

                return (
                  <>
                    <div style={detailGridStyle}>
                      <Detail
                        label="Statut"
                        value={
                          STATUS_LABELS[
                            viewingBudget
                              .status
                          ] ||
                          viewingBudget.status
                        }
                      />

                      <Detail
                        label="Type"
                        value={getTypeLabel(
                          viewingBudget.budgetType
                        )}
                      />

                      <Detail
                        label="Portée"
                        value={getScopeLabel(
                          viewingBudget
                        )}
                      />

                      <Detail
                        label="Période"
                        value={getPeriodLabel(
                          viewingBudget.periodType
                        )}
                      />

                      <Detail
                        label="Date de début"
                        value={formatDate(
                          viewingBudget.startDate
                        )}
                      />

                      <Detail
                        label="Date de fin"
                        value={formatDate(
                          viewingBudget.endDate
                        )}
                      />

                      <Detail
                        label="Devise"
                        value={
                          viewingBudget.currency ||
                          "—"
                        }
                      />

                      <Detail
                        label="Montant prévu"
                        value={formatCurrency(
                          viewingBudget.amount ||
                            0,
                          viewingBudget.currency
                        )}
                      />

                      <Detail
                        label="Réalisé"
                        value={formatCurrency(
                          summary.actual ||
                            0,
                          viewingBudget.currency
                        )}
                      />

                      <Detail
                        label="Restant"
                        value={formatCurrency(
                          summary.remaining ??
                            0,
                          viewingBudget.currency
                        )}
                      />

                      <Detail
                        label="Progression"
                        value={`${progress.toFixed(
                          1
                        )} %`}
                      />

                      <Detail
                        label="Mouvements"
                        value={
                          summary.transactionCount ||
                          0
                        }
                      />

                      <Detail
                        label="Seuil d'alerte"
                        value={`${
                          viewingBudget.warningThresholdPercent ??
                          80
                        } %`}
                      />

                      <Detail
                        label="Alertes"
                        value={
                          viewingBudget.enableAlerts ===
                          false
                            ? "Désactivées"
                            : "Activées"
                        }
                      />
                    </div>

                    {summary.alertTriggered && (
                      <div
                        style={{
                          ...infoBoxStyle,
                          borderLeft:
                            "4px solid #f59e0b",
                        }}
                      >
                        ⚠️ Le seuil d'alerte de
                        ce budget est atteint.
                      </div>
                    )}

                    {summary.exceeded && (
                      <div
                        style={{
                          ...infoBoxStyle,
                          borderLeft:
                            "4px solid #dc2626",
                        }}
                      >
                        🚨 Ce budget est dépassé
                        de{" "}
                        <strong>
                          {formatCurrency(
                            summary.exceededAmount ||
                              0,
                            viewingBudget.currency
                          )}
                        </strong>
                        .
                      </div>
                    )}

                    {viewingBudget.scopeType ===
                      "department" &&
                      summary.trackingAvailable ===
                        false && (
                        <div
                          style={{
                            ...infoBoxStyle,
                            borderLeft:
                              "4px solid #f59e0b",
                          }}
                        >
                          ⚠️ Le suivi automatique
                          des mouvements par
                          département n'est pas
                          disponible pour ce
                          budget.
                        </div>
                      )}

                    {viewingBudget.description && (
                      <div
                        style={{
                          marginTop: 20,
                        }}
                      >
                        <strong>
                          Description
                        </strong>

                        <div
                          style={{
                            marginTop: 8,
                            lineHeight: 1.6,
                            whiteSpace:
                              "pre-wrap",
                          }}
                        >
                          {
                            viewingBudget.description
                          }
                        </div>
                      </div>
                    )}

                    {viewingBudget.note && (
                      <div
                        style={{
                          marginTop: 20,
                        }}
                      >
                        <strong>
                          Note interne
                        </strong>

                        <div
                          style={{
                            marginTop: 8,
                            lineHeight: 1.6,
                            whiteSpace:
                              "pre-wrap",
                          }}
                        >
                          {viewingBudget.note}
                        </div>
                      </div>
                    )}

                    {/* ACTIONS MODALE */}

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop:
                          "1px solid #e2e8f0",
                      }}
                    >
                      {(viewingBudget.status ===
                        "draft" ||
                        viewingBudget.status ===
                          "active") && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            const budget =
                              viewingBudget;

                            closeViewBudget();

                            openEditForm(
                              budget
                            );
                          }}
                        >
                          ✏️ Modifier
                        </button>
                      )}

                      {viewingBudget.status ===
                        "draft" && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={
                            actionLoading ===
                            `${viewingBudget._id}-active`
                          }
                          onClick={() =>
                            changeStatus(
                              viewingBudget,
                              "active"
                            )
                          }
                        >
                          ✓ Activer
                        </button>
                      )}

                      {viewingBudget.status ===
                        "active" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={
                            actionLoading ===
                            `${viewingBudget._id}-draft`
                          }
                          onClick={() =>
                            changeStatus(
                              viewingBudget,
                              "draft"
                            )
                          }
                        >
                          ⏸ Désactiver
                        </button>
                      )}

                      {viewingBudget.status ===
                        "active" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={
                            actionLoading ===
                            `${viewingBudget._id}-closed`
                          }
                          onClick={() =>
                            changeStatus(
                              viewingBudget,
                              "closed"
                            )
                          }
                        >
                          🔒 Clôturer
                        </button>
                      )}

                      {(viewingBudget.status ===
                        "draft" ||
                        viewingBudget.status ===
                          "active") && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={
                            actionLoading ===
                            `${viewingBudget._id}-cancelled`
                          }
                          onClick={() =>
                            changeStatus(
                              viewingBudget,
                              "cancelled"
                            )
                          }
                        >
                          ✕ Annuler
                        </button>
                      )}

                      {viewingBudget.status ===
                        "closed" && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={
                            actionLoading ===
                            `${viewingBudget._id}-active`
                          }
                          onClick={() =>
                            changeStatus(
                              viewingBudget,
                              "active"
                            )
                          }
                        >
                          ↻ Réouvrir
                        </button>
                      )}

                      {viewingBudget.status ===
                        "cancelled" && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={
                            actionLoading ===
                            `${viewingBudget._id}-active`
                          }
                          onClick={() =>
                            changeStatus(
                              viewingBudget,
                              "active"
                            )
                          }
                        >
                          ↻ Réactiver
                        </button>
                      )}

                      {viewingBudget.status ===
                        "draft" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={
                            actionLoading ===
                            `${viewingBudget._id}-delete`
                          }
                          onClick={() =>
                            deleteBudget(
                              viewingBudget
                            )
                          }
                        >
                          🗑️ Supprimer
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={
                          closeViewBudget
                        }
                      >
                        Fermer
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
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
  children,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div style={detailStyle}>
      <div
        style={{
          fontSize: 12,
          opacity: 0.65,
          marginBottom: 6,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

// ======================================================
// STYLES
// ======================================================

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 16,
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 2fr) repeat(4, minmax(140px, 1fr))",
  gap: 12,
  marginBottom: 20,
};

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.48)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  overflowY: "auto",
};

const modalStyle = {
  width: "min(900px, 100%)",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: 18,
  padding: 24,
  boxShadow:
    "0 24px 70px rgba(15, 23, 42, 0.25)",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
  paddingBottom: 20,
  borderBottom: "1px solid #e2e8f0",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 14,
  marginTop: 20,
};

const detailStyle = {
  padding: 15,
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#f8fafc",
};

const infoBoxStyle = {
  marginTop: 18,
  padding: 14,
  borderRadius: 10,
  background: "#f8fafc",
  lineHeight: 1.5,
};