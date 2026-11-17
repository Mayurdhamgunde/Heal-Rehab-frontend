import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../css/PatientsList.module.css";
import api from "../utils/central";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  FaUsers,
  FaUserMd,
  FaCheckCircle,
  FaCalendarAlt,
  FaSearch,
  FaPhoneAlt,
  FaExclamationTriangle,
  FaSearchPlus,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSortUp,
  FaSortDown,
  FaFileExcel,
  FaUndo,
} from "react-icons/fa";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Patient {
  _id: string;
  patient_image?: string;
  patient_first_name: string;
  patient_middle_name?: string;
  patient_last_name: string;
  patient_email?: string;
  patient_phone: string;
  guardian_phone?: string;
  patient_id?: string;
  patient_registration_date: string;
  follow_Up_Date?: string; // Sourced directly from backend
  archived_date?: string;
  doctor_id: string;
  doctor_name?: string;
  UHID?: string;
  patient_age?: string;
  date_of_birth?: string;
  identity_card?: { type?: string; number?: string };
  education?: string;
  occupation?: string;
  caste?: string;
  gender?: string;
  marital_status?: string;
  patient_address1?: string;
  address?: { city?: string; state?: string; zip?: string };
  witness_name?: string;
  witness_relationship?: string;
  emergency_contact?: { name?: string; relationship?: string; phone?: string };
  care_team?: Array<{
    role: string;
    doctor_name: string;
  }>;
  status: "Active" | "Inactive" | "Archived";
  archived_at?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number | null;
  totalCount: number | null;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const ArchivedPatientsList: React.FC = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: null,
    totalCount: null,
    pageSize: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const cachedTotalCount = useRef<number | null>(null);
  const cachedTotalPages = useRef<number | null>(null);

  const [filterOption, setFilterOption] = useState<string>("all");
  const [sortField, setSortField] = useState<string>(
    "patient_registration_date",
  );
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // ── Fetch ──────────────────────────────────

  const fetchPatients = useCallback(
    async (page: number, opts: { resetCount?: boolean } = {}) => {
      fetchAbortRef.current?.abort();
      fetchAbortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const needsCount = page === 1 || opts.resetCount;

        const response = await api.get("/patient/archived", {
          signal: fetchAbortRef.current.signal,
        });

        const data = response.data;
        const allDischarged = data.patients || [];

        const totalItems = data.count || allDischarged.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize) || 1;

        const startIndex = (page - 1) * pagination.pageSize;
        const paginatedPatients = allDischarged.slice(
          startIndex,
          startIndex + pagination.pageSize,
        );

        if (needsCount) {
          cachedTotalCount.current = totalItems;
          cachedTotalPages.current = totalPages;
        }

        setPatients(paginatedPatients);
        setPagination({
          currentPage: page,
          totalPages: cachedTotalPages.current,
          totalCount: cachedTotalCount.current,
          pageSize: pagination.pageSize,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        });
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setError(
          err.response?.data?.message ||
            "Error fetching discharged patient data",
        );
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    },
    [filterOption, sortField, sortOrder, pagination.pageSize],
  );

  const searchPatients = useCallback(async (query: string) => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    setIsSearching(true);
    setError(null);

    try {
      const response = await api.get(
        `/search/patient?query=${encodeURIComponent(query)}`,
        { signal: fetchAbortRef.current.signal },
      );

      const searchResults: Patient[] = (response.data.patients || []).filter(
        (p: Patient) => p.status === "Archived",
      );

      setPatients(searchResults);
      setPagination((prev) => ({
        ...prev,
        currentPage: 1,
        totalPages: 1,
        totalCount: searchResults.length,
        pageSize: prev.pageSize,
        hasNextPage: false,
        hasPrevPage: false,
      }));
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      if (err.response?.status === 404) {
        setPatients([]);
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          pageSize: 20,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } else {
        setError(err.response?.data?.message || "Error searching patients");
        console.error("Error searching patients:", err);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ── Effects ────────────────────────────────

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchInput.trim() === "") {
      cachedTotalCount.current = null;
      cachedTotalPages.current = null;
      fetchPatients(1, { resetCount: true });
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPatients(searchInput.trim());
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput, fetchPatients, searchPatients]);

  useEffect(() => {
    if (searchInput.trim() !== "") return;
    cachedTotalCount.current = null;
    cachedTotalPages.current = null;
    fetchPatients(1, { resetCount: true });
  }, [filterOption, sortField, sortOrder, fetchPatients, searchInput]);

  useEffect(() => {
    if (searchInput.trim() !== "") return;
    fetchPatients(pagination.currentPage);
  }, [pagination.currentPage, fetchPatients, searchInput]);

  useEffect(() => () => fetchAbortRef.current?.abort(), []);

  // ── Handlers ───────────────────────────────

  const handlePageChange = (page: number) => {
    const maxPage = cachedTotalPages.current ?? Infinity;
    if (page < 1 || page > maxPage) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterOption(newFilter);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSortFieldChange = (field: string) => {
    setSortField(field);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePatientClick = (patientId: string) =>
    navigate(`/Patient/${patientId}`);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) searchPatients(searchInput.trim());
  };

  const handleClearSearch = () => setSearchInput("");

  // Handler to un-discharge a patient
  const handleUnarchive = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to un-discharge this patient and restore them to Active status?",
      )
    ) {
      return;
    }

    try {
      await api.post(`/patient/unarchive/${patientId}`);
      fetchPatients(pagination.currentPage, { resetCount: true });
    } catch (err: any) {
      console.error("Failed to un-discharge patient:", err);
      alert(
        err.response?.data?.message ||
          "Failed to un-discharge patient. Please try again.",
      );
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await api.get("/patient/archived");
      const exportData = response.data.patients;

      if (!exportData || exportData.length === 0) {
        alert("No discharged patients found to export.");
        setIsExporting(false);
        return;
      }

      const formattedData = exportData.map((patient: Patient) => ({
        "UHID No.": patient.UHID || "N/A",
        "Client First Name": patient.patient_first_name || "N/A",
        "Client Middle Name": patient.patient_middle_name || "N/A",
        "Client Last Name": patient.patient_last_name || "N/A",
        "Identity Type": patient.identity_card?.type || "N/A",
        "Identity Number": patient.identity_card?.number || "N/A",
        "D.O.B.": patient.date_of_birth
          ? formatDate(patient.date_of_birth)
          : "N/A",
        Age: patient.patient_age || "N/A",
        Education: patient.education || "N/A",
        "Employment/Occupation": patient.occupation || "N/A",
        Religion: "N/A",
        Caste: patient.caste || "N/A",
        Gender: patient.gender || "N/A",
        "Marital Status": patient.marital_status || "N/A",
        "Date of Admission (DOA)": formatDate(
          patient.patient_registration_date,
        ),
        "Discharged Date": formatDate(patient.archived_at),
        "Follow-up Date": patient.follow_Up_Date
          ? formatDate(patient.follow_Up_Date)
          : "Not Scheduled",
        "Relative/Witness Name":
          patient.witness_name || patient.emergency_contact?.name || "N/A",
        "Relative Relationship":
          patient.witness_relationship ||
          patient.emergency_contact?.relationship ||
          "N/A",
        Address:
          patient.patient_address1 ||
          (patient.address
            ? `${patient.address.city || ""} ${patient.address.state || ""}`.trim()
            : "N/A") ||
          "N/A",
        "Mobile No.": patient.patient_phone || "N/A",
        "Relative Mobile No.":
          patient.guardian_phone || patient.emergency_contact?.phone || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Discharged_Patients");

      XLSX.writeFile(
        workbook,
        `Discharged_Patients_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (err: any) {
      console.error("Export failed:", err);
      alert("Failed to export patients. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Pagination helper ──────────────────────

  const getPageNumbers = (): (number | "...")[] => {
    const total = cachedTotalPages.current ?? 0;
    const current = pagination.currentPage;
    const maxVisible = 5;
    const pages: (number | "...")[] = [];

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      if (end - start + 1 < maxVisible - 2) {
        if (start === 2) end = Math.min(total - 1, start + (maxVisible - 3));
        else if (end === total - 1) start = Math.max(2, end - (maxVisible - 3));
      }
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total - 1) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  const dischargedOnPage = patients.filter(
    (p) => p.status === "Archived",
  ).length;
  const newThisWeekOnPage = patients.filter((p) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(p.patient_registration_date).getTime() >= oneWeekAgo;
  }).length;

  const isFilterActive = searchInput.trim() !== "";
  const showPagination = !isFilterActive && (cachedTotalPages.current ?? 0) > 1;

  // ── Render ────────────────────────────────

  return (
    <div className={styles.dashboardLayout}>
      <section className={styles.heroSection}>
        <svg
          className={styles.heroBackgroundSvg}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.7,-76.4C58.3,-69.2,70,-58.5,78.2,-45.5C86.4,-32.5,91.1,-17.2,89.3,-2.6C87.5,12,79.2,25.9,70.1,38.2C61.1,50.5,51.2,61.2,39.2,69.5C27.2,77.7,13.6,83.5,-0.6,84.5C-14.8,85.5,-29.6,81.8,-42.6,74.1C-55.6,66.4,-66.8,54.7,-74.6,41.2C-82.4,27.7,-86.8,12.4,-86.1,-2.7C-85.3,-17.8,-79.4,-32.7,-69.9,-44.9C-60.4,-57.1,-47.4,-66.6,-33.9,-73.9C-20.4,-81.2,-6.4,-86.3,8,-81.4C22.4,-76.5,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
        <div className={styles.heroContent}>
          <div className={styles.heroDetails}>
            <div className={styles.heroHeaderRow}>
              <div>
                <h2 className={`${styles.pageTitle} ${styles.fontHeadline}`}>
                  <FaUsers className={styles.titleIcon} /> Discharged Patients
                </h2>
                <p className={`${styles.pageSubtitle} ${styles.fontBody}`}>
                  Manage and view all discharged patient records
                </p>
              </div>
              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                <button
                  className={styles.btnPrimary}
                  onClick={handleExportExcel}
                  disabled={isExporting}
                >
                  <FaFileExcel size={12} />{" "}
                  {isExporting ? "Exporting..." : "Export in Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className={styles.bentoGrid}>
        <div className={styles.colSpan4}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div className={styles.statIconWrapper}>
              <FaUserMd />
            </div>
            <div>
              <p className={styles.statLabel}>Total Discharged</p>
              <p className={styles.statValue}>
                {cachedTotalCount.current ?? "—"}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.colSpan4}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)" }}
            >
              <FaCheckCircle />
            </div>
            <div>
              <p className={styles.statLabel}>Discharged (this page)</p>
              <p className={styles.statValue}>{dischargedOnPage}</p>
            </div>
          </div>
        </div>
        <div className={styles.colSpan4}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{
                color: "#9333ea",
                background: "rgba(147, 51, 234, 0.1)",
              }}
            >
              <FaCalendarAlt />
            </div>
            <div>
              <p className={styles.statLabel}>Added this week (page)</p>
              <p className={styles.statValue}>{newThisWeekOnPage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main list */}
      <div className={`${styles.bentoCard} ${styles.mainListCard}`}>
        <div className={styles.filtersHeader}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search discharged patients by name, phone, or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${styles.searchInput} ${styles.fontBody}`}
              />
              {searchInput && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={handleClearSearch}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </form>

          <div className={styles.filterControls}>
            <select
              value={filterOption}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={`${styles.selectInput} ${styles.fontBody}`}
              disabled={isFilterActive}
            >
              <option value="all">All Time</option>
              <option value="oneWeek">Last 7 Days</option>
              <option value="oneMonth">Last 30 Days</option>
              <option value="oneYear">Last Year</option>
            </select>
            <select
              value={sortField}
              onChange={(e) => handleSortFieldChange(e.target.value)}
              className={`${styles.selectInput} ${styles.fontBody}`}
              disabled={isFilterActive}
            >
              <option value="patient_registration_date">Sort: Reg Date</option>
              <option value="patient_first_name">Sort: First Name</option>
              <option value="patient_last_name">Sort: Last Name</option>
              <option value="patient_email">Sort: Email</option>
            </select>
            <button
              className={styles.btnSecondaryIcon}
              onClick={handleSortOrderToggle}
              title={`Sorting ${sortOrder.toUpperCase()}`}
              disabled={isFilterActive}
            >
              {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <FaExclamationTriangle /> {error}
          </div>
        )}

        {loading || isSearching ? (
          <div className={styles.centeredState}>
            <div className={styles.spinner} />
            <p className={styles.fontBody}>
              {isSearching
                ? "Searching directory..."
                : "Loading discharged patients..."}
            </p>
          </div>
        ) : patients.length === 0 ? (
          <div className={styles.emptyState}>
            <FaSearchPlus
              size={24}
              style={{
                marginBottom: "0.5rem",
                color: "var(--on-surface-variant)",
              }}
            />
            <p>No discharged patients found matching your criteria.</p>
          </div>
        ) : (
          <div className={styles.stripGrid}>
            {patients.map((patient, index) => (
              <div
                key={patient._id}
                className={styles.stripCard}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handlePatientClick(patient._id)}
              >
                {/* --- LEFT SIDE --- */}
                <div className={styles.stripMain}>
                  {patient.patient_image ? (
                    <img
                      src={patient.patient_image}
                      alt="Avatar"
                      className={styles.avatarImgSmall}
                    />
                  ) : (
                    <div
                      className={styles.stripIcon}
                      style={{ background: "#e5e7eb", color: "#6b7280" }}
                    >
                      {patient.patient_first_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.stripText}>
                    <h4>
                      {patient.patient_first_name} {patient.patient_last_name}
                    </h4>
                    <span className={styles.contactSpan}>
                      <FaPhoneAlt size={10} /> {patient.patient_phone}
                    </span>
                  </div>

                  <div className={`${styles.metaBlock} ${styles.uhidBlock}`}>
                    <span className={styles.metaLabel}>UHID</span>
                    <span className={styles.metaValue}>
                      {patient.UHID || "N/A"}
                    </span>
                  </div>
                </div>

                {/* --- RIGHT SIDE --- */}
                <div className={styles.stripMeta}>
                  <div className={styles.metaBlock}>
                    <span className={styles.metaLabel}>Status</span>
                    <span
                      className={styles.metaValue}
                      style={{ color: "#ef4444" }}
                    >
                      Discharged
                    </span>
                  </div>

                  <div className={styles.metaBlock}>
                    <span className={styles.metaLabel}>Age</span>
                    <span className={styles.metaValue}>
                      {patient.patient_age || "N/A"}
                    </span>
                  </div>

                  <div className={styles.metaBlock}>
                    <span className={styles.metaLabel}>Follow-up Date</span>
                    <span
                      className={styles.metaValue}
                      style={{
                        fontWeight: 600,
                        color: patient.follow_Up_Date ? "#10b981" : "inherit",
                      }}
                    >
                      {patient.follow_Up_Date
                        ? formatDate(patient.follow_Up_Date)
                        : "Not Scheduled"}
                    </span>
                  </div>

                  <div className={styles.metaBlock}>
                    <span className={styles.metaLabel}>Reg Date</span>
                    <span className={styles.metaValue}>
                      {formatDate(patient.patient_registration_date)}
                    </span>
                  </div>
                </div>

                {/* Un-discharge Action */}
                <div className={styles.stripActionsVisible}>
                  <button
                    className={styles.btnSecondaryIcon}
                    onClick={(e) => handleUnarchive(patient._id, e)}
                    title="Un-discharge Patient"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.4rem 0.75rem",
                      gap: "0.4rem",
                    }}
                  >
                    <FaUndo size={12} /> Un-discharge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPagination && (
          <div className={styles.paginationContainer}>
            <span className={styles.paginationText}>
              Showing <strong>{patients.length}</strong>
              {cachedTotalCount.current !== null && (
                <>
                  {" "}
                  of <strong>{cachedTotalCount.current}</strong>
                </>
              )}
            </span>
            <div className={styles.paginationControls}>
              <button
                className={styles.pageButton}
                disabled={!pagination.hasPrevPage}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                <FaChevronLeft size={10} />
              </button>
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`${styles.pageButton} ${
                    page === pagination.currentPage ? styles.activePage : ""
                  }`}
                  onClick={() =>
                    typeof page === "number" && handlePageChange(page)
                  }
                  disabled={page === "..."}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageButton}
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedPatientsList;
