import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/MarkCompleteAppointment.module.css";
import PrescriptionFormComponent from "../components/PrescriptionFormComponent";

// -------------------------------------------------------------------
// Constants & Options for Clinical & Rehab Indicators
// -------------------------------------------------------------------
const SYMPTOM_OPTIONS = ["tremors", "sweating", "nausea", "insomnia", "none"];
const APPETITE_OPTIONS = ["poor", "fair", "normal", "good"];
const APPEARANCE_OPTIONS = [
  "dishevelled",
  "unkempt",
  "adequate",
  "well_groomed",
];

const CRAVING_OPTIONS = ["none", "mild", "moderate", "strong", "overwhelming"];
const COMPLIANCE_OPTIONS = [
  "resistant",
  "passive",
  "cooperative",
  "engaged",
  "proactive",
];

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

// -------------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------------
interface SessionImage {
  file: File;
  preview: string;
  id: string;
}

interface TherapySessionDetail {
  _id: string;
  status: string;
  date?: string;
  therepy_date?: string;
  therepy_start_time?: string;
  therepy_type?: string;
  session_number?: number;
  doctor_name?: string;
  counselor_impression?: string;
}

interface TherapyPlan {
  _id: string;
  therapy_name: string;
  patient_diagnosis: string;
  patient_symptoms: string[] | string;
  therapy_start: string;
  therapy_end: string;
  therapy_duration: string;
  patient_therapy_category: string;
  estimated_sessions?: number;
  therapy_sessions?: TherapySessionDetail[];
  status?: string;
}

interface PlanDetailsData {
  patient_id: string | null;
  patient_name: string;
  patient_image: string | null;
  patient_phone: string | null;
  guardian_phone: string | null;
  guardian_phone_2: string | null;
  created_by_name: string;
  therapy_plan: TherapyPlan;
  prescription: any;
  images: any[];
  closure_summary?: any;
}

interface PatientContactData {
  _id: string;
  patient_phone?: string | null;
  guardian_phone?: string | null;
  guardian_phone_2?: string | null;
}

interface RehabIndicators {
  craving_intensity: string | null;
  behavioural_compliance: string | null;
  emotional_stability: string | null;
  sleep_quality: string | null;
  session_impression: string | null;
}

interface ClinicalObservations {
  withdrawal_symptoms: string[];
  appetite: string | null;
  physical_appearance: string | null;
}

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------
const MarkCompleteAppointment: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const appointment = state?.appointment;
  const session = JSON.parse(localStorage.getItem("user") || "{}");
  const isPhysiotherapy =
    session.organization_industry?.toLowerCase().trim() === "physiotherapy";

  const [actionType, setActionType] = useState<
    "completed" | "No Show" | "Cancelled"
  >("completed");
  const [loading, setLoading] = useState(false);

  // Plan Details State
  const [planDetails, setPlanDetails] = useState<PlanDetailsData | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Completed State
  const [sessionStartTime, setSessionStartTime] = useState<string>(
    appointment?.therepy_start_time || new Date().toTimeString().slice(0, 5),
  );
  const [sessionEndTime, setSessionEndTime] = useState<string>(
    appointment?.therepy_end_time || new Date().toTimeString().slice(0, 5),
  );
  const [sessionDuration, setSessionDuration] = useState("0m");
  const [counselorImpression, setCounselorImpression] = useState("");
  const [sessionImages] = useState<SessionImage[]>([]);

  // Rehab Indicators State
  const [rehabIndicators, setRehabIndicators] = useState<RehabIndicators>({
    craving_intensity: null,
    behavioural_compliance: null,
    emotional_stability: null,
    sleep_quality: null,
    session_impression: null,
  });

  // Clinical Observations State
  const [clinicalObservations, setClinicalObservations] =
    useState<ClinicalObservations>({
      withdrawal_symptoms: ["none"],
      appetite: null,
      physical_appearance: null,
    });

  // Type of Meet Toggle
  const [typeOfMeet, setTypeOfMeet] = useState<string>("");

  // Phone Number States (read-only — sourced from the patient record via getPatient)
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [guardianPhone, setGuardianPhone] = useState<string>("");
  const [guardianPhone2, setGuardianPhone2] = useState<string>("");
  const [contactLoading, setContactLoading] = useState(false);

  // Prescription Toggle
  const [includePrescription, setIncludePrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  // Cancel/No Show State
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!appointment) {
      navigate(-1);
    }
  }, [appointment, navigate]);

  useEffect(() => {
    if (appointment?.plan_id) {
      fetchPlanDetails(appointment.plan_id);
    }
  }, [appointment]);

  const fetchPlanDetails = async (planId: string) => {
    setPlanLoading(true);
    try {
      const response = await api.get(`/get/plan/${planId}`);
      const data: PlanDetailsData = response.data;
      setPlanDetails(data);
    } catch (err) {
      console.error("Failed to fetch plan details:", err);
    } finally {
      setPlanLoading(false);
    }
  };

  // Resolve the patient id from whatever source is available (appointment first,
  // falling back to the plan-details response once it loads).
  const resolvedPatientId: string | null =
    appointment?.patient_id || planDetails?.patient_id || null;

  useEffect(() => {
    if (resolvedPatientId) {
      fetchPatientContactInfo(resolvedPatientId);
    }
  }, [resolvedPatientId]);

  // Same /patient/:patientId endpoint PatientView uses (getPatient), kept as
  // the single source of truth for phone numbers — these fields are read-only here.
  const fetchPatientContactInfo = async (patientId: string) => {
    setContactLoading(true);
    try {
      const response = await api.get(`/patient/${patientId}`);
      const data: PatientContactData = response.data.patientData;
      setPatientPhone(data.patient_phone || "");
      setGuardianPhone(data.guardian_phone || "");
      setGuardianPhone2(data.guardian_phone_2 || "");
    } catch (err) {
      console.error("Failed to fetch patient contact info:", err);
    } finally {
      setContactLoading(false);
    }
  };

  useEffect(() => {
    calculateDuration();
  }, [sessionStartTime, sessionEndTime]);

  const calculateDuration = () => {
    if (!sessionStartTime || !sessionEndTime) return;

    const [startHours, startMinutes] = sessionStartTime.split(":").map(Number);
    const [endHours, endMinutes] = sessionEndTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const diffMinutes = endTotalMinutes - startTotalMinutes;

    if (diffMinutes <= 0) {
      setSessionDuration("0m");
      return;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    setSessionDuration(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ── Unified Validation for Completion Flow ────────────────────────
  const validateCompletion = () => {
    if (!typeOfMeet.trim()) {
      alert("Please select a Type of Meet.");
      return false;
    }

    const [startHours, startMinutes] = sessionStartTime.split(":").map(Number);
    const [endHours, endMinutes] = sessionEndTime.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      alert("End time must be after start time");
      return false;
    }
    return true;
  };

  const handleRehabIndicatorChange = (
    field: keyof RehabIndicators,
    value: string,
  ) => {
    setRehabIndicators((prev) => ({ ...prev, [field]: value }));
  };

  const handleClinicalObservationChange = (
    field: keyof ClinicalObservations,
    value: string,
  ) => {
    setClinicalObservations((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (symptom: string) => {
    setClinicalObservations((prev) => {
      let currentSymptoms = [...prev.withdrawal_symptoms];

      if (symptom === "none") {
        currentSymptoms = ["none"];
      } else {
        currentSymptoms = currentSymptoms.filter((s) => s !== "none");
        if (currentSymptoms.includes(symptom)) {
          currentSymptoms = currentSymptoms.filter((s) => s !== symptom);
        } else {
          currentSymptoms.push(symptom);
        }
      }

      if (currentSymptoms.length === 0) {
        currentSymptoms = ["none"];
      }

      return {
        ...prev,
        withdrawal_symptoms: currentSymptoms,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === "completed") {
      if (!validateCompletion()) return;
      await handleMarkCompleted();
    } else {
      await handleUpdateStatus(actionType);
    }
  };

  const handleUpdateStatus = async (status: "No Show" | "Cancelled") => {
    if (!reason.trim()) {
      alert("Please provide a reason.");
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/mark/status/${appointment._id}`, { status, reason });
      navigate("/appointment-success", {
        state: {
          appointmentId: appointment._id,
          patientName: appointment.patient_name,
          appointmentDate: appointment.therepy_date,
          status: status.toLowerCase().replace(" ", "-"),
        },
      });
    } catch (error: any) {
      alert(error.response?.data?.error || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      const appointmentDate = appointment.therepy_date;
      const startDateTime = new Date(
        `${appointmentDate}T${sessionStartTime}:00`,
      );
      const endDateTime = new Date(`${appointmentDate}T${sessionEndTime}:00`);

      formData.append("session_start_time", startDateTime.toISOString());
      formData.append("session_end_time", endDateTime.toISOString());

      if (counselorImpression.trim()) {
        formData.append("counselor_impression", counselorImpression.trim());
      }

      formData.append("Typeofmeet", typeOfMeet);

      if (patientPhone.trim())
        formData.append("patient_phone", patientPhone.trim());
      if (guardianPhone.trim())
        formData.append("guardian_phone", guardianPhone.trim());
      if (guardianPhone2.trim())
        formData.append("guardian_phone_2", guardianPhone2.trim());

      formData.append("rehab_indicators", JSON.stringify(rehabIndicators));
      formData.append(
        "clinical_observations",
        JSON.stringify(clinicalObservations),
      );

      sessionImages.forEach((image) => {
        formData.append("images", image.file);
      });

      if (
        includePrescription &&
        prescriptionData &&
        prescriptionData.medications?.length > 0
      ) {
        const prescriptionPayload = {
          vitals: {
            weight: prescriptionData.weight || "",
            bp: prescriptionData.bp || "",
          },
          medications: prescriptionData.medications,
          notes: prescriptionData.notes || "",
          diagnosis: appointment.therepy_type || "General Therapy",
        };
        formData.append("prescription", JSON.stringify(prescriptionPayload));
      }

      await api.post(`/mark/completed/${appointment._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Appointment marked as completed");
      navigate(-1);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to complete appointment");
    } finally {
      setLoading(false);
    }
  };

  // ── UI Render Helpers ────────────────────────────────────────────────
  const renderPillSelector = (
    options: string[],
    currentValue: string | null,
    onClick: (val: string) => void,
  ) => (
    <div className={styles.pillSelector}>
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          className={`${styles.togglePill} ${currentValue === opt ? styles.togglePillActive : ""}`}
          onClick={() => onClick(opt)}
        >
          {formatLabel(opt)}
        </button>
      ))}
    </div>
  );

  const renderEmojiSelector = (
    options: { label: string; value: string; emoji: string }[],
    currentValue: string | null,
    onClick: (val: string) => void,
  ) => (
    <div className={styles.emojiGroup}>
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          className={`${styles.emojiBtn} ${currentValue === opt.value ? styles.emojiBtnActive : ""}`}
          onClick={() => onClick(opt.value)}
          title={opt.label}
        >
          <span className={styles.emojiIcon}>{opt.emoji}</span>
          <span className={styles.emojiLabel}>{opt.label}</span>
        </button>
      ))}
    </div>
  );

  if (!appointment) return null;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft
            size={16}
            style={{ cursor: "pointer", color: "#6b7280", marginRight: "5px" }}
            onClick={() => navigate(-1)}
          />
          Manage Aftercare
        </h1>
      </div>

      <div className={styles.contextBanner}>
        <div className={styles.patientSnapshotUnified}>
          <div className={styles.patientAvatar}>
            {planDetails?.patient_image ? (
              <img
                src={planDetails.patient_image}
                alt="Patient"
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {appointment.patient_name?.charAt(0).toUpperCase() || "P"}
              </span>
            )}
          </div>
          <div className={styles.patientInfo}>
            <div className={styles.patientName}>{appointment.patient_name}</div>
            <div className={styles.patientDate}>
              {formatDate(appointment.therepy_date)}
            </div>
            {planDetails?.therapy_plan?.patient_diagnosis && (
              <div className={styles.patientDiagnosis}>
                {planDetails.therapy_plan.patient_diagnosis}
              </div>
            )}
          </div>
        </div>

        {appointment?.plan_id && (
          <div className={styles.planQuickStats}>
            {planLoading ? (
              <div className={styles.planLoadingText}>
                Loading plan details...
              </div>
            ) : planDetails?.therapy_plan ? (
              <>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Therapy Plan</span>
                  <span className={styles.statValue}>
                    {planDetails.therapy_plan.therapy_name}
                  </span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Progress</span>
                  <span className={styles.statValue}>
                    {planDetails.therapy_plan.therapy_sessions?.filter(
                      (s) => s.status === "completed",
                    ).length ?? 0}{" "}
                    / {planDetails.therapy_plan.estimated_sessions ?? "N/A"}
                  </span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Status</span>
                  <span className={styles.statValue}>
                    {planDetails.therapy_plan.status || "Active"}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.planLoadingText}>
                Plan details unavailable.
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.mainGrid}>
          {/* --- LEFT COLUMN: Clinical Notes --- */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {actionType === "completed" ? (
              <>
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Clinical Documentation</h2>
                  </div>
                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label
                      htmlFor="counselorImpression"
                      className={styles.label}
                    >
                      Counselor Impression / Final Results Remarks
                    </label>
                    <textarea
                      id="counselorImpression"
                      value={counselorImpression}
                      onChange={(e) => setCounselorImpression(e.target.value)}
                      className={styles.textarea}
                      placeholder="Enter counselor impression, final results, or patient progress..."
                      style={{ minHeight: "150px" }}
                    />
                  </div>
                </div>

                {!isPhysiotherapy && (
                  <div className={styles.card} style={{ marginBottom: 0 }}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>
                        Rehabilitation Indicators
                      </h2>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Craving Intensity</label>
                      {renderPillSelector(
                        CRAVING_OPTIONS,
                        rehabIndicators.craving_intensity,
                        (v) =>
                          handleRehabIndicatorChange("craving_intensity", v),
                      )}
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Behavioural Compliance
                      </label>
                      {renderPillSelector(
                        COMPLIANCE_OPTIONS,
                        rehabIndicators.behavioural_compliance,
                        (v) =>
                          handleRehabIndicatorChange(
                            "behavioural_compliance",
                            v,
                          ),
                      )}
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Emotional Stability
                      </label>
                      {renderEmojiSelector(
                        EMOTIONAL_OPTIONS,
                        rehabIndicators.emotional_stability,
                        (v) =>
                          handleRehabIndicatorChange("emotional_stability", v),
                      )}
                    </div>

                    <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Sleep Quality</label>
                        {renderEmojiSelector(
                          SLEEP_OPTIONS,
                          rehabIndicators.sleep_quality,
                          (v) => handleRehabIndicatorChange("sleep_quality", v),
                        )}
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>
                          Session Impression
                        </label>
                        {renderEmojiSelector(
                          IMPRESSION_OPTIONS,
                          rehabIndicators.session_impression,
                          (v) =>
                            handleRehabIndicatorChange("session_impression", v),
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!isPhysiotherapy && (
                  <div className={styles.card} style={{ marginBottom: 0 }}>
                    <div
                      className={styles.cardHeader}
                      style={{
                        marginBottom: includePrescription ? "1rem" : "0",
                      }}
                    >
                      <h2 className={styles.cardTitle}>Prescription</h2>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={includePrescription}
                          onChange={(e) =>
                            setIncludePrescription(e.target.checked)
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                    {includePrescription && (
                      <div className={styles.prescriptionWrapper}>
                        <PrescriptionFormComponent
                          hideFooter={true}
                          onDataChange={setPrescriptionData}
                        />
                      </div>
                    )}
                  </div>
                )}

                {planDetails?.therapy_plan?.therapy_sessions &&
                  planDetails.therapy_plan.therapy_sessions.filter(
                    (s) => s.status === "completed" && s.counselor_impression,
                  ).length > 0 && (
                    <div className={styles.card} style={{ marginBottom: 0 }}>
                      <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                          Past Counselor Impressions
                        </h2>
                      </div>
                      <div className={styles.pastImpressionsContainer}>
                        {planDetails.therapy_plan.therapy_sessions
                          .filter(
                            (s) =>
                              s.status === "completed" &&
                              s.counselor_impression,
                          )
                          .map((session, index) => (
                            <div key={index} className={styles.pastSessionBox}>
                              <div className={styles.pastSessionHeader}>
                                <span>Session {session.session_number}</span>
                                <span>
                                  {session.therepy_date ||
                                    session.date ||
                                    "N/A"}
                                </span>
                              </div>
                              <p className={styles.pastSessionImpression}>
                                {session.counselor_impression}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Reason for {actionType}</h2>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="reason" className={styles.label}>
                    Details <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={styles.textarea}
                    placeholder={`Why was this ${actionType.toLowerCase()}?`}
                    style={{ minHeight: "150px" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN: Session Details --- */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Appointment Info</h2>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="patientPhone" className={styles.label}>
                  Patient Phone
                </label>
                <input
                  id="patientPhone"
                  type="tel"
                  value={
                    contactLoading
                      ? "Loading..."
                      : patientPhone || "Not Provided"
                  }
                  readOnly
                  disabled
                  className={`${styles.input} ${styles.readOnly}`}
                  style={{
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div className={styles.rowGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="guardianPhone" className={styles.label}>
                    Guardian Phone 1
                  </label>
                  <input
                    id="guardianPhone"
                    type="tel"
                    value={
                      contactLoading
                        ? "Loading..."
                        : guardianPhone || "Not Provided"
                    }
                    readOnly
                    disabled
                    className={`${styles.input} ${styles.readOnly}`}
                    style={{
                      color: "#6b7280",
                      backgroundColor: "#f9fafb",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="guardianPhone2" className={styles.label}>
                    Guardian Phone 2
                  </label>
                  <input
                    id="guardianPhone2"
                    type="tel"
                    value={
                      contactLoading
                        ? "Loading..."
                        : guardianPhone2 || "Not Provided"
                    }
                    readOnly
                    disabled
                    className={`${styles.input} ${styles.readOnly}`}
                    style={{
                      color: "#6b7280",
                      backgroundColor: "#f9fafb",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="actionType" className={styles.label}>
                  Action Type <span className={styles.required}>*</span>
                </label>
                <select
                  id="actionType"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="completed">Completed</option>
                  <option value="No Show">No Show</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {actionType === "completed" && (
                <>
                  {/* Type of Meet Mandatory Toggle */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Type of Meet <span className={styles.required}>*</span>
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "1.5rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="typeOfMeet"
                          value="Phone Call"
                          checked={typeOfMeet === "Phone Call"}
                          onChange={(e) => setTypeOfMeet(e.target.value)}
                          style={{
                            accentColor: "#007b8e",
                            cursor: "pointer",
                            width: "16px",
                            height: "16px",
                          }}
                        />
                        Phone Call
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="typeOfMeet"
                          value="Home Visit"
                          checked={typeOfMeet === "Home Visit"}
                          onChange={(e) => setTypeOfMeet(e.target.value)}
                          style={{
                            accentColor: "#007b8e",
                            cursor: "pointer",
                            width: "16px",
                            height: "16px",
                          }}
                        />
                        Home Visit
                      </label>
                    </div>
                  </div>

                  <div className={styles.rowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Start Time</label>
                      <input
                        type="time"
                        value={sessionStartTime}
                        onChange={(e) => setSessionStartTime(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>End Time</label>
                      <input
                        type="time"
                        value={sessionEndTime}
                        onChange={(e) => setSessionEndTime(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label className={styles.label}>Duration</label>
                    <input
                      type="text"
                      value={sessionDuration}
                      readOnly
                      className={`${styles.input} ${styles.readOnly}`}
                      style={{
                        color: "#6b7280",
                        backgroundColor: "#f9fafb",
                        fontWeight: "600",
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* --- Clinical Observations Block --- */}
            {!isPhysiotherapy && (
              <div className={styles.card} style={{ marginBottom: 0 }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Clinical Observations</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Withdrawal Symptoms Observed (Multi-select)
                  </label>
                  <div className={styles.chipGroup}>
                    {SYMPTOM_OPTIONS.map((sym) => {
                      const isActive =
                        clinicalObservations.withdrawal_symptoms.includes(sym);
                      return (
                        <button
                          type="button"
                          key={sym}
                          className={`${styles.chip} ${isActive ? styles.chipActive : ""} ${sym === "none" && isActive ? styles.chipNone : ""}`}
                          onClick={() => toggleSymptom(sym)}
                        >
                          {formatLabel(sym)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Appetite</label>
                  {renderPillSelector(
                    APPETITE_OPTIONS,
                    clinicalObservations.appetite,
                    (v) => handleClinicalObservationChange("appetite", v),
                  )}
                </div>

                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>Physical Appearance</label>
                  {renderPillSelector(
                    APPEARANCE_OPTIONS,
                    clinicalObservations.physical_appearance,
                    (v) =>
                      handleClinicalObservationChange("physical_appearance", v),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.stickyFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Processing..." : `Confirm ${actionType}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarkCompleteAppointment;
