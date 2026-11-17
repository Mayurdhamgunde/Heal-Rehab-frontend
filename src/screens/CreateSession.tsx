import React, { useState, useEffect } from "react";
import styles from "../css/createTherapyPlan.module.css";
import api from "../utils/central";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import LocationPicker from "../components/HospitalLocation";
import SmartTextArea from "./Rehab/SmartareaText";

// -------------------------------------------------------------------
// Interfaces & Constants
// -------------------------------------------------------------------
interface SessionFormData {
  session_type: "Individual" | "Family";
  issue_dealt_with: string;
  counselor_impression: string;
  session_date: string;
  session_time: string;
  clinical_observations: {
    withdrawal_symptoms: string[];
    appetite: string | null;
    physical_appearance: string | null;
  };
  rehab_indicators: {
    craving_intensity: string | null;
    behavioural_compliance: string | null;
    emotional_stability: string | null;
    sleep_quality: string | null;
    session_impression: string | null;
  };
}

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
}

const SYMPTOM_OPTIONS = ["tremors", "sweating", "nausea", "insomnia", "none"];
const CRAVING_OPTIONS = ["none", "mild", "moderate", "strong", "overwhelming"];
const COMPLIANCE_OPTIONS = [
  "resistant",
  "passive",
  "cooperative",
  "engaged",
  "proactive",
];
const APPETITE_OPTIONS = ["poor", "fair", "normal", "good"];
const APPEARANCE_OPTIONS = [
  "dishevelled",
  "unkempt",
  "adequate",
  "well_groomed",
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

// Helper to format labels
const formatLabel = (val: string) =>
  val.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------
const CreateSession: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // ── Form State ────────────────────────────────────────────────────
  const [nextSessionNumber, setNextSessionNumber] = useState<number>(1);

  // Safely extract local Date and Time without UTC conversion issues
  const now = new Date();
  const localDateStr = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const localTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  const [formData, setFormData] = useState<SessionFormData>({
    session_type: "Individual",
    issue_dealt_with: "",
    counselor_impression: "",
    session_date: localDateStr,
    session_time: localTimeStr,
    clinical_observations: {
      withdrawal_symptoms: ["none"],
      appetite: null,
      physical_appearance: null,
    },
    rehab_indicators: {
      craving_intensity: null,
      behavioural_compliance: null,
      emotional_stability: null,
      sleep_quality: null,
      session_impression: null,
    },
  });

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<SessionFormData & { location: string }>
  >({});

  // ── Fetch Previous Sessions ───────────────────────────────────────
  useEffect(() => {
    const fetchPreviousSessions = async () => {
      try {
        const response = await api.get(`/all/sessions/${patientId}`);
        const existingSessions = response.data.sessions || [];
        const maxSession = existingSessions.reduce(
          (max: number, s: any) => Math.max(max, s.session_number || 0),
          0,
        );
        setNextSessionNumber(maxSession + 1);
      } catch (error) {
        console.error("Error fetching sessions to calculate sequence:", error);
      }
    };

    if (patientId) {
      fetchPreviousSessions();
    }
  }, [patientId]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SessionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSmartTextChange = (
    field: "issue_dealt_with" | "counselor_impression",
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: undefined }));
    }
  };

  const setRehabIndicator = (
    field: keyof SessionFormData["rehab_indicators"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      rehab_indicators: { ...prev.rehab_indicators, [field]: value },
    }));
  };

  const setClinicalObservation = (
    field: keyof SessionFormData["clinical_observations"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      clinical_observations: { ...prev.clinical_observations, [field]: value },
    }));
  };

  const toggleSymptom = (symptom: string) => {
    setFormData((prev) => {
      let currentSymptoms = [...prev.clinical_observations.withdrawal_symptoms];

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
        clinical_observations: {
          ...prev.clinical_observations,
          withdrawal_symptoms: currentSymptoms,
        },
      };
    });
  };

  // ── Validation ────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: Partial<SessionFormData & { location: string }> = {};

    if (!formData.issue_dealt_with.trim())
      newErrors.issue_dealt_with = "Please document the issues dealt with";

    if (!formData.counselor_impression.trim())
      newErrors.counselor_impression = "Counselor impression is required";

    if (!selectedLocation)
      newErrors.location = "Please select a facility location";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const payload = {
        contactId: patientId,
        session_number: nextSessionNumber,
        session_type: formData.session_type,
        issue_dealt_with: formData.issue_dealt_with,
        counselor_impression: formData.counselor_impression,
        location_id: selectedLocation?._id,
        location_name: selectedLocation?.name,
        location_address: selectedLocation?.addressLink,
        session_date: formData.session_date,
        session_time: formData.session_time,
        clinical_observations:
          formData.session_type === "Individual"
            ? formData.clinical_observations
            : null,
        rehab_indicators:
          formData.session_type === "Individual"
            ? formData.rehab_indicators
            : null,
      };

      const response = await api.post(`/create/session`, payload);

      if (response.status === 200 || response.status === 201) {
        alert("Session recorded successfully!");
        navigate(-1);
      }
    } catch (error: any) {
      console.error("Error recording session:", error);
      alert(
        error.response?.data?.msg ||
          error.response?.data?.error ||
          "Failed to record session.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render Helpers ────────────────────────────────────────────────
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
          className={`${styles.togglePill} ${
            currentValue === opt ? styles.togglePillActive : ""
          }`}
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
          className={`${styles.emojiBtn} ${
            currentValue === opt.value ? styles.emojiBtnActive : ""
          }`}
          onClick={() => onClick(opt.value)}
          title={opt.label}
        >
          <span className={styles.emojiIcon}>{opt.emoji}</span>
          <span className={styles.emojiLabel}>{opt.label}</span>
        </button>
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft
            size={16}
            style={{ cursor: "pointer", color: "#6b7280", marginRight: "5px" }}
            onClick={() => navigate(-1)}
          />
          Record Session Notes
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.mainGrid}>
          {/* ── LEFT COLUMN ──────────────────────────── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Clinical Notes */}
            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Clinical Notes</h2>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="issue_dealt_with" className={styles.label}>
                  Issue Dealt With <span className={styles.required}>*</span>
                </label>
                <SmartTextArea
                  id="issue_dealt_with"
                  value={formData.issue_dealt_with}
                  onChange={(val) =>
                    handleSmartTextChange("issue_dealt_with", val)
                  }
                  className={`${styles.textarea} ${
                    errors.issue_dealt_with ? styles.inputError : ""
                  }`}
                  placeholder="Describe the main topics and issues discussed during the session..."
                />
                {errors.issue_dealt_with && (
                  <span className={styles.errorText}>
                    {errors.issue_dealt_with}
                  </span>
                )}
              </div>

              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label htmlFor="counselor_impression" className={styles.label}>
                  Counselor Impression{" "}
                  <span className={styles.required}>*</span>
                </label>
                <SmartTextArea
                  id="counselor_impression"
                  value={formData.counselor_impression}
                  onChange={(val) =>
                    handleSmartTextChange("counselor_impression", val)
                  }
                  className={`${styles.textarea} ${
                    errors.counselor_impression ? styles.inputError : ""
                  }`}
                  placeholder="Document your clinical impressions, patient progress, and next steps..."
                />
                {errors.counselor_impression && (
                  <span className={styles.errorText}>
                    {errors.counselor_impression}
                  </span>
                )}
              </div>
            </div>

            {/* Rehabilitation Indicators - Conditional Rendering */}
            {formData.session_type === "Individual" && (
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
                    formData.rehab_indicators.craving_intensity,
                    (v) => setRehabIndicator("craving_intensity", v),
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Behavioural Compliance</label>
                  {renderPillSelector(
                    COMPLIANCE_OPTIONS,
                    formData.rehab_indicators.behavioural_compliance,
                    (v) => setRehabIndicator("behavioural_compliance", v),
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Emotional Stability</label>
                  {renderEmojiSelector(
                    EMOTIONAL_OPTIONS,
                    formData.rehab_indicators.emotional_stability,
                    (v) => setRehabIndicator("emotional_stability", v),
                  )}
                </div>

                <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Sleep Quality</label>
                    {renderEmojiSelector(
                      SLEEP_OPTIONS,
                      formData.rehab_indicators.sleep_quality,
                      (v) => setRehabIndicator("sleep_quality", v),
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Session Impression</label>
                    {renderEmojiSelector(
                      IMPRESSION_OPTIONS,
                      formData.rehab_indicators.session_impression,
                      (v) => setRehabIndicator("session_impression", v),
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Session Details ────────────────────────── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Session Info */}
            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Session Info</h2>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Facility Location <span className={styles.required}>*</span>
                </label>
                <LocationPicker
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                  disabled={false}
                  showSetAsDefault={true}
                  autoSelectPreferred={true}
                />
                {errors.location && (
                  <span className={styles.errorText}>{errors.location}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Session Type <span className={styles.required}>*</span>
                </label>
                {renderPillSelector(
                  ["Individual", "Family"],
                  formData.session_type,
                  (v) =>
                    setFormData((prev) => ({
                      ...prev,
                      session_type: v as any,
                    })),
                )}
              </div>

              <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="session_date" className={styles.label}>
                    Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="session_date"
                    name="session_date"
                    value={formData.session_date}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="session_time" className={styles.label}>
                    Time <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="time"
                    id="session_time"
                    name="session_time"
                    value={formData.session_time}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Clinical Observations - Conditional Rendering */}
            {formData.session_type === "Individual" && (
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
                        formData.clinical_observations.withdrawal_symptoms.includes(
                          sym,
                        );
                      return (
                        <button
                          type="button"
                          key={sym}
                          className={`${styles.chip} ${
                            isActive ? styles.chipActive : ""
                          } ${sym === "none" && isActive ? styles.chipNone : ""}`}
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
                    formData.clinical_observations.appetite,
                    (v) => setClinicalObservation("appetite", v),
                  )}
                </div>

                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>Physical Appearance</label>
                  {renderPillSelector(
                    APPEARANCE_OPTIONS,
                    formData.clinical_observations.physical_appearance,
                    (v) => setClinicalObservation("physical_appearance", v),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky Footer ─────────────────────────────────────────── */}
        <div className={styles.stickyFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Saving..." : "Save Session"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSession;
