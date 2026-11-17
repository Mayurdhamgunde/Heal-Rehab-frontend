import React, { useState } from "react";
// Import your existing Patient Invoice (renamed file)
import InvoiceGenerator from "./PatientInvoiceGenerator";
// Import the new Other Invoice component you created
import OtherInvoiceGenerator from "./OtherInvoiceGenerator"; 
import styles from "../css/InvoiceMain.module.css"; 

const InvoiceMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"patient" | "other">("patient");

  return (
    <div className={styles.mainWrapper}>
      {/* --- TOGGLE SWITCH --- */}
      <div className={styles.toggleContainer}>
        <div className={styles.toggleBackground}>
          <button
            onClick={() => setActiveTab("patient")}
            className={`${styles.toggleButton} ${
              activeTab === "patient" ? styles.active : ""
            }`}
          >
            Patient Invoice
          </button>
          <button
            onClick={() => setActiveTab("other")}
            className={`${styles.toggleButton} ${
              activeTab === "other" ? styles.active : ""
            }`}
          >
            Other Invoice
          </button>
        </div>
      </div>

      {/* --- CONDITIONAL RENDERING --- */}
      <div className={styles.contentArea}>
        {activeTab === "patient" ? (
          <InvoiceGenerator />
        ) : (
          <OtherInvoiceGenerator />
        )}
      </div>
    </div>
  );
};

export default InvoiceMain;