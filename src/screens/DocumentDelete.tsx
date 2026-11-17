import React, { useState } from "react";
import { createPortal } from "react-dom"; // 1. Import createPortal
import { Icon } from "@iconify/react";
import styles from "../css/DocumentDelete.module.css";
import api from "../utils/central";

interface PatientDocument {
  _id: string;
  document_name: string;
  document_url: string;
  document_upload_date: string;
  document_type: string;
  uploaded_by: string;
  file_size: number;
  file_extension: string;
}

interface DocumentDeleteDialogProps {
  document: PatientDocument;
  patientId: string;
  onDeleteSuccess: () => void;
  children: React.ReactNode;
}

const DocumentDeleteDialog: React.FC<DocumentDeleteDialogProps> = ({
  document,
  patientId,
  onDeleteSuccess,
  children,
}) => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteDocument = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete(
        `/patients/${patientId}/documents/${document._id}`,
      );

      if (response.status === 200) {
        alert("Document deleted successfully");
        onDeleteSuccess();
        setIsDialogVisible(false);
      }
    } catch (error) {
      console.error("Document deletion error:", error);
      alert("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsDialogVisible(true)}>{children}</div>

      {/* 2. Wrap the modal overlay in createPortal and attach to document.body */}
      {isDialogVisible &&
        createPortal(
          <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
              <div className={styles.header}>
                <Icon
                  icon="material-symbols:delete"
                  width={24}
                  color="#dc3545"
                />
                <h3 className={styles.title}>Delete Document</h3>
              </div>
              <div className={styles.content}>
                <span className={styles.documentName}>
                  {document.document_name}
                </span>
                <span className={styles.warning}>
                  This action cannot be undone.
                </span>
              </div>
              <div className={styles.buttons}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsDialogVisible(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.deleteButton} ${isDeleting ? styles.deleteButtonDisabled : ""}`}
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className={styles.loader}></div>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>,
          window.document.body,
        )}
    </>
  );
};

export default DocumentDeleteDialog;
