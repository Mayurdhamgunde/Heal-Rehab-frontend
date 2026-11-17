import React, { useState, useEffect } from "react";
import { X, Trash2, Plus, Loader2 } from "lucide-react";
import api from "../utils/central";
import styles from "../css/EditLocationModal.module.css";

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AssignedLocation {
  location_id: string;
  location_name: string;
  working_hours: WorkingHours;
  has_fixed_schedule: boolean;
  schedule_notes: string;
  assigned_at: string;
  is_active: boolean;
  _id?: string;
}

interface Location {
  locationId: string;
  name: string;
  address?: string;
}

interface EditLocationModalProps {
  visible: boolean;
  location: AssignedLocation | null;
  onClose: () => void;
  onSave: (location: AssignedLocation) => void;
  isEdit: boolean;
  assignedLocations: AssignedLocation[];
  session: { idToken: string };
}

const initialDaySchedule: DaySchedule = {
  enabled: false,
  slots: [],
};

const initialWorkingHours: WorkingHours = {
  monday: { ...initialDaySchedule },
  tuesday: { ...initialDaySchedule },
  wednesday: { ...initialDaySchedule },
  thursday: { ...initialDaySchedule },
  friday: { ...initialDaySchedule },
  saturday: { ...initialDaySchedule },
  sunday: { ...initialDaySchedule },
};

const EditLocationModal: React.FC<EditLocationModalProps> = ({
  visible,
  location,
  onClose,
  onSave,
  isEdit,
  assignedLocations,
  session,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<AssignedLocation>({
    location_id: '',
    location_name: '',
    working_hours: initialWorkingHours,
    has_fixed_schedule: true,
    schedule_notes: '',
    assigned_at: new Date().toISOString(),
    is_active: true,
  });

  useEffect(() => {
    if (visible) {
      fetchLocations();
      if (location) {
        setCurrentLocation(location);
      } else {
        setCurrentLocation({
          location_id: '',
          location_name: '',
          working_hours: initialWorkingHours,
          has_fixed_schedule: true,
          schedule_notes: '',
          assigned_at: new Date().toISOString(),
          is_active: true,
        });
      }
    }
  }, [visible, location]);

  useEffect(() => {
    if (locations.length > 0) {
      const assignedIds = assignedLocations.map(loc => loc.location_id);
      let excludeIds = assignedIds;
      if (isEdit && location) {
        excludeIds = assignedIds.filter(id => id !== location.location_id);
      }
      const filtered = locations.filter(loc => !excludeIds.includes(loc.locationId));
      setFilteredLocations(filtered);
    }
  }, [locations, assignedLocations, isEdit, location]);

  const fetchLocations = async () => {
    if (!session.idToken) return;
    
    setIsLoadingLocations(true);
    try {
      const response = await api.get('/get/orgLocations', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    const selectedLoc = filteredLocations.find(loc => loc.locationId === locationId);
    if (selectedLoc) {
      setCurrentLocation(prev => ({
        ...prev,
        location_id: selectedLoc.locationId,
        location_name: selectedLoc.name,
      }));
    } else if (locationId === '') {
      setCurrentLocation(prev => ({
        ...prev,
        location_id: '',
        location_name: '',
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          enabled: !prev.working_hours[day as keyof WorkingHours].enabled,
        },
      },
    }));
  };

  const handleAddTimeSlot = (day: string) => {
    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          slots: [
            ...prev.working_hours[day as keyof WorkingHours].slots,
            { start: '09:00', end: '17:00' },
          ],
        },
      },
    }));
  };

  const handleRemoveTimeSlot = (day: string, slotIndex: number) => {
    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          slots: prev.working_hours[day as keyof WorkingHours].slots.filter(
            (_, i) => i !== slotIndex,
          ),
        },
      },
    }));
  };

  const handleTimeChange = (
    day: string,
    slotIndex: number,
    type: 'start' | 'end',
    value: string,
  ) => {
    const updatedSlots = [
      ...currentLocation.working_hours[day as keyof WorkingHours].slots,
    ];
    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      [type]: value,
    };

    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          slots: updatedSlots,
        },
      },
    }));
  };

  const handleSave = () => {
    if (!currentLocation.location_name.trim()) {
      alert('Please select a location');
      return;
    }

    onSave(currentLocation);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEdit ? 'Edit Location' : 'Add Location'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Location Dropdown */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              Location <span className={styles.requiredStar}>*</span>
            </label>
            {isLoadingLocations ? (
              <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={16} />
                <span className={styles.loadingText}>Loading locations...</span>
              </div>
            ) : (
              <select
                className={styles.select}
                value={currentLocation.location_id}
                onChange={e => handleLocationSelect(e.target.value)}
                disabled={isEdit}
              >
                <option value="">Select a location</option>
                {filteredLocations.map(loc => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Schedule Notes */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Schedule Notes</label>
            <textarea
              className={styles.textArea}
              value={currentLocation.schedule_notes}
              onChange={e =>
                setCurrentLocation(prev => ({
                  ...prev,
                  schedule_notes: e.target.value,
                }))
              }
              placeholder="Add any schedule notes"
              rows={3}
            />
          </div>

          {/* Active Toggle */}
          <div className={styles.switchContainer}>
            <label className={styles.label} style={{ margin: 0 }}>Active Status</label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={currentLocation.is_active}
                onChange={e =>
                  setCurrentLocation(prev => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          {/* Working Hours Section */}
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Working Hours</h3>
            <p className={styles.sectionSubtitle}>
              Configure weekly schedule for this location
            </p>
          </div>

          {/* Weekdays */}
          <div className={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className={styles.dayContainer}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayName}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={
                        currentLocation.working_hours[day as keyof WorkingHours]
                          .enabled
                      }
                      onChange={() => handleDayToggle(day)}
                      className={styles.toggleInput}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                {currentLocation.working_hours[day as keyof WorkingHours]
                  .enabled && (
                  <div className={styles.slotsContainer}>
                    {currentLocation.working_hours[
                      day as keyof WorkingHours
                    ].slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className={styles.timeSlotContainer}>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={slot.start}
                          onChange={e =>
                            handleTimeChange(day, slotIndex, 'start', e.target.value)
                          }
                        />
                        <span className={styles.timeSeparator}>to</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={slot.end}
                          onChange={e =>
                            handleTimeChange(day, slotIndex, 'end', e.target.value)
                          }
                        />
                        <button
                          onClick={() => handleRemoveTimeSlot(day, slotIndex)}
                          className={styles.removeSlotButton}
                          title="Remove slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      className={styles.addSlotButton}
                      onClick={() => handleAddTimeSlot(day)}
                    >
                      <Plus size={14} />
                      <span>Add Time Slot</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            {isEdit ? 'Update' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLocationModal;