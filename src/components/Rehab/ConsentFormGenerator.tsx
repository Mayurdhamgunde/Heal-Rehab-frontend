import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import api from "../../utils/central";
import styles from "../../css/Rehab/ConsentFormGenerator.module.css";
import ConsentPrintTemplate from "../../screens/Rehab/ConsentForm";

// --- Icons (Matching updatePatient.tsx) ---
const IconPersonal = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><rect width="20" height="14" x="2" y="5" rx="2" strokeDasharray="60" strokeDashoffset="60" className={styles.hideBox} /></svg>
);
const IconAdditional = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 8h10M7 12h10M7 16h10" /></svg>
);
const IconWitness = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconMedical = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);
const IconPrint = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);

const ConsentFormScreen: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Consent_Form",
  });

  useEffect(() => {
    if (patientId) {
      fetchConsentData();
    }
  }, [patientId]);

  const fetchConsentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/print/consent/${patientId}`);
      setData(response.data);
    } catch (err: any) {
      console.error("Error fetching consent data:", err);
      setError("Failed to load consent form data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

 const flattenObject = (obj: any, res: Record<string, any> = {}, parentKey = "") => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (
          ["_id", "__v", "createdAt", "updatedAt", "id", "photos", "identity_card", "address_breakdown"].includes(key)
        )
          continue;

        if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
          flattenObject(obj[key], res, key);
        } else {
          if ((key === "name" || key === "email") && (parentKey === "doctor" || parentKey === "organization")) {
            continue; 
          }
          res[key] = obj[key];
        }
      }
    }
    return res;
  };

  const formatLabel = (key: string) => {
    const lowerKey = key.toLowerCase();
    
    // Explicit label overrides
    if (lowerKey === "mobile" || lowerKey === "patient_phone") return "Patient Phone Number";
    
    // --- WITNESS & GUARDIAN OVERRIDES ---
    if (lowerKey === "witness_phone" || lowerKey === "witness_mobile") return "Witness Phone Number";
    if (lowerKey === "witness_relationship") return "Witness Relationship";
    
    if (lowerKey === "guardian_phone") return "Guardian 1 Phone";
    if (lowerKey === "guardian_relation") return "Guardian 1 Relation";
    
    if (lowerKey === "guardian_phone_2") return "Guardian 2 Phone";
    if (lowerKey === "guardian_relation_2") return "Guardian 2 Relation";
    // ------------------------------------

    if (lowerKey === "phone") return "Organization Phone"; 

    // General formatting for things like "marital_status" -> "Marital Status"
    const cleanKey = key.replace(/_url$/i, "").replace(/_id$/i, "");
    return cleanKey.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  };

  const isImageField = (key: string, value: any) => {
    if (typeof value !== "string" || !value) return false;
    const lowerKey = key.toLowerCase();
    return lowerKey.includes("photo") || lowerKey.includes("image") || lowerKey.includes("signature") || value.startsWith("http") || value.startsWith("data:image") || /\.(jpeg|jpg|gif|png|webp)$/i.test(value);
  };

  const formatValue = (value: any) => {
    if (Array.isArray(value)) return value.map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join(", ");
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
      }
    }
    return value !== null && value !== undefined && value !== "" ? String(value) : "N/A";
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading Consent Data...</p>
      </div>
    );
  }

  const flatData = data ? flattenObject(data) : {};
  const categories = {
    personal: [] as [string, any][],
    additional: [] as [string, any][],
    witness: [] as [string, any][],
    medical: [] as [string, any][],
    other: [] as [string, any][],
  };

  if (data?.patient?.identity_card?.number) {
    const iCardType = data.patient.identity_card.type || "ID";
    categories.additional.push([`${iCardType}_Number`, data.patient.identity_card.number]);
  }

  Object.entries(flatData).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (isImageField(key, value)) return; 
    else if (lowerKey.includes("witness") || lowerKey.includes("guardian")) categories.witness.push([key, value]);
    else if (lowerKey.match(/treatment|symptom|diagnosis|therapy|blood|medical|disease|condition/)) categories.medical.push([key, value]);
    else if (lowerKey.match(/education|caste|occupation|marital|income|icard|identity|category|form_type|consent_date|date/)) categories.additional.push([key, value]);
    else if (lowerKey.match(/name|dob|birth|gender|age|phone|mobile|email|address|street|city|state|zip|country/)) categories.personal.push([key, value]);
    else categories.other.push([key, value]);
  });

  const renderField = (key: string, value: any) => (
    <div className={styles.formGroup} key={key}>
      <label>{formatLabel(key)}</label>
      <div className={styles.readOnlyInput}>{formatValue(value)}</div>
    </div>
  );

  const renderCard = (title: string, icon: React.ReactNode, items: [string, any][]) => {
    if (items.length === 0) return null;
    return (
      <div className={styles.card}>
        <div className={styles.cardTitleWithIcon}>
          <div className={styles.iconWrapper}>{icon}</div>
          <h2>{title}</h2>
        </div>
        <div className={styles.grid3Col}>
          {items.map(([key, value]) => renderField(key, value))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <div className={styles.headerArea}>
          <h1 className={styles.pageTitle}>Consent Form Preview</h1>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {data && (
          <div className={styles.formLayout}>
            
            {/* ROW 1: PHOTOS */}
            <div className={styles.grid2Col}>
              <div className={styles.card}>
                <h3 className={styles.cardHeader}>PATIENT PHOTO</h3>
                <div className={styles.photoBoxContainer}>
                  <div className={styles.photoFrame}>
                    {data?.consent?.photos?.patient_photo ? (
                      <img src={data.consent.photos.patient_photo} alt="Patient" className={styles.uploadedImg} />
                    ) : (
                      <div className={styles.placeholderImg}>👤</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardHeader}>WITNESS PHOTO</h3>
                <div className={styles.photoBoxContainer}>
                  <div className={styles.photoFrame}>
                    {data?.consent?.photos?.witness_photo ? (
                      <img src={data.consent.photos.witness_photo} alt="Witness" className={styles.uploadedImg} />
                    ) : (
                      <div className={styles.placeholderImg}>👥</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DATA CARDS */}
            {renderCard("Personal Details", <IconPersonal />, categories.personal)}
            {renderCard("Additional Information", <IconAdditional />, categories.additional)}
            {renderCard("Witness Information", <IconWitness />, categories.witness)}
            {renderCard("Medical History", <IconMedical />, categories.medical)}
            {renderCard("Other Details", <IconAdditional />, categories.other)}

            {/* FOOTER ACTIONS */}
            <div className={styles.actionFooter}>
              <div className={styles.actionRight}>
                <button onClick={() => handlePrint()} className={styles.btnPrimary}>
                  <IconPrint />
                  Print Consent Form
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "none" }}>
        {data && <ConsentPrintTemplate ref={printRef} data={data} />}
      </div>
    </div>
  );
};

export default ConsentFormScreen;