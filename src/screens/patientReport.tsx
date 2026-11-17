import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Clock,
  Download,
  X,
  User,
  Stethoscope,
  Filter,
  RefreshCcw,
} from "lucide-react";
import styles from "../css/DoctorReport.module.css";
import api from "../utils/central";

interface TherapyReportItem {
  plan_id: string;
  therapy_start: string; // ✅ ADDED
  closure_date: string;
  started_by_doctor: string;
  completed_by_doctor: string;
  patient_name: string;
  patient_phone: string;
  therapy_name: string;
  category: string;
  sessions_formatted: string;
  total_amount: number;
  received_amount: number;
  balance: number;
  outcome: string;
  reason: string;
}

interface ReportSummary {
  total_records: number;
  total_amount: number;
  total_received: number;
  total_balance: number;
}

const PatientReport = () => {
  const [plans, setPlans] = useState<TherapyReportItem[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [period, setPeriod] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // -- Filters State --
  const [filters, setFilters] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
    therapy_category: "",
    min_amount: "",
    max_amount: "",
  });

  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clean up empty filter values before sending
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(
        `/doctor/therapy/analytics?${params.toString()}`,
      );

      if (response.data.success) {
        setPlans(response.data.data || []);
        setSummary(response.data.summary);
        setPeriod(response.data.period);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load closure report");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if already formatted or invalid

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleClearFilters = () => {
    setFilters({
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      startDate: "",
      endDate: "",
      therapy_category: "",
      min_amount: "",
      max_amount: "",
    });
  };

  const handleExport = async (format: "excel" | "pdf") => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const endpoint =
        format === "excel"
          ? "/doctor/therapy/analytics/excel"
          : "/doctor/therapy/analytics/pdf";

      const response = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          format === "excel" ? "application/vnd.ms-excel" : "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement("a"));
      link.href = url;
      link.download = `Patient_Progress_Report_${filters.year}_${filters.month}.${format === "excel" ? "xlsx" : "pdf"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (error) {
      alert("Export failed. Please check if the export service is configured.");
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.sectionTitle}>
            Patient Progress & Closure Report
          </h2>
          <div className={styles.resultsCount}>
            Period: <strong>{period}</strong> | Total:{" "}
            {summary?.total_records || 0} Records
          </div>
        </div>
        <button
          className={styles.exportButton}
          onClick={() => setShowExportModal(true)}
        >
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* -- Filters Section -- */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label>Month</label>
          <select
            name="month"
            value={filters.month}
            onChange={handleFilterChange}
            className={styles.filterInput}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Year</label>
          <input
            type="number"
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className={styles.filterInput}
            style={{ width: "80px" }}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Condition / Category</label>
          <input
            type="text"
            name="therapy_category"
            placeholder="Search condition..."
            value={filters.therapy_category}
            onChange={handleFilterChange}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterActions}>
          <button className={styles.applyButton} onClick={fetchReportData}>
            <Filter size={16} /> Apply Filters
          </button>
          <button className={styles.clearButton} onClick={handleClearFilters}>
            <RefreshCcw size={16} /> Clear
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowExportModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Export Data</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowExportModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.exportOptions}>
                <button
                  className={styles.exportOptionButton}
                  onClick={() => handleExport("excel")}
                  disabled={exporting}
                >
                  <div className={styles.exportOptionIcon}>📊</div>
                  <div className={styles.exportOptionDetails}>
                    <h4>Excel Spreadsheet</h4>
                    <p>Format matches Patient Progress files</p>
                  </div>
                </button>
                <button
                  className={styles.exportOptionButton}
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                >
                  <div className={styles.exportOptionIcon}>📄</div>
                  <div className={styles.exportOptionDetails}>
                    <h4>PDF Document</h4>
                    <p>Ready for printing or sharing</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.splitSpinner}>
            <div className={styles.splitLeft}></div>
            <div className={styles.splitRight}></div>
          </div>
          <p className={styles.loadingText}>Applying Filters...</p>
        </div>
      ) : error ? (
        <div className={styles.errorWrapper}>
          <AlertCircle size={40} color="red" />
          <h3>Report Generation Failed</h3>
          <p>{error}</p>
          <button className={styles.applyButton} onClick={fetchReportData}>
            Retry
          </button>
        </div>
      ) : plans.length === 0 ? (
        <div className={styles.noDataWrapper}>
          <Clock size={40} color="#ccc" />
          <h3>No Records Found</h3>
          <p>No therapies were closed matching these filters.</p>
        </div>
      ) : (
        <div className={styles.planTableWrapper}>
          <table className={styles.planTable}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Sr No</th>
                <th className={styles.tableHeader}>Patient Name</th>
                <th className={styles.tableHeader}>Condition</th>
                <th className={styles.tableHeader}>Progress/Update/Comments</th>
                <th className={styles.tableHeader}>Start Date</th>
                <th className={styles.tableHeader}>Last Date</th>
                <th className={styles.tableHeader}>Doctors (Start/End)</th>
                <th className={styles.tableHeader}>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, index) => (
                <tr key={plan.plan_id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{index + 1}</td>
                  <td className={styles.tableCell}>
                    <div className={styles.primaryText}>
                      {plan.patient_name}
                    </div>
                    <div className={styles.secondaryText}>
                      {plan.patient_phone}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.primaryText} title={plan.therapy_name}>
                      {truncateText(plan.therapy_name, 30)}
                    </div>
                    <div className={styles.categoryBadge}>{plan.category}</div>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={styles.statusBadge}>{plan.outcome}</span>
                    <div className={styles.secondaryText} style={{marginTop: '4px'}}>
                        {truncateText(plan.reason, 40)}
                    </div>
                  </td>
                  {/* ✅ ADDED: Therapy Start Date cell */}
                  <td className={styles.tableCell}>
                    <span className={styles.dateLabel}>
                      {formatDate(plan.therapy_start)}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={styles.dateLabel}>
                      {formatDate(plan.closure_date)}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.doctorInfo} title="Started by">
                      <Stethoscope size={12} /> {plan.started_by_doctor}
                    </div>
                    <div className={styles.doctorInfo} title="Closed by">
                      <User size={12} /> {plan.completed_by_doctor}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.sessionInfo}>
                      {plan.sessions_formatted}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientReport;
