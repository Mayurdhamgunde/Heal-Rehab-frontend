import { Activity, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../css/TherapyAnalytics.module.css";
import api from "../utils/central";
import defaultProfilePhoto from "../assets/profile.png";

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

interface TherapyTypes {
  inClinic: number;
  inHome: number;
  ipIcu: number;
  online: number;
}

interface TherapyTypeDetails {
  count: number;
  completed: number;
  cancelled: number;
  pending: number;
  scheduled: number;
}

interface Doctor {
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctor_photo: string | null;
  doctor_status: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  consultationSessions: number;
  uniquePatients: number;
  completionRate: number;
  cancellationRate: number;
  avgSessionDuration: number;
  totalDuration: number;
  recentSessions: number;
  mostCommonTherapyType: string;
  mostCommonTherapyCount: number;
  therapyTypes: {
    "In Clinic": TherapyTypeDetails;
    "In Home": TherapyTypeDetails;
    "IP/ICU": TherapyTypeDetails;
    Online: TherapyTypeDetails;
  };
  therapyTypeSummary: TherapyTypes;
  dateRange: {
    firstSession: number | null;
    lastSession: number | null;
  };
}

interface TopPerformers {
  mostSessions: {
    doctor_name: string;
    totalSessions: number;
    doctor_photo?: string | null;
  } | null;
  highestCompletionRate: {
    doctor_name: string;
    completionRate: number;
    doctor_photo?: string | null;
  } | null;
  mostPatients: {
    doctor_name: string;
    uniquePatients: number;
    doctor_photo?: string | null;
  } | null;
}

interface AggregateStats {
  totalDoctors: number;
  totalSessions: number;
  totalCompletedSessions: number;
  totalCancelledSessions: number;
  totalUniquePatients: number;
  averageCompletionRate: number;
  therapyTypeTotals: TherapyTypes;
}

interface TherapyAnalyticsData {
  success: boolean;
  message: string;
  filters: {
    period: string;
    month: number | null;
    year: number | null;
    startDate: string | null;
    endDate: string | null;
    locationId: string | null;
    includeInactive: boolean;
    sortBy: string;
    sortOrder: string;
  };
  aggregateStats: AggregateStats;
  topPerformers: TopPerformers;
  doctors: Doctor[];
}

interface Location {
  id: string;
  name: string;
  locationId: string;
  _id: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
}

interface LocationsData {
  locations: Location[];
  count: number;
  message: string;
}

interface FilterState {
  timePeriod: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  doctor_name: string;
}

const calculateDateRange = (
  timePeriod: string
): { startDate: string; endDate: string } => {
  const today = new Date();
  let startDate: Date, endDate: Date;

  switch (timePeriod) {
    case "all":
      return { startDate: "", endDate: "" };
    case "today":
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "this_month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "last_month":
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case "this_year":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
    case "last_year":
      startDate = new Date(today.getFullYear() - 1, 0, 1);
      endDate = new Date(today.getFullYear() - 1, 11, 31);
      break;
    default:
      startDate = new Date();
      endDate = new Date();
      return { startDate: "", endDate: "" };
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

const TherapyAnalytics = () => {
  const [data, setData] = useState<TherapyAnalyticsData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("totalSessions");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [filters, setFilters] = useState<FilterState>({
    timePeriod: "this_month",
    startDate: "",
    endDate: "",
    location: "",
    status: "",
    doctor_name: "",
  });

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get<LocationsData>("/get/orgLocations");
        if (response.status !== 200) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setLocations(response.data.locations);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch locations";
        setError(errorMessage);
        console.error("Error fetching locations:", err);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (
      !filters.timePeriod &&
      filters.startDate &&
      filters.endDate &&
      new Date(filters.startDate) > new Date(filters.endDate)
    ) {
      setError("Start date must be before end date");
      return;
    }

    fetchAnalytics();
  }, [debouncedFilters]);

  const fetchAnalytics = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      const { startDate, endDate } = filters.timePeriod
        ? calculateDateRange(filters.timePeriod)
        : { startDate: filters.startDate, endDate: filters.endDate };

      if (
        filters.timePeriod &&
        filters.timePeriod !== "all" &&
        startDate &&
        endDate
      ) {
        if (filters.timePeriod === "today") {
          queryParams.append("startDate", startDate);
          queryParams.append("timePeriod", filters.timePeriod);
        } else {
          queryParams.append("startDate", startDate);
          queryParams.append("endDate", endDate);
        }
      } else {
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
      }

      queryParams.append(
        "includeInactive",
        filters.status === "inactive" ? "true" : "false"
      );

      if (filters.location) {
        queryParams.append("locationId", filters.location);
      }

      const response = await api.get<TherapyAnalyticsData>(
        `/get/typemonthly?${queryParams.toString()}`
      );

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setData(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching therapy analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | Date | null
  ): void => {
    if (value instanceof Date) {
      setFilters((prev) => ({
        ...prev,
        [key]: value.toISOString().split("T")[0],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [key]: value || "",
        ...(key === "timePeriod" && value
          ? { startDate: "", endDate: "" }
          : {}),
      }));
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortedDoctors = () => {
    if (!data?.doctors) return [];

    let filteredDoctors = data.doctors.filter((doctor) => {
      if (
        filters.doctor_name &&
        !doctor.doctor_name
          .toLowerCase()
          .includes(filters.doctor_name.toLowerCase())
      ) {
        return false;
      }
      if (filters.status && doctor.doctor_status !== filters.status) {
        return false;
      }
      return true;
    });

    filteredDoctors.sort((a, b) => {
      let aValue: any = a[sortColumn as keyof Doctor];
      let bValue: any = b[sortColumn as keyof Doctor];

      if (sortColumn === "doctor_name") {
        aValue = a.doctor_name;
        bValue = b.doctor_name;
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filteredDoctors;
  };

  const getProfilePhoto = (photo: string | null | undefined) => {
    return photo || defaultProfilePhoto;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.splitSpinner}>
            <div className={styles.splitLeft}></div>
            <div className={styles.splitRight}></div>
          </div>
          <p className={styles.loadingText}>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <AlertCircle className={styles.errorIcon} />
          <h3 className={styles.errorTitle}>Error Loading Data</h3>
          <p className={styles.errorMessage}>{error}</p>
          <button
            className={styles.retryButton}
            onClick={() => fetchAnalytics()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.noDataContainer}>
          <Activity className={styles.noDataIcon} />
          <h3 className={styles.noDataTitle}>No Data Found</h3>
          <p className={styles.noDataMessage}>
            There are currently no therapy analytics available.
          </p>
        </div>
      </div>
    );
  }

  const sortedDoctors = getSortedDoctors();

  return (
    <div className={styles.container}>
      {/* Filter Controls - Same as Dashboard */}
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Time Period</label>
          <select
            value={filters.timePeriod}
            onChange={(e) => handleFilterChange("timePeriod", e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
            <option value="">Custom Range</option>
          </select>
        </div>

        {filters.timePeriod === "" && (
          <div className={styles.calendarContainer}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Start Date</label>
              <DatePicker
                selected={
                  filters.startDate ? new Date(filters.startDate) : null
                }
                onChange={(date) => handleFilterChange("startDate", date)}
                className={styles.filterInput}
                placeholderText="Select start date"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>End Date</label>
              <DatePicker
                selected={filters.endDate ? new Date(filters.endDate) : null}
                onChange={(date) => handleFilterChange("endDate", date)}
                className={styles.filterInput}
                placeholderText="Select end date"
                dateFormat="yyyy-MM-dd"
              />
            </div>
          </div>
        )}

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

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Search Doctor</label>
          <input
            type="text"
            value={filters.doctor_name}
            onChange={(e) => handleFilterChange("doctor_name", e.target.value)}
            className={styles.filterInput}
            placeholder="Search by name..."
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <Activity className={styles.cardIcon} />
            <h3>Total Doctors</h3>
          </div>
          <div className={styles.cardValue}>
            {data.aggregateStats.totalDoctors}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <Activity className={styles.cardIcon} />
            <h3>Total Sessions</h3>
          </div>
          <div className={styles.cardValue}>
            {data.aggregateStats.totalSessions}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <Activity className={styles.cardIcon} />
            <h3>Completed</h3>
          </div>
          <div className={styles.cardValue}>
            {data.aggregateStats.totalCompletedSessions}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <Activity className={styles.cardIcon} />
            <h3>Avg Completion</h3>
          </div>
          <div className={styles.cardValue}>
            {data.aggregateStats.averageCompletionRate}%
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className={styles.resultsHeader}>
        <p className={styles.resultsCount}>
          {sortedDoctors.length}{" "}
          {sortedDoctors.length === 1 ? "doctor" : "doctors"} found
        </p>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={styles.tableHeader}
                onClick={() => handleSort("doctor_name")}
              >
                <div className={styles.headerContent}>
                  Doctor
                  {sortColumn === "doctor_name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </div>
              </th>
              <th className={styles.tableHeader}>Status</th>
              <th
                className={styles.tableHeader}
                onClick={() => handleSort("totalSessions")}
              >
                <div className={styles.headerContent}>
                  Total Sessions
                  {sortColumn === "totalSessions" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </div>
              </th>
              <th
                className={styles.tableHeader}
                onClick={() => handleSort("completedSessions")}
              >
                <div className={styles.headerContent}>
                  Completed
                  {sortColumn === "completedSessions" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </div>
              </th>
              <th
                className={styles.tableHeader}
                onClick={() => handleSort("completionRate")}
              >
                <div className={styles.headerContent}>
                  Completion %
                  {sortColumn === "completionRate" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </div>
              </th>
              <th
                className={styles.tableHeader}
                onClick={() => handleSort("uniquePatients")}
              >
                <div className={styles.headerContent}>
                  Patients
                  {sortColumn === "uniquePatients" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </div>
              </th>
              <th
                className={styles.tableHeader}
                onClick={() => handleSort("avgSessionDuration")}
              >
                <div className={styles.headerContent}>
                  Avg Duration
                  {sortColumn === "avgSessionDuration" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </div>
              </th>
              <th className={styles.tableHeader}>Most Common Therapy</th>
            </tr>
          </thead>
          <tbody>
            {sortedDoctors.map((doctor) => (
              <tr key={doctor.doctor_id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.doctorInfo}>
                    <img
                      src={getProfilePhoto(doctor.doctor_photo)}
                      alt={doctor.doctor_name}
                      className={styles.doctorPhoto}
                      onError={(e) => {
                        e.currentTarget.src = defaultProfilePhoto;
                      }}
                    />
                    <div className={styles.doctorDetails}>
                      <div className={styles.doctorName}>
                        {doctor.doctor_name}
                      </div>
                      <div className={styles.doctorContact}>
                        {doctor.doctor_email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <span
                    className={`${styles.statusBadge} ${
                      doctor.doctor_status.toLowerCase() === "active"
                        ? styles.statusActive
                        : styles.statusInactive
                    }`}
                  >
                    {doctor.doctor_status}
                  </span>
                </td>
                <td className={styles.tableCell}>{doctor.totalSessions}</td>
                <td className={styles.tableCell}>{doctor.completedSessions}</td>
                <td className={styles.tableCell}>
                  <span className={styles.completionRate}>
                    {doctor.completionRate}%
                  </span>
                </td>
                <td className={styles.tableCell}>{doctor.uniquePatients}</td>
                <td className={styles.tableCell}>
                  {doctor.avgSessionDuration} min
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.therapyInfo}>
                    <span className={styles.therapyType}>
                      {doctor.mostCommonTherapyType}
                    </span>
                    <span className={styles.therapyCount}>
                      ({doctor.mostCommonTherapyCount})
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedDoctors.length === 0 && (
        <div className={styles.noResults}>
          <Activity className={styles.noResultsIcon} />
          <h3 className={styles.noResultsTitle}>No Results Found</h3>
          <p className={styles.noResultsMessage}>
            No doctors match the current filters. Try adjusting your search.
          </p>
        </div>
      )}
    </div>
  );
};

export default TherapyAnalytics;
