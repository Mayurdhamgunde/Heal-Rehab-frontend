import React, { useState } from "react";
import { Icon } from "@iconify/react";
import styles from "../css/PatientDocumentUploader.module.css";

interface PatientDocumentUploaderProps {
  onDocumentSelected: (document: DocumentInfo) => void;
  onDocumentRemoved: () => void;
  onUploadComplete?: () => void;
  initialDocument?: DocumentInfo | null;
  isUploading: boolean;
  uploadProgress?: number; // 0-100, shown while isUploading is true
  documentType?: string;
  patientId: string;
}

interface DocumentInfo {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  file?: File; // the real File object — used for direct-to-Azure upload
  document_name?: string;
  document_type?: string;
}

interface PendingDocument {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  file: File;
}

const documentTypes = [
  "Medical Report",
  "Test Results",
  "Prescription",
  "Insurance",
  "Identity",
  "Other",
];

const PatientDocumentUploader: React.FC<PatientDocumentUploaderProps> = ({
  onDocumentSelected,
  onDocumentRemoved,
  initialDocument,
  isUploading,
  uploadProgress,
}) => {
  const [localDocument, setLocalDocument] = useState<DocumentInfo | null>(
    initialDocument || null,
  );
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingDocument, setPendingDocument] =
    useState<PendingDocument | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] =
    useState("Medical Report");
  const [uploadType, setUploadType] = useState<"document" | "photo">(
    "document",
  );
  const [showSuccessToast] = useState(false);
  const [successMessage] = useState("");

  const getFileIcon = (fileType: string | undefined, fileName: string) => {
    if (!fileType && !fileName) return "ion:document-outline";
    const type = fileType?.toLowerCase() || "";
    const extension = fileName?.split(".").pop()?.toLowerCase() || "";
    if (type.includes("pdf") || extension === "pdf") {
      return "ion:document-text-outline";
    } else if (
      type.includes("image") ||
      ["jpg", "jpeg", "png", "gif"].includes(extension)
    ) {
      return "ion:image-outline";
    }
    return "ion:document-outline";
  };

  const getFileIconColor = (fileType: string | undefined, fileName: string) => {
    if (!fileType && !fileName) return "#666666";
    const type = fileType?.toLowerCase() || "";
    const extension = fileName?.split(".").pop()?.toLowerCase() || "";
    if (type.includes("pdf") || extension === "pdf") {
      return "#d32f2f";
    } else if (
      type.includes("image") ||
      ["jpg", "jpeg", "png", "gif"].includes(extension)
    ) {
      return "#007bff";
    }
    return "#666666";
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const handleDocumentPick = (
    event: React.ChangeEvent<HTMLInputElement>,
    isPhotoOnly = false,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File Too Large: Please select a file smaller than 50MB");
      return;
    }

    const allowedTypes = isPhotoOnly
      ? ["image/jpeg", "image/png", "image/gif"]
      : ["application/pdf", "image/jpeg", "image/png", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please select a PDF or image file.");
      return;
    }

    const documentUri = URL.createObjectURL(file);
    const documentName = file.name;
    const documentType = file.type;

    const pendingDoc: PendingDocument = {
      uri: documentUri,
      name: documentName,
      type: documentType,
      size: file.size,
      file, // keep the real File so we can PUT it directly later — no re-fetch needed
    };

    const nameWithoutExtension = documentName.split(".").slice(0, -1).join(".");
    setDocumentName(nameWithoutExtension || documentName);
    setPendingDocument(pendingDoc);
    setUploadType(isPhotoOnly ? "photo" : "document");
    setShowNameModal(true);
  };

  const handleConfirmDocument = () => {
    if (!pendingDocument) return;
    if (!documentName.trim()) {
      alert("Please enter a document name");
      return;
    }

    const documentInfo: DocumentInfo = {
      uri: pendingDocument.uri,
      name: pendingDocument.name,
      type: pendingDocument.type,
      size: pendingDocument.size,
      file: pendingDocument.file,
      document_name: documentName.trim(),
      document_type: selectedDocumentType,
    };

    // Set the document immediately to show in UI
    setLocalDocument(documentInfo);

    // Close modal
    setShowNameModal(false);
    setPendingDocument(null);
    setDocumentName("");

    // Call the parent's upload handler
    onDocumentSelected(documentInfo);
  };

  const handleCancelModal = () => {
    setShowNameModal(false);
    setPendingDocument(null);
    setDocumentName("");
  };

  const handleRemoveDocument = () => {
    if (window.confirm("Are you sure you want to remove this document?")) {
      setLocalDocument(null);
      onDocumentRemoved();
    }
  };

  const handleDocumentPress = () => {
    if (localDocument && !isUploading) {
      const choice = window.prompt(
        `What would you like to do with "${
          localDocument.document_name || localDocument.name
        }"?\n1. Remove Document\n2. Replace Document`,
        "1",
      );
      if (choice === "1") {
        handleRemoveDocument();
      } else if (choice === "2") {
        document.getElementById("documentInput")?.click();
      }
    }
  };

  const renderDocumentTypeSelector = () => (
    <div className={styles.documentTypeContainer}>
      <span className={styles.documentTypeLabel}>Document Type:</span>
      <div className={styles.documentTypeScrollContainer}>
        {documentTypes.map((type) => (
          <button
            key={type}
            className={`${styles.documentTypeChip} ${
              selectedDocumentType === type
                ? styles.selectedDocumentTypeChip
                : ""
            }`}
            onClick={() => setSelectedDocumentType(type)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );

  const renderUploadButtons = () => (
    <div className={styles.uploadButtonsContainer}>
      <label className={`${styles.uploadButton} ${styles.documentButton}`}>
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => handleDocumentPick(e, false)}
          disabled={isUploading}
          style={{ display: "none" }}
          id="documentInput"
        />
        <div className={styles.uploadButtonContent}>
          <Icon
            icon="material-symbols:attach-file"
            width={24}
            color="#007b8e"
          />
          <span className={styles.uploadButtonText}>Add Document</span>
          <span className={styles.supportedFormats}>PDF, Images</span>
        </div>
      </label>
      <label className={`${styles.uploadButton} ${styles.photoButton}`}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleDocumentPick(e, true)}
          disabled={isUploading}
          style={{ display: "none" }}
        />
        <div className={styles.uploadButtonContent}>
          <Icon
            icon="material-symbols:photo-camera"
            width={24}
            color="#007b8e"
          />
          <span className={styles.uploadButtonText}>Add Photo</span>
          <span className={styles.supportedFormats}>JPG, PNG, GIF</span>
        </div>
      </label>
    </div>
  );

  return (
    <div className={styles.container}>
      {localDocument ? (
        <div className={styles.documentCard}>
          <div
            className={styles.documentPreviewContainer}
            onClick={handleDocumentPress}
            style={{ pointerEvents: isUploading ? "none" : "auto" }}
          >
            {isUploading && (
              <div className={styles.uploadingOverlay}>
                <div className={styles.loader}></div>
                <span className={styles.uploadingText}>
                  {uploadProgress != null
                    ? `Uploading... ${uploadProgress}%`
                    : "Uploading..."}
                </span>
              </div>
            )}
          </div>
          {!isUploading && (
            <div className={styles.addMoreSection}>
              <span className={styles.addMoreText}>Add More Documents</span>
              {renderUploadButtons()}
            </div>
          )}
        </div>
      ) : (
        renderUploadButtons()
      )}
      {showNameModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {uploadType === "photo"
                  ? "Photo Information"
                  : "Document Information"}
              </h3>
              <button
                onClick={handleCancelModal}
                className={styles.closeButton}
              >
                <Icon
                  icon="material-symbols:close"
                  width={20}
                  color="#666666"
                />
              </button>
            </div>
            <div className={styles.modalContent}>
              {pendingDocument && (
                <div className={styles.filePreview}>
                  <div className={styles.filePreviewIcon}>
                    <Icon
                      icon={getFileIcon(
                        pendingDocument.type,
                        pendingDocument.name,
                      )}
                      width={24}
                      color={getFileIconColor(
                        pendingDocument.type,
                        pendingDocument.name,
                      )}
                    />
                  </div>
                  <div className={styles.filePreviewInfo}>
                    <span className={styles.filePreviewName}>
                      {pendingDocument.name}
                    </span>
                    <span className={styles.filePreviewMeta}>
                      {formatFileSize(pendingDocument.size)}
                    </span>
                  </div>
                </div>
              )}
              <div className={styles.inputContainer}>
                <label className={styles.inputLabel}>
                  {uploadType === "photo" ? "Photo Name *" : "Document Name *"}
                </label>
                <input
                  className={styles.textInput}
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder={
                    uploadType === "photo"
                      ? "Enter photo name"
                      : "Enter document name"
                  }
                />
              </div>
              {renderDocumentTypeSelector()}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelModal}
              >
                Cancel
              </button>
              <button
                className={`${styles.confirmButton} ${
                  !documentName.trim() ? styles.disabledButton : ""
                }`}
                onClick={handleConfirmDocument}
                disabled={!documentName.trim()}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className={styles.toastContainer}>
          <div className={styles.toast}>
            <Icon
              icon="material-symbols:check-circle"
              width={20}
              color="#ffffff"
            />
            <span className={styles.toastMessage}>{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDocumentUploader;
