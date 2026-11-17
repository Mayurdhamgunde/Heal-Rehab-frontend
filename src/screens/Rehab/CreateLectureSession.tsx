import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../../css/Rehab/CreateLectureSession.module.css";
import api from "../../utils/central";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaCheck } from "react-icons/fa";

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email?: string;
  patient_image?: string;
}

interface LectureSessionFormData {
  lecture_number: string;
  topic_name: string;
  description: string;
  counselor_notes: string;
}

const CreateLectureSession: React.FC = () => {
  const navigate = useNavigate();

  // Full roster (used for total counts / absentee payload — NOT affected by search)
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  // Patients currently rendered in the list (default roster, or search results)
  const [displayedPatients, setDisplayedPatients] = useState<Patient[]>([]);

  // CHANGED: This state now tracks who is ABSENT, not who is present.
  const [absentPatientIds, setAbsentPatientIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<LectureSessionFormData>({
    lecture_number: "",
    topic_name: "",
    description: "",
    counselor_notes: "",
  });

  const [errors, setErrors] = useState<Partial<LectureSessionFormData>>({});

  // ── Fetch (master roster) ────────────────────

  const fetchAllPatients = useCallback(async () => {
    try {
      setLoadingPatients(true);
      const response = await api.get(`/patient/getAll?limit=100&status=active`);
      if (response.status === 200 && response.data.patients) {
        setAllPatients(response.data.patients);
        setDisplayedPatients(response.data.patients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPatients();
  }, [fetchAllPatients]);

  // ── Search ───────────────────────────────────

  const searchPatients = useCallback(async (query: string) => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    setIsSearching(true);

    try {
      const response = await api.get(
        `/search/patient?query=${encodeURIComponent(query)}`,
        { signal: fetchAbortRef.current.signal },
      );
      const searchResults: Patient[] = response.data.patients || [];
      setDisplayedPatients(searchResults);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      if (err.response?.status === 404) {
        setDisplayedPatients([]);
      } else {
        console.error("Error searching patients:", err);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ── Effects ──────────────────────────────────

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchTerm.trim() === "") {
      fetchAbortRef.current?.abort();
      setDisplayedPatients(allPatients);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPatients(searchTerm.trim());
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => () => fetchAbortRef.current?.abort(), []);

  // ── Handlers ─────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LectureSessionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Toggle marking a patient as ABSENT
  const togglePatientSelection = (patientId: string) => {
    const newSelection = new Set(absentPatientIds);
    if (newSelection.has(patientId)) {
      newSelection.delete(patientId);
    } else {
      newSelection.add(patientId);
    }
    setAbsentPatientIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (absentPatientIds.size === displayedPatients.length) {
      setAbsentPatientIds(new Set<string>());
    } else {
      const allIds = new Set<string>(displayedPatients.map((p) => p._id));
      setAbsentPatientIds(allIds);
    }
  };

  // Derived UI states (Flipped logic: selected = absent) — always based on the full roster
  const absentCount = absentPatientIds.size;
  const presentCount = allPatients.length - absentCount;

  const absentNames = allPatients
    .filter((p) => absentPatientIds.has(p._id)) // Only include explicitly selected patients
    .map((p) => `${p.patient_first_name} ${p.patient_last_name}`)
    .join(", ");

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<LectureSessionFormData> = {};
    if (!formData.lecture_number.trim()) newErrors.lecture_number = "Lecture number is required";
    if (!formData.topic_name.trim()) newErrors.topic_name = "Topic name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit to actual endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);

    try {
      // Map correctly: only grab patients whose IDs are in the absentPatientIds set
      const absent_patients_payload = allPatients
        .filter(p => absentPatientIds.has(p._id))
        .map(p => ({
            contactId: p._id,
            reason: "Not provided" 
        }));

      const payload = {
        lecture_number: parseInt(formData.lecture_number, 10),
        topic_name: formData.topic_name,
        total_patients: allPatients.length,
        absent_patients: absent_patients_payload,
        description: formData.description,
        counselor_notes: formData.counselor_notes
      };

      const response = await api.post(`/create/lecture/session`, payload);
      
      if(response.status === 201 || response.status === 200) {
        alert("Lecture session recorded successfully!");
        navigate(-1);
      }
    } catch (error: any) {
      console.error("Error recording lecture session:", error);
      alert(error.response?.data?.msg || "Failed to record lecture session.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPatientListLoading = loadingPatients || isSearching;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft
            size={15}
            style={{ cursor: "pointer", color: "#6b7280", marginRight: "6px" }}
            onClick={() => navigate(-1)}
          />
          Record Lecture Session
        </h1>
        <p className={styles.pageSubtitle}>Log attendance and topic details for group lectures.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        <div className={styles.mainGrid}>
          
          {/* --- LEFT COLUMN: Participant Selection --- */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Mark Absentees ({absentCount} selected)</h2>
              {displayedPatients.length > 0 && (
                <button type="button" onClick={toggleSelectAll} className={styles.textBtn}>
                  {absentPatientIds.size === displayedPatients.length ? "Deselect All" : "Mark All Absent"}
                </button>
              )}
            </div>

            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search to mark absent..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.patientListContainer}>
              {isPatientListLoading ? (
                <div className={styles.loadingState}>
                  {isSearching ? "Searching patients..." : "Loading patients..."}
                </div>
              ) : displayedPatients.length === 0 ? (
                <div className={styles.emptyState}>No patients found.</div>
              ) : (
                displayedPatients.map((patient) => {
                  const isSelected = absentPatientIds.has(patient._id);
                  return (
                    <div 
                      key={patient._id} 
                      className={`${styles.patientListItem} ${isSelected ? styles.selectedItem : ""}`}
                      onClick={() => togglePatientSelection(patient._id)}
                      title="Click to mark as absent"
                    >
                      <div className={`${styles.checkbox} ${isSelected ? styles.checkboxActive : ""}`}>
                        {isSelected && <FaCheck size={9} color="#fff" />}
                      </div>
                      <div className={styles.patientAvatar}>
                        {patient.patient_image ? (
                          <img src={patient.patient_image} alt="avatar" />
                        ) : (
                          patient.patient_first_name.charAt(0)
                        )}
                      </div>
                      <div className={styles.patientInfo}>
                        <p className={styles.patientName}>{patient.patient_first_name} {patient.patient_last_name}</p>
                        {patient.patient_email && <p className={styles.patientEmail}>{patient.patient_email}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: Lecture Details & Actions --- */}
          <div className={styles.rightColumn}>
            
            <div className={styles.topCardsRow}>
              
              {/* Lecture Details Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Lecture Info</h2>
                </div>

                <div className={styles.rowGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="lecture_number" className={styles.label}>Lecture Number <span className={styles.required}>*</span></label>
                    <input 
                      type="number" 
                      id="lecture_number"
                      name="lecture_number"
                      value={formData.lecture_number} 
                      onChange={handleInputChange}
                      className={`${styles.input} ${errors.lecture_number ? styles.inputError : ""}`} 
                      placeholder="e.g. 101"
                      min="1"
                    />
                    {errors.lecture_number && <span className={styles.errorText}>{errors.lecture_number}</span>}
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="topic_name" className={styles.label}>Topic Name <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      id="topic_name"
                      name="topic_name"
                      value={formData.topic_name}
                      onChange={handleInputChange}
                      className={`${styles.input} ${errors.topic_name ? styles.inputError : ""}`}
                      placeholder="Main topic discussed..."
                    />
                    {errors.topic_name && <span className={styles.errorText}>{errors.topic_name}</span>}
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="description" className={styles.label}>Lecture Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    placeholder="Provide a brief overview of the lecture..."
                    style={{ minHeight: '60px' }}
                  />
                </div>
              </div>

              {/* Attendance Log Output Card */}
              <div className={`${styles.card} ${styles.flex1}`}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Logbook Output</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="counselor_notes" className={styles.label}>Counselor Notes</label>
                  <input
                    type="text"
                    id="counselor_notes"
                    name="counselor_notes"
                    value={formData.counselor_notes}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Internal counselor observations..."
                  />
                </div>

                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>Absent Client Names (Auto-Populated)</label>
                  <textarea
                    readOnly
                    value={absentNames}
                    className={`${styles.textarea} ${styles.readOnly}`}
                    placeholder="Names will auto-populate here when selected..."
                  />
                  <span style={{ fontSize: "0.65rem", color: "#9ca3af", marginTop: "4px" }}>
                    * Names mapped automatically based on your selections.
                  </span>
                </div>
              </div>

            </div>

            {/* --- IN-PAGE ACTION BAR --- */}
            <div className={styles.actionCard}>
              <div className={styles.footerSummary}>
                <span className={styles.summaryBadge}>
                  {presentCount} / {allPatients.length}
                </span>
                Total Present
              </div>
              <div className={styles.footerActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>
                  Go Back
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Lecture"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateLectureSession;