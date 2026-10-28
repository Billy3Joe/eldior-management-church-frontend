
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import API from "../../api/axios";
import Layout from "../../components/Layout";
import { formatCurrency } from "../../constants/currencies";
import "../../styles/ManagementPages.css";

const STATUS = {
  draft: "Brouillon",
  active: "Actif",
  closed: "Clôturé",
  cancelled: "Annulé",
};

const PERIOD = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  yearly: "Annuel",
  custom: "Personnalisé",
};

const SCOPE = {
  global: "Toute l'église",
  category: "Catégorie",
  department: "Département",
};

const STATUS_CLASS = {
  draft: "status-pending",
  active: "status-active",
  closed: "status-inactive",
  cancelled: "status-inactive",
};

const TRANSITIONS = {
  draft: [
    { status: "active", label: "Activer" },
    { status: "cancelled", label: "Annuler" },
  ],
  active: [
    { status: "draft", label: "Désactiver" },
    { status: "closed", label: "Clôturer" },
    { status: "cancelled", label: "Annuler" },
  ],
  closed: [{ status: "active", label: "Réouvrir" }],
  cancelled: [{ status: "active", label: "Réactiver" }],
};

const getId = (value) =>
  typeof value === "object" && value !== null
    ? value._id || ""
    : value || "";

const dateInput = (value) =>
  value ? String(value).slice(0, 10) : "";

const displayDate = (value) => {
  if (!value) return "—";

  const date = dateInput(value);
  const [year, month, day] = date.split("-");

  return year && month && day
    ? `${day}/${month}/${year}`
    : "—";
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const normalizeArray = (response, key) => {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  return [];
};

const getPeriodDates = (periodType, reference = new Date()) => {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const quarterStart = Math.floor(month / 3) * 3;

  let start;
  let end;

  switch (periodType) {
    case "quarterly":
      start = new Date(year, quarterStart, 1);
      end = new Date(year, quarterStart + 3, 0);
      break;

    case "yearly":
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31);
      break;

    default:
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0);
  }

  const toDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };

  return {
    startDate: toDateString(start),
    endDate: toDateString(end),
  };
};

const createEmptyForm = (currency = "EUR") => ({
  name: "",
  description: "",
  budgetType: "expense",
  periodType: "monthly",
  ...getPeriodDates("monthly"),
  amount: "",
  currency,
  scopeType: "global",
  category: "",
  department: "",
  warningThresholdPercent: 80,
  enableAlerts: true,
  status: "draft",
  note: "",
});

export default function FinanceBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => createEmptyForm());

  const [selectedBudget, setSelectedBudget] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);

      const response = await API.get("/finance/budgets", {
        params: { limit: 500 },
      });

      setBudgets(normalizeArray(response, "budgets"));
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Impossible de charger les budgets."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReferences = useCallback(async () => {
    const results = await Promise.allSettled([
      API.get("/finance/categories", {
        params: { limit: 500, isActive: true },
      }),
      API.get("/departments", {
        params: { limit: 500 },
      }),
      API.get("/settings"),
    ]);

    if (results[0].status === "fulfilled") {
      setCategories(
        normalizeArray(results[0].value, "categories")
      );
    }

    if (results[1].status === "fulfilled") {
      setDepartments(
        normalizeArray(results[1].value, "departments")
      );
    }

    if (results[2].status === "fulfilled") {
      const response = results[2].value;

      const currency = String(
        response?.data?.data?.defaultCurrency ||
          response?.data?.church?.defaultCurrency ||
          response?.data?.defaultCurrency ||
          "EUR"
      ).toUpperCase();

      setDefaultCurrency(currency);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchReferences();
  }, [fetchBudgets, fetchReferences]);

  useEffect(() => {
    if (!showForm && !selectedBudget) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        setShowForm(false);
        setEditing(null);
        setSelectedBudget(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showForm, selectedBudget, busy]);

  const currencies = useMemo(() => {
    return [
      ...new Set([
        defaultCurrency,
        ...budgets.map((budget) => budget.currency),
      ]),
    ]
      .filter(Boolean)
      .sort();
  }, [budgets, defaultCurrency]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        [budget.name, budget.description, budget.note]
          .some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query)
          );

      return (
        matchesSearch &&
        (filterStatus === "all" ||
          budget.status === filterStatus) &&
        (filterType === "all" ||
          budget.budgetType === filterType) &&
        (filterCurrency === "all" ||
          budget.currency === filterCurrency)
      );
    });
  }, [
    budgets,
    search,
    filterStatus,
    filterType,
    filterCurrency,
  ]);

  const stats = useMemo(() => {
    const active = filteredBudgets.filter(
      (budget) => budget.status === "active"
    );

    return {
      total: filteredBudgets.length,
      active: active.length,
      alerts: active.filter(
        (budget) =>
          budget.summary?.trackingAvailable !== false &&
          budget.summary?.alertTriggered
      ).length,
      exceeded: active.filter(
        (budget) =>
          budget.summary?.trackingAvailable !== false &&
          budget.summary?.exceeded
      ).length,
    };
  }, [filteredBudgets]);

  const openCreate = () => {
    setEditing(null);
    setSelectedBudget(null);
    setForm(createEmptyForm(defaultCurrency));
    setShowForm(true);
  };

  const openEdit = (budget) => {
    setSelectedBudget(null);
    setEditing(budget);

    setForm({
      name: budget.name || "",
      description: budget.description || "",
      budgetType: budget.budgetType,
      periodType: budget.periodType,
      startDate: dateInput(budget.startDate),
      endDate: dateInput(budget.endDate),
      amount: String(budget.amount ?? ""),
      currency: budget.currency,
      scopeType: budget.scopeType,
      category: getId(budget.category),
      department: getId(budget.department),
      warningThresholdPercent:
        budget.warningThresholdPercent ?? 80,
      enableAlerts: budget.enableAlerts !== false,
      status: budget.status,
      note: budget.note || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (busy) return;

    setShowForm(false);
    setEditing(null);
  };

  const handlePeriodChange = (periodType) => {
    setForm((previous) => ({
      ...previous,
      periodType,
      ...(periodType === "custom"
        ? {}
        : getPeriodDates(periodType)),
    }));
  };

  const saveBudget = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Le nom du budget est obligatoire.");
      return;
    }

    if (
      !form.startDate ||
      !form.endDate ||
      form.endDate < form.startDate
    ) {
      toast.error("Vérifie les dates du budget.");
      return;
    }

    const amount = Number(form.amount);

    if (
      form.amount === "" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      toast.error("Le montant prévu est invalide.");
      return;
    }

    const threshold = Number(form.warningThresholdPercent);

    if (
      !Number.isFinite(threshold) ||
      threshold < 1 ||
      threshold > 100
    ) {
      toast.error(
        "Le seuil d'alerte doit être entre 1 et 100 %."
      );
      return;
    }

    if (
      !/^[A-Z]{3}$/.test(
        form.currency.trim().toUpperCase()
      )
    ) {
      toast.error(
        "La devise doit contenir trois lettres."
      );
      return;
    }

    if (
      form.scopeType === "category" &&
      !form.category
    ) {
      toast.error(
        "Sélectionne une catégorie financière."
      );
      return;
    }

    if (
      form.scopeType === "department" &&
      !form.department
    ) {
      toast.error("Sélectionne un département.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      amount,
      warningThresholdPercent: threshold,
      currency: form.currency.trim().toUpperCase(),
      category:
        form.scopeType === "category"
          ? form.category
          : null,
      department:
        form.scopeType === "department"
          ? form.department
          : null,
    };

    try {
      setBusy(true);

      if (editing) {
        await API.put(
          `/finance/budgets/${editing._id}`,
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

      setShowForm(false);
      setEditing(null);

      await fetchBudgets();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Impossible d'enregistrer le budget."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (budget, nextStatus) => {
    const message =
      `Confirmer le changement de statut du budget ` +
      `« ${budget.name} » : ` +
      `${STATUS[budget.status]} → ${STATUS[nextStatus]} ?`;

    if (!window.confirm(message)) return;

    try {
      setBusy(true);

      await API.patch(
        `/finance/budgets/${budget._id}/status`,
        { status: nextStatus }
      );

      toast.success(
        "Statut du budget mis à jour."
      );

      await fetchBudgets();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Impossible de modifier le statut."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteBudget = async (budget) => {
    if (
      !window.confirm(
        `Supprimer définitivement le brouillon « ${budget.name} » ?`
      )
    ) {
      return;
    }

    try {
      setBusy(true);

      await API.delete(
        `/finance/budgets/${budget._id}`
      );

      toast.success("Brouillon supprimé.");

      await fetchBudgets();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Suppression impossible."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: "100%",
    minHeight: 44,
    padding: "10px 13px",
    border: "1px solid #dce3ef",
    borderRadius: 10,
    background: "#fff",
    color: "#17233b",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
  };

  const fieldStyle = {
    display: "grid",
    gap: 7,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
    alignItems: "start",
  };

  const field = (label, child, hint) => (
    <label style={fieldStyle}>
      <span
        style={{
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {label}
      </span>

      {child}

      {hint && (
        <small style={{ color: "#64748b" }}>
          {hint}
        </small>
      )}
    </label>
  );

  const select = (
    value,
    onChange,
    options,
    style = {}
  ) => (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={{
        ...inputStyle,
        ...style,
      }}
    >
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );

  const renderBudgetSummary = (budget) => {
    const summary = budget.summary || {};
    const trackingAvailable =
      budget.scopeType !== "department" &&
      summary.trackingAvailable !== false;

    const actual = Number(summary.actual ?? 0);
    const remaining = Number(
      summary.remaining ??
        (budget.amount - actual)
    );
    const percent = Number(
      summary.usagePercent ??
        (budget.amount > 0
          ? (actual / budget.amount) * 100
          : 0)
    );

    return {
      trackingAvailable,
      actual,
      remaining,
      percent,
      exceeded:
        summary.exceeded === true ||
        (trackingAvailable &&
          actual > budget.amount),
      alertTriggered:
        summary.alertTriggered === true,
    };
  };

  return (
    <Layout>
      <div className="management-page">
        {/* EN-TÊTE */}

        <div className="page-header">
          <div>
            <h1 className="page-title">
              Gestion des budgets de l'église
            </h1>

            <p className="page-subtitle">
              Prévisions des entrées de fonds,
              dépenses et suivi budgétaire
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchBudgets}
              disabled={loading || busy}
            >
              ↻ Actualiser
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreate}
              disabled={busy}
            >
              + Nouveau budget
            </button>
          </div>
        </div>

        {/* INDICATEURS */}

        <div className="management-stats-grid">
          {[
            ["Total des budgets", stats.total],
            ["Budgets actifs", stats.active],
            ["Budgets en alerte", stats.alerts],
            ["Budgets dépassés", stats.exceeded],
          ].map(([label, value]) => (
            <div
              className="management-stat-card"
              key={label}
            >
              <div className="management-stat-label">
                {label}
              </div>

              <div className="management-stat-value">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* LISTE DES BUDGETS */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
            overflow: "hidden",
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Liste des budgets
              </h2>

              <p className="page-subtitle">
                Consulte et gère les prévisions
                financières de l'église.
              </p>
            </div>
          </div>

          <div className="budget-filters">
            <input
              type="search"
              placeholder="Rechercher un budget..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {select(
              filterStatus,
              setFilterStatus,
              [
                ["all", "Tous les statuts"],
                ...Object.entries(STATUS),
              ],
              { width: "auto", minWidth: 150 }
            )}

            {select(
              filterType,
              setFilterType,
              [
                ["all", "Tous les types"],
                ["income", "Entrées de fonds"],
                ["expense", "Dépenses"],
              ],
              { width: "auto", minWidth: 150 }
            )}

            {select(
              filterCurrency,
              setFilterCurrency,
              [
                ["all", "Toutes les devises"],
                ...currencies.map((currency) => [
                  currency,
                  currency,
                ]),
              ],
              { width: "auto", minWidth: 150 }
            )}
          </div>

          {loading ? (
            <div className="management-empty">
              Chargement des budgets...
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="management-empty">
              <h3>Aucun budget trouvé</h3>
              <p>
                Crée un budget ou modifie les filtres.
              </p>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Budget</th>
                    <th>Type / Portée</th>
                    <th>Période</th>
                    <th>Montant prévu</th>
                    <th>Réalisé</th>
                    <th>Progression</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBudgets.map((budget) => {
                    const summary =
                      renderBudgetSummary(budget);

                    return (
                      <tr key={budget._id}>
                        <td>
                          <strong>
                            {budget.name}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {budget.budgetType === "income"
                              ? "Entrées de fonds"
                              : "Dépenses"}
                          </strong>

                          <div style={{ marginTop: 5 }}>
                            {SCOPE[budget.scopeType]}
                          </div>
                        </td>

                        <td>
                          <strong>
                            {PERIOD[budget.periodType]}
                          </strong>

                          <div style={{ marginTop: 5 }}>
                            {displayDate(budget.startDate)}
                          </div>

                          <div>
                            {displayDate(budget.endDate)}
                          </div>
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              budget.amount,
                              budget.currency
                            )}
                          </strong>
                        </td>

                        <td>
                          {summary.trackingAvailable
                            ? formatCurrency(
                                summary.actual,
                                budget.currency
                              )
                            : "Non disponible"}
                        </td>

                        <td>
                          {summary.trackingAvailable ? (
                            <>
                              <progress
                                className="budget-progress"
                                value={Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    summary.percent
                                  )
                                )}
                                max="100"
                              />

                              <strong>
                                {summary.percent.toFixed(1)} %
                              </strong>

                              {summary.exceeded && (
                                <div style={{ marginTop: 7 }}>
                                  <span className="status-badge status-inactive">
                                    Dépassement
                                  </span>
                                </div>
                              )}

                              {!summary.exceeded &&
                                summary.alertTriggered && (
                                  <div style={{ marginTop: 7 }}>
                                    <span className="status-badge status-pending">
                                      Alerte
                                    </span>
                                  </div>
                                )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              STATUS_CLASS[budget.status] || ""
                            }`}
                          >
                            {STATUS[budget.status] ||
                              budget.status}
                          </span>
                        </td>

                        <td>
                          <div className="budget-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                setSelectedBudget(budget)
                              }
                            >
                              Détails
                            </button>

                            {["draft", "active"].includes(
                              budget.status
                            ) && (
                              <button
                                type="button"
                                className="btn btn-edit"
                                disabled={busy}
                                onClick={() =>
                                  openEdit(budget)
                                }
                              >
                                Modifier
                              </button>
                            )}

                            {(TRANSITIONS[budget.status] || []).map(
                              (action) => (
                                <button
                                  type="button"
                                  key={action.status}
                                  disabled={busy}
                                  className={
                                    action.status === "cancelled"
                                      ? "btn btn-warning"
                                      : "btn btn-secondary"
                                  }
                                  onClick={() =>
                                    changeStatus(
                                      budget,
                                      action.status
                                    )
                                  }
                                >
                                  {action.label}
                                </button>
                              )
                            )}

                            {budget.status === "draft" && (
                              <button
                                type="button"
                                className="btn btn-danger"
                                disabled={busy}
                                onClick={() =>
                                  deleteBudget(budget)
                                }
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODALE DE CRÉATION / MODIFICATION */}

        {showForm && (
          <div
            className="budget-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !busy
              ) {
                closeForm();
              }
            }}
          >
            <div
              className="budget-modal"
              role="dialog"
              aria-modal="true"
              aria-label={
                editing
                  ? "Modifier le budget"
                  : "Créer un budget"
              }
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    {editing
                      ? "Modifier le budget"
                      : "Créer un nouveau budget"}
                  </h2>

                  <p className="page-subtitle">
                    Prévisions et paramètres budgétaires
                    de l'église
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                  disabled={busy}
                >
                  ✕ Fermer
                </button>
              </div>

              <form
                onSubmit={saveBudget}
                style={{
                  display: "grid",
                  gap: 22,
                  padding: 26,
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Informations générales
                </h3>

                {field(
                  "Nom du budget *",
                  <input
                    style={inputStyle}
                    required
                    maxLength={150}
                    value={form.name}
                    placeholder="Ex. : Évangélisation – Novembre 2026"
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                  />
                )}

                {field(
                  "Description",
                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: 90,
                    }}
                    maxLength={1000}
                    value={form.description}
                    placeholder="Objectif et utilisation des fonds"
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                  />
                )}

                <div style={gridStyle}>
                  {field(
                    "Type de budget *",
                    select(
                      form.budgetType,
                      (value) =>
                        setForm((previous) => ({
                          ...previous,
                          budgetType: value,
                          category: "",
                        })),
                      [
                        [
                          "expense",
                          "Prévisions des dépenses",
                        ],
                        [
                          "income",
                          "Prévisions des entrées de fonds",
                        ],
                      ]
                    )
                  )}

                  {field(
                    "Portée du budget *",
                    select(
                      form.scopeType,
                      (value) =>
                        setForm((previous) => ({
                          ...previous,
                          scopeType: value,
                          category: "",
                          department: "",
                        })),
                      Object.entries(SCOPE)
                    )
                  )}
                </div>

                {form.scopeType === "category" &&
                  field(
                    "Catégorie financière *",
                    select(
                      form.category,
                      (value) =>
                        updateField(
                          "category",
                          value
                        ),
                      [
                        ["", "Choisir une catégorie"],
                        ...categories
                          .filter(
                            (category) =>
                              category.type ===
                                form.budgetType &&
                              category.isActive !== false
                          )
                          .map((category) => [
                            category._id,
                            category.name,
                          ]),
                      ]
                    )
                  )}

                {form.scopeType === "department" && (
                  <>
                    {field(
                      "Département *",
                      select(
                        form.department,
                        (value) =>
                          updateField(
                            "department",
                            value
                          ),
                        [
                          ["", "Choisir un département"],
                          ...departments.map(
                            (department) => [
                              department._id,
                              department.name,
                            ]
                          ),
                        ]
                      )
                    )}

                    <p
                      style={{
                        margin: 0,
                        color: "#92400e",
                        background: "#fffbeb",
                        padding: 14,
                        borderRadius: 10,
                      }}
                    >
                      Le suivi des réalisations par
                      département n'est pas encore
                      disponible.
                    </p>
                  </>
                )}

                <h3 style={{ margin: 0 }}>
                  Période et montant
                </h3>

                <div style={gridStyle}>
                  {field(
                    "Type de période *",
                    select(
                      form.periodType,
                      handlePeriodChange,
                      Object.entries(PERIOD)
                    )
                  )}

                  {field(
                    "Devise *",
                    <input
                      style={inputStyle}
                      required
                      maxLength={3}
                      value={form.currency}
                      onChange={(event) =>
                        updateField(
                          "currency",
                          event.target.value.toUpperCase()
                        )
                      }
                    />
                  )}
                </div>

                <div style={gridStyle}>
                  {field(
                    "Date de début *",
                    <input
                      type="date"
                      style={inputStyle}
                      required
                      value={form.startDate}
                      onChange={(event) =>
                        updateField(
                          "startDate",
                          event.target.value
                        )
                      }
                    />
                  )}

                  {field(
                    "Date de fin *",
                    <input
                      type="date"
                      style={inputStyle}
                      required
                      value={form.endDate}
                      onChange={(event) =>
                        updateField(
                          "endDate",
                          event.target.value
                        )
                      }
                    />
                  )}
                </div>

                {field(
                  "Montant prévu *",
                  <input
                    type="number"
                    style={inputStyle}
                    min="0"
                    step="any"
                    required
                    value={form.amount}
                    placeholder="0"
                    onChange={(event) =>
                      updateField(
                        "amount",
                        event.target.value
                      )
                    }
                  />
                )}

                <h3 style={{ margin: 0 }}>
                  Alertes et informations complémentaires
                </h3>

                {field(
                  "Seuil d'alerte (%)",
                  <input
                    type="number"
                    style={inputStyle}
                    min="1"
                    max="100"
                    required
                    value={
                      form.warningThresholdPercent
                    }
                    onChange={(event) =>
                      updateField(
                        "warningThresholdPercent",
                        event.target.value
                      )
                    }
                  />,
                  "Exemple : 80 % du montant prévu."
                )}

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.enableAlerts}
                    onChange={(event) =>
                      updateField(
                        "enableAlerts",
                        event.target.checked
                      )
                    }
                  />
                  Activer les alertes budgétaires
                </label>

                {!editing &&
                  field(
                    "Statut initial",
                    select(
                      form.status,
                      (value) =>
                        updateField(
                          "status",
                          value
                        ),
                      [
                        ["draft", "Brouillon"],
                        ["active", "Actif"],
                      ]
                    )
                  )}

                {field(
                  "Notes internes",
                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: 90,
                    }}
                    maxLength={1000}
                    value={form.note}
                    placeholder="Informations complémentaires"
                    onChange={(event) =>
                      updateField(
                        "note",
                        event.target.value
                      )
                    }
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    paddingTop: 16,
                    borderTop:
                      "1px solid #e9edf5",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeForm}
                    disabled={busy}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                  >
                    {busy
                      ? "Enregistrement..."
                      : editing
                      ? "Enregistrer les modifications"
                      : "Créer le budget"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE DE DÉTAILS */}

        {selectedBudget && (
          <div
            className="budget-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedBudget(null);
              }
            }}
          >
            <div
              className="budget-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Détails du budget"
              style={{ maxWidth: 650 }}
            >
              <div className="management-card-header">
                <div>
                  <h2 className="management-card-title">
                    Détails du budget
                  </h2>

                  <p className="page-subtitle">
                    {selectedBudget.name}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setSelectedBudget(null)
                  }
                >
                  ✕ Fermer
                </button>
              </div>

              {(() => {
                const budget = selectedBudget;
                const summary =
                  renderBudgetSummary(budget);

                const detail = (label, value) => (
                  <div
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        "1px solid #edf0f6",
                    }}
                  >
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 12,
                        marginBottom: 5,
                      }}
                    >
                      {label}
                    </div>

                    <strong>{value}</strong>
                  </div>
                );

                return (
                  <div
                    style={{
                      padding: 26,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {detail(
                      "Nom",
                      budget.name
                    )}

                    {detail(
                      "Description",
                      budget.description || "—"
                    )}

                    {detail(
                      "Type",
                      budget.budgetType === "income"
                        ? "Entrées de fonds"
                        : "Dépenses"
                    )}

                    {detail(
                      "Portée",
                      SCOPE[budget.scopeType]
                    )}

                    {detail(
                      "Catégorie",
                      budget.category?.name || "—"
                    )}

                    {detail(
                      "Département",
                      budget.department?.name || "—"
                    )}

                    {detail(
                      "Période",
                      `${PERIOD[budget.periodType]} — ` +
                        `${displayDate(budget.startDate)} au ` +
                        `${displayDate(budget.endDate)}`
                    )}

                    {detail(
                      "Montant prévu",
                      formatCurrency(
                        budget.amount,
                        budget.currency
                      )
                    )}

                    {detail(
                      "Montant réalisé",
                      summary.trackingAvailable
                        ? formatCurrency(
                            summary.actual,
                            budget.currency
                          )
                        : "Suivi indisponible"
                    )}

                    {detail(
                      budget.budgetType === "income"
                        ? "Entrées restant à atteindre"
                        : "Montant restant",
                      summary.trackingAvailable
                        ? formatCurrency(
                            summary.remaining,
                            budget.currency
                          )
                        : "Suivi indisponible"
                    )}

                    {detail(
                      "Progression",
                      summary.trackingAvailable
                        ? `${summary.percent.toFixed(1)} %`
                        : "Suivi indisponible"
                    )}

                    {detail(
                      "Statut",
                      STATUS[budget.status]
                    )}

                    {detail(
                      "Seuil d'alerte",
                      `${budget.warningThresholdPercent ?? 80} %`
                    )}

                    {detail(
                      "Alertes activées",
                      budget.enableAlerts !== false
                        ? "Oui"
                        : "Non"
                    )}

                    {detail(
                      "Notes",
                      budget.note || "—"
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 16,
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          setSelectedBudget(null)
                        }
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
