import React, { useState, useEffect, useRef } from "react";
import styles from "../css/invoiceGenerator.module.css";
import api from "../utils/central";
import {
  FiPlus,
  FiSearch,
  FiShare2,
  FiSave,
  FiTrash2,
  FiDownload,
  FiCheck,
  FiEdit3,
  FiX,
} from "react-icons/fi";
import { useReactToPrint } from "react-to-print";
import LocationPicker from "../components/HospitalLocation";
import InvoiceTemplate from "./invoiceTemplate";

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
  amount: number | string;
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
  amount_paid: number | string;
  payment_method: string;
  payment_reference: string;
  payment_notes: string;
}

// Defined AutoTextarea OUTSIDE the main component so it doesn't remount on every keystroke
const AutoTextarea = ({ value, onChange, disabled }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={styles.tableTextarea}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={1}
    />
  );
};

const InvoiceGenerator: React.FC = () => {
  // --- STATE MANAGEMENT ---
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
  const [, setSearchLoading] = useState<boolean>(false);

  const [availableTherapyPlans, setAvailableTherapyPlans] = useState<
    TherapyPlan[]
  >([]);
  const [showTherapyPlanSelection, setShowTherapyPlanSelection] =
    useState<boolean>(false);

  const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");

  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [poNumber, setPoNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 15");
  const [stateOfSupply, setStateOfSupply] = useState<string>("Maharashtra");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [tdsRate, setTdsRate] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<boolean>(true);

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    amount_paid: 0,
    payment_method: "Cash",
    payment_reference: "",
    payment_notes: "",
  });

  const [isEditingInvoiceNumber, setIsEditingInvoiceNumber] = useState(false);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState("");
  const [, setInvoiceNumberError] = useState("");

  const componentRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [termsAndConditions] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${invoiceNumber}`,
  });

  const INDIAN_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const showToast = (type: "success" | "error", message: string) => {
    alert(type === "success" ? `✓ ${message}` : `✗ ${message}`);
  };

  // --- EFFECTS & FUNCTIONS ---
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 2 && searchQuery !== customer.name) {
        searchPatients();
      } else {
        setShowSearchResults(false);
        if (searchQuery.trim().length <= 2) {
          setSearchResults([]);
        }
      }
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchQuery, customer.name]);

  useEffect(() => {
    fetchInvoiceSeries();
  }, []);

  const searchPatients = async () => {
    try {
      setSearchLoading(true);
      const response = await api.get(
        `/search/patient?query=${encodeURIComponent(searchQuery)}`,
      );
      setSearchResults(response.data.patients || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchInvoiceSeries = async () => {
    try {
      const response = await api.get("/get/invoice/series");
      setInvoiceSeries(response.data.series || []);
      if (response.data.series?.length > 0) {
        const first = response.data.series[0];
        setSelectedSeries(first._id);
        generateInvoiceNumber(first);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const generateInvoiceNumber = (series: InvoiceSeries) => {
    const nextNumber = series.current_number + 1;
    let formattedNumber = nextNumber.toString();
    if (series.number_format) {
      formattedNumber = nextNumber
        .toString()
        .padStart(series.number_format.length, "0");
    }
    setInvoiceNumber(`${series.prefix}${formattedNumber}`);
  };

  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeries(seriesId);
    const series = invoiceSeries.find((s) => s._id === seriesId);
    if (series) {
      generateInvoiceNumber(series);
      setCustomInvoiceNumber("");
      setIsEditingInvoiceNumber(false);
      setInvoiceNumberError("");
    }
  };

  const fetchPatientDetails = async (patientId: string) => {
    try {
      const response = await api.get(`/patient/${patientId}`);
      const p = response.data.patientData;
      setCustomer({
        id: p._id,
        name: `${p.patient_first_name} ${p.patient_last_name}`,
        phone: p.patient_phone || "",
        email: p.patient_email || "",
        patient_id: p.patient_id || "",
        therapy_plans: p.therapy_plans || [],
      });
      setSearchQuery(`${p.patient_first_name} ${p.patient_last_name}`);
      setShowSearchResults(false);
      if (p.address?.state) setStateOfSupply(p.address.state);

      if (p.therapy_plans?.length > 0) {
        const therapyItems = p.therapy_plans.map((plan: TherapyPlan) => ({
          id: `therapy_${plan._id}`,
          item: plan.therapy_name,
          description: `${plan.patient_therapy_category} Therapy for ${plan.patient_diagnosis}`,
          qty:
            Math.max(plan.estimated_sessions - plan.completed_sessions, 0) || 1,
          unit: "Sessions",
          pricePerUnit: plan.per_session_amount,
          discount: plan.discount_percentage || 0,
          tax: 0,
          amount: 0,
          therapyPlanId: plan._id,
          isTherapyPlan: true,
        }));
        setItems(
          therapyItems.map((i: InvoiceItem) => ({
            ...i,
            amount: calculateItemAmount(i),
          })),
        );
        setAvailableTherapyPlans(p.therapy_plans);
      } else {
        setItems([]);
        setAvailableTherapyPlans([]);
        addRow();
      }
    } catch (error) {
      showToast("error", "Error fetching patient details.");
    }
  };

  const calculateItemAmount = (item: InvoiceItem): number => {
    const subtotal = item.qty * item.pricePerUnit;
    const discountAmount = (subtotal * item.discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * item.tax) / 100;
    return afterDiscount + taxAmount;
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Reverse calculation if user manually types the total Amount
          if (field === "amount") {
            if (value === "") return updated;
            const totalAmount = parseFloat(value) || 0;
            const qty = Number(updated.qty) || 1;
            const discountRate = Number(updated.discount) || 0;
            const taxRate = Number(updated.tax) || 0;

            // Reverse Formula: price = amount / (qty * (1 - disc/100) * (1 + tax/100))
            const divisor =
              qty * (1 - discountRate / 100) * (1 + taxRate / 100);
            updated.pricePerUnit =
              divisor > 0 ? Number((totalAmount / divisor).toFixed(4)) : 0;
            updated.amount = totalAmount;
            return updated;
          }

          // Normal forward calculation
          updated.amount = calculateItemAmount(updated);
          return updated;
        }
        return item;
      }),
    );
  };

  const addRow = () => {
    // Simply add a blank row freely, without forcing the therapy modal
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        item: "",
        description: "",
        qty: 1,
        unit: "Nos",
        pricePerUnit: 0,
        discount: 0,
        tax: 0,
        amount: 0,
        isTherapyPlan: false,
      },
    ]);
  };

  const addTherapyPlanItem = (plan: TherapyPlan) => {
    const newItem: InvoiceItem = {
      id: `therapy_${plan._id}`,
      item: plan.therapy_name,
      description: `${plan.patient_therapy_category} Therapy for ${plan.patient_diagnosis}`,
      qty: Math.max(plan.estimated_sessions - plan.completed_sessions, 0) || 1,
      unit: "Sessions",
      pricePerUnit: plan.per_session_amount,
      discount: plan.discount_percentage || 0,
      tax: 0,
      amount: 0,
      therapyPlanId: plan._id,
      isTherapyPlan: true,
    };
    newItem.amount = calculateItemAmount(newItem);
    setItems((prev) => [...prev, newItem]);
    setShowTherapyPlanSelection(false);
  };

  const calculateTotal = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.qty * item.pricePerUnit,
      0,
    );
    const totalDiscount = items.reduce(
      (sum, item) => sum + (item.qty * item.pricePerUnit * item.discount) / 100,
      0,
    );
    const taxable = subtotal - totalDiscount;
    const totalTax = items.reduce((sum, item) => {
      const base = item.qty * item.pricePerUnit;
      const disc = (base * item.discount) / 100;
      return sum + ((base - disc) * item.tax) / 100;
    }, 0);

    const amountBeforeTds = taxable + totalTax;
    const tdsAmount = (amountBeforeTds * tdsRate) / 100;
    const total = roundOff
      ? Math.round(amountBeforeTds - tdsAmount)
      : amountBeforeTds - tdsAmount;

    return { subtotal, totalDiscount, totalTax, tdsAmount, total };
  };

  const { subtotal, totalDiscount, totalTax, tdsAmount, total } =
    calculateTotal();

  const handleSave = async (actionType: "save" | "send" = "save") => {
    if (!customer.id) return showToast("error", "Please select a patient.");
    if (items.length === 0) return showToast("error", "Please add items.");

    try {
      setSaveLoading(true);
      const payload = {
        invoiceDate,
        dueDate: dueDate || null,
        poNumber,
        paymentTerms,
        stateOfSupply,
        invoiceNumber,
        seriesId: selectedSeries,
        recipientType: "Patient",
        recipientId: customer.id,
        items: items.map((i) => ({
          ...i,
          qty: Number(i.qty) || 0,
          price: Number(i.pricePerUnit) || 0,
          pricePerUnit: Number(i.pricePerUnit) || 0,
          discountPercent: Number(i.discount) || 0,
          taxRate: Number(i.tax) || 0,
          amount: Number(i.amount) || 0,
        })),
        tdsRate,
        roundOff,
        paymentInfo: {
          ...paymentInfo,
          amount_paid: Number(paymentInfo.amount_paid) || 0,
        },
        notes,
        termsAndConditions,
        location_name: selectedLocation?.name,
        location_id: selectedLocation?._id,
        location_address: selectedLocation?.addressLink || "",
        actionType,
      };
      const response = await api.post("/save/invoice", payload);
      if (response.data?.invoice) {
        setSavedInvoiceId(
          response.data.invoice._id || response.data.invoice.id,
        );
        showToast(
          "success",
          `Invoice ${actionType === "send" ? "sent" : "saved"} successfully!`,
        );
      }
    } catch (error: any) {
      showToast("error", error.response?.data?.message || "Error saving");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!savedInvoiceId) return showToast("error", "Save invoice first");
    try {
      setPdfLoading(true);
      const response = await api.get(`/generate/invoice/${savedInvoiceId}`);
      setPrintData(response.data);
      setTimeout(() => {
        handlePrint();
        setPdfLoading(false);
      }, 500);
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to load print data");
      setPdfLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER GRID */}
      <div className={styles.topSection}>
        {/* COL 1: Customer */}
        <div className={styles.topLeft}>
          <div className={styles.inputGroup}>
            <label>Patient *</label>
            <div className={styles.searchContainer}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient..."
                className={styles.input}
              />
              {showSearchResults && (
                <div className={styles.searchDropdown}>
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => fetchPatientDetails(p._id)}
                      className={styles.searchResultItem}
                    >
                      <div className={styles.patientName}>
                        {p.patient_first_name} {p.patient_last_name}
                      </div>
                      <div className={styles.patientDetails}>
                        {p.patient_phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {customer.id && (
            <div className={styles.selectedPatientCard}>
              <strong>{customer.name}</strong>
              <br />
              <small>
                {customer.phone} • {customer.email}
              </small>
            </div>
          )}
        </div>

        {/* COL 2: PO & Terms */}
        <div className={styles.topCenter}>
          <div className={styles.inputGroup}>
            <label>PO No.</label>
            <input
              className={styles.input}
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Payment Terms</label>
            <select
              className={styles.select}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            >
              <option>Net 15</option>
              <option>Net 30</option>
              <option>Due on Receipt</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Notes</label>
            <textarea
              className={styles.textarea}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* COL 3: Invoice Meta */}
        <div className={styles.topRight}>
          <div className={styles.rowGroup}>
            <label>Invoice No.</label>
            <div className={styles.flexRow}>
              <select
                className={styles.selectCompact}
                value={selectedSeries}
                onChange={(e) => handleSeriesChange(e.target.value)}
              >
                {invoiceSeries.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.prefix}
                  </option>
                ))}
              </select>
              {!isEditingInvoiceNumber ? (
                <div className={styles.flexRow} style={{ width: "100%" }}>
                  <input
                    className={styles.input}
                    value={invoiceNumber}
                    disabled
                  />
                  <button
                    className={styles.editInvoiceNumberButton}
                    onClick={() => {
                      setCustomInvoiceNumber(invoiceNumber);
                      setIsEditingInvoiceNumber(true);
                    }}
                  >
                    <FiEdit3 />
                  </button>
                </div>
              ) : (
                <div className={styles.flexRow}>
                  <input
                    className={styles.input}
                    value={customInvoiceNumber}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                    autoFocus
                  />
                  <FiCheck
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setInvoiceNumber(customInvoiceNumber);
                      setIsEditingInvoiceNumber(false);
                    }}
                  />
                  <FiX
                    style={{ cursor: "pointer" }}
                    onClick={() => setIsEditingInvoiceNumber(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.rowGroup}>
            <label>Date</label>
            <input
              type="date"
              className={styles.input}
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className={styles.rowGroup}>
            <label>Due Date</label>
            <input
              type="date"
              className={styles.input}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className={styles.rowGroup}>
            <label>State</label>
            <select
              className={styles.select}
              value={stateOfSupply}
              onChange={(e) => setStateOfSupply(e.target.value)}
            >
              <option value="">Select</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-section">
            <label>Issuing Location</label>
            <LocationPicker
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              autoSelectPreferred={true}
            />
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className={styles.tableSection}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "3%" }}>#</th>
              <th style={{ width: "20%" }}>Item</th>
              <th style={{ width: "25%" }}>Description</th>
              <th style={{ width: "8%" }}>Qty</th>
              <th style={{ width: "10%" }}>Price</th>
              <th style={{ width: "8%" }}>Disc%</th>
              <th style={{ width: "8%" }}>Tax%</th>
              <th style={{ width: "10%", textAlign: "right" }}>Amount</th>
              <th style={{ width: "5%" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>
                  <input
                    className={styles.tableInput}
                    value={item.item}
                    onChange={(e) =>
                      updateItem(item.id, "item", e.target.value)
                    }
                    placeholder="Product/Service"
                  />
                </td>
                <td>
                  <AutoTextarea
                    value={item.description}
                    onChange={(e: any) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.tableInput}
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "qty",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.tableInput}
                    value={item.pricePerUnit === 0 ? "" : item.pricePerUnit}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "pricePerUnit",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.tableInput}
                    value={item.discount === 0 ? "" : item.discount}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "discount",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.tableInput}
                    value={item.tax === 0 ? "" : item.tax}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "tax",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  <input
                    type="number"
                    className={styles.tableInput}
                    style={{ textAlign: "right", fontWeight: "bold" }}
                    value={item.amount === 0 ? "" : item.amount}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "amount",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                    onBlur={(e) =>
                      updateItem(
                        item.id,
                        "amount",
                        e.target.value === ""
                          ? 0
                          : Number(parseFloat(e.target.value).toFixed(2)),
                      )
                    }
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <FiTrash2
                    className={styles.deleteIcon}
                    onClick={() =>
                      setItems(items.filter((i) => i.id !== item.id))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ADD ITEM & ADD THERAPY PLAN BUTTONS */}
        <div
          className={styles.addItemRow}
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <button className={styles.addButton} onClick={addRow}>
            <FiPlus /> Add Row
          </button>

          {availableTherapyPlans.filter(
            (p) => !items.find((i) => i.therapyPlanId === p._id),
          ).length > 0 && (
            <button
              className={styles.addButton}
              style={{
                background: "#f8fafc",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
              onClick={() => setShowTherapyPlanSelection(true)}
            >
              <FiPlus /> Add Therapy Plan
            </button>
          )}

          <div style={{ marginLeft: "auto" }}>Total Items: {items.length}</div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={styles.footerSection}>
        <div className={styles.footerLeft}>
          <h4 style={{ margin: "0 0 1rem 0" }}>Payment Details</h4>
          <div className={styles.inputGroup}>
            <label>Amount Paid</label>
            <input
              type="number"
              className={styles.input}
              placeholder="0.00"
              value={paymentInfo.amount_paid === 0 ? "" : paymentInfo.amount_paid}
              onChange={(e) =>
                setPaymentInfo({
                  ...paymentInfo,
                  amount_paid: e.target.value === "" ? 0 : parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className={styles.flexRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Method</label>
              <select
                className={styles.select}
                value={paymentInfo.payment_method}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    payment_method: e.target.value,
                  })
                }
              >
                <option>Cash</option>
                <option>Online</option>
                <option>UPI</option>
              </select>
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Ref #</label>
              <input
                className={styles.input}
                value={paymentInfo.payment_reference}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    payment_reference: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className={styles.footerRight}>
          <div className={styles.totalRow}>
            <span>Subtotal:</span> <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total Tax:</span> <span>{totalTax.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Discount:</span> <span>{totalDiscount.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>
              TDS:
              <select
                style={{
                  marginLeft: "5px",
                  border: "none",
                  background: "transparent",
                }}
                value={tdsRate}
                onChange={(e) => setTdsRate(parseFloat(e.target.value))}
              >
                <option value={0}>0%</option>
                <option value={10}>10%</option>
              </select>
            </span>
            <span>-{tdsAmount.toFixed(2)}</span>
          </div>

          <div className={styles.finalTotalRow}>
            <span>Total:</span> <span>₹ {total.toFixed(2)}</span>
          </div>

          <div
            className={styles.rowGroup}
            style={{ justifyContent: "flex-end" }}
          >
            <input
              type="checkbox"
              checked={roundOff}
              onChange={(e) => setRoundOff(e.target.checked)}
            />{" "}
            <label>Round Off</label>
          </div>

          <div className={styles.actionButtons}>
            <button
              className={`${styles.button} ${styles.shareButton}`}
              onClick={() => handleSave("send")}
            >
              <FiShare2 /> Share
            </button>
            <button
              className={`${styles.button} ${styles.saveButton}`}
              onClick={() => handleSave("save")}
              disabled={saveLoading}
            >
              <FiSave /> {saveLoading ? "Saving..." : "Save"}
            </button>
            {savedInvoiceId && (
              <button
                className={`${styles.button} ${styles.pdfButton}`}
                onClick={handleGeneratePDF}
                disabled={pdfLoading}
              >
                <FiDownload /> PDF
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <InvoiceTemplate data={printData} componentRef={componentRef} />
      </div>
      {/* THERAPY PLAN MODAL */}
      {showTherapyPlanSelection && (
        <div className={styles.therapyPlanSelectionOverlay}>
          <div className={styles.therapyPlanSelectionModal}>
            <h3 style={{ marginBottom: "1rem", color: "var(--primary-color)" }}>
              Select Therapy Plan
            </h3>
            {availableTherapyPlans
              .filter((p) => !items.find((i) => i.therapyPlanId === p._id))
              .map((p) => (
                <div
                  key={p._id}
                  className={styles.therapyPlanOption}
                  onClick={() => addTherapyPlanItem(p)}
                >
                  <strong>{p.therapy_name}</strong> <br />{" "}
                  <small>{p.patient_therapy_category}</small>
                </div>
              ))}
            <button
              className={styles.button}
              style={{
                marginTop: "1rem",
                background: "#f8f9fa",
                border: "1px solid #ddd",
              }}
              onClick={() => setShowTherapyPlanSelection(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;