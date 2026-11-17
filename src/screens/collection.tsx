import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  X,
  HandCoins,
  Search,
  MapPin,
} from "lucide-react";
import styles from "../css/collection.module.css";
import api from "../utils/central";

// --- Type Definitions ---
interface PaymentDetails {
  amount: number;
  base_amount: number;
  addon_amount: number;
  payment_type: string;
  payment_number: string;
  date: string;
  therapy_type: string;
}

interface PatientInfo {
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  patient_status: string;
}

interface DoctorInfo {
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  doctor_phone: string;
}

interface TherapyPlanInfo {
  therapy_plan_id: string;
  therapy_name: string;
  therapy_category: string;
  plan_total_amount: number;
  plan_received_amount: number;
  plan_balance: number;
}

interface AddonService {
  name: string;
  amount: number;
}

interface PaymentContext {
  balance_after_payment: number | null;
  received_amount_total: number | null;
  therapy_session_id: string | null;
}

interface PaymentAnalysis {
  payment_id: string;
  payment_details: PaymentDetails;
  patient_info: PatientInfo;
  doctor_info: DoctorInfo;
  therapy_plan_info: TherapyPlanInfo;
  addon_services: AddonService[];
  payment_context: PaymentContext;
  location_info?: {
    location_id?: string;
    location_name: string;
  };
}

interface PaymentTypeBreakdown {
  payment_type: string;
  total_amount: number;
  percentage: number;
}

interface TherapyTypeBreakdown {
  therapy_type: string;
  total_amount: number;
  percentage: number;
}

interface LocationBreakdown {
  location_id: string;
  location_name: string;
  total_collected: number;
  payment_count: number;
  average_per_payment: number;
  percentage: number;
}

interface TopDoctor {
  doctor_name: string;
  total_collected: number;
  payment_count: number;
  average_per_payment: number;
}

interface MonthlyTrend {
  month: string;
  total_amount: number;
}

interface Summary {
  overview: {
    total_payments: number;
    total_amount_collected: number;
    average_payment_amount: number;
    total_addon_revenue: number;
    addon_percentage: number;
  };
  entity_counts: {
    unique_patients: number;
    unique_doctors: number;
    unique_therapy_plans: number;
  };
  payment_type_breakdown: PaymentTypeBreakdown[];
  therapy_type_breakdown: TherapyTypeBreakdown[];
  top_collecting_doctors: TopDoctor[];
  location_breakdown: LocationBreakdown[];
  monthly_trend: MonthlyTrend[];
}

interface Pagination {
  total_count: number;
  current_page: number;
  total_pages: number;
  page_size: number;
  offset: number;
  showing_from: number;
  showing_to: number;
  has_next_page: boolean;
  has_previous_page: boolean;
  next_page: number | null;
  previous_page: number | null;
}

interface GroupedPayment {
  group_name: string;
  payment_count: number;
  total_amount: number;
  total_addon_amount: number;
  payments: PaymentAnalysis[];
}

interface PaymentCollectionData {
  message: string;
  summary: Summary;
  analysis: PaymentAnalysis[] | GroupedPayment[];
  grouped_data: {
    grouped_by: string;
    data: GroupedPayment[];
  } | null;
  pagination: Pagination | null;
  filters_applied: Record<string, string>;
  generated_at: string;
}

interface Location {
  id: string;
  name: string;
  locationId: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
  _id: string;
}

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
}

interface FilterState {
  sortBy: string;
  payment_type: string;
  therapy_type: string;
  time_period: string;
  custom_start_date: string;
  custom_end_date: string;
  group_by: string;
  min_amount: string;
  max_amount: string;
  doctor_id: string; // Changed from doctor_name to doctor_id
  patient_name: string;
  location_id: string;
}

// --- Date Helper ---
const getLocalYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateRangeFromPeriod = (
  period: string
): { start: string; end: string } | null => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        start: getLocalYYYYMMDD(today),
        end: getLocalYYYYMMDD(today),
      };

    case "this_month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: getLocalYYYYMMDD(monthStart),
        end: getLocalYYYYMMDD(monthEnd),
      };

    case "last_month":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: getLocalYYYYMMDD(lastMonthStart),
        end: getLocalYYYYMMDD(lastMonthEnd),
      };

    case "this_year":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      return {
        start: getLocalYYYYMMDD(yearStart),
        end: getLocalYYYYMMDD(yearEnd),
      };

    case "last_year":
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return {
        start: getLocalYYYYMMDD(lastYearStart),
        end: getLocalYYYYMMDD(lastYearEnd),
      };

    default:
      return null;
  }
};

// --- Main Component ---
const Collection = () => {
  const [paymentData, setPaymentData] = useState<PaymentCollectionData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAdvancedFilters, setShowAdvancedFilters] =
    useState<boolean>(false);
  const [showCustomDatePicker, setShowCustomDatePicker] =
    useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);

  const initialFilterState: FilterState = {
    sortBy: "date_desc",
    payment_type: "",
    therapy_type: "",
    time_period: "this_month",
    custom_start_date: "",
    custom_end_date: "",
    group_by: "none",
    min_amount: "",
    max_amount: "",
    doctor_id: "", // Changed from doctor_name to doctor_id
    patient_name: "",
    location_id: "",
  };
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(initialFilterState);

  const instantApplyKeys = [
    "sortBy",
    "payment_type",
    "time_period",
    "group_by",
    "custom_start_date",
    "custom_end_date",
    "location_id",
  ];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get("/get/orgLocations");
        setLocations(response.data.locations || []);
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };

    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const response = await api.get("/getalldoctor");
        if (response.status === 200) {
          setDoctors(response.data.doctors || []);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchLocations();
    fetchDoctors();
  }, []);

  // --- FIXED: Fetch Payment Collection Analysis with Normalization ---
  const fetchPaymentData = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        const currentFilters = appliedFilters;
        let dateFrom = "";
        let dateTo = "";

        if (currentFilters.time_period === "custom") {
          dateFrom = currentFilters.custom_start_date;
          dateTo = currentFilters.custom_end_date;
        } else if (currentFilters.time_period) {
          const range = getDateRangeFromPeriod(currentFilters.time_period);
          if (range) {
            dateFrom = range.start;
            dateTo = range.end;
          }
        }

        if (dateFrom) params.append("date_from", dateFrom);
        if (dateTo) params.append("date_to", dateTo);
        if (currentFilters.sortBy)
          params.append("sortBy", currentFilters.sortBy);
        if (currentFilters.payment_type)
          params.append("payment_type", currentFilters.payment_type);
        if (currentFilters.therapy_type)
          params.append("therapy_type", currentFilters.therapy_type);
        if (currentFilters.group_by && currentFilters.group_by !== "none")
          params.append("group_by", currentFilters.group_by);
        if (currentFilters.min_amount)
          params.append("min_amount", currentFilters.min_amount);
        if (currentFilters.max_amount)
          params.append("max_amount", currentFilters.max_amount);
        if (currentFilters.doctor_id)
          // Changed from doctor_name
          params.append("doctor_id", currentFilters.doctor_id);
        if (currentFilters.patient_name)
          params.append("patient_name", currentFilters.patient_name);
        if (currentFilters.location_id)
          params.append("location_id", currentFilters.location_id);

        console.log("Query Parameters:", params.toString());
        const response = await api.get(
          `/collection/analysis?${params.toString()}`
        );

        // --- DATA NORMALIZATION START ---
        let processedData = response.data;
        const summary = processedData.summary || {};

        if (summary && !summary.overview) {
          processedData = {
            ...processedData,
            summary: {
              overview: {
                total_payments: summary.total_payments || 0,
                total_amount_collected: summary.total_amount_collected || 0,
                average_payment_amount: summary.average_payment_amount || 0,
                total_addon_revenue: summary.total_addon_revenue || 0,
                addon_percentage: 0,
              },
              entity_counts: {
                unique_patients: summary.unique_patients || 0,
                unique_doctors: summary.unique_doctors || 0,
                unique_therapy_plans: summary.unique_therapy_plans || 0,
              },
              payment_type_breakdown: summary.payment_type_breakdown || [],
              therapy_type_breakdown: summary.therapy_type_breakdown || [],
              location_breakdown: summary.location_breakdown || [],
              monthly_trend: summary.monthly_trend || [],
              top_collecting_doctors: [],
            },
          };
        }
        // --- DATA NORMALIZATION END ---

        setPaymentData(processedData as PaymentCollectionData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching payment data:", err);
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters]
  );

  useEffect(() => {
    if (
      appliedFilters.time_period === "custom" &&
      (!appliedFilters.custom_start_date || !appliedFilters.custom_end_date)
    ) {
      return;
    }
    fetchPaymentData(currentPage);
  }, [currentPage, appliedFilters, fetchPaymentData]);

  const handleFilterChange = (key: keyof FilterState, value: string): void => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "time_period") {
        setShowCustomDatePicker(value === "custom");
      }
      return newFilters;
    });

    if (instantApplyKeys.includes(key)) {
      setAppliedFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
      setCurrentPage(1);
    }
  };

  const applyAdvancedFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const clearAllFilters = (): void => {
    setFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
    setShowCustomDatePicker(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = (): boolean => {
    return (
      appliedFilters.payment_type !== "" ||
      appliedFilters.therapy_type !== "" ||
      (appliedFilters.time_period !== "this_month" &&
        appliedFilters.time_period !== "") ||
      appliedFilters.group_by !== "none" ||
      appliedFilters.min_amount !== "" ||
      appliedFilters.max_amount !== "" ||
      appliedFilters.doctor_id !== "" ||
      appliedFilters.patient_name !== "" ||
      appliedFilters.location_id !== ""
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleExport = async (format: "excel" | "pdf") => {
    try {
      setExporting(true);

      const params = new URLSearchParams();

      const currentFilters = appliedFilters;
      let dateFrom = "";
      let dateTo = "";

      if (currentFilters.time_period === "custom") {
        dateFrom = currentFilters.custom_start_date;
        dateTo = currentFilters.custom_end_date;
      } else if (currentFilters.time_period) {
        const range = getDateRangeFromPeriod(currentFilters.time_period);
        if (range) {
          dateFrom = range.start;
          dateTo = range.end;
        }
      }

      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (currentFilters.payment_type)
        params.append("payment_type", currentFilters.payment_type);
      if (currentFilters.therapy_type)
        params.append("therapy_type", currentFilters.therapy_type);
      if (currentFilters.min_amount)
        params.append("min_amount", currentFilters.min_amount);
      if (currentFilters.max_amount)
        params.append("max_amount", currentFilters.max_amount);
      if (currentFilters.doctor_id)
        // Changed from doctor_name
        params.append("doctor_id", currentFilters.doctor_id);
      if (currentFilters.patient_name)
        params.append("patient_name", currentFilters.patient_name);
      if (currentFilters.location_id)
        params.append("location_id", currentFilters.location_id);

      const endpoint =
        format === "excel"
          ? `/collection/export/excel?${params.toString()}`
          : `/collection/export/pdf?${params.toString()}`;

      const response = await api.get(endpoint, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const date = new Date().toISOString().split("T")[0];
      link.download = `payment_collection_${date}.${
        format === "excel" ? "xlsx" : "pdf"
      }`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      alert(`Failed to export to ${format.toUpperCase()}. Please try again.`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.splitSpinner}>
            <div className={styles.splitLeft}></div>
            <div className={styles.splitRight}></div>
          </div>
          <p className={styles.loadingText}>Loading payment analysis...</p>
        </div>
      </div>
    );
  }

  const isGroupedView =
    appliedFilters.group_by !== "none" && appliedFilters.group_by !== "";

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filterControls}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="date_desc">Date (Newest)</option>
              <option value="date_asc">Date (Oldest)</option>
              <option value="amount_desc">Amount (High to Low)</option>
              <option value="amount_asc">Amount (Low to High)</option>
              <option value="payment_type">Payment Type</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Time Period</label>
            <select
              value={filters.time_period}
              onChange={(e) =>
                handleFilterChange("time_period", e.target.value)
              }
              className={styles.filterSelect}
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {showCustomDatePicker && (
            <>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Start Date</label>
                <input
                  type="date"
                  value={filters.custom_start_date}
                  onChange={(e) =>
                    handleFilterChange("custom_start_date", e.target.value)
                  }
                  className={styles.datePickerInput}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>End Date</label>
                <input
                  type="date"
                  value={filters.custom_end_date}
                  onChange={(e) =>
                    handleFilterChange("custom_end_date", e.target.value)
                  }
                  className={styles.datePickerInput}
                />
              </div>
            </>
          )}

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Location</label>
            <select
              value={filters.location_id}
              onChange={(e) =>
                handleFilterChange("location_id", e.target.value)
              }
              className={styles.filterSelect}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name} ({location.city})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Payment Type</label>
            <select
              value={filters.payment_type}
              onChange={(e) =>
                handleFilterChange("payment_type", e.target.value)
              }
              className={styles.filterSelect}
            >
              <option value="">All Types</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="At Counter">At Counter</option>
            </select>
          </div>

          <button
            className={styles.advancedFilterToggle}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={18} />
            {showAdvancedFilters ? "Hide" : "Advanced"}
          </button>

          <button
            className={styles.exportButton}
            onClick={() => setShowExportModal(true)}
          >
            <Download size={18} />
            Export
          </button>

          {hasActiveFilters() && (
            <button className={styles.clearFilters} onClick={clearAllFilters}>
              <X className={styles.clearIcon} size={18} />
              Clear All
            </button>
          )}
        </div>

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
                <h3>Export Payment Collection</h3>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowExportModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <p className={styles.modalDescription}>
                  Choose your preferred export format. All{" "}
                  {paymentData?.pagination?.total_count || 0} payments matching
                  your current filters will be exported.
                </p>

                <div className={styles.exportOptions}>
                  <button
                    className={styles.exportOptionButton}
                    onClick={() => handleExport("excel")}
                    disabled={exporting}
                  >
                    <div className={styles.exportOptionIcon}>📊</div>
                    <div className={styles.exportOptionDetails}>
                      <h4>Excel (.xlsx)</h4>
                      <p>Best for data analysis and calculations</p>
                    </div>
                  </button>

                  <button
                    className={styles.exportOptionButton}
                    onClick={() => handleExport("pdf")}
                    disabled={exporting}
                  >
                    <div className={styles.exportOptionIcon}>📄</div>
                    <div className={styles.exportOptionDetails}>
                      <h4>PDF (.pdf)</h4>
                      <p>Best for printing and sharing reports</p>
                    </div>
                  </button>
                </div>

                {exporting && (
                  <div className={styles.exportingIndicator}>
                    <div className={styles.spinner}></div>
                    <p>Preparing your export...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showAdvancedFilters && (
          <div className={styles.advancedFilters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input
                type="text"
                value={filters.patient_name}
                onChange={(e) =>
                  handleFilterChange("patient_name", e.target.value)
                }
                className={styles.filterInput}
                placeholder="Search patient..."
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Doctor Name</label>
              <select
                value={filters.doctor_id}
                onChange={(e) =>
                  handleFilterChange("doctor_id", e.target.value)
                }
                className={styles.filterSelect}
                disabled={loadingDoctors}
              >
                <option value="">
                  {loadingDoctors ? "Loading doctors..." : "All Doctors"}
                </option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Min Amount</label>
              <input
                type="number"
                value={filters.min_amount}
                onChange={(e) =>
                  handleFilterChange("min_amount", e.target.value)
                }
                className={styles.filterInput}
                placeholder="Min"
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Max Amount</label>
              <input
                type="number"
                value={filters.max_amount}
                onChange={(e) =>
                  handleFilterChange("max_amount", e.target.value)
                }
                className={styles.filterInput}
                placeholder="Max"
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Therapy Type</label>
              <select
                value={filters.therapy_type}
                onChange={(e) =>
                  handleFilterChange("therapy_type", e.target.value)
                }
                className={styles.filterSelect}
              >
                <option value="">All Therapy Types</option>
                <option value="In Clinic">In Clinic</option>
                <option value="In Home">In Home</option>
                <option value="IP/ICU">IP/ICU</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <button
              className={styles.applyFilterButton}
              onClick={applyAdvancedFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#007b8e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                alignSelf: "flex-end",
                marginBottom: "2px",
              }}
            >
              <Search size={16} />
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {paymentData?.summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <HandCoins size={24} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Collected</p>
              <p className={styles.cardValue}>
                ₹
                {formatCurrency(
                  paymentData.summary.overview.total_amount_collected
                )}
              </p>
              <p className={styles.cardSubtext}>
                {paymentData.summary.overview.total_payments} payments
              </p>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Average Payment</p>
              <p className={styles.cardValue}>
                ₹
                {formatCurrency(
                  paymentData.summary.overview.average_payment_amount
                )}
              </p>
              <p className={styles.cardSubtext}>
                Addon: ₹
                {formatCurrency(
                  paymentData.summary.overview.total_addon_revenue
                )}
              </p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <Calendar size={24} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Therapy Plans</p>
              <p className={styles.cardValue}>
                {paymentData.summary.entity_counts.unique_therapy_plans}
              </p>
              <p className={styles.cardSubtext}>Active plans</p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Charts */}
      {paymentData?.summary && (
        <div className={styles.breakdownSection}>
          <div className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>Payment Type Breakdown</h3>
            <div className={styles.breakdownList}>
              {paymentData.summary.payment_type_breakdown &&
              paymentData.summary.payment_type_breakdown.length > 0 ? (
                paymentData.summary.payment_type_breakdown.map((item, idx) => (
                  <div key={idx} className={styles.breakdownItem}>
                    <div className={styles.breakdownLabel}>
                      <span>{item.payment_type}</span>
                      <span className={styles.breakdownPercentage}>
                        {item.percentage}%
                      </span>
                    </div>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className={styles.breakdownAmount}>
                      ₹{formatCurrency(item.total_amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.noDataText}>No payment type data.</p>
              )}
            </div>
          </div>

          {/* Location Wise Breakdown */}
          <div className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>Location Wise Breakdown</h3>
            <div className={styles.breakdownList}>
              {paymentData.summary.location_breakdown &&
              paymentData.summary.location_breakdown.length > 0 ? (
                paymentData.summary.location_breakdown.map((item, idx) => (
                  <div key={idx} className={styles.breakdownItem}>
                    <div className={styles.breakdownLabel}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <MapPin size={14} /> {item.location_name}
                      </span>
                      <span className={styles.breakdownPercentage}>
                        {item.percentage}% ({item.payment_count})
                      </span>
                    </div>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className={styles.breakdownAmount}>
                      ₹{formatCurrency(item.total_collected)}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.noDataText}>
                  No location data available for this period.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Table or Grouped View */}
      <div className={styles.plansSection}>
        {error ? (
          <div className={styles.errorWrapper}>
            <AlertCircle className={styles.errorIcon} />
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => fetchPaymentData(currentPage)}
            >
              Try Again
            </button>
          </div>
        ) : !paymentData?.analysis || paymentData.analysis.length === 0 ? (
          <div className={styles.noDataWrapper}>
            <Clock className={styles.noDataIcon} />
            <h3>No Payments Found</h3>
            <p>
              {hasActiveFilters()
                ? "Try adjusting your filters to see results."
                : "There are currently no payment records."}
            </p>
          </div>
        ) : isGroupedView ? (
          // Grouped View
          <div className={styles.groupedContainer}>
            {(paymentData.analysis as GroupedPayment[]).map((group, idx) => (
              <div key={idx} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <div>
                    <h3 className={styles.groupName}>{group.group_name}</h3>
                    <p className={styles.groupStats}>
                      {group.payment_count} payments • ₹
                      {formatCurrency(group.total_amount)}
                    </p>
                  </div>
                  {group.total_addon_amount > 0 && (
                    <span className={styles.addonBadge}>
                      +₹{formatCurrency(group.total_addon_amount)} addons
                    </span>
                  )}
                </div>
                <div className={styles.groupPayments}>
                  {group.payments.slice(0, 3).map((payment) => (
                    <div
                      key={payment.payment_id}
                      className={styles.miniPaymentCard}
                    >
                      <div className={styles.miniPaymentInfo}>
                        <span className={styles.miniPaymentPatient}>
                          {payment.patient_info.patient_name}
                        </span>
                        <span className={styles.miniPaymentDate}>
                          {formatDate(payment.payment_details.date)}
                        </span>
                      </div>
                      <span className={styles.miniPaymentAmount}>
                        ₹{formatCurrency(payment.payment_details.amount)}
                      </span>
                    </div>
                  ))}
                  {group.payments.length > 3 && (
                    <p className={styles.morePayments}>
                      +{group.payments.length - 3} more payments
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular Table View
          <>
            <div className={styles.planTableWrapper}>
              <table className={styles.planTable}>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Date</th>
                    <th className={styles.tableHeader}>Patient</th>
                    <th className={styles.tableHeader}>Doctor</th>
                    <th className={styles.tableHeader}>Therapy</th>
                    <th className={styles.tableHeader}>Payment Type</th>
                    <th className={styles.tableHeader}>Location</th>
                    <th className={styles.tableHeader}>Base Amount</th>
                    <th className={styles.tableHeader}>Addon</th>
                    <th className={styles.tableHeader}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(paymentData.analysis as PaymentAnalysis[]).map(
                    (payment) => (
                      <tr key={payment.payment_id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          {formatDate(payment.payment_details.date)}
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.patientCell}>
                            <span className={styles.patientName}>
                              {payment.patient_info.patient_name}
                            </span>
                            <span className={styles.patientPhone}>
                              {payment.patient_info.patient_phone}
                            </span>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          {payment.doctor_info.doctor_name}
                        </td>
                        <td className={styles.tableCell}>
                          {payment.therapy_plan_info.therapy_name}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.paymentTypeBadge}>
                            {payment.payment_details.payment_type}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {payment.location_info?.location_name || "-"}
                        </td>
                        <td className={styles.tableCell}>
                          ₹{formatCurrency(payment.payment_details.base_amount)}
                        </td>
                        <td className={styles.tableCell}>
                          {payment.payment_details.addon_amount > 0 ? (
                            <span className={styles.addonAmount}>
                              +₹
                              {formatCurrency(
                                payment.payment_details.addon_amount
                              )}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <strong>
                            ₹{formatCurrency(payment.payment_details.amount)}
                          </strong>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {paymentData.pagination && (
              <>
                <div className={styles.pagination}>
                  <button
                    className={styles.paginationButton}
                    onClick={() =>
                      setCurrentPage(paymentData.pagination!.previous_page || 1)
                    }
                    disabled={!paymentData.pagination.has_previous_page}
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <span className={styles.paginationInfo}>
                    Page {paymentData.pagination.current_page} of{" "}
                    {paymentData.pagination.total_pages}
                  </span>
                  <button
                    className={styles.paginationButton}
                    onClick={() =>
                      setCurrentPage(paymentData.pagination!.next_page || 1)
                    }
                    disabled={!paymentData.pagination.has_next_page}
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className={styles.sectionHeader}>
                  <div className={styles.resultsCount}>
                    Showing {paymentData.pagination.showing_from} -{" "}
                    {paymentData.pagination.showing_to} of{" "}
                    {paymentData.pagination.total_count} payments
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default Collection;
