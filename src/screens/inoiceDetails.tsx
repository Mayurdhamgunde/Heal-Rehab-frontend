import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../css/InvoiceDetails.module.css";
import api from "../utils/central";
import { useReactToPrint } from "react-to-print";
import {
  FiArrowLeft,
  FiEdit,
  FiDownload,
  FiCreditCard,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiDollarSign,
  FiUser,
  FiBriefcase,
  FiPhone,
  FiMail,
  FiLoader,
  FiMapPin,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";
import InvoiceTemplate from "./invoiceTemplate";

// --- INTERFACES ---
interface InvoiceItem {
  item_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  line_total: number;
  therapy_plan_id?: string;
  is_therapy_plan: boolean;
}

interface PaymentRecord {
  _id?: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
  recorded_by?: string;
}

interface Invoice {
  _id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;

  recipient_type: "Patient" | "Partner";
  recipient_snapshot: {
    name: string;
    phone?: string;
    email?: string;
    gstin?: string;
    billing_address?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
    place_of_supply?: string;
  };

  items: InvoiceItem[];
  subtotal: number;
  total_discount: number;
  total_tax: number;
  tds_rate: number;
  tds_amount: number;
  total_amount: number;
  round_off_amount: number;
  final_amount: number;
  total_paid: number;
  balance_due: number;

  status: "Draft" | "Sent" | "Viewed" | "Paid" | "Overdue" | "Cancelled";
  payment_status:
    | "Unpaid"
    | "Partially Paid"
    | "Paid"
    | "Overdue"
    | "Cancelled";
  payment_terms: string;
  payments_received: PaymentRecord[];
  notes?: string;
  terms_and_conditions?: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
}

interface PaymentFormData {
  amount: string;
  method: string;
  reference: string;
  notes: string;
}

const InvoiceDetails: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  // --- STATE ---
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: "",
    method: "Cash",
    reference: "",
    notes: "",
  });
  const [printData, setPrintData] = useState<any>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  // --- PRINT HOOK ---
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: invoice ? `Invoice_${invoice.invoice_number}` : "Invoice",
  });

  // --- FUNCTIONS ---
  const showToast = (type: "success" | "error", message: string) => {
    alert(type === "success" ? `✓ ${message}` : `✗ ${message}`);
  };

  const fetchInvoice = async () => {
    if (!invoiceId) {
      showToast("error", "Invalid invoice ID");
      navigate("/invoices");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/get/invoice/${invoiceId}`);
      setInvoice(response.data.invoice);
    } catch (error: any) {
      console.error("Error fetching invoice:", error);
      const errorMessage =
        error.response?.data?.message || "Error fetching invoice.";
      showToast("error", errorMessage);
      if (error.response?.status === 404) {
        navigate("/invoices");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (newStatus: string) => {
    if (!invoice || updating) return;

    if (
      newStatus === "Cancelled" &&
      !window.confirm("Are you sure you want to cancel this invoice?")
    ) {
      return;
    }

    try {
      setUpdating(true);
      const response = await api.put(`/update/invoice/${invoiceId}`, {
        status: newStatus,
      });

      if (response.data.invoice) {
        setInvoice(response.data.invoice);
      } else {
        setInvoice((prev) =>
          prev ? { ...prev, status: newStatus as any } : null,
        );
      }

      showToast("success", `Invoice status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating invoice status:", error);
      const errorMessage =
        error.response?.data?.message || "Error updating status.";
      showToast("error", errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || processingPayment) return;

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("error", "Please enter a valid payment amount");
      return;
    }

    if (amount > invoice.balance_due + 1) {
      showToast("error", "Payment amount cannot exceed balance due");
      return;
    }

    try {
      setProcessingPayment(true);
      const response = await api.post(`/record/invoice/payment/${invoiceId}`, {
        amount: amount,
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });

      setInvoice((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          total_paid: prev.total_paid + amount,
          balance_due: response.data.new_balance,
          payment_status: response.data.payment_status,
          payments_received: [
            ...prev.payments_received,
            {
              amount: amount,
              date: new Date().toISOString(),
              method: paymentForm.method,
              reference: paymentForm.reference,
              notes: paymentForm.notes,
            },
          ],
        };
      });

      setShowPaymentModal(false);
      setPaymentForm({
        amount: "",
        method: "Cash",
        reference: "",
        notes: "",
      });

      showToast("success", "Payment recorded successfully");
    } catch (error: any) {
      console.error("Error recording payment:", error);
      const errorMessage =
        error.response?.data?.message || "Error recording payment.";
      showToast("error", errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoice || downloadingPdf) return;

    try {
      setDownloadingPdf(true);
      const response = await api.get(`/generate/invoice/${invoiceId}`);
      console.log(response.data);
      setPrintData(response.data);

      setTimeout(() => {
        handlePrint();
        setDownloadingPdf(false);
      }, 500);
    } catch (error: any) {
      console.error("Error preparing print:", error);
      showToast("error", "Failed to prepare invoice for printing.");
      setDownloadingPdf(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    const validAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return `₹${validAmount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatAddress = (recipient: Invoice["recipient_snapshot"]) => {
    if (recipient.billing_address) return recipient.billing_address;
    if (recipient.address) {
      const { street, city, state, zip, country } = recipient.address;
      return [street, city, state, zip, country].filter(Boolean).join(", ");
    }
    return "N/A";
  };

  const getStatusBadge = (status: string) => {
    // Normalize status to match keys case-insensitively if needed,
    // but typically we just map the string directly.
    const statusClasses: Record<string, string> = {
      Draft: styles.statusDraft,
      Sent: styles.statusSent,
      Viewed: styles.statusViewed,
      Paid: styles.statusPaid,
      Overdue: styles.statusOverdue,
      Cancelled: styles.statusCancelled,
    };

    // Find class by matching keys (handling case differences)
    const statusKey = Object.keys(statusClasses).find(
      (key) => key.toLowerCase() === status?.toLowerCase(),
    );
    const badgeClass = statusKey
      ? statusClasses[statusKey]
      : styles.statusDraft;

    return (
      <span className={`${styles.statusBadge} ${badgeClass}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      Unpaid: styles.paymentUnpaid,
      "Partially Paid": styles.paymentPartial,
      Paid: styles.paymentPaid,
      Overdue: styles.paymentOverdue,
      Cancelled: styles.paymentOverdue,
    };

    const statusKey = Object.keys(statusClasses).find(
      (key) => key.toLowerCase() === status?.toLowerCase(),
    );
    const badgeClass = statusKey
      ? statusClasses[statusKey]
      : styles.paymentUnpaid;

    return (
      <span className={`${styles.paymentBadge} ${badgeClass}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <span>Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Invoice not found</p>
          <button
            onClick={() => navigate("/invoice/list")}
            className={styles.backButton}
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  // Safe check for cancelled status (case-insensitive)
  const isCancelled = invoice.status?.toLowerCase() === "cancelled";
  const recipient = invoice.recipient_snapshot;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            onClick={() => navigate("/invoice/list")}
            className={styles.backButton}
          >
            <FiArrowLeft />
            Back to List
          </button>
          <div className={styles.titleSection}>
            <h1 className={styles.mainTitle}>
              Invoice {invoice.invoice_number}
            </h1>
            <div className={styles.statusSection}>
              {getStatusBadge(invoice.status)}
              {getPaymentStatusBadge(invoice.payment_status)}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!isCancelled && (
            <button
              onClick={() => navigate(`/edit/invoice/${invoiceId}`)}
              className={styles.actionButton}
            >
              <FiEdit />
              Edit
            </button>
          )}
          <button
            onClick={handleDownloadInvoice}
            className={`${styles.actionButton} ${
              downloadingPdf ? styles.downloadingButton : ""
            }`}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <>
                <FiLoader className={styles.spinningLoader} />
                PDF...
              </>
            ) : (
              <>
                <FiDownload />
                PDF
              </>
            )}
          </button>
          <button
            onClick={fetchInvoice}
            className={styles.refreshButton}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? styles.spinning : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Invoice Details Card */}
        <div className={styles.detailsCard}>
          <h2 className={styles.cardTitle}>Invoice Details</h2>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Invoice Date:</span>
              <span className={styles.detailValue}>
                {formatDate(invoice.invoice_date)}
              </span>
            </div>
            {invoice.due_date && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Due Date:</span>
                <span className={styles.detailValue}>
                  {formatDate(invoice.due_date)}
                </span>
              </div>
            )}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Payment Terms:</span>
              <span className={styles.detailValue}>
                {invoice.payment_terms}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Created By:</span>
              <span className={styles.detailValue}>
                {invoice.created_by_name}
              </span>
            </div>
          </div>
        </div>

        {/* Recipient Information Card */}
        <div className={styles.patientCard}>
          <h2 className={styles.cardTitle}>
            {invoice.recipient_type} Information
          </h2>
          <div className={styles.patientInfo}>
            <div className={styles.patientDetail}>
              {invoice.recipient_type === "Partner" ? (
                <FiBriefcase className={styles.patientIcon} />
              ) : (
                <FiUser className={styles.patientIcon} />
              )}
              <span style={{ fontWeight: 600 }}>{recipient.name}</span>
            </div>

            {recipient.phone && (
              <div className={styles.patientDetail}>
                <FiPhone className={styles.patientIcon} />
                <span>{recipient.phone}</span>
              </div>
            )}

            {recipient.email && (
              <div className={styles.patientDetail}>
                <FiMail className={styles.patientIcon} />
                <span>{recipient.email}</span>
              </div>
            )}

            {recipient.gstin && (
              <div className={styles.patientDetail}>
                <FiFileText className={styles.patientIcon} />
                <span>GSTIN: {recipient.gstin}</span>
              </div>
            )}

            <div
              className={styles.patientDetail}
              style={{ alignItems: "flex-start" }}
            >
              <FiMapPin
                className={styles.patientIcon}
                style={{ marginTop: "3px" }}
              />
              <span style={{ fontSize: "0.9rem", color: "#666" }}>
                {formatAddress(recipient)}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Summary Card */}
        <div className={styles.amountCard}>
          <h2 className={styles.cardTitle}>Amount Summary</h2>
          <div className={styles.amountSummary}>
            <div className={styles.amountRow}>
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className={styles.amountRow}>
              <span>Discount:</span>
              <span>-{formatCurrency(invoice.total_discount)}</span>
            </div>
            <div className={styles.amountRow}>
              <span>Tax:</span>
              <span>{formatCurrency(invoice.total_tax)}</span>
            </div>
            {invoice.tds_amount > 0 && (
              <div className={styles.amountRow}>
                <span>TDS ({invoice.tds_rate}%):</span>
                <span>-{formatCurrency(invoice.tds_amount)}</span>
              </div>
            )}
            <div className={styles.amountRow}>
              <span>Round Off:</span>
              <span>{formatCurrency(invoice.round_off_amount)}</span>
            </div>
            <div className={`${styles.amountRow} ${styles.totalRow}`}>
              <span>Total Amount:</span>
              <span>{formatCurrency(invoice.final_amount)}</span>
            </div>
            <div className={styles.amountRow}>
              <span>Paid:</span>
              <span className={styles.paidAmount}>
                {formatCurrency(invoice.total_paid)}
              </span>
            </div>
            <div className={`${styles.amountRow} ${styles.balanceRow}`}>
              <span>Balance Due:</span>
              <span className={styles.balanceAmount}>
                {formatCurrency(invoice.balance_due)}
              </span>
            </div>
          </div>

          {/* Payment Actions - Hidden if Cancelled */}
          {!isCancelled && invoice.balance_due > 1 && (
            <div className={styles.paymentActions}>
              <button
                onClick={() => setShowPaymentModal(true)}
                className={styles.recordPaymentButton}
              >
                <FiCreditCard />
                Record Payment
              </button>
            </div>
          )}
        </div>

        {/* Status Actions Card */}
        {invoice && !isCancelled && (
          <div className={styles.statusCard}>
            <h2 className={styles.cardTitle}>Status Actions</h2>
            <div className={styles.statusActions}>
              {/* Mark as Sent - VISIBLE only if status is Draft (case-insensitive) */}
              {invoice.payment_status?.toLowerCase() === "draft" && (
                <button
                  onClick={() => updateInvoiceStatus("Sent")}
                  disabled={updating}
                  className={styles.statusActionButton}
                >
                  <FiCheck />
                  Mark as Sent
                </button>
              )}

              {/* Mark as Paid (Auto-Pay Full Balance) */}
              {invoice.payment_status !== "Paid" && (
                <button
                  onClick={() => updateInvoiceStatus("Paid")}
                  disabled={updating}
                  className={styles.statusActionButton}
                >
                  <FiDollarSign />
                  Mark as Fully Paid
                </button>
              )}

              {/* Mark as Unpaid (Revert) */}
              {/* Hidden if Draft or already Unpaid */}
              {invoice.payment_status !== "Unpaid" && (
                <button
                  onClick={() => updateInvoiceStatus("Unpaid")}
                  disabled={updating}
                  className={styles.statusActionButton}
                  style={{
                    backgroundColor: "#f0ad4e",
                    borderColor: "#f0ad4e",
                  }}
                >
                  <FiAlertCircle />
                  Mark as Unpaid
                </button>
              )}

              {/* Cancel Invoice */}
              <button
                onClick={() => updateInvoiceStatus("Cancelled")}
                disabled={updating}
                className={styles.cancelButton}
              >
                <FiX />
                Cancel Invoice
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Items Table */}
      <div className={styles.itemsCard}>
        <h2 className={styles.cardTitle}>Invoice Items</h2>
        <div className={styles.tableContainer}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className={styles.itemName}>{item.item_name}</td>
                  <td className={styles.itemDescription}>
                    {item.description || "-"}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>{formatCurrency(item.price_per_unit)}</td>
                  <td>{formatCurrency(item.discount_amount)}</td>
                  <td>{formatCurrency(item.tax_amount)}</td>
                  <td className={styles.itemTotal}>
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments_received.length > 0 && (
        <div className={styles.paymentsCard}>
          <h2 className={styles.cardTitle}>Payment History</h2>
          <div className={styles.tableContainer}>
            <table className={styles.paymentsTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments_received.map((payment, index) => (
                  <tr key={index}>
                    <td>{formatDate(payment.date)}</td>
                    <td className={styles.paymentAmount}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td>{payment.method}</td>
                    <td>{payment.reference || "-"}</td>
                    <td>{payment.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className={styles.notesCard}>
          <h2 className={styles.cardTitle}>Notes</h2>
          <p className={styles.notesContent}>{invoice.notes}</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Record Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={styles.closeButton}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className={styles.paymentForm}>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  max={invoice.balance_due}
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  className={styles.formInput}
                  required
                  placeholder={`Max: ${formatCurrency(invoice.balance_due)}`}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, method: e.target.value })
                  }
                  className={styles.formSelect}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      reference: e.target.value,
                    })
                  }
                  className={styles.formInput}
                  placeholder="Transaction ID, Cheque number, etc."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Additional notes about this payment"
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className={styles.cancelFormButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className={styles.submitButton}
                >
                  {processingPayment ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div style={{ display: "none" }}>
        <InvoiceTemplate data={printData} componentRef={componentRef} />
      </div>
    </div>
  );
};

export default InvoiceDetails;
