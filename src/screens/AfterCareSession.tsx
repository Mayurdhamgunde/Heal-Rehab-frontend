import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaCalendarAlt,
  FaFilter,
  FaPhone,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/AftercareSessions.module.css";

interface CareTeamMember {
  department_name?: string;
  doctor_name?: string;
  role?: "Head Counselor" | "Specialist";
}

interface RelapseRiskAssessment {
  risk_level?: "Low" | "Moderate" | "High" | "Critical" | "Insufficient Data";
  assessed_at?: string;
}

interface TherapyPlan {
  _id: string;
  therapy_name?: string;
  status?: string;
  closure_reason?: string;
  closure_date?: string;
  therapy_start?: string;
}

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_alternate_number?: string;
  guardian_phone?: string;
  guardian_relation?: string;
  guardian_phone_2?: string;
  guardian_relation_2?: string;
  patient_image?: string | null;
  follow_Up_Date: string;
  status?: string;
  doctor_name?: string;
  patient_age?: string;
  gender?: string;
  UHID?: string;
  patient_registration_date?: string;
  care_team?: CareTeamMember[];
  relapse_risk_assessment?: RelapseRiskAssessment;
  therapy_plans?: TherapyPlan[];
  archived_at?: string;
}

const RISK_META: Record<string, { label: string; className: string }> = {
  Low: { label: "Low risk", className: styles.riskLow },
  Moderate: { label: "Moderate risk", className: styles.riskModerate },
  High: { label: "High risk", className: styles.riskHigh },
  Critical: { label: "Critical risk", className: styles.riskCritical },
  "Insufficient Data": {
    label: "Risk pending",
    className: styles.riskUnknown,
  },
};

const toDigits = (num?: string) => (num || "").replace(/\D/g, "");

const formatDateShort = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface PaginationData {
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDates = () => {
  const today = new Date();

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7); // Exactly next 7 days from today

  return {
    from: getLocalDateString(today),
    to: getLocalDateString(nextWeek),
  };
};

const addDays = (dateString: string, days: number) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
};

type FetchDirection = "init" | "forward" | "backward";
type FollowUpScope = "my" | "all";

const AfterCareSession: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [dateFilter, setDateFilter] = useState(getDefaultDates());
  const [activeScope, setActiveScope] = useState<FollowUpScope>("my"); // Defaults to My Follow-ups

  const [forwardWindow, setForwardWindow] = useState(getDefaultDates());
  const [forwardPage, setForwardPage] = useState(1);
  const [forwardPagination, setForwardPagination] =
    useState<PaginationData | null>(null);

  const [backwardWindow, setBackwardWindow] = useState(getDefaultDates());
  const [backwardPage, setBackwardPage] = useState(1);
  const [backwardPagination, setBackwardPagination] =
    useState<PaginationData | null>(null);

  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const fetchFollowUps = async (
    from: string,
    to: string,
    pageNum: number,
    direction: FetchDirection,
    scope: FollowUpScope = activeScope,
  ) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (direction === "init") setLoading(true);
    else if (direction === "forward") setLoadingMore(true);
    else setLoadingPrev(true);

    try {
      // Choose endpoint based on current active scope
      const endpoint = scope === "my" ? "/get/my/followups" : "/get/followups";

      const response = await api.get(endpoint, {
        params: {
          page: pageNum,
          limit: 20,
          from: from || undefined,
          to: to || undefined,
        },
      });

      if (response.data.success) {
        const newPatients: Patient[] = response.data.patients;

        setPatients((prev) => {
          if (direction === "init") return newPatients;
          const existingIds = new Set(prev.map((p) => p._id));
          return [
            ...prev,
            ...newPatients.filter((p) => !existingIds.has(p._id)),
          ];
        });

        if (direction === "backward") {
          setBackwardWindow({ from, to });
          setBackwardPage(pageNum);
          setBackwardPagination(response.data.pagination);
        } else {
          setForwardWindow({ from, to });
          setForwardPage(pageNum);
          setForwardPagination(response.data.pagination);
          if (direction === "init") {
            setBackwardWindow({ from, to });
            setBackwardPage(1);
            setBackwardPagination(null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      if (direction === "init") setPatients([]);
    } finally {
      if (direction === "init") setLoading(false);
      else if (direction === "forward") setLoadingMore(false);
      else setLoadingPrev(false);
      fetchingRef.current = false;
    }
  };

  // Triggers reload when date filters or toggle scope change
  useEffect(() => {
    fetchFollowUps(dateFilter.from, dateFilter.to, 1, "init", activeScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter.from, dateFilter.to, activeScope]);

  const loadNext = () => {
    if (fetchingRef.current || loading) return;
    if (forwardPagination?.has_next) {
      fetchFollowUps(
        forwardWindow.from,
        forwardWindow.to,
        forwardPage + 1,
        "forward",
        activeScope,
      );
    } else {
      const nextFrom = addDays(forwardWindow.to, 1);
      const nextTo = addDays(nextFrom, 7);
      fetchFollowUps(nextFrom, nextTo, 1, "forward", activeScope);
    }
  };

  const loadPrevious = () => {
    if (fetchingRef.current || loadingPrev) return;
    if (backwardPagination?.has_next) {
      fetchFollowUps(
        backwardWindow.from,
        backwardWindow.to,
        backwardPage + 1,
        "backward",
        activeScope,
      );
    } else {
      const prevTo = addDays(backwardWindow.from, -1);
      const prevFrom = addDays(prevTo, -7);
      fetchFollowUps(prevFrom, prevTo, 1, "backward", activeScope);
    }
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNext();
        }
      },
      { rootMargin: "250px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forwardWindow, forwardPage, forwardPagination, loading, activeScope]);

  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}?tab=rehab`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUpDate = new Date(dateString);
    followUpDate.setHours(0, 0, 0, 0);
    return followUpDate < today;
  };

  const groupedPatients = patients.reduce(
    (acc, patient) => {
      const rawDateStr = new Date(patient.follow_Up_Date)
        .toISOString()
        .split("T")[0];
      if (!acc[rawDateStr]) acc[rawDateStr] = [];
      acc[rawDateStr].push(patient);
      return acc;
    },
    {} as Record<string, Patient[]>,
  );

  const sortedDates = Object.keys(groupedPatients).sort();

  return (
    <div className={styles.dashboardLayout}>
      <section className={styles.heroSection}>
        <svg
          className={styles.heroBackgroundSvg}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.7,-76.4C58.3,-69.2,70,-58.5,78.2,-45.5C86.4,-32.5,91.1,-17.2,89.3,-2.6C87.5,12,79.2,25.9,70.1,38.2C61.1,50.5,51.2,61.2,39.2,69.5C27.2,77.7,13.6,83.5,-0.6,84.5C-14.8,85.5,-29.6,81.8,-42.6,74.1C-55.6,66.4,-66.8,54.7,-74.6,41.2C-82.4,27.7,-86.8,12.4,-86.1,-2.7C-85.3,-17.8,-79.4,-32.7,-69.9,-44.9C-60.4,-57.1,-47.4,-66.6,-33.9,-73.9C-20.4,-81.2,-6.4,-86.3,8,-81.4C22.4,-76.5,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
        <div className={styles.heroContent}>
          <div className={styles.heroHeaderRow}>
            <div>
              <h2 className={`${styles.pageTitle} ${styles.fontHeadline}`}>
                <FaCalendarAlt className={styles.titleIcon} />{" "}
                {activeScope === "my"
                  ? "My Upcoming Follow-ups"
                  : "All Upcoming Follow-ups"}
              </h2>
              <p className={`${styles.pageSubtitle} ${styles.fontBody}`}>
                {activeScope === "my"
                  ? "Patients assigned to you or your care team due for follow-up"
                  : "All clinic patients due for aftercare and routine follow-up"}
              </p>
            </div>
            <div className={styles.headerActions}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--surface-container-lowest)",
                  padding: "0.45rem 0.8rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(188, 201, 198, 0.4)",
                }}
              >
                <FaFilter
                  style={{ color: "var(--primary)", fontSize: "0.9rem" }}
                />
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                  }}
                >
                  From:
                </span>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => {
                    setDateFilter((prev) => ({
                      ...prev,
                      from: e.target.value,
                    }));
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    color: "var(--on-surface-variant)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                    marginLeft: "0.5rem",
                  }}
                >
                  To:
                </span>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => {
                    setDateFilter((prev) => ({ ...prev, to: e.target.value }));
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    color: "var(--on-surface-variant)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className={styles.mainContent}>
        {loading && patients.length === 0 ? (
          <div className={styles.centeredState}>
            <div className={styles.spinner} />
            <p className={styles.fontBody}>Loading patients...</p>
          </div>
        ) : (
          <div className={styles.appointmentList}>
            <div
              className={styles.loadMoreContainer}
              style={{ marginBottom: "1.5rem" }}
            >
              <button
                className={styles.btnPrimary}
                disabled={loadingPrev}
                onClick={loadPrevious}
              >
                {loadingPrev ? "Loading..." : "Load Previous"}
              </button>
            </div>

            {sortedDates.length > 0 ? (
              <>
                {sortedDates.map((dateStr) => {
                  const dayPatients = groupedPatients[dateStr];
                  const overdue = isOverdue(dateStr);

                  return (
                    <div
                      key={dateStr}
                      className={styles.daySection}
                      style={{ marginBottom: "2rem" }}
                    >
                      <div
                        className={styles.dayHeader}
                        style={{
                          marginBottom: "1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <h2
                          className={styles.dayTitle}
                          style={{
                            margin: 0,
                            color: overdue ? "#ba1a1a" : "inherit",
                          }}
                        >
                          {formatDate(dateStr)}
                        </h2>
                        {overdue && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              background: "#ffebee",
                              color: "#c62828",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontWeight: 600,
                            }}
                          >
                            Overdue
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--on-surface-variant)",
                            marginLeft: "auto",
                          }}
                        >
                          {dayPatients.length}{" "}
                          {dayPatients.length === 1 ? "Patient" : "Patients"}
                        </span>
                      </div>

                      <div className={styles.stripGrid}>
                        {dayPatients.map((patient) => {
                          const riskLevel =
                            patient.relapse_risk_assessment?.risk_level;
                          const riskMeta = riskLevel
                            ? RISK_META[riskLevel]
                            : undefined;
                          const demoTag = [
                            patient.patient_age
                              ? `${patient.patient_age}`
                              : null,
                            patient.gender
                              ? patient.gender.charAt(0).toUpperCase()
                              : null,
                          ]
                            .filter(Boolean)
                            .join(", ");
                          const headCounselor = patient.care_team?.find(
                            (member) => member.role === "Head Counselor",
                          )?.doctor_name;
                          const completedPlans = patient.therapy_plans?.filter(
                            (p) =>
                              p.status?.toLowerCase() === "completed" ||
                              p.closure_reason,
                          );
                          const latestPlan = completedPlans?.sort(
                            (a, b) =>
                              new Date(b.closure_date || 0).getTime() -
                              new Date(a.closure_date || 0).getTime(),
                          )[0];

                          let reasonColor = "var(--on-secondary-fixed)";
                          if (
                            latestPlan?.closure_reason?.toLowerCase() ===
                            "incomplete"
                          )
                            reasonColor = "#d97706";
                          else if (
                            latestPlan?.closure_reason?.toLowerCase() ===
                            "dropout"
                          )
                            reasonColor = "#ef4444";
                          else if (
                            latestPlan?.closure_reason?.toLowerCase() ===
                            "refer"
                          )
                            reasonColor = "#3b82f6";
                          else if (
                            latestPlan?.closure_reason?.toLowerCase() === "opd"
                          )
                            reasonColor = "#8b5cf6";
                          else if (
                            latestPlan?.closure_reason?.toLowerCase() ===
                            "completed"
                          )
                            reasonColor = "#007b8e";

                          let tenureLabel = "Follow-up patient";
                          if (
                            latestPlan?.therapy_start &&
                            latestPlan?.closure_date
                          ) {
                            const startDate = new Date(
                              latestPlan.therapy_start,
                            );
                            const endDate = new Date(latestPlan.closure_date);
                            const diffDays = Math.max(
                              1,
                              Math.ceil(
                                (endDate.getTime() - startDate.getTime()) /
                                  (1000 * 60 * 60 * 24),
                              ),
                            );
                            tenureLabel = `In care for ${diffDays} day${diffDays !== 1 ? "s" : ""} (${formatDateShort(latestPlan.therapy_start)} — ${formatDateShort(latestPlan.closure_date)})`;
                          }

                          const phoneEntries: {
                            label: string;
                            value: string;
                          }[] = [];
                          if (patient.patient_phone)
                            phoneEntries.push({
                              label: "Patient",
                              value: patient.patient_phone,
                            });
                          if (patient.guardian_phone)
                            phoneEntries.push({
                              label: patient.guardian_relation || "Guardian 1",
                              value: patient.guardian_phone,
                            });
                          if (patient.guardian_phone_2)
                            phoneEntries.push({
                              label:
                                patient.guardian_relation_2 || "Guardian 2",
                              value: patient.guardian_phone_2,
                            });

                          return (
                            <div
                              key={patient._id}
                              className={styles.tileCard}
                              role="button"
                              tabIndex={0}
                              onClick={() => handlePatientClick(patient._id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  handlePatientClick(patient._id);
                                }
                              }}
                            >
                              {riskMeta && (
                                <span
                                  className={styles.tileAccentBar}
                                  style={
                                    {
                                      "--risk-color": `var(--${riskLevel === "Insufficient Data" ? "risk-unknown" : `risk-${riskLevel?.toLowerCase()}`})`,
                                    } as React.CSSProperties
                                  }
                                />
                              )}

                              <div className={styles.tileTopRow}>
                                <div className={styles.tileIdentity}>
                                  <div
                                    className={styles.tileAvatarWrap}
                                    style={
                                      riskMeta
                                        ? ({
                                            "--ring-color": `var(--${riskLevel === "Insufficient Data" ? "risk-unknown" : `risk-${riskLevel?.toLowerCase()}`})`,
                                          } as React.CSSProperties)
                                        : undefined
                                    }
                                  >
                                    <div className={styles.tileAvatar}>
                                      {patient.patient_image ? (
                                        <img
                                          src={patient.patient_image}
                                          alt={patient.patient_first_name}
                                        />
                                      ) : (
                                        <FaUser size={18} />
                                      )}
                                    </div>
                                  </div>

                                  <div className={styles.tileNameCol}>
                                    <div className={styles.tileNameRow}>
                                      <h4 className={styles.tileName}>
                                        {patient.patient_first_name}{" "}
                                        {patient.patient_last_name}
                                      </h4>
                                      {demoTag && (
                                        <span className={styles.tileTag}>
                                          {demoTag}
                                        </span>
                                      )}
                                      {patient.UHID && (
                                        <span className={styles.tileTag}>
                                          UHID {patient.UHID}
                                        </span>
                                      )}
                                    </div>
                                    {tenureLabel && (
                                      <div className={styles.tileSubRow}>
                                        {tenureLabel}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className={styles.tileBadgeCol}>
                                  {riskMeta && (
                                    <span
                                      className={`${styles.riskBadge} ${riskMeta.className}`}
                                    >
                                      {riskMeta.label}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className={styles.tileContactRow}>
                                {phoneEntries.length > 0 ? (
                                  phoneEntries.map((entry, i) => (
                                    <a
                                      key={i}
                                      className={styles.contactAction}
                                      href={`tel:${toDigits(entry.value)}`}
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label={`Call ${entry.label}: ${entry.value}`}
                                    >
                                      <FaPhone size={10} />
                                      {entry.value} ({entry.label})
                                    </a>
                                  ))
                                ) : (
                                  <span className={styles.contactAction}>
                                    No phone on file
                                  </span>
                                )}
                              </div>

                              <hr className={styles.tileDivider} />

                              <div className={styles.tileInfoGrid}>
                                <div className={styles.tileInfoItem}>
                                  <span className={styles.tileInfoLabel}>
                                    Follow-up Date
                                  </span>
                                  <span
                                    className={styles.tileInfoValue}
                                    style={
                                      isOverdue(patient.follow_Up_Date)
                                        ? { color: "#ba1a1a", fontWeight: 700 }
                                        : undefined
                                    }
                                  >
                                    {formatDateShort(patient.follow_Up_Date)}
                                  </span>
                                </div>
                                <div className={styles.tileInfoItem}>
                                  <span className={styles.tileInfoLabel}>
                                    Head Counselor
                                  </span>
                                  <span className={styles.tileInfoValue}>
                                    {headCounselor || "Unassigned"}
                                  </span>
                                </div>
                                {patient.archived_at && (
                                  <div className={styles.tileInfoItem}>
                                    <span className={styles.tileInfoLabel}>
                                      Discharge Date
                                    </span>
                                    <span className={styles.tileInfoValue}>
                                      {formatDateShort(patient.archived_at)}
                                    </span>
                                  </div>
                                )}
                                {latestPlan && (
                                  <div className={styles.tileInfoItem}>
                                    <span className={styles.tileInfoLabel}>
                                      Discharge Reason
                                    </span>
                                    <span
                                      className={styles.tileInfoValue}
                                      style={{
                                        color: reasonColor,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {latestPlan.closure_reason || "Completed"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className={styles.tileFooterRow}>
                                <span />
                                <FaChevronRight
                                  size={12}
                                  className={styles.tileChevron}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div ref={sentinelRef} className={styles.scrollSentinel}>
                  {loadingMore && <div className={styles.spinner} />}
                </div>
              </>
            ) : (
              <div className={styles.noAppointments}>
                <p>
                  No {activeScope === "my" ? "personal" : "clinic"} upcoming
                  follow-ups found for the selected dates.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <div className={styles.floatingToggleContainer}>
        <button
          className={`${styles.floatingToggleButton} ${
            activeScope === "my" ? styles.active : ""
          }`}
          onClick={() => {
            if (activeScope !== "my") {
              setActiveScope("my");
            }
          }}
        >
          My Follow-ups
        </button>
        <button
          className={`${styles.floatingToggleButton} ${
            activeScope === "all" ? styles.active : ""
          }`}
          onClick={() => {
            if (activeScope !== "all") {
              setActiveScope("all");
            }
          }}
        >
          All Follow-ups
        </button>
      </div>
    </div>
  );
};

export default AfterCareSession;
