import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import API from "../../api/axios";
import Layout from "../../components/Layout";

import "../../styles/ManagementPages.css";

// ======================================================
// CONFIG
// ======================================================

const INITIAL_FORM = {
  name: "",
  type: "income",
  code: "",
  description: "",
  icon: "",
  color: "",
  sortOrder: 0,
};

const TYPE_OPTIONS = [
  {
    value: "income",
    label: "Entrée",
    icon: "↗️",
  },
  {
    value: "expense",
    label: "Sortie",
    icon: "↘️",
  },
];

const DEFAULT_ICONS = [
  "🙏",
  "🎁",
  "💰",
  "🤝",
  "🏠",
  "💡",
  "🚗",
  "🍽️",
  "🎵",
  "📚",
  "🛠️",
  "❤️",
];

// ======================================================
// PAGE
// ======================================================

export default function FinanceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // ======================================================
  // CHARGEMENT
  // ======================================================

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const response = await API.get("/finance/categories", {
        params: {
          limit: 500,
        },
      });

      const receivedCategories = response?.data?.data || [];

      setCategories(
        Array.isArray(receivedCategories)
          ? receivedCategories
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement catégories financières :",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Impossible de charger les catégories financières."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ======================================================
  // STATISTIQUES
  // ======================================================

  const stats = useMemo(() => {
    const total = categories.length;

    const active = categories.filter(
      (category) => category.isActive !== false
    ).length;

    const income = categories.filter(
      (category) => category.type === "income"
    ).length;

    const expense = categories.filter(
      (category) => category.type === "expense"
    ).length;

    return {
      total,
      active,
      income,
      expense,
    };
  }, [categories]);

  // ======================================================
  // FILTRES
  // ======================================================

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !normalizedSearch ||
        category.name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        category.code
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        category.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        filterType === "all" ||
        category.type === filterType;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" &&
          category.isActive !== false) ||
        (filterStatus === "inactive" &&
          category.isActive === false);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    categories,
    search,
    filterType,
    filterStatus,
  ]);

  // ======================================================
  // FORMULAIRE
  // ======================================================

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingCategory(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      type: category.type || "income",
      code: category.code || "",
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "",
      sortOrder: Number(category.sortOrder || 0),
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const selectIcon = (icon) => {
    setForm((previous) => ({
      ...previous,
      icon,
    }));
  };

  // ======================================================
  // ENREGISTREMENT
  // ======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(
        "Le nom de la catégorie est obligatoire."
      );
      return;
    }

    if (
      form.type !== "income" &&
      form.type !== "expense"
    ) {
      toast.error(
        "Le type de catégorie est invalide."
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      icon: form.icon,
      color: form.color,
      sortOrder: Math.max(
        0,
        Number(form.sortOrder || 0)
      ),
    };

    try {
      setSubmitting(true);

      if (editingCategory?._id) {
        await API.put(
          `/finance/categories/${editingCategory._id}`,
          payload
        );

        toast.success(
          "Catégorie mise à jour avec succès."
        );
      } else {
        await API.post(
          "/finance/categories",
          payload
        );

        toast.success(
          "Catégorie créée avec succès."
        );
      }

      closeForm();
      await fetchCategories();
    } catch (error) {
      console.error(
        "Erreur enregistrement catégorie :",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Impossible d'enregistrer la catégorie."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // ACTIVER / DÉSACTIVER
  // ======================================================

  const toggleStatus = async (category) => {
    try {
      await API.patch(
        `/finance/categories/${category._id}/status`,
        {
          isActive: category.isActive === false,
        }
      );

      toast.success(
        category.isActive === false
          ? "Catégorie activée."
          : "Catégorie désactivée."
      );

      await fetchCategories();
    } catch (error) {
      console.error(
        "Erreur changement statut catégorie :",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Impossible de modifier le statut."
      );
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

    return type || "—";
  };

  const getTypeIcon = (type) => {
    if (type === "income") {
      return "↗️";
    }

    if (type === "expense") {
      return "↘️";
    }

    return "💰";
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des catégories financières...
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <Layout>
      <div className="management-page">

        {/* HEADER */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Catégories financières
            </h1>

            <p className="page-subtitle">
              Organisez les entrées et les sorties
              financières de votre église.
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
                  openCreateForm();
                }
              }}
            >
              {showForm
                ? "✕ Fermer"
                : "＋ Nouvelle catégorie"}
            </button>
          </div>
        </div>

        {/* STATS */}

        <div className="management-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-label">
              Total catégories
            </div>

            <div className="management-stat-value">
              {stats.total}
            </div>

            <div className="management-stat-description">
              Toutes les catégories
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Catégories actives
            </div>

            <div className="management-stat-value">
              {stats.active}
            </div>

            <div className="management-stat-description">
              Disponibles pour les mouvements
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Entrées
            </div>

            <div className="management-stat-value">
              {stats.income}
            </div>

            <div className="management-stat-description">
              Dîmes, offrandes, dons...
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Sorties
            </div>

            <div className="management-stat-value">
              {stats.expense}
            </div>

            <div className="management-stat-description">
              Charges, aides, achats...
            </div>
          </div>
        </div>

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
                  {editingCategory
                    ? "Modifier la catégorie"
                    : "Nouvelle catégorie"}
                </h2>

                <p className="page-subtitle">
                  {editingCategory
                    ? "Modifiez les informations de cette catégorie financière."
                    : "Ajoutez une catégorie pour classer les entrées ou les sorties."}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                padding: 24,
              }}
            >
              <div style={gridStyle}>

                {/* NOM */}

                <Field label="Nom *">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={
                      form.type === "income"
                        ? "Ex. Dîmes"
                        : "Ex. Électricité"
                    }
                    required
                    style={inputStyle}
                  />
                </Field>

                {/* TYPE */}

                <Field label="Type *">
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* CODE */}

                <Field label="Code">
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="Ex. DIME"
                    maxLength={30}
                    style={inputStyle}
                  />
                </Field>

                {/* ORDRE */}

                <Field label="Ordre d'affichage">
                  <input
                    type="number"
                    name="sortOrder"
                    value={form.sortOrder}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* ICÔNES */}

              <div
                style={{
                  marginTop: 22,
                }}
              >
                <label style={labelStyle}>
                  Icône
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {DEFAULT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() =>
                        selectIcon(icon)
                      }
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        border:
                          form.icon === icon
                            ? "2px solid #5b48ee"
                            : "1px solid #dbe2ea",
                        background:
                          form.icon === icon
                            ? "#f0edff"
                            : "#ffffff",
                        cursor: "pointer",
                        fontSize: 20,
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* COULEUR */}

              <div
                style={{
                  marginTop: 22,
                }}
              >
                <label style={labelStyle}>
                  Couleur
                </label>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="color"
                    name="color"
                    value={
                      form.color || "#5b48ee"
                    }
                    onChange={handleChange}
                    style={{
                      width: 52,
                      height: 42,
                      padding: 2,
                      border:
                        "1px solid #dbe2ea",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    placeholder="#5b48ee"
                    style={{
                      ...inputStyle,
                      maxWidth: 180,
                    }}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}

              <div
                style={{
                  marginTop: 22,
                }}
              >
                <label style={labelStyle}>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  placeholder="Description de la catégorie..."
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              {/* ACTIONS */}

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 24,
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
                    : editingCategory
                    ? "✓ Enregistrer les modifications"
                    : "✓ Créer la catégorie"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                  disabled={submitting}
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
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Liste des catégories
              </h2>

              <p className="page-subtitle">
                Catégories utilisées pour classer les
                mouvements financiers.
              </p>
            </div>

            <span className="status-badge status-planned">
              {filteredCategories.length} catégorie
              {filteredCategories.length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          {/* FILTRES */}

          <div style={filterStyle}>
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher une catégorie..."
              style={{
                ...inputStyle,
                maxWidth: 330,
              }}
            />

            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(event.target.value)
              }
              style={{
                ...inputStyle,
                maxWidth: 210,
              }}
            >
              <option value="all">
                Tous les types
              </option>

              <option value="income">
                Entrées
              </option>

              <option value="expense">
                Sorties
              </option>
            </select>

            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value)
              }
              style={{
                ...inputStyle,
                maxWidth: 210,
              }}
            >
              <option value="all">
                Tous les statuts
              </option>

              <option value="active">
                Actives
              </option>

              <option value="inactive">
                Inactives
              </option>
            </select>
          </div>

          {/* TABLE */}

          {filteredCategories.length > 0 ? (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Type</th>
                    <th>Code</th>
                    <th>Ordre</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map(
                    (category) => (
                      <tr key={category._id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                background:
                                  category.color
                                    ? `${category.color}18`
                                    : "#f3f4f6",
                              }}
                            >
                              {category.icon || "💰"}
                            </div>

                            <div>
                              <strong>
                                {category.name}
                              </strong>

                              {category.description && (
                                <div
                                  style={{
                                    marginTop: 3,
                                    color: "#64748b",
                                    fontSize: 12,
                                  }}
                                >
                                  {category.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          {getTypeIcon(category.type)}{" "}
                          {getTypeLabel(category.type)}
                        </td>

                        <td>
                          {category.code || "—"}
                        </td>

                        <td>
                          {category.sortOrder ?? 0}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              category.isActive !== false
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {category.isActive !== false
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                openEditForm(category)
                              }
                            >
                              Modifier
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                toggleStatus(category)
                              }
                            >
                              {category.isActive !== false
                                ? "Désactiver"
                                : "Activer"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="management-empty">
              <div className="management-empty-icon">
                🗂️
              </div>

              <h3>
                Aucune catégorie financière
              </h3>

              <p>
                Créez des catégories pour organiser les
                entrées et les sorties de votre église.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateForm}
              >
                ＋ Nouvelle catégorie
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ======================================================
// FIELD
// ======================================================

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>
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
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 18,
};

const filterStyle = {
  padding: "18px 24px",
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  borderBottom: "1px solid #e8edf3",
};