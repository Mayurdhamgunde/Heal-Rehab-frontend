import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaUser,
  FaUserMd,
  FaClipboardList,
  FaPills,
  FaCalendarAlt,
  FaClock,
  FaWeight,
  FaHeartbeat,
  FaArrowLeft,
  FaChartLine,
  FaEye,
  FaMapMarkerAlt,
  FaPrint,
  FaSpinner,
  FaStethoscope,
} from "react-icons/fa";
import CircularProgress from "@mui/material/CircularProgress";
import { useReactToPrint } from "react-to-print";
import api from "../utils/central";
import PrescriptionPrintTemplate from "../screens/Rehab/PrescriptionPrintTemplate";
import PlanPrintTemplate from "../screens/Rehab/PlanPrintTemplate";
import styles from "../css/SessionDetailsScreen.module.css";

const EMOTIONAL_OPTIONS = [
  { label: "Volatile", value: "volatile", emoji: "🌋" },
  { label: "Distressed", value: "distressed", emoji: "😭" },
  { label: "Unsettled", value: "unsettled", emoji: "🌪️" },
  { label: "Stable", value: "stable", emoji: "🧘" },
  { label: "Regulated", value: "regulated", emoji: "☀️" },
];

const SLEEP_OPTIONS = [
  { label: "None", value: "none", emoji: "🚫" },
  { label: "Poor", value: "poor", emoji: "😫" },
  { label: "Disturbed", value: "disturbed", emoji: "😵‍💫" },
  { label: "Fair", value: "fair", emoji: "😌" },
  { label: "Restful", value: "restful", emoji: "😴" },
];

const IMPRESSION_OPTIONS = [
  { label: "Concerning", value: "concerning", emoji: "🚨" },
  { label: "Below Exp.", value: "below_expectations", emoji: "📉" },
  { label: "Neutral", value: "neutral", emoji: "😐" },
  { label: "Positive", value: "positive", emoji: "📈" },
  { label: "Breakthrough", value: "breakthrough", emoji: "🌟" },
];

const formatLabel = (val: string) =>
  val.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatLocalTime = (timeStr?: string) => {
  if (!timeStr) return "--:--";

  try {
    const cleanTime = timeStr.includes("T")
      ? timeStr.split("T")[1].slice(0, 5)
      : timeStr;
    const [hourStr, minuteStr] = cleanTime.split(":");
    if (!hourStr || !minuteStr) return cleanTime.slice(0, 5);

    let hours = parseInt(hourStr, 10);
    const minutes = minuteStr.substring(0, 2);
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  } catch (error) {
    return timeStr.slice(0, 5);
  }
};

const formatLocalDate = (dateStr?: string) => {
  if (!dateStr) return "--";
  try {
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [year, month, day] = cleanDate.split("-");
    if (!year || !month || !day) return cleanDate;

    const dateObj = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    );
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return dateStr.split("T")[0];
  }
};

const getStatusDisplay = (status?: string) => {
  if (!status) return "PENDING";
  const s = status.toLowerCase();
  if (s === "pending_counselor") return "PENDING COUNSELOR";
  if (s === "pending_medical") return "PENDING MEDICAL";
  if (s === "in_progress") return "IN PROGRESS";
  if (s === "no show") return "NO SHOW";
  return status.toUpperCase();
};

const getStatusColor = (status?: string) => {
  if (!status) return { bg: "#fff3e0", color: "#ef6c00" };
  const s = status.toLowerCase();
  if (s === "completed") return { bg: "#e8f5e9", color: "#2e7d32" };
  if (s === "pending_counselor" || s === "pending_medical")
    return { bg: "#fff3e0", color: "#ef6c00" };
  if (s === "cancelled") return { bg: "#fee2e2", color: "#ef4444" };
  return { bg: "#fff3e0", color: "#ef6c00" };
};

const SessionDetails: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Prescription Print State & Refs ---
  const printRxRef = useRef<HTMLDivElement>(null);
  const [rxPrintData, setRxPrintData] = useState<any>(null);
  const [isPrintingRx, setIsPrintingRx] = useState<boolean>(false);

  const handleRxPrint = useReactToPrint({
    contentRef: printRxRef,
    documentTitle: "Prescription",
    onAfterPrint: () => setRxPrintData(null),
  });

  const fetchAndPrintPrescription = async (prescriptionId: string) => {
    if (!prescriptionId) return;
    setIsPrintingRx(true);
    try {
      const response = await api.get(
        `/get/prescription/print/${prescriptionId}`,
      );
      setRxPrintData(response.data);
      setTimeout(() => {
        handleRxPrint();
        setIsPrintingRx(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching prescription print data:", err);
      setIsPrintingRx(false);
    }
  };

  // --- Follow-up Plan Print State & Refs ---
  const printFollowupPlanRef = useRef<HTMLDivElement>(null);
  const [followupPlanData, setFollowupPlanData] = useState<any>(null);
  const [isPrintingFollowupPlan, setIsPrintingFollowupPlan] =
    useState<boolean>(false);

  const handleFollowupPlanPrint = useReactToPrint({
    contentRef: printFollowupPlanRef,
    documentTitle: "Follow-up Summary",
    onAfterPrint: () => setFollowupPlanData(null),
  });

  const fetchAndPrintFollowupPlan = async () => {
    if (!sessionId) return;
    setIsPrintingFollowupPlan(true);
    try {
      const response = await api.get(`/followup/prescription/${sessionId}`);
      setFollowupPlanData(response.data);
      setTimeout(() => {
        handleFollowupPlanPrint();
        setIsPrintingFollowupPlan(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching follow-up plan print data:", err);
      setIsPrintingFollowupPlan(false);
    }
  };

  const fetchSessionDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/get/session/details/${sessionId}`);
      setData(response.data.data);
    } catch (err) {
      console.error("Error fetching session details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) fetchSessionDetails();
  }, [sessionId, fetchSessionDetails]);

  const renderChipValue = (val: string | null | undefined) => {
    if (!val || val === "none")
      return <span className={styles.emptyValue}>Not recorded / None</span>;
    return <span className={styles.readOnlyPill}>{formatLabel(val)}</span>;
  };

  const renderEmojiValue = (val: string | null | undefined, options: any[]) => {
    if (!val) return <span className={styles.emptyValue}>Not recorded</span>;
    const found = options.find((o) => o.value === val);
    if (!found)
      return <span className={styles.readOnlyPill}>{formatLabel(val)}</span>;
    return (
      <div className={styles.emojiDisplay}>
        <span className={styles.emojiIcon}>{found.emoji}</span>
        <span className={styles.emojiText}>{found.label}</span>
      </div>
    );
  };

  const renderScorePill = (val: number | null | undefined) => {
    if (val === undefined || val === null)
      return <span className={styles.emptyValue}>Not scored</span>;
    return (
      <span
        className={styles.readOnlyPill}
        style={{ fontWeight: "bold", fontSize: "0.85rem" }}
      >
        {val} / 5
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <CircularProgress
          size={40}
          thickness={4}
          style={{ color: "var(--primary)" }}
        />
        <p>Loading session details...</p>
      </div>
    );
  }

  if (!data) return null;

  const { session_info, patient_details, prescription } = data;
  const rehab = session_info?.rehab_indicators || {};
  const obs = session_info?.clinical_observations || {};

  const isIndividualSession =
    (session_info.therepy_type || "Individual") === "Individual";
  const isAftercareSession =
    session_info.therepy_type === "Aftercare" ||
    session_info.therepy_type === "Follow-up";
  const isFollowupSession = session_info.therepy_type === "Follow-up";

  const sessionStatusColors = getStatusColor(session_info.status);

  return (
    <div className={styles.pageContainer}>
      {/* Header Panel */}
      <div className={styles.headerPanel}>
        <div className={styles.headerLeft}>
          <FaArrowLeft
            size={18}
            className={styles.backIcon}
            onClick={() => navigate(-1)}
          />
          <div>
            <h1 className={styles.pageTitle}>Session Details</h1>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <span className={styles.sessionTypeBadge}>
                {session_info.therepy_type || "Individual"} Session
              </span>
              {session_info.session_number && (
                <span className={styles.sessionNumberBadge}>
                  Session #{session_info.session_number}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.dateBadge}>
            <FaCalendarAlt size={14} color="var(--primary)" />{" "}
            {formatLocalDate(session_info.therepy_date)}
            <span style={{ margin: "0 4px", color: "var(--border-color)" }}>
              |
            </span>
            <FaClock size={14} color="var(--primary)" />{" "}
            {formatLocalTime(
              session_info.session_start_time ||
                session_info.therepy_start_time,
            )}
          </div>

          {/* Follow-up Print Action */}
          {isFollowupSession && (
            <button
              onClick={fetchAndPrintFollowupPlan}
              disabled={isPrintingFollowupPlan}
              className={styles.actionBtn}
              style={{
                backgroundColor: "#0284c7",
                color: "white",
                border: "none",
              }}
              title="Print Follow-up Card"
            >
              {isPrintingFollowupPlan ? (
                <FaSpinner className="fa-spin" />
              ) : (
                <FaPrint size={14} />
              )}
              {isPrintingFollowupPlan ? "Preparing..." : "Print Summary"}
            </button>
          )}

          {session_info.status === "pending_counselor" && (
            <button
              onClick={() =>
                navigate(`/complete-aftercare-counselor/${sessionId}`, {
                  state: { appointment: session_info },
                })
              }
              className={styles.actionBtn}
              style={{
                backgroundColor: "var(--primary)",
                color: "white",
                border: "none",
              }}
            >
              <FaUserMd size={14} /> Complete Counselor Phase
            </button>
          )}

          {session_info.status === "pending_medical" && (
            <button
              onClick={() =>
                navigate(`/complete-aftercare-physician/${sessionId}`, {
                  state: { appointment: session_info },
                })
              }
              className={styles.actionBtn}
              style={{
                backgroundColor: "var(--primary)",
                color: "white",
                border: "none",
              }}
            >
              <FaStethoscope size={14} /> Complete Medical Phase
            </button>
          )}

          {session_info.status !== "pending_counselor" &&
            session_info.status !== "pending_medical" && (
              <button
                onClick={() => navigate(`/editSession/${sessionId}`)}
                className={styles.actionBtn}
                title="Edit Session"
              >
                <FaEdit size={14} /> Edit
              </button>
            )}
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* ── LEFT COLUMN ──────────────────────────── */}
        <div className={styles.columnFlex}>
          {/* 1. Normal Session Clinical Notes */}
          {!isAftercareSession && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <FaClipboardList color="var(--primary)" /> Clinical Notes
                </h2>
              </div>
              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Issue Dealt With</label>
                <div className={styles.detailBox}>
                  {session_info.issue_dealt_with || (
                    <span className={styles.emptyValue}>
                      No issues recorded.
                    </span>
                  )}
                </div>
              </div>
              <div
                className={styles.infoGroup}
                style={{ marginBottom: 0, marginTop: "1.25rem" }}
              >
                <label className={styles.infoLabel}>Counselor Impression</label>
                <div className={styles.detailBox}>
                  {session_info.counselor_impression || (
                    <span className={styles.emptyValue}>
                      No impressions recorded.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Rehabilitation Indicators - Normal Sessions Only */}
          {isIndividualSession && !isAftercareSession && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <FaChartLine color="var(--primary)" /> Rehabilitation
                  Indicators
                </h2>
              </div>
              <div className={styles.rowGrid}>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Craving Intensity</label>
                  <div>{renderChipValue(rehab.craving_intensity)}</div>
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Behavioural Compliance
                  </label>
                  <div>{renderChipValue(rehab.behavioural_compliance)}</div>
                </div>
              </div>
              <div className={styles.rowGrid}>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Emotional Stability
                  </label>
                  <div>
                    {renderEmojiValue(
                      rehab.emotional_stability,
                      EMOTIONAL_OPTIONS,
                    )}
                  </div>
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Sleep Quality</label>
                  <div>
                    {renderEmojiValue(rehab.sleep_quality, SLEEP_OPTIONS)}
                  </div>
                </div>
              </div>
              <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                <label className={styles.infoLabel}>Session Impression</label>
                <div>
                  {renderEmojiValue(
                    rehab.session_impression,
                    IMPRESSION_OPTIONS,
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. Aftercare / Follow-up Blocks */}
          {isAftercareSession && (
            <>
              {/* Aftercare Status (Type of Meet, Time Block, Duration Removed) */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <FaCalendarAlt color="var(--primary)" />{" "}
                    {session_info.therepy_type} Details
                  </h2>
                </div>
                <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.infoLabel}>Status</label>
                  <div>
                    <div
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: sessionStatusColors.bg,
                        color: sessionStatusColors.color,
                        border: "none",
                        display: "inline-block",
                      }}
                    >
                      {getStatusDisplay(session_info.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Review */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <FaStethoscope color="var(--primary)" /> Medical Review
                  </h2>
                </div>
                <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.infoLabel}>
                    Patient Complaints / Findings
                  </label>
                  <div className={styles.detailBox}>
                    {session_info.patient_complaints || (
                      <span className={styles.emptyValue}>
                        No complaints recorded.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Counselor Review */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <FaClipboardList color="var(--primary)" /> Counselor Review
                  </h2>
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Issues addressed in counselling
                  </label>
                  <div className={styles.detailBox}>
                    {session_info.issues_addressed || (
                      <span className={styles.emptyValue}>Not recorded.</span>
                    )}
                  </div>
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Recovery status: abstinence and progress
                  </label>
                  <div className={styles.detailBox}>
                    {session_info.recovery_status || (
                      <span className={styles.emptyValue}>Not recorded.</span>
                    )}
                  </div>
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Other communication: calls, letters, etc.
                  </label>
                  <div className={styles.detailBox}>
                    {session_info.other_communication || (
                      <span className={styles.emptyValue}>Not recorded.</span>
                    )}
                  </div>
                </div>
                <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.infoLabel}>
                    Counselor Impression / Final Remarks
                  </label>
                  <div className={styles.detailBox}>
                    {session_info.counselor_impression || (
                      <span className={styles.emptyValue}>Not recorded.</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT COLUMN ────────────────────────── */}
        <div className={styles.columnFlex}>
          {/* 4. Session Info */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <FaUserMd color="var(--primary)" /> Session Info
              </h2>
              {!isAftercareSession && (
                <div
                  className={styles.statusBadge}
                  style={{
                    backgroundColor: sessionStatusColors.bg,
                    color: sessionStatusColors.color,
                    border: "none",
                  }}
                >
                  {getStatusDisplay(session_info.status)}
                </div>
              )}
            </div>

            <div className={styles.rowGrid} style={{ marginBottom: "1rem" }}>
              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Patient Name</label>
                <div
                  className={styles.infoValue}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FaUser size={12} color="var(--primary)" />{" "}
                  {patient_details?.patient_first_name}{" "}
                  {patient_details?.patient_last_name}
                </div>
              </div>

              <div className={styles.infoGroup}>
                {isAftercareSession ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label className={styles.infoLabel}>Physician</label>
                      <div className={styles.infoValue}>
                        {session_info.aftercare_team?.physician_name ||
                          session_info.doctor_name ||
                          "Unassigned"}
                      </div>
                    </div>
                    <div>
                      <label className={styles.infoLabel}>Counselor</label>
                      <div className={styles.infoValue}>
                        {session_info.aftercare_team?.counsellor_name ||
                          "Unassigned"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className={styles.infoLabel}>
                      Attending Doctor / Counselor
                    </label>
                    <div className={styles.infoValue}>
                      {session_info.doctor_name || "Unassigned"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {session_info.location_name && (
              <div
                className={styles.infoGroup}
                style={{
                  marginBottom: prescription?.vitals ? "1rem" : 0,
                }}
              >
                <label className={styles.infoLabel}>Facility Location</label>
                <div
                  className={styles.infoValue}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FaMapMarkerAlt size={12} color="var(--primary)" />{" "}
                  {session_info.location_name}
                </div>
              </div>
            )}

            {prescription?.vitals && (
              <div className={styles.vitalsRow}>
                <div className={styles.vitalItem}>
                  <label className={styles.infoLabel}>
                    <FaWeight size={10} color="var(--primary)" /> Weight
                  </label>
                  <div className={styles.vitalValueBox}>
                    {prescription.vitals.weight || "--"} kg
                  </div>
                </div>
                <div className={styles.vitalItem}>
                  <label className={styles.infoLabel}>
                    <FaHeartbeat size={10} color="var(--primary)" /> BP
                  </label>
                  <div className={styles.vitalValueBox}>
                    {prescription.vitals.bp || "--"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Clinical Observations - Normal Sessions Only */}
          {isIndividualSession && !isAftercareSession && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <FaEye color="var(--primary)" /> Clinical Observations
                </h2>
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>
                  Withdrawal Symptoms Observed
                </label>
                <div className={styles.chipGroup}>
                  {obs.withdrawal_symptoms &&
                  obs.withdrawal_symptoms.length > 0 &&
                  !obs.withdrawal_symptoms.includes("none") ? (
                    obs.withdrawal_symptoms.map((sym: string) => (
                      <span key={sym} className={styles.symptomChip}>
                        {formatLabel(sym)}
                      </span>
                    ))
                  ) : (
                    <span className={styles.emptyValue}>None observed</span>
                  )}
                </div>
              </div>

              <div
                className={styles.rowGrid}
                style={{ marginBottom: 0, marginTop: "1.25rem" }}
              >
                <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.infoLabel}>Appetite</label>
                  <div>{renderChipValue(obs.appetite)}</div>
                </div>
                <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.infoLabel}>
                    Physical Appearance
                  </label>
                  <div>{renderChipValue(obs.physical_appearance)}</div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Recovery Domain Scores - Aftercare Sessions Only */}
          {isAftercareSession && (
            <div className={styles.card}>
              <div
                className={styles.cardHeader}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 className={styles.cardTitle}>
                  <FaChartLine color="var(--primary)" /> Recovery Domain Scores
                </h2>
                <div
                  className={styles.statusBadge}
                  style={{
                    backgroundColor: "#e0f2fe",
                    color: "#0284c7",
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  Total Score: {session_info.total_recovery_score || 0} / 30
                </div>
              </div>

              <div className={styles.rowGrid}>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Alcohol / drug-free life
                  </label>
                  <div>
                    {renderScorePill(
                      session_info.recovery_domain_scores?.alcohol_drug_free,
                    )}
                  </div>
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Physical well-being
                  </label>
                  <div>
                    {renderScorePill(
                      session_info.recovery_domain_scores?.physical_well_being,
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.rowGrid}>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>
                    Family relationships
                  </label>
                  <div>
                    {renderScorePill(
                      session_info.recovery_domain_scores?.family_relationships,
                    )}
                  </div>
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Crime-free status</label>
                  <div>
                    {renderScorePill(
                      session_info.recovery_domain_scores?.crime_free_status,
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.infoLabel}>Gainfully employed</label>
                  <div>
                    {renderScorePill(
                      session_info.recovery_domain_scores?.gainfully_employed,
                    )}
                  </div>
                </div>
                <div className={styles.infoGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.infoLabel}>
                    Financial stability
                  </label>
                  <div>
                    {renderScorePill(
                      session_info.recovery_domain_scores?.financial_stability,
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. Prescriptions */}
          {prescription && (prescription.medications?.length ?? 0) > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <FaPills color="var(--primary)" /> Prescription (
                  {prescription.medications?.length || 0})
                </h2>

                {prescription._id && (
                  <button
                    onClick={() => fetchAndPrintPrescription(prescription._id)}
                    disabled={isPrintingRx}
                    className={styles.actionBtn}
                    title="Print Prescription"
                  >
                    {isPrintingRx ? (
                      <FaSpinner className="fa-spin" />
                    ) : (
                      <FaPrint size={12} />
                    )}
                    {isPrintingRx ? "Printing..." : "Print Rx"}
                  </button>
                )}
              </div>

              <div className={styles.medList}>
                {prescription.medications?.map((med: any, index: number) => {
                  const frequency =
                    med.frequency ||
                    (med.schedules && med.schedules[0]?.frequency) ||
                    "N/A";
                  const duration =
                    med.duration ||
                    (med.schedules && med.schedules[0]?.duration) ||
                    "0";
                  const quantity =
                    med.quantity ||
                    (med.schedules && med.schedules[0]?.quantity) ||
                    "0";

                  return (
                    <div key={index} className={styles.medCard}>
                      <div className={styles.medBadge}>{index + 1}</div>
                      <div>
                        <div className={styles.medName}>
                          {med.drug_name} {med.strength && `(${med.strength})`}
                        </div>
                        <div className={styles.medMeta}>
                          <span
                            className={styles.symptomChip}
                            style={{ padding: "2px 8px", fontSize: "0.65rem" }}
                          >
                            {frequency}
                          </span>
                          <span
                            className={styles.symptomChip}
                            style={{ padding: "2px 8px", fontSize: "0.65rem" }}
                          >
                            {duration} Days
                          </span>
                          <span
                            className={styles.symptomChip}
                            style={{ padding: "2px 8px", fontSize: "0.65rem" }}
                          >
                            {quantity} Qty
                          </span>
                        </div>
                        {med.instructions && (
                          <div className={styles.medInstructionBox}>
                            <span className={styles.instructionLabel}>
                              Note:
                            </span>
                            <p style={{ margin: 0 }}>{med.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {prescription.notes && (
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px dashed var(--border-color)",
                  }}
                >
                  <label className={styles.infoLabel}>Rx Notes</label>
                  <div
                    className={styles.detailBox}
                    style={{
                      background: "#fffbeb",
                      borderColor: "#fcd34d",
                      color: "#92400e",
                    }}
                  >
                    {prescription.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden Print Targets */}
      <div style={{ display: "none" }}>
        <PrescriptionPrintTemplate ref={printRxRef} data={rxPrintData} />
        <PlanPrintTemplate ref={printFollowupPlanRef} data={followupPlanData} />
      </div>
    </div>
  );
};

export default SessionDetails;
