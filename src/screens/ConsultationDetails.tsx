import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import {
  FaEdit,
  FaFilePdf,
  FaUser,
  FaUserMd,
  FaStethoscope,
  FaPills,
  FaCalendarAlt,
  FaClock,
  FaCreditCard,
  FaCalendarPlus,
  FaTimes,
  FaCalendarCheck,
} from "react-icons/fa";
import CircularProgress from "@mui/material/CircularProgress";

import api from "../utils/central";
import PrescriptionPrintTemplate from "../components/PrescriptionPdfService";
import styles from "../css/ConsultationDetails.module.css";

const ConsultationDetails: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const [isAddSelectionVisible, setIsAddSelectionVisible] = useState(false);
  
  // State for the UI Screen
  const [data, setData] = useState<any>(null);

  // States for PDF Templates
  const [printData, setPrintData] = useState<any>(null); // Prescription Only
  const [consultationPrintData, setConsultationPrintData] = useState<any>(null); // Full Consultation Report

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // References for react-to-print
  const printRef = useRef<HTMLDivElement>(null);
  const consultationPrintRef = useRef<HTMLDivElement>(null);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Fetch UI Data
      const uiResponse = await api.get(`/fetch/consultation/${consultationId}`);
      setData(uiResponse.data);

      const rxId = uiResponse.data.consultation?.prescriptionId;

      // 2. Fetch Prescription-Only Print Data
      if (rxId) {
        const printResponse = await api.get(
          `/print/consultation/prescription/${rxId}`,
        );
        setPrintData(printResponse.data);
      }

      // 3. Fetch Full Consultation Print Data
      try {
        const consultationPdfResponse = await api.get(`/prescription/pdf/${consultationId}`);
        setConsultationPrintData(consultationPdfResponse.data);
      } catch (pdfErr) {
        console.error('Error fetching consultation PDF data:', pdfErr);
      }

    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to load consultation details";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    if (consultationId) fetchDetails();
  }, [consultationId, fetchDetails]);

  // Handlers for printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription_${printData?.prescription?.prescription_number || "Doc"}`,
  });

  const handleConsultationPrint = useReactToPrint({
    contentRef: consultationPrintRef,
    documentTitle: `Consultation_Report_${consultationPrintData?.patient?.name || "Doc"}`,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <CircularProgress size={50} thickness={4} style={{ color: "#007b8e" }} />
        <p className={styles.loadingText}>Loading consultation details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h3>Error Loading Record</h3>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const { consultation, patient, prescription } = data;
  const patientId = patient?._id;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Consultation Details</h1>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.quickActions}>
              <button className={styles.actionBtn} onClick={() => navigate(`/payment/${patientId}`)}>
                <FaCreditCard /> Payment
              </button>
              <button className={styles.actionBtn} onClick={() => setIsAddSelectionVisible(true)} title="Book new appointment">
                <FaCalendarPlus /> New Appointment
              </button>
              <button 
                className={styles.actionBtn} 
                onClick={() => handleConsultationPrint()} 
                disabled={!consultationPrintData} 
                title="Print Full Consultation Report"
              >
                <FaFilePdf color="#007b8e" /> Print Report
              </button>
            </div>

            <div className={styles.dateBadge}>
              <FaCalendarAlt size={14} /> {formatDate(consultation.consultationDate)}
              <span style={{ margin: "0 4px", color: "#cbd5e1" }}>|</span>
              <FaClock size={14} /> {consultation.consultationTime}
            </div>

            <button onClick={() => navigate(`/edit-consultation/${consultationId}`)} className={styles.editButton} title="Edit Record">
              <FaEdit size={16} />
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.contentGrid}>
          {/* --- LEFT COLUMN: Meta Info --- */}
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <FaUser color="#007b8e" />
                  <span className={styles.sectionTitle}>Patient Info</span>
                </div>
              </div>
              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Patient Name</label>
                <div className={styles.infoValue}>{patient?.patient_first_name} {patient?.patient_last_name}</div>
              </div>
              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Contact</label>
                <div className={styles.infoValue}>{patient?.patient_phone || "N/A"}</div>
              </div>
              {prescription?.vitals && (
                <div className={styles.vitalsRow}>
                  <div className={styles.vitalItem}>
                    <label className={styles.infoLabel}>Weight (kg)</label>
                    <div className={styles.vitalValueBox}>{prescription.vitals.weight || "--"}</div>
                  </div>
                  <div className={styles.vitalItem}>
                    <label className={styles.infoLabel}>BP</label>
                    <div className={styles.vitalValueBox}>{prescription.vitals.bp || "--"}</div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <FaUserMd color="#007b8e" />
                  <span className={styles.sectionTitle}>Doctor</span>
                </div>
              </div>
              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Attending Doctor</label>
                <div className={styles.infoValue}>{consultation.doctorName}</div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Clinical & Rx --- */}
          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <FaStethoscope color="#007b8e" />
                  <span className={styles.sectionTitle}>Clinical Notes</span>
                </div>
              </div>
              <div className={styles.clinicalGrid}>
                <div className={styles.clinicalItem}>
                  <label className={styles.infoLabel}>Symptoms</label>
                  <div className={styles.detailBox}>{consultation.patientSymptoms || "N/A"}</div>
                </div>
                <div className={styles.clinicalItem}>
                  <label className={styles.infoLabel}>Diagnosis / Causes</label>
                  <div className={styles.detailBox}>{consultation.results || consultation.causes || "N/A"}</div>
                </div>
                <div className={`${styles.clinicalItem} ${styles.fullWidth}`}>
                  <label className={styles.infoLabel}>Additional Notes</label>
                  <div className={styles.detailBox}>{consultation.notes || "No additional notes added."}</div>
                </div>
              </div>
            </div>

            {prescription && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <FaPills color="#007b8e" />
                    <span className={styles.sectionTitle}>Prescription ({prescription.medications?.length || 0})</span>
                  </div>
                  <button className={styles.iconBtn} onClick={() => handlePrint()} disabled={!printData} title="Print / Save PDF">
                    <FaFilePdf size={14} />
                  </button>
                </div>

                <div className={styles.medList}>
                  {prescription.medications?.map((med: any, index: number) => (
                    <div key={index} className={styles.medCard}>
                      <div className={styles.medBadge}>{index + 1}</div>
                      <div className={styles.medContent}>
                        <div className={styles.medName}>{med.drug_name} {med.strength && `(${med.strength})`}</div>
                        <div className={styles.medMeta}>{med.frequency} • {med.duration} Days • {med.quantity} Qty</div>
                        {med.instructions && (
                          <div style={{ fontSize: "0.8rem", color: "#007b8e", marginTop: "4px", fontStyle: "italic" }}>
                            Note: {med.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!prescription.medications || prescription.medications.length === 0) && (
                    <p style={{ color: "#64748b", fontStyle: "italic", padding: "10px" }}>No medications listed.</p>
                  )}
                </div>

                {prescription.notes && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed #e5e7eb" }}>
                    <label className={styles.infoLabel}>Rx Notes</label>
                    <div className={styles.detailBox} style={{ background: "#fffbeb", borderColor: "#fcd34d", color: "#92400e" }}>
                      {prescription.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- HIDDEN PRINT TEMPLATES --- */}
      <div style={{ display: "none" }}>
        <PrescriptionPrintTemplate ref={printRef} data={printData} />
        <PrescriptionPrintTemplate ref={consultationPrintRef} data={consultationPrintData} />
      </div>

      {/* Modal */}
      {isAddSelectionVisible && (
        <div className={styles.overlay}>
          <div className={styles.selectionModal}>
            <div className={styles.selectionHeader}>
              <div>
                <h3 className={styles.selectionTitle}>Create New</h3>
                <p className={styles.selectionSubtitle}>What would you like to schedule?</p>
              </div>
              <button className={styles.closeButton} onClick={() => setIsAddSelectionVisible(false)}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.selectionGrid}>
              <div className={styles.optionCard} onClick={() => navigate(`/bookAppoinment/${patientId}`)}>
                <div className={styles.optionIconCircle}><FaCalendarCheck /></div>
                <div>
                  <div className={styles.optionLabel}>Book Session</div>
                  <div className={styles.optionDesc}>Book a regular therapy appointment</div>
                </div>
              </div>
              <div className={styles.optionCard} onClick={() => navigate(`/consultations/${patientId}`)}>
                <div className={styles.optionIconCircle}><FaStethoscope /></div>
                <div>
                  <div className={styles.optionLabel}>Book Consultation</div>
                  <div className={styles.optionDesc}>Schedule a doctor consultation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationDetails;