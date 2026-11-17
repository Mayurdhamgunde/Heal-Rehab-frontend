import React from 'react';
import { FaTrash } from 'react-icons/fa';
import styles from '../css/DeleteTherapy.module.css';

interface DeleteTherapyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: string;
}

const DeleteTherapyPlanModal: React.FC<DeleteTherapyPlanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <FaTrash size={28} color="#FF6B6B" />
          <h3 className={styles.modalTitle}>Delete Therapy Plan</h3>
        </div>

        <div className={styles.modalContent}>
          <p className={styles.warningMessage}>
            Are you sure you want to delete <strong>"{planName}"</strong>?
          </p>
          <p className={styles.cautionMessage}>
            This action cannot be undone. All associated data, sessions, and payment history will be permanently removed.
          </p>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.deleteButton}
            onClick={handleConfirm}
            type="button"
          >
            Delete Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTherapyPlanModal;