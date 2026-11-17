// src/pages/PlanDetails.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  FaEdit,
  FaArrowLeft,
  FaStethoscope,
  FaNotesMedical,
  FaExclamationCircle,
  FaTimes,
  FaCheckCircle,
  FaTrash,
  FaPrint,
  FaSpinner,
  FaHeartbeat,
  FaArchive,
} from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import api from "../utils/central";
import PrescriptionPrintTemplate from "../screens/Rehab/PrescriptionPrintTemplate"; // Adjust path as needed
import styles from "../css/planDetails.module.css";
import DeleteTherapyPlanModal from "../components/DeleteTherapy";
import ClosureSummary from "../components/closureSummary";
import PlanTemplate from "./Rehab/PlanPrintTemplate";
import PrescriptionManager from "../components/PrescriptionManager";
import { Loader2 } from "lucide-react";

// Interfaces
interface SessionRemark {
  doctor_name: string;
  presession_remark?: string;
  postsession_remarks?: string;
  timestamp: string;
}
interface TherapySessionDetail {
  _id?: string | { $oid: string };
  status: string;
  date?: string;
  therepy_date?: string;
  start_time?: string;
  therepy_start_time?: string;
  therepy_type?: string;
  session_number?: number;
  doctor_name?: string;
  session_id?: string;
  issue_dealt_with?: string;
  counselor_impression?: string;
}
interface Note {
  note: string;
  doctor_name: string;
  date: string;
}
interface SessionImage {
  original_name: string;
  url: string;
  sas_url: string;
  size: number;
  type: string;
  uploaded_at: string;
  session_number: number;
  SessionId: string;
  _id: string;
  session_type: "presession" | "postsession";
}
interface PrescriptionSchedule {
  frequency: string;
  duration: string;
  quantity?: string;
}
interface Prescription {
  _id?: string | { $oid: string };
  prescription_number: string;
  prescription_date: string | { $date: string };
  doctor_name?: string;
  vitals?: { weight?: string; bp?: string };
  medications: Array<{
    _id?: string | { $oid: string };
    drug_name: string;
    generic_name?: string;
    drug_type?: string;
    strength?: string;
    route?: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: string;
    start_date?: string | { $date: string };
    end_date?: string | { $date: string };
    schedules?: PrescriptionSchedule[];
  }>;
  diagnosis?: string;
  notes?: string;
  status?: string;
}
interface TherapyPlan {
  _id: string;
  therapy_name: string;
  patient_id: string;
  ICD_11_Codes?: string;
  MarksOfIdentification?: string;
  patient_diagnosis: string;
  patient_symptoms: string[] | string;
  therapy_duration: string;
  therapy_end: string;
  therapy_start: string;
  patient_therapy_category: string;
  total_amount: number | string;
  received_amount: string;
  balance: string;
  extra_addons?: string[] | Array<{ name: string; amount: number }>;
  addons_amount?: number | string;
  therapy_sessions?: TherapySessionDetail[];
  estimated_sessions?: number;
  presession_remarks?: SessionRemark[];
  prescriptions?: Prescription[];
  postsession_remarks?: SessionRemark[];
  notes?: Note[];
  presession_images?: SessionImage[];
  postsession_images?: SessionImage[];
  status?: string;
  goal_achievement?: number;
  closure_date?: string;
  closure_reason?: string;
}
interface VitalsReading {
  _id?: string | { $oid: string };
  recorded_at: string;
  pulse?: string;
  temperature?: string;
  bp_systolic?: string;
  bp_diastolic?: string;
  respiratory_rate?: string;
  spo2?: string;
  weight?: string;
  blood_glucose?: string;
  pain_score?: string;
  notes?: string;
  recorded_by_name?: string;
}
interface MedicalReport {
  _id: string;
  report_number: string;
  report_type: string;
  lab_name: string;
  report_date: string;
  status: string;
  notes?: string;
  method?: string;
  interpretation?: string;
  parameters?: Array<{
    label: string;
    value: string;
    unit?: string;
    reference_range?: string;
    flag?: string;
    group?: string;
  }>;
}
interface TherapyPlanDetails {
  therapy_plan: TherapyPlan;
  patient_name: string;
  patient_id: string;
  patient_image?: string | null;
  created_by_name?: string;
  images?: SessionImage[];
  prescription?: Prescription;
}
interface NoteFormData {
  note: string;
}
interface ClosureSummaryData {
  therapy_plan_id: string;
  therapy_name: string;
  patient_diagnosis: string;
  closure_information: {
    closure_date?: string;
    closure_reason?: string;
    closure_details?: string;
    final_remarks?: string;
    treatment_outcome?: string;
    follow_up_recommendations?: string;
    closed_by?: string;
    next_visit_date?: string | null;
  };
  session_statistics: {
    estimated_sessions?: number;
    completed_sessions?: number;
    total_sessions_conducted?: number;
    completion_rate?: string;
  };
  therapy_duration: {
    planned_start?: string;
    planned_end?: string;
    actual_closure?: string;
  };
  goal_achievement: string;
  total_remarks: { presession?: number; postsession?: number };
  total_images: number;
  extra_addons: number;
  post_care_prescription_id?: string | null;
  post_care_prescription?: Prescription | null;
}

const PlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [planDetails, setPlanDetails] = useState<TherapyPlanDetails | null>(
    null,
  );
  const [closureSummary, setClosureSummary] =
    useState<ClosureSummaryData | null>(null);
  const [vitalsList, setVitalsList] = useState<VitalsReading[]>([]);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf] = useState<boolean>(false);
  const [showPrescriptionModal, setShowPrescriptionModal] =
    useState<boolean>(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState<boolean>(false);
  const [isNoteSubmitting, setIsNoteSubmitting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Vitals State
  const [isVitalsModalVisible, setIsVitalsModalVisible] =
    useState<boolean>(false);
  const [isVitalsSubmitting, setIsVitalsSubmitting] = useState<boolean>(false);
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);
  const [isVitalsViewModalVisible, setIsVitalsViewModalVisible] =
    useState<boolean>(false);

  // Medical Reports State
  const [isReportsViewModalVisible, setIsReportsViewModalVisible] =
    useState<boolean>(false);

  // Carousel State
  const [, setCurrentMedIndex] = useState<number>(0);

  // --- PLAN PRINT LOGIC ---
  const printPlanRef = useRef<HTMLDivElement>(null);
  const [planPrintData, setPlanPrintData] = useState<any>(null);
  const [isPrintingPlan, setIsPrintingPlan] = useState<boolean>(false);

  const printRxRef = useRef<HTMLDivElement>(null);
  const [rxPrintData, setRxPrintData] = useState<any>(null);
  const [isPrintingRx, setIsPrintingRx] = useState<boolean>(false);

  const handleRxPrint = useReactToPrint({
    contentRef: printRxRef,
    documentTitle: "Prescription",
    onAfterPrint: () => setRxPrintData(null),
  });

  const fetchAndPrintPrescription = async (prescriptionId: string) => {
    if (!prescriptionId) return;
    setIsPrintingRx(true);
    try {
      // Endpoint mapping to your provided Express controller
      const response = await api.get(
        `/get/prescription/print/${prescriptionId}`,
      );
      setRxPrintData(response.data);
      setTimeout(() => {
        handleRxPrint();
        setIsPrintingRx(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching prescription print data:", err);
      setIsPrintingRx(false);
    }
  };

  const handlePlanPrint = useReactToPrint({
    contentRef: printPlanRef,
    documentTitle: "Therapy_Plan",
    onAfterPrint: () => setPlanPrintData(null),
  });

  const fetchAndPrintPlan = async () => {
    if (!planId) return;
    setIsPrintingPlan(true);
    try {
      const response = await api.get(`/plan/summery/print/${planId}`);
      setPlanPrintData(response.data);
      setTimeout(() => {
        handlePlanPrint();
        setIsPrintingPlan(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching plan print data:", err);
      setIsPrintingPlan(false);
    }
  };
  // --- END PLAN PRINT LOGIC ---

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormData>({ defaultValues: { note: "" } });

  const {
    control: vitalsControl,
    handleSubmit: handleVitalsSubmit,
    reset: resetVitals,
    formState: {},
  } = useForm<Partial<VitalsReading>>({
    defaultValues: {
      pulse: "",
      temperature: "",
      bp_systolic: "",
      bp_diastolic: "",
      spo2: "",
      weight: "",
      respiratory_rate: "",
      blood_glucose: "",
      pain_score: "",
      notes: "",
    },
  });

  // --- MEDICAL REPORT STATE ---
  const [isReportModalVisible, setIsReportModalVisible] =
    useState<boolean>(false);
  const [isReportSubmitting, setIsReportSubmitting] = useState<boolean>(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  const {
    control: reportControl,
    handleSubmit: handleReportSubmit,
    reset: resetReport,
    formState: {},
  } = useForm<any>({
    defaultValues: {
      report_type: "",
      lab_name: "",
      report_date: new Date().toISOString().slice(0, 10),
      parameters: [
        { label: "Result", value: "", unit: "", reference_range: "" },
      ],
      method: "",
      interpretation: "",
      notes: "",
    },
  });

  const {
    fields: parameterFields,
    append: appendParameter,
    remove: removeParameter,
  } = useFieldArray({ control: reportControl, name: "parameters" });

  useEffect(() => {
    if (planId) {
      fetchPlanDetails();
      fetchVitals();
      fetchMedicalReports();
    }
  }, [planId]);

  const fetchPlanDetails = async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/get/plan/${planId}`);
      setPlanDetails(response.data);
      if (response.data?.closure_summary)
        setClosureSummary(response.data.closure_summary);
      setCurrentMedIndex(0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error fetching plan details");
    } finally {
      setLoading(false);
    }
  };

  const fetchVitals = async () => {
    if (!planId) return;
    try {
      const response = await api.get(`/plan/${planId}/vitals`);
      setVitalsList(response.data.vitals_history || []);
    } catch (err) {
      console.error("Failed to fetch vitals list:", err);
    }
  };

  const fetchMedicalReports = async () => {
    if (!planId) return;
    try {
      const response = await api.get(`/plan/${planId}/medical-reports`);
      setMedicalReports(response.data.reports || []);
    } catch (err) {
      console.error("Failed to fetch medical reports:", err);
    }
  };

  const calculateTherapyProgressByDays = (
    start: string,
    end: string,
    status?: string,
    closureDate?: string,
  ): number => {
    try {
      if (!start || !end) return 0;

      const startDate = new Date(start).getTime();
      const endDate = new Date(end).getTime();
      const total = endDate - startDate;

      if (total <= 0) return 100;

      let targetDate = new Date().setHours(0, 0, 0, 0);

      // If completed, determine if it finished early
      if (status?.toLowerCase() === "completed") {
        if (closureDate) {
          const closedDate = new Date(closureDate).getTime();
          if (closedDate < endDate) {
            targetDate = closedDate; // Calculate based on the early completion date
          } else {
            return 100; // Completed on or after the planned date
          }
        } else {
          return 100; // Fallback if no closure date exists
        }
      }

      const elapsed = targetDate - startDate;
      return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
    } catch (err) {
      return 0;
    }
  };
  const handleRevertPlan = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reopen this therapy plan? This will remove all closure details.",
      )
    )
      return;

    try {
      setLoading(true);
      await api.post(`/plan/revert/${planId}`); // Ensure this matches your new backend route
      alert("Therapy plan successfully reopened.");
      await fetchPlanDetails(); // Refresh the data
    } catch (err: any) {
      alert(err.response?.data?.msg || "Failed to revert therapy plan");
      setLoading(false);
    }
  };
  const handleDeletePlan = async () => {
    if (!planId) return;
    try {
      const response = await api.post(`/delete/therapyplan/${planId}`);
      if (response.status === 200) {
        alert("Therapy plan deleted successfully");
        navigate(-1);
      }
    } catch (err: any) {
      alert(err.response?.data?.msg || "Failed to delete therapy plan");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const addNoteToTherapyPlan = async (data: NoteFormData) => {
    if (!planId || !data.note.trim()) {
      setError("Please enter a note");
      return;
    }
    setIsNoteSubmitting(true);
    try {
      await api.put(`/addNote/plan/${planId}`, { note: data.note });
      await fetchPlanDetails();
      reset();
      setIsNoteModalVisible(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to add note. Please try again.",
      );
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  const openEditVitalsModal = (vital: VitalsReading) => {
    resetVitals({
      pulse: vital.pulse || "",
      temperature: vital.temperature || "",
      bp_systolic: vital.bp_systolic || "",
      bp_diastolic: vital.bp_diastolic || "",
      spo2: vital.spo2 || "",
      weight: vital.weight || "",
      respiratory_rate: vital.respiratory_rate || "",
      blood_glucose: vital.blood_glucose || "",
      pain_score: vital.pain_score || "",
      notes: vital.notes || "",
    });
    setEditingVitalId(vital._id as string);
    setIsVitalsModalVisible(true);
  };

  const saveVitalsToPlan = async (data: Partial<VitalsReading>) => {
    if (!planId) return;
    setIsVitalsSubmitting(true);
    try {
      if (editingVitalId) {
        await api.put(`/plan/${planId}/vitals/${editingVitalId}`, data);
      } else {
        await api.post(`/plan/${planId}/vitals`, data);
      }
      await fetchVitals();
      setIsVitalsModalVisible(false);
      setEditingVitalId(null);
      resetVitals({
        pulse: "",
        temperature: "",
        bp_systolic: "",
        bp_diastolic: "",
        spo2: "",
        weight: "",
        respiratory_rate: "",
        blood_glucose: "",
        pain_score: "",
        notes: "",
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Failed to save vitals.";
      alert(`Error: ${errorMessage}`);
      console.error("Vitals Submission Error:", err);
    } finally {
      setIsVitalsSubmitting(false);
    }
  };

  // --- MEDICAL REPORT FUNCTIONS ---
  const openAddReportModal = () => {
    setEditingReportId(null);
    resetReport({
      report_type: "",
      lab_name: "",
      report_date: new Date().toISOString().slice(0, 10),
      parameters: [
        { label: "Result", value: "", unit: "", reference_range: "" },
      ],
      method: "",
      interpretation: "",
      notes: "",
    });
    setIsReportModalVisible(true);
  };

  const openEditReportModal = (report: MedicalReport) => {
    setEditingReportId(report._id);
    resetReport({
      report_type: report.report_type || "",
      lab_name: report.lab_name || "",
      report_date: report.report_date
        ? new Date(report.report_date).toISOString().slice(0, 10)
        : "",
      parameters:
        report.parameters && report.parameters.length > 0
          ? report.parameters.map((p) => ({
              label: p.label || "",
              value: p.value || "",
              unit: p.unit || "",
              reference_range: p.reference_range || "",
            }))
          : [{ label: "Result", value: "", unit: "", reference_range: "" }],
      method: report.method || "",
      interpretation: report.interpretation || "",
      notes: report.notes || "",
    });
    setIsReportModalVisible(true);
  };

  const saveMedicalReport = async (data: any) => {
    if (!planId || !planDetails?.patient_id) return;
    setIsReportSubmitting(true);
    const payload = {
      report_type: data.report_type,
      lab_name: data.lab_name,
      report_date: data.report_date,
      parameters: (data.parameters || []).map((p: any) => ({
        label: p.label || "Result",
        value: p.value || "N/A",
        unit: p.unit || "",
        reference_range: p.reference_range || "",
      })),
      method: data.method,
      interpretation: data.interpretation,
      notes: data.notes,
    };
    try {
      if (editingReportId) {
        await api.put(`/edit/medical-report/${editingReportId}`, payload);
      } else {
        await api.post(
          `/plan/${planId}/patient/${planDetails.patient_id}/medical-report`,
          payload,
        );
      }
      await fetchMedicalReports();
      setIsReportModalVisible(false);
    } catch (err: any) {
      alert(err.response?.data?.msg || "Failed to save medical report.");
      console.error("Medical Report Submission Error:", err);
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const handleArchiveReport = async (reportId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to archive this report? It will be hidden from the active list.",
      )
    )
      return;
    try {
      await api.patch(`/archive/medical-report/${reportId}`);
      await fetchMedicalReports();
    } catch (err: any) {
      alert(err.response?.data?.msg || "Failed to archive medical report.");
    }
  };

  const renderErrorBanner = () => {
    if (!error) return null;
    return (
      <div className={styles.errorBanner}>
        <div className={styles.errorBannerContent}>
          <FaExclamationCircle className={styles.errorBannerIcon} />
          <span className={styles.errorBannerText}>{error}</span>
        </div>
        <button
          className={styles.errorBannerClose}
          onClick={() => setError(null)}
          aria-label="Dismiss error"
        >
          <FaTimes />
        </button>
      </div>
    );
  };

  const renderNoteModal = () => (
    <div
      className={`${styles.modalOverlay} ${isNoteModalVisible ? styles.modalVisible : ""}`}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FaNotesMedical className={styles.modalIcon} /> Add Note
          </h3>
          <button
            className={styles.modalCloseButton}
            onClick={() => setIsNoteModalVisible(false)}
          >
            ×
          </button>
        </div>
        <form
          onSubmit={handleSubmit(addNoteToTherapyPlan)}
          className={styles.modalForm}
        >
          <Controller
            name="note"
            control={control}
            rules={{ required: "Note is required" }}
            render={({ field }) => (
              <div className={styles.inputGroup}>
                <textarea
                  {...field}
                  className={`${styles.noteInput} ${errors.note ? styles.errorInput : ""}`}
                  placeholder="Enter your note here..."
                  rows={4}
                  maxLength={500}
                />
                <div className={styles.charCount}>
                  {field.value?.length || 0}/500
                </div>
              </div>
            )}
          />
          {errors.note && (
            <span className={styles.errorMessage}>{errors.note.message}</span>
          )}
          <div className={styles.modalButtonContainer}>
            <button
              type="button"
              className={`${styles.modalButton} ${styles.modalCancelButton}`}
              onClick={() => setIsNoteModalVisible(false)}
              disabled={isNoteSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.modalButton} ${styles.modalSubmitButton}`}
              disabled={isNoteSubmitting}
            >
              {isNoteSubmitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading plan details...</p>
      </div>
    );
  if (!planDetails?.therapy_plan)
    return (
      <div className={styles.container}>
        {renderErrorBanner()}
        <div className={styles.errorContainer}>
          <h2>Plan Not Found</h2>
          <button onClick={() => navigate(-1)} className={styles.outlineBtn}>
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );

  const plan = planDetails.therapy_plan;
  const isPlanCompleted = plan.status?.toLowerCase() === "completed";
  const progress = calculateTherapyProgressByDays(
    plan.therapy_start,
    plan.therapy_end,
    plan.status,
    plan.closure_date || closureSummary?.closure_information?.closure_date,
  );

  const medicalInfoCard = (
    <div className={styles.modernCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleGroup}>
          <FaStethoscope className={styles.headerIcon} />
          <span>Medical Information</span>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.infoGridRow}>
          <div className={styles.infoBlock}>
            <label>DIAGNOSIS</label>
            <div className={styles.infoText}>
              {plan.patient_diagnosis || "N/A"}
            </div>
          </div>
          <div className={styles.infoBlock}>
            <label>ICD-11 CODE</label>
            <div className={styles.infoText}>{plan.ICD_11_Codes || "N/A"}</div>
          </div>
        </div>
        <div className={styles.infoBlockFull}>
          <label>SYMPTOMS</label>
          <div className={styles.infoText}>
            {Array.isArray(plan.patient_symptoms)
              ? plan.patient_symptoms.join(", ")
              : plan.patient_symptoms || "N/A"}
          </div>
        </div>
        <div className={styles.infoBlockFull}>
          <label>MARKS OF IDENTIFICATION</label>
          <div className={styles.infoText}>
            {plan.MarksOfIdentification || "N/A"}
          </div>
        </div>
        <div className={styles.infoGridRow}>
          <div className={styles.infoBlock}>
            <label>CREATED BY</label>
            <div className={styles.infoText}>
              {planDetails.created_by_name || "Unknown"}
            </div>
          </div>
          <div className={styles.infoBlock}>
            <label>REVIEWER</label>
            <div className={styles.infoText}>Clinic Lead</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {renderErrorBanner()}

      {downloadingPdf && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}

      <div className={styles.heroPanel}>
        <div className={styles.heroLeft}>
          <div className={styles.patientAvatar}>
            {planDetails.patient_image ? (
              <img
                src={planDetails.patient_image}
                alt="Patient"
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {planDetails.patient_name?.charAt(0).toUpperCase() || "P"}
              </span>
            )}
          </div>
          <div className={styles.patientHeaders}>
            <h2
              className={styles.patientName}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/Patient/${planDetails.patient_id}`)}
              title="View patient profile"
            >
              {planDetails.patient_name}
            </h2>
            <p className={styles.therapySubtitle}>{plan.therapy_name}</p>
            <span className={styles.categoryBadge}>
              {plan.patient_therapy_category}
            </span>
          </div>
        </div>

        <div className={styles.heroCenter}>
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>
              TREATMENT PROGRESS (TIMELINE)
            </span>
            <span className={styles.progressValue}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className={styles.progressDates}>
            <span>
              Start: {new Date(plan.therapy_start).toLocaleDateString("en-GB")}
            </span>
            <span>Duration: {plan.therapy_duration}</span>
            <span>
              End: {new Date(plan.therapy_end).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>

        <div className={styles.heroRight}>
          {isPlanCompleted && (
            <>
              <button
                className={`${styles.actionBtn} ${styles.outlineBtn}`}
                onClick={handleRevertPlan}
                style={{ color: "#ef4444", borderColor: "#fca5a5" }}
              >
                Reopen Plan
              </button>
              <button
                className={`${styles.actionBtn} ${styles.outlineBtn}`}
                onClick={fetchAndPrintPlan}
                disabled={isPrintingPlan}
                title="Print Treatment Plan"
              >
                {isPrintingPlan ? (
                  <FaSpinner className="fa-spin" />
                ) : (
                  <FaPrint />
                )}{" "}
                {isPrintingPlan ? "Printing..." : "Print"}
              </button>
            </>
          )}
          {!isPlanCompleted && (
            <button
              className={`${styles.actionBtn} ${styles.outlineBtn}`}
              onClick={() => navigate(`/editTherapyPlan/${plan._id}`)}
            >
              <FaEdit /> Edit
            </button>
          )}
          <button
            className={`${styles.actionBtn} ${isPlanCompleted ? styles.outlineBtn : styles.primaryBtn}`}
            style={
              !isPlanCompleted
                ? { backgroundColor: "#10b981", borderColor: "#10b981" }
                : { cursor: "not-allowed", opacity: 0.7 }
            }
            // UPDATE THIS LINE:
            onClick={() =>
              !isPlanCompleted && navigate(`/ClosePlan/${plan._id}`)
            }
            disabled={isPlanCompleted}
          >
            <FaCheckCircle /> {isPlanCompleted ? "Completed" : "Complete"}
          </button>
          {!isPlanCompleted && (
            <button
              className={`${styles.actionBtn} ${styles.outlineBtn}`}
              style={{ color: "#ef4444", borderColor: "#fca5a5" }}
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash /> Delete
            </button>
          )}
        </div>
      </div>

      {isPlanCompleted && closureSummary ? (
        <ClosureSummary summaryData={closureSummary}>
          {medicalInfoCard}
        </ClosureSummary>
      ) : (
        <div className={styles.fullWidthRow}>{medicalInfoCard}</div>
      )}

      <div className={styles.threeColGrid}>
        {/* Column 1: Active Prescription */}
        <div className={styles.modernCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTitleGroup}>
              <FaNotesMedical className={styles.headerIcon} />
              <span>Active Rx</span>
            </div>
            <div className={styles.headerActions}>
              {/* Added Print Button Here */}
              {planDetails.prescription?._id && (
                <button
                  className={styles.addSmallBtn}
                  onClick={() =>
                    fetchAndPrintPrescription(
                      planDetails.prescription!._id as string,
                    )
                  }
                  disabled={isPrintingRx}
                  style={{
                    color: "#374151",
                    borderColor: "#d1d5db",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Print Prescription"
                >
                  {isPrintingRx ? (
                    <FaSpinner className="fa-spin" />
                  ) : (
                    <FaPrint />
                  )}
                </button>
              )}

              <button
                className={styles.addSmallBtn}
                onClick={() => setShowPrescriptionModal(true)}
              >
                VIEW
              </button>
              <button
                className={styles.addSmallBtn}
                onClick={() => setShowPrescriptionModal(true)}
                style={{ color: "#007b8e", borderColor: "#007b8e" }}
              >
                + NEW
              </button>
            </div>
          </div>
          <div className={styles.cardBodyList}>
            {planDetails.prescription?.medications &&
            planDetails.prescription.medications.length > 0 ? (
              <table className={styles.medTable}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Freq</th>
                    <th>Days</th>
                    <th>Instr.</th>
                  </tr>
                </thead>
                <tbody>
                  {planDetails.prescription.medications.map((med: any, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{med.drug_name}</strong>
                        {med.strength && (
                          <span className={styles.medStrength}>
                            {med.strength}
                          </span>
                        )}
                      </td>
                      {med.schedules && med.schedules.length > 0 ? (
                        <>
                          <td>
                            {med.schedules.map(
                              (sch: PrescriptionSchedule, sIdx: number) => (
                                <div key={sIdx}>{sch.frequency}</div>
                              ),
                            )}
                          </td>
                          <td>
                            {med.schedules.map(
                              (sch: PrescriptionSchedule, sIdx: number) => (
                                <div key={sIdx}>{sch.duration} Days</div>
                              ),
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{med.frequency}</td>
                          <td>{med.duration}</td>
                        </>
                      )}
                      <td>{med.instructions || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyDashedBox}>
                <span>No active prescriptions.</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Vitals History */}
        <div className={styles.modernCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTitleGroup}>
              <FaHeartbeat className={styles.headerIcon} />
              <span>Vitals History</span>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.addSmallBtn}
                onClick={() => setIsVitalsViewModalVisible(true)}
              >
                VIEW
              </button>
              <button
                className={styles.addSmallBtn}
                onClick={() => {
                  setEditingVitalId(null);
                  resetVitals({
                    pulse: "",
                    temperature: "",
                    bp_systolic: "",
                    bp_diastolic: "",
                    spo2: "",
                    weight: "",
                    respiratory_rate: "",
                    blood_glucose: "",
                    pain_score: "",
                    notes: "",
                  });
                  setIsVitalsModalVisible(true);
                }}
              >
                + ADD
              </button>
            </div>
          </div>

          <div className={styles.cardBodyList}>
            {vitalsList && vitalsList.length > 0 ? (
              vitalsList.map((vital, index) => (
                <div key={index} className={styles.prescriptionBox}>
                  <div className={styles.medHeaderRow}>
                    <span className={styles.medTitle}>
                      {new Date(vital.recorded_at).toLocaleDateString()} at{" "}
                      {new Date(vital.recorded_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div>
                      <span
                        className={styles.medQty}
                        style={{ marginRight: "8px" }}
                      >
                        {vital.recorded_by_name || "Staff"}
                      </span>
                      <button
                        onClick={() => openEditVitalsModal(vital)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                  <div
                    className={styles.medTagsRow}
                    style={{ marginTop: "8px" }}
                  >
                    {vital.bp_systolic && vital.bp_diastolic && (
                      <span className={styles.medTag}>
                        BP: {vital.bp_systolic}/{vital.bp_diastolic}
                      </span>
                    )}
                    {vital.pulse && (
                      <span className={styles.medTag}>
                        HR: {vital.pulse} bpm
                      </span>
                    )}
                    {vital.temperature && (
                      <span className={styles.medTag}>
                        Temp: {vital.temperature}
                      </span>
                    )}
                    {vital.spo2 && (
                      <span className={styles.medTag}>SpO2: {vital.spo2}%</span>
                    )}
                    {vital.weight && (
                      <span className={styles.medTag}>Wt: {vital.weight}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyDashedBox}>
                <FaHeartbeat className={styles.emptyIcon} />
                <span>No vitals recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Medical Reports */}
        <div className={styles.modernCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTitleGroup}>
              <FaNotesMedical className={styles.headerIcon} />
              <span>Medical Reports</span>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.addSmallBtn}
                onClick={() => setIsReportsViewModalVisible(true)}
              >
                VIEW
              </button>
              <button
                className={styles.addSmallBtn}
                onClick={openAddReportModal}
              >
                + ADD
              </button>
            </div>
          </div>

          <div className={styles.cardBodyList}>
            {medicalReports &&
            medicalReports.filter((r) => r.status !== "Archived").length > 0 ? (
              medicalReports
                .filter((r) => r.status !== "Archived")
                .map((report, index) => (
                  <div key={index} className={styles.prescriptionBox}>
                    <div className={styles.medHeaderRow}>
                      <span className={styles.medTitle}>
                        {report.report_type}
                      </span>
                      <div>
                        <span
                          className={styles.medQty}
                          style={{ marginRight: "8px" }}
                        >
                          {new Date(report.report_date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => openEditReportModal(report)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary)",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            marginRight: "6px",
                          }}
                          title="Edit Report"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleArchiveReport(report._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                          title="Archive Report"
                        >
                          <FaArchive />
                        </button>
                      </div>
                    </div>
                    <div
                      className={styles.medGeneric}
                      style={{ marginTop: "4px", marginBottom: "4px" }}
                    >
                      Lab: {report.lab_name || "Unknown"}
                    </div>
                    <div className={styles.medTagsRow}>
                      <span className={styles.medTag}>
                        {report.report_number}
                      </span>
                      <span
                        className={styles.medTag}
                        style={{ color: "#10b981" }}
                      >
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className={styles.emptyDashedBox}>
                <FaNotesMedical className={styles.emptyIcon} />
                <span>No active medical reports.</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Clinical Notes */}
        <div className={styles.modernCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTitleGroup}>
              <FaNotesMedical className={styles.headerIcon} />
              <span>Clinical Notes</span>
            </div>
            <button
              className={styles.addSmallBtn}
              onClick={() => setIsNoteModalVisible(true)}
            >
              + ADD NOTE
            </button>
          </div>
          <div className={styles.cardBodyList}>
            {plan.notes && plan.notes.length > 0 ? (
              plan.notes.map((note, index) => (
                <div key={index} className={styles.clinicalNoteBox}>
                  <div className={styles.noteTopRow}>
                    <span className={styles.noteDoc}>{note.doctor_name}</span>
                    <span className={styles.noteDate}>
                      {new Date(note.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.noteContent}>{note.note}</p>
                </div>
              ))
            ) : (
              <div className={styles.emptyDashedBox}>
                <span>No clinical notes recorded.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {renderNoteModal()}

      {/* Vitals Add/Edit Modal */}
      <div
        className={`${styles.modalOverlay} ${isVitalsModalVisible ? styles.modalVisible : ""}`}
      >
        <div className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>
              <FaHeartbeat className={styles.modalIcon} />{" "}
              {editingVitalId ? "Edit Vitals" : "Record Vitals"}
            </h3>
            <button
              className={styles.modalCloseButton}
              onClick={() => setIsVitalsModalVisible(false)}
            >
              ×
            </button>
          </div>
          <form
            onSubmit={handleVitalsSubmit(saveVitalsToPlan)}
            className={styles.modalForm}
          >
            <div className={styles.infoGridRow}>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  BP (Sys/Dia)
                </label>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Controller
                    name="bp_systolic"
                    control={vitalsControl}
                    render={({ field }) => (
                      <input
                        {...field}
                        className={styles.noteInput}
                        style={{ minHeight: "40px" }}
                        placeholder="120"
                      />
                    )}
                  />
                  <span style={{ alignSelf: "center" }}>/</span>
                  <Controller
                    name="bp_diastolic"
                    control={vitalsControl}
                    render={({ field }) => (
                      <input
                        {...field}
                        className={styles.noteInput}
                        style={{ minHeight: "40px" }}
                        placeholder="80"
                      />
                    )}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Pulse (bpm)
                </label>
                <Controller
                  name="pulse"
                  control={vitalsControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="72"
                    />
                  )}
                />
              </div>
            </div>
            <div className={styles.infoGridRow}>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Temperature (°F/°C)
                </label>
                <Controller
                  name="temperature"
                  control={vitalsControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="98.6°F"
                    />
                  )}
                />
              </div>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  SpO2 (%)
                </label>
                <Controller
                  name="spo2"
                  control={vitalsControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="98"
                    />
                  )}
                />
              </div>
            </div>
            <div className={styles.infoGridRow}>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Resp. Rate (breaths/min)
                </label>
                <Controller
                  name="respiratory_rate"
                  control={vitalsControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="16"
                    />
                  )}
                />
              </div>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Weight
                </label>
                <Controller
                  name="weight"
                  control={vitalsControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="70 kg"
                    />
                  )}
                />
              </div>
            </div>
            <div className={styles.infoGridRow}>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Blood Glucose
                </label>
                <Controller
                  name="blood_glucose"
                  control={vitalsControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="100 mg/dL"
                    />
                  )}
                />
              </div>
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Pain Score (0-10)
                </label>
                <Controller
                  name="pain_score"
                  control={vitalsControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="0"
                      max="10"
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="0"
                    />
                  )}
                />
              </div>
            </div>
            <div className={styles.inputGroup} style={{ marginTop: "4px" }}>
              <label style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Vitals Notes
              </label>
              <Controller
                name="notes"
                control={vitalsControl}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className={styles.noteInput}
                    style={{ minHeight: "60px" }}
                    placeholder="Any additional observations..."
                  />
                )}
              />
            </div>
            <div
              className={styles.modalButtonContainer}
              style={{ marginTop: "1rem" }}
            >
              <button
                type="button"
                className={`${styles.modalButton} ${styles.modalCancelButton}`}
                onClick={() => setIsVitalsModalVisible(false)}
                disabled={isVitalsSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles.modalButton} ${styles.modalSubmitButton}`}
                disabled={isVitalsSubmitting}
              >
                {isVitalsSubmitting ? "Saving..." : "Save Vitals"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Vitals View Modal */}
      <div
        className={`${styles.modalOverlay} ${isVitalsViewModalVisible ? styles.modalVisible : ""}`}
      >
        <div
          className={styles.modalContainer}
          style={{ maxWidth: "780px", width: "95%", padding: "0" }}
        >
          <div
            className={styles.modalHeader}
            style={{ padding: "1.25rem 1.5rem 0.75rem", marginBottom: 0 }}
          >
            <h3 className={styles.modalTitle}>
              <FaHeartbeat className={styles.modalIcon} /> Vitals History
              {vitalsList.length > 0 && (
                <span
                  className={styles.itemCountBadge}
                  style={{ marginLeft: "8px", fontSize: "0.7rem" }}
                >
                  {vitalsList.length} reading
                  {vitalsList.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>
            <button
              className={styles.modalCloseButton}
              onClick={() => setIsVitalsViewModalVisible(false)}
            >
              ×
            </button>
          </div>

          <div
            style={{
              maxHeight: "65vh",
              overflowY: "auto",
              padding: "0.75rem 1.5rem",
            }}
          >
            {vitalsList && vitalsList.length > 0 ? (
              <table className={styles.medTable}>
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>BP</th>
                    <th>HR</th>
                    <th>Temp</th>
                    <th>SpO2</th>
                    <th>Weight</th>
                    <th>RR</th>
                    <th>Glucose</th>
                    <th>Pain</th>
                    <th>By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {vitalsList.map((vital, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                          {new Date(vital.recorded_at).toLocaleDateString()}
                        </div>
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.65rem",
                          }}
                        >
                          {new Date(vital.recorded_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td>
                        {vital.bp_systolic && vital.bp_diastolic
                          ? `${vital.bp_systolic}/${vital.bp_diastolic}`
                          : "—"}
                      </td>
                      <td>{vital.pulse || "—"}</td>
                      <td>{vital.temperature || "—"}</td>
                      <td>{vital.spo2 ? `${vital.spo2}%` : "—"}</td>
                      <td>{vital.weight || "—"}</td>
                      <td>{vital.respiratory_rate || "—"}</td>
                      <td>{vital.blood_glucose || "—"}</td>
                      <td>{vital.pain_score ?? "—"}</td>
                      <td
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {vital.recorded_by_name || "Staff"}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setIsVitalsViewModalVisible(false);
                            openEditVitalsModal(vital);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary)",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            padding: "4px",
                          }}
                          title="Edit reading"
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                className={styles.emptyDashedBox}
                style={{ margin: "1rem 0" }}
              >
                <FaHeartbeat className={styles.emptyIcon} />
                <span>No vitals recorded yet.</span>
              </div>
            )}
          </div>

          <div
            className={styles.modalButtonContainer}
            style={{ padding: "0.75rem 1.5rem 1.25rem" }}
          >
            <button
              className={`${styles.modalButton} ${styles.modalCancelButton}`}
              onClick={() => setIsVitalsViewModalVisible(false)}
            >
              Close
            </button>
            <button
              className={`${styles.modalButton} ${styles.modalSubmitButton}`}
              onClick={() => {
                setIsVitalsViewModalVisible(false);
                setEditingVitalId(null);
                resetVitals({
                  pulse: "",
                  temperature: "",
                  bp_systolic: "",
                  bp_diastolic: "",
                  spo2: "",
                  weight: "",
                  respiratory_rate: "",
                  blood_glucose: "",
                  pain_score: "",
                  notes: "",
                });
                setIsVitalsModalVisible(true);
              }}
            >
              + Record Vitals
            </button>
          </div>
        </div>
      </div>

      {/* Medical Reports View Modal */}
      <div
        className={`${styles.modalOverlay} ${isReportsViewModalVisible ? styles.modalVisible : ""}`}
      >
        <div
          className={styles.modalContainer}
          style={{ maxWidth: "680px", width: "95%", padding: "0" }}
        >
          <div
            className={styles.modalHeader}
            style={{ padding: "1.25rem 1.5rem 0.75rem", marginBottom: 0 }}
          >
            <h3 className={styles.modalTitle}>
              <FaNotesMedical className={styles.modalIcon} /> All Medical
              Reports
              {medicalReports.length > 0 && (
                <span
                  className={styles.itemCountBadge}
                  style={{ marginLeft: "8px", fontSize: "0.7rem" }}
                >
                  {medicalReports.length} report
                  {medicalReports.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>
            <button
              className={styles.modalCloseButton}
              onClick={() => setIsReportsViewModalVisible(false)}
            >
              ×
            </button>
          </div>

          <div
            style={{
              maxHeight: "65vh",
              overflowY: "auto",
              padding: "0.75rem 1.5rem",
            }}
          >
            {medicalReports && medicalReports.length > 0 ? (
              medicalReports.map((report, idx) => (
                <div
                  key={idx}
                  className={styles.prescriptionBox}
                  style={{
                    marginBottom: "1rem",
                    opacity: report.status === "Archived" ? 0.65 : 1,
                  }}
                >
                  <div className={styles.medHeaderRow}>
                    <span className={styles.medTitle}>
                      {report.report_type}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span className={styles.medQty}>
                        {new Date(report.report_date).toLocaleDateString()}
                      </span>
                      <span
                        className={styles.medTag}
                        style={{
                          color:
                            report.status === "Archived"
                              ? "#ef4444"
                              : "#10b981",
                          borderColor:
                            report.status === "Archived"
                              ? "#fca5a5"
                              : "#a7f3d0",
                        }}
                      >
                        {report.status}
                      </span>
                      <button
                        onClick={() => {
                          setIsReportsViewModalVisible(false);
                          openEditReportModal(report);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          padding: "2px 4px",
                        }}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      {report.status !== "Archived" && (
                        <button
                          onClick={() => handleArchiveReport(report._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            padding: "2px 4px",
                          }}
                          title="Archive"
                        >
                          <FaArchive />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.medGeneric}>
                    Lab: {report.lab_name || "Unknown"}&nbsp;&nbsp;·&nbsp;&nbsp;
                    {report.report_number}
                  </div>

                  {report.parameters && report.parameters.length > 0 && (
                    <table
                      className={styles.medTable}
                      style={{ marginTop: "10px", marginBottom: "4px" }}
                    >
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Value</th>
                          <th>Unit</th>
                          <th>Reference Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.parameters.map((param, pIdx) => (
                          <tr key={pIdx}>
                            <td>{param.label}</td>
                            <td
                              style={{
                                fontWeight: 600,
                                color: "var(--text-main)",
                              }}
                            >
                              {param.value}
                            </td>
                            <td>{param.unit || "—"}</td>
                            <td>{param.reference_range || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {report.interpretation && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "8px",
                        padding: "6px 8px",
                        background: "#f8fafc",
                        borderRadius: "4px",
                        borderLeft: "2px solid var(--primary)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "var(--primary)",
                          marginRight: "6px",
                        }}
                      >
                        Interpretation:
                      </span>
                      {report.interpretation}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                className={styles.emptyDashedBox}
                style={{ margin: "1rem 0" }}
              >
                <FaNotesMedical className={styles.emptyIcon} />
                <span>No medical reports found.</span>
              </div>
            )}
          </div>

          <div
            className={styles.modalButtonContainer}
            style={{ padding: "0.75rem 1.5rem 1.25rem" }}
          >
            <button
              className={`${styles.modalButton} ${styles.modalCancelButton}`}
              onClick={() => setIsReportsViewModalVisible(false)}
            >
              Close
            </button>
            <button
              className={`${styles.modalButton} ${styles.modalSubmitButton}`}
              onClick={() => {
                setIsReportsViewModalVisible(false);
                openAddReportModal();
              }}
            >
              + Add Report
            </button>
          </div>
        </div>
      </div>

      {/* Medical Report Add/Edit Modal */}
      <div
        className={`${styles.modalOverlay} ${isReportModalVisible ? styles.modalVisible : ""}`}
      >
        <div
          className={styles.modalContainer}
          style={{ maxWidth: "560px", width: "95%", padding: "0" }}
        >
          <div
            className={styles.modalHeader}
            style={{ padding: "1.25rem 1.5rem 0.75rem", marginBottom: 0 }}
          >
            <h3 className={styles.modalTitle}>
              <FaNotesMedical className={styles.modalIcon} />{" "}
              {editingReportId ? "Edit Medical Report" : "Add Medical Report"}
            </h3>
            <button
              className={styles.modalCloseButton}
              onClick={() => setIsReportModalVisible(false)}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleReportSubmit(saveMedicalReport)}>
            {/* Scrollable fields area */}
            <div
              style={{
                maxHeight: "62vh",
                overflowY: "auto",
                padding: "0.75rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
              }}
            >
              {/* Report Type + Date */}
              <div className={styles.infoGridRow}>
                <div className={styles.inputGroup}>
                  <label
                    style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                  >
                    Report Type *
                  </label>
                  <Controller
                    name="report_type"
                    control={reportControl}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <input
                        {...field}
                        className={styles.noteInput}
                        style={{ minHeight: "40px" }}
                        placeholder="e.g. Blood Test, MRI"
                        required
                      />
                    )}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label
                    style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                  >
                    Date
                  </label>
                  <Controller
                    name="report_date"
                    control={reportControl}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className={styles.noteInput}
                        style={{ minHeight: "40px" }}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Lab Name */}
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Lab / Facility Name
                </label>
                <Controller
                  name="lab_name"
                  control={reportControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "40px" }}
                      placeholder="Apollo Diagnostics"
                    />
                  )}
                />
              </div>

              {/* Dynamic Parameters */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Parameters
                  </label>
                  <button
                    type="button"
                    className={styles.addSmallBtn}
                    style={{
                      color: "var(--primary)",
                      borderColor: "var(--primary)",
                    }}
                    onClick={() =>
                      appendParameter({
                        label: "",
                        value: "",
                        unit: "",
                        reference_range: "",
                      })
                    }
                  >
                    + Add Parameter
                  </button>
                </div>

                {parameterFields.map((field, index) => (
                  <div
                    key={field.id}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      marginBottom: "8px",
                    }}
                  >
                    {/* Row header: index + remove */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                          background: "#e0f2f5",
                          padding: "2px 7px",
                          borderRadius: "4px",
                        }}
                      >
                        #{index + 1}
                      </span>
                      {parameterFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParameter(index)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <FaTimes /> Remove
                        </button>
                      )}
                    </div>

                    {/* Label + Value */}
                    <div className={styles.infoGridRow}>
                      <div className={styles.inputGroup}>
                        <label
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Label *
                        </label>
                        <Controller
                          name={`parameters.${index}.label`}
                          control={reportControl}
                          render={({ field }) => (
                            <input
                              {...field}
                              className={styles.noteInput}
                              style={{ minHeight: "36px" }}
                              placeholder="e.g. Haemoglobin"
                            />
                          )}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Value *
                        </label>
                        <Controller
                          name={`parameters.${index}.value`}
                          control={reportControl}
                          render={({ field }) => (
                            <input
                              {...field}
                              className={styles.noteInput}
                              style={{ minHeight: "36px" }}
                              placeholder="12.2"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Unit + Reference Range */}
                    <div
                      className={styles.infoGridRow}
                      style={{ marginTop: "6px" }}
                    >
                      <div className={styles.inputGroup}>
                        <label
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Unit
                        </label>
                        <Controller
                          name={`parameters.${index}.unit`}
                          control={reportControl}
                          render={({ field }) => (
                            <input
                              {...field}
                              className={styles.noteInput}
                              style={{ minHeight: "36px" }}
                              placeholder="g/dl"
                            />
                          )}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Reference Range
                        </label>
                        <Controller
                          name={`parameters.${index}.reference_range`}
                          control={reportControl}
                          render={({ field }) => (
                            <input
                              {...field}
                              className={styles.noteInput}
                              style={{ minHeight: "36px" }}
                              placeholder="11.5 - 17.5"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              <div className={styles.inputGroup}>
                <label
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  Interpretation / Findings
                </label>
                <Controller
                  name="interpretation"
                  control={reportControl}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className={styles.noteInput}
                      style={{ minHeight: "60px" }}
                      placeholder="Key findings from the report..."
                    />
                  )}
                />
              </div>
            </div>

            {/* Sticky footer buttons */}
            <div
              className={styles.modalButtonContainer}
              style={{
                padding: "0.75rem 1.5rem 1.25rem",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <button
                type="button"
                className={`${styles.modalButton} ${styles.modalCancelButton}`}
                onClick={() => setIsReportModalVisible(false)}
                disabled={isReportSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles.modalButton} ${styles.modalSubmitButton}`}
                disabled={isReportSubmitting}
              >
                {isReportSubmitting ? "Saving..." : "Save Report"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className={`${styles.modalOverlay} ${styles.modalVisible}`}>
          <div
            className={styles.modalContainer}
            style={{ maxWidth: "800px", width: "95%", padding: "0" }}
          >
            <div
              className={styles.modalHeader}
              style={{
                padding: "1.5rem 1.5rem 0.5rem 1.5rem",
                marginBottom: 0,
              }}
            >
              <h3 className={styles.modalTitle}>
                <FaStethoscope className={styles.modalIcon} /> Prescription
                Management
              </h3>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowPrescriptionModal(false)}
              >
                ×
              </button>
            </div>
            <div
              style={{ maxHeight: "80vh", overflowY: "auto", padding: "1rem" }}
            >
              <PrescriptionManager
                planId={plan._id}
                patientId={planDetails.patient_id}
                prescriptions={
                  plan.prescriptions ||
                  (planDetails.prescription ? [planDetails.prescription] : [])
                }
                onRefresh={fetchPlanDetails}
                postCarePrescriptionId={
                  (plan as any).post_care_prescription_id || null
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Modal */}
      <DeleteTherapyPlanModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePlan}
        planName={plan.therapy_name || "this therapy plan"}
      />

      {/* Hidden Plan Print Target */}
      <div style={{ display: "none" }}>
        <PlanTemplate ref={printPlanRef} data={planPrintData} />
      </div>

      {/* Hidden Prescription Print Target */}
      <div style={{ display: "none" }}>
        <PrescriptionPrintTemplate ref={printRxRef} data={rxPrintData} />
      </div>
    </div>
  );
};

export default PlanDetails;
