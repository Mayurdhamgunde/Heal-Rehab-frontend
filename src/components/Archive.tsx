import React, { useState, useEffect } from "react";
import { FaArchive } from "react-icons/fa";
import moment from "moment-timezone";
import styles from "../css/Archive.module.css";

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, followUpDate: string) => void; // Added followUpDate
  patientName: string;
  isLoading?: boolean;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Set to 28 days from now
      let targetDate = moment().tz(moment.tz.guess()).add(28, "days");
      // Find the next Sunday (0 represents Sunday in moment.js)
      if (targetDate.day() !== 0) {
        targetDate.day(7);
      }
      setFollowUpDate(targetDate.format("YYYY-MM-DD"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(reason, followUpDate); // Pass date to parent
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <FaArchive size={28} color="#FF6B6B" />
          <h2 className={styles.modalTitle}>Discharge Patient</h2>
        </div>

        <p className={styles.modalMessage}>
          Are you sure you want to Discharge <strong>{patientName}</strong>?
        </p>

        {/* New Follow-up Date Selector */}
        <div className={styles.reasonContainer}>
          <label className={styles.reasonLabel}>Follow-up Date</label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            disabled={isLoading}
            className={styles.reasonInput}
          />
        </div>

        <div className={styles.reasonContainer}>
          <label className={styles.reasonLabel}>
            Reason <span className={styles.optionalText}>(Optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Treatment completed, Moved to another clinic..."
            disabled={isLoading}
            className={styles.reasonInput}
          />
        </div>

        <div className={styles.modalButtons}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={styles.confirmButton}
          >
            {isLoading ? "Discharging..." : "Discharge"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;
