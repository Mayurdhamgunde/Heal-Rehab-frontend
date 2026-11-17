import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../css/CreateGroupSession.module.css";
import api from "../utils/central";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaCheck } from "react-icons/fa";
import LocationPicker from "../components/HospitalLocation";

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email?: string;
  patient_image?: string;
}

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupSessionFormData {
  session_type: "Group";
  issue_dealt_with: string;
  counselor_impression: string;
}

const CreateGroupSession: React.FC = () => {
  const navigate = useNavigate();

  // Core States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [formData, setFormData] = useState<GroupSessionFormData>({
    session_type: "Group",
    issue_dealt_with: "",
    counselor_impression: "",
  });

  const [errors, setErrors] = useState<
    Partial<GroupSessionFormData & { patients: string; location: string }>
  >({});

  const todayDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // ── Fetch (default list) ────────────────────

  const fetchDefaultPatients = useCallback(async () => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    setLoadingPatients(true);

    try {
      const response = await api.get(
        `/patient/getAll?limit=100&status=active`,
        { signal: fetchAbortRef.current.signal },
      );
      if (response.status === 200 && response.data.patients) {
        setPatients(response.data.patients);
      }
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      console.error("Error fetching patients:", err);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

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
      setPatients(searchResults);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      if (err.response?.status === 404) {
        setPatients([]);
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
      fetchDefaultPatients();
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof GroupSessionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
    if (errors.location)
      setErrors((prev) => ({ ...prev, location: undefined }));
  };

  const togglePatientSelection = (patientId: string) => {
    const newSelection = new Set(selectedPatientIds);
    if (newSelection.has(patientId)) {
      newSelection.delete(patientId);
    } else {
      newSelection.add(patientId);
    }
    setSelectedPatientIds(newSelection);
    if (errors.patients && newSelection.size > 0) {
      setErrors((prev) => ({ ...prev, patients: undefined }));
    }
  };

  const toggleSelectAll = () => {
    if (selectedPatientIds.size === patients.length) {
      setSelectedPatientIds(new Set());
    } else {
      const allIds = new Set(patients.map((p) => p._id));
      setSelectedPatientIds(allIds);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<
      GroupSessionFormData & { patients: string; location: string }
    > = {};

    if (selectedPatientIds.size === 0)
      newErrors.patients = "Please select at least one patient.";
    if (!formData.issue_dealt_with.trim())
      newErrors.issue_dealt_with = "Documentation is required";
    if (!formData.counselor_impression.trim())
      newErrors.counselor_impression = "Impression is required";
    if (!selectedLocation)
      newErrors.location = "Please select a facility location";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const formattedPatients = Array.from(selectedPatientIds).map((id) => ({
        contactId: id,
      }));

      const payload = {
        patients: formattedPatients,
        session_number: 1,
        session_type: formData.session_type,
        issue_dealt_with: formData.issue_dealt_with,
        counselor_impression: formData.counselor_impression,
        location_id: selectedLocation?._id,
        location_name: selectedLocation?.name,
        location_address: selectedLocation?.addressLink,
      };

      const response = await api.post(`/create/group/Session`, payload);

      if (
        response.status === 201 ||
        response.status === 200 ||
        response.status === 207
      ) {
        alert(response.data.msg || "Group session recorded successfully!");
        navigate(-1);
      }
    } catch (error: any) {
      console.error("Error recording group session:", error);
      alert(error.response?.data?.msg || "Failed to record group session.");
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
          Conduct Group Session
        </h1>
        <p className={styles.pageSubtitle}>
          Select participants and record shared clinical notes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        <div className={styles.mainGrid}>
          {/* --- LEFT COLUMN: Participant Selection --- */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                Participants ({selectedPatientIds.size})
              </h2>
              {patients.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={styles.textBtn}
                >
                  {selectedPatientIds.size === patients.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search patients..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {errors.patients && (
              <span
                className={styles.errorText}
                style={{ marginBottom: "8px", display: "block" }}
              >
                {errors.patients}
              </span>
            )}

            <div className={styles.patientListContainer}>
              {isPatientListLoading ? (
                <div className={styles.loadingState}>
                  {isSearching ? "Searching patients..." : "Loading patients..."}
                </div>
              ) : patients.length === 0 ? (
                <div className={styles.emptyState}>No patients found.</div>
              ) : (
                patients.map((patient) => {
                  const isSelected = selectedPatientIds.has(patient._id);

                  return (
                    <div
                      key={patient._id}
                      className={`${styles.patientListItem} ${
                        isSelected ? styles.selectedItem : ""
                      }`}
                      onClick={() => togglePatientSelection(patient._id)}
                    >
                      <div
                        className={`${styles.checkbox} ${
                          isSelected ? styles.checkboxActive : ""
                        }`}
                      >
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
                        <p className={styles.patientName}>
                          {patient.patient_first_name}{" "}
                          {patient.patient_last_name}
                        </p>
                        {patient.patient_email && (
                          <p className={styles.patientEmail}>
                            {patient.patient_email}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: Clinical Notes & Actions --- */}
          <div className={styles.rightColumn}>
            <div className={styles.topCardsRow}>
              {/* Session Info Card */}
              <div className={`${styles.card} ${styles.flex1}`}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Session Details</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Facility Location <span className={styles.required}>*</span>
                  </label>
                  <LocationPicker
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    disabled={false}
                  />
                  {errors.location && (
                    <span className={styles.errorText}>{errors.location}</span>
                  )}
                </div>

                <div className={styles.rowGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input
                      type="text"
                      value={todayDate}
                      readOnly
                      className={`${styles.input} ${styles.readOnly}`}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="session_type" className={styles.label}>
                      Type <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="session_type"
                      name="session_type"
                      value={formData.session_type}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="Group">Group</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clinical Documentation Card */}
              <div className={`${styles.card} ${styles.flex1}`}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Clinical Notes</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="issue_dealt_with" className={styles.label}>
                    Issue Dealt With <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="issue_dealt_with"
                    name="issue_dealt_with"
                    value={formData.issue_dealt_with}
                    onChange={handleInputChange}
                    className={`${styles.textarea} ${
                      errors.issue_dealt_with ? styles.inputError : ""
                    }`}
                    placeholder="Main topics discussed..."
                  />
                  {errors.issue_dealt_with && (
                    <span className={styles.errorText}>
                      {errors.issue_dealt_with}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label
                    htmlFor="counselor_impression"
                    className={styles.label}
                  >
                    Counselor Impression{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="counselor_impression"
                    name="counselor_impression"
                    value={formData.counselor_impression}
                    onChange={handleInputChange}
                    className={`${styles.textarea} ${
                      errors.counselor_impression ? styles.inputError : ""
                    }`}
                    placeholder="Overall group dynamic..."
                  />
                  {errors.counselor_impression && (
                    <span className={styles.errorText}>
                      {errors.counselor_impression}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* --- IN-PAGE ACTION BAR --- */}
            <div className={styles.actionCard}>
              <div className={styles.footerSummary}>
                <span className={styles.summaryBadge}>
                  {selectedPatientIds.size}
                </span>
                Patients Selected
              </div>
              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Session for All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupSession;