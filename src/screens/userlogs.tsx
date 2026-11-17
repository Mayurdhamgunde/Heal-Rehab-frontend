import React, { useState, useEffect } from "react";
import styles from "../css/userlogs.module.css";
import api from "../utils/central";
import {
  FaHistory,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaSync,
  FaUser,
  FaCog,
  FaChartBar,
  FaSortUp,
  FaSortDown,
  FaSearchPlus,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaFilter,
  FaServer,
  FaClock,
} from "react-icons/fa";

// Define TypeScript interfaces
interface LogEntry {
  _id: string;
  user_id: string;
  doctor_id: string;
  email: string;
  action: string;
  action_message: string;
  resource: string;
  resource_id?: string;
  method: string;
  endpoint: string;
  ip_address: string;
  user_agent: string;
  response_status: number;
  response_time: number;
  error_message?: string;
  session_id: string;
  metadata: {
    organization_name: string;
    is_admin: boolean;
    subscription_plan?: string;
    file_uploaded?: string;
    files_uploaded: number;
    tenant_id: string;
    success?: boolean;
    query_params?: any;
  };
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  doctor_name?: string;
}

interface PaginationData {
  current_page: number;
  total_pages: number;
  total_records: number;
  per_page: number;
}

interface TenantInfo {
  tenant_id: string;
  organization_name: string;
}

interface ApiResponse {
  logs: LogEntry[];
  pagination: PaginationData;
  tenant_info: TenantInfo;
}

interface FilterOptions {
  action: string;
  method: string;
  resource: string;
  status: string;
  search: string;
}

const UserLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 0,
    total_records: 0,
    per_page: 50,
  });
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [, setFilters] = useState<FilterOptions>({
    action: "",
    method: "",
    resource: "",
    status: "",
    search: "",
  });
  const [filterOption, setFilterOption] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchInput, setSearchInput] = useState<string>("");

  const getStartDateForFilter = (option: string): string | null => {
    const now = new Date();
    if (option === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return today.toISOString();
    } else if (option === "week") {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (option === "month") {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    return null;
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current_page.toString(),
        limit: pagination.per_page.toString(),
        sort_by: sortField,
        sort_order: sortOrder,
      });

      const startDate = getStartDateForFilter(filterOption);
      if (startDate) params.append("start_date", startDate);

      const response = await api.get("/get/user/logs", { params });

      const data: ApiResponse = response.data;
      setLogs(data.logs);
      setFilteredLogs(data.logs);
      setPagination(data.pagination);
      setTenantInfo(data.tenant_info);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error fetching user logs");
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current_page, filterOption, sortField, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total_pages) return;
    setPagination((prev) => ({ ...prev, current_page: page }));
  };

  const handleSortChange = (field: string) => {
    setSortField(field);
    setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc");
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleFilterOptionChange = (value: string) => {
    setFilterOption(value);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", searchInput);
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (pagination.total_pages <= maxVisiblePages) {
      for (let i = 1; i <= pagination.total_pages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, pagination.current_page - 1);
      let end = Math.min(
        pagination.total_pages - 1,
        pagination.current_page + 1,
      );
      if (end - start + 1 < maxVisiblePages - 2) {
        if (start === 2) {
          end = Math.min(
            pagination.total_pages - 1,
            start + (maxVisiblePages - 3),
          );
        } else if (end === pagination.total_pages - 1) {
          start = Math.max(2, end - (maxVisiblePages - 3));
        }
      }
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < pagination.total_pages - 1) pages.push("...");
      pages.push(pagination.total_pages);
    }
    return pages;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getActionBadgeClass = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return styles.actionCreate;
      case "UPDATE":
        return styles.actionUpdate;
      case "DELETE":
        return styles.actionDelete;
      default:
        return styles.actionRead;
    }
  };

  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) {
      return styles.statusSuccess;
    } else if (status >= 400 && status < 500) {
      return styles.statusWarning;
    } else if (status >= 500) {
      return styles.statusError;
    } else {
      return styles.statusSuccess;
    }
  };

  const getStatusText = (status: number) => {
    if (status >= 200 && status < 300) {
      return "Success";
    } else if (status >= 400 && status < 500) {
      return "Client Error";
    } else if (status >= 500) {
      return "Server Error";
    } else {
      return "Unknown";
    }
  };

  useEffect(() => {
    let result = [...logs];

    // Apply Status Filter first
    if (statusFilter === "success") {
      result = result.filter(
        (log) => log.response_status >= 200 && log.response_status < 400,
      );
    } else if (statusFilter === "error") {
      result = result.filter((log) => log.response_status >= 400);
    }

    const searchTerm = searchInput.toLowerCase();

    // Apply Search Filter
    if (searchTerm) {
      result = result.filter((log) => {
        const userName = log.doctor_name?.toLowerCase() || "";
        const email = log.email.toLowerCase();
        const action = log.action.toLowerCase();
        const endpoint = log.endpoint.toLowerCase();
        const resource = log.resource.toLowerCase();

        return (
          userName.includes(searchTerm) ||
          email.includes(searchTerm) ||
          action.includes(searchTerm) ||
          endpoint.includes(searchTerm) ||
          resource.includes(searchTerm)
        );
      });
    }

    setFilteredLogs(result);
  }, [searchInput, logs, statusFilter]);

  const getStatsData = () => {
    const successLogs = logs.filter(
      (log) => log.response_status >= 200 && log.response_status < 300,
    );
    const errorLogs = logs.filter((log) => log.response_status >= 400);
    const todayLogs = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    });

    return {
      total: logs.length,
      success: successLogs.length,
      errors: errorLogs.length,
      today: todayLogs.length,
    };
  };

  const stats = getStatsData();

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
          <div className={styles.heroHeaderRow}>
            <div>
              <h2 className={`${styles.pageTitle} ${styles.fontHeadline}`}>
                <FaHistory className={styles.titleIcon} /> User Activity Logs
              </h2>
              <p className={`${styles.pageSubtitle} ${styles.fontBody}`}>
                Monitor all user activities and system interactions
                {tenantInfo && ` for ${tenantInfo.organization_name}`}
              </p>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={handleRefresh}
              title="Refresh Logs"
            >
              <FaSync size={12} /> Refresh Logs
            </button>
          </div>
        </div>
      </section>

      <div className={styles.bentoGrid}>
        <div className={styles.colSpan3}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div className={styles.statIconWrapper}>
              <FaChartBar />
            </div>
            <div>
              <p className={styles.statLabel}>Total Logs</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
          </div>
        </div>
        <div className={styles.colSpan3}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#16a34a", background: "rgba(22, 163, 74, 0.1)" }}
            >
              <FaCheckCircle />
            </div>
            <div>
              <p className={styles.statLabel}>Successful Actions</p>
              <p className={styles.statValue}>{stats.success}</p>
            </div>
          </div>
        </div>
        <div className={styles.colSpan3}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#dc2626", background: "rgba(220, 38, 38, 0.1)" }}
            >
              <FaExclamationTriangle />
            </div>
            <div>
              <p className={styles.statLabel}>Error Logs</p>
              <p className={styles.statValue}>{stats.errors}</p>
            </div>
          </div>
        </div>
        <div className={styles.colSpan3}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{
                color: "#9333ea",
                background: "rgba(147, 51, 234, 0.1)",
              }}
            >
              <FaClock />
            </div>
            <div>
              <p className={styles.statLabel}>Today's Activity</p>
              <p className={styles.statValue}>{stats.today}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainListCard}>
        <div className={styles.filtersHeader}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${styles.searchInput} ${styles.fontBody}`}
              />
              {searchInput && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setSearchInput("")}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </form>

          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <FaCalendarAlt /> Time Period
              </label>
              <select
                value={filterOption}
                onChange={(e) => handleFilterOptionChange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <FaFilter /> Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, current_page: 1 }));
                }}
                className={styles.filterSelect}
              >
                <option value="all">All Logs</option>
                <option value="success">Success Only</option>
                <option value="error">Errors Only</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <FaFilter /> Sort By
              </label>
              <select
                value={sortField}
                onChange={(e) => handleSortChange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="timestamp">Timestamp</option>
                <option value="email">User Email</option>
                <option value="action">Action</option>
                <option value="response_status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.centeredState}>
            <div className={styles.spinner} />
            <p className={styles.fontBody}>Loading user logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <FaSearchPlus
              size={24}
              style={{
                marginBottom: "0.5rem",
                color: "var(--on-surface-variant)",
              }}
            />
            <h3>No logs found</h3>
            <p>Try adjusting your search criteria or time period.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSortChange("email")}
                      className={styles.sortableHeader}
                    >
                      <span className={styles.headerContent}>
                        <FaUser className={styles.headerIcon} />
                        User
                        {sortField === "email" &&
                          (sortOrder === "asc" ? (
                            <FaSortUp className={styles.sortIcon} />
                          ) : (
                            <FaSortDown className={styles.sortIcon} />
                          ))}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSortChange("action")}
                      className={styles.sortableHeader}
                    >
                      <span className={styles.headerContent}>
                        <FaCog className={styles.headerIcon} />
                        Action
                        {sortField === "action" &&
                          (sortOrder === "asc" ? (
                            <FaSortUp className={styles.sortIcon} />
                          ) : (
                            <FaSortDown className={styles.sortIcon} />
                          ))}
                      </span>
                    </th>
                    <th>
                      <span className={styles.headerContent}>
                        <FaFilter className={styles.headerIcon} />
                        Status
                      </span>
                    </th>
                    <th>
                      <span className={styles.headerContent}>
                        <FaServer className={styles.headerIcon} />
                        Message
                      </span>
                    </th>
                    <th
                      onClick={() => handleSortChange("timestamp")}
                      className={styles.sortableHeader}
                    >
                      <span className={styles.headerContent}>
                        <FaCalendarAlt className={styles.headerIcon} />
                        Timestamp
                        {sortField === "timestamp" &&
                          (sortOrder === "asc" ? (
                            <FaSortUp className={styles.sortIcon} />
                          ) : (
                            <FaSortDown className={styles.sortIcon} />
                          ))}
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr
                      key={log._id}
                      className={styles.tableRow}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userInitial}>
                            {(log.doctor_name || log.email)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className={styles.userInfo}>
                            <div className={styles.userNameText}>
                              {log.doctor_name || "Unknown User"}
                            </div>
                            <div className={styles.userEmail}>{log.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${getActionBadgeClass(
                            log.action,
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(
                            log.response_status,
                          )}`}
                        >
                          {getStatusText(log.response_status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.messageText}>
                          {log.response_status >= 400 ? (
                            <>
                              <span
                                style={{ fontWeight: 600, color: "#dc2626" }}
                              >
                                Failed:
                              </span>{" "}
                              {log.action_message}
                              <br />
                              <span
                                style={{ fontSize: "0.85em", opacity: 0.8 }}
                              >
                                {log.error_message
                                  ? `Reason: ${log.error_message}`
                                  : `Status ${log.response_status} at ${log.endpoint}`}
                              </span>
                            </>
                          ) : (
                            log.action_message || "Success"
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.timestampText}>
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <span className={styles.paginationText}>
                Showing <strong>{filteredLogs.length}</strong> of{" "}
                <strong>{pagination.total_records}</strong> logs
              </span>

              <div className={styles.paginationControls}>
                <button
                  className={styles.pageButton}
                  disabled={pagination.current_page === 1}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  aria-label="Previous Page"
                >
                  <FaChevronLeft />
                </button>

                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    className={`${styles.pageButton} ${
                      page === pagination.current_page ? styles.activePage : ""
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
                  disabled={pagination.current_page === pagination.total_pages}
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  aria-label="Next Page"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserLogs;
