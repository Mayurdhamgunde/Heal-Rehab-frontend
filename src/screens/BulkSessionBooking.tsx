import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/BulkSessionBooking.module.css";
import api from "../utils/central"; // Adjust path as needed
import LocationPicker from "../components/HospitalLocation"; // Adjust path as needed

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
}

interface TherapyPlan {
  _id: string;
  therapy_name: string;
  remaining_sessions?: number;
  therapy_sessions?: any[];
  start_date?: string;
  startDate?: string;
  createdAt?: string;
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

interface CustomSession {
  id: string;
  date: Date;
  start: string;
  end: string;
}

interface TimeSlot {
  start: string;
  end: string;
  status: string;
  duration?: number;
}

interface BulkSessionBookingProps {
  patientId: string;
  doctors: Doctor[];
  therapyPlans: TherapyPlan[];
  selectedDoctor: Doctor | null;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  selectedPlan: TherapyPlan | null;
  setSelectedPlan: (plan: TherapyPlan | null) => void;
}

const SLOT_DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 Hour" },
  { value: 90, label: "1:30 Hour" },
  { value: 120, label: "2 Hour" },
];

const BulkSessionBooking: React.FC<BulkSessionBookingProps> = ({
  patientId,
  doctors,
  therapyPlans,
  selectedDoctor,
  setSelectedDoctor,
  selectedPlan,
  setSelectedPlan,
}) => {
  const navigate = useNavigate();

  // --- STATE ---
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [sessionCountInput, setSessionCountInput] = useState<string>("");
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [customSessions, setCustomSessions] = useState<CustomSession[]>([]);

  const [defaultTimeSlot, setDefaultTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
 const [appointmentType] = useState<string>("In Clinic");
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [maxBookableSessions, setMaxBookableSessions] = useState<number>(0);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Modal State for Time Editing
  const [editingTimeSessionId, setEditingTimeSessionId] = useState<string | null>(null);
  const [showTimeEditModal, setShowTimeEditModal] = useState<boolean>(false);
  const [modalAvailableSlots, setModalAvailableSlots] = useState<TimeSlot[]>([]);

  // 1. Init Logic for Plan
  useEffect(() => {
    if (selectedPlan) {
      const remainingInPlan = selectedPlan.remaining_sessions || 0;
      const alreadyScheduledCount = selectedPlan.therapy_sessions
        ? selectedPlan.therapy_sessions.filter(
            (s: any) => s.status === "Scheduled"
          ).length
        : 0;
      const actualAvailable = Math.max(0, remainingInPlan - alreadyScheduledCount);

      setMaxBookableSessions(actualAvailable);

      if (actualAvailable > 0) {
        setSessionCountInput(actualAvailable.toString());
      }

      const rawStart =
        selectedPlan.start_date ||
        selectedPlan.startDate ||
        selectedPlan.createdAt;
      if (rawStart) {
        setStartDate(new Date(rawStart));
      }
    }
  }, [selectedPlan]);

  // Reset default time slot if duration changes
  useEffect(() => {
    setDefaultTimeSlot(null);
  }, [slotDuration]);

  // Generator Logic: trigger when start date, count, or default slot changes
  useEffect(() => {
    if (startDate && sessionCountInput && defaultTimeSlot) {
      const count = parseInt(sessionCountInput);
      if (!isNaN(count) && count > 0) {
        generateInitialList(count);
      }
    }
  }, [startDate, sessionCountInput, defaultTimeSlot]);

  // Update Available Slots for the Generator
  useEffect(() => {
    if (selectedDoctor && startDate) {
      setAvailableSlots(generateSlotsForDate(startDate, slotDuration));
    }
  }, [selectedDoctor, startDate, slotDuration]);

  // Helper: Format Date to YYYY-MM-DD for native date inputs
  const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  // Helper: Generate slots based on a given date and duration
  const generateSlotsForDate = (targetDate: Date, duration: number): TimeSlot[] => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetCopy = new Date(targetDate);
    targetCopy.setHours(0, 0, 0, 0);

    const isToday = targetCopy.getTime() === today.getTime();
    const workingHours = { start: { hour: 7, minute: 0 }, end: { hour: 22, minute: 0 } };
    const slots: TimeSlot[] = [];

    const currentSlotDate = new Date(targetDate);
    currentSlotDate.setHours(workingHours.start.hour, workingHours.start.minute, 0, 0);

    const endTime = new Date(targetDate);
    endTime.setHours(workingHours.end.hour, workingHours.end.minute, 0, 0);

    while (currentSlotDate < endTime) {
      const slotStart = new Date(currentSlotDate);
      const slotEnd = new Date(currentSlotDate.getTime() + duration * 60000);

      if (slotEnd > endTime) break;

      if (!isToday || slotEnd > now) {
        const formatTime = (date: Date) =>
          date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

        slots.push({
          start: formatTime(slotStart),
          end: formatTime(slotEnd),
          duration,
          status: "free",
        });
      }

      const increment = duration >= 60 ? 30 : duration;
      currentSlotDate.setTime(currentSlotDate.getTime() + increment * 60000);
    }
    return slots;
  };

  const generateInitialList = (count: number) => {
    if (!defaultTimeSlot) return;

    const newSessions: CustomSession[] = [];
    let current = new Date(startDate);

    for (let i = 0; i < count; i++) {
      newSessions.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date(current),
        start: defaultTimeSlot.start,
        end: defaultTimeSlot.end,
      });
      current.setDate(current.getDate() + 1);
    }
    setCustomSessions(newSessions);
  };

  // --- HANDLERS ---
  const handleAddExtraSession = () => {
    if (!defaultTimeSlot) {
      setError("Please select a default time slot first");
      return;
    }

    let newDate = new Date();
    if (customSessions.length > 0) {
      const lastSession = customSessions[customSessions.length - 1];
      newDate = new Date(lastSession.date);
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate = new Date(startDate);
    }

    const newSession: CustomSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: newDate,
      start: defaultTimeSlot.start,
      end: defaultTimeSlot.end,
    };

    setCustomSessions([...customSessions, newSession]);
  };

  const handleRemoveSession = (id: string) => {
    setCustomSessions(customSessions.filter((s) => s.id !== id));
  };

  const handleSessionDateChange = (id: string, dateStr: string) => {
    const newDate = new Date(dateStr);
    setCustomSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, date: newDate } : s))
    );
  };

  const openTimeEditModal = (session: CustomSession) => {
    if (!selectedDoctor) {
      setError("Please select a doctor to load available slots");
      return;
    }
    setEditingTimeSessionId(session.id);
    setModalAvailableSlots(generateSlotsForDate(session.date, slotDuration));
    setShowTimeEditModal(true);
  };

  const handleSessionTimeSlotSelect = (slot: TimeSlot) => {
    if (editingTimeSessionId) {
      setCustomSessions((prev) =>
        prev.map((s) =>
          s.id === editingTimeSessionId
            ? { ...s, start: slot.start, end: slot.end }
            : s
        )
      );
    }
    setShowTimeEditModal(false);
    setEditingTimeSessionId(null);
  };

  const handleBulkBook = async () => {
    try {
      if (!selectedDoctor) throw new Error("Please select a doctor");
      if (!selectedPlan) throw new Error("Please select a therapy plan");
      if (!selectedLocation) throw new Error("Please select a location");
      if (customSessions.length === 0) throw new Error("No sessions to book");

      setIsBooking(true);
      setError("");

      const payload = {
        contactId: patientId,
        plan_id: selectedPlan._id,
        doctor_id: selectedDoctor._id,
        doctor_name: `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`,
        therepy_type: appointmentType,
        location_id: selectedLocation._id,
        location_name: selectedLocation.name,
        sessions: customSessions.map((s) => ({
          therepy_date: toYYYYMMDD(s.date),
          therepy_start_time: s.start,
          therepy_end_time: s.end,
        })),
      };

      const response = await api.post("/therepy/bulk/create", payload);

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg(`${customSessions.length} sessions booked successfully!`);
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      } else {
        throw new Error("Failed to book sessions");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to book sessions. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
   <div className={styles.bulkContainer}>

      <div className={styles.formContainer}>
        {/* TOP CONTROLS */}
        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.sectionTitle}>Select Doctor</label>
            <select
              className={styles.formSelect}
              value={selectedDoctor?._id || ""}
              onChange={(e) => {
                const doctor = doctors.find((d) => d._id === e.target.value);
                setSelectedDoctor(doctor || null);
              }}
            >
              <option value="">Select a doctor</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.doctor_first_name} {doc.doctor_last_name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formSection}>
            <label className={styles.sectionTitle}>Select Therapy Plan</label>
            <select
              className={styles.formSelect}
              value={selectedPlan?._id || ""}
              onChange={(e) => {
                const plan = therapyPlans.find((p) => p._id === e.target.value);
                setSelectedPlan(plan || null);
              }}
            >
              <option value="">Select a therapy plan</option>
              {therapyPlans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.therapy_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.sectionTitle}>Select Location</label>
            <LocationPicker
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              disabled={false}
              showSetAsDefault={true}
              autoSelectPreferred={true}
            />
          </div>

          <div className={styles.formSection}>
            <label className={styles.sectionTitle}>Slot Duration</label>
            <select
              className={styles.formSelect}
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
            >
              {SLOT_DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* GENERATOR SETTINGS */}
        <div className={styles.formSection}>
          <label className={styles.sectionTitle}>Generator Settings</label>
          <div className={styles.generatorBox}>
            <div className={styles.generatorInputs}>
              <div className={styles.inputGroup}>
                <label>Number of Sessions</label>
                <input
                  type="number"
                  className={styles.nativeInput}
                  value={sessionCountInput}
                  onChange={(e) => setSessionCountInput(e.target.value)}
                  placeholder="Ex: 5"
                  min="1"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  className={styles.nativeInput}
                  value={toYYYYMMDD(startDate)}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              </div>
            </div>

            <label className={styles.label}>Select Default Time Slot</label>
            {!selectedDoctor ? (
              <p className={styles.infoText}>Select a doctor to view slots.</p>
            ) : availableSlots.length === 0 ? (
              <p className={styles.infoText}>No slots available for this date.</p>
            ) : (
              <div className={styles.slotsContainer}>
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.slotButton} ${
                      defaultTimeSlot?.start === slot.start ? styles.selected : ""
                    }`}
                    onClick={() => setDefaultTimeSlot(slot)}
                  >
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EDITABLE LIST OF SESSIONS */}
        {customSessions.length > 0 && (
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <label className={styles.sectionTitle}>
                Session List ({customSessions.length})
              </label>
              <button
                type="button"
                className={styles.clearAllBtn}
                onClick={() => setCustomSessions([])}
              >
                Clear All
              </button>
            </div>

            <div className={styles.sessionGrid}>
              {customSessions.map((item, index) => (
                <div key={item.id} className={styles.sessionCard}>
                  <div className={styles.sessionCardHeader}>
                    <span className={styles.sessionIndex}>Session {index + 1}</span>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveSession(item.id)}
                      title="Remove Session"
                    >
                      ×
                    </button>
                  </div>

                  <div className={styles.slotRow}>
                    <input
                      type="date"
                      className={`${styles.nativeInput} ${styles.flex1}`}
                      value={toYYYYMMDD(item.date)}
                      onChange={(e) => handleSessionDateChange(item.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className={`${styles.slotButton} ${styles.selected} ${styles.flex1}`}
                      onClick={() => openTimeEditModal(item)}
                    >
                      🕒 {item.start} - {item.end}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.addExtraButton}
              onClick={handleAddExtraSession}
            >
              + Add Extra Session
            </button>

            {customSessions.length > maxBookableSessions && maxBookableSessions > 0 && (
              <p className={styles.warningText}>
                Note: You are booking {customSessions.length - maxBookableSessions} more sessions than estimated in the plan.
              </p>
            )}
          </div>
        )}

        {/* ERROR & SUCCESS MESSAGES */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          className={`${styles.bookButton} ${isBooking ? styles.loading : ""}`}
          onClick={handleBulkBook}
          disabled={isBooking || customSessions.length === 0}
        >
          {isBooking ? (
            <>
              <div className={`${styles.spinner} ${styles.small}`}></div>
              Booking {customSessions.length} Sessions...
            </>
          ) : (
            `Confirm ${customSessions.length} Sessions`
          )}
        </button>
      </div>

      {/* TIME EDIT MODAL */}
      {showTimeEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>Change Time Slot</h3>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={() => setShowTimeEditModal(false)}
                >
                  Close
                </button>
              </div>
              <p className={styles.modalSub}>
                Select a new time for the selected session date.
              </p>

              <div className={styles.slotsContainer}>
                {modalAvailableSlots.length === 0 ? (
                  <p className={styles.infoText}>No slots available.</p>
                ) : (
                  modalAvailableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      className={styles.slotButton}
                      onClick={() => handleSessionTimeSlotSelect(slot)}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSessionBooking;