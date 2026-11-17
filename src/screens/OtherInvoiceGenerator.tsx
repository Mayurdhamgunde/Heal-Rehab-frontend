import React, { useState, useEffect, useRef } from "react";
import styles from "../css/OtherInvoiceGenerator.module.css";
import api from "../utils/central";
import { FiPlus, FiSave, FiTrash2, FiEdit2, FiDownload } from "react-icons/fi";
import PartnerSearchDropdown from "../components/PartnerSearchDropdown";
import LocationPicker from "../components/HospitalLocation";
import { useReactToPrint } from "react-to-print";
import InvoiceTemplate from "./invoiceTemplate";

const TAX_OPTIONS = [
  { label: "NONE", value: 0, type: "NONE" },
  { label: "IGST@5%", value: 5, type: "IGST" },
  { label: "IGST@12%", value: 12, type: "IGST" },
  { label: "IGST@18%", value: 18, type: "IGST" },
  { label: "IGST@28%", value: 28, type: "IGST" },
  { label: "GST@5%", value: 5, type: "GST" },
  { label: "GST@12%", value: 12, type: "GST" },
  { label: "GST@18%", value: 18, type: "GST" },
];

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

// --- INTERFACES ---
interface InvoiceItem {
  id: string;
  item: string;
  description: string;
  qty: number | string;
  unit: string;
  pricePerUnit: number | string;
  discountPercent: number | string;
  discountAmount: number;
  taxLabel: string;
  taxRate: number;
  taxAmount: number;
  amount: number | string;
}

interface InvoiceSeries {
  _id: string;
  series_name: string;
  prefix: string;
  current_number: number;
  number_format: string;
}

interface Customer {
  id: string;
  name: string;
  billing_address: string;
  gstin?: string;
}

const OtherInvoiceGenerator: React.FC = () => {
  // --- STATE ---
  const [customer, setCustomer] = useState<Customer>({
    id: "",
    name: "",
    billing_address: "",
    gstin: "",
  });

  const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");

  // Invoice Number States
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [isEditingNumber, setIsEditingNumber] = useState<boolean>(false);
  const [isManualEntry, setIsManualEntry] = useState<boolean>(false);

  // Specific fields
  const [poNumber, setPoNumber] = useState<string>("");
  const [poDate, setPoDate] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 15");
  const [stateOfSupply, setStateOfSupply] = useState<string>("Maharashtra");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [roundOff, setRoundOff] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Payment Info
  const [paymentType, setPaymentType] = useState<string>("Cash");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number | string>(0);

  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string>("");
  const [printData, setPrintData] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);

  const componentRef = useRef<HTMLDivElement>(null);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchInvoiceSeries();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${invoiceNumber || "Draft"}`,
  });

  // --- FUNCTIONS ---
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
      console.error("Error fetching series", error);
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
    setIsManualEntry(false);
    setIsEditingNumber(false);
  };

  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeries(seriesId);
    const series = invoiceSeries.find((s) => s._id === seriesId);
    if (series) {
      generateInvoiceNumber(series);
    }
  };

  // --- DATA FETCHING & PREP ---
  const preparePrintData = async () => {
    if (!savedInvoiceId) {
      alert("Please save the invoice first.");
      return false;
    }
    try {
      const response = await api.get(`/generate/invoice/${savedInvoiceId}`);
      setPrintData(response.data);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    } catch (e) {
      console.error(e);
      alert("Failed to load invoice data.");
      return false;
    }
  };

  // --- ACTIONS ---

  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    const success = await preparePrintData();
    if (success) {
      handlePrint();
    }
    setPdfLoading(false);
  };

  // --- ITEM MANAGEMENT ---

  const addRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      item: "",
      description: "",
      qty: 1,
      unit: "NONE",
      pricePerUnit: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxLabel: "NONE",
      taxRate: 0,
      taxAmount: 0,
      amount: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const calculateRowAmount = (item: InvoiceItem): InvoiceItem => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.pricePerUnit) || 0;
    const discPercent = Number(item.discountPercent) || 0;

    const baseAmount = qty * price;
    let discountVal = 0;
    if (discPercent > 0) {
      discountVal = (baseAmount * discPercent) / 100;
    }
    const taxableValue = baseAmount - discountVal;
    const taxVal = (taxableValue * item.taxRate) / 100;

    return {
      ...item,
      discountAmount: discountVal,
      taxAmount: taxVal,
      amount: Number((taxableValue + taxVal).toFixed(2)),
    };
  };

  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let updated = { ...item, [field]: value };

          if (field === "taxLabel") {
            const selectedTax = TAX_OPTIONS.find((t) => t.label === value);
            updated.taxRate = selectedTax ? selectedTax.value : 0;
          }

          if (field === "amount") {
            if (value === "") return updated;
            const totalAmount = parseFloat(value) || 0;
            const qty = Number(updated.qty) || 1;
            const taxRate = updated.taxRate || 0;

            const taxableValue = totalAmount / (1 + taxRate / 100);
            const taxAmount = totalAmount - taxableValue;

            updated.pricePerUnit = Number((taxableValue / qty).toFixed(2));
            updated.taxAmount = Number(taxAmount.toFixed(2));
            updated.amount = totalAmount;

            return updated;
          }

          return calculateRowAmount(updated);
        }
        return item;
      }),
    );
  };

  const calculateTotal = () => {
    const total = items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
    return roundOff ? Math.round(total) : total;
  };

  const handleSave = async () => {
    if (!customer.name) {
      alert("Please select a customer");
      return;
    }
    if (!customer.id) {
      alert("Please select a valid Partner from the dropdown list.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        invoiceDate,
        dueDate,
        poNumber,
        poDate,
        paymentTerms,
        stateOfSupply,
        invoiceNumber: isManualEntry ? invoiceNumber : "",
        seriesId: selectedSeries,
        recipientType: "Partner",
        recipientId: customer.id,
        items: items.map((it) => ({
          ...it,
          qty: Number(it.qty) || 0,
          price: Number(it.pricePerUnit) || 0, // Fallback mapping added here
          pricePerUnit: Number(it.pricePerUnit) || 0,
          discountPercent: Number(it.discountPercent) || 0,
          amount: Number(it.amount) || 0,
        })),
        tdsRate: 0,
        roundOff,
        paymentInfo: {
          amount_paid: Number(amountPaid) || 0,
          payment_method: paymentType,
          payment_reference: referenceNo,
          payment_notes: "",
        },
        location_name: selectedLocation?.name,
        location_id: selectedLocation?._id,
        location_address: selectedLocation?.addressLink || "",
        notes: "",
        termsAndConditions: "",
        actionType: "save",
      };

      const response = await api.post("/save/invoice", payload);
      if (response.data?.invoice?._id) {
        setSavedInvoiceId(response.data.invoice._id);
        alert("Invoice Saved Successfully");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (name: string, partnerData?: any) => {
    if (partnerData) {
      setCustomer({
        id: partnerData._id,
        name: partnerData.partner_name,
        billing_address: `${partnerData.billing_address?.street || ""}, ${
          partnerData.billing_address?.city || ""
        }`,
        gstin: partnerData.gstin,
      });
    } else {
      setCustomer((prev) => ({ ...prev, name: name, id: "" }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <div className={styles.topLeft}>
          <div className={styles.inputGroup}>
            <label>Customer *</label>
            <PartnerSearchDropdown
              value={customer.name}
              onChange={handleCustomerSelect}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Billing Address</label>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Enter billing address..."
              value={customer.billing_address}
              onChange={(e) =>
                setCustomer({ ...customer, billing_address: e.target.value })
              }
            />
          </div>
        </div>

        <div className={styles.topCenter}>
          <div className={styles.inputGroup}>
            <label>PO No.</label>
            <input
              type="text"
              className={styles.input}
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>PO Date</label>
            <input
              type="date"
              className={styles.input}
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
            />
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

        <div className={styles.topRight}>
          <div className={styles.rowGroup}>
            <label>Invoice No.</label>
            <div
              className={styles.flexRow}
              style={{ alignItems: "center", gap: "5px" }}
            >
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

              <input
                type="text"
                className={styles.input}
                value={invoiceNumber}
                disabled={!isEditingNumber}
                onChange={(e) => {
                  setInvoiceNumber(e.target.value);
                  setIsManualEntry(true);
                }}
                style={{ width: "120px" }}
              />

              <button
                onClick={() => setIsEditingNumber(true)}
                title="Edit Invoice Number"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px",
                }}
              >
                <FiEdit2 size={16} />
              </button>
            </div>
          </div>

          <div className={styles.rowGroup}>
            <label>Invoice Date</label>
            <input
              type="date"
              className={styles.input}
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>

          <div className={styles.rowGroup}>
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
            <label>State of Supply</label>
            <select
              value={stateOfSupply}
              onChange={(e) => setStateOfSupply(e.target.value)}
              className={styles.select}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "3%" }}>#</th>
              <th style={{ width: "20%" }}>ITEM</th>
              <th style={{ width: "15%" }}>DESCRIPTION</th>
              <th style={{ width: "8%" }}>QTY</th>
              <th style={{ width: "10%" }}>Amount/service</th>
              <th style={{ width: "8%" }}>DISC %</th>
              <th style={{ width: "12%" }}>TAX</th>
              <th style={{ width: "10%", textAlign: "right" }}>AMOUNT</th>
              <th style={{ width: "4%" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    className={styles.tableInput}
                    value={item.item}
                    onChange={(e) =>
                      handleItemChange(item.id, "item", e.target.value)
                    }
                    placeholder="Product/Service"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.tableInput}
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(item.id, "description", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.tableInput}
                    value={item.qty}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "qty",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.tableInput}
                    value={item.pricePerUnit}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "pricePerUnit",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                    onBlur={(e) =>
                      handleItemChange(
                        item.id,
                        "pricePerUnit",
                        e.target.value === ""
                          ? 0
                          : Number(parseFloat(e.target.value).toFixed(2)),
                      )
                    }
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.tableInput}
                    value={item.discountPercent}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "discountPercent",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                  />
                </td>
                <td>
                  <div className={styles.taxCell}>
                    <select
                      className={styles.tableSelect}
                      value={item.taxLabel}
                      onChange={(e) =>
                        handleItemChange(item.id, "taxLabel", e.target.value)
                      }
                    >
                      {TAX_OPTIONS.map((t) => (
                        <option key={t.label} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <span className={styles.taxAmount}>
                      {item.taxAmount.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <input
                    type="number"
                    className={styles.tableInput}
                    style={{ textAlign: "right" }}
                    value={item.amount}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "amount",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                    onBlur={(e) =>
                      handleItemChange(
                        item.id,
                        "amount",
                        e.target.value === ""
                          ? 0
                          : Number(parseFloat(e.target.value).toFixed(2)),
                      )
                    }
                    step="0.01"
                  />
                </td>
                <td>
                  <FiTrash2
                    className={styles.deleteIcon}
                    onClick={() => removeRow(item.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.addItemRow}>
          <button className={styles.addButton} onClick={addRow}>
            <FiPlus /> Add Row
          </button>
          <div className={styles.totalLabel}>TOTAL: {items.length}</div>
        </div>
      </div>

      <div className={styles.footerSection}>
        <div className={styles.footerLeft}>
          <div className={styles.inputGroup}>
            <label>Amount Paid</label>
            <input
              type="number"
              className={styles.input}
              placeholder="0.00"
              value={amountPaid}
              onChange={(e) =>
                setAmountPaid(
                  e.target.value === "" ? "" : parseFloat(e.target.value),
                )
              }
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Payment Type</label>
            <select
              className={styles.select}
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option>Cash</option>
              <option>Online/UPI</option>
              <option>Cheque</option>
              <option>Bank Transfer</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Reference No.</label>
            <input
              className={styles.input}
              placeholder="Ref #"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <InvoiceTemplate data={printData} componentRef={componentRef} />
        </div>

        <div className={styles.footerRight}>
          <div className={styles.roundOffContainer}>
            <input
              type="checkbox"
              id="roundOff"
              checked={roundOff}
              onChange={(e) => setRoundOff(e.target.checked)}
            />
            <label htmlFor="roundOff">Round Off</label>
          </div>

          <div className={styles.grandTotal}>
            <span>Total Amount:</span>
            <span className={styles.amountValue}>
              ₹ {calculateTotal().toFixed(2)}
            </span>
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={loading}
            >
              <FiSave /> {loading ? "Saving..." : "Save"}
            </button>
            {savedInvoiceId && (
              <button
                className={styles.saveBtn}
                onClick={handleGeneratePDF}
                disabled={pdfLoading}
                style={{ backgroundColor: "#6366f1", marginLeft: "10px" }}
              >
                <FiDownload /> {pdfLoading ? "Preparing..." : "Print PDF"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherInvoiceGenerator;