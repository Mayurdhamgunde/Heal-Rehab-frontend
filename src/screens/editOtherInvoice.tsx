import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../css/OtherInvoiceGenerator.module.css"; // Reusing the same CSS
import api from "../utils/central";
import {
  FiPlus,
  FiSave,
  FiTrash2,
  FiDownload,
  FiArrowLeft,
} from "react-icons/fi";
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

interface Customer {
  id: string;
  name: string;
  billing_address: string;
  gstin?: string;
}

const EditOtherInvoice: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  // --- STATE ---
  const [customer, setCustomer] = useState<Customer>({
    id: "",
    name: "",
    billing_address: "",
    gstin: "",
  });

  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  // Specific fields
  const [poNumber, setPoNumber] = useState<string>("");
  const [poDate, setPoDate] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 15");
  const [stateOfSupply, setStateOfSupply] = useState<string>("Maharashtra");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [roundOff, setRoundOff] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);

  const componentRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${invoiceNumber || "Draft"}`,
  });

  // --- FUNCTIONS ---
  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/get/invoice/${invoiceId}`);
      const inv = response.data.invoice;

      // Map Customer
      setCustomer({
        id: inv.recipient_id || "",
        name: inv.recipient_snapshot?.name || "",
        billing_address: inv.recipient_snapshot?.billing_address || "",
        gstin: inv.recipient_snapshot?.gstin || "",
      });

      // Map Core Fields
      setInvoiceNumber(inv.invoice_number);
      setInvoiceDate(inv.invoice_date ? inv.invoice_date.split("T")[0] : "");
      setDueDate(inv.due_date ? inv.due_date.split("T")[0] : "");
      setPoNumber(inv.po_number || "");
      setPoDate(inv.po_date ? inv.po_date.split("T")[0] : "");
      setPaymentTerms(inv.payment_terms || "Net 15");
      setStateOfSupply(inv.state_of_supply || "Maharashtra");
      setRoundOff(inv.round_off_amount !== 0);

      // Map Location
      if (inv.location_id) {
        setSelectedLocation({
          _id: inv.location_id,
          name: inv.location_name,
          addressLink: inv.location_address,
        });
      }

      // Map Items
      const mappedItems: InvoiceItem[] = inv.items.map(
        (it: any, index: number) => {
          // Reverse engineer the tax label based on rate
          const guessedTaxOption =
            TAX_OPTIONS.find(
              (t) => t.value === it.tax_percentage && t.type === "GST",
            ) || TAX_OPTIONS.find((t) => t.value === it.tax_percentage);

          return {
            id: it.item_id || `loaded-${index}-${Date.now()}`,
            item: it.item_name,
            description: it.description || "",
            qty: it.quantity,
            unit: it.unit || "NONE",
            pricePerUnit: it.price_per_unit,
            discountPercent: it.discount_percentage,
            discountAmount: it.discount_amount,
            taxLabel: guessedTaxOption ? guessedTaxOption.label : "NONE",
            taxRate: it.tax_percentage,
            taxAmount: it.tax_amount,
            amount: it.line_total,
          };
        },
      );

      setItems(mappedItems.length > 0 ? mappedItems : createEmptyRow());
    } catch (error) {
      console.error("Error fetching invoice for edit", error);
      alert("Failed to load invoice details.");
      navigate("/invoice/list");
    } finally {
      setLoading(false);
    }
  };

  const createEmptyRow = (): InvoiceItem[] => [
    {
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
    },
  ];

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
  };

  const preparePrintData = async () => {
    try {
      const response = await api.get(`/generate/invoice/${invoiceId}`);
      setPrintData(response.data);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    } catch (e) {
      console.error(e);
      alert("Failed to load printable invoice data.");
      return false;
    }
  };

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
    setItems((prev) => [...prev, ...createEmptyRow()]);
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

  const handleCustomerSelect = (name: string, partnerData?: any) => {
    if (partnerData) {
      setCustomer({
        id: partnerData._id,
        name: partnerData.partner_name,
        billing_address: `${partnerData.billing_address?.street || ""}, ${partnerData.billing_address?.city || ""}`,
        gstin: partnerData.gstin,
      });
    } else {
      setCustomer((prev) => ({ ...prev, name: name, id: "" }));
    }
  };

  const handleUpdate = async () => {
    if (!customer.name) {
      alert("Please select a customer");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        invoiceDate,
        dueDate,
        poNumber,
        poDate,
        paymentTerms,
        stateOfSupply,
        // Using existing ID and Number
        invoiceNumber,
        recipientType: "Partner", // Preserving generator logic
        recipientId: customer.id,
        items: items.map((it) => ({
          ...it,
          qty: Number(it.qty) || 0,
          pricePerUnit: Number(it.pricePerUnit) || 0,
          discountPercent: Number(it.discountPercent) || 0,
          amount: Number(it.amount) || 0,
        })),
        roundOff,
        location_name: selectedLocation?.name,
        location_id: selectedLocation?._id,
        location_address: selectedLocation?.addressLink || "",
      };

      await api.post(`/edit/invoice/${invoiceId}`, payload);
      alert("Invoice Updated Successfully");
      navigate(`/invoice/${invoiceId}`); // Return to details page
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={styles.container}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2>Loading Invoice Data...</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header controls */}
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#007b8e",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: "bold",
          }}
        >
          <FiArrowLeft /> Back
        </button>
        <h2 style={{ margin: 0 }}>Edit Invoice</h2>
      </div>

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
              autoSelectPreferred={false}
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
              <input
                type="text"
                className={styles.input}
                value={invoiceNumber}
                disabled={true}
                style={{
                  width: "100%",
                  backgroundColor: "#f0f0f0",
                  color: "#666",
                }}
              />
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
          {/* Note: Initial Payment logging is typically disabled during an edit to avoid corrupting the payment history ledger. 
                Users manage payments inside the Details screen. */}
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
              onClick={handleUpdate}
              disabled={saving}
            >
              <FiSave /> {saving ? "Updating..." : "Update Invoice"}
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleGeneratePDF}
              disabled={pdfLoading}
              style={{ backgroundColor: "#6366f1", marginLeft: "10px" }}
            >
              <FiDownload /> {pdfLoading ? "Preparing..." : "Print PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOtherInvoice;
