import React, { useState } from "react";
import styles from "../css/InvoiceSeriesCreation.module.css";
import api from "../utils/central";

// Icons from react-icons (same as reference)
import { FiSave, FiInfo } from "react-icons/fi";

interface InvoiceSeries {
  _id?: string;
  series_name: string;
  prefix: string;
  starting_number: number;
  number_format: string;
  year_reset: boolean;
  current_number?: number;
  created_by?: string;
}

const InvoiceSeriesCreation: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<InvoiceSeries>({
    series_name: "",
    prefix: "",
    starting_number: 1,
    number_format: "####",
    year_reset: false,
  });

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Available number formats
  const numberFormats = [
    { value: "####", label: "#### (1234)" },
    { value: "#####", label: "##### (12345)" },
    { value: "######", label: "###### (123456)" },
    { value: "000#", label: "000# (0001)" },
    { value: "00##", label: "00## (0012)" },
    { value: "0###", label: "0### (0123)" },
  ];

  // Toast notification placeholder
  const showToast = (type: "success" | "error", message: string) => {
    console.log(`Toast [${type}]: ${message}`);
  };

  // Generate preview of invoice number
  const generatePreview = () => {
    const { prefix, starting_number, number_format } = formData;
    if (!prefix || !number_format) return "";

    const formattedNumber = number_format.replace(
      /#/g,
      starting_number
        .toString()
        .padStart(number_format.replace(/0/g, "").length, "0"),
    );

    return `${prefix}${formattedNumber}`;
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "starting_number"
            ? parseInt(value) || 1
            : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.series_name.trim()) {
      newErrors.series_name = "Series name is required";
    }

    if (!formData.prefix.trim()) {
      newErrors.prefix = "Prefix is required";
    }

    if (formData.starting_number < 1) {
      newErrors.starting_number = "Starting number must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("error", "Please fix the validation errors");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/create/invoice/series", {
        seriesName: formData.series_name,
        prefix: formData.prefix,
        startingNumber: formData.starting_number,
        numberFormat: formData.number_format,
        yearReset: formData.year_reset,
      });

      if (response.status === 201) {
        showToast("success", "Invoice series created successfully!");
        // Reset form
        setFormData({
          series_name: "",
          prefix: "",
          starting_number: 1,
          number_format: "####",
          year_reset: false,
        });
      }
    } catch (error: any) {
      console.error("Error creating invoice series:", error);
      const errorMessage =
        error.response?.data?.message || "Error creating invoice series";
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to invoice series list or dashboard
    console.log("Navigate back");
  };

  return (
    <div className={styles.container}>
      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Basic Information Card */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Basic Information</h2>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="series_name">
                    Series Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="series_name"
                    name="series_name"
                    value={formData.series_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Default Series, Consultation Bills"
                    className={`${styles.input} ${
                      errors.series_name ? styles.inputError : ""
                    }`}
                  />
                  {errors.series_name && (
                    <span className={styles.errorText}>
                      {errors.series_name}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="prefix">
                    Prefix <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="prefix"
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleInputChange}
                    placeholder="e.g., INV-, BILL-, GEM-"
                    className={`${styles.input} ${
                      errors.prefix ? styles.inputError : ""
                    }`}
                  />
                  {errors.prefix && (
                    <span className={styles.errorText}>{errors.prefix}</span>
                  )}
                  <small className={styles.helpText}>
                    This will appear at the beginning of every invoice number
                  </small>
                </div>
              </div>
            </div>

            {/* Numbering Configuration Card */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Numbering Configuration</h2>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="starting_number">Starting Number</label>
                  <input
                    type="number"
                    id="starting_number"
                    name="starting_number"
                    value={formData.starting_number}
                    onChange={handleInputChange}
                    min="1"
                    className={`${styles.input} ${
                      errors.starting_number ? styles.inputError : ""
                    }`}
                  />
                  {errors.starting_number && (
                    <span className={styles.errorText}>
                      {errors.starting_number}
                    </span>
                  )}
                  <small className={styles.helpText}>
                    The first invoice will start from this number
                  </small>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="number_format">Number Format</label>
                  <select
                    id="number_format"
                    name="number_format"
                    value={formData.number_format}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    {numberFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                  <small className={styles.helpText}>
                    Choose how the numbers should be formatted
                  </small>
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="year_reset"
                    checked={formData.year_reset}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    Reset numbering every year
                  </span>
                </label>
                <small className={styles.helpText}>
                  If enabled, the series will reset to starting number at the
                  beginning of each year
                </small>
              </div>
            </div>

            {/* Preview Card */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Preview</h2>
              <div className={styles.previewSection}>
                <div className={styles.previewLabel}>
                  <FiInfo className={styles.previewIcon} />
                  Your next invoice number will be:
                </div>
                <div className={styles.previewNumber}>
                  {generatePreview() || "Complete the form to see preview"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                type="button"
                onClick={handleBack}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiSave /> Create Series
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSeriesCreation;
