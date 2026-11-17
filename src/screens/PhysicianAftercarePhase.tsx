import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaStethoscope } from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/MarkCompleteAppointment.module.css";
import PrescriptionFormComponent from "../components/PrescriptionFormComponent";

// Utility to calculate: Today + 28 days -> Next Sunday
const calculateDefaultDate = () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 28);

  const dayOfWeek = targetDate.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  targetDate.setDate(targetDate.getDate() + daysUntilSunday);

  return targetDate.toISOString().split("T")[0];
};

const PhysicianAftercarePhase: React.FC = () => {
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
        therepy_start_time: new Date().toTimeString().slice(0, 5),
        therepy_end_time: new Date().toTimeString().slice(0, 5),
        therepy_type: "Follow-up",
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  const [actionType, setActionType] = useState<
    "completed" | "No Show" | "Cancelled"
  >("completed");
  const [sessionStartTime, setSessionStartTime] = useState<string>(
    appointment?.therepy_start_time || new Date().toTimeString().slice(0, 5),
  );
  const [sessionEndTime, setSessionEndTime] = useState<string>(
    appointment?.therepy_end_time || new Date().toTimeString().slice(0, 5),
  );
  const [sessionDuration, setSessionDuration] = useState("0m");
  const [reason, setReason] = useState("");

  // Clinical State
  const [patientComplaints, setPatientComplaints] = useState("");

  // Default is TRUE (Schedule next follow-up by default)
  const [scheduleNext, setScheduleNext] = useState<boolean>(true);
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string>(
    calculateDefaultDate(),
  );

  const [includePrescription, setIncludePrescription] = useState(true);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  useEffect(() => {
    if (!appointment) navigate(-1);
  }, [appointment, navigate]);

  useEffect(() => {
    if (!sessionStartTime || !sessionEndTime) return;
    const [startHours, startMinutes] = sessionStartTime.split(":").map(Number);
    const [endHours, endMinutes] = sessionEndTime.split(":").map(Number);
    const diffMinutes =
      endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

    if (diffMinutes <= 0) {
      setSessionDuration("0m");
      return;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    setSessionDuration(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
  }, [sessionStartTime, sessionEndTime]);

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
      const appointmentDate = appointment.therepy_date;
      const startDateTime = new Date(
        `${appointmentDate}T${sessionStartTime}:00`,
      );
      const endDateTime = new Date(`${appointmentDate}T${sessionEndTime}:00`);

      const payload: any = {
        session_start_time: startDateTime.toISOString(),
        session_end_time: endDateTime.toISOString(),
        patient_complaints: patientComplaints.trim(),
      };

      if (appointment._id === "new") {
        payload.patient_id = appointment.patient_id;
      }

      if (scheduleNext && nextAppointmentDate) {
        payload.next_appointment_date = nextAppointmentDate;
      } else {
        payload.remove_follow_up_date = true; // Tell backend to unset the date
      }

      if (
        includePrescription &&
        prescriptionData &&
        prescriptionData.medications?.length > 0
      ) {
        payload.prescription = {
          vitals: {
            weight: prescriptionData.weight || "",
            bp: prescriptionData.bp || "",
          },
          medications: prescriptionData.medications,
          notes: prescriptionData.notes || "",
          diagnosis: appointment.therepy_type || "Follow-up Therapy",
        };
      }

      await api.post(`/aftercare/medicalpart/${appointment._id}`, payload);
      alert("Medical phase completed successfully");
      navigate(-1);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to complete medical phase");
    } finally {
      setLoading(false);
    }
  };

  const getTodayString = () => new Date().toISOString().split("T")[0];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          Complete Medical Phase (Physician)
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
              {formatDate(appointment.therepy_date)}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.mainGrid}>
          {/* LEFT: Clinical Notes & Prescription */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {actionType === "completed" ? (
              <>
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      <FaStethoscope color="var(--primary)" /> Medical Review
                    </h2>
                  </div>
                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label htmlFor="patientComplaints" className={styles.label}>
                      Patient complaints / findings
                    </label>
                    <textarea
                      id="patientComplaints"
                      value={patientComplaints}
                      onChange={(e) => setPatientComplaints(e.target.value)}
                      className={styles.textarea}
                      placeholder="Note physical symptoms, patient concerns, and medical findings..."
                      style={{ minHeight: "100px" }}
                    />
                  </div>
                </div>

                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div
                    className={styles.cardHeader}
                    style={{ marginBottom: includePrescription ? "1rem" : "0" }}
                  >
                    <h2 className={styles.cardTitle}>Medical Prescription</h2>
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
                        isTemplateBuilder={false}
                        onDataChange={setPrescriptionData}
                        patientId={appointment.patient_id}
                        planId={appointment.plan_id}
                      />
                    </div>
                  )}
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

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Duration</label>
                    <input
                      type="text"
                      value={sessionDuration}
                      readOnly
                      className={`${styles.input} ${styles.readOnly}`}
                    />
                  </div>

                  {/* Schedule Next Follow-up Date Toggle */}
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
            {loading ? "Processing..." : `Complete Medical Phase`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PhysicianAftercarePhase;
