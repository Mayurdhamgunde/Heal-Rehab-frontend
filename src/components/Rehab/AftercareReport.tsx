// src/pages/AftercareReport.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaCalendarAlt,
  FaFilter,
  FaChartPie,
  FaUserInjured,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import api from "../../utils/central"; // Adjust path as needed
import styles from "../../css/Rehab/AftercareReport.module.css";

// --- Interfaces based on Backend Response ---
interface ReferencePlan {
  plan_id: string;
  therapy_name: string;
  status: string;
  closure_date: string | null;
  closure_reason: string | null;
}

interface AftercareStats {
  total_aftercare_sessions: number;
  conducted_count: number;
  scheduled_count: number;
  other_status_count: number;
}

interface ReportPatient {
  patient_id: string;
  uhid: string | null;
  name: string;
  patient_image: string | null;
  therapy_plans: ReferencePlan[];
  aftercare_stats: AftercareStats;
}

interface GlobalStatistics {
  total_patients_reported: number;
  total_aftercare_sessions_matched: number;
}

interface AftercareReportData {
  report_type: string;
  applied_filters: Record<string, any>;
  global_statistics: GlobalStatistics;
  patients: ReportPatient[];
}

// ── Utility: format any date string to dd/mm/yyyy ──────────────────────────
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const AftercareReport: React.FC = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<AftercareReportData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [nameSearch, setNameSearch] = useState(""); // ← client-side name filter

  const fetchReport = async (
    overrides: { from?: string; to?: string; status?: string } = {},
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const from = "from" in overrides ? overrides.from : fromDate;
      const to = "to" in overrides ? overrides.to : toDate;
      const status = "status" in overrides ? overrides.status : statusFilter;

      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (status) params.append("status", status);

      const response = await api.get(
        `/conducted/aftercares?${params.toString()}`,
      );
      setReportData(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch aftercare report.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("");
    setNameSearch("");
    // Fetch with empty filter params — no stale-closure issue
    fetchReport({ from: "", to: "", status: "" });
  };

  const goToPatient = (patientId: string) => {
    navigate(`/Patient/${patientId}`);
  };

  if (loading && !reportData) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHeader}></div>
        <div className={styles.skeletonCard}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error Loading Report</h2>
          <p>{error}</p>
          <button onClick={() => fetchReport()} className={styles.outlineBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { global_statistics, patients } = reportData || {};

  // Client-side name filter (case-insensitive, trims whitespace)
  const visiblePatients = (patients || []).filter((patient) => {
    if (!nameSearch.trim()) return true;
    const q = nameSearch.trim().toLowerCase();
    return (patient.name || "").toLowerCase().includes(q);
  });

  return (
    <div className={styles.container}>
      {/* HERO PANEL - GLOBAL STATISTICS */}
      <div className={styles.heroPanel}>
        <div className={styles.heroLeft}>
          <div className={styles.reportIconWrapper}>
            <FaFileAlt className={styles.reportIcon} />
          </div>
          <div className={styles.heroHeaders}>
            <h2 className={styles.reportTitle}>Aftercare Report</h2>
            <p className={styles.reportSubtitle}>
              Tracking aftercare sessions completed and remaining, per patient
            </p>
          </div>
        </div>

        <div className={styles.heroCenter}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>PATIENTS</span>
            <span className={styles.statValue}>
              {global_statistics?.total_patients_reported || 0}
            </span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>SESSIONS</span>
            <span className={styles.statValue}>
              {global_statistics?.total_aftercare_sessions_matched || 0}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className={styles.filterCard}>
        <form onSubmit={handleApplyFilters} className={styles.filterForm}>
          {/* Name search — client-side */}
          <div className={styles.filterGroup}>
            <label>
              <FaSearch /> Search by Name
            </label>
            <input
              type="text"
              placeholder="Patient name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className={styles.filterInput}
              style={{ minWidth: "180px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>
              <FaCalendarAlt /> From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>
              <FaCalendarAlt /> To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>
              <FaFilter /> Session Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterInput}
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className={styles.filterActions}>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.actionBtn} ${styles.primaryBtn} ${
                loading ? styles.btnLoading : ""
              }`}
            >
              {loading && reportData ? (
                <span className={styles.btnSpinner} />
              ) : (
                <FaSearch />
              )}
              {loading && reportData ? "Applying..." : "Apply Filters"}
            </button>

            {/* Show only when at least one filter has a value */}
            {(fromDate || toDate || statusFilter || nameSearch) && (
              <button
                type="button"
                disabled={loading}
                onClick={handleClearFilters}
                className={`${styles.actionBtn} ${styles.clearBtn}`}
              >
                <FaTimes className={styles.clearIcon} /> Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* REPORT DATA: PATIENT TABLE */}
      <div className={styles.plansWrapper}>
        {/* Overlay shown only on subsequent filter fetches (not initial load) */}
        {loading && reportData && (
          <div className={styles.filterOverlay}>
            <div className={styles.overlayInner}>
              <span className={styles.overlaySpinner} />
              <span className={styles.overlayText}>Applying filters…</span>
            </div>
          </div>
        )}

        <div
          className={`${styles.tableCard} ${
            loading && reportData ? styles.plansBlurred : ""
          }`}
        >
          {visiblePatients.length > 0 ? (
            <table className={styles.aftercareTable}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>UHID</th>
                  <th>Reference Plan</th>
                  <th>Done</th>
                  <th>Remaining</th>
                  <th>Last Closure</th>
                </tr>
              </thead>
              <tbody>
                {visiblePatients.map((patient) => {
                  const latestPlan = patient.therapy_plans?.[0] || null;
                  return (
                    <tr
                      key={patient.patient_id}
                      className={styles.tableRow}
                      onClick={() => goToPatient(patient.patient_id)}
                    >
                      <td>
                        <div className={styles.patientCell}>
                          {patient.patient_image ? (
                            <img
                              src={patient.patient_image}
                              alt={patient.name}
                              className={styles.patientAvatarSm}
                            />
                          ) : (
                            <div className={styles.patientAvatarFallbackSm}>
                              <FaUserInjured />
                            </div>
                          )}
                          <span>{patient.name || "Unknown Patient"}</span>
                        </div>
                      </td>
                      <td>{patient.uhid || "N/A"}</td>
                      <td>
                        {latestPlan ? (
                          <span className={styles.categoryBadge}>
                            {latestPlan.therapy_name}
                          </span>
                        ) : (
                          <span className={styles.mutedText}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.doneCount}>
                          {patient.aftercare_stats.conducted_count}
                        </span>
                      </td>
                      <td>
                        <span className={styles.remainingCount}>
                          {patient.aftercare_stats.scheduled_count}
                        </span>
                      </td>
                      <td>{formatDate(latestPlan?.closure_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyDashedBox} style={{ height: "240px" }}>
              <FaChartPie className={styles.emptyIcon} />
              <span>
                {nameSearch.trim()
                  ? `No patients found matching "${nameSearch}".`
                  : "No patients with aftercare sessions match your criteria."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AftercareReport;
