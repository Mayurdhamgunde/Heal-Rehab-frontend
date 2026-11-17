import React, { useEffect, useState } from 'react';
import moment from 'moment-timezone';
import styles from '../css/AvailableSlots.module.css';

type Slot = {
  start: string;
  end: string;
  duration: number;
  status: 'free' | 'occupied';
};

type AvailableSlotsProps = {
  slotDuration: number;
  onSelectSlot?: (slotIndex: number, slot: Slot) => void;
  selectedDate?: Date; // Add selectedDate prop to determine if it's today or a future date
};

const generateAvailableSlots = (
  slotDuration: number = 30,
  selectedDate?: Date, // Add selectedDate parameter
): Slot[] => {
  const now = moment.tz('Asia/Kolkata');
  const today = moment(now).startOf('day');
  
  // Check if the selected date is today or a future date
  const isToday = selectedDate ? 
    moment(selectedDate).format('YYYY-MM-DD') === today.format('YYYY-MM-DD') : 
    true;

  const workingHours = {
    start: moment(today).hour(9).minute(0),
    end: moment(today).hour(21).minute(0),
  };

  const slots: Slot[] = [];
  let currentSlotTime = moment(workingHours.start);

  while (currentSlotTime.isBefore(workingHours.end)) {
    const slotStart = moment(currentSlotTime);
    const slotEnd = moment(currentSlotTime).add(slotDuration, 'minutes');

    if (slotEnd.isAfter(workingHours.end)) break;

    // For today, only show future slots
    // For future days, show all slots
    if (!isToday || slotEnd.isAfter(now)) {
      slots.push({
        start: slotStart.format('HH:mm'),
        end: slotEnd.format('HH:mm'),
        duration: slotDuration,
        status: 'free',
      });
    }

    currentSlotTime.add(
      slotDuration >= 60 ? 30 : slotDuration,
      'minutes'
    ); // Handle 1hr+ durations with 30min offsets
  }

  return slots;
};

const AvailableSlots: React.FC<AvailableSlotsProps> = ({ 
  slotDuration,
  onSelectSlot,
  selectedDate
}) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  
  useEffect(() => {
    const availableSlots = generateAvailableSlots(slotDuration, selectedDate);
    setSlots(availableSlots);
    // Reset selection when slot duration or date changes
    setSelectedSlotIndex(null);
  }, [slotDuration, selectedDate]);

  const handleSlotSelect = (slotIndex: number, slot: Slot) => {
    setSelectedSlotIndex(slotIndex);
    if (onSelectSlot) {
      onSelectSlot(slotIndex, slot);
    }
  };

  // Function to get the absolute index from row and column
  const getAbsoluteIndex = (rowIndex: number, colIndex: number) => {
    return rowIndex * 2 + colIndex;
  };

  // Prepare data for 2-column layout
  const prepareRowData = () => {
    const rows = [];
    for (let i = 0; i < slots.length; i += 2) {
      const row = slots.slice(i, i + 2);
      rows.push(row);
    }
    return rows;
  };

  const rowData = prepareRowData();

  return (
    <div className={styles.container}>
      {slots.length > 0 ? (
        <div className={styles.slotGrid}>
          {rowData.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((slot, colIndex) => {
                const slotIndex = getAbsoluteIndex(rowIndex, colIndex);
                const isSelected = selectedSlotIndex === slotIndex;
                
                return (
                  <button
                    key={colIndex}
                    className={`${styles.slotBox} ${isSelected ? styles.selectedSlotBox : ''}`}
                    onClick={() => handleSlotSelect(slotIndex, slot)}
                  >
                    <span className={`${styles.slotText} ${isSelected ? styles.selectedSlotText : ''}`}>
                      {slot.start} - {slot.end}
                    </span>
                  </button>
                );
              })}
              {/* If there's only one item in the row, add an empty slot for layout */}
              {row.length === 1 && <div className={styles.emptySlot} />}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noSlotsText}>No available slots for the selected duration</p>
      )}
    </div>
  );
};

export default AvailableSlots;