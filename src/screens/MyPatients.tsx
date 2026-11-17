import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/MyPatients.module.css";
import {
  FaUsers,
  FaUserMd,
  FaCheckCircle,
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaPhoneAlt,
  FaExclamationTriangle,
  FaSearchPlus,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Session {
  idToken: string;
}

const useSession = () =>
  useMemo(() => ({ session: { idToken: "mock-token" } as Session }), []);

interface Patient {
  _id: string;
  patient_image?: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email?: string;
  patient_registration_date: string;
  follow_Up_Date?: string; // Sourced directly from backend
  archived_date?: string;
  doctor_id: string;
  doctor_name?: string;
  UHID?: string;
  patient_age?: string;
  care_team?: Array<{
    role: string;
    doctor_name: string;
  }>;
  treatment_days?: number;
  referral_source?:
    | "Social Media"
    | "walkin"
    | "Doctor Reference"
    | "Patient Reference"
    | "Hospital Reference"
    | "Other";
  referral_details?: string;
  status?: "Active" | "Inactive" | "Archived";
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const getDaysSinceRegistration = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    const regDate = new Date(dateString);
    if (isNaN(regDate.getTime())) return "N/A";

    const today = new Date();

    const regDateMidnight = new Date(
      regDate.getFullYear(),
      regDate.getMonth(),
      regDate.getDate(),
    );
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const diffTime = todayMidnight.getTime() - regDateMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays < 0) return "N/A";
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  } catch {
    return "N/A";
  }
};

const FaSortUp = () => <span style={{ fontSize: "0.7rem" }}>▲</span>;
const FaSortDown = () => <span style={{ fontSize: "0.7rem" }}>▼</span>;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const MyPatients: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  const STORAGE_KEY = "myPatientsState";
  const savedState = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [patientStatus, setPatientStatus] = useState<string>(
    savedState.patientStatus || "active",
  );
  const [filterOption, setFilterOption] = useState<string>(
    savedState.filterOption || "all",
  );
  const [sortField, setSortField] = useState<string>(
    savedState.sortField || "patient_registration_date",
  );
  const [sortOrder, setSortOrder] = useState<string>(
    savedState.sortOrder || "desc",
  );
  const [searchInput, setSearchInput] = useState<string>(
    savedState.searchInput || "",
  );

  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: savedState.currentPage || 1,
    totalPages: null,
    totalCount: null,
    pageSize: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const cachedTotalCount = useRef<number | null>(null);
  const cachedTotalPages = useRef<number | null>(null);

  const [isSearching, setIsSearching] = useState<boolean>(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentPage: pagination.currentPage,
        patientStatus,
        filterOption,
        sortField,
        sortOrder,
        searchInput,
      }),
    );
  }, [
    pagination.currentPage,
    patientStatus,
    filterOption,
    sortField,
    sortOrder,
    searchInput,
  ]);

  // ── Fetch ──────────────────────────────────

  const fetchPatients = useCallback(
    async (page: number, opts: { resetCount?: boolean } = {}) => {
      if (!session?.idToken) return;

      fetchAbortRef.current?.abort();
      fetchAbortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const needsCount = page === 1 || opts.resetCount;

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.pageSize.toString(),
          sortBy: sortField,
          sortOrder,
          filterByTime: filterOption,
          status: patientStatus,
          ...(needsCount ? { includeCount: "true" } : {}),
        });

        const response = await api.get("/patient/getAllMy", {
          params,
          signal: fetchAbortRef.current.signal,
        });

        const data = response.data;

        if (data.totalCount !== null && data.totalCount !== undefined) {
          cachedTotalCount.current = data.totalCount;
        }
        if (data.totalPages !== null && data.totalPages !== undefined) {
          cachedTotalPages.current = data.totalPages;
        }

        setPatients(data.patients);
        setPagination((prev) => ({
          ...prev,
          currentPage: data.currentPage,
          totalPages: cachedTotalPages.current,
          totalCount: cachedTotalCount.current,
          pageSize: data.pageSize ?? prev.pageSize,
          hasNextPage: data.hasNextPage,
          hasPrevPage: data.hasPrevPage,
        }));
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setError(err.response?.data?.message || "Error fetching patient data");
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      session?.idToken,
      patientStatus,
      filterOption,
      sortField,
      sortOrder,
      pagination.pageSize,
    ],
  );

  const searchPatients = useCallback(
    async (query: string) => {
      fetchAbortRef.current?.abort();
      fetchAbortRef.current = new AbortController();

      setIsSearching(true);
      setError(null);

      try {
        const response = await api.get(
          `/search/doctor-patient?query=${encodeURIComponent(query)}`,
          { signal: fetchAbortRef.current.signal },
        );

        const searchResults: Patient[] = (response.data.patients || []).filter(
          (p: Patient) => {
            if (patientStatus === "archived") return p.status === "Archived";
            if (patientStatus === "active") return p.status !== "Archived";
            return true;
          },
        );
        setPatients(searchResults);

        setPagination((prev) => ({
          ...prev,
          currentPage: 1,
          totalPages: 1,
          totalCount: searchResults.length,
          hasNextPage: false,
          hasPrevPage: false,
        }));
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        if (err.response?.status === 404) {
          setPatients([]);
          setPagination((prev) => ({
            ...prev,
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }));
        } else {
          setError(err.response?.data?.message || "Error searching patients");
          console.error("Error searching patients:", err);
        }
      } finally {
        setIsSearching(false);
        setLoading(false);
      }
    },
    [patientStatus],
  );

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchInput.trim() !== "") {
      searchTimeoutRef.current = setTimeout(() => {
        searchPatients(searchInput.trim());
      }, 500);
      return;
    }

    fetchPatients(pagination.currentPage, {
      resetCount: pagination.currentPage === 1,
    });

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [
    searchInput,
    patientStatus,
    filterOption,
    sortField,
    sortOrder,
    pagination.currentPage,
    fetchPatients,
    searchPatients,
  ]);

  useEffect(() => () => fetchAbortRef.current?.abort(), []);

  // ── Handlers ───────────────────────────────

  const handlePageChange = (page: number) => {
    const maxPage = cachedTotalPages.current ?? Infinity;
    if (page < 1 || page > maxPage) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePatientStatusChange = (value: string) => {
    setPatientStatus(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (value: string) => {
    setFilterOption(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSortFieldChange = (value: string) => {
    setSortField(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePatientClick = (patientId: string) =>
    navigate(`/patient/${patientId}`);

  const handleRegisterPatient = () => navigate("/registerPatient");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) searchPatients(searchInput.trim());
  };

  const handleClearSearch = () => setSearchInput("");

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

  // ── Derived stats ──
  const activeOnPage = patients.filter((p) => p.status !== "Archived").length;
  const archivedOnPage = patients.filter((p) => p.status === "Archived").length;
  const newThisWeekOnPage = patients.filter((p) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(p.patient_registration_date).getTime() >= oneWeekAgo;
  }).length;

  const isSearchActive = searchInput.trim() !== "";
  const showPagination = !isSearchActive && (cachedTotalPages.current ?? 0) > 1;

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
                  <FaUsers className={styles.titleIcon} /> My Patients
                </h2>
                <p className={`${styles.pageSubtitle} ${styles.fontBody}`}>
                  Manage, search, and view your patient directory
                </p>
              </div>
              <button
                className={styles.btnPrimary}
                onClick={handleRegisterPatient}
              >
                <FaPlus size={12} /> Add New Patient
              </button>
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
              <p className={styles.statLabel}>Total Patients (Filtered)</p>
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
              style={{
                color: patientStatus === "archived" ? "#ef4444" : "#16a34a",
                background:
                  patientStatus === "archived"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(22, 163, 74, 0.1)",
              }}
            >
              <FaCheckCircle />
            </div>
            <div>
              <p className={styles.statLabel}>
                {patientStatus === "archived"
                  ? "Discharged (this page)"
                  : "Active (this page)"}
              </p>
              <p className={styles.statValue}>
                {patientStatus === "archived" ? archivedOnPage : activeOnPage}
              </p>
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
              <p className={styles.statLabel}>New this week (page)</p>
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
                placeholder="Search by name, phone, or email..."
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
              value={patientStatus}
              onChange={(e) => handlePatientStatusChange(e.target.value)}
              className={`${styles.selectInput} ${styles.fontBody}`}
              disabled={isSearchActive}
            >
              <option value="active">Active Patients</option>
              <option value="archived">Discharged Patients</option>
              <option value="all">All Patients</option>
            </select>
            <select
              value={filterOption}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={`${styles.selectInput} ${styles.fontBody}`}
              disabled={isSearchActive}
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
              disabled={isSearchActive}
            >
              <option value="patient_registration_date">Sort: Reg Date</option>
              <option value="patient_first_name">Sort: First Name</option>
              <option value="patient_last_name">Sort: Last Name</option>
            </select>
            <button
              className={styles.btnSecondaryIcon}
              onClick={handleSortOrderToggle}
              title={`Sorting ${sortOrder.toUpperCase()}`}
              disabled={isSearchActive}
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
              {isSearching ? "Searching directory..." : "Loading patients..."}
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
            <p>No patients found matching your criteria.</p>
          </div>
        ) : (
          <div className={styles.stripGrid}>
            {patients.map((patient, index) => {
              const isArchived = patient.status === "Archived";

              return (
                <div
                  key={patient._id}
                  className={styles.stripCard}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    opacity: isArchived ? 0.85 : 1,
                  }}
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
                        style={
                          isArchived
                            ? { background: "#e5e7eb", color: "#6b7280" }
                            : {}
                        }
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
                    {isArchived && (
                      <div className={styles.metaBlock}>
                        <span className={styles.metaLabel}>Status</span>
                        <span
                          className={styles.metaValue}
                          style={{ color: "#ef4444" }}
                        >
                          Discharged
                        </span>
                      </div>
                    )}

                    <div className={styles.metaBlock}>
                      <span className={styles.metaLabel}>Age</span>
                      <span className={styles.metaValue}>
                        {patient.patient_age || "N/A"}
                      </span>
                    </div>

                    {isArchived ? (
                      <div className={styles.metaBlock}>
                        <span className={styles.metaLabel}>Follow-up Date</span>
                        <span
                          className={styles.metaValue}
                          style={{
                            fontWeight: 600,
                            color: patient.follow_Up_Date
                              ? "#10b981"
                              : "inherit",
                          }}
                        >
                          {patient.follow_Up_Date
                            ? formatDate(patient.follow_Up_Date)
                            : "Not Scheduled"}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>
                            Head Counsellor
                          </span>
                          <span className={styles.metaValue}>
                            {patient.care_team?.find(
                              (member) => member.role === "Head Counselor",
                            )?.doctor_name || "N/A"}
                          </span>
                        </div>
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>
                            Treatment Days
                          </span>
                          <span className={styles.metaValue}>
                            {patient.treatment_days !== undefined
                              ? patient.treatment_days
                              : "N/A"}{" "}
                            /{" "}
                            {getDaysSinceRegistration(
                              patient.patient_registration_date,
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div className={styles.metaBlock}>
                      <span className={styles.metaLabel}>Reg Date</span>
                      <span className={styles.metaValue}>
                        {formatDate(patient.patient_registration_date)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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

export default MyPatients;
