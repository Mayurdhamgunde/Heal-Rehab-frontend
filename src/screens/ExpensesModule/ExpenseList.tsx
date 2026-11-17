import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Eye, Edit2, X, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styles from "../../css/ExpensesModule/ExpenseList.module.css";
import api from "../../utils/central"; // Adjust path as needed
import { useNavigate } from "react-router-dom";

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  paymentMethod: string;
  status: string;
  vendor_name?: string;
}

interface FilterState {
  status: string;
  category: string;
  timePeriod: string;
  startDate: string;
  endDate: string;
}

// Updated colors to match the screenshot vibe
const COLORS = [
  "#004C5A", // Very dark teal
  "#007B8E", // Your primary base color
  "#00A3BC", // Brighter teal
  "#33C2D6", // Vibrant cyan-teal
  "#7ADEEA", // Soft aqua
  "#B2F0F8"  // Pale icy teal
];

const ExpenseList = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 5;

  // We default to "This Month" to match standard expense tracking behavior
  const initialFilters: FilterState = {
    status: "",
    category: "",
    timePeriod: "This Month",
    startDate: "", 
    endDate: "",
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.timePeriod) params.append("timePeriod", filters.timePeriod);
      
      // Only send custom dates to the backend if 'Custom' is selected
      if (filters.timePeriod === "Custom") {
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
      }
      
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      const response = await api.get(`/all/expenses?${params.toString()}`);
      
      setExpenses(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalItems(response.data.meta.totalItems);

    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError(err.response?.data?.error || "Failed to load expenses.");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Generate chart data dynamically from the current expenses array
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((expense) => {
      const cat = expense.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const totalChartAmount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      
      // If switching away from Custom, clear out the old custom dates
      if (key === "timePeriod" && value !== "Custom") {
        newFilters.startDate = "";
        newFilters.endDate = "";
      }
      
      return newFilters;
    });
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      category: "",
      timePeriod: "This Month", // Reset back to default
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatCompactCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  // Simplified and completely TypeScript-safe logic
  const hasActiveFilters = 
    filters.status !== "" || 
    filters.category !== "" || 
    filters.timePeriod !== "This Month" || 
    filters.startDate !== "" || 
    filters.endDate !== "";

  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const showingTo = Math.min(currentPage * limit, totalItems);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Expenses</h1>
        <button className={styles.primaryButton} onClick={() => navigate("/addExpense")}>
          <Plus size={18} /> Add New Expense
        </button>
      </div>

      {/* Filter Controls */}
      <div className={styles.filterControls}>
        
        {/* Time Period Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Time Period</label>
          <select 
            value={filters.timePeriod} 
            onChange={(e) => handleFilterChange("timePeriod", e.target.value)} 
            className={styles.filterSelect}
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="This Year">This Year</option>
            <option value="Last Year">Last Year</option>
            <option value="All Time">All Time</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} className={styles.filterSelect}>
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Category</label>
          <select 
            value={filters.category} 
            onChange={(e) => handleFilterChange("category", e.target.value)} 
            className={styles.filterSelect}
          >
            <option value="">All Categories</option>
            <option value="Personnel & Payroll">Personnel & Payroll</option>
            <option value="Clinical & Medical Supplies">Clinical & Medical Supplies</option>
            <option value="Facility & Infrastructure">Facility & Infrastructure</option>
            <option value="Administrative & Technology">Administrative & Technology</option>
            <option value="Marketing & Legal">Marketing & Legal</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Conditional Custom Date Filters */}
        {filters.timePeriod === "Custom" && (
          <>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Start Date</label>
              <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} className={styles.filterInput} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>End Date</label>
              <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} className={styles.filterInput} />
            </div>
          </>
        )}

        {hasActiveFilters && (
          <button className={styles.clearFilters} onClick={clearFilters}>
            <X size={18} /> Clear
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className={styles.emptyState}>
          <AlertCircle size={48} color="var(--error)" />
          <p className={styles.emptyText}>{error}</p>
        </div>
      ) : loading ? (
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.emptyText}>Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {hasActiveFilters ? "No expenses found matching your filters." : "You haven't added any expenses yet."}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.mainGrid}>
            
            {/* Table Wrapper */}
            <div className={styles.tableWrapper}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Date & Time</th>
                      <th className={styles.th}>Title</th>
                      <th className={styles.th}>Category</th>
                      <th className={styles.th}>Vendor Name</th>
                      <th className={styles.th}>Amount</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense._id} className={styles.tr}>
                        <td className={styles.td}>{formatDate(expense.expenseDate)}</td>
                        <td className={styles.td}>{expense.title}</td>
                        <td className={styles.td}>{expense.category}</td>
                        <td className={styles.td}>{expense.vendor_name || "-"}</td>
                        <td className={styles.td}><strong>₹{formatCurrency(expense.amount)}</strong></td>
                        <td className={styles.td}>
                          <span className={`${styles.statusBadge} ${styles[`status${expense.status}`] || styles.statusPending}`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.actionButtons}>
                            <button className={styles.iconButton} title="View Details" onClick={() => navigate(`/expenseDetails/${expense._id}`)}>
                              <Eye size={18} />
                            </button>
                            <button className={styles.iconButton} title="Edit Expense" onClick={() => navigate(`/editExpense/${expense._id}`)}>
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className={styles.tableFooter}>
                <div className={styles.resultsCount}>
                  Showing {showingFrom}–{showingTo} of {totalItems}
                </div>
                <div className={styles.paginationControls}>
                  <button 
                    className={styles.pageBtn} 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <button 
                    className={styles.pageBtn} 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className={styles.chartWrapper}>
              <h3 className={styles.chartTitle}>Expense Distribution</h3>
              <div className={styles.chartContainer}>
                
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                      <tspan x="50%" dy="-0.5em" fontSize="14" fill="#6c757d">Total</tspan>
                      <tspan x="50%" dy="1.5em" fontSize="22" fontWeight="bold" fill="#1f2937">
                        ₹{formatCompactCurrency(totalChartAmount)}
                      </tspan>
                    </text>
                  </PieChart>
                </ResponsiveContainer>

                <ul className={styles.customLegend}>
                  {chartData.map((entry, index) => (
                    <li key={`item-${index}`} className={styles.legendItem}>
                      <span 
                        className={styles.legendColor} 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className={styles.legendText}>
                        {entry.name.toLowerCase().replace(/ /g, "_")} – ₹{formatCurrency(entry.value)}
                      </span>
                    </li>
                  ))}
                </ul>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseList;