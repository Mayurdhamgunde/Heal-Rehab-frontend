import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, CloudUpload, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../../css/ExpensesModule/EditExpense.module.css";
import api from "../../utils/central";

// Define standard categories to check against fetched data
const PREDEFINED_CATEGORIES = [
  "Personnel & Payroll",
  "Clinical & Medical Supplies",
  "Facility & Infrastructure",
  "Administrative & Technology",
  "Marketing & Legal"
];

const EditExpense = () => {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  
  // State for custom category input
  const [customCategory, setCustomCategory] = useState<string>("");
  
  // 🌟 State to hold the existing receipt URL
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    expenseDate: "",
    paymentMethod: "Cash",
    status: "Paid",
    vendor_name: "",
    inovoiceNumber: "",
    notes: "",
  });

  // Helper to check if the URL is a PDF (ignoring SAS token parameters)
  const isPdf = (url: string) => url.split('?')[0].toLowerCase().includes('.pdf');

  // Fetch existing expense data on mount
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await api.get(`/expense/${expenseId}`);
        const data = response.data;

        // 🌟 Set the existing receipt URL from the backend
        setExistingReceiptUrl(data.receiptSasUrl || null);

        // Handle custom categories from the database
        const fetchedCategory = data.category || "";
        let finalCategory = "";
        let finalCustomCategory = "";

        if (fetchedCategory) {
          if (PREDEFINED_CATEGORIES.includes(fetchedCategory)) {
            finalCategory = fetchedCategory;
          } else {
            finalCategory = "Other";
            finalCustomCategory = fetchedCategory;
          }
        }

        setCustomCategory(finalCustomCategory);

        setFormData({
          title: data.title || "",
          amount: data.amount || "",
          category: finalCategory,
          expenseDate: data.expenseDate
            ? new Date(data.expenseDate).toISOString().split("T")[0]
            : "",
          paymentMethod: data.paymentMethod || "Cash",
          status: data.status || "Paid",
          vendor_name: data.vendor_name || "",
          inovoiceNumber: data.inovoiceNumber || "",
          notes: data.notes || "",
        });
      } catch (err: any) {
        console.error("Error fetching expense:", err);
        setErrorMsg("Failed to load expense details. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };

    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Intercept 'Other' category and send custom string instead
        if (key === "category" && value === "Other") {
          payload.append(key, customCategory);
        } else {
          payload.append(key, value as string);
        }
      }
    });

    if (file) {
      payload.append("images", file); 
    }

    try {
      const response = await api.patch(
        `/update/expense/${expenseId}`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccessMsg(response.data.message || "Expense updated successfully!");

      setTimeout(() => navigate(-1), 1500);
    } catch (error: any) {
      console.error("Error updating expense", error);
      setErrorMsg(
        error.response?.data?.error ||
          "Failed to update expense. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className={styles.pageTitle}>Edit Expense</h1>
        </div>
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loaderText}>Loading expense details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back to Expense
        </button>
        <h1 className={styles.pageTitle}>Edit Expense</h1>
      </div>

      <div className={styles.formCard}>
        {successMsg && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── Section 1: Expense Information ── */}
          <div className={styles.section1Block}>
            <h3 className={styles.sectionTitle}>Expense Information</h3>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Expense Title <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter expense title"
                />
              </div>

              {/* Updated Category Dropdown */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Category <span className={styles.required}>*</span>
                </label>
                <select
                  required
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="" disabled>Select a category</option>
                  <option value="Personnel & Payroll">Personnel & Payroll</option>
                  <option value="Clinical & Medical Supplies">Clinical & Medical Supplies</option>
                  <option value="Facility & Infrastructure">Facility & Infrastructure</option>
                  <option value="Administrative & Technology">Administrative & Technology</option>
                  <option value="Marketing & Legal">Marketing & Legal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Custom Category Input - Only shows if 'Other' is selected */}
              {formData.category === "Other" && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Specify Category <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className={styles.input}
                    placeholder="Enter custom category"
                  />
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.label}>Vendor Name</label>
                <input
                  type="text"
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter vendor name"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Invoice Number</label>
                <input
                  type="text"
                  name="inovoiceNumber"
                  value={formData.inovoiceNumber}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter invoice number"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <hr className={styles.sectionDivider} />

          {/* ── Section 2: Expense Details ── */}
          <div className={styles.section2Block}>
            <h3 className={styles.sectionTitle}>Expense Details</h3>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Amount (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter amount in rupees"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Enter any additional notes"
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Update Receipt / Invoice</label>

                {/* 🌟 THIS BLOCK SHOWS THE ACTUAL IMAGE PREVIEW 🌟 */}
                {existingReceiptUrl && !file && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--hover-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem' }}>
                      Current Attachment:
                    </span>
                    
                    {isPdf(existingReceiptUrl) ? (
                      <a href={existingReceiptUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', background: 'var(--white)', borderRadius: '8px', textDecoration: 'none', color: 'var(--primary-color)', border: '1px solid var(--border-color)' }}>
                        <FileText size={48} style={{ marginBottom: '1rem' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>View PDF Document</p>
                      </a>
                    ) : (
                      <div style={{ textAlign: 'center', background: 'var(--white)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <img 
                          src={existingReceiptUrl} 
                          alt="Current Receipt" 
                          style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '4px' }} 
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* 🌟 END IMAGE PREVIEW BLOCK 🌟 */}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <div className={styles.dropzone} onClick={handleDropzoneClick}>
                  <CloudUpload size={40} className={styles.uploadIcon} />
                  <span className={styles.uploadText}>
                    {existingReceiptUrl && !file ? "Click to upload a replacement file" : "Click to upload receipt or invoice"}
                  </span>
                  <span className={styles.uploadSubtext}>
                    Supports: JPG, PNG, PDF (Max 10MB)
                  </span>
                </div>

                {file && (
                  <div className={styles.selectedFile}>
                    <FileText size={16} />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={styles.saveBtn}
            >
              {submitting ? "Updating..." : "Update Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpense;