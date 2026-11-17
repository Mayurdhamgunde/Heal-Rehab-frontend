import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../css/bookAppointment.module.css";
import api from "../utils/central";
import LocationPicker from "../components/HospitalLocation";
import BulkSessionBooking from "./BulkSessionBooking";

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
}

interface TherapyPlan {
  _id: string;
  therapy_name: string;
}

interface TimeSlot {
  start: string;
  end: string;
  status: string;
  duration?: number;
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

interface BookAppointmentProps {
  // Add any props you need from your routing/context
}

const BookAppointment: React.FC<BookAppointmentProps> = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const calendarRef = useRef<HTMLDivElement>(null);

  // State management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("In Clinic");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Data states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [therapyPlans, setTherapyPlans] = useState<TherapyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TherapyPlan | null>(null);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [bookingType, setBookingType] = useState<"Single" | "Multiple">("Single");

  // Modal states
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showNoPlanPopup, setShowNoPlanPopup] = useState<boolean>(false);

  const appointmentTypes = ["In Clinic", "In Home", "IP/ICU", "Online"];
  const SLOT_DURATION_OPTIONS = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 Hour" },
    { value: 90, label: "1:30 Hour" },
    { value: 120, label: "2 Hour" },
  ];

  useEffect(() => {
    fetchDoctors();
    fetchTherapyPlans();
  }, []);

  useEffect(() => {
    if (therapyPlans.length > 0) {
      const latestPlan = therapyPlans[therapyPlans.length - 1];
      setSelectedPlan(latestPlan);
    }
  }, [therapyPlans]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      generateAvailableSlots();
    }
  }, [selectedDoctor, selectedDate, slotDuration]);

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  // Generate available slots based on the React Native logic
  const generateAvailableSlots = () => {
    if (!selectedDoctor) {
      setError("Please select a doctor first.");
      return;
    }

    setIsLoadingSlots(true);
    setError("");

    try {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selectedDateCopy = new Date(selectedDate);
      selectedDateCopy.setHours(0, 0, 0, 0);

      // Check if the selected date is today
      const isToday = selectedDateCopy.getTime() === today.getTime();

      // Working hours: 9 AM to 9 PM
      const workingHours = {
        start: { hour: 7, minute: 0 },
        end: { hour: 22, minute: 0 },
      };

      const slots: TimeSlot[] = [];
      const currentSlotDate = new Date(selectedDate);
      currentSlotDate.setHours(
        workingHours.start.hour,
        workingHours.start.minute,
        0,
        0,
      );

      const endTime = new Date(selectedDate);
      endTime.setHours(workingHours.end.hour, workingHours.end.minute, 0, 0);

      while (currentSlotDate < endTime) {
        const slotStart = new Date(currentSlotDate);
        const slotEnd = new Date(
          currentSlotDate.getTime() + slotDuration * 60000,
        );

        // Check if slot end time exceeds working hours
        if (slotEnd > endTime) break;

        // For today, only show future slots
        // For future days, show all slots
        if (!isToday || slotEnd > now) {
          const formatTime = (date: Date) => {
            return date.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            });
          };

          slots.push({
            start: formatTime(slotStart),
            end: formatTime(slotEnd),
            duration: slotDuration,
            status: "free",
          });
        }

        // Move to next slot - use 30 minute intervals for slots >= 60 minutes,
        // otherwise use the slot duration itself
        const increment = slotDuration >= 60 ? 30 : slotDuration;
        currentSlotDate.setTime(currentSlotDate.getTime() + increment * 60000);
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error generating slots:", error);
      setError("Failed to generate available slots");
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/getalldoctor");

      if (response.status === 200) {
        setDoctors(response.data.doctors || []);
      } else {
        throw new Error("Failed to fetch doctors");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError("Failed to fetch doctors");
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTherapyPlans = async () => {
    try {
      setError("");

      const response = await api.get(`/get/plans/${patientId}`);

      if (response.status === 200) {
        const plans = response.data.therapy_plans || [];
        setTherapyPlans(plans);

        if (plans.length === 0) {
          setShowNoPlanPopup(true);
        }
      } else {
        throw new Error("Failed to fetch therapy plans");
      }
    } catch (error) {
      console.error("Error fetching therapy plans:", error);
      setError("Failed to fetch therapy plans");
      setTherapyPlans([]);
    }
  };

  const handleBookAppointment = async () => {
    try {
      // Validation
      if (selectedSlot === null || selectedSlot === undefined) {
        setError("Please select a time slot");
        return;
      }
      if (!selectedDoctor) {
        setError("Please select a doctor for the appointment");
        return;
      }
      if (!selectedPlan) {
        setError("Please select a therapy plan for the appointment");
        return;
      }
      if (!selectedLocation) {
        setError("Please select a location for the appointment");
        return;
      }

      setIsBooking(true);
      setError("");

      const requestBody = {
        contactId: patientId,
        message: "Appointment booked successfully",
        type: appointmentType,
        autoStartRecording: true,
        sendSmsNotification: true,
        therepy_type: appointmentType,
        therepy_date: selectedDate.toISOString().split("T")[0],
        therepy_start_time: availableSlots[selectedSlot].start,
        therepy_end_time: availableSlots[selectedSlot].end,
        doctor_id: selectedDoctor._id,
        doctor_name: `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`,
        plan_id: selectedPlan._id,
        doctor_email: selectedDoctor.doctor_email,
        location_id: selectedLocation._id,
        location_name: selectedLocation.name,
        location_address: selectedLocation.addressLink,
      };

      const response = await api.post("/therepy/create", requestBody);

      if (response.status === 200 || response.status === 201) {
        setShowConfirmation(true);
        // Navigate back after showing success message.
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      } else {
        throw new Error("Failed to book appointment");
      }
    } catch (error) {
      console.error("Booking error:", error);
      setError("Failed to book appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const handleDateClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const generateCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    const currentDate = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDate);
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isPast = false;

        weekDays.push({
          date,
          day: date.getDate(),
          isCurrentMonth,
          isToday,
          isSelected,
          isPast,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      calendar.push(weekDays);
    }

    return calendar;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const getMonthYear = () => {
    return selectedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const isSlotDisabled = (slot: TimeSlot) => {
    const now = new Date();
    const slotDate = new Date(selectedDate);
    const [hours, minutes] = slot.start.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    return slotDate < now || slot.status === "occupied";
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

if (isLoading) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner}></div>
      <p className={styles.loadingText}>Loading appointment details...</p>
    </div>
  );
}

  return (
    <div className={styles.bookAppointment}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Book Session</h1>
        </header>

        <div className={styles.toggleWrapper}>
          <div className={styles.toggleContainer}>
            <button
              type="button"
              className={`${styles.toggleButton} ${bookingType === "Single" ? styles.activeToggle : ""}`}
              onClick={() => setBookingType("Single")}
            >
              Single Session
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${bookingType === "Multiple" ? styles.activeToggle : ""}`}
              onClick={() => setBookingType("Multiple")}
            >
              Multiple Sessions
            </button>
          </div>
        </div>

        {bookingType === "Multiple" ? (
          <BulkSessionBooking
            patientId={patientId || ""}
            doctors={doctors}
            therapyPlans={therapyPlans}
            selectedDoctor={selectedDoctor}
            setSelectedDoctor={setSelectedDoctor}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
        ) : (
        <div className={styles.formContainer}>
          {/* Doctor and Therapy Plan Selection in one row */}
          <div className={styles.formRow}>
            <div className={styles.formSection}>
              <label className={styles.sectionTitle}>Select Doctor</label>
              <select
                className={styles.formSelect}
                value={selectedDoctor?._id || ""}
                onChange={(e) => {
                  const doctor = doctors.find((d) => d._id === e.target.value);
                  setSelectedDoctor(doctor || null);
                  setAvailableSlots([]);
                  setSelectedSlot(null);
                }}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
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
                  const plan = therapyPlans.find(
                    (p) => p._id === e.target.value,
                  );
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

          {/* Appointment Type */}
          <div className={styles.formSection}>
            <label className={styles.sectionTitle}>Appointment Type</label>
            <div className={styles.appointmentTypes}>
              {appointmentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.typeButton} ${
                    appointmentType === type ? styles.selected : ""
                  }`}
                  onClick={() => setAppointmentType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Location Selection */}
          <div className={styles.formSection}>
            <label className={styles.sectionTitle}>Select Location</label>
            <LocationPicker
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              disabled={false}
              showSetAsDefault={true}
              autoSelectPreferred={true}
            />
          </div>

          {/* Date Selection and Slot Duration in one row */}
          <div className={styles.formRow}>
            <div className={styles.formSection}>
              <label className={styles.sectionTitle}>Select Date</label>
              <div className={styles.dateSelector}>
                <button
                  type="button"
                  className={styles.dateNavButton}
                  onClick={() => changeDate(-1)}
                >
                  ‹
                </button>
                <div className={styles.dateDisplay} ref={calendarRef}>
                  <button
                    type="button"
                    className={styles.dateText}
                    onClick={handleDateClick}
                  >
                    {formatDate(selectedDate)}
                  </button>
                  {showDatePicker && (
                    <div className={styles.calendarPopup}>
                      <div className={styles.calendarHeader}>
                        <button
                          type="button"
                          className={styles.monthNavButton}
                          onClick={() => navigateMonth(-1)}
                        >
                          ‹
                        </button>
                        <span className={styles.monthYear}>
                          {getMonthYear()}
                        </span>
                        <button
                          type="button"
                          className={styles.monthNavButton}
                          onClick={() => navigateMonth(1)}
                        >
                          ›
                        </button>
                      </div>
                      <div className={styles.calendarGrid}>
                        <div className={styles.weekDays}>
                          {[
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ].map((day) => (
                            <div key={day} className={styles.weekDay}>
                              {day}
                            </div>
                          ))}
                        </div>
                        {generateCalendar().map((week, weekIndex) => (
                          <div key={weekIndex} className={styles.calendarWeek}>
                            {week.map((dayObj, dayIndex) => (
                              <button
                                key={dayIndex}
                                type="button"
                                className={`${styles.calendarDay} ...`}
                                /* Remove the !dayObj.isPast check */
                                onClick={() => handleDateSelect(dayObj.date)}
                                /* Remove or set disabled to false */
                                disabled={false}
                              >
                                {dayObj.day}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.dateNavButton}
                  onClick={() => changeDate(1)}
                >
                  ›
                </button>
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.sectionTitle}>Slot Duration</label>
              <select
                className={styles.formSelect}
                value={slotDuration}
                onChange={(e) => {
                  setSlotDuration(Number(e.target.value));
                  setSelectedSlot(null); // Reset selected slot when duration changes
                }}
              >
                {SLOT_DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Slots */}
          <div className={styles.formSection}>
            <label className={styles.sectionTitle}>Available Slots</label>
            {!selectedDoctor ? (
              <p className={styles.infoText}>
                Please select a doctor to view available slots.
              </p>
            ) : isLoadingSlots ? (
              <div className={styles.loadingSlots}>
                <div className={`${styles.spinner} ${styles.small}`}></div>
                <span>Loading slots...</span>
              </div>
            ) : (
              <div className={styles.slotsContainer}>
                {availableSlots.length === 0 ? (
                  <p className={styles.infoText}>
                    No available slots for the selected date and time.
                  </p>
                ) : (
                  availableSlots
                    .filter((slot) => !isSlotDisabled(slot))
                    .map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`${styles.slotButton} ${
                          selectedSlot === index ? styles.selected : ""
                        }`}
                        onClick={() => setSelectedSlot(index)}
                      >
                        {slot.start} - {slot.end}
                      </button>
                    ))
                )}
              </div>
            )}
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Book Button */}
          <button
            type="button"
            className={`${styles.bookButton} ${
              isBooking ? styles.loading : ""
            }`}
            onClick={handleBookAppointment}
            disabled={
              isBooking ||
              selectedSlot === null ||
              !selectedDoctor ||
              !selectedPlan ||
              !selectedLocation
            }
          >
            {isBooking ? (
              <>
                <div className={`${styles.spinner} ${styles.small}`}></div>
                Booking...
              </>
            ) : (
              "Book Session"
            )}
          </button>
        </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>Session Booked Successfully!</h3>
                <div className={styles.appointmentDetails}>
                  <p>
                    <strong>Date:</strong> {formatDate(selectedDate)}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {selectedSlot !== null
                      ? `${availableSlots[selectedSlot]?.start} - ${availableSlots[selectedSlot]?.end}`
                      : ""}
                  </p>
                  <p>
                    <strong>Duration:</strong> {slotDuration} minutes
                  </p>
                  <p>
                    <strong>Type:</strong> {appointmentType}
                  </p>
                  <p>
                    <strong>Doctor:</strong>{" "}
                    {selectedDoctor
                      ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
                      : ""}
                  </p>
                  <p>
                    <strong>Plan:</strong>{" "}
                    {selectedPlan ? selectedPlan.therapy_name : ""}
                  </p>
                  <p>
                    <strong>Location:</strong>{" "}
                    {selectedLocation ? selectedLocation.name : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.modalButton}
                  onClick={() => setShowConfirmation(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Plan Modal */}
        {showNoPlanPopup && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>No Therapy Plan Found</h3>
                <p>
                  Please create a therapy plan before booking an appointment.
                </p>
                <div className={styles.modalButtons}>
                  <button
                    type="button"
                    className={`${styles.modalButton} ${styles.secondary}`}
                    onClick={() => setShowNoPlanPopup(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className={styles.modalButton}
                    onClick={() => navigate(`/createTherapy/${patientId}`)}
                  >
                    Create Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
