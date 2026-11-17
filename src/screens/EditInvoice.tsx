import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../css/invoiceGenerator.module.css";
import api from "../utils/central";

import {
  FiPlus,
  FiSearch,
  FiShare2,
  FiSave,
  FiTrash2,
  FiDownload,
  FiDollarSign,
  FiCheck,
  FiEdit3,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";

// --- INTERFACES ---
interface InvoiceItem {
  id: string;
  item: string;
  description: string;
  qty: number;
  unit: string;
  pricePerUnit: number;
  discount: number;
  tax: number;
  amount: number;
  therapyPlanId?: string;
  isTherapyPlan: boolean;
}

interface InvoiceSeries {
  _id: string;
  series_name: string;
  prefix: string;
  current_number: number;
  starting_number: number;
  number_format: string;
}

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
  patient_id: string;
}

interface AutoTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

interface TherapyPlan {
  _id: string;
  therapy_name: string;
  patient_diagnosis: string;
  patient_symptoms: string;
  therapy_duration: string;
  patient_therapy_category: string;
  total_amount: string;
  discount_amount: string;
  received_amount: string;
  balance: string;
  discount_percentage: number;
  estimated_sessions: number;
  completed_sessions: number;
  per_session_amount: number;
  status: string;
  therapy_start: string;
  therapy_end: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  patient_id: string;
  therapy_plans?: TherapyPlan[];
}

interface PaymentInfo {
  amount_paid: number;
  payment_method: string;
  payment_reference: string;
  payment_notes: string;
}

interface ExistingPayment {
  amount: number;
  date: string;
  method: string;
  reference: string;
  notes: string;
}

const EditInvoice: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState<boolean>(true);
  const [customer, setCustomer] = useState<Customer>({
    id: "",
    name: "",
    phone: "",
    email: "",
    patient_id: "",
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [availableTherapyPlans, setAvailableTherapyPlans] = useState<
    TherapyPlan[]
  >([]);
  const [showTherapyPlanSelection, setShowTherapyPlanSelection] =
    useState<boolean>(false);

  const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [seriesLoading, setSeriesLoading] = useState<boolean>(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [originalInvoiceNumber, setOriginalInvoiceNumber] =
    useState<string>("");
  const [poNumber, setPoNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 15");
  const [stateOfSupply, setStateOfSupply] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<string>("Draft");
  const [paymentStatus, setPaymentStatus] = useState<string>("Unpaid");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [tdsRate, setTdsRate] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<boolean>(true);

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    amount_paid: 0,
    payment_method: "Cash",
    payment_reference: "",
    payment_notes: "",
  });
  const [existingPayments, setExistingPayments] = useState<ExistingPayment[]>(
    [],
  );
  const [totalExistingPaid, setTotalExistingPaid] = useState<number>(0);
  const [isPaymentSectionOpen, setIsPaymentSectionOpen] =
    useState<boolean>(false);

  const [isEditingInvoiceNumber, setIsEditingInvoiceNumber] = useState(false);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState("");
  const [invoiceNumberError, setInvoiceNumberError] = useState("");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [termsAndConditions, setTermsAndConditions] = useState<string>("");

  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      alert(`✓ ${message}`);
    } else {
      alert(`✗ ${message}`);
    }
  };

  // --- LOAD INVOICE DATA ---
  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
      fetchInvoiceSeries();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/get/invoice/${invoiceId}`);
      const invoice = response.data.invoice;

      // Set customer data
      setCustomer({
        id: invoice.patient_id,
        name: invoice.patient_name,
        phone: invoice.patient_phone || "",
        email: invoice.patient_email || "",
        patient_id: invoice.patient_id || "",
      });
      setSearchQuery(invoice.patient_name);

      // Set invoice details
      setInvoiceNumber(invoice.invoice_number);
      setOriginalInvoiceNumber(invoice.invoice_number);
      setSelectedSeries(invoice.series_id);
      setPoNumber(invoice.po_number || "");
      setInvoiceDate(
        invoice.invoice_date
          ? new Date(invoice.invoice_date).toISOString().split("T")[0]
          : "",
      );
      setDueDate(
        invoice.due_date
          ? new Date(invoice.due_date).toISOString().split("T")[0]
          : "",
      );
      setPaymentTerms(invoice.payment_terms || "Net 15");
      setStateOfSupply(invoice.state_of_supply || "");
      setInvoiceStatus(invoice.status || "Draft");
      setPaymentStatus(invoice.payment_status || "Unpaid");

      // Set items
      const invoiceItems: InvoiceItem[] = invoice.items.map(
        (item: any, index: number) => ({
          id: item.item_id || `item_${index}`,
          item: item.item_name,
          description: item.description || "",
          qty: item.quantity,
          unit: item.unit || "Sessions",
          pricePerUnit: item.price_per_unit,
          discount: item.discount_percentage,
          tax: item.tax_percentage,
          amount: item.line_total,
          therapyPlanId: item.therapy_plan_id,
          isTherapyPlan: item.is_therapy_plan || false,
        }),
      );
      setItems(invoiceItems);

      // Set financial info
      setTdsRate(invoice.tds_rate || 0);
      setRoundOff(invoice.round_off_amount !== undefined);

      // Set existing payments
      if (invoice.payments_received && invoice.payments_received.length > 0) {
        setExistingPayments(invoice.payments_received);
        setTotalExistingPaid(invoice.total_paid || 0);
      }

      // Set additional info
      setNotes(invoice.notes || "");
      setTermsAndConditions(invoice.terms_and_conditions || "");

      // Fetch patient details for therapy plans
      fetchPatientDetails(invoice.patient_id);
    } catch (error: any) {
      console.error("Error loading invoice:", error);
      showToast("error", "Error loading invoice. Please try again.");
      navigate("/invoice/list");
    } finally {
      setLoading(false);
    }
  };

  // --- PATIENT SEARCH ---
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 2 && searchQuery !== customer.name) {
        searchPatients();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const searchPatients = async () => {
    try {
      setSearchLoading(true);
      const response = await api.get(
        `/search/patient?query=${encodeURIComponent(searchQuery)}`,
      );
      setSearchResults(response.data.patients || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching patients:", error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchInvoiceSeries = async () => {
    try {
      setSeriesLoading(true);
      const response = await api.get("/get/invoice/series");
      setInvoiceSeries(response.data.series || []);
    } catch (error) {
      console.error("Error fetching invoice series:", error);
      showToast("error", "Error fetching invoice series.");
    } finally {
      setSeriesLoading(false);
    }
  };

  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeries(seriesId);
    const series = invoiceSeries.find((s) => s._id === seriesId);
    if (series && !isEditingInvoiceNumber) {
      // Only auto-generate if not manually editing
      generateInvoiceNumber(series);
    }
  };

  const generateInvoiceNumber = (series: InvoiceSeries) => {
    const nextNumber = series.current_number + 1;
    let formattedNumber = nextNumber.toString();

    if (series.number_format) {
      const paddingLength = series.number_format.length;
      formattedNumber = nextNumber.toString().padStart(paddingLength, "0");
    }

    const invoiceNum = `${series.prefix}${formattedNumber}`;
    setInvoiceNumber(invoiceNum);
  };

  const fetchPatientDetails = async (patientId: string) => {
    try {
      const response = await api.get(`/patient/${patientId}`);
      const patientData = response.data.patientData;

      const customerData = {
        id: patientData._id,
        name: `${patientData.patient_first_name} ${patientData.patient_last_name}`,
        phone: patientData.patient_phone || "",
        email: patientData.patient_email || "",
        patient_id: patientData.patient_id || "",
        therapy_plans: patientData.therapy_plans || [],
      };

      setCustomer(customerData);
      setAvailableTherapyPlans(patientData.therapy_plans || []);
    } catch (error) {
      console.error("Error fetching patient details:", error);
    }
  };

  const selectPatient = (patient: Patient) => {
    fetchPatientDetails(patient._id);
    setSearchQuery(
      `${patient.patient_first_name} ${patient.patient_last_name}`,
    );
    setShowSearchResults(false);
  };

  const handleEditInvoiceNumber = () => {
    setCustomInvoiceNumber(invoiceNumber);
    setIsEditingInvoiceNumber(true);
    setInvoiceNumberError("");
  };

  const handleCancelEditInvoiceNumber = () => {
    setCustomInvoiceNumber("");
    setIsEditingInvoiceNumber(false);
    setInvoiceNumberError("");
  };

  const handleSaveCustomInvoiceNumber = () => {
    if (!customInvoiceNumber.trim()) {
      setInvoiceNumberError("Invoice number cannot be empty");
      return;
    }

    const selectedSeriesData = invoiceSeries.find(
      (s) => s._id === selectedSeries,
    );
    if (
      selectedSeriesData &&
      !customInvoiceNumber.startsWith(selectedSeriesData.prefix)
    ) {
      setInvoiceNumberError(
        `Invoice number should start with "${selectedSeriesData.prefix}"`,
      );
      return;
    }

    setInvoiceNumber(customInvoiceNumber.trim());
    setIsEditingInvoiceNumber(false);
    setInvoiceNumberError("");
    setCustomInvoiceNumber("");
  };

  const handleInvoiceNumberKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveCustomInvoiceNumber();
    } else if (e.key === "Escape") {
      handleCancelEditInvoiceNumber();
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // --- ITEMS MANAGEMENT ---
  const calculateItemAmount = (item: InvoiceItem): number => {
    const subtotal = item.qty * item.pricePerUnit;
    const discountAmount = (subtotal * item.discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * item.tax) / 100;
    return afterDiscount + taxAmount;
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.amount = calculateItemAmount(updatedItem);
          return updatedItem;
        }
        return item;
      }),
    );
  };

  const addRow = () => {
    if (!customer.id) {
      showToast("error", "Please select a patient first.");
      return;
    }

    const usedTherapyPlanIds = items
      .filter((item) => item.isTherapyPlan)
      .map((item) => item.therapyPlanId);
    const availablePlans = availableTherapyPlans.filter(
      (plan) => !usedTherapyPlanIds.includes(plan._id),
    );

    if (availablePlans.length === 0) {
      showToast(
        "error",
        "All available therapy plans have already been added to the invoice.",
      );
      return;
    }

    setShowTherapyPlanSelection(true);
  };

  const addTherapyPlanItem = (plan: TherapyPlan) => {
    const newItem: InvoiceItem = {
      id: `therapy_${plan._id}`,
      item: plan.therapy_name,
      description: `${plan.patient_therapy_category} Therapy for ${plan.patient_diagnosis}`,
      qty: Math.max(plan.estimated_sessions - plan.completed_sessions, 0) || 1,
      unit: "Sessions",
      pricePerUnit: plan.per_session_amount,
      discount: plan.discount_percentage,
      tax: 0,
      amount: 0,
      therapyPlanId: plan._id,
      isTherapyPlan: true,
    };

    newItem.amount = calculateItemAmount(newItem);
    setItems([...items, newItem]);
    setShowTherapyPlanSelection(false);
  };

  const removeRow = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  function AutoTextarea({
    value,
    onChange,
    disabled = false,
  }: AutoTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
      }
    }, [value]);

    return (
      <textarea
        ref={textareaRef}
        className={`${styles.tableTextarea} ${disabled ? styles.disabled : ""}`}
        value={value}
        onChange={onChange}
        rows={1}
        disabled={disabled}
      />
    );
  }

  const calculateTotal = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.qty * item.pricePerUnit,
      0,
    );
    const totalDiscount = items.reduce(
      (sum, item) => sum + (item.qty * item.pricePerUnit * item.discount) / 100,
      0,
    );
    const taxableAmount = subtotal - totalDiscount;
    const totalTax = items.reduce((sum, item) => {
      const itemSubtotal = item.qty * item.pricePerUnit;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemTax = ((itemSubtotal - itemDiscount) * item.tax) / 100;
      return sum + itemTax;
    }, 0);

    const amountBeforeTds = taxableAmount + totalTax;
    const tdsAmount = (amountBeforeTds * tdsRate) / 100;
    const total = amountBeforeTds - tdsAmount;
    const finalTotal = roundOff ? Math.round(total) : total;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      tdsAmount,
      total: finalTotal,
      balanceDue: Math.max(
        finalTotal - totalExistingPaid - paymentInfo.amount_paid,
        0,
      ),
    };
  };

  const { subtotal, totalDiscount, totalTax, tdsAmount, total, balanceDue } =
    calculateTotal();

  const handlePaymentInfoChange = (
    field: keyof PaymentInfo,
    value: string | number,
  ) => {
    setPaymentInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getPaymentStatus = () => {
    const totalAmount = total;
    const amountPaid = totalExistingPaid + paymentInfo.amount_paid;

    if (amountPaid === 0) return "Unpaid";
    if (amountPaid >= totalAmount) return "Paid";
    return "Partially Paid";
  };

  // --- SAVE AND ACTIONS ---
  const handleSave = async (actionType: "save" | "send" = "save") => {
    if (!customer.id) {
      showToast("error", "Please select a patient before saving.");
      return;
    }

    if (!selectedSeries) {
      showToast("error", "Please select an invoice series.");
      return;
    }

    if (items.length === 0) {
      showToast("error", "Please add at least one item to the invoice.");
      return;
    }

    if (totalExistingPaid + paymentInfo.amount_paid > total) {
      showToast(
        "error",
        "Total payment amount cannot exceed the invoice total.",
      );
      return;
    }

    try {
      setSaveLoading(true);

      const invoiceData = {
        invoiceDate: invoiceDate,
        dueDate: dueDate || null,
        poNumber: poNumber,
        paymentTerms: paymentTerms,
        paymentTermsCustom: paymentTerms === "Custom" ? "" : undefined,
        stateOfSupply: stateOfSupply,
        invoiceNumber: invoiceNumber,
        patientId: customer.id,
        items: items,
        tdsRate: tdsRate,
        roundOff: roundOff,
        paymentInfo:
          paymentInfo.amount_paid > 0
            ? {
                amount_paid: paymentInfo.amount_paid,
                payment_method: paymentInfo.payment_method,
                payment_reference: paymentInfo.payment_reference,
                payment_notes: paymentInfo.payment_notes,
              }
            : undefined,
        seriesId: selectedSeries,
        notes: notes,
        termsAndConditions: termsAndConditions,
        actionType: actionType,
      };

      const response = await api.post(
        `/edit/invoice/${invoiceId}`,
        invoiceData,
      );

      if (response.data && response.data.invoice) {
        showToast(
          "success",
          `Invoice ${
            actionType === "send" && invoiceStatus === "Draft"
              ? "updated and sent"
              : "updated"
          } successfully!`,
        );

        // Reload invoice data to reflect changes
        loadInvoiceData();

        // Reset payment info after successful save
        setPaymentInfo({
          amount_paid: 0,
          payment_method: "Cash",
          payment_reference: "",
          payment_notes: "",
        });
      }
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error updating invoice. Please try again.";

      if (error.response?.data?.error_code === "DUPLICATE_INVOICE_NUMBER") {
        setInvoiceNumberError(errorMessage);
        if (!isEditingInvoiceNumber) {
          setIsEditingInvoiceNumber(true);
          setCustomInvoiceNumber(invoiceNumber);
        }
      } else if (error.response?.data?.error_code === "INVOICE_PAID") {
        showToast("error", "Cannot edit a fully paid invoice.");
      } else {
        showToast("error", errorMessage);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setPdfLoading(true);

      const response = await api.get(`/generate/invoice/${invoiceId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });

      if (blob.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${invoiceNumber.replace(
        /[^a-zA-Z0-9]/g,
        "_",
      )}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      showToast("success", "PDF generated and downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      showToast("error", "Error generating PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = () => {
    handleSave("send");
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    (newItems[index][field] as any) = value;
    newItems[index].amount = calculateItemAmount(newItems[index]);
    setItems(newItems);
  };

  const getAvailableTherapyPlansForSelection = () => {
    const usedTherapyPlanIds = items
      .filter((item) => item.isTherapyPlan)
      .map((item) => item.therapyPlanId);
    return availableTherapyPlans.filter(
      (plan) => !usedTherapyPlanIds.includes(plan._id),
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderContainer} style={{ minHeight: "400px" }}>
          <div className={styles.spinner}></div>
          <span>Loading invoice...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => navigate("/invoices")}
          className={styles.addRowButton}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FiArrowLeft /> Back to Invoices
        </button>
        <h1 style={{ margin: 0, color: "var(--primary-color)" }}>
          Edit Invoice - {originalInvoiceNumber}
        </h1>
        <span
          className={`${styles.paymentStatus} ${
            styles[paymentStatus.replace(" ", "").toLowerCase()]
          }`}
          style={{
            marginLeft: "auto",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
          }}
        >
          {paymentStatus}
        </span>
      </div>

      <div className={styles.splitContainer}>
        {/* LEFT SECTION */}
        <div className={styles.leftSection}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Patient Details</h2>
            <div className={styles.inputGroup}>
              <label htmlFor="patient-search">Search by Name/Phone *</label>
              <div className={styles.searchContainer}>
                <FiSearch className={styles.searchIcon} />
                <input
                  id="patient-search"
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Enter patient name or phone"
                  className={styles.input}
                />
                {searchLoading && <div className={styles.spinner}></div>}

                {showSearchResults && (
                  <div className={styles.searchDropdown}>
                    {searchResults.length > 0 ? (
                      searchResults.map((patient) => (
                        <div
                          key={patient._id}
                          onClick={() => selectPatient(patient)}
                          className={styles.searchResultItem}
                        >
                          <div className={styles.patientName}>
                            {patient.patient_first_name}{" "}
                            {patient.patient_last_name}
                          </div>
                          <div className={styles.patientDetails}>
                            {patient.patient_phone &&
                              `📞 ${patient.patient_phone}`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noResults}>No patients found.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {customer.id && (
              <div className={styles.selectedPatientCard}>
                <div>
                  <strong>{customer.name}</strong>
                </div>
                <div>
                  <small>{customer.patient_id}</small>
                </div>
                <div>
                  <small>
                    {customer.phone} • {customer.email}
                  </small>
                </div>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Invoice Information</h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Invoice Series *</label>
                {seriesLoading ? (
                  <div className={styles.loadingSelect}>
                    <div className={styles.spinner}></div>
                    <span>Loading series...</span>
                  </div>
                ) : (
                  <select
                    value={selectedSeries}
                    onChange={(e) => handleSeriesChange(e.target.value)}
                    className={styles.select}
                    required
                  >
                    <option value="">Select Invoice Series</option>
                    {invoiceSeries.map((series) => (
                      <option key={series._id} value={series._id}>
                        {series.series_name} ({series.prefix})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>Invoice Number</label>
                <div className={styles.invoiceNumberContainer}>
                  {!isEditingInvoiceNumber ? (
                    <div className={styles.invoiceNumberDisplay}>
                      <input
                        type="text"
                        value={invoiceNumber}
                        className={styles.input}
                        disabled
                      />
                      <button
                        type="button"
                        onClick={handleEditInvoiceNumber}
                        className={styles.editInvoiceNumberButton}
                        title="Edit invoice number"
                        disabled={!selectedSeries || paymentStatus === "Paid"}
                      >
                        <FiEdit3 />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.invoiceNumberEdit}>
                      <input
                        type="text"
                        value={customInvoiceNumber}
                        onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                        onKeyDown={handleInvoiceNumberKeyPress}
                        className={`${styles.input} ${
                          invoiceNumberError ? styles.inputError : ""
                        }`}
                        placeholder="Enter custom invoice number"
                        autoFocus
                      />
                      <div className={styles.invoiceNumberActions}>
                        <button
                          type="button"
                          onClick={handleSaveCustomInvoiceNumber}
                          className={styles.saveInvoiceNumberButton}
                          title="Save custom number"
                        >
                          <FiCheck />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditInvoiceNumber}
                          className={styles.cancelInvoiceNumberButton}
                          title="Cancel editing"
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {invoiceNumberError && (
                  <small className={styles.errorText}>
                    {invoiceNumberError}
                  </small>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>PO No.</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className={styles.input}
                  disabled={paymentStatus === "Paid"}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className={styles.input}
                  disabled={paymentStatus === "Paid"}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={styles.input}
                  disabled={paymentStatus === "Paid"}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className={styles.select}
                  disabled={paymentStatus === "Paid"}
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>State of Supply</label>
                <select
                  value={stateOfSupply}
                  onChange={(e) => setStateOfSupply(e.target.value)}
                  className={styles.select}
                  disabled={paymentStatus === "Paid"}
                >
                  <option value="">Select State</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup} style={{ marginTop: "1rem" }}>
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.input}
                rows={3}
                placeholder="Additional notes for the invoice..."
                disabled={paymentStatus === "Paid"}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Terms and Conditions</label>
              <textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className={styles.input}
                rows={3}
                placeholder="Terms and conditions..."
                disabled={paymentStatus === "Paid"}
              />
            </div>
          </div>

          {/* PAYMENT INFORMATION SECTION */}
          <div className={styles.card}>
            <div
              className={styles.sectionHeader}
              onClick={() => setIsPaymentSectionOpen(!isPaymentSectionOpen)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 className={styles.sectionTitle}>
                <FiDollarSign style={{ marginRight: "0.5rem" }} />
                Payment Information
              </h2>
              <span>{isPaymentSectionOpen ? "−" : "+"}</span>
            </div>

            {isPaymentSectionOpen && (
              <div className={styles.paymentSection}>
                {/* Existing Payments */}
                {existingPayments.length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-light)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Previous Payments
                    </h3>
                    {existingPayments.map((payment, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "0.75rem",
                          background: "var(--primary-light)",
                          borderRadius: "var(--border-radius-md)",
                          marginBottom: "0.5rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            ₹{payment.amount.toFixed(2)}
                          </span>
                          <span>
                            {new Date(payment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "var(--text-light)",
                          }}
                        >
                          <span>{payment.method}</span>
                          {payment.reference && (
                            <span>Ref: {payment.reference}</span>
                          )}
                        </div>
                        {payment.notes && (
                          <div
                            style={{
                              marginTop: "0.25rem",
                              fontSize: "0.8rem",
                              fontStyle: "italic",
                            }}
                          >
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.5rem",
                        background: "#e8f5e9",
                        borderRadius: "var(--border-radius-sm)",
                        fontWeight: 600,
                        color: "#2e7d32",
                      }}
                    >
                      Total Paid: ₹{totalExistingPaid.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* New Payment Entry */}
                <div>
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-light)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Add New Payment
                  </h3>
                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label>Amount Paid (₹)</label>
                      <input
                        type="number"
                        value={paymentInfo.amount_paid}
                        onChange={(e) =>
                          handlePaymentInfoChange(
                            "amount_paid",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className={styles.input}
                        min="0"
                        max={total - totalExistingPaid}
                        step="0.01"
                        placeholder="0.00"
                      />
                      <small className={styles.helperText}>
                        Maximum: ₹{(total - totalExistingPaid).toFixed(2)}
                      </small>
                    </div>

                    <div className={styles.inputGroup}>
                      <label>Payment Method</label>
                      <select
                        value={paymentInfo.payment_method}
                        onChange={(e) =>
                          handlePaymentInfoChange(
                            "payment_method",
                            e.target.value,
                          )
                        }
                        className={styles.select}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="UPI">UPI</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className={styles.inputGroup}>
                      <label>Payment Reference</label>
                      <input
                        type="text"
                        value={paymentInfo.payment_reference}
                        onChange={(e) =>
                          handlePaymentInfoChange(
                            "payment_reference",
                            e.target.value,
                          )
                        }
                        className={styles.input}
                        placeholder="Transaction ID, Cheque No., etc."
                      />
                    </div>

                    <div
                      className={styles.inputGroup}
                      style={{ gridColumn: "span 2" }}
                    >
                      <label>Payment Notes</label>
                      <textarea
                        value={paymentInfo.payment_notes}
                        onChange={(e) =>
                          handlePaymentInfoChange(
                            "payment_notes",
                            e.target.value,
                          )
                        }
                        className={styles.input}
                        rows={2}
                        placeholder="Additional notes about the payment..."
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                {(totalExistingPaid > 0 || paymentInfo.amount_paid > 0) && (
                  <div className={styles.paymentStatusCard}>
                    <div className={styles.paymentStatusRow}>
                      <span>Payment Status:</span>
                      <span
                        className={`${styles.paymentStatus} ${
                          styles[
                            getPaymentStatus().replace(" ", "").toLowerCase()
                          ]
                        }`}
                      >
                        {getPaymentStatus()}
                      </span>
                    </div>
                    <div className={styles.paymentStatusRow}>
                      <span>Total Paid:</span>
                      <span>
                        ₹
                        {(totalExistingPaid + paymentInfo.amount_paid).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                    <div className={styles.paymentStatusRow}>
                      <span>Balance Due:</span>
                      <span>₹{balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className={styles.rightSection}>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2 className={styles.sectionTitle}>Invoice Items</h2>
              <button
                onClick={addRow}
                className={styles.addRowButton}
                disabled={paymentStatus === "Paid"}
              >
                <FiPlus /> ADD Item
              </button>
            </div>

            {showTherapyPlanSelection && (
              <div className={styles.therapyPlanSelectionOverlay}>
                <div className={styles.therapyPlanSelectionModal}>
                  <h3>Select Therapy Plan to Add</h3>
                  <div className={styles.therapyPlanOptions}>
                    {getAvailableTherapyPlansForSelection().map((plan) => (
                      <div
                        key={plan._id}
                        onClick={() => addTherapyPlanItem(plan)}
                        className={styles.therapyPlanOption}
                      >
                        <div className={styles.planOptionHeader}>
                          <span className={styles.planOptionName}>
                            {plan.therapy_name}
                          </span>
                          <span className={styles.planOptionBalance}>
                            Balance: ₹{plan.balance}
                          </span>
                        </div>
                        <div className={styles.planOptionDetails}>
                          <span>{plan.patient_therapy_category} Therapy</span>
                          <span>
                            Sessions: {plan.completed_sessions}/
                            {plan.estimated_sessions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTherapyPlanSelection(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className={styles.tableContainer}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th className={styles.itemHeader}>Plan</th>
                    <th className={styles.descHeader}>Description</th>
                    <th>Sessions</th>
                    <th>Price/Session</th>
                    <th>Discount %</th>
                    <th>Tax %</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className={styles.emptyState}>
                        {customer.id
                          ? "No items added to this invoice"
                          : "Please select a patient to view their therapy plans"}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id}>
                        <td className={styles.serialCell}>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            value={item.item}
                            onChange={(e) =>
                              updateItem(item.id, "item", e.target.value)
                            }
                            className={styles.tableInput}
                            placeholder="Item name"
                            disabled={
                              item.isTherapyPlan || paymentStatus === "Paid"
                            }
                          />
                        </td>
                        <td>
                          <AutoTextarea
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            disabled={
                              item.isTherapyPlan || paymentStatus === "Paid"
                            }
                          />
                        </td>
                        <td className={styles.numericalCell}>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "qty",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={styles.tableInput}
                            min="0"
                            disabled={paymentStatus === "Paid"}
                          />
                        </td>
                        <td className={styles.numericalCell}>
                          <input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "pricePerUnit",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={styles.tableInput}
                            min="0"
                            step="0.01"
                            disabled={paymentStatus === "Paid"}
                          />
                        </td>
                        <td className={styles.numericalCell}>
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "discount",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={styles.tableInput}
                            min="0"
                            max="100"
                            disabled={paymentStatus === "Paid"}
                          />
                        </td>
                        <td className={styles.numericalCell}>
                          <input
                            type="number"
                            value={item.tax}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "tax",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={styles.tableInput}
                            min="0"
                            step="0.01"
                            disabled={paymentStatus === "Paid"}
                          />
                        </td>
                        <td className={styles.amountCell}>
                          ₹{calculateItemAmount(item).toFixed(2)}
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            onClick={() => removeRow(item.id)}
                            className={styles.removeButton}
                            title="Remove item"
                            disabled={paymentStatus === "Paid"}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS SECTION */}
          <div className={styles.totalsAndActions}>
            <div className={styles.totalsCard}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Discount</span>
                <span>-₹{totalDiscount.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Tax</span>
                <span>+₹{totalTax.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <div className={styles.tdsControl}>
                  <label>TDS Rate:</label>
                  <select
                    value={tdsRate}
                    onChange={(e) => setTdsRate(parseFloat(e.target.value))}
                    className={styles.select}
                    disabled={paymentStatus === "Paid"}
                  >
                    <option value={0}>NONE</option>
                    <option value={1}>1%</option>
                    <option value={2}>2%</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                  </select>
                </div>
                <span>-₹{tdsAmount.toFixed(2)}</span>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.finalTotalRow}>
                <span>Invoice Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              {(totalExistingPaid > 0 || paymentInfo.amount_paid > 0) && (
                <>
                  <div className={styles.paymentRow}>
                    <span>Total Paid</span>
                    <span style={{ color: "#28a745" }}>
                      -₹
                      {(totalExistingPaid + paymentInfo.amount_paid).toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.balanceRow}>
                    <span>Balance Due</span>
                    <span
                      style={{ color: balanceDue > 0 ? "#dc3545" : "#28a745" }}
                    >
                      ₹{balanceDue.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className={styles.roundOffControl}>
                <input
                  type="checkbox"
                  id="roundOffCheck"
                  checked={roundOff}
                  onChange={(e) => setRoundOff(e.target.checked)}
                  disabled={paymentStatus === "Paid"}
                />
                <label htmlFor="roundOffCheck">Round off total amount</label>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className={styles.actionButtons}>
              <button
                onClick={() => handleSave("save")}
                className={`${styles.button} ${styles.saveButton}`}
                disabled={
                  saveLoading ||
                  !customer.id ||
                  items.length === 0 ||
                  paymentStatus === "Paid"
                }
              >
                {saveLoading ? (
                  <>
                    <div
                      className={styles.spinner}
                      style={{ width: "1rem", height: "1rem" }}
                    ></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave /> Update Invoice
                  </>
                )}
              </button>

              {invoiceStatus === "Draft" && (
                <button
                  onClick={handleShare}
                  className={`${styles.button} ${styles.shareButton}`}
                  disabled={
                    saveLoading ||
                    !customer.id ||
                    items.length === 0 ||
                    paymentStatus === "Paid"
                  }
                >
                  {saveLoading ? (
                    <>
                      <div
                        className={styles.spinner}
                        style={{ width: "1rem", height: "1rem" }}
                      ></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiShare2 /> Update & Send
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleGeneratePDF}
                className={`${styles.button} ${styles.pdfButton}`}
                disabled={pdfLoading}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                }}
              >
                {pdfLoading ? (
                  <>
                    <div
                      className={styles.spinner}
                      style={{ width: "1rem", height: "1rem" }}
                    ></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FiDownload /> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoice;
