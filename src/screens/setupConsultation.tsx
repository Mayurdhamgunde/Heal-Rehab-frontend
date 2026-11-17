import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {  FaCalendarAlt,  } from "react-icons/fa";
import api from "../utils/central"; // Ensure this path matches your project
import styles from "../css/SetupConsultationScreen.module.css";
import LocationPicker from "../components/HospitalLocation"; // Ensure this component exists
import moment from "moment-timezone";
import AvailableSlots from "./AvailableSlots"; // Ensure this component exists

// --- Interfaces ---
interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
}

interface TherapyPlan {
  _id: string;
  [key: string]: any;
}

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string;
  address?: string;
  createdAt: string;  // Add this
  updatedAt: string; 
}

interface Slot {
  start: string;
  end: string;
  duration: number;
  status: string;
}


const SLOT_DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 Hour" },
  { value: 90, label: "1:30 Hour" },
  { value: 120, label: "2 Hour" },
];

const BookConsultation: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // State
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("In Clinic");
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [therapyPlans, setTherapyPlans] = useState<TherapyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TherapyPlan | null>(null);
  const [selectedSlotDuration, setSelectedSlotDuration] = useState(30);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // UI Toggles
  const [showSlotDurationPicker, setShowSlotDurationPicker] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  
  // Form Fields
  const [patientSymptoms, setPatientSymptoms] = useState<string>("");
  const [therapyReason, setTherapyReason] = useState<string>("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const appointmentTypes = ["In Clinic", "In Home", "IP/ICU", "Online"];
  const doctorListRef = useRef<HTMLDivElement>(null);

  // --- Initial Data Fetching ---
  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([fetchDoctors(), fetchTherapyPlans()]);
      } catch (err) {
        console.error("Initialization error", err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (therapyPlans.length > 0) {
      setSelectedPlan(therapyPlans[therapyPlans.length - 1]);
    }
  }, [therapyPlans]);

  // --- API Functions ---
  const fetchDoctors = async () => {
    try {
      const response = await api.get("/getalldoctor");
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  const fetchTherapyPlans = async () => {
    if (!patientId) return;
    try {
      const response = await api.get(`/get/plans/${patientId}`);
      setTherapyPlans(response.data.therapy_plans || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setTherapyPlans([]);
    }
  };

  // --- Logic Helpers ---
  const generateAvailableSlots = (duration: number = 30, date?: Date): Slot[] => {
    const now = moment();
    const targetDate = moment(date || new Date());
    const isToday = targetDate.isSame(now, 'day');

    const workingHours = {
      start: targetDate.clone().hour(9).minute(0),
      end: targetDate.clone().hour(21).minute(0),
    };

    const slots: Slot[] = [];
    let current = workingHours.start;

    while (current.isBefore(workingHours.end)) {
      const slotEnd = current.clone().add(duration, "minutes");
      if (slotEnd.isAfter(workingHours.end)) break;

      if (!isToday || slotEnd.isAfter(now)) {
        slots.push({
          start: current.format("HH:mm"),
          end: slotEnd.format("HH:mm"),
          duration: duration,
          status: "free",
        });
      }
      // Increment logic: if slot >= 60, step by 30 mins to allow overlap options
      const step = duration >= 60 ? 30 : duration;
      current.add(step, "minutes");
    }
    return slots;
  };

  // --- Handlers ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const handleDateNav = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const handleBook = async () => {
    try {
      setError(null);
      if (!selectedDoctor) throw new Error("Please select a doctor.");
      if (!selectedLocation) throw new Error("Please select a location.");
      if (selectedSlot === null) throw new Error("Please select a time slot.");

      setIsBooking(true);

      const slots = availableSlots.length > 0 
        ? availableSlots 
        : generateAvailableSlots(selectedSlotDuration, selectedDate);
        
      if (!slots[selectedSlot]) throw new Error("Invalid slot selected.");

      const requestBody = {
        contactId: patientId,
        therepy_type: appointmentType,
        therepy_date: selectedDate.toISOString().split("T")[0],
        therepy_start_time: slots[selectedSlot].start,
        therepy_end_time: slots[selectedSlot].end,
        doctor_id: selectedDoctor._id,
        doctor_name: `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`,
        doctor_email: selectedDoctor.doctor_email,
        plan_id: selectedPlan?._id,
        location_id: selectedLocation._id,
        location_name: selectedLocation.name,
        location_address: selectedLocation.address || selectedLocation.addressLink,
        patientSymptoms: patientSymptoms.trim(),
        therapy_reason: therapyReason.trim(),
      };

      const response = await api.post(`/patient/${patientId}/consultations`, requestBody);

      if (response.status === 200 || response.status === 201) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          navigate(-1); // Go back after success
        }, 2000);
      } else {
        throw new Error("Failed to book consultation.");
      }
    } catch (err: any) {
      setError(err.message || "Booking failed");
    } finally {
      setIsBooking(false);
    }
  };

 if (isLoading) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner}></div>
      <p className={styles.loadingText}>Loading consultation details...</p>
    </div>
  );
}

  // --- Render Helpers ---
  const renderPickerField = (value: string | undefined, onClick: () => void, placeholder: string) => (
    <div className={styles.pickerField} onClick={onClick}>
      <span className={value ? styles.pickerValue : styles.pickerPlaceholder}>
        {value || placeholder}
      </span>
      <span className={styles.dropdownIcon}>▼</span>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Book Consultation</h1>
      </header>

      <div className={styles.contentWrapper}>
        <div className={styles.formCard}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* Doctor Selection */}
          <section className={styles.formSection}>
            <label className={styles.sectionLabel}>Select Doctor</label>
            {renderPickerField(
              selectedDoctor ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}` : undefined,
              () => setShowDoctorPicker(true),
              "Choose a doctor"
            )}
            
            {/* Doctor Picker Modal/Dropdown */}
            {showDoctorPicker && (
              <div className={styles.pickerOverlay} onClick={() => setShowDoctorPicker(false)}>
                <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.pickerHeader}>
                    <h3>Select Doctor</h3>
                    <button onClick={() => setShowDoctorPicker(false)}>Done</button>
                  </div>
                  <div className={styles.doctorList} ref={doctorListRef}>
                    {doctors.map(doc => (
                      <div 
                        key={doc._id} 
                        className={`${styles.listItem} ${selectedDoctor?._id === doc._id ? styles.selected : ''}`}
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setShowDoctorPicker(false);
                          setAvailableSlots([]);
                          setSelectedSlot(null);
                        }}
                      >
                        {doc.doctor_first_name} {doc.doctor_last_name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Consultation Type */}
          <section className={styles.formSection}>
            <label className={styles.sectionLabel}>Consultation Type</label>
            <div className={styles.typeGrid}>
              {appointmentTypes.map(type => (
                <button
                  key={type}
                  className={`${styles.typeButton} ${appointmentType === type ? styles.activeType : ''}`}
                  onClick={() => setAppointmentType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          {/* Location */}
          <section className={styles.formSection}>
            <label className={styles.sectionLabel}>Location</label>
            <LocationPicker
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              disabled={false}
              showSetAsDefault={true}
              autoSelectPreferred={true}
            />
          </section>

          {/* Date Selection */}
          <section className={styles.formSection}>
            <label className={styles.sectionLabel}>Date</label>
            <div className={styles.dateControl}>
              <button onClick={() => handleDateNav(-1)}>‹</button>
              <div className={styles.dateDisplay}>
                <FaCalendarAlt className={styles.calendarIcon}/>
                <input 
                  type="date" 
                  value={selectedDate.toISOString().split('T')[0]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={handleDateChange}
                />
                <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <button onClick={() => handleDateNav(1)}>›</button>
            </div>
          </section>

          {/* Slot Duration */}
          <section className={styles.formSection}>
            <label className={styles.sectionLabel}>Duration</label>
            {renderPickerField(
              `${selectedSlotDuration} Minutes`,
              () => setShowSlotDurationPicker(true),
              "Select duration"
            )}
            
            {showSlotDurationPicker && (
              <div className={styles.pickerOverlay} onClick={() => setShowSlotDurationPicker(false)}>
                <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.pickerHeader}>
                    <h3>Duration</h3>
                    <button onClick={() => setShowSlotDurationPicker(false)}>Done</button>
                  </div>
                  <div className={styles.listContainer}>
                    {SLOT_DURATION_OPTIONS.map(opt => (
                      <div 
                        key={opt.value}
                        className={`${styles.listItem} ${selectedSlotDuration === opt.value ? styles.selected : ''}`}
                        onClick={() => {
                          setSelectedSlotDuration(opt.value);
                          setShowSlotDurationPicker(false);
                          setSelectedSlot(null);
                          setAvailableSlots([]);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Slots */}
          <section className={styles.formSection}>
            <label className={styles.sectionLabel}>Available Slots</label>
            <div className={styles.slotsWrapper}>
              <AvailableSlots
                slotDuration={selectedSlotDuration}
                selectedDate={selectedDate}
                onSelectSlot={(idx) => {
                  setSelectedSlot(idx);
                  if (availableSlots.length === 0) {
                     setAvailableSlots(generateAvailableSlots(selectedSlotDuration, selectedDate));
                  }
                }}
              />
            </div>
          </section>

          {/* Details */}
          <div className={styles.row}>
            <section className={styles.formSection}>
              <label className={styles.sectionLabel}>Symptoms (Optional)</label>
              <textarea 
                className={styles.textArea}
                placeholder="Describe patient symptoms..."
                value={patientSymptoms}
                onChange={(e) => setPatientSymptoms(e.target.value)}
              />
            </section>
            <section className={styles.formSection}>
              <label className={styles.sectionLabel}>Reason (Optional)</label>
              <textarea 
                className={styles.textArea}
                placeholder="Reason for consultation..."
                value={therapyReason}
                onChange={(e) => setTherapyReason(e.target.value)}
              />
            </section>
          </div>

          {/* Action Button */}
          <div className={styles.footer}>
            <button 
              className={styles.submitButton}
              onClick={handleBook}
              disabled={isBooking}
            >
              {isBooking ? <span className={styles.btnSpinner}></span> : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✅</div>
            <h2>Consultation Booked!</h2>
            <p>Your appointment has been successfully scheduled.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookConsultation;