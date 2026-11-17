import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import styles from "../css/FilterControls.module.css";
import api from "../utils/central";

// Type definitions copied/adapted from Dashboard.tsx
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

export interface FilterState {
  patient_name: string;
  therapy_name: string;
  activity_status: string;
  payment_status: string;
  min_amount: string;
  max_amount: string;
  min_balance: string;
  max_balance: string;
  time_period: string;
  custom_start_date: string;
  custom_end_date: string;
  location: string;
  therapy_category: string;
}

export type SortBy =
  | "patient_name_asc"
  | "patient_name_desc"
  | "newest"
  | "oldest"
  | "therapy_end_desc"
  | "therapy_end_asc"
  | "balance_desc"
  | "balance_asc"
  | "amount_desc"
  | "amount_asc"
  | "payment_progress_desc"
  | "payment_progress_asc"
  | "received_amount_desc"
  | "received_amount_asc"
  | "activity_status_active"
  | "activity_status_inactive";

interface SortOption {
  value: string;
  label: string;
}

interface FilterControlsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sortBy: SortBy;
  setSortBy: React.Dispatch<React.SetStateAction<SortBy>>;
  handleFilterChange: (key: keyof FilterState, value: string) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  resetClientSideFilters: () => void;
}

const sortOptions: SortOption[] = [
  { value: "patient_name_asc", label: "Patient Name (A-Z)" },
  { value: "newest", label: "Start Date (Newest)" },
  { value: "therapy_end_desc", label: "End Date (Latest)" },
  { value: "amount_desc", label: "Total Amount (High-Low)" },
  { value: "received_amount_desc", label: "Received Amount (High-Low)" },
  { value: "balance_desc", label: "Balance (High-Low)" },
  { value: "payment_progress_desc", label: "Payment Progress (High-Low)" },
  { value: "activity_status_active", label: "Active Plans First" },
];


// Helper function to get date ranges from time period
const getDateRangeFromPeriod = (
  period: string
): { start: string; end: string } | null => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        start: today.toISOString().split('T')[0],
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().split('T')[0],
      };

    case "this_month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return {
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0],
      };

    case "last_month":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999
      );
      return {
        start: lastMonthStart.toISOString().split('T')[0],
        end: lastMonthEnd.toISOString().split('T')[0],
      };

    case "this_year":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return {
        start: yearStart.toISOString().split('T')[0],
        end: yearEnd.toISOString().split('T')[0],
      };

    case "last_year":
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(
        now.getFullYear() - 1,
        11,
        31,
        23,
        59,
        59,
        999
      );
      return {
        start: lastYearStart.toISOString().split('T')[0],
        end: lastYearEnd.toISOString().split('T')[0],
      };

    default:
      return null;
  }
};

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  setFilters,
  sortBy,
  setSortBy,
  handleFilterChange,
  setCurrentPage,
  resetClientSideFilters,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(
    filters.time_period === "custom"
  );

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get("/get/orgLocations");
        setLocations(response.data.locations || []);
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };
    fetchLocations();
  }, []);

  
const isFilterActive = Object.entries(filters).some(
    ([key, value]) =>
      value !== "" && (key !== "time_period" || value !== "this_month")
  );

  const handleTimePeriodChange = (value: string) => {
    // 1. Update the main filter state
    handleFilterChange("time_period", value);
    
    // 2. Control visibility of custom date pickers
    setShowCustomDatePicker(value === "custom");

    // 3. Reset page to 1
    setCurrentPage(1);

    // 4. Update custom_start_date and custom_end_date to reflect the selected period
    const dateRange = getDateRangeFromPeriod(value);
    
    if (dateRange && value !== "custom") {
      // If a non-custom period is selected, update the custom inputs 
      setFilters(prev => ({
        ...prev,
        custom_start_date: dateRange.start,
        custom_end_date: dateRange.end,
      }));
    } else if (value === "") {
        // If "All Time" is selected, clear custom dates
        setFilters(prev => ({
            ...prev,
            custom_start_date: "",
            custom_end_date: "",
        }));
    }
  };

  const handleClearFilters = useCallback(() => {
    // Calculate the default 'This Month' range for resetting
    const initialDateRange = getDateRangeFromPeriod("this_month") || {
      start: "",
      end: ""
    };

    setFilters({
      patient_name: "",
      therapy_name: "",
      activity_status: "",
      payment_status: "",
      min_amount: "",
      max_amount: "",
      min_balance: "",
      max_balance: "",
      time_period: "this_month",
      // Reset custom dates to the default 'This Month' range
      custom_start_date: initialDateRange.start,
      custom_end_date: initialDateRange.end,
      location: "",
      therapy_category: "",
    });
    setSortBy("patient_name_asc");
    setShowCustomDatePicker(false);
    setCurrentPage(1);
    // Trigger client-side filter reset for patient_name, therapy_name etc.
    resetClientSideFilters();
  }, [setFilters, setSortBy, setCurrentPage, resetClientSideFilters]);


  return (
    <div className={styles.filterControls}>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className={styles.filterSelect}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Time Period</label>
        <select
          value={filters.time_period}
          onChange={(e) => handleTimePeriodChange(e.target.value)}
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
        <div className={styles.calendarContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Start Date</label>
            <input
              type="date"
              value={filters.custom_start_date}
              onChange={(e) =>
                handleFilterChange("custom_start_date", e.target.value)
              }
              className={styles.datePickerInput}
              placeholder="Start Date"
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
              placeholder="End Date"
            />
          </div>
        </div>
      )}

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Activity Status</label>
        <select
          value={filters.activity_status}
          onChange={(e) => handleFilterChange("activity_status", e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Payment Status</label>
        <select
          value={filters.payment_status}
          onChange={(e) => handleFilterChange("payment_status", e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Therapy Category</label>
        <select
          value={filters.therapy_category}
          onChange={(e) =>
            handleFilterChange("therapy_category", e.target.value)
          }
          className={styles.filterSelect}
        >
          <option value="">All Categories</option>
          <option value="Musculoskeletal">Musculoskeletal</option>
          <option value="Neurological">Neurological</option>
          <option value="Women's Health">Women's Health</option>
          <option value="Cardiopulmonary">Cardiopulmonary</option>
          <option value="Pediatric">Pediatric</option>
          <option value="Geriatric">Geriatric</option>
          <option value="Sports">Sports</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Location</label>
        <select
          value={filters.location}
          onChange={(e) => handleFilterChange("location", e.target.value)}
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

      {isFilterActive && (
        <button className={styles.clearFilters} onClick={handleClearFilters}>
          <X className={styles.clearIcon} size={18} />
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default FilterControls;