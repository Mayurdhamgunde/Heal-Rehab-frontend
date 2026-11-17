import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowLeft,
  Edit2,
  Eye,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import styles from "../css/ExpenseManager.module.css";
// Adjust the path to your central API utility
import api from "../utils/central"; 

// --- Interfaces ---
interface Expense {
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
  receiptUrl?: string;
  receiptSasUrl?: string;
}

type ViewState = "list" | "add" | "edit" | "view";

const ExpenseManager = () => {
  const [view, setView] = useState<ViewState>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // --- Main Render ---
  return (
    <div className={styles.container}>
      {view === "list" && (
        <ExpenseList 
          onAdd={() => setView("add")} 
          onEdit={(id) => { setSelectedId(id); setView("edit"); }} 
          onView={(id) => { setSelectedId(id); setView("view"); }} 
        />
      )}
      {view === "add" && <ExpenseForm onBack={() => setView("list")} />}
      {view === "edit" && selectedId && (
        <ExpenseForm expenseId={selectedId} onBack={() => setView("list")} />
      )}
      {view === "view" && selectedId && (
        <ExpenseDetail expenseId={selectedId} onBack={() => setView("list")} />
      )}
    </div>
  );
};

// --- Screen 1: List All Expenses ---
const ExpenseList = ({
  onAdd,
  onEdit,
  onView,
}: {
  onAdd: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get("/all/expenses");
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  if (loading) return <div className={styles.loaderContainer}><div className={styles.spinner} /></div>;

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Expense Management</h1>
        <button className={styles.primaryButton} onClick={onAdd}>
          <Plus size={18} /> Add New Expense
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Title</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Amount</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp._id} className={styles.tr}>
                <td className={styles.td}>
                  {new Date(exp.expenseDate).toLocaleDateString("en-IN")}
                </td>
                <td className={styles.td}><strong>{exp.title}</strong></td>
                <td className={styles.td}>{exp.category}</td>
                <td className={styles.td}>{formatCurrency(exp.amount)}</td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} ${styles[`status${exp.status}`] || styles.statusPending}`}>
                    {exp.status}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className={styles.actionButtons}>
                    <button onClick={() => onView(exp._id)} className={styles.iconButton} title="View Details">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => onEdit(exp._id)} className={styles.iconButton} title="Edit">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

// --- Screen 2 & 3: Add / Edit Expense Form ---
const ExpenseForm = ({
  expenseId,
  onBack,
}: {
  expenseId?: string;
  onBack: () => void;
}) => {
  const isEdit = !!expenseId;
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    status: "Paid",
    vendor_name: "",
    inovoiceNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/expense/${expenseId}`).then((res) => {
        const data = res.data;
        setFormData({
          title: data.title || "",
          amount: data.amount || "",
          category: data.category || "",
          expenseDate: new Date(data.expenseDate).toISOString().split("T")[0],
          paymentMethod: data.paymentMethod || "Cash",
          status: data.status || "Paid",
          vendor_name: data.vendor_name || "",
          inovoiceNumber: data.inovoiceNumber || "",
          notes: data.notes || "",
        });
        setLoading(false);
      });
    }
  }, [expenseId, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value as string));
    
    // NOTE: Your route expects .array("images"), but controller looks for req.file.
    // If your backend multer expects 'images', keep this:
    if (file) payload.append("images", file);

    try {
      if (isEdit) {
        await api.patch(`/update/expense/${expenseId}`, payload);
      } else {
        await api.post("/create/expense", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onBack();
    } catch (error) {
      console.error("Error saving expense", error);
      alert("Failed to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loaderContainer}><div className={styles.spinner} /></div>;

  return (
    <>
      <div className={styles.header}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button className={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className={styles.title}>{isEdit ? "Edit Expense" : "Add New Expense"}</h1>
        </div>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Title *</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} className={styles.input} placeholder="e.g., Office Supplies" />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Amount (₹) *</label>
            <input required type="number" name="amount" value={formData.amount} onChange={handleChange} className={styles.input} placeholder="0.00" />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Category *</label>
            <input required type="text" name="category" value={formData.category} onChange={handleChange} className={styles.input} placeholder="e.g., Equipment" />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Date</label>
            <input type="date" name="expenseDate" value={formData.expenseDate} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Vendor Name</label>
            <input type="text" name="vendor_name" value={formData.vendor_name} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Invoice Number</label>
            <input type="text" name="inovoiceNumber" value={formData.inovoiceNumber} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Payment Method</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className={styles.select}>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={styles.select}>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Receipt Bill (Image/PDF)</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className={styles.input} />
          </div>

          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className={styles.textarea} placeholder="Additional details..." />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onBack} className={styles.backButton}>Cancel</button>
            <button type="submit" disabled={submitting} className={styles.primaryButton}>
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// --- Screen 4: View Detail ---
const ExpenseDetail = ({
  expenseId,
  onBack,
}: {
  expenseId: string;
  onBack: () => void;
}) => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/expense/${expenseId}`).then((res) => {
      setExpense(res.data);
      setLoading(false);
    });
  }, [expenseId]);

  if (loading || !expense) return <div className={styles.loaderContainer}><div className={styles.spinner} /></div>;

  return (
    <>
      <div className={styles.header}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button className={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className={styles.title}>Expense Details</h1>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.detailSection}>
          <h3 style={{ marginTop: 0, color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} /> Basic Information
          </h3>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Title</span>
            <span className={styles.detailValue}>{expense.title}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Amount</span>
            <span className={styles.detailValue}>₹{expense.amount.toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Category</span>
            <span className={styles.detailValue}>{expense.category}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Date</span>
            <span className={styles.detailValue}>{new Date(expense.expenseDate).toLocaleDateString("en-IN")}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={`${styles.statusBadge} ${styles[`status${expense.status}`] || styles.statusPending}`}>
              {expense.status}
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
          {expense.notes && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
              <span className={styles.detailLabel}>Notes</span>
              <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", color: "var(--text-dark)" }}>{expense.notes}</p>
            </div>
          )}
        </div>

        <div className={styles.detailSection} style={{ height: "fit-content" }}>
          <h3 style={{ marginTop: 0, color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "8px" }}>
            <ImageIcon size={20} /> Receipt
          </h3>
          {expense.receiptSasUrl ? (
            <a href={expense.receiptSasUrl} target="_blank" rel="noreferrer">
              <img src={expense.receiptSasUrl} alt="Receipt Bill" className={styles.receiptImage} />
            </a>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-light)", background: "var(--hover-bg)", borderRadius: "8px", marginTop: "1rem" }}>
              No receipt uploaded
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpenseManager;