import { useState, useEffect } from "react";
import { User, Activity, Download } from "lucide-react";
import styles from "../css/PaymentDashboard.module.css";
import api from "../utils/central";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";

// Type definitions
interface TherapyEarning {
  therapy_type: string;
  therapy_category: string;
  total_amount: number;
  addon_amount: number;
  net_amount: number;
  payment_count: number;
  payment_types: string[];
}

interface Doctor {
  doctor_id: string;
  doctor_name: string;
  month: number;
  year: number;
  earnings_by_therapy: TherapyEarning[];
}

interface PaymentData {
  success: boolean;
  period: string;
  doctors: Doctor[];
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

interface Summary {
  totalAmount: number;
  totalPayments: number;
  doctorCount: number;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const PaymentDashboard = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedTherapyType, setSelectedTherapyType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filters, setFilters] = useState<{
    timePeriod: string;
    month: string;
    year: string;
    location: string;
  }>({
    timePeriod: "this_month",
    month: currentMonth.toString(),
    year: currentYear.toString(),
    location: "all",
  });

  const debouncedFilters = useDebounce(filters, 500);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get("/get/orgLocations");
        setLocations(response.data.locations || []);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // Fetch payment data
  const fetchData = async (filters: typeof debouncedFilters) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      // Handle time period
      if (filters.timePeriod === "today") {
        queryParams.append("today", "true");
      } else if (filters.timePeriod === "this_month") {
        queryParams.append("this_month", "true");
      } else if (filters.timePeriod === "this_year") {
        queryParams.append("this_year", "true");
      } else if (filters.timePeriod === "last_month") {
        const today = new Date();
        const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
        const year =
          today.getMonth() === 0
            ? today.getFullYear() - 1
            : today.getFullYear();
        queryParams.append("month", (lastMonth + 1).toString());
        queryParams.append("year", year.toString());
      } else if (filters.timePeriod === "last_year") {
        queryParams.append("year", (new Date().getFullYear() - 1).toString());
      } else if (filters.timePeriod === "all") {
        // No filters
      } else if (filters.timePeriod === "custom") {
        if (filters.month) queryParams.append("month", filters.month);
        if (filters.year) queryParams.append("year", filters.year);
      }

      // Location filter
      if (filters.location !== "all") {
        queryParams.append("location_id", filters.location);
      }

      console.log("Query Parameters:", queryParams.toString());

      const response = await api.get(
        `/get/payment/allbytype?${queryParams.toString()}`
      );
      console.log("API Response:", response.data);
      setPaymentData(response.data);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      alert("Failed to fetch payment data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [debouncedFilters]);

  // Calculate summary
  const calculateSummary = (): Summary => {
    if (!paymentData)
      return { totalAmount: 0, totalPayments: 0, doctorCount: 0 };

    let totalAmount = 0;
    let totalPayments = 0;

    paymentData.doctors.forEach((doctor: Doctor) => {
      doctor.earnings_by_therapy.forEach((therapy: TherapyEarning) => {
        totalAmount += therapy.net_amount;
        totalPayments += therapy.payment_count;
      });
    });

    return {
      totalAmount,
      totalPayments,
      doctorCount: paymentData.doctors.length,
    };
  };

  // Filter data
  const getFilteredData = (): Doctor[] => {
    if (!paymentData) return [];

    return paymentData.doctors.filter((doctor: Doctor) => {
      if (selectedDoctor !== "all" && doctor.doctor_id !== selectedDoctor)
        return false;

      return doctor.earnings_by_therapy.some((therapy: TherapyEarning) => {
        if (
          selectedTherapyType !== "all" &&
          therapy.therapy_type !== selectedTherapyType
        )
          return false;
        if (
          selectedCategory !== "all" &&
          therapy.therapy_category !== selectedCategory
        )
          return false;
        return true;
      });
    });
  };

  // Get unique values
  const getUniqueValues = (
    field: "therapy_type" | "therapy_category"
  ): string[] => {
    if (!paymentData) return [];
    const values = new Set<string>();

    paymentData.doctors.forEach((doctor: Doctor) => {
      doctor.earnings_by_therapy.forEach((therapy: TherapyEarning) => {
        if (field === "therapy_type") values.add(therapy.therapy_type);
        if (field === "therapy_category") values.add(therapy.therapy_category);
      });
    });

    return Array.from(values);
  };

  // Helper to normalize therapy types (e.g., merge "Consultation/Other" and "Consultation/Others")
  const getDisplayType = (originalType: string): string => {
    const normalizedType = originalType.toLowerCase();
    if (
      normalizedType === "consultation/others" ||
      normalizedType === "consultation/other"
    ) {
      return "Consul./Advance";
    }
    return originalType;
  };

  // Get all unique therapy types
  const getAllTherapyTypes = (): string[] => {
    if (!paymentData) return [];
    const types = new Set<string>();

    paymentData.doctors.forEach((doctor: Doctor) => {
      doctor.earnings_by_therapy.forEach((therapy: TherapyEarning) => {
        types.add(getDisplayType(therapy.therapy_type));
      });
    });

    return Array.from(types).sort();
  };

  // Transform data to have one row per doctor with therapy columns
  const getTransformedData = () => {
    const therapyTypes = getAllTherapyTypes();

    return filteredData.map((doctor: Doctor) => {
      const row: any = {
        doctor_id: doctor.doctor_id,
        doctor_name: doctor.doctor_name,
        total_earnings: 0,
      };

      // Initialize all therapy types with 0
      therapyTypes.forEach((type) => {
        row[type] = 0;
      });

      // Fill in actual values
      doctor.earnings_by_therapy
        .filter((therapy: TherapyEarning) => {
          if (
            selectedTherapyType !== "all" &&
            therapy.therapy_type !== selectedTherapyType
          )
            return false;
          if (
            selectedCategory !== "all" &&
            therapy.therapy_category !== selectedCategory
          )
            return false;
          return true;
        })
        .forEach((therapy: TherapyEarning) => {
          const displayType = getDisplayType(therapy.therapy_type);

          // FIX: Use += to accumulate values instead of overwriting them
          if (row[displayType] !== undefined) {
            row[displayType] += therapy.net_amount;
          } else {
            row[displayType] = therapy.net_amount;
          }

          row.total_earnings += therapy.net_amount;
        });

      return row;
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    const therapyTypes = getAllTherapyTypes();
    const transformedData = getTransformedData();

    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            .header-row { background-color: #007b8e; color: white; font-weight: bold; text-align: center; }
            .header-row th { padding: 12px 8px; border: 2px solid #005a66; font-size: 14px; }
            .data-row td { padding: 8px; border: 1px solid #d1d5db; text-align: right; }
            .data-row td:first-child { text-align: left; font-weight: 600; }
            .amount-cell { text-align: right; font-weight: 500; }
            .title { background-color: #1f2937; color: white; text-align: center; padding: 15px; font-size: 18px; font-weight: bold; }
            .summary { background-color: #f3f4f6; padding: 10px; margin-bottom: 10px; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
    `;

    const summary = calculateSummary();
    const periodLabel =
      filters.timePeriod === "custom"
        ? `${new Date(0, parseInt(filters.month || "0") - 1).toLocaleString(
            "default",
            { month: "long" }
          )} ${filters.year || ""}`
        : filters.timePeriod === "all"
        ? "All Time"
        : filters.timePeriod === "today"
        ? "Today"
        : filters.timePeriod === "this_month"
        ? "This Month"
        : filters.timePeriod === "last_month"
        ? "Last Month"
        : filters.timePeriod === "this_year"
        ? "This Year"
        : filters.timePeriod === "last_year"
        ? "Last Year"
        : "Selected Period";

    htmlContent += `
      <div class="title">Payment Report - ${periodLabel}</div>
      <div class="summary">
        Total Earnings: ₹${summary.totalAmount.toLocaleString()} | 
        Total Payments: ${summary.totalPayments} | 
        Active Doctors: ${summary.doctorCount}
      </div>
      <table>
        <thead>
          <tr class="header-row">
            <th>Doctor Name</th>
            ${therapyTypes.map((type) => `<th>${type}</th>`).join("")}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    transformedData.forEach((row: any) => {
      htmlContent += `<tr class="data-row">
        <td>${row.doctor_name}</td>
        ${therapyTypes
          .map(
            (type) => `
          <td class="amount-cell">₹${row[type].toLocaleString()}</td>
        `
          )
          .join("")}
        <td class="amount-cell" style="background-color: #dcfce7; font-weight: bold;">₹${row.total_earnings.toLocaleString()}</td>
      </tr>`;
    });

    htmlContent += `
        </tbody>
      </table>
      <div style="margin-top: 20px; padding: 10px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
        Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const filename = `Payment_Report_${periodLabel
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xls`;

    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));

  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  const timePeriodOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "this_year", label: "This Year" },
    { value: "last_year", label: "Last Year" },
    { value: "custom", label: "Custom" },
  ];

  const summary = calculateSummary();
  const filteredData = getFilteredData();

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value || "" };

      // Reset month/year when not custom
      if (key === "timePeriod" && value !== "custom") {
        updated.month = currentMonth.toString();
        updated.year = currentYear.toString();
      }

      return updated;
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.splitSpinner}>
            <div className={styles.splitLeft}></div>
            <div className={styles.splitRight}></div>
          </div>
          <p className={styles.loadingText}>Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filter Controls */}
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Time Period</label>
          <select
            value={filters.timePeriod}
            onChange={(e) => handleFilterChange("timePeriod", e.target.value)}
            className={styles.filterSelect}
          >
            {timePeriodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {filters.timePeriod === "custom" && (
          <>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Month</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Select Month</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Year</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Select Year</option>
                {yearOptions.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Location</label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name} ({loc.city})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Doctors</option>
            {paymentData?.doctors.map((d) => (
              <option key={d.doctor_id} value={d.doctor_id}>
                {d.doctor_name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Therapy Type</label>
          <select
            value={selectedTherapyType}
            onChange={(e) => setSelectedTherapyType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Types</option>
            {getUniqueValues("therapy_type").map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            {getUniqueValues("therapy_category").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.exportButtonContainer}>
          <button className={styles.exportButton} onClick={exportToExcel}>
            <Download className={styles.downloadIcon} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <RiMoneyRupeeCircleFill className={styles.cardIcon} />
            <h3>Total Earnings</h3>
          </div>
          <div className={styles.cardValue}>
            ₹{summary.totalAmount.toLocaleString()}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <Activity className={styles.cardIcon} />
            <h3>Total Payments</h3>
          </div>
          <div className={styles.cardValue}>{summary.totalPayments}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <User className={styles.cardIcon} />
            <h3>Active Doctors</h3>
          </div>
          <div className={styles.cardValue}>{summary.doctorCount}</div>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.tableHeaderCell}>Doctor Name</th>
                {getAllTherapyTypes().map((type) => (
                  <th key={type} className={styles.tableHeaderCell}>
                    {type}
                  </th>
                ))}
                <th className={styles.tableHeaderCell}>Total</th>
              </tr>
            </thead>
            <tbody>
              {getTransformedData().map((row: any) => (
                <tr key={row.doctor_id} className={styles.tableRow}>
                  <td className={styles.tableCellDoctor}>{row.doctor_name}</td>
                  {getAllTherapyTypes().map((type) => (
                    <td
                      key={`${row.doctor_id}-${type}`}
                      className={styles.tableCellAmount}
                    >
                      {row[type].toLocaleString()}
                    </td>
                  ))}
                  <td className={styles.tableCellTotal}>
                    ₹{row.total_earnings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className={styles.noDataContainer}>
            <Activity className={styles.noDataIcon} />
            <h3 className={styles.noDataTitle}>No Results Found</h3>
            <p className={styles.noDataText}>
              No data matches the selected filters. Try adjusting your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDashboard;
