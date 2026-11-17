import React, { useState, useEffect, useRef } from "react";
import styles from "../css/invoiceList.module.css";
import api from "../utils/central";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit,
  FiRefreshCw,
  FiLoader,
  FiUser, // Icon for Patient
  FiBriefcase, // Icon for Partner
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import InvoiceTemplate from "./invoiceTemplate";

// --- INTERFACES ---

// Updated to match the new Schema Structure
interface Invoice {
  _id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;

  // New Unified Recipient Data
  recipient_type: "Patient" | "Partner";
  recipient_snapshot: {
    name: string;
    phone?: string;
    email?: string;
    gstin?: string; // Specific to Partners
    address?: any;
    billing_address?: string; // String fallback for Partners
  };

  final_amount: number; // Matches schema 'final_amount'
  total_paid: number; // Matches schema 'total_paid'
  balance_due: number;
  payment_status:
    | "Draft"
    | "Sent"
    | "Paid"
    | "Partially Paid"
    | "Overdue"
    | "Cancelled";
  created_at: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_records: number;
}

interface InvoiceFilters {
  status: string;
  recipientType: string; // New Filter
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
}

const InvoiceList: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [printData, setPrintData] = useState<any>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const printTitle = useRef("Invoice");
  // Pagination State
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 0,
    total_records: 0,
  });

  // Filter State
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: "",
    recipientType: "", // Default: All
    dateFrom: "",
    dateTo: "",
    searchQuery: "",
  });

  const [limit] = useState<number>(10);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(
    new Set(),
  );

  // --- FUNCTIONS ---
  const showToast = (type: "success" | "error", message: string) => {
    alert(type === "success" ? `✓ ${message}` : `✗ ${message}`);
  };

  const fetchInvoices = async (
    page: number = pagination.current_page,
    showLoader: boolean = true,
  ) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Append active filters
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.recipientType)
        queryParams.append("recipientType", filters.recipientType);
      if (filters.dateFrom) queryParams.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) queryParams.append("dateTo", filters.dateTo);
      if (filters.searchQuery)
        queryParams.append("search", filters.searchQuery); // Controller uses 'search'

      const response = await api.get(`/get/invoices?${queryParams}`);

      setInvoices(response.data.invoices || []);

      // Update Pagination from response
      if (response.data.pagination) {
        setPagination({
          current_page: response.data.pagination.page,
          total_pages: response.data.pagination.pages,
          total_records: response.data.pagination.total,
        });
      }
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      const errorMessage =
        error.response?.data?.message || "Error fetching invoices.";
      showToast("error", errorMessage);
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = (field: keyof InvoiceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    fetchInvoices(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      recipientType: "",
      dateFrom: "",
      dateTo: "",
      searchQuery: "",
    });
    // Timeout to allow state update before fetch
    setTimeout(() => fetchInvoices(1), 50);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      fetchInvoices(page);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: printTitle.current,
  });
  const formatCurrency = (amount: number | undefined | null) => {
    const validAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return `₹${validAmount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "draft";
    let styleClass = styles.statusDraft;

    if (statusLower === "paid") styleClass = styles.statusPaid;
    else if (statusLower === "sent") styleClass = styles.statusSent;
    else if (statusLower === "overdue") styleClass = styles.statusOverdue;
    else if (statusLower === "cancelled") styleClass = styles.statusCancelled;
    else if (statusLower === "partially paid")
      styleClass = styles.statusPending; // Assuming you have a style for this

    return (
      <span className={`${styles.statusBadge} ${styleClass}`}>
        {status?.toUpperCase() || "DRAFT"}
      </span>
    );
  };

  // Helper to get Recipient Icon
  const getRecipientIcon = (type: string) => {
    if (type === "Partner")
      return <FiBriefcase title="Partner/B2B" style={{ color: "#6366f1" }} />;
    return <FiUser title="Patient" style={{ color: "#10b981" }} />;
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoice/${invoiceId}`); // Adjust route as needed
  };

  const handleEditInvoice = (invoiceId: string) => {
    navigate(`/edit/invoice/${invoiceId}`);
  };

  const handleDownloadInvoice = async (
    invoiceId: string,
    invoiceNumber: string,
  ) => {
    // 1. Set Loading for this row
    setDownloadingInvoices((prev) => new Set(prev).add(invoiceId));

    try {
      // 2. Fetch Data
      const response = await api.get(`/generate/invoice/${invoiceId}`);

      // 3. Update State & Title
      setPrintData(response.data);
      printTitle.current = `Invoice_${invoiceNumber}`;

      // 4. Trigger Print after render
      setTimeout(() => {
        handlePrint();
        // Remove loading state only after print dialog opens
        setDownloadingInvoices((prev) => {
          const newSet = new Set(prev);
          newSet.delete(invoiceId);
          return newSet;
        });
      }, 500);
    } catch (error: any) {
      console.error("Print error:", error);
      showToast("error", "Failed to load invoice for printing");
      setDownloadingInvoices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchInvoices(1);
  }, []);

  // --- RENDER PAGINATION ---
  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;
    return (
      <div className={styles.paginationContainer}>
        <div className={styles.paginationInfo}>
          Page {pagination.current_page} of {pagination.total_pages} (Total:{" "}
          {pagination.total_records})
        </div>
        <div className={styles.paginationControls}>
          <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
            className={styles.pageNavButton}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.total_pages}
            className={styles.pageNavButton}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* --- FILTERS SECTION --- */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) =>
                handleFilterChange("searchQuery", e.target.value)
              }
              placeholder="Search Invoice #, Name, or Phone..."
              className={styles.searchInput}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className={styles.filterActions}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${styles.filterToggleButton} ${
                showFilters ? styles.active : ""
              }`}
            >
              <FiFilter /> Filters
            </button>
            <button onClick={handleSearch} className={styles.searchButton}>
              Search
            </button>
            <button
              onClick={() => fetchInvoices(pagination.current_page, false)}
              className={styles.refreshButton}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? styles.spinning : ""} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className={styles.filtersGrid}>
            <div className={styles.inputGroup}>
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={styles.select}
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* NEW: Recipient Type Filter */}
            <div className={styles.inputGroup}>
              <label>Recipient Type</label>
              <select
                value={filters.recipientType}
                onChange={(e) =>
                  handleFilterChange("recipientType", e.target.value)
                }
                className={styles.select}
              >
                <option value="">All Types</option>
                <option value="Patient">Patient</option>
                <option value="Partner">Partner (B2B)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.filterButtonGroup}>
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- TABLE SECTION --- */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span>Loading invoices...</span>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.invoicesTable}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Recipient</th> {/* Changed from Patient to Recipient */}
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className={styles.emptyState}>
                        <div className={styles.emptyStateContent}>
                          <p>No invoices found</p>
                          <small>Try adjusting your search filters</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => {
                      const isDownloading = downloadingInvoices.has(
                        invoice._id,
                      );
                      // Fallback logic for name if snapshot missing (backward compatibility)
                      const recipientName =
                        invoice.recipient_snapshot?.name || "Unknown";
                      const recipientPhone =
                        invoice.recipient_snapshot?.phone || "N/A";

                      return (
                        <tr key={invoice._id} className={styles.tableRow}>
                          <td className={styles.invoiceNumberCell}>
                            <span className={styles.invoiceNumber}>
                              {invoice.invoice_number || "N/A"}
                            </span>
                          </td>
                          <td>
                            <div className={styles.patientInfo}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {getRecipientIcon(invoice.recipient_type)}
                                <span className={styles.patientName}>
                                  {recipientName}
                                </span>
                              </div>
                              <small className={styles.patientPhone}>
                                {recipientPhone}
                              </small>
                            </div>
                          </td>
                          <td>{formatDate(invoice.invoice_date)}</td>
                          <td>{formatDate(invoice.due_date)}</td>

                          {/* Use new field names from Schema */}
                          <td className={styles.amountCell}>
                            {formatCurrency(invoice.final_amount)}
                          </td>
                          <td className={styles.amountCell}>
                            {formatCurrency(invoice.total_paid)}
                          </td>
                          <td className={styles.amountCell}>
                            <span
                              className={
                                (invoice.balance_due || 0) > 1
                                  ? styles.balancePending
                                  : styles.balancePaid
                              }
                            >
                              {formatCurrency(invoice.balance_due)}
                            </span>
                          </td>
                          <td>{getStatusBadge(invoice.payment_status)}</td>
                          <td className={styles.actionsCell}>
                            <div className={styles.actionButtons}>
                              <button
                                onClick={() => handleViewInvoice(invoice._id)}
                                className={styles.actionButton}
                                title="View Details"
                              >
                                <FiEye />
                              </button>
                              <button
                                onClick={() => handleEditInvoice(invoice._id)}
                                className={styles.actionButton}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                onClick={() =>
                                  handleDownloadInvoice(
                                    invoice._id,
                                    invoice.invoice_number,
                                  )
                                }
                                className={`${styles.actionButton} ${
                                  isDownloading ? styles.downloadingButton : ""
                                }`}
                                title="Download PDF"
                                disabled={isDownloading}
                              >
                                {isDownloading ? (
                                  <FiLoader className={styles.spinningLoader} />
                                ) : (
                                  <FiDownload />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </div>
      <div style={{ display: "none" }}>
        <InvoiceTemplate data={printData} componentRef={componentRef} />
      </div>
    </div>
  );
};

export default InvoiceList;
