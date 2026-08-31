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
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const getInitials = (
  member
) => {
  const first =
    member?.firstName
      ?.charAt(0)
      ?.toUpperCase() ||
    "";

  const last =
    member?.lastName
      ?.charAt(0)
      ?.toUpperCase() ||
    "";

  return (
    `${first}${last}` ||
    "P"
  );
};

const ATTENDANCE_STATUSES = [
  "Présent",
  "Absent",
  "Excusé",
  "En retard",
];

// ======================================================
// PAGE
// ======================================================

export default function Attendance() {
  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    attendances,
    setAttendances,
  ] = useState([]);

  const [
    selectedEventId,
    setSelectedEventId,
  ] = useState("");

  const [
    loadingEvents,
    setLoadingEvents,
  ] = useState(true);

  const [
    loadingMembers,
    setLoadingMembers,
  ] = useState(true);

  const [
    loadingAttendance,
    setLoadingAttendance,
  ] = useState(false);

  const [
    savingMemberId,
    setSavingMemberId,
  ] = useState(null);

  const [
    bulkSaving,
    setBulkSaving,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");

  // ======================================================
  // CHARGEMENT ÉVÉNEMENTS
  // ======================================================

  const fetchEvents =
    async () => {
      try {
        setLoadingEvents(true);

        const response =
          await API.get(
            "/events",
            {
              params: {
                limit: 1000,
              },
            }
          );

        const data =
          response.data?.data ||
          response.data?.events ||
          [];

        const rows =
          Array.isArray(data)
            ? data
            : [];

        const sorted =
          [...rows].sort(
            (a, b) =>
              new Date(
                a.date
              ) -
              new Date(
                b.date
              )
          );

        setEvents(
          sorted
        );

        if (
          sorted.length >
          0
        ) {
          const now =
            new Date();

          const nextEvent =
            sorted.find(
              (event) =>
                new Date(
                  event.date
                ) >= now
            );

          setSelectedEventId(
            nextEvent?._id ||
              sorted[
                sorted.length - 1
              ]?._id ||
              ""
          );
        }
      } catch (error) {
        console.error(
          "Erreur chargement événements :",
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
            "Impossible de charger les événements"
        );
      } finally {
        setLoadingEvents(
          false
        );
      }
    };

  // ======================================================
  // CHARGEMENT PERSONNES
  // ======================================================

  const fetchMembers =
    async () => {
      try {
        setLoadingMembers(
          true
        );

        const response =
          await API.get(
            "/members",
            {
              params: {
                limit: 1000,
              },
            }
          );

        const data =
          response.data?.data ||
          response.data?.members ||
          [];

        setMembers(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Erreur chargement personnes :",
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
            "Impossible de charger les personnes"
        );
      } finally {
        setLoadingMembers(
          false
        );
      }
    };

  // ======================================================
  // CHARGEMENT PRÉSENCES DE L'ÉVÉNEMENT
  // ======================================================

  const fetchAttendances =
    async (
      eventId
    ) => {
      if (!eventId) {
        setAttendances([]);
        return;
      }

      try {
        setLoadingAttendance(
          true
        );

        const response =
          await API.get(
            `/attendances/event/${eventId}`
          );

        const data =
          response.data?.data ||
          [];

        setAttendances(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Erreur chargement présences :",
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
            "Impossible de charger les présences"
        );
      } finally {
        setLoadingAttendance(
          false
        );
      }
    };

  // ======================================================
  // CHARGEMENT INITIAL
  // ======================================================

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (
      selectedEventId
    ) {
      fetchAttendances(
        selectedEventId
      );
    } else {
      setAttendances([]);
    }
  }, [
    selectedEventId,
  ]);

  // ======================================================
  // ÉVÉNEMENT SÉLECTIONNÉ
  // ======================================================

  const selectedEvent =
    useMemo(
      () =>
        events.find(
          (event) =>
            String(event._id) ===
            String(
              selectedEventId
            )
        ) || null,
      [
        events,
        selectedEventId,
      ]
    );

  // ======================================================
  // MAP DES PRÉSENCES
  // ======================================================

  const attendanceMap =
    useMemo(() => {
      const map =
        new Map();

      attendances.forEach(
        (attendance) => {
          const memberId =
            attendance?.member
              ?._id ||
            attendance?.member;

          if (memberId) {
            map.set(
              String(
                memberId
              ),
              attendance
            );
          }
        }
      );

      return map;
    }, [
      attendances,
    ]);

  // ======================================================
  // FILTRES
  // ======================================================

  const filteredMembers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return members.filter(
        (member) => {
          const memberType =
            member.membershipType ||
            "Membre";

          if (
            typeFilter !==
              "all" &&
            memberType !==
              typeFilter
          ) {
            return false;
          }

          if (!value) {
            return true;
          }

          const text = [
            member.firstName,
            member.lastName,
            member.email,
            member.phone,
            memberType,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(
            value
          );
        }
      );
    }, [
      members,
      search,
      typeFilter,
    ]);

  // ======================================================
  // COMPTEURS
  // ======================================================

  const counters =
    useMemo(() => {
      let present = 0;
      let absent = 0;
      let excused = 0;
      let late = 0;

      attendances.forEach(
        (attendance) => {
          switch (
            attendance.status
          ) {
            case "Présent":
              present += 1;
              break;

            case "Absent":
              absent += 1;
              break;

            case "Excusé":
              excused += 1;
              break;

            case "En retard":
              late += 1;
              break;

            default:
              break;
          }
        }
      );

      return {
        present,
        absent,
        excused,
        late,

        total:
          attendances.length,
      };
    }, [
      attendances,
    ]);

  // ======================================================
  // MARQUER / MODIFIER UNE PRÉSENCE
  // ======================================================

  const setAttendanceStatus =
    async (
      member,
      status
    ) => {
      if (
        !selectedEventId
      ) {
        toast.warning(
          "Sélectionnez d'abord un événement"
        );

        return;
      }

      if (
        !member?._id
      ) {
        toast.error(
          "Impossible d'identifier cette personne"
        );

        return;
      }

      try {
        setSavingMemberId(
          String(
            member._id
          )
        );

        // ==================================================
        // IMPORTANT :
        // Toujours POST.
        //
        // Le backend est désormais idempotent :
        // - si la présence n'existe pas => création
        // - si elle existe => mise à jour
        //
        // Cela évite les problèmes liés à un ancien
        // attendanceId présent dans l'état React.
        // ==================================================

        await API.post(
          "/attendances",
          {
            member:
              String(
                member._id
              ),

            event:
              String(
                selectedEventId
              ),

            status,
          }
        );

        // Recharge immédiatement les données réelles
        // depuis MongoDB.
        await fetchAttendances(
          selectedEventId
        );
      } catch (error) {
        console.error(
          "Erreur enregistrement présence :",
          error
        );

        console.error(
          "Réponse backend :",
          error.response?.data
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
            "Impossible d'enregistrer la présence"
        );
      } finally {
        setSavingMemberId(
          null
        );
      }
    };

  // ======================================================
  // MARQUER TOUS LES NON-POINTÉS ABSENTS
  // ======================================================

  const markAllAbsent =
    async () => {
      if (
        !selectedEventId
      ) {
        toast.warning(
          "Sélectionnez d'abord un événement"
        );

        return;
      }

      const unmarkedMembers =
        members.filter(
          (member) =>
            !attendanceMap.has(
              String(
                member._id
              )
            )
        );

      if (
        unmarkedMembers.length ===
        0
      ) {
        toast.info(
          "Toutes les personnes sont déjà pointées"
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Marquer ${unmarkedMembers.length} personne${
            unmarkedMembers.length >
            1
              ? "s"
              : ""
          } non pointée${
            unmarkedMembers.length >
            1
              ? "s"
              : ""
          } comme absente${
            unmarkedMembers.length >
            1
              ? "s"
              : ""
          } ?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBulkSaving(true);

        for (
          const member of
          unmarkedMembers
        ) {
          await API.post(
            "/attendances",
            {
              member:
                String(
                  member._id
                ),

              event:
                String(
                  selectedEventId
                ),

              status:
                "Absent",
            }
          );
        }

        await fetchAttendances(
          selectedEventId
        );

        toast.success(
          "Personnes non pointées marquées absentes"
        );
      } catch (error) {
        console.error(
          "Erreur marquage global :",
          error
        );

        console.error(
          "Réponse backend :",
          error.response?.data
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
            "Impossible de terminer le pointage"
        );
      } finally {
        setBulkSaving(false);
      }
    };

  // ======================================================
  // RENDU
  // ======================================================

  return (
    <Layout>
      <div className="management-page">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              Présences
            </h1>

            <p className="page-subtitle">
              Sélectionnez un événement
              puis enregistrez les
              présences des membres
              et visiteurs.
            </p>
          </div>
        </div>

        {/* ==================================================
            ÉVÉNEMENT
        ================================================== */}

        <div className="management-card">
          <div className="management-toolbar">
            <div>
              <div className="management-card-title">
                Événement
              </div>

              <div className="page-subtitle">
                Choisissez le culte ou
                l'événement pour lequel
                vous souhaitez faire
                l'appel.
              </div>
            </div>

            <div className="management-filters">
              <select
                className="management-select"
                value={
                  selectedEventId
                }
                onChange={(
                  event
                ) =>
                  setSelectedEventId(
                    event.target
                      .value
                  )
                }
                disabled={
                  loadingEvents ||
                  bulkSaving
                }
              >
                <option value="">
                  Sélectionner un événement
                </option>

                {events.map(
                  (event) => (
                    <option
                      key={
                        event._id
                      }
                      value={
                        event._id
                      }
                    >
                      {event.title} —{" "}
                      {formatDate(
                        event.date
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {selectedEvent && (
            <div
              style={{
                marginTop: 16,
                padding:
                  "14px 16px",
                borderRadius:
                  "12px",
                background:
                  "rgba(99,102,241,.06)",
                border:
                  "1px solid rgba(99,102,241,.15)",
              }}
            >
              <strong>
                {
                  selectedEvent.title
                }
              </strong>

              <div className="page-subtitle">
                {formatDate(
                  selectedEvent.date
                )}

                {selectedEvent.location
                  ? ` • ${selectedEvent.location}`
                  : ""}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div
          className="management-stats-grid"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-stat-card">
            <div className="management-stat-label">
              Présents
            </div>

            <div className="management-stat-value">
              {
                counters.present
              }
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              En retard
            </div>

            <div className="management-stat-value">
              {
                counters.late
              }
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Absents
            </div>

            <div className="management-stat-value">
              {
                counters.absent
              }
            </div>
          </div>

          <div className="management-stat-card">
            <div className="management-stat-label">
              Excusés
            </div>

            <div className="management-stat-value">
              {
                counters.excused
              }
            </div>
          </div>
        </div>

        {/* ==================================================
            LISTE DES PERSONNES
        ================================================== */}

        <div
          className="management-card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="management-toolbar">
            <div className="management-search">
              <span className="management-search-icon">
                🔎
              </span>

              <input
                type="search"
                placeholder="Rechercher une personne..."
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="management-filters">
              <select
                className="management-select"
                value={
                  typeFilter
                }
                onChange={(
                  event
                ) =>
                  setTypeFilter(
                    event.target
                      .value
                  )
                }
                disabled={
                  bulkSaving
                }
              >
                <option value="all">
                  Tous les profils
                </option>

                <option value="Membre">
                  Membres
                </option>

                <option value="Visiteur">
                  Visiteurs
                </option>
              </select>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  markAllAbsent
                }
                disabled={
                  !selectedEventId ||
                  bulkSaving
                }
              >
                {bulkSaving
                  ? "Enregistrement..."
                  : "Tout non-pointé = absent"}
              </button>
            </div>
          </div>

          {!selectedEventId ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                🗓️
              </div>

              <h3>
                Sélectionnez un événement
              </h3>

              <p>
                Choisissez l'événement
                ci-dessus pour commencer
                le pointage.
              </p>
            </div>
          ) : loadingMembers ||
            loadingAttendance ? (
            <div className="management-loading">
              <div className="management-spinner" />

              <div>
                Chargement de l'appel...
              </div>
            </div>
          ) : filteredMembers.length ===
            0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                👥
              </div>

              <h3>
                Aucune personne
              </h3>
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Personne
                    </th>

                    <th>
                      Profil
                    </th>

                    <th>
                      Statut actuel
                    </th>

                    <th>
                      Pointage
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map(
                    (member) => {
                      const memberId =
                        String(
                          member._id
                        );

                      const attendance =
                        attendanceMap.get(
                          memberId
                        );

                      const currentStatus =
                        attendance?.status ||
                        "Non pointé";

                      const isSaving =
                        savingMemberId ===
                        memberId;

                      return (
                        <tr
                          key={
                            memberId
                          }
                        >
                          {/* PERSONNE */}

                          <td>
                            <div className="person-cell">
                              <div className="person-avatar">
                                {getInitials(
                                  member
                                )}
                              </div>

                              <div>
                                <div className="person-name">
                                  {
                                    member.firstName
                                  }{" "}
                                  {
                                    member.lastName
                                  }
                                </div>

                                <div className="person-secondary">
                                  {member.phone ||
                                    member.email ||
                                    "Aucun contact"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* PROFIL */}

                          <td>
                            {member.membershipType ||
                              "Membre"}
                          </td>

                          {/* STATUT */}

                          <td>
                            <strong>
                              {isSaving
                                ? "Enregistrement..."
                                : currentStatus}
                            </strong>
                          </td>

                          {/* POINTAGE */}

                          <td>
                            <div
                              className="table-actions"
                              style={{
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              {ATTENDANCE_STATUSES.map(
                                (
                                  status
                                ) => (
                                  <button
                                    key={
                                      status
                                    }
                                    type="button"
                                    className={
                                      currentStatus ===
                                      status
                                        ? "btn btn-primary btn-small"
                                        : "btn btn-secondary btn-small"
                                    }
                                    disabled={
                                      isSaving ||
                                      bulkSaving
                                    }
                                    onClick={() =>
                                      setAttendanceStatus(
                                        member,
                                        status
                                      )
                                    }
                                  >
                                    {status ===
                                    "Présent"
                                      ? "✅ "
                                      : status ===
                                        "Absent"
                                      ? "❌ "
                                      : status ===
                                        "Excusé"
                                      ? "🟠 "
                                      : "🕒 "}

                                    {
                                      status
                                    }
                                  </button>
                                )
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
      </div>
    </Layout>
  );
}