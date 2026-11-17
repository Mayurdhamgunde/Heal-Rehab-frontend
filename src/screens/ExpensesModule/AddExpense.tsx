import React, { useState, useRef } from "react";
import { ArrowLeft, CloudUpload, FileText, CheckCircle } from "lucide-react";
import styles from "../../css/ExpensesModule/AddExpense.module.css";
import api from "../../utils/central";

const AddExpense = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [customCategory, setCustomCategory] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // If category is "Other", append the custom category string instead
      if (key === "category" && value === "Other") {
        payload.append(key, customCategory);
      } else {
        payload.append(key, value as string);
      }
    });

    if (file) {
      payload.append("images", file);
    }

    try {
      await api.post("/create/expense", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Trigger success screen
      setIsSuccess(true);
      
      // Call the new helper function
      scrollToTop();
      
      // Reset form data
      setFormData({
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
      setFile(null);
      setCustomCategory("");
    } catch (error: any) {
      console.error("Error saving expense", error);
      setErrorMsg(
        error.response?.data?.error || "Failed to add expense. Please try again."
      );
      
      // Call helper on error as well
      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setIsSuccess(false);
    setErrorMsg("");
    
    // Call helper when resetting
    scrollToTop();
  };

  // ── Bulletproof Scroll Helper ──
  const scrollToTop = () => {
    setTimeout(() => {
      // 1. Try standard window/document scroll
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      document.body.scrollTo({ top: 0, behavior: "smooth" });

      // 2. Try the Ref we created earlier
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      // 3. "Dashboard Layout" Fix: Find any element that is currently scrolled down and force it up
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        if (el.scrollTop > 0) {
          el.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }, 150); // A 150ms delay ensures React finishes updating the UI before scrolling
  };

  return (
    <div className={styles.container} ref={topRef}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <button
          className={styles.backButton}
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={18} />
          Back to Expense History
        </button>
        <h1 className={styles.pageTitle}>Add New Expense</h1>
      </div>

      <div className={styles.formCard}>
        {/* ── Success Overlay ── */}
        {isSuccess ? (
          <div className={styles.successOverlay}>
            <div className={styles.successIconCircle}>
              <CheckCircle size={40} />
            </div>
            <h2 className={styles.successTitle}>Expense Added Successfully!</h2>
            <p className={styles.successSubtext}>
              Your expense record has been created and saved securely.
            </p>
            
            <div className={styles.successActions}>
              <button
                type="button"
                onClick={() => window.history.back()}
                className={styles.cancelBtn}
              >
                Go to History
              </button>
              <button
                type="button"
                onClick={handleAddAnother}
                className={styles.saveBtn}
              >
                Add Another Expense
              </button>
            </div>
          </div>
        ) : (
          /* ── Expense Form ── */
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div className={`${styles.alert} ${styles.alertError}`}>
                {errorMsg}
              </div>
            )}

            {/* Section 1: Expense Information */}
            <div className={styles.section1Block}>
              <h3 className={styles.sectionTitle}>Expense Information</h3>

              <div className={styles.formGrid}>
                {/* Expense Title */}
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

                {/* Category */}
             {/* Category */}
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
                {/* Vendor Name */}
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

                {/* Invoice Number */}
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

                {/* Payment Method */}
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

                {/* Date */}
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

                {/* Status */}
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

            {/* Section 2: Expense Details */}
            <div className={styles.section2Block}>
              <h3 className={styles.sectionTitle}>Expense Details</h3>

              <div className={styles.formGrid}>
                {/* Amount */}
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

                {/* Notes */}
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

                {/* Receipt / Invoice Upload */}
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Receipt / Invoice</label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  <div
                    className={styles.dropzone}
                    onClick={handleDropzoneClick}
                  >
                    <CloudUpload size={40} className={styles.uploadIcon} />
                    <span className={styles.uploadText}>
                      Click to upload receipt or invoice
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

            {/* Action Buttons */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => window.history.back()}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={styles.saveBtn}
              >
                {submitting ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddExpense;