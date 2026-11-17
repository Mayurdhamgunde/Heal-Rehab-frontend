import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from '../css/EditTherapy.module.css';
import api from '../utils/central';

interface Therapy {
  _id: string;
  plan_id: string;
  patient_id: string;
  therepy_id: string;
  therepy_type: string;
  therepy_remarks: string;
  therepy_link: string;
  therepy_date: string;
  therepy_start_time: string;
  therepy_end_time?: string;
  status?: string;
  therepy_cost?: string;
  doctor_id: string;
  doctor_name?: string;
}

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

interface TimeSlot {
  start: string;
  end: string;
  status: string;
  duration: number;
}

interface ExistingAppointment {
  _id: string;
  therepy_start_time: string;
  therepy_end_time: string;
}

interface EditTherapyProps {
  therapy: Therapy;
  onUpdate: (updatedTherapy: Therapy) => Promise<void>;
  onCancel: () => void;
}

const SLOT_DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 Hour' },
  { value: 90, label: '1:30 Hour' },
  { value: 120, label: '2 Hour' },
];

const EditTherapy: React.FC<EditTherapyProps> = ({
  therapy,
  onUpdate,
  onCancel,
}) => {
  const [editedTherapy, setEditedTherapy] = useState<Therapy>({ ...therapy });
  const [selectedDate, setSelectedDate] = useState(new Date(therapy.therepy_date));
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState(therapy.therepy_type);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const appointmentTypes = ['In Clinic', 'In Home', 'IP/ICU', 'Online'];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      generateAvailableSlots();
    }
  }, [selectedDoctor, selectedDate, slotDuration]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/getalldoctor');
      setDoctors(response.data.doctors);
      
      // Set default doctor if available
      if (response.data.doctors.length > 0 && therapy.doctor_id) {
        const defaultDoctor = response.data.doctors.find(
          (doctor: Doctor) => doctor._id === therapy.doctor_id,
        );
        if (defaultDoctor) {
          setSelectedDoctor(defaultDoctor);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingAppointments = async (doctorId: string, date: string): Promise<ExistingAppointment[]> => {
    try {
      const response = await api.get(`/therepy/doctor/${doctorId}/date/${date}`);
      return response.data.appointments || [];
    } catch (error) {
      console.error('Error fetching existing appointments:', error);
      return [];
    }
  };

  const generateAvailableSlots = async () => {
    if (!selectedDoctor) {
      setError('Please select a doctor first.');
      return;
    }

    setIsLoadingSlots(true);
    setError('');

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Fetch existing appointments for the doctor on this date
      const existingAppointments = await fetchExistingAppointments(
        selectedDoctor._id,
        dateString
      );

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
        0
      );

      const endTime = new Date(selectedDate);
      endTime.setHours(workingHours.end.hour, workingHours.end.minute, 0, 0);

      // Determine if we should allow half-hour offsets
      const allowHalfHourOffsets = slotDuration >= 60;
      const increment = allowHalfHourOffsets ? 30 : slotDuration;

      while (currentSlotDate < endTime) {
        const slotStart = new Date(currentSlotDate);
        const slotEnd = new Date(
          currentSlotDate.getTime() + slotDuration * 60000
        );

        // Check if slot end time exceeds working hours
        if (slotEnd > endTime) break;

        const formatTime = (date: Date) => {
          return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          });
        };

        const slotStartTime = formatTime(slotStart);
        const slotEndTime = formatTime(slotEnd);

        // Check if this slot overlaps with any existing appointment
        let isOccupied = false;
    for (const appointment of existingAppointments) {
  // FIX: Skip the current therapy being edited so its slot shows as "free"
  // Compare the unique IDs to ignore the current record
  if (appointment._id === therapy._id) continue;

  const appointmentStart = appointment.therepy_start_time;
  const appointmentEnd = appointment.therepy_end_time;

  if (
    (slotStartTime >= appointmentStart && slotStartTime < appointmentEnd) ||
    (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
    (slotStartTime <= appointmentStart && slotEndTime >= appointmentEnd)
  ) {
    isOccupied = true;
    break;
  }
}

        slots.push({
          start: slotStartTime,
          end: slotEndTime,
          duration: slotDuration,
          status: isOccupied ? 'occupied' : 'free',
        });

        // Move to next slot
        currentSlotDate.setTime(currentSlotDate.getTime() + increment * 60000);
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error generating slots:', error);
      setError('Failed to generate available slots');
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
    setEditedTherapy(prev => ({
      ...prev,
      therepy_date: event.target.value,
    }));
    setSelectedSlot(null);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setEditedTherapy(prev => ({
      ...prev,
      therepy_date: newDate.toISOString().split('T')[0],
    }));
    setSelectedSlot(null);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isSlotDisabled = (slot: TimeSlot) => {
    // const now = new Date();
    // const slotDate = new Date(selectedDate);
    // const [hours, minutes] = slot.start.split(':').map(Number);
    // slotDate.setHours(hours, minutes, 0, 0);

   return slot.status === 'occupied';
  };

  const handleUpdateTherapy = async () => {
    if (!selectedSlot && !editedTherapy.therepy_start_time) {
      setError('Please select a time slot for the appointment.');
      return;
    }

    setIsUpdating(true);
    try {
      const updatedTherapyData = {
        ...editedTherapy,
        therepy_type: appointmentType,
        therepy_date: selectedDate.toISOString().split('T')[0],
        therepy_start_time:
          selectedSlot !== null && availableSlots.length > 0
            ? availableSlots[selectedSlot].start
            : editedTherapy.therepy_start_time,
        therepy_end_time:
          selectedSlot !== null && availableSlots.length > 0
            ? availableSlots[selectedSlot].end
            : editedTherapy.therepy_end_time,
        doctor_id: selectedDoctor?._id,
        doctor_name: selectedDoctor
          ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
          : '',
      };

      await onUpdate(updatedTherapyData as Therapy);
      onCancel();
    } catch (error) {
      console.error('Error updating therapy:', error);
      setError('Failed to update appointment');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Appointment</h2>
          <button className={styles.closeButton} onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Doctor Selection */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Doctor</label>
            <select
              className={styles.select}
              value={selectedDoctor?._id || ''}
              onChange={(e) => {
                const doctor = doctors.find(d => d._id === e.target.value);
                setSelectedDoctor(doctor || null);
                setAvailableSlots([]);
                setSelectedSlot(null);
              }}
            >
              <option value="">Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  {`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
                </option>
              ))}
            </select>
          </div>

          {/* Appointment Type */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Type of Appointment</label>
            <div className={styles.appointmentTypes}>
              {appointmentTypes.map(type => (
                <button
                  key={type}
                  className={`${styles.typeButton} ${
                    appointmentType === type ? styles.selectedType : ''
                  }`}
                  onClick={() => setAppointmentType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Appointment Date</label>
            <div className={styles.dateSelector}>
              <button
                className={styles.dateArrow}
                onClick={() => changeDate(-1)}
              >
                <FaChevronLeft />
              </button>
              <div className={styles.datePicker}>
                <FaCalendarAlt className={styles.calendarIcon} />
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  className={styles.dateInput}
                />
                <span className={styles.dateText}>
                  {formatDate(selectedDate)}
                </span>
              </div>
              <button
                className={styles.dateArrow}
                onClick={() => changeDate(1)}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          {/* Slot Duration */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Duration</label>
            <select
              className={styles.select}
              value={slotDuration}
              onChange={(e) => {
                setSlotDuration(Number(e.target.value));
                setSelectedSlot(null);
              }}
            >
              {SLOT_DURATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Available Slots */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Available Time Slots</label>
            {!selectedDoctor ? (
              <p className={styles.infoText}>
                Select a doctor to view available slots
              </p>
            ) : isLoadingSlots ? (
              <div className={styles.loadingSlots}>
                <div className={styles.spinner}></div>
                <p>Loading slots...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <p className={styles.infoText}>
                No available slots for the selected date
              </p>
            ) : (
              <div className={styles.slotsGrid}>
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    className={`${styles.slotButton} ${
                      isSlotDisabled(slot) ? styles.slotDisabled : ''
                    } ${selectedSlot === index ? styles.slotSelected : ''}`}
                    onClick={() => setSelectedSlot(index)}
                    disabled={isSlotDisabled(slot)}
                  >
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`${styles.updateButton} ${
              isUpdating ? styles.disabled : ''
            }`}
            onClick={handleUpdateTherapy}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTherapy;