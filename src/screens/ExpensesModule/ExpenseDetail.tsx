import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, FileText, Image as ImageIcon, AlertCircle, Download } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom"; // Adjust if not using react-router
import styles from "../../css/ExpensesModule/ExpenseDetail.module.css";
import api from "../../utils/central"; // Adjust path as needed

interface ExpenseData {
  _id: string;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  paymentMethod: string;
  status: string;
  vendor_name?: string;
  inovoiceNumber?: string;
  notes?: string;
  addedByName?: string;
  receiptSasUrl?: string;
}

const ExpenseDetail = () => {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();

  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/expense/${expenseId}`);
        setExpense(response.data);
      } catch (err: any) {
        console.error("Error fetching expense details:", err);
        setError(err.response?.data?.error || "Failed to load expense details.");
      } finally {
        setLoading(false);
      }
    };

    if (expenseId) {
      fetchExpenseDetails();
    }
  }, [expenseId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to determine if receipt is a PDF or image based on URL string
  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.messageText}>Loading expense details...</p>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <p className={styles.messageText}>{error || "Expense not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Expense Details</h1>
        </div>
        <button 
          className={styles.editButton} 
          onClick={() => navigate(`/editExpense/${expense._id}`)} // Adjust your edit route path
        >
          <Edit2 size={16} /> Edit Expense
        </button>
      </div>

      <div className={styles.detailGrid}>
        {/* Left Column: Data */}
        <div className={styles.card}>
          <h3 className={styles.cardHeader}>
            <FileText size={22} /> Basic Information
          </h3>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Title</span>
            <span className={styles.detailValue}>{expense.title}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Amount</span>
            <span className={styles.detailValue} style={{ fontSize: '1.125rem', color: 'var(--primary-color)' }}>
              ₹{formatCurrency(expense.amount)}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Category</span>
            <span className={styles.detailValue}>{expense.category}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Expense Date</span>
            <span className={styles.detailValue}>{formatDate(expense.expenseDate)}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={styles.detailValue}>
              <span className={`${styles.statusBadge} ${styles[`status${expense.status}`] || styles.statusPending}`}>
                {expense.status}
              </span>
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Payment Method</span>
            <span className={styles.detailValue}>{expense.paymentMethod || "N/A"}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Vendor Name</span>
            <span className={styles.detailValue}>{expense.vendor_name || "N/A"}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Invoice Number</span>
            <span className={styles.detailValue}>{expense.inovoiceNumber || "N/A"}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Added By</span>
            <span className={styles.detailValue}>{expense.addedByName || "N/A"}</span>
          </div>

          {expense.notes && (
            <div className={styles.notesSection}>
              <span className={styles.detailLabel}>Additional Notes</span>
              <div className={styles.notesText}>{expense.notes}</div>
            </div>
          )}
        </div>

        {/* Right Column: Receipt Image */}
        <div className={styles.card} style={{ height: "fit-content" }}>
          <h3 className={styles.cardHeader} style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={22} /> Receipt
            </span>
            {expense.receiptSasUrl && (
              <a href={expense.receiptSasUrl} download target="_blank" rel="noreferrer" title="Download Receipt">
                <Download size={18} color="var(--primary-color)" />
              </a>
            )}
          </h3>

          {expense.receiptSasUrl ? (
            isPdf(expense.receiptSasUrl.split('?')[0]) ? (
              <a href={expense.receiptSasUrl} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '2rem', background: 'var(--hover-bg)', borderRadius: '8px', textDecoration: 'none', color: 'var(--primary-color)' }}>
                <FileText size={48} style={{ marginBottom: '1rem' }} />
                <p>View PDF Document</p>
              </a>
            ) : (
              <a href={expense.receiptSasUrl} target="_blank" rel="noreferrer">
                <img 
                  src={expense.receiptSasUrl} 
                  alt={`Receipt for ${expense.title}`} 
                  className={styles.receiptImage} 
                />
              </a>
            )
          ) : (
            <div className={styles.noReceipt}>
              <ImageIcon size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>No receipt document was uploaded for this expense.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetail;