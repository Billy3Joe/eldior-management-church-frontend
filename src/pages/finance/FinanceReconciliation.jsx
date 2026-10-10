import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";
import Layout from "../../components/Layout";
import { formatCurrency } from "../../constants/currencies";
import "../../styles/ManagementPages.css";

const ACCOUNT_TYPES = {
  cash: "Caisse",
  bank: "Compte bancaire",
  mobile_money: "Mobile Money",
  savings: "Épargne",
  other: "Autre",
};

export default function FinanceReconciliation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repairingId, setRepairingId] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ======================================================
  // CHARGEMENT GLOBAL
  // ======================================================

  const fetchReconciliation = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await API.get(
          "/finance/reconciliation"
        );

        setData(response?.data?.data || null);
      } catch (error) {
        console.error(error);

        toast.error(
          error?.response?.data?.message ||
            "Impossible de charger le rapprochement financier."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  // ======================================================
  // DONNÉES
  // ======================================================

  const accounts = useMemo(() => {
    return Array.isArray(data?.accounts)
      ? data.accounts
      : [];
  }, [data]);

  const currencies = useMemo(() => {
    if (
      !data?.currencies ||
      typeof data.currencies !== "object"
    ) {
      return [];
    }

    return Object.entries(data.currencies);
  }, [data]);

  // ======================================================
  // DÉTAIL D'UN COMPTE
  // ======================================================

  const openAccountDetails = async (accountId) => {
    try {
      setDetailsLoading(true);

      const response = await API.get(
        `/finance/reconciliation/accounts/${accountId}`
      );

      setSelectedAccount(
        response?.data?.data || null
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Impossible de charger le détail du compte."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ======================================================
  // RÉPARATION
  // ======================================================

  const repairAccount = async (item) => {
    if (!item?.account?._id) return;

    if (item.isBalanced) {
      toast.info(
        "Ce compte est déjà équilibré."
      );
      return;
    }

    const confirmed = window.confirm(
      `Corriger le solde du compte « ${item.account.name} » ?\n\n` +
        `Solde enregistré : ${formatCurrency(
          item.storedBalance,
          item.account.currency
        )}\n` +
        `Solde théorique : ${formatCurrency(
          item.theoreticalBalance,
          item.account.currency
        )}\n` +
        `Écart : ${formatCurrency(
          item.difference,
          item.account.currency
        )}\n\n` +
        "Cette opération remplacera le solde enregistré par le solde théorique calculé à partir des transactions confirmées."
    );

    if (!confirmed) return;

    try {
      setRepairingId(item.account._id);

      const response = await API.post(
        `/finance/reconciliation/accounts/${item.account._id}/repair`
      );

      const result = response?.data?.data;

      if (result?.repaired) {
        toast.success(
          "Le solde du compte a été corrigé."
        );
      } else {
        toast.info(
          response?.data?.message ||
            "Aucune correction nécessaire."
        );
      }

      setSelectedAccount(null);

      await fetchReconciliation(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Impossible de corriger le solde."
      );
    } finally {
      setRepairingId("");
    }
  };

  // ======================================================
  // HELPERS
  // ======================================================

  const getAccountType = (type) => {
    return ACCOUNT_TYPES[type] || type || "—";
  };

  const getMovementCount = (item) => {
    return (
      Number(item?.movements?.income?.count || 0) +
      Number(item?.movements?.expense?.count || 0) +
      Number(item?.movements?.transferIn?.count || 0) +
      Number(item?.movements?.transferOut?.count || 0)
    );
  };

  const getAbsoluteDifference = (difference) => {
    return Math.abs(Number(difference || 0));
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
                padding: 35,
                textAlign: "center",
              }}
            >
              Vérification des comptes financiers...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="management-page">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="page-header">
          <div>
            <h1 className="page-title">
              Rapprochement financier
            </h1>

            <p className="page-subtitle">
              Vérifiez que les soldes enregistrés correspondent
              aux mouvements financiers confirmés.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              fetchReconciliation(true)
            }
            disabled={refreshing}
          >
            {refreshing
              ? "Vérification..."
              : "↻ Vérifier les comptes"}
          </button>
        </div>

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="management-stats-grid">
          <StatCard
            label="Comptes"
            value={data?.totalAccounts || 0}
            description="Comptes financiers vérifiés"
          />

          <StatCard
            label="Équilibrés"
            value={data?.balancedAccounts || 0}
            description="Aucun écart détecté"
          />

          <StatCard
            label="Avec écart"
            value={data?.discrepancyAccounts || 0}
            description="Comptes à contrôler"
          />

          <StatCard
            label="État général"
            value={
              data?.isBalanced
                ? "OK"
                : "À vérifier"
            }
            description={
              data?.isBalanced
                ? "Tous les comptes sont équilibrés"
                : "Des écarts ont été détectés"
            }
          />
        </div>

        {/* ==================================================
            ALERTE GÉNÉRALE
        ================================================== */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
            padding: 20,
            borderLeft: data?.isBalanced
              ? "5px solid #16a34a"
              : "5px solid #dc2626",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 28,
              }}
            >
              {data?.isBalanced
                ? "✅"
                : "⚠️"}
            </div>

            <div>
              <strong
                style={{
                  fontSize: 17,
                }}
              >
                {data?.isBalanced
                  ? "Comptabilité équilibrée"
                  : "Écarts financiers détectés"}
              </strong>

              <div
                style={{
                  marginTop: 4,
                  opacity: 0.75,
                  fontSize: 13,
                }}
              >
                {data?.isBalanced
                  ? "Les soldes enregistrés correspondent aux soldes calculés à partir des transactions confirmées."
                  : `${data?.discrepancyAccounts || 0} compte(s) présentent un écart entre le solde enregistré et le solde théorique.`}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            RÉSUMÉ PAR DEVISE
        ================================================== */}

        {currencies.length > 0 && (
          <div
            className="management-card"
            style={{ marginTop: 24 }}
          >
            <div className="management-card-header">
              <div>
                <h2 className="management-card-title">
                  Situation par devise
                </h2>

                <p className="page-subtitle">
                  Les soldes sont séparés par devise.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 16,
                padding: 20,
              }}
            >
              {currencies.map(
                ([currency, summary]) => (
                  <div
                    key={currency}
                    style={{
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 20,
                        marginBottom: 14,
                      }}
                    >
                      {currency}
                    </div>

                    <SummaryLine
                      label="Solde initial"
                      value={formatCurrency(
                        summary.openingBalance,
                        currency
                      )}
                    />

                    <SummaryLine
                      label="Entrées"
                      value={formatCurrency(
                        summary.income,
                        currency
                      )}
                    />

                    <SummaryLine
                      label="Sorties"
                      value={formatCurrency(
                        summary.expense,
                        currency
                      )}
                    />

                    <SummaryLine
                      label="Transferts entrants"
                      value={formatCurrency(
                        summary.transferIn,
                        currency
                      )}
                    />

                    <SummaryLine
                      label="Transferts sortants"
                      value={formatCurrency(
                        summary.transferOut,
                        currency
                      )}
                    />

                    <div
                      style={{
                        borderTop:
                          "1px solid #e2e8f0",
                        marginTop: 10,
                        paddingTop: 10,
                      }}
                    >
                      <SummaryLine
                        label="Solde théorique"
                        value={formatCurrency(
                          summary.theoreticalBalance,
                          currency
                        )}
                        strong
                      />

                      <SummaryLine
                        label="Solde enregistré"
                        value={formatCurrency(
                          summary.storedBalance,
                          currency
                        )}
                        strong
                      />

                      <SummaryLine
                        label="Écart"
                        value={formatCurrency(
                          summary.difference,
                          currency
                        )}
                        strong
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            COMPTES
        ================================================== */}

        <div
          className="management-card"
          style={{ marginTop: 24 }}
        >
          <div className="management-card-header">
            <div>
              <h2 className="management-card-title">
                Contrôle des comptes
              </h2>

              <p className="page-subtitle">
                {accounts.length} compte(s) analysé(s)
              </p>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                💰
              </div>

              <h3>
                Aucun compte financier
              </h3>

              <p>
                Créez d'abord un compte financier.
              </p>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Compte</th>
                    <th>Devise</th>
                    <th>Solde initial</th>
                    <th>Mouvements</th>
                    <th>Solde théorique</th>
                    <th>Solde enregistré</th>
                    <th>Écart</th>
                    <th>État</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map((item) => {
                    const currency =
                      item.account?.currency ||
                      "EUR";

                    return (
                      <tr
                        key={
                          item.account?._id
                        }
                      >
                        <td>
                          <strong>
                            {item.account?.name}
                          </strong>

                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.65,
                              marginTop: 3,
                            }}
                          >
                            {getAccountType(
                              item.account?.type
                            )}
                          </div>
                        </td>

                        <td>
                          <strong>
                            {currency}
                          </strong>
                        </td>

                        <td>
                          {formatCurrency(
                            item.openingBalance,
                            currency
                          )}
                        </td>

                        <td>
                          {getMovementCount(
                            item
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              item.theoreticalBalance,
                              currency
                            )}
                          </strong>
                        </td>

                        <td>
                          {formatCurrency(
                            item.storedBalance,
                            currency
                          )}
                        </td>

                        <td>
                          <strong
                            style={{
                              color:
                                item.isBalanced
                                  ? "#15803d"
                                  : "#dc2626",
                            }}
                          >
                            {formatCurrency(
                              item.difference,
                              currency
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            style={{
                              fontWeight: 800,
                              color:
                                item.isBalanced
                                  ? "#15803d"
                                  : "#dc2626",
                            }}
                          >
                            {item.isBalanced
                              ? "✓ Équilibré"
                              : "⚠ Écart"}
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                openAccountDetails(
                                  item.account._id
                                )
                              }
                              disabled={
                                detailsLoading
                              }
                            >
                              👁 Détails
                            </button>

                            {!item.isBalanced && (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() =>
                                  repairAccount(
                                    item
                                  )
                                }
                                disabled={
                                  repairingId ===
                                  item.account._id
                                }
                              >
                                {repairingId ===
                                item.account._id
                                  ? "Correction..."
                                  : "🔧 Corriger"}
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

        {/* ==================================================
            DÉTAIL COMPTE
        ================================================== */}

        {selectedAccount && (
          <AccountDetails
            item={selectedAccount}
            onClose={() =>
              setSelectedAccount(null)
            }
            onRepair={() =>
              repairAccount(
                selectedAccount
              )
            }
            repairing={
              repairingId ===
              selectedAccount.account?._id
            }
          />
        )}

        {/* ==================================================
            DATE
        ================================================== */}

        {data?.generatedAt && (
          <div
            style={{
              marginTop: 15,
              textAlign: "right",
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            Dernière vérification :{" "}
            {new Intl.DateTimeFormat(
              "fr-FR",
              {
                dateStyle: "medium",
                timeStyle: "short",
              }
            ).format(
              new Date(
                data.generatedAt
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ======================================================
// DÉTAIL COMPTE
// ======================================================

function AccountDetails({
  item,
  onClose,
  onRepair,
  repairing,
}) {
  const currency =
    item.account?.currency ||
    "EUR";

  const movements =
    item.movements || {};

  return (
    <div
      className="management-card"
      style={{
        marginTop: 24,
        borderLeft: item.isBalanced
          ? "5px solid #16a34a"
          : "5px solid #dc2626",
      }}
    >
      <div className="management-card-header">
        <div>
          <h2 className="management-card-title">
            Détail —{" "}
            {item.account?.name}
          </h2>

          <p className="page-subtitle">
            Analyse complète du compte financier.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
        >
          ✕ Fermer
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          padding: 20,
        }}
      >
        <DetailBox
          label="Solde initial"
          value={formatCurrency(
            item.openingBalance,
            currency
          )}
        />

        <DetailBox
          label="Entrées"
          value={formatCurrency(
            movements.income?.amount ||
              0,
            currency
          )}
          sub={`${movements.income?.count || 0} mouvement(s)`}
        />

        <DetailBox
          label="Sorties"
          value={formatCurrency(
            movements.expense?.amount ||
              0,
            currency
          )}
          sub={`${movements.expense?.count || 0} mouvement(s)`}
        />

        <DetailBox
          label="Transferts entrants"
          value={formatCurrency(
            movements.transferIn?.amount ||
              0,
            currency
          )}
          sub={`${movements.transferIn?.count || 0} mouvement(s)`}
        />

        <DetailBox
          label="Transferts sortants"
          value={formatCurrency(
            movements.transferOut?.amount ||
              0,
            currency
          )}
          sub={`${movements.transferOut?.count || 0} mouvement(s)`}
        />

        <DetailBox
          label="Mouvement net"
          value={formatCurrency(
            movements.netMovement ||
              0,
            currency
          )}
        />

        <DetailBox
          label="Solde théorique"
          value={formatCurrency(
            item.theoreticalBalance,
            currency
          )}
        />

        <DetailBox
          label="Solde enregistré"
          value={formatCurrency(
            item.storedBalance,
            currency
          )}
        />

        <DetailBox
          label="Écart"
          value={formatCurrency(
            item.difference,
            currency
          )}
          sub={
            item.isBalanced
              ? "Compte équilibré"
              : `Écart absolu : ${formatCurrency(
                  Math.abs(
                    Number(
                      item.difference ||
                        0
                    )
                  ),
                  currency
                )}`
          }
        />
      </div>

      {!item.isBalanced && (
        <div
          style={{
            padding: "0 20px 20px",
          }}
        >
          <div
            style={{
              background: "#fff7ed",
              border:
                "1px solid #fed7aa",
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              fontSize: 13,
            }}
          >
            ⚠️ La correction remplacera le
            solde enregistré par le solde
            théorique calculé depuis les
            transactions confirmées.
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onRepair}
            disabled={repairing}
          >
            {repairing
              ? "Correction..."
              : "🔧 Réconcilier ce compte"}
          </button>
        </div>
      )}
    </div>
  );
}

// ======================================================
// COMPONENTS
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

function SummaryLine({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: 15,
        marginBottom: 7,
      }}
    >
      <span
        style={{
          opacity: 0.72,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight:
            strong ? 900 : 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DetailBox({
  label,
  value,
  sub,
}) {
  return (
    <div
      style={{
        border:
          "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.65,
          fontWeight: 700,
          marginBottom: 7,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 19,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      {sub && (
        <div
          style={{
            fontSize: 11,
            opacity: 0.65,
            marginTop: 5,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}