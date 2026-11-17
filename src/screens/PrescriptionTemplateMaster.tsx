import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../utils/central";
import styles from "../css/MedicineMaster.module.css";
import PrescriptionFormComponent, {
  type PrescriptionFormDataType,
} from "../components/PrescriptionFormComponent";

interface PrescriptionTemplate {
  _id: string;
  template_name: string;
  created_by_doctor_name?: string;
  medications: any[];
  notes?: string;
  vitals?: {
    weight?: string;
    bp?: string;
  };
}

const PrescriptionTemplateMaster: React.FC = () => {
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );

  // Data States for the Modal
  const [templateName, setTemplateName] = useState("");
  const [prescriptionData, setPrescriptionData] =
    useState<PrescriptionFormDataType | null>(null);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    templateId: string | null;
    templateName: string;
  }>({
    isOpen: false,
    templateId: null,
    templateName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 1. FETCH TEMPLATES ---
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/prescription-templates`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // --- OPEN MODAL FOR ADD/EDIT ---
  const handleOpenModal = (
    template?: PrescriptionTemplate,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    if (template) {
      setEditingTemplateId(template._id);
      setTemplateName(template.template_name);
      setPrescriptionData({
        weight: template.vitals?.weight || "",
        bp: template.vitals?.bp || "",
        notes: template.notes || "",
        prescriptionDate: "",
        medications: template.medications || [],
      });
    } else {
      setEditingTemplateId(null);
      setTemplateName("");
      setPrescriptionData({
        weight: "",
        bp: "",
        notes: "",
        prescriptionDate: "",
        medications: [],
      });
    }
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
  };

  // --- 2. CREATE OR UPDATE TEMPLATE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      return alert("Template Name is required.");
    }
    if (!prescriptionData || prescriptionData.medications.length === 0) {
      return alert("Please add at least one medication to the template.");
    }

    const payload = {
      template_name: templateName,
      notes: prescriptionData.notes,
      vitals: {
        weight: prescriptionData.weight,
        bp: prescriptionData.bp,
      },
      medications: prescriptionData.medications,
    };

    setIsSaving(true);
    try {
      if (editingTemplateId) {
        await api.put(`/prescription-templates/${editingTemplateId}`, payload);
      } else {
        await api.post(`/prescription-templates`, payload);
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (error: any) {
      alert(error.response?.data?.msg || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 3. DELETE TEMPLATE ---
  const promptDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, templateId: id, templateName: name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.templateId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/prescription-templates/${deleteModal.templateId}`);
      setDeleteModal({ isOpen: false, templateId: null, templateName: "" });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Prescription Templates</h1>
          <p className={styles.subtitle}>
            Create and manage organization-wide prescription templates for
            faster charting.
          </p>
        </div>
        <button
          className={styles.createButton}
          onClick={() => handleOpenModal()}
        >
          <Plus size={16} strokeWidth={2.5} /> Add New Template
        </button>
      </header>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Organization Templates</h2>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spinner} size={32} />
            <p>Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {searchTerm
                ? "No matching templates found."
                : "No templates found. Create one above!"}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Medications Count</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr
                  key={template._id}
                  className={styles.tableRow}
                  onClick={() => handleOpenModal(template)}
                  title="Click to edit template"
                >
                  <td>
                    <div className={styles.itemInfo}>
                      <div className={styles.iconWrapper}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className={styles.nameText}>
                          {template.template_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.typePill}>
                      {template.medications?.length || 0} Meds
                    </span>
                  </td>
                  <td>
                    <span className={styles.normalText}>
                      {template.created_by_doctor_name || "System"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => handleOpenModal(template, e)}
                        title="Edit Template"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.delete}`}
                        onClick={(e) =>
                          promptDelete(template._id, template.template_name, e)
                        }
                        title="Delete Template"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeFormModal}>
          <div
            className={styles.modalContent}
            style={{ maxWidth: "900px", maxHeight: "95vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>
                  {editingTemplateId
                    ? "Edit Prescription Template"
                    : "Add New Template"}
                </h2>
              </div>
              <button className={styles.closeBtn} onClick={closeFormModal}>
                <X size={20} />
              </button>
            </div>

            <div
              className={styles.modalBody}
              style={{ padding: "24px", overflowY: "auto" }}
            >
              <div
                className={styles.inputGroup}
                style={{ marginBottom: "24px" }}
              >
                <label>
                  Template Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Standard Viral Fever Protocol"
                />
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  background: "#fff",
                }}
              >
                <PrescriptionFormComponent
                  initialData={prescriptionData || undefined}
                  onDataChange={(data) => setPrescriptionData(data)}
                  hideFooter={true}
                  isTemplateBuilder={true}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeFormModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalSubmitButton}
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className={styles.btnSpinner} size={16} />
                ) : (
                  "Save Template"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModal.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        >
          <div
            className={styles.deleteModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalIcon}>
              <AlertCircle size={32} color="#ef4444" />
            </div>
            <h2 className={styles.deleteModalTitle}>
              Are you sure you want to delete?
            </h2>
            <p className={styles.deleteModalText}>
              You are about to delete the template{" "}
              <strong>"{deleteModal.templateName}"</strong>. This action cannot
              be undone.
            </p>
            <div className={styles.deleteModalActions}>
              <button
                className={styles.deleteCancelBtn}
                onClick={() =>
                  setDeleteModal({ ...deleteModal, isOpen: false })
                }
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className={styles.btnSpinner} size={16} />
                ) : (
                  "Delete this template"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionTemplateMaster;
