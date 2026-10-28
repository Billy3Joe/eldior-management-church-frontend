// src/pages/finance/FinanceTransactions.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";

import API from "../../api/axios";
import Layout from "../../components/Layout";
import { formatCurrency } from "../../constants/currencies";
import "../../styles/ManagementPages.css";

const today = new Date().toISOString().slice(0, 10);

const getInitialForm = (defaultCurrency = "EUR") => ({
  type: "income",
  title: "",
  amount: "",
  transactionDate: today,
  account: "",
  category: "",
  fromAccount: "",
  toAccount: "",
  currency: String(defaultCurrency || "EUR").toUpperCase(),
  paymentMethod: "cash",
  donorName: "",
  isAnonymous: false,
  reference: "",
  receiptNumber: "",
  description: "",
  note: "",
  status: "confirmed",
});

const PAYMENT_METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "card", label: "Carte bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Chèque" },
  { value: "online", label: "Paiement en ligne" },
  { value: "other", label: "Autre" },
];

const getMonthBounds = (value) => {
  const [year, month] = value.split("-").map(Number);

  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  };
};

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return value._id || "";
};

const extractList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.transactions)) return data.transactions;
  if (Array.isArray(data?.accounts)) return data.accounts;
  if (Array.isArray(data?.categories)) return data.categories;

  return [];
};

export default function FinanceTransactions() {
  const [searchParams] = useSearchParams();

  const urlMonth = searchParams.get("month") || "";
  const urlCurrency = (searchParams.get("currency") || "").toUpperCase();
  const urlType = searchParams.get("type") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlSearch = searchParams.get("search") || "";

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [defaultCurrency, setDefaultCurrency] = useState("EUR");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [search, setSearch] = useState(urlSearch);
  const [filterType, setFilterType] = useState(
    ["income", "expense", "transfer"].includes(urlType) ? urlType : "all"
  );
  const [filterStatus, setFilterStatus] = useState(
    ["confirmed", "draft", "cancelled"].includes(urlStatus)
      ? urlStatus
      : "all"
  );
  const [filterCurrency, setFilterCurrency] = useState(
    urlCurrency || "all"
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(
    /^\d{4}-\d{2}$/.test(urlMonth) ? urlMonth : currentMonth
  );
  const [statsCurrency, setStatsCurrency] = useState(urlCurrency);

  const [form, setForm] = useState(() => getInitialForm("EUR"));

  // =========================================================
  // CHARGEMENT
  // =========================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        transactionsResponse,
        accountsResponse,
        categoriesResponse,
        settingsResponse,
      ] = await Promise.all([
        API.get("/finance/transactions", {
          params: {
            limit: 500,
          },
        }),

        API.get("/finance/accounts"),

        API.get("/finance/categories", {
          params: {
            limit: 500,
            isActive: true,
          },
        }),

        API.get("/settings"),
      ]);

      const transactionsData = extractList(transactionsResponse);
      const accountsData = extractList(accountsResponse);
      const categoriesData = extractList(categoriesResponse);

      const churchCurrency = String(
        settingsResponse?.data?.data?.defaultCurrency ||
          settingsResponse?.data?.data?.church?.defaultCurrency ||
          settingsResponse?.data?.defaultCurrency ||
          settingsResponse?.data?.church?.defaultCurrency ||
          "EUR"
      ).toUpperCase();

      setTransactions(transactionsData);
      setAccounts(accountsData);
      setCategories(categoriesData);

      setDefaultCurrency(churchCurrency);

      setForm((previous) => {
        const hasFinancialSelection =
          previous.account ||
          previous.fromAccount ||
          previous.toAccount;

        if (hasFinancialSelection || editingTransaction) {
          return previous;
        }

        return {
          ...previous,
          currency: churchCurrency,
        };
      });
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible de charger les données financières."
      );
    } finally {
      setLoading(false);
    }
  }, [editingTransaction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (/^\d{4}-\d{2}$/.test(urlMonth)) {
      setSelectedMonth(urlMonth);
    }

    if (urlCurrency) {
      setStatsCurrency(urlCurrency);
      setFilterCurrency(urlCurrency);
    }

    setFilterType(
      ["income", "expense", "transfer"].includes(urlType)
        ? urlType
        : "all"
    );

    setFilterStatus(
      ["confirmed", "draft", "cancelled"].includes(urlStatus)
        ? urlStatus
        : "all"
    );

    setSearch(urlSearch);
  }, [urlMonth, urlCurrency, urlType, urlStatus, urlSearch]);

  // =========================================================
  // COMPTES / CATÉGORIES
  // =========================================================

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.isActive !== false),
    [accounts]
  );

  const availableCategories = useMemo(() => {
    if (form.type === "transfer") {
      return [];
    }

    return categories.filter(
      (category) =>
        category.isActive !== false &&
        category.type === form.type
    );
  }, [categories, form.type]);

  const availableCurrencies = useMemo(() => {
    const currencies = new Set();

    if (defaultCurrency) {
      currencies.add(String(defaultCurrency).toUpperCase());
    }

    accounts.forEach((account) => {
      if (account.currency) {
        currencies.add(String(account.currency).toUpperCase());
      }
    });

    transactions.forEach((transaction) => {
      if (transaction.currency) {
        currencies.add(
          String(transaction.currency).toUpperCase()
        );
      }
    });

    if (currencies.size === 0) {
      currencies.add(defaultCurrency || "EUR");
    }

    return Array.from(currencies).sort();
  }, [accounts, transactions, defaultCurrency]);

  // =========================================================
  // TRANSACTIONS DU MOIS
  // =========================================================

  const monthlyTransactions = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }

    const { start, end } = getMonthBounds(selectedMonth);

    return transactions.filter((transaction) => {
      if (transaction.status !== "confirmed") {
        return false;
      }

      const date = new Date(transaction.transactionDate);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return date >= start && date <= end;
    });
  }, [transactions, selectedMonth]);

  // =========================================================
  // DEVISES DU MOIS
  // =========================================================

  const monthlyCurrencies = useMemo(() => {
    const currencies = new Set();

    if (defaultCurrency) {
      currencies.add(String(defaultCurrency).toUpperCase());
    }

    monthlyTransactions.forEach((transaction) => {
      if (transaction.currency) {
        currencies.add(
          String(transaction.currency).toUpperCase()
        );
      }
    });

    activeAccounts.forEach((account) => {
      if (account.currency) {
        currencies.add(String(account.currency).toUpperCase());
      }
    });

    if (currencies.size === 0) {
      currencies.add(defaultCurrency || "EUR");
    }

    return Array.from(currencies).sort();
  }, [
    monthlyTransactions,
    activeAccounts,
    defaultCurrency,
  ]);

  useEffect(() => {
    if (!monthlyCurrencies.length) {
      return;
    }

    if (
      !statsCurrency ||
      !monthlyCurrencies.includes(statsCurrency)
    ) {
      if (
        defaultCurrency &&
        monthlyCurrencies.includes(defaultCurrency)
      ) {
        setStatsCurrency(defaultCurrency);
      } else {
        setStatsCurrency(
          monthlyCurrencies[0] || defaultCurrency || "EUR"
        );
      }
    }
  }, [
    monthlyCurrencies,
    statsCurrency,
    defaultCurrency,
  ]);

  // =========================================================
  // STATISTIQUES MULTI-DEVISES
  // =========================================================

  const monthlyStatsByCurrency = useMemo(() => {
    const stats = {};

    const ensureCurrency = (currency) => {
      // EUR reste le fallback des anciennes transactions
      // qui ne possèdent pas de champ currency.
      const code = String(currency || "EUR").toUpperCase();

      if (!stats[code]) {
        stats[code] = {
          currency: code,
          income: 0,
          expense: 0,
          net: 0,
          tithe: 0,
          offering: 0,
          donation: 0,
          donors: new Set(),
          transactionCount: 0,
        };
      }

      return stats[code];
    };

    monthlyTransactions.forEach((transaction) => {
      const currency = String(
        transaction.currency || "EUR"
      ).toUpperCase();

      const current = ensureCurrency(currency);
      const amount = Number(transaction.amount || 0);

      current.transactionCount += 1;

      if (transaction.type === "income") {
        current.income += amount;

        const categoryName = normalizeText(
          transaction.category?.name || ""
        );

        const isTithe =
          categoryName.includes("dime") ||
          categoryName.includes("tithe");

        const isOffering =
          categoryName.includes("offrande") ||
          categoryName.includes("offering");

        const isDonation =
          !isOffering &&
          (categoryName === "don" ||
            categoryName.includes("donation") ||
            categoryName.startsWith("don "));

        if (isTithe) {
          current.tithe += amount;
        }

        if (isOffering) {
          current.offering += amount;
        }

        if (isDonation) {
          current.donation += amount;
        }

        if (!transaction.isAnonymous) {
          let donorKey = "";

          if (transaction.member) {
            donorKey =
              getId(transaction.member) ||
              transaction.member.name ||
              `${transaction.member.firstName || ""} ${
                transaction.member.lastName || ""
              }`.trim();
          }

          if (!donorKey) {
            donorKey = transaction.donorName?.trim() || "";
          }

          if (donorKey) {
            current.donors.add(
              normalizeText(String(donorKey))
            );
          }
        }
      }

      if (transaction.type === "expense") {
        current.expense += amount;
      }
    });

    Object.values(stats).forEach((item) => {
      item.net = item.income - item.expense;
      item.donors = item.donors.size;
    });

    return stats;
  }, [monthlyTransactions]);

  const monthlyStats = useMemo(() => {
    return (
      monthlyStatsByCurrency[statsCurrency] || {
        currency: statsCurrency || defaultCurrency || "EUR",
        income: 0,
        expense: 0,
        net: 0,
        tithe: 0,
        offering: 0,
        donation: 0,
        donors: 0,
        transactionCount: 0,
      }
    );
  }, [
    monthlyStatsByCurrency,
    statsCurrency,
    defaultCurrency,
  ]);

  // =========================================================
  // FILTRES HISTORIQUE
  // =========================================================

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return transactions.filter((transaction) => {
      const matchesType =
        filterType === "all" ||
        transaction.type === filterType;

      const matchesStatus =
        filterStatus === "all" ||
        transaction.status === filterStatus;

      const transactionCurrency = String(
        transaction.currency || "EUR"
      ).toUpperCase();

      const matchesCurrency =
        filterCurrency === "all" ||
        transactionCurrency === filterCurrency;

      const donor =
        transaction.member?.name ||
        `${transaction.member?.firstName || ""} ${
          transaction.member?.lastName || ""
        }`.trim() ||
        transaction.donorName ||
        "";

      const searchableText = normalizeText(
        [
          transaction.title,
          transaction.reference,
          transaction.receiptNumber,
          donor,
          transaction.category?.name,
          transaction.account?.name,
          transaction.fromAccount?.name,
          transaction.toAccount?.name,
          transaction.currency,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      let matchesMonth = true;

      if (/^\d{4}-\d{2}$/.test(urlMonth)) {
        const { start, end } = getMonthBounds(urlMonth);
        const transactionDate = new Date(transaction.transactionDate);

        matchesMonth =
          !Number.isNaN(transactionDate.getTime()) &&
          transactionDate >= start &&
          transactionDate <= end;
      }

      return (
        matchesType &&
        matchesStatus &&
        matchesCurrency &&
        matchesSearch &&
        matchesMonth
      );
    });
  }, [
    transactions,
    filterType,
    filterStatus,
    filterCurrency,
    search,
    urlMonth,
  ]);

  // =========================================================
  // FORMULAIRE
  // =========================================================

  const resetForm = () => {
    setForm(
      getInitialForm(defaultCurrency || "EUR")
    );

    setEditingTransaction(null);
  };

  const openCreateForm = () => {
    setEditingTransaction(null);

    setForm(
      getInitialForm(defaultCurrency || "EUR")
    );

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

  const openEditForm = (transaction) => {
    if (transaction.status !== "draft") {
      toast.info(
        "Seuls les brouillons peuvent être modifiés."
      );

      return;
    }

    setEditingTransaction(transaction);

    setForm({
      type: transaction.type || "income",
      title: transaction.title || "",
      amount: transaction.amount ?? "",

      transactionDate: transaction.transactionDate
        ? new Date(transaction.transactionDate)
            .toISOString()
            .slice(0, 10)
        : today,

      account: getId(transaction.account),
      category: getId(transaction.category),

      fromAccount: getId(transaction.fromAccount),
      toAccount: getId(transaction.toAccount),

      currency: String(
        transaction.currency || "EUR"
      ).toUpperCase(),

      paymentMethod:
        transaction.paymentMethod || "cash",

      donorName: transaction.donorName || "",
      isAnonymous: Boolean(transaction.isAnonymous),

      reference: transaction.reference || "",
      receiptNumber: transaction.receiptNumber || "",

      description: transaction.description || "",
      note: transaction.note || "",

      status: "draft",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => {
      const next = {
        ...previous,
        [name]:
          type === "checkbox" ? checked : value,
      };

      if (name === "type") {
        next.category = "";
        next.account = "";
        next.fromAccount = "";
        next.toAccount = "";

        next.currency =
          defaultCurrency ||
          previous.currency ||
          "EUR";

        next.paymentMethod =
          value === "transfer"
            ? "bank_transfer"
            : "cash";

        next.donorName = "";
        next.isAnonymous = false;
      }

      if (name === "isAnonymous" && checked) {
        next.donorName = "";
      }

      return next;
    });
  };

  const handleAccountChange = (event) => {
    const accountId = event.target.value;

    const selectedAccount = activeAccounts.find(
      (account) => account._id === accountId
    );

    setForm((previous) => ({
      ...previous,
      account: accountId,

      currency: String(
        selectedAccount?.currency ||
          defaultCurrency ||
          previous.currency ||
          "EUR"
      ).toUpperCase(),
    }));
  };

  const handleFromAccountChange = (event) => {
    const accountId = event.target.value;

    const selectedAccount = activeAccounts.find(
      (account) => account._id === accountId
    );

    setForm((previous) => {
      const currency = String(
        selectedAccount?.currency ||
          defaultCurrency ||
          previous.currency ||
          "EUR"
      ).toUpperCase();

      const currentDestination =
        activeAccounts.find(
          (account) =>
            account._id === previous.toAccount
        );

      const destinationStillValid =
        currentDestination &&
        currentDestination._id !== accountId &&
        String(
          currentDestination.currency || ""
        ).toUpperCase() === currency;

      return {
        ...previous,
        fromAccount: accountId,

        toAccount: destinationStillValid
          ? previous.toAccount
          : "",

        currency,
      };
    });
  };

  const transferDestinationAccounts = useMemo(() => {
    if (!form.fromAccount) {
      return [];
    }

    return activeAccounts.filter(
      (account) =>
        account._id !== form.fromAccount &&
        String(account.currency || "").toUpperCase() ===
          String(form.currency || "").toUpperCase()
    );
  }, [
    activeAccounts,
    form.fromAccount,
    form.currency,
  ]);

  // =========================================================
  // ENREGISTRER
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Le libellé est obligatoire.");
      return;
    }

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      toast.error(
        "Le montant doit être supérieur à zéro."
      );

      return;
    }

    if (!form.transactionDate) {
      toast.error("La date est obligatoire.");
      return;
    }

    if (form.type !== "transfer") {
      if (!form.account) {
        toast.error(
          "Sélectionnez un compte financier."
        );

        return;
      }

      if (!form.category) {
        toast.error("Sélectionnez une catégorie.");
        return;
      }

      const selectedAccount = activeAccounts.find(
        (account) => account._id === form.account
      );

      if (!selectedAccount) {
        toast.error("Compte financier invalide.");
        return;
      }
    }

    if (form.type === "transfer") {
      if (!form.fromAccount || !form.toAccount) {
        toast.error(
          "Sélectionnez le compte source et le compte destination."
        );

        return;
      }

      if (form.fromAccount === form.toAccount) {
        toast.error(
          "Les comptes source et destination doivent être différents."
        );

        return;
      }

      const sourceAccount = activeAccounts.find(
        (account) =>
          account._id === form.fromAccount
      );

      const destinationAccount =
        activeAccounts.find(
          (account) =>
            account._id === form.toAccount
        );

      if (!sourceAccount || !destinationAccount) {
        toast.error(
          "Compte source ou destination invalide."
        );

        return;
      }

      if (
        String(sourceAccount.currency).toUpperCase() !==
        String(
          destinationAccount.currency
        ).toUpperCase()
      ) {
        toast.error(
          "Le compte source et le compte destination doivent utiliser la même devise."
        );

        return;
      }
    }

    const payload = {
      type: form.type,
      title: form.title.trim(),
      amount,

      currency: String(
        form.currency ||
          defaultCurrency ||
          "EUR"
      ).toUpperCase(),

      transactionDate: form.transactionDate,

      description: form.description.trim(),
      reference: form.reference.trim(),
      receiptNumber: form.receiptNumber.trim(),
      note: form.note.trim(),

      paymentMethod:
        form.type === "transfer"
          ? "bank_transfer"
          : form.paymentMethod,

      status: editingTransaction
        ? "draft"
        : form.status,
    };

    if (form.type !== "transfer") {
      payload.account = form.account;
      payload.category = form.category;
    }

    if (form.type === "income") {
      payload.isAnonymous = form.isAnonymous;

      payload.donorName = form.isAnonymous
        ? ""
        : form.donorName.trim();
    }

    if (form.type === "transfer") {
      payload.fromAccount = form.fromAccount;
      payload.toAccount = form.toAccount;
    }

    try {
      setSubmitting(true);

      if (editingTransaction) {
        await API.put(
          `/finance/transactions/${editingTransaction._id}`,
          payload
        );

        toast.success(
          "Brouillon modifié avec succès."
        );
      } else {
        await API.post(
          "/finance/transactions",
          payload
        );

        toast.success(
          "Transaction enregistrée avec succès."
        );
      }

      closeForm();
      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible d'enregistrer la transaction."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // CONFIRMER
  // =========================================================

  const confirmTransaction = async (transaction) => {
    const confirmed = window.confirm(
      `Confirmer la transaction « ${transaction.title} » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(transaction._id);

      await API.patch(
        `/finance/transactions/${transaction._id}/confirm`
      );

      toast.success("Transaction confirmée.");

      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible de confirmer la transaction."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // ANNULER
  // =========================================================

  const cancelTransaction = async (transaction) => {
    const reason = window.prompt(
      "Motif de l'annulation :",
      ""
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      toast.error(
        "Veuillez indiquer le motif de l'annulation."
      );

      return;
    }

    try {
      setActionLoading(transaction._id);

      await API.patch(
        `/finance/transactions/${transaction._id}/cancel`,
        {
          cancellationReason: reason.trim(),
        }
      );

      toast.success("Transaction annulée.");

      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible d'annuler la transaction."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // SUPPRIMER
  // =========================================================

  const deleteTransaction = async (transaction) => {
    let message = "";

    if (transaction.status === "confirmed") {
      message =
        `⚠️ Cette transaction est confirmée.\n\n` +
        `La suppression de « ${transaction.title} » modifiera automatiquement le solde du compte afin d'annuler son mouvement financier.\n\n` +
        `Cette action est définitive.\n\n` +
        `Continuer ?`;
    } else if (transaction.status === "cancelled") {
      message =
        `Supprimer définitivement la transaction annulée « ${transaction.title} » ?\n\n` +
        `Cette action est irréversible.`;
    } else {
      message =
        `Supprimer définitivement le brouillon « ${transaction.title} » ?`;
    }

    const confirmed = window.confirm(message);

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(transaction._id);

      await API.delete(
        `/finance/transactions/${transaction._id}`
      );

      toast.success(
        "Transaction supprimée avec succès."
      );

      if (
        editingTransaction?._id === transaction._id
      ) {
        closeForm();
      }

      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Impossible de supprimer la transaction."
      );
    } finally {
      setActionLoading("");
    }
  };  // =========================================================
  // HELPERS
  // =========================================================

  const getTypeLabel = (type) => {
    if (type === "income") return "Entrée";
    if (type === "expense") return "Sortie";
    if (type === "transfer") return "Transfert";

    return type || "—";
  };

  const getTypeIcon = (type) => {
    if (type === "income") return "↗️";
    if (type === "expense") return "↘️";

    return "🔄";
  };

  const getStatusLabel = (status) => {
    if (status === "confirmed") return "Confirmée";
    if (status === "draft") return "Brouillon";
    if (status === "cancelled") return "Annulée";

    return status || "—";
  };

  const getPaymentLabel = (method) =>
    PAYMENT_METHODS.find(
      (item) => item.value === method
    )?.label ||
    method ||
    "—";

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "fr-FR"
    ).format(parsedDate);
  };

  const getDonorName = (transaction) => {
    if (transaction.type !== "income") {
      return "—";
    }

    if (transaction.isAnonymous) {
      return "Anonyme";
    }

    if (transaction.member) {
      return (
        transaction.member.name ||
        `${transaction.member.firstName || ""} ${
          transaction.member.lastName || ""
        }`.trim() ||
        "—"
      );
    }

    return transaction.donorName || "—";
  };

  // =========================================================
  // CHARGEMENT
  // =========================================================

  if (loading) {
    return (
      <Layout>
        <div className="management-page">
          <div className="management-card">
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement des transactions financières...
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // =========================================================
  // AFFICHAGE
  // =========================================================

  return (
    <Layout>
      <div className="management-page">

        {/* HEADER */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Transactions financières
            </h1>

            <p className="page-subtitle">
              Suivez les entrées, sorties, dons,
              dîmes, offrandes et transferts de
              l'église.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                showForm
                  ? closeForm()
                  : openCreateForm()
              }
            >
              {showForm
                ? "✕ Fermer"
                : "＋ Nouvelle transaction"}
            </button>
          </div>
        </div>

        {/* MOIS + DEVISE */}

        <div
          className="management-card"
          style={{ marginBottom: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <strong>
              📅 Statistiques du mois
            </strong>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value
                )
              }
              style={{
                ...inputStyle,
                width: "auto",
              }}
            />

            <select
              value={statsCurrency}
              onChange={(event) =>
                setStatsCurrency(
                  event.target.value
                )
              }
              style={{
                ...inputStyle,
                width: "auto",
                minWidth: 120,
              }}
            >
              {monthlyCurrencies.map(
                (currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                )
              )}
            </select>

            <span>
              {monthlyStats.transactionCount}{" "}
              transaction(s) confirmée(s) en{" "}
              <strong>{statsCurrency}</strong>
            </span>
          </div>
        </div>

        {/* STATS PRINCIPALES */}

        <div className="management-stats-grid">
          <StatCard
            label="Entrées"
            value={formatCurrency(
              monthlyStats.income,
              statsCurrency
            )}
            description={`Entrées du mois en ${statsCurrency}`}
          />

          <StatCard
            label="Sorties"
            value={formatCurrency(
              monthlyStats.expense,
              statsCurrency
            )}
            description={`Sorties du mois en ${statsCurrency}`}
          />

          <StatCard
            label="Solde net"
            value={formatCurrency(
              monthlyStats.net,
              statsCurrency
            )}
            description="Entrées - sorties"
          />

          <StatCard
            label="Donateurs"
            value={monthlyStats.donors}
            description="Donateurs identifiés"
          />
        </div>

        {/* STATS ÉGLISE */}

        <div
          className="management-stats-grid"
          style={{ marginTop: 15 }}
        >
          <StatCard
            label="🙏 Dîmes"
            value={formatCurrency(
              monthlyStats.tithe,
              statsCurrency
            )}
            description={`Dîmes en ${statsCurrency}`}
          />

          <StatCard
            label="🎁 Offrandes"
            value={formatCurrency(
              monthlyStats.offering,
              statsCurrency
            )}
            description={`Offrandes en ${statsCurrency}`}
          />

          <StatCard
            label="❤️ Dons"
            value={formatCurrency(
              monthlyStats.donation,
              statsCurrency
            )}
            description={`Dons en ${statsCurrency}`}
          />

          <StatCard
            label="📊 Mouvements"
            value={monthlyStats.transactionCount}
            description={`Mouvements en ${statsCurrency}`}
          />
        </div>

        {/* SYNTHÈSE MULTI-DEVISES */}

        {monthlyCurrencies.length > 1 && (
          <div
            className="management-card"
            style={{ marginTop: 24 }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Synthèse par devise
                </h2>

                <p className="page-subtitle">
                  Chaque devise est comptabilisée
                  séparément.
                </p>
              </div>
            </div>

            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Devise</th>
                    <th>Entrées</th>
                    <th>Sorties</th>
                    <th>Solde net</th>
                    <th>Mouvements</th>
                  </tr>
                </thead>

                <tbody>
                  {monthlyCurrencies.map(
                    (currency) => {
                      const stats =
                        monthlyStatsByCurrency[
                          currency
                        ] || {
                          income: 0,
                          expense: 0,
                          net: 0,
                          transactionCount: 0,
                        };

                      return (
                        <tr key={currency}>
                          <td>
                            <strong>
                              {currency}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              stats.income,
                              currency
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              stats.expense,
                              currency
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                stats.net,
                                currency
                              )}
                            </strong>
                          </td>

                          <td>
                            {stats.transactionCount}
                          </td>
                        </tr>
                      );
                    }
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
            style={{ marginTop: 24 }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  {editingTransaction
                    ? "Modifier le brouillon"
                    : "Nouvelle transaction"}
                </h2>

                <p className="page-subtitle">
                  Enregistrez un mouvement financier.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={formGridStyle}>

                <Field label="Type de mouvement">
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="income">
                      ↗️ Entrée
                    </option>

                    <option value="expense">
                      ↘️ Sortie
                    </option>

                    <option value="transfer">
                      🔄 Transfert
                    </option>
                  </select>
                </Field>

                <Field label="Date">
                  <input
                    type="date"
                    name="transactionDate"
                    value={form.transactionDate}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Libellé">
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Ex : Dîme, offrande, facture..."
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Montant">
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

                {form.type !== "transfer" && (
                  <>
                    <Field label="Compte financier">
                      <select
                        name="account"
                        value={form.account}
                        onChange={
                          handleAccountChange
                        }
                        style={inputStyle}
                        required
                      >
                        <option value="">
                          Sélectionner...
                        </option>

                        {activeAccounts.map(
                          (account) => (
                            <option
                              key={account._id}
                              value={account._id}
                            >
                              {account.name} —{" "}
                              {account.currency}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

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
                              {category.icon ||
                                "•"}{" "}
                              {category.name}
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                  </>
                )}

                {form.type === "transfer" && (
                  <>
                    <Field label="Compte source">
                      <select
                        name="fromAccount"
                        value={form.fromAccount}
                        onChange={
                          handleFromAccountChange
                        }
                        style={inputStyle}
                        required
                      >
                        <option value="">
                          Sélectionner...
                        </option>

                        {activeAccounts.map(
                          (account) => (
                            <option
                              key={account._id}
                              value={account._id}
                            >
                              {account.name} —{" "}
                              {account.currency}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    <Field label="Compte destination">
                      <select
                        name="toAccount"
                        value={form.toAccount}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                        disabled={
                          !form.fromAccount
                        }
                      >
                        <option value="">
                          Sélectionner...
                        </option>

                        {transferDestinationAccounts.map(
                          (account) => (
                            <option
                              key={account._id}
                              value={account._id}
                            >
                              {account.name} —{" "}
                              {account.currency}
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                  </>
                )}

                <Field label="Devise">
                  <input
                    value={form.currency}
                    style={inputStyle}
                    readOnly
                  />
                </Field>

                {form.type !== "transfer" && (
                  <Field label="Moyen de paiement">
                    <select
                      name="paymentMethod"
                      value={
                        form.paymentMethod
                      }
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {PAYMENT_METHODS.map(
                        (method) => (
                          <option
                            key={method.value}
                            value={method.value}
                          >
                            {method.label}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                )}

                {form.type === "income" && (
                  <>
                    <Field label="Nom du donateur">
                      <input
                        type="text"
                        name="donorName"
                        value={form.donorName}
                        onChange={handleChange}
                        disabled={
                          form.isAnonymous
                        }
                        placeholder="Nom et prénom"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Don anonyme">
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minHeight: 45,
                        }}
                      >
                        <input
                          type="checkbox"
                          name="isAnonymous"
                          checked={
                            form.isAnonymous
                          }
                          onChange={
                            handleChange
                          }
                        />

                        Donateur anonyme
                      </label>
                    </Field>
                  </>
                )}

                <Field label="Référence">
                  <input
                    name="reference"
                    value={form.reference}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Référence facultative"
                  />
                </Field>

                <Field label="N° reçu">
                  <input
                    name="receiptNumber"
                    value={
                      form.receiptNumber
                    }
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Numéro de reçu"
                  />
                </Field>

                {!editingTransaction && (
                  <Field label="Statut">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="confirmed">
                        Confirmée
                      </option>

                      <option value="draft">
                        Brouillon
                      </option>
                    </select>
                  </Field>
                )}
              </div>

              <div style={{ marginTop: 18 }}>
                <Field label="Description">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div style={{ marginTop: 18 }}>
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
                    : editingTransaction
                    ? "💾 Enregistrer les modifications"
                    : "✓ Enregistrer"}
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

        {/* HISTORIQUE */}

        <div
          className="management-card"
          style={{ marginTop: 24 }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Historique des transactions
              </h2>

              <p className="page-subtitle">
                {filteredTransactions.length}{" "}
                transaction(s)
              </p>
            </div>
          </div>

          {/* FILTRES */}

          <div style={filtersGridStyle}>
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher libellé, donateur, catégorie..."
              style={inputStyle}
            />

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

              <option value="income">
                Entrées
              </option>

              <option value="expense">
                Sorties
              </option>

              <option value="transfer">
                Transferts
              </option>
            </select>

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

              <option value="confirmed">
                Confirmées
              </option>

              <option value="draft">
                Brouillons
              </option>

              <option value="cancelled">
                Annulées
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

              {availableCurrencies.map(
                (currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                )
              )}
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                💳
              </div>

              <h3>Aucune transaction</h3>

              <p>
                Enregistrez votre première entrée,
                sortie ou transfert.
              </p>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Libellé</th>
                    <th>Catégorie</th>
                    <th>Type</th>
                    <th>Donateur</th>
                    <th>Compte</th>
                    <th>Montant</th>
                    <th>Paiement</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (transaction) => (
                      <tr
                        key={transaction._id}
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

                          {transaction.reference && (
                            <div
                              style={{
                                fontSize: 12,
                                opacity: 0.7,
                                marginTop: 3,
                              }}
                            >
                              Réf.{" "}
                              {
                                transaction.reference
                              }
                            </div>
                          )}

                          {transaction.receiptNumber && (
                            <div
                              style={{
                                fontSize: 12,
                                opacity: 0.7,
                              }}
                            >
                              Reçu :{" "}
                              {
                                transaction.receiptNumber
                              }
                            </div>
                          )}
                        </td>

                        <td>
                          {transaction.category
                            ?.icon && (
                            <>
                              {
                                transaction
                                  .category.icon
                              }{" "}
                            </>
                          )}

                          {transaction.category
                            ?.name || "—"}
                        </td>

                        <td>
                          {getTypeIcon(
                            transaction.type
                          )}{" "}
                          {getTypeLabel(
                            transaction.type
                          )}
                        </td>

                        <td>
                          {getDonorName(
                            transaction
                          )}
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
                          <strong>
                            {formatCurrency(
                              transaction.amount,
                              transaction.currency ||
                                "EUR"
                            )}
                          </strong>

                          <div
                            style={{
                              fontSize: 11,
                              opacity: 0.65,
                              marginTop: 2,
                            }}
                          >
                            {transaction.currency ||
                              "EUR"}
                          </div>
                        </td>

                        <td>
                          {transaction.type ===
                          "transfer"
                            ? "Virement"
                            : getPaymentLabel(
                                transaction.paymentMethod
                              )}
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
                          {getStatusLabel(transaction.status)}
                        </span>
                       </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            {transaction.status ===
                              "draft" && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-edit"
                                  disabled={
                                    actionLoading ===
                                    transaction._id
                                  }
                                  onClick={() =>
                                    openEditForm(
                                      transaction
                                    )
                                  }
                                >
                                  ✏️ Modifier
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={
                                    actionLoading ===
                                    transaction._id
                                  }
                                  onClick={() =>
                                    confirmTransaction(
                                      transaction
                                    )
                                  }
                                >
                                  ✓ Confirmer
                                </button>
                              </>
                            )}

                            {transaction.status ===
                              "confirmed" && (
                              <button
                                type="button"
                                className="btn btn-warning"
                                disabled={
                                  actionLoading ===
                                  transaction._id
                                }
                                onClick={() =>
                                  cancelTransaction(
                                    transaction
                                  )
                                }
                              >
                                <span aria-hidden="true">🚫</span>
                                Annuler
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={
                                actionLoading ===
                                transaction._id
                              }
                              onClick={() =>
                                deleteTransaction(
                                  transaction
                                )
                              }
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

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

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 16,
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 2fr) repeat(3, minmax(140px, 1fr))",
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