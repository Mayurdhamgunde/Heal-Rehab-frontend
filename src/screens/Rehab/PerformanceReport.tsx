import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../../css/Rehab/PerformanceReport.module.css";
import api from "../../utils/central";
import {
  FaChartLine,
  FaCheckCircle,
  FaUsers,
  FaUserMd,
  FaExclamationTriangle,
  FaSearchPlus,
  FaSortUp,
  FaSortDown,
  FaMedal,
  FaFileMedicalAlt,
} from "react-icons/fa";

// ─────────────────────────────────────────────
// Types (Mapped from Backend Response)
// ─────────────────────────────────────────────

interface AssessmentBreakdown {
  assessment_name: string;
  template_id: string;
  count: number;
  completed: number;
  draft: number;
  unique_patients: number;
  latest_date: string;
  earliest_date: string;
}

interface DoctorAnalytics {
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctor_photo: string | null;
  doctor_specialization: string | null;
  doctor_status: string;
  totalAssessments: number;
  totalCompleted: number;
  totalDraft: number;
  completionRate: number;
  uniquePatients: number;
  assignedPatients: number;
  assessmentBreakdown: AssessmentBreakdown[];
  mostUsedAssessment: { name: string; count: number } | null;
  dateRange: { earliest: string | null; latest: string | null };
}

interface AggregateStats {
  totalDoctors: number;
  totalAssessments: number;
  totalCompleted: number;
  totalDraft: number;
  totalUniquePatients: number;
  averageCompletionRate: number;
}

interface TopPerformers {
  mostAssessments: {
    doctor_name: string;
    totalAssessments: number;
    doctor_photo: string | null;
  } | null;
  mostUniquePatients: {
    doctor_name: string;
    uniquePatients: number;
    doctor_photo: string | null;
  } | null;
  highestCompletionRate: {
    doctor_name: string;
    completionRate: number;
    doctor_photo: string | null;
  } | null;
}

interface PerformanceData {
  filters: any;
  aggregateStats: AggregateStats;
  topPerformers: TopPerformers;
  doctors: DoctorAnalytics[];
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const PerformanceReport: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState<string>("thisMonth");
  const [sortField, setSortField] = useState<string>("totalAssessments");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const fetchAbortRef = useRef<AbortController | null>(null);

  // ── Fetch Data ─────────────────────────────

  const fetchPerformanceData = useCallback(async () => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Build parameters based on selected filter
      const params: Record<string, string> = {
        sortBy: sortField,
        sortOrder: sortOrder,
        includeInactive: "false",
      };

      if (filterPeriod === "thisMonth") {
        const now = new Date();
        params.month = (now.getMonth() + 1).toString();
        params.year = now.getFullYear().toString();
      } else if (filterPeriod === "lastMonth") {
        const now = new Date();
        now.setMonth(now.getMonth() - 1);
        params.month = (now.getMonth() + 1).toString();
        params.year = now.getFullYear().toString();
      }

      const response = await api.get("/get/typemonthly/assessments", {
        params,
        signal: fetchAbortRef.current.signal,
      });

      if (response.data.success) {
        setData(response.data);
      } else {
        setError(response.data.message || "Failed to retrieve analytics.");
      }
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      setError(err.response?.data?.error || "Error fetching performance data");
      console.error("Error fetching performance data:", err);
    } finally {
      setLoading(false);
    }
  }, [filterPeriod, sortField, sortOrder]);

  // ── Effects ────────────────────────────────

  useEffect(() => {
    fetchPerformanceData();
    return () => fetchAbortRef.current?.abort();
  }, [fetchPerformanceData]);

  // ── Handlers & Helpers ─────────────────────

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getOverallMostTakenAssessment = () => {
    if (!data || !data.doctors || data.doctors.length === 0) return "—";

    const tally: Record<string, number> = {};
    data.doctors.forEach((doc) => {
      doc.assessmentBreakdown.forEach((ab) => {
        tally[ab.assessment_name] = (tally[ab.assessment_name] || 0) + ab.count;
      });
    });

    let topName = "—";
    let maxCount = 0;
    Object.entries(tally).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topName = name;
      }
    });

    return maxCount > 0 ? `${topName} (${maxCount})` : "—";
  };

  const colStyle = { gridColumn: "span 12" };
  const getDesktopColStyle = () => {
    return window.innerWidth > 768 ? { gridColumn: "span 3" } : colStyle;
  };

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
                  <FaChartLine className={styles.titleIcon} /> Performance
                  Report
                </h2>
                <p className={`${styles.pageSubtitle} ${styles.fontBody}`}>
                  Monitor assessment metrics, completion rates, and provider
                  statistics
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aggregate Stats Grid */}
      <div className={styles.bentoGrid}>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div className={styles.statIconWrapper}>
              <FaMedal />
            </div>
            <div>
              <p className={styles.statLabel}>Total Assessments</p>
              <p className={styles.statValue}>
                {data?.aggregateStats.totalAssessments ?? "—"}
              </p>
            </div>
          </div>
        </div>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#16a34a", background: "rgba(22, 163, 74, 0.1)" }}
            >
              <FaCheckCircle />
            </div>
            <div>
              <p className={styles.statLabel}>Avg Completion Rate</p>
              <p className={styles.statValue}>
                {data?.aggregateStats.averageCompletionRate !== undefined
                  ? `${data.aggregateStats.averageCompletionRate}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{
                color: "#9333ea",
                background: "rgba(147, 51, 234, 0.1)",
              }}
            >
              <FaUsers />
            </div>
            <div>
              <p className={styles.statLabel}>Unique Patients Reached</p>
              <p className={styles.statValue}>
                {data?.aggregateStats.totalUniquePatients ?? "—"}
              </p>
            </div>
          </div>
        </div>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{
                color: "#eab308",
                background: "rgba(234, 179, 8, 0.1)",
              }}
            >
              <FaFileMedicalAlt />
            </div>
            <div>
              <p className={styles.statLabel}>Overall Most Taken</p>
              <p
                className={styles.statValue}
                style={{
                  fontSize: "0.85rem",
                  lineHeight: "1.3",
                  wordBreak: "break-word",
                }}
                title={getOverallMostTakenAssessment()}
              >
                {getOverallMostTakenAssessment()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className={`${styles.bentoCard} ${styles.mainListCard}`}>
        <div className={styles.filtersHeader}>
          <div className={styles.searchForm}>
            <h3
              className={styles.fontHeadline}
              style={{
                fontSize: "1.1rem",
                margin: 0,
                color: "var(--on-secondary-fixed)",
              }}
            >
              Provider Leaderboard
            </h3>
          </div>

          <div className={styles.filterControls}>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className={`${styles.selectInput} ${styles.fontBody}`}
            >
              <option value="allTime">All Time</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className={`${styles.selectInput} ${styles.fontBody}`}
            >
              <option value="totalAssessments">Sort: Total Assessments</option>
              <option value="uniquePatients">Sort: Unique Patients</option>
              <option value="completionRate">Sort: Completion Rate</option>
              <option value="doctorName">Sort: Provider Name</option>
            </select>
            <button
              className={styles.btnSecondaryIcon}
              onClick={handleSortOrderToggle}
              title={`Sorting ${sortOrder.toUpperCase()}`}
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

        {loading ? (
          <div className={styles.centeredState}>
            <div className={styles.spinner} />
            <p className={styles.fontBody}>Crunching the numbers...</p>
          </div>
        ) : !data || data.doctors.length === 0 ? (
          <div className={styles.emptyState}>
            <FaSearchPlus
              size={24}
              style={{
                marginBottom: "0.5rem",
                color: "var(--on-surface-variant)",
              }}
            />
            <p>No assessment data found for this period.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Specialists</th>
                  <th>Assessments</th>
                  <th>Completion</th>
                  <th>Unique Patients</th>
                  <th>Most Taken</th>
                </tr>
              </thead>
              <tbody>
                {data.doctors.map((doctor, index) => (
                  <tr
                    key={doctor.doctor_id}
                    className={styles.tableRow}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <td>
                      <div className={styles.providerCell}>
                        {doctor.doctor_photo ? (
                          <img
                            src={doctor.doctor_photo}
                            alt="Provider Avatar"
                            className={styles.avatarImgSmall}
                          />
                        ) : (
                          <div className={styles.stripIcon}>
                            <FaUserMd size={14} />
                          </div>
                        )}
                        <span className={styles.providerName}>
                          {doctor.doctor_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.assessmentsCell}>
                        <span className={styles.mainStat}>
                          {doctor.totalAssessments}
                        </span>
                        <span className={styles.subStat}>
                          ({doctor.totalCompleted} Done)
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={styles.completionStat}
                        style={{
                          color:
                            doctor.completionRate === 100
                              ? "#16a34a"
                              : "inherit",
                        }}
                      >
                        {doctor.completionRate}%
                      </span>
                    </td>
                    <td>
                      <span className={styles.mainStat}>
                        {doctor.uniquePatients}
                      </span>
                    </td>
                    <td className={styles.mostTakenCell}>
                      <span
                        title={
                          doctor.mostUsedAssessment?.name
                            ? `${doctor.mostUsedAssessment.name} (${doctor.mostUsedAssessment.count})`
                            : "N/A"
                        }
                      >
                        {doctor.mostUsedAssessment?.name
                          ? `${doctor.mostUsedAssessment.name} (${doctor.mostUsedAssessment.count})`
                          : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceReport;
