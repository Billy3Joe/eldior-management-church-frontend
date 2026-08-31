import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    toast,
  } from "react-toastify";
  
  import Layout from "../components/Layout";
  import "../styles/ManagementPages.css";
  
  import API from "../api/axios";
  
  // ======================================================
  // HELPERS
  // ======================================================
  
  const formatDate = (
    value
  ) => {
    if (!value) {
      return "—";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }
  
    return date.toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };
  
  const formatShortDate = (
    value
  ) => {
    if (!value) {
      return "—";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }
  
    return date.toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );
  };
  
  const safeNumber = (
    value
  ) => {
    const number =
      Number(value);
  
    return Number.isFinite(
      number
    )
      ? number
      : 0;
  };
  
  // ======================================================
  // PAGE
  // ======================================================
  
  export default function PastoralStatistics() {
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      statistics,
      setStatistics,
    ] = useState([]);
  
    const [
      summary,
      setSummary,
    ] = useState({
      numberOfSundays: 0,
      totalAttendance: 0,
      averageAttendance: 0,
      totalNewPeople: 0,
      averageNewPeople: 0,
      growthRate: 0,
      highestAttendance: null,
    });
  
    const [
      selectedIndex,
      setSelectedIndex,
    ] = useState(null);
  
    const [
      period,
      setPeriod,
    ] = useState("12");
  
    // ======================================================
    // CHARGEMENT
    // ======================================================
  
    const fetchStatistics =
      async () => {
        try {
          setLoading(true);
  
          const response =
            await API.get(
              "/attendances/analytics/sundays",
              {
                params: {
                  limit:
                    Number(period),
                },
              }
            );
  
          const rows =
            Array.isArray(
              response.data?.data
            )
              ? response.data.data
              : [];
  
          setStatistics(
            rows
          );
  
          setSummary({
            numberOfSundays:
              safeNumber(
                response.data
                  ?.summary
                  ?.numberOfSundays
              ),
  
            totalAttendance:
              safeNumber(
                response.data
                  ?.summary
                  ?.totalAttendance
              ),
  
            averageAttendance:
              safeNumber(
                response.data
                  ?.summary
                  ?.averageAttendance
              ),
  
            totalNewPeople:
              safeNumber(
                response.data
                  ?.summary
                  ?.totalNewPeople
              ),
  
            averageNewPeople:
              safeNumber(
                response.data
                  ?.summary
                  ?.averageNewPeople
              ),
  
            growthRate:
              safeNumber(
                response.data
                  ?.summary
                  ?.growthRate
              ),
  
            highestAttendance:
              response.data
                ?.summary
                ?.highestAttendance ||
              null,
          });
  
          if (
            rows.length > 0
          ) {
            setSelectedIndex(
              rows.length - 1
            );
          } else {
            setSelectedIndex(
              null
            );
          }
        } catch (error) {
          console.error(
            "Erreur statistiques pastorales :",
            error
          );
  
          toast.error(
            error.response
              ?.data
              ?.message ||
              "Impossible de charger les statistiques pastorales"
          );
        } finally {
          setLoading(false);
        }
      };
  
    useEffect(() => {
      fetchStatistics();
    }, [period]);
  
    // ======================================================
    // DIMANCHE SÉLECTIONNÉ
    // ======================================================
  
    const selectedSunday =
      selectedIndex !== null
        ? statistics[
            selectedIndex
          ] || null
        : null;
  
    // ======================================================
    // MAX POUR LE GRAPHIQUE
    // ======================================================
  
    const maxAttendance =
      useMemo(() => {
        if (
          statistics.length ===
          0
        ) {
          return 1;
        }
  
        return Math.max(
          ...statistics.map(
            (item) =>
              safeNumber(
                item.totalAttendance
              )
          ),
          1
        );
      }, [statistics]);
  
    // ======================================================
    // ÉVOLUTION DU DIMANCHE SÉLECTIONNÉ
    // ======================================================
  
    const selectedGrowth =
      useMemo(() => {
        if (
          selectedIndex ===
            null ||
          selectedIndex <= 0
        ) {
          return null;
        }
  
        const current =
          safeNumber(
            statistics[
              selectedIndex
            ]?.totalAttendance
          );
  
        const previous =
          safeNumber(
            statistics[
              selectedIndex - 1
            ]?.totalAttendance
          );
  
        if (
          previous <= 0
        ) {
          return null;
        }
  
        return Number(
          (
            (
              (
                current -
                previous
              ) /
              previous
            ) *
            100
          ).toFixed(2)
        );
      }, [
        statistics,
        selectedIndex,
      ]);
  
    // ======================================================
    // RENDU
    // ======================================================
  
    return (
      <Layout>
        <div className="management-page">
  
          {/* HEADER */}
  
          <div className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">
                Statistiques pastorales
              </h1>
  
              <p className="page-subtitle">
                Suivez automatiquement
                l'évolution des cultes
                dominicaux, des présences
                et des nouvelles
                personnes.
              </p>
            </div>
  
            <div className="page-header-actions">
              <select
                className="management-select"
                value={
                  period
                }
                onChange={(
                  event
                ) =>
                  setPeriod(
                    event.target
                      .value
                  )
                }
              >
                <option value="4">
                  4 derniers dimanches
                </option>
  
                <option value="8">
                  8 derniers dimanches
                </option>
  
                <option value="12">
                  12 derniers dimanches
                </option>
  
                <option value="24">
                  24 derniers dimanches
                </option>
  
                <option value="52">
                  1 année
                </option>
              </select>
            </div>
          </div>
  
          {/* RÉSUMÉ GLOBAL */}
  
          <div className="management-stats-grid">
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Présence moyenne
              </div>
  
              <div className="management-stat-value">
                {
                  summary.averageAttendance
                }
              </div>
  
              <div className="management-stat-description">
                Moyenne par dimanche
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Nouvelles personnes
              </div>
  
              <div className="management-stat-value">
                {
                  summary.totalNewPeople
                }
              </div>
  
              <div className="management-stat-description">
                Sur la période
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Évolution
              </div>
  
              <div className="management-stat-value">
                {summary.growthRate >
                0
                  ? "+"
                  : ""}
                {
                  summary.growthRate
                }
                %
              </div>
  
              <div className="management-stat-description">
                Dernier dimanche
                comparé au précédent
              </div>
            </div>
  
            <div className="management-stat-card">
              <div className="management-stat-label">
                Dimanches analysés
              </div>
  
              <div className="management-stat-value">
                {
                  summary.numberOfSundays
                }
              </div>
  
              <div className="management-stat-description">
                Cultes disponibles
              </div>
            </div>
          </div>
  
          {/* CHARGEMENT */}
  
          {loading ? (
            <div className="management-card">
              <div className="management-loading">
                <div className="management-spinner" />
  
                <div>
                  Calcul des
                  statistiques...
                </div>
              </div>
            </div>
          ) : statistics.length ===
            0 ? (
            <div className="management-card">
              <div className="management-empty">
                <div className="management-empty-icon">
                  📊
                </div>
  
                <h3>
                  Aucune statistique
                  dominicale disponible
                </h3>
  
                <p>
                  Enregistrez les
                  présences d'un
                  événement ayant lieu
                  un dimanche pour voir
                  apparaître
                  automatiquement les
                  statistiques.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* GRAPHIQUE */}
  
              <div className="management-card">
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap:
                      "16px",
                    marginBottom:
                      "24px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                      }}
                    >
                      Évolution des
                      présences
                    </h2>
  
                    <p className="page-subtitle">
                      Cliquez sur un
                      dimanche pour
                      afficher son détail.
                    </p>
                  </div>
  
                  {summary
                    .highestAttendance && (
                    <div
                      style={{
                        padding:
                          "10px 14px",
                        borderRadius:
                          "10px",
                        background:
                          "rgba(99, 102, 241, 0.07)",
                        fontSize:
                          "13px",
                      }}
                    >
                      🏆 Record :{" "}
                      <strong>
                        {
                          summary
                            .highestAttendance
                            .totalAttendance
                        }
                      </strong>
                    </div>
                  )}
                </div>
  
                <div
                  style={{
                    overflowX:
                      "auto",
                    paddingBottom:
                      "10px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "flex-end",
                      gap:
                        "14px",
                      minWidth:
                        `${Math.max(
                          statistics.length *
                            72,
                          500
                        )}px`,
                      height:
                        "250px",
                      padding:
                        "20px 10px 0",
                      borderBottom:
                        "1px solid rgba(148,163,184,.25)",
                    }}
                  >
                    {statistics.map(
                      (
                        item,
                        index
                      ) => {
                        const value =
                          safeNumber(
                            item.totalAttendance
                          );
  
                        const height =
                          Math.max(
                            (
                              value /
                              maxAttendance
                            ) *
                              180,
                            value > 0
                              ? 15
                              : 4
                          );
  
                        const selected =
                          selectedIndex ===
                          index;
  
                        return (
                          <button
                            key={
                              item
                                .event
                                ?._id ||
                              index
                            }
                            type="button"
                            onClick={() =>
                              setSelectedIndex(
                                index
                              )
                            }
                            style={{
                              flex:
                                "1 0 58px",
                              maxWidth:
                                "80px",
                              height:
                                "220px",
                              border: 0,
                              background:
                                "transparent",
                              cursor:
                                "pointer",
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              justifyContent:
                                "flex-end",
                              alignItems:
                                "center",
                              gap:
                                "8px",
                              padding: 0,
                            }}
                          >
                            <strong
                              style={{
                                fontSize:
                                  "12px",
                              }}
                            >
                              {value}
                            </strong>
  
                            <div
                              style={{
                                width:
                                  "34px",
                                height:
                                  `${height}px`,
                                borderRadius:
                                  "8px 8px 3px 3px",
                                background:
                                  selected
                                    ? "linear-gradient(180deg, #6d4aff, #4938d7)"
                                    : "rgba(99, 102, 241, 0.32)",
                                boxShadow:
                                  selected
                                    ? "0 8px 18px rgba(79,70,229,.22)"
                                    : "none",
                                transition:
                                  "all .2s ease",
                              }}
                            />
  
                            <span
                              style={{
                                fontSize:
                                  "10px",
                                whiteSpace:
                                  "nowrap",
                                opacity:
                                  selected
                                    ? 1
                                    : 0.65,
                                fontWeight:
                                  selected
                                    ? 800
                                    : 600,
                              }}
                            >
                              {formatShortDate(
                                item
                                  .event
                                  ?.date
                              )}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
  
              {/* DÉTAIL DIMANCHE */}
  
              {selectedSunday && (
                <>
                  <div
                    className="management-card"
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap:
                          "16px",
                        flexWrap:
                          "wrap",
                        marginBottom:
                          "20px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin:
                              "0 0 6px",
                          }}
                        >
                          {
                            selectedSunday
                              .event
                              ?.title
                          }
                        </h2>
  
                        <div className="page-subtitle">
                          {formatDate(
                            selectedSunday
                              .event
                              ?.date
                          )}
                        </div>
                      </div>
  
                      {selectedGrowth !==
                        null && (
                        <div
                          style={{
                            padding:
                              "10px 14px",
                            borderRadius:
                              "10px",
                            background:
                              selectedGrowth >=
                              0
                                ? "rgba(34,197,94,.08)"
                                : "rgba(239,68,68,.08)",
                            fontWeight:
                              800,
                          }}
                        >
                          {selectedGrowth >=
                          0
                            ? "↗ "
                            : "↘ "}
                          {selectedGrowth >
                          0
                            ? "+"
                            : ""}
                          {selectedGrowth}
                          %
                        </div>
                      )}
                    </div>
  
                    <div className="management-stats-grid">
  
                      <div className="management-stat-card">
                        <div className="management-stat-label">
                          Présence totale
                        </div>
  
                        <div className="management-stat-value">
                          {
                            selectedSunday.totalAttendance
                          }
                        </div>
  
                        <div className="management-stat-description">
                          Présents +
                          retardataires
                        </div>
                      </div>
  
                      <div className="management-stat-card">
                        <div className="management-stat-label">
                          Adultes
                        </div>
  
                        <div className="management-stat-value">
                          {
                            selectedSunday
                              .demographics
                              ?.adults ||
                            0
                          }
                        </div>
  
                        <div className="management-stat-description">
                          18 ans et plus
                        </div>
                      </div>
  
                      <div className="management-stat-card">
                        <div className="management-stat-label">
                          Enfants
                        </div>
  
                        <div className="management-stat-value">
                          {
                            selectedSunday
                              .demographics
                              ?.children ||
                            0
                          }
                        </div>
  
                        <div className="management-stat-description">
                          0 à 14 ans
                        </div>
                      </div>
  
                      <div className="management-stat-card">
                        <div className="management-stat-label">
                          Nouvelles personnes
                        </div>
  
                        <div className="management-stat-value">
                          {
                            selectedSunday
                              .people
                              ?.newPeople ||
                            0
                          }
                        </div>
  
                        <div className="management-stat-description">
                          Première visite
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* DÉMOGRAPHIE */}
  
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap:
                        "20px",
                      marginTop:
                        "20px",
                    }}
                  >
                    <div className="management-card">
                      <h2
                        style={{
                          marginTop: 0,
                        }}
                      >
                        Répartition
                        démographique
                      </h2>
  
                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap:
                            "12px",
                        }}
                      >
                        <StatLine
                          label="Hommes"
                          value={
                            selectedSunday
                              .demographics
                              ?.men ||
                            0
                          }
                        />
  
                        <StatLine
                          label="Femmes"
                          value={
                            selectedSunday
                              .demographics
                              ?.women ||
                            0
                          }
                        />
  
                        <StatLine
                          label="Adultes"
                          value={
                            selectedSunday
                              .demographics
                              ?.adults ||
                            0
                          }
                        />
  
                        <StatLine
                          label="Adolescents"
                          value={
                            selectedSunday
                              .demographics
                              ?.teenagers ||
                            0
                          }
                        />
                      </div>
                    </div>
  
                    <div className="management-card">
                      <h2
                        style={{
                          marginTop: 0,
                        }}
                      >
                        Membres &
                        visiteurs
                      </h2>
  
                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap:
                            "12px",
                        }}
                      >
                        <StatLine
                          label="Membres"
                          value={
                            selectedSunday
                              .people
                              ?.members ||
                            0
                          }
                        />
  
                        <StatLine
                          label="Visiteurs"
                          value={
                            selectedSunday
                              .people
                              ?.visitors ||
                            0
                          }
                        />
  
                        <StatLine
                          label="Nouveaux hommes"
                          value={
                            selectedSunday
                              .people
                              ?.newMen ||
                            0
                          }
                        />
  
                        <StatLine
                          label="Nouvelles femmes"
                          value={
                            selectedSunday
                              .people
                              ?.newWomen ||
                            0
                          }
                        />
                      </div>
                    </div>
                  </div>
  
                  {/* CLASSES D'ÂGE */}
  
                  <div
                    className="management-card"
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >
                    <h2
                      style={{
                        marginTop: 0,
                      }}
                    >
                      Classes d'âge
                    </h2>
  
                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(130px, 1fr))",
                        gap:
                          "12px",
                      }}
                    >
                      <AgeCard
                        label="0–3 ans"
                        value={
                          selectedSunday
                            .demographics
                            ?.ageGroups
                            ?.[
                              "0-3"
                            ] || 0
                        }
                      />
  
                      <AgeCard
                        label="4–6 ans"
                        value={
                          selectedSunday
                            .demographics
                            ?.ageGroups
                            ?.[
                              "4-6"
                            ] || 0
                        }
                      />
  
                      <AgeCard
                        label="7–10 ans"
                        value={
                          selectedSunday
                            .demographics
                            ?.ageGroups
                            ?.[
                              "7-10"
                            ] || 0
                        }
                      />
  
                      <AgeCard
                        label="11–14 ans"
                        value={
                          selectedSunday
                            .demographics
                            ?.ageGroups
                            ?.[
                              "11-14"
                            ] || 0
                        }
                      />
  
                      <AgeCard
                        label="15–17 ans"
                        value={
                          selectedSunday
                            .demographics
                            ?.ageGroups
                            ?.[
                              "15-17"
                            ] || 0
                        }
                      />
  
                      <AgeCard
                        label="18 ans +"
                        value={
                          selectedSunday
                            .demographics
                            ?.ageGroups
                            ?.[
                              "18+"
                            ] || 0
                        }
                      />
                    </div>
                  </div>
  
                  {/* STATUTS PRÉSENCE */}
  
                  <div
                    className="management-card"
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >
                    <h2
                      style={{
                        marginTop: 0,
                      }}
                    >
                      Détail des présences
                    </h2>
  
                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(160px, 1fr))",
                        gap:
                          "12px",
                      }}
                    >
                      <AgeCard
                        label="Présents"
                        value={
                          selectedSunday.present ||
                          0
                        }
                      />
  
                      <AgeCard
                        label="En retard"
                        value={
                          selectedSunday.late ||
                          0
                        }
                      />
  
                      <AgeCard
                        label="Absents"
                        value={
                          selectedSunday.absent ||
                          0
                        }
                      />
  
                      <AgeCard
                        label="Excusés"
                        value={
                          selectedSunday.excused ||
                          0
                        }
                      />
  
                      <AgeCard
                        label="Taux de présence"
                        value={`${selectedSunday.attendanceRate || 0}%`}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Layout>
    );
  }
  
  // ======================================================
  // PETITS COMPOSANTS
  // ======================================================
  
  function StatLine({
    label,
    value,
  }) {
    return (
      <div
        style={{
          padding:
            "14px",
          borderRadius:
            "10px",
          border:
            "1px solid rgba(148,163,184,.18)",
          background:
            "rgba(248,250,252,.65)",
        }}
      >
        <div
          style={{
            fontSize:
              "12px",
            opacity:
              0.7,
            marginBottom:
              "6px",
          }}
        >
          {label}
        </div>
  
        <strong
          style={{
            fontSize:
              "22px",
          }}
        >
          {value}
        </strong>
      </div>
    );
  }
  
  function AgeCard({
    label,
    value,
  }) {
    return (
      <div
        style={{
          padding:
            "16px",
          borderRadius:
            "10px",
          textAlign:
            "center",
          border:
            "1px solid rgba(148,163,184,.18)",
          background:
            "rgba(248,250,252,.65)",
        }}
      >
        <div
          style={{
            fontSize:
              "24px",
            fontWeight:
              900,
            marginBottom:
              "4px",
          }}
        >
          {value}
        </div>
  
        <div
          style={{
            fontSize:
              "12px",
            opacity:
              0.7,
          }}
        >
          {label}
        </div>
      </div>
    );
  }