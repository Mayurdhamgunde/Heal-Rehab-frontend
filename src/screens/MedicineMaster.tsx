import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Pill,
  Loader2,
  AlertCircle
} from "lucide-react";
import api from "../utils/central";
import styles from "../css/MedicineMaster.module.css";

interface Drug {
  _id: string;
  drug_name: string;
  generic_name: string;
  drug_type: string;
  strength: string;
  meal_timing?: string;
}

const DRUG_TYPES = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Drops",
  "Inhaler",
  "Other",
];

const MedicineMaster: React.FC = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDrugId, setEditingDrugId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    drug_name: "",
    generic_name: "",
    drug_type: "Tablet",
    strength: "",
    meal_timing: "After Lunch",
  });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    drugId: string | null;
    drugName: string;
  }>({
    isOpen: false,
    drugId: null,
    drugName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 1. SEARCH DRUGS ---
  const fetchDrugs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/search/drug`, {
        params: { search: searchTerm, page, limit: 10 },
      });
      setDrugs(response.data.drugs || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch drugs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDrugs(); // Removed setPage(1) from here so it doesn't interrupt pagination
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchDrugs]); // Changed dependency to only watch fetchDrugs

  // --- OPEN MODAL FOR ADD/EDIT ---
  const handleOpenModal = (drug?: Drug, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (drug) {
      setEditingDrugId(drug._id);
      setFormData({
        drug_name: drug.drug_name,
        generic_name: drug.generic_name,
        drug_type: drug.drug_type || "Tablet",
        strength: drug.strength || "",
        meal_timing: drug.meal_timing || "After Lunch",
      });
    } else {
      setEditingDrugId(null);
      setFormData({
        drug_name: "",
        generic_name: "",
        drug_type: "Tablet",
        strength: "",
        meal_timing: "After Lunch",
      });
    }
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
  };

  // --- 2 & 3. CREATE OR UPDATE DRUG ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.drug_name.trim() || !formData.generic_name.trim()) {
      return alert("Brand Name and Generic Molecule are required.");
    }

    setIsSaving(true);
    try {
      if (editingDrugId) {
        await api.put(`/update/drug/${editingDrugId}`, formData);
      } else {
        await api.post(`/drug/create`, formData);
      }
      setIsModalOpen(false);
      fetchDrugs(); 
    } catch (error: any) {
      alert(error.response?.data?.msg || "Failed to save medicine");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. DELETE DRUG ---
  const promptDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, drugId: id, drugName: name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.drugId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/delete/drug/${deleteModal.drugId}`);
      cancelDelete();
      fetchDrugs(); 
    } catch (error) {
      console.error("Error deleting medicine:", error);
      alert("Failed to delete medicine.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, drugId: null, drugName: "" });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Medicines</h1>
          <p className={styles.subtitle}>
            Manage and maintain your clinic's standardized medication formulary.
          </p>
        </div>
        <button
          className={styles.createButton}
          onClick={() => handleOpenModal()}
        >
          <Plus size={16} strokeWidth={2.5} /> Add New Medicine
        </button>
      </header>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Medicine Directory</h2>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Brand or Molecule..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Added here to reset to page 1 only when a new search is typed
              }}
              className={styles.searchInput}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spinner} size={32} />
            <p>Loading medicines...</p>
          </div>
        ) : drugs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchTerm ? "No matching medicines found." : "No medicines found. Create one above!"}</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medicine Information</th>
                <th>Strength</th>
                <th>Timing</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drugs.map((drug) => (
                <tr
                  key={drug._id}
                  className={styles.tableRow}
                  onClick={() => handleOpenModal(drug)}
                  title="Click to edit medicine"
                >
                  <td>
                    <div className={styles.itemInfo}>
                      <div className={styles.iconWrapper}>
                        <Pill size={16} />
                      </div>
                      <div>
                        <p className={styles.nameText}>{drug.drug_name}</p>
                        <p className={styles.descText}>{drug.generic_name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.normalText}>{drug.strength || "-"}</span>
                  </td>
                  <td>
                    <span className={styles.timingPill}>{drug.meal_timing || "After Lunch"}</span>
                  </td>
                  <td>
                    <span className={styles.typePill}>{drug.drug_type}</span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => handleOpenModal(drug, e)}
                        title="Edit Medicine"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.delete}`}
                        onClick={(e) => promptDelete(drug._id, drug.drug_name, e)}
                        title="Delete Medicine"
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

        {totalCount > 0 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Showing page {page} of {totalPages} ({totalCount} total items)
            </span>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageArrow} 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              <span className={`${styles.pageNumber} ${styles.active}`}>
                {page}
              </span>
              <button 
                className={styles.pageArrow} 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeFormModal}>
          <div
            className={styles.modalContent}
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>
                  {editingDrugId ? "Edit Medicine" : "Add New Medicine"}
                </h2>
              </div>
              <button className={styles.closeBtn} onClick={closeFormModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.inputGroup}>
                  <label>Brand Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={styles.textInput}
                    required
                    value={formData.drug_name}
                    onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                    placeholder="e.g. Paracetamol"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Generic Molecule <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={styles.textInput}
                    required
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    placeholder="e.g. Acetaminophen"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Strength</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Meal Timing</label>
                  <div className={styles.toggleGroup}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${formData.meal_timing === "Before Lunch" ? styles.toggleActive : ''}`}
                      onClick={() => setFormData({ ...formData, meal_timing: "Before Lunch" })}
                    >
                      Before Lunch
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${formData.meal_timing === "After Lunch" ? styles.toggleActive : ''}`}
                      onClick={() => setFormData({ ...formData, meal_timing: "After Lunch" })}
                    >
                      After Lunch
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Medicine Type</label>
                  <div className={styles.typeSelector}>
                    {DRUG_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type}
                        className={`${styles.typeBtn} ${formData.drug_type === type ? styles.typeActive : ''}`}
                        onClick={() => setFormData({ ...formData, drug_type: type })}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.modalCloseButton} onClick={closeFormModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.modalSubmitButton} disabled={isSaving}>
                  {isSaving ? <Loader2 className={styles.btnSpinner} size={16} /> : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteModalIcon}>
              <AlertCircle size={32} color="#ef4444" />
            </div>
            <h2 className={styles.deleteModalTitle}>Are you sure you want to delete?</h2>
            <p className={styles.deleteModalText}>
              You are about to delete the medicine <strong>"{deleteModal.drugName}"</strong>. This action cannot be undone.
            </p>
            <div className={styles.deleteModalActions}>
              <button 
                className={styles.deleteCancelBtn} 
                onClick={cancelDelete} 
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmBtn} 
                onClick={confirmDelete} 
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className={styles.btnSpinner} size={16} /> : "Delete this medicine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineMaster;