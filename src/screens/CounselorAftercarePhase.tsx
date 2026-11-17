import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaChartLine, FaClipboardList } from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/MarkCompleteAppointment.module.css";

// Utility to calculate: Today + 28 days -> Next Sunday
const calculateDefaultDate = () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 28);

  const dayOfWeek = targetDate.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  targetDate.setDate(targetDate.getDate() + daysUntilSunday);

  return targetDate.toISOString().split("T")[0];
};

const DOMAIN_OPTIONS = {
  alcohol_drug_free: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Continues to drink" },
    { value: 2, label: "2 = Substituting with drugs" },
    { value: 3, label: "3 = Severe relapses, sober" },
    { value: 4, label: "4 = Mild relapses, sober" },
    { value: 5, label: "5 = No relapse" },
  ],
  physical_well_being: [
    { value: 0, label: "0 = No news" },
    {
      value: 1,
      label:
        "1 = Persistent inability to function due to poor physical / psychological condition",
    },
    {
      value: 2,
      label: "2 = Unable to function most of the time due to poor condition",
    },
    { value: 3, label: "3 = Average health with transient problems" },
    {
      value: 4,
      label: "4 = Absent or minimal symptoms but functions well generally",
    },
    { value: 5, label: "5 = Superior functioning with no problems" },
  ],
  family_relationships: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Disowned by family" },
    { value: 2, label: "2 = By and large alienated from family" },
    { value: 3, label: "3 = Mixed or indifferent feelings" },
    { value: 4, label: "4 = Usually friendly, minor conflicts" },
    { value: 5, label: "5 = Highly supportive" },
  ],
  crime_free_status: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Arrest for illicit sale and production" },
    { value: 2, label: "2 = Arrest for violent behaviour" },
    { value: 3, label: "3 = Violent under intoxication (not arrested)" },
    { value: 4, label: "4 = Crime free" },
    { value: 5, label: "5 = Adopting higher values" },
  ],
  gainfully_employed: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Illegal employment" },
    { value: 2, label: "2 = Unemployed" },
    { value: 3, label: "3 = Irregular for work" },
    { value: 4, label: "4 = Mostly regular" },
    { value: 5, label: "5 = Regular for work and productive" },
  ],
  financial_stability: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Severe debts, difficult to repay" },
    { value: 2, label: "2 = Moderate level of debts, can be repaid" },
    { value: 3, label: "3 = No debts, no savings" },
    { value: 4, label: "4 = Average savings" },
    { value: 5, label: "5 = High level of savings" },
  ],
};

const CounselorAftercarePhase: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [appointment] = useState<any>(() => {
    if (state?.appointment) return state.appointment;
    if (state?.isNewFollowUp && state?.patientId) {
      return {
        _id: "new",
        patient_id: state.patientId,
        patient_name: "Follow-up Patient",
        therepy_date: new Date().toISOString().split("T")[0],
        therepy_type: "Follow-up",
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<
    "completed" | "No Show" | "Cancelled"
  >("completed");
  const [reason, setReason] = useState("");

  // Default is TRUE (Schedule next follow-up by default)
  const [scheduleNext, setScheduleNext] = useState<boolean>(true);
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string>(
    calculateDefaultDate(),
  );

  const [issuesAddressed, setIssuesAddressed] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [otherCommunication, setOtherCommunication] = useState("");

  const [recoveryScores, setRecoveryScores] = useState({
    alcohol_drug_free: 0,
    physical_well_being: 0,
    family_relationships: 0,
    crime_free_status: 0,
    gainfully_employed: 0,
    financial_stability: 0,
  });

  const totalScore = Object.values(recoveryScores).reduce(
    (sum, val) => sum + Number(val),
    0,
  );

  useEffect(() => {
    if (!appointment) navigate(-1);
  }, [appointment, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (actionType !== "completed") {
      if (!reason.trim()) return alert("Please provide a reason.");
      if (appointment._id === "new")
        return alert("Cannot mark a new session as cancelled/no show.");
      setLoading(true);
      try {
        await api.patch(`/mark/status/${appointment._id}`, {
          status: actionType,
          reason,
        });
        navigate(-1);
      } catch (error: any) {
        alert(error.response?.data?.error || "Operation failed");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (scheduleNext && !nextAppointmentDate) {
      return alert("Please select a date for the next follow-up.");
    }

    setLoading(true);
    try {
      const payload: any = {
        issues_addressed: issuesAddressed.trim(),
        recovery_status: recoveryStatus.trim(),
        other_communication: otherCommunication.trim(),
        recovery_domain_scores: recoveryScores,
        total_recovery_score: totalScore,
      };

      if (appointment._id === "new") {
        payload.patient_id = appointment.patient_id;
      }

      if (scheduleNext && nextAppointmentDate) {
        payload.next_appointment_date = nextAppointmentDate;
      } else {
        payload.remove_follow_up_date = true; // Tell backend to unset the date
      }

      await api.post(`/aftercare/councellarpart/${appointment._id}`, payload);
      alert("Counselor phase completed successfully");
      navigate(-1);
    } catch (error: any) {
      alert(
        error.response?.data?.error || "Failed to complete counselor phase",
      );
    } finally {
      setLoading(false);
    }
  };

  const getTodayString = () => new Date().toISOString().split("T")[0];

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
          Complete Counseling Phase
        </h1>
      </div>

      <div className={styles.contextBanner}>
        <div className={styles.patientSnapshotUnified}>
          <div className={styles.patientAvatar}>
            <span className={styles.avatarInitials}>
              {appointment.patient_name?.charAt(0).toUpperCase() || "P"}
            </span>
          </div>
          <div className={styles.patientInfo}>
            <div className={styles.patientName}>{appointment.patient_name}</div>
            <div className={styles.patientDate}>
              {new Date(appointment.therepy_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.mainGrid}>
          {/* LEFT: Clinical Documentation & Observations */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {actionType === "completed" ? (
              <>
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      <FaClipboardList color="var(--primary)" /> Counselor
                      Review
                    </h2>
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="issuesAddressed" className={styles.label}>
                      Issues addressed in counselling
                    </label>
                    <textarea
                      id="issuesAddressed"
                      value={issuesAddressed}
                      onChange={(e) => setIssuesAddressed(e.target.value)}
                      className={styles.textarea}
                      placeholder="Detail the issues covered..."
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="recoveryStatus" className={styles.label}>
                      Recovery status: abstinence and progress
                    </label>
                    <textarea
                      id="recoveryStatus"
                      value={recoveryStatus}
                      onChange={(e) => setRecoveryStatus(e.target.value)}
                      className={styles.textarea}
                      placeholder="Note abstinence status, relapse triggers, overall progress..."
                    />
                  </div>
                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label
                      htmlFor="otherCommunication"
                      className={styles.label}
                    >
                      Other communication: calls, letters, etc.
                    </label>
                    <textarea
                      id="otherCommunication"
                      value={otherCommunication}
                      onChange={(e) => setOtherCommunication(e.target.value)}
                      className={styles.textarea}
                      placeholder="Record any family calls, letters, or external contacts..."
                      style={{ minHeight: "60px" }}
                    />
                  </div>
                </div>

                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div
                    className={styles.cardHeader}
                    style={{
                      marginBottom: "1rem",
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "0.75rem",
                    }}
                  >
                    <h2 className={styles.cardTitle}>
                      <FaChartLine color="var(--primary)" /> Recovery Domain
                      Scores
                    </h2>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#007b8e",
                        fontSize: "1.1rem",
                      }}
                    >
                      Score: {totalScore} / 30
                    </span>
                  </div>

                  <div className={styles.rowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Alcohol / drug-free life
                      </label>
                      <select
                        value={recoveryScores.alcohol_drug_free}
                        onChange={(e) =>
                          setRecoveryScores((p) => ({
                            ...p,
                            alcohol_drug_free: Number(e.target.value),
                          }))
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.alcohol_drug_free.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Physical well-being
                      </label>
                      <select
                        value={recoveryScores.physical_well_being}
                        onChange={(e) =>
                          setRecoveryScores((p) => ({
                            ...p,
                            physical_well_being: Number(e.target.value),
                          }))
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.physical_well_being.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.rowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Healthy relationship with family
                      </label>
                      <select
                        value={recoveryScores.family_relationships}
                        onChange={(e) =>
                          setRecoveryScores((p) => ({
                            ...p,
                            family_relationships: Number(e.target.value),
                          }))
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.family_relationships.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Crime-free status</label>
                      <select
                        value={recoveryScores.crime_free_status}
                        onChange={(e) =>
                          setRecoveryScores((p) => ({
                            ...p,
                            crime_free_status: Number(e.target.value),
                          }))
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.crime_free_status.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                    <div
                      className={styles.inputGroup}
                      style={{ marginBottom: 0 }}
                    >
                      <label className={styles.label}>Gainfully employed</label>
                      <select
                        value={recoveryScores.gainfully_employed}
                        onChange={(e) =>
                          setRecoveryScores((p) => ({
                            ...p,
                            gainfully_employed: Number(e.target.value),
                          }))
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.gainfully_employed.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      className={styles.inputGroup}
                      style={{ marginBottom: 0 }}
                    >
                      <label className={styles.label}>
                        Financial stability
                      </label>
                      <select
                        value={recoveryScores.financial_stability}
                        onChange={(e) =>
                          setRecoveryScores((p) => ({
                            ...p,
                            financial_stability: Number(e.target.value),
                          }))
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.financial_stability.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
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
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Appointment Info & Scheduling */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Appointment Info</h2>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Action Type <span className={styles.required}>*</span>
                </label>
                <select
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
                  <div
                    className={styles.cardHeader}
                    style={{
                      marginBottom: scheduleNext ? "1rem" : "0",
                      paddingBottom: 0,
                    }}
                  >
                    <h2
                      className={styles.cardTitle}
                      style={{ fontSize: "0.95rem" }}
                    >
                      Schedule Next Follow-up?
                    </h2>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={scheduleNext}
                        onChange={(e) => setScheduleNext(e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  {scheduleNext ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        marginTop: "1rem",
                      }}
                    >
                      <div
                        className={styles.inputGroup}
                        style={{ marginBottom: 0 }}
                      >
                        <label className={styles.label}>
                          Next Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={nextAppointmentDate}
                          onChange={(e) =>
                            setNextAppointmentDate(e.target.value)
                          }
                          min={getTodayString()}
                          className={styles.input}
                        />
                      </div>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        marginTop: "0.5rem",
                      }}
                    >
                      Follow-up date will be removed for this patient.
                    </p>
                  )}
                </>
              )}
            </div>
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
            {loading ? "Processing..." : `Complete Counselor Phase`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CounselorAftercarePhase;
