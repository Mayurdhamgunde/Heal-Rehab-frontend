import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  User,
  ArrowRight,
  Activity,
  Search,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../utils/central"; // Adjust path as needed
import styles from "../css/CompletedPlansList.module.css";

interface TherapySession {
  _id: string;
  status: string;
  date: string;
  session_number: number;
}

interface CompletedPlan {
  _id: string;
  therapy_name: string;
  patient_name: string;
  patient_image: string | null;
  patient_diagnosis: string;
  patient_symptoms: string;
  patient_therapy_category: string;
  therapy_start: string;
  therapy_end: string;
  closure_date?: string;
  closure_reason?: string;
  estimated_sessions: number;
  completed_sessions: number;
  status: string;
  balance: string;
  total_amount: string;
  therapy_sessions: TherapySession[];
}

type TimeFilter = "all" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

const getClosureConfig = (reason?: string) => {
  const r = (reason || "completed").toLowerCase();
  switch (r) {
    case "incomplete":
      return { color: "#f59e0b", label: "Incomplete" }; // Orange
    case "dropout":
      return { color: "#ef4444", label: "Dropout" }; // Red
    case "refer":
      return { color: "#3b82f6", label: "Referred" }; // Blue
    case "opd":
      return { color: "#8b5cf6", label: "OPD" }; // Purple
    case "completed":
    default:
      return { color: "#16a34a", label: "Completed" }; // Green
  }
};

const calculateTherapyProgressByDays = (
  start: string,
  end: string,
  status?: string,
  closureDate?: string,
): number => {
  try {
    if (!start || !end) return 0;

    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const total = endDate - startDate;

    if (total <= 0) return 100;

    let targetDate = new Date().getTime(); // Default to now if incomplete

    // If completed or closed, determine if it finished early
    if (closureDate || status?.toLowerCase() === "completed") {
      if (closureDate) {
        const closedDate = new Date(closureDate).getTime();
        if (closedDate < endDate) {
          targetDate = closedDate; // Calculate based on the early completion date
        } else {
          return 100; // Completed on or after the planned date
        }
      } else {
        return 100; // Fallback if completed but no closure date exists
      }
    }

    const elapsed = targetDate - startDate;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  } catch (err) {
    return 0;
  }
};

const CompletedPlansList: React.FC = () => {
  const [plans, setPlans] = useState<CompletedPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Split loading states: full-page spinner only for the very first load;
  // a lightweight inline indicator for every fetch after that (so the
  // search input never unmounts and never loses focus).
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedOnce = useRef(false);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 10;

  const navigate = useNavigate();

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // reset to first page on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    timeFilter,
    customStartDate,
    customEndDate,
    debouncedSearch,
  ]);

  const fetchData = async () => {
    if (timeFilter === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }

    setIsFetching(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit,
      };

      if (timeFilter !== "all") {
        params.filter = timeFilter;
        if (timeFilter === "custom") {
          params.startDate = customStartDate;
          params.endDate = customEndDate;
        }
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await api.get("/get/completed/plans", { params });
      const fetchedPlans: CompletedPlan[] = response.data.completed_plans || [];
      setPlans(fetchedPlans);

      const pagination = response.data.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching completed plans:", error);
      alert("Failed to load completed plans.");
    } finally {
      setIsFetching(false);
      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        setInitialLoading(false);
      }
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleCardClick = (planId: string) => {
    navigate(`/planDetails/${planId}`);
  };

  const handleTimeFilterChange = (value: TimeFilter) => {
    setTimeFilter(value);
    setCurrentPage(1);
    if (value !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Only the very first load shows the full-page spinner.
  if (initialLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading completed plans...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Completed Therapy Plans</h1>
        </div>

        <div className={styles.controlsWrapper}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Time Filter + Custom Date Range (grouped so they never split lines) */}
          <div className={styles.timeFilterGroup}>
            <div className={styles.filterWrapper}>
              <Calendar size={16} color="#64748b" />
              <select
                value={timeFilter}
                onChange={(e) =>
                  handleTimeFilterChange(e.target.value as TimeFilter)
                }
                className={styles.filterSelect}
              >
                <option value="all">All Time</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {timeFilter === "custom" && (
              <div className={styles.customDateWrapper}>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={styles.dateInput}
                  max={customEndDate || undefined}
                />
                <span className={styles.dateRangeSeparator}>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={styles.dateInput}
                  min={customStartDate || undefined}
                />
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === "card" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("card")}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === "table" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Plan Status Tabs */}
      <div className={styles.planTabs}>
        <button
          className={styles.planTab}
          onClick={() => navigate("/ActivePlans")}
        >
          <Clock size={15} />
          Active Plans
        </button>
        <button
          className={`${styles.planTab} ${styles.planTabActive}`}
          disabled
        >
          <CheckCircle2 size={15} />
          Completed Plans
          <span className={styles.tabCount}>{totalCount}</span>
        </button>
      </div>

      {/* Content area */}
      {isFetching ? (
        <div className={styles.inlineLoadingState}>
          <Loader2 className={styles.spinner} size={32} />
          <p>Loading...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No completed plans found matching your criteria.</p>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className={styles.tableContainer}>
          <table className={styles.plansTable}>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Therapy Plan</th>
                <th>Category</th>
                <th>Progress</th>
                <th>Closed On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const config = getClosureConfig(plan.closure_reason);
                const progress = calculateTherapyProgressByDays(
                  plan.therapy_start,
                  plan.therapy_end,
                  plan.status,
                  plan.closure_date,
                );

                return (
                  <tr
                    key={plan._id}
                    className={styles.tableRow}
                    onClick={() => handleCardClick(plan._id)}
                  >
                    <td>
                      <div className={styles.patientInfo}>
                        {plan.patient_image ? (
                          <img
                            src={plan.patient_image}
                            alt={plan.patient_name}
                            className={styles.avatar}
                            style={{ width: "32px", height: "32px" }}
                          />
                        ) : (
                          <div
                            className={styles.avatarFallback}
                            style={{ width: "32px", height: "32px" }}
                          >
                            <User size={16} />
                          </div>
                        )}
                        <span className={styles.patientName}>
                          {plan.patient_name}
                        </span>
                      </div>
                    </td>
                    <td>{plan.therapy_name}</td>
                    <td>{plan.patient_therapy_category}</td>
                    <td style={{ width: "25%" }}>
                      <div
                        className={styles.progressHeader}
                        style={{ marginBottom: "4px" }}
                      >
                        <span
                          style={{
                            color: config.color,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {config.label}
                        </span>
                        <span className={styles.progressPercent}>
                          {progress}%
                        </span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${progress}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                    </td>
                    <td>{formatDate(plan.closure_date || plan.therapy_end)}</td>
                    <td>
                      <span
                        className={styles.tableStatus}
                        style={{
                          color: config.color,
                          backgroundColor: `${config.color}20`,
                        }}
                      >
                        {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className={styles.cardsGrid}>
          {plans.map((plan) => {
            const config = getClosureConfig(plan.closure_reason);
            const progress = calculateTherapyProgressByDays(
              plan.therapy_start,
              plan.therapy_end,
              plan.status,
              plan.closure_date,
            );

            return (
              <div
                key={plan._id}
                className={styles.card}
                onClick={() => handleCardClick(plan._id)}
              >
                {/* Top Section */}
                <div className={styles.cardHeader}>
                  <div className={styles.patientInfo}>
                    {plan.patient_image ? (
                      <img
                        src={plan.patient_image}
                        alt={plan.patient_name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        <User size={20} />
                      </div>
                    )}
                    <div className={styles.patientDetailsText}>
                      <h3 className={styles.patientName}>
                        {plan.patient_name}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={styles.daysBadge}
                    style={{ backgroundColor: config.color }}
                  >
                    <span className={styles.daysText}>
                      {config.label.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Middle Section */}
                <div className={styles.planInfo}>
                  <span className={styles.planLabel}>Therapy Plan</span>
                  <h4 className={styles.planTitle}>{plan.therapy_name}</h4>
                </div>

                {/* Progress Section */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span
                      className={styles.progressLabel}
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className={styles.progressPercent}>{progress}%</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${progress}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                  <div className={styles.progressDates}>
                    <span>Start: {formatDate(plan.therapy_start)}</span>
                    <span>
                      Closed:{" "}
                      {formatDate(plan.closure_date || plan.therapy_end)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className={styles.cardFooter}>
                  <span
                    className={styles.footerActionText}
                    style={{ color: config.color }}
                  >
                    View Plan Details{" "}
                    <Activity size={14} style={{ marginLeft: "4px" }} />
                  </span>
                  <div className={styles.arrowCircle}>
                    <ArrowRight size={14} color={config.color} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!isFetching && totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <button
            className={styles.paginationBtn}
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <span className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.paginationBtn}
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CompletedPlansList;
