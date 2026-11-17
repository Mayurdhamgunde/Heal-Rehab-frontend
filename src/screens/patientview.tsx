import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaNotesMedical,
  FaUserEdit,
  FaPlus,
  FaDownload,
  FaTrash,
  FaArchive,
  FaStethoscope,
  FaMoneyBillWave,
  FaFileMedical,
  FaPrint,
  FaSpinner,
  FaUpload,
  FaEllipsisV,
  FaUserMd,
  FaTimes,
  FaEnvelope,
  FaPhoneAlt,
  FaCalendarAlt,
  FaFingerprint,
  FaShieldAlt,
  FaEdit,
  FaClipboardList,
} from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import styles from "../css/PatientView.module.css";
import api from "../utils/central";
import AssessmentPrintTemplate from "./Rehab/AssessmentPrintTemplate";
import SingleAssessmentPrintTemplate from "./Rehab/SingleAssessmentPrintTemplate";
import PatientDocumentUploader from "./PatientDocumentUploader";
import DocumentDeleteDialog from "./DocumentDelete";
import ArchiveModal from "../components/Archive";
import RelapseLinkControl from "./Rehab/RelapsedlinkControle";
import RelapseRiskCard, {
  type RelapseRiskAssessment,
} from "./Rehab/Relapseriskcard";
import PlanTemplate from "./Rehab/PlanPrintTemplate";
import RehabProgressChart from "./Rehab/progressChart";
import AftercareReportPrinter, {
  type AftercareReportPrinterRef,
} from "../screens/Rehab/AftercareReportPrinter";
import ConsentPrintTemplate from "./Rehab/ConsentForm";
import AftercareSessionBooking from "./AftercareSessionBooking";
import { uploadPatientDocumentDirect } from "./DocumentUploaderclient";

// --- START OF INTERFACES ---
interface CareTeamMember {
  department_id: string;
  department_name: string;
  doctor_id: string;
  doctor_name: string;
  role: "Head Counselor" | "Specialist";
  doctor_photo?: string | null;
}

interface JourneyStage {
  _id: string;
  stage: string;
  performed_by_id: string;
  performed_by_name: string;
  performed_at: string;
  status: string;
  notes?: string;
  performed_by_photo?: string | null;
}

interface PatientAssessment {
  _id: string;
  assessment_name: string;
  date_taken: string;
  status: string;
  doctor_id: {
    doctor_first_name: string;
    doctor_last_name: string;
  };
}

interface MedicalHistory {
  condition?: string;
  diagnosed_date?: string;
  [key: string]: any;
}

interface Allergy {
  name?: string;
  severity?: string;
  [key: string]: any;
}

interface Medication {
  name?: string;
  dosage?: string;
  [key: string]: any;
}

interface TherapySession {
  _id: string;
  status: string;
  date: string;
  session_number: number;
}

interface RehabIndicators {
  craving_intensity?: string | null;
  behavioural_compliance?: string | null;
  emotional_stability?: string | null;
  sleep_quality?: string | null;
  session_impression?: string | null;
}

interface ClinicalObservations {
  withdrawal_symptoms?: string[];
  appetite?: string | null;
  physical_appearance?: string | null;
}

interface Session {
  _id: string;
  session_number: number;
  therepy_type: string;
  therepy_date: string;
  therepy_start_time?: string;
  doctor_id: string;
  doctor_name: string;
  issue_dealt_with: string;
  counselor_impression?: string;
  location_name?: string;
  location_id?: string;
  status: string;
  total_recovery_score?: number;
  patient_id?: string;
  patient_name?: string;
  rehab_indicators?: RehabIndicators | null;
  clinical_observations?: ClinicalObservations | null;
  aftercare_team?: {
    physician_id?: string;
    physician_name?: string;
    counsellor_id?: string;
    counsellor_name?: string;
  };
}

interface TherapyPlan {
  _id: string;
  therapy_name?: string;
  patient_diagnosis?: string;
  patient_symptoms?: string;
  therapy_duration?: string;
  therapy_start?: string;
  therapy_end?: string;
  patient_therapy_category?: string;
  estimated_sessions?: number;
  completed_sessions?: number;
  created_by?: string;
  status?: string;
  goal_achievement?: number;
  remaining_sessions?: number;
  therapy_sessions?: TherapySession[];
  notes?: any[];
  closure_date?: string;
  closure_reason?: string;
  createdAt?: string;
  updatedAt?: string;
  days_remaining?: number;
  progress_percentage?: number;
  payment_percentage?: number;
  id?: string;
}

interface PatientDocument {
  _id: string;
  document_name: string;
  document_url: string;
  document_upload_date: string;
  document_type: string;
  uploaded_by: string;
  file_size: number;
  file_extension: string;
}

interface ConsentFormRecord {
  _id: string;
  form_type: string;
  consent_date: string;
  is_agreed: boolean;
  [key: string]: any;
}

interface ConsentHistoryEntry {
  _id?: string;
  document_url: string;
  uploaded_at: string;
  uploaded_by_id: string;
  uploaded_by_name: string;
  notes: string;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Patient {
  _id: string;
  UHID?: string;
  patient_image?: string;
  patient_first_name?: string;
  patient_middle_name?: string;
  patient_last_name?: string;
  patient_email?: string;
  patient_phone?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  guardian_relation_2?: string;
  guardian_phone_2?: string;
  gender?: string;
  date_of_birth?: string;
  patient_registration_date?: string;
  follow_Up_Date?: string;
  doctor_id?: string;
  patient_age?: string | number;
  patient_bloodGroup?: string;
  address?: Address;
  location_name?: string;
  education?: string;
  caste?: string;
  occupation?: string;
  marital_status?: string;
  annual_income?: string;
  prior_treatment?: string;
  witness_name?: string;
  witness_relationship?: string;
  witness_photo_url?: string;
  identity_card?: { type: string; number: string };
  previous_patient_id?: string | null;
  doctor_name?: string;
  referral_source?: string;
  referral_details?: string;
  care_team?: CareTeamMember[];
  therapy_plans?: TherapyPlan[];
  therepys?: string[];
  medical_history?: MedicalHistory[];
  allergies?: Allergy[];
  medications?: Medication[];
  notes?: any[];
  appointments?: any[];
  status?: string;
  consultations?: any[];
  archived_by?: string;
  archived_reason?: string;
  archived_at?: string;
  relapse_risk_assessment?: RelapseRiskAssessment | null;
  documents?: PatientDocument[];
  consent_forms?: ConsentFormRecord[];
  consent_history?: ConsentHistoryEntry[];
  patient_journey?: JourneyStage[];
  __v?: number;
}

interface MedicalRecord {
  _id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.error}>
          An error occurred while rendering the patient profile. Please try
          again or contact support.
        </div>
      );
    }
    return this.props.children;
  }
}

const PatientView: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // REHAB SESSIONS STATE
  const [rehabSessions, setRehabSessions] = useState<Session[]>([]);
  const [rehabCurrentPage, setRehabCurrentPage] = useState<number>(1);
  const [rehabTotalPages, setRehabTotalPages] = useState<number>(1);
  const [rehabTotalCount, setRehabTotalCount] = useState<number>(0);
  const [rehabSessionsLoading, setRehabSessionsLoading] =
    useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleSession, setSelectedRoleSession] =
    useState<Session | null>(null);

  // Control Follow-up Modal visibility
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentDoctorId =
    currentUser.doctor_id || currentUser._id || currentUser.id;

  const isSessionTerminated = (status?: string) => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === "completed" || s === "cancelled" || s === "no show";
  };

  const [sessionFilter, setSessionFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const sessionsPerPage = 4;

  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [sessionRefreshCounter, setSessionRefreshCounter] = useState<number>(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  const sessionMenuRef = useRef<HTMLDivElement>(null);

  const [activePlanMenuId, setActivePlanMenuId] = useState<string | null>(null);

  const consentFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingConsent, setIsUploadingConsent] = useState<boolean>(false);

  const printConsentRef = useRef<HTMLDivElement>(null);
  const [consentPrintData, setConsentPrintData] = useState<any>(null);
  const [isPrintingConsent, setIsPrintingConsent] = useState<boolean>(false);

  const handleConsentPrint = useReactToPrint({
    contentRef: printConsentRef,
    documentTitle: "Consent_Form",
    onAfterPrint: () => setConsentPrintData(null),
  });

  const fetchAndPrintConsentForm = async () => {
    setIsPrintingConsent(true);
    try {
      const response = await api.get(`/print/consent/${patientId}`);
      setConsentPrintData(response.data);
      setTimeout(() => {
        handleConsentPrint();
        setIsPrintingConsent(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching consent print data:", err);
      alert("Failed to load consent form for printing.");
      setIsPrintingConsent(false);
    }
  };

  const [showCareTeamModal, setShowCareTeamModal] = useState(false);
  const [draftCareTeam, setDraftCareTeam] = useState<CareTeamMember[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSavingCareTeam, setIsSavingCareTeam] = useState(false);

  const [selectedRole, setSelectedRole] = useState<
    "Head Counselor" | "Specialist"
  >("Specialist");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const aftercarePrinterRef = useRef<AftercareReportPrinterRef>(null);
  const [isPrintingAftercare, setIsPrintingAftercare] = useState(false);
  const [hasAftercareSessions, setHasAftercareSessions] = useState(false);
  const [showAftercareModal, setShowAftercareModal] = useState(false);
  const [, setUploadProgress] = useState<number>(0);
  const INDEX_ITEMS_LIST = [
    "Content",
    "Clinical Assessment",
    "Investigation Report",
    "Treatment Plan/Medical Prescription",
    "Drug Use History",
    "Councellor Sessions",
    "Investigation Reports",
    "Summary",
    "Exams",
  ];

  const [indexPageData, setIndexPageData] = useState<
    Array<{ name: string; from: string; to: string }>
  >([]);
  const [indexFooterData, setIndexFooterData] = useState<{
    from: string;
    to: string;
  }>({ from: "", to: "" });
  const [showIndexEditModal, setShowIndexEditModal] = useState(false);

  useEffect(() => {
    if (showCareTeamModal) {
      setDraftCareTeam(patient?.care_team || []);

      api
        .get("/departments")
        .then((res) => setDepartments(res.data.departments || []))
        .catch((err) => console.error("Failed to load departments", err));
    }
  }, [showCareTeamModal, patient]);

  useEffect(() => {
    setSelectedDoctorId("");

    if (selectedDeptId) {
      setIsLoadingDoctors(true);
      api
        .get(`/department/${selectedDeptId}`)
        .then((res) => {
          setDoctors(res.data.members || []);
        })
        .catch((err) => {
          console.error("Failed to load doctors for department", err);
          setDoctors([]);
        })
        .finally(() => {
          setIsLoadingDoctors(false);
        });
    } else {
      setDoctors([]);
    }
  }, [selectedDeptId]);

  const printIndexRef = useRef<HTMLDivElement>(null);
  const [indexPrintData, setIndexPrintData] = useState<any>(null);
  const [isPrintingIndex, setIsPrintingIndex] = useState<boolean>(false);

  const handleIndexPrint = useReactToPrint({
    contentRef: printIndexRef,
    documentTitle: "Index_Page",
    onAfterPrint: () => setIndexPrintData(null),
  });

  const fetchAndPrintIndex = async (lang: string) => {
    setIsMenuOpen(false);
    setIsPrintingIndex(true);
    try {
      const response = await api.get(
        `/print/patient/${patientId}?lang=${lang}`,
      );
      const filteredData = {
        ...response.data,
        assessments: [],
        sessions: [],
        therapy_plans: [],
        printType: "index",
      };
      setIndexPrintData(filteredData);

      setIndexPageData(
        INDEX_ITEMS_LIST.map((item) => ({ name: item, from: "", to: "" })),
      );
      setIndexFooterData({ from: "", to: "" });

      setShowIndexEditModal(true);
      setIsPrintingIndex(false);
    } catch (err) {
      console.error("Error fetching index print data:", err);
      alert("Failed to load index for printing.");
      setIsPrintingIndex(false);
    }
  };

  const handleFinalizeIndexPrint = () => {
    setIndexPrintData((prev: any) => ({
      ...prev,
      indexPageData: indexPageData,
      indexFooterData: indexFooterData,
    }));
    setShowIndexEditModal(false);

    setTimeout(() => {
      handleIndexPrint();
    }, 500);
  };

  const printPlanRef = useRef<HTMLDivElement>(null);
  const [planPrintData, setPlanPrintData] = useState<any>(null);
  const [isPrintingPlanId, setIsPrintingPlanId] = useState<string | null>(null);

  const handlePlanPrint = useReactToPrint({
    contentRef: printPlanRef,
    documentTitle: "Therapy_Plan_Report",
    onAfterPrint: () => setPlanPrintData(null),
  });

  const fetchAndPrintPlan = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    setActivePlanMenuId(null);
    setIsPrintingPlanId(planId);
    try {
      const response = await api.get(`/plan/summery/print/${planId}`);
      setPlanPrintData(response.data);

      setTimeout(() => {
        handlePlanPrint();
        setIsPrintingPlanId(null);
      }, 500);
    } catch (err) {
      console.error("Error fetching plan print data:", err);
      setIsPrintingPlanId(null);
    }
  };

  const printSinglePlanInfoRef = useRef<HTMLDivElement>(null);
  const [singlePlanPrintData, setSinglePlanPrintData] = useState<any>(null);
  const [isPrintingSinglePlanId, setIsPrintingSinglePlanId] = useState<
    string | null
  >(null);

  const handleSinglePlanInfoPrint = useReactToPrint({
    contentRef: printSinglePlanInfoRef,
    documentTitle: "Therapy_Plan_Details",
    onAfterPrint: () => setSinglePlanPrintData(null),
  });

  const fetchAndPrintSinglePlanInfo = async (planId: string, lang: string) => {
    setActivePlanMenuId(null);
    setIsPrintingSinglePlanId(planId);
    try {
      const response = await api.get(
        `/print/patient/${patientId}?lang=${lang}`,
      );
      const fullData = response.data;
      const filteredData = {
        ...fullData,
        assessments: [],
        sessions: [],
        therapy_plans: (fullData.therapy_plans || []).filter(
          (p: any) => p.plan_id === planId || p._id === planId,
        ),
        printType: "plan",
      };
      setSinglePlanPrintData(filteredData);
      setTimeout(() => {
        handleSinglePlanInfoPrint();
        setIsPrintingSinglePlanId(null);
      }, 500);
    } catch (err) {
      console.error("Error fetching single plan print data:", err);
      alert("Failed to load plan for printing.");
      setIsPrintingSinglePlanId(null);
    }
  };

  const printAllSessionsRef = useRef<HTMLDivElement>(null);
  const [allSessionsPrintData, setAllSessionsPrintData] = useState<any>(null);
  const [isPrintingAllSessions, setIsPrintingAllSessions] =
    useState<boolean>(false);

  const handleAllSessionsPrint = useReactToPrint({
    contentRef: printAllSessionsRef,
    documentTitle: "Therapy_Sessions",
    onAfterPrint: () => setAllSessionsPrintData(null),
  });

  const fetchAndPrintAllSessions = async (lang: string) => {
    setIsSessionMenuOpen(false);
    setIsPrintingAllSessions(true);
    try {
      const response = await api.get(
        `/print/patient/${patientId}?lang=${lang}`,
      );
      const fullData = response.data;
      const filteredData = {
        ...fullData,
        assessments: [],
        therapy_plans: [],
        printType: "sessions",
      };
      setAllSessionsPrintData(filteredData);
      setTimeout(() => {
        handleAllSessionsPrint();
        setIsPrintingAllSessions(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching all sessions print data:", err);
      alert("Failed to load sessions for printing.");
      setIsPrintingAllSessions(false);
    }
  };

  type PendingPrintTarget =
    | { type: "assessments" }
    | { type: "allSessions" }
    | { type: "singlePlan"; planId: string }
    | { type: "singleAssessment"; assessmentId: string }
    | { type: "index" }
    | null;

  const PRINT_LANGUAGES: { code: string; label: string }[] = [
    { code: "en", label: "English" },
    { code: "mr", label: "Marathi" },
  ];

  const [showPrintLanguageModal, setShowPrintLanguageModal] = useState(false);
  const [pendingPrintTarget, setPendingPrintTarget] =
    useState<PendingPrintTarget>(null);

  const openPrintLanguageModal = (target: PendingPrintTarget) => {
    setPendingPrintTarget(target);
    setShowPrintLanguageModal(true);
  };

  const closePrintLanguageModal = () => {
    setShowPrintLanguageModal(false);
    setPendingPrintTarget(null);
  };

  const printAssessmentsRef = useRef<HTMLDivElement>(null);
  const [assessmentsPrintData, setAssessmentsPrintData] = useState<any>(null);
  const [isPrintingAssessments, setIsPrintingAssessments] =
    useState<boolean>(false);

  const handleAssessmentsPrint = useReactToPrint({
    contentRef: printAssessmentsRef,
    documentTitle: "Patient_Assessments",
    onAfterPrint: () => setAssessmentsPrintData(null),
  });

  const fetchAndPrintAssessments = async (lang: string) => {
    setIsMenuOpen(false);
    setIsPrintingAssessments(true);
    try {
      const response = await api.get(
        `/print/patient/${patientId}?lang=${lang}`,
      );
      setAssessmentsPrintData({ ...response.data, printType: "assessments" });
      setTimeout(() => {
        handleAssessmentsPrint();
        setIsPrintingAssessments(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching assessments print data:", err);
      alert("Failed to load assessments for printing.");
      setIsPrintingAssessments(false);
    }
  };

  const printSingleAssessmentRef = useRef<HTMLDivElement>(null);
  const [singleAssessmentPrintData, setSingleAssessmentPrintData] =
    useState<any>(null);
  const [isPrintingAssessmentId, setIsPrintingAssessmentId] = useState<
    string | null
  >(null);

  const handleSingleAssessmentPrint = useReactToPrint({
    contentRef: printSingleAssessmentRef,
    documentTitle: "Patient_Assessment",
    onAfterPrint: () => setSingleAssessmentPrintData(null),
  });

  const fetchAndPrintSingleAssessment = async (
    assessmentId: string,
    lang: string,
  ) => {
    setIsPrintingAssessmentId(assessmentId);
    try {
      const response = await api.get(`/print/assessment/${assessmentId}`);
      let printData = response.data;

      if (lang && lang !== "en") {
        try {
          const translateResponse = await api.post(`/print/translate`, {
            data: printData,
            targetLang: lang,
          });
          printData = translateResponse.data;
        } catch (translateErr) {
          console.error(
            "Error translating assessment print data:",
            translateErr,
          );
        }
      }

      setSingleAssessmentPrintData(printData);
      setTimeout(() => {
        handleSingleAssessmentPrint();
        setIsPrintingAssessmentId(null);
      }, 500);
    } catch (err) {
      console.error("Error fetching assessment print data:", err);
      alert("Failed to load assessment for printing.");
      setIsPrintingAssessmentId(null);
    }
  };

  const handleLanguageSelected = async (langCode: string) => {
    const target = pendingPrintTarget;
    closePrintLanguageModal();
    if (!target) return;

    switch (target.type) {
      case "assessments":
        await fetchAndPrintAssessments(langCode);
        break;
      case "allSessions":
        await fetchAndPrintAllSessions(langCode);
        break;
      case "singlePlan":
        await fetchAndPrintSinglePlanInfo(target.planId, langCode);
        break;
      case "singleAssessment":
        await fetchAndPrintSingleAssessment(target.assessmentId, langCode);
        break;
      case "index":
        await fetchAndPrintIndex(langCode);
        break;
    }
  };

  // Start Follow-up Session Handler
  const handleStartFollowUp = (role: "medical" | "counselor") => {
    setShowFollowUpModal(false);

    if (role === "medical") {
      navigate(`/complete-aftercare-physician/new`, {
        state: { patientId, isNewFollowUp: true },
      });
    } else {
      navigate(`/complete-aftercare-counselor/new`, {
        state: { patientId, isNewFollowUp: true },
      });
    }
  };

  const [assessments, setAssessments] = useState<PatientAssessment[]>([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        setError("Patient ID not provided");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [patientResponse, assessmentsResponse] = await Promise.all([
          api.get(`/patient/${patientId}`),
          api.get(`/assessments?patientId=${patientId}`),
        ]);

        setPatient(patientResponse.data.patientData);
        setMedicalRecords(patientResponse.data.medicalRecords || []);
        setAssessments(assessmentsResponse.data.assessments || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching patient data");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const handleFilterChange = (filter: string) => {
    setSessionFilter(filter);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!patientId) return;

    const checkAftercareSessions = async () => {
      try {
        const response = await api.get(
          `/all/sessions/${patientId}?page=1&limit=1&sessionType=Aftercare`,
        );
        setHasAftercareSessions((response.data.sessions || []).length > 0);
      } catch (err) {
        console.error("Error checking aftercare sessions:", err);
      }
    };

    checkAftercareSessions();
  }, [patientId, sessionRefreshCounter]);

  // FETCH NORMAL SESSIONS
  useEffect(() => {
    if (activeTab !== "sessions" || !patientId) return;

    const fetchSessions = async () => {
      setSessionsLoading(true);
      try {
        const typeQuery =
          sessionFilter !== "All" ? `&sessionType=${sessionFilter}` : "";
        const response = await api.get(
          `/all/sessions/${patientId}?page=${currentPage}&limit=${sessionsPerPage}${typeQuery}`,
        );

        // Filter out Follow-up sessions from the main tab view entirely
        const filteredSessions = (response.data.sessions || []).filter(
          (s: Session) => s.therepy_type !== "Follow-up",
        );

        setSessions(filteredSessions);

        if (response.data.pagination) {
          setTotalPages(response.data.pagination.total_pages);
          setCurrentPage(response.data.pagination.current_page);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [activeTab, patientId, currentPage, sessionFilter, sessionRefreshCounter]);

  // FETCH REHAB (FOLLOW-UP) SESSIONS
  useEffect(() => {
    if (activeTab !== "rehab" || !patientId) return;

    const fetchRehabSessions = async () => {
      setRehabSessionsLoading(true);
      try {
        const response = await api.get(
          `/all/rehabsessions/${patientId}?page=${rehabCurrentPage}&limit=${sessionsPerPage}&sessionType=Follow-up`,
        );

        setRehabSessions(response.data.sessions || []);

        if (response.data.pagination) {
          setRehabTotalPages(response.data.pagination.total_pages);
          setRehabCurrentPage(response.data.pagination.current_page);
          setRehabTotalCount(response.data.pagination.total_count || 0);
        }
      } catch (err) {
        console.error("Error fetching rehab sessions:", err);
      } finally {
        setRehabSessionsLoading(false);
      }
    };

    fetchRehabSessions();
  }, [activeTab, patientId, rehabCurrentPage, sessionRefreshCounter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (
        sessionMenuRef.current &&
        !sessionMenuRef.current.contains(event.target as Node)
      ) {
        setIsSessionMenuOpen(false);
      }
      if (!(event.target as Element).closest(".planMenuContainer")) {
        setActivePlanMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSessionClick = (s: Session) => {
    if (
      isSessionTerminated(s.status) ||
      s.status === "pending_counselor" ||
      s.status === "pending_medical"
    ) {
      navigate(`/sessionDetails/${s._id}`);
      return;
    }

    if (s.therepy_type === "Aftercare" || s.therepy_type === "Follow-up") {
      const physicianId = s.aftercare_team?.physician_id || s.doctor_id;
      const counsellorId = s.aftercare_team?.counsellor_id;

      if (currentDoctorId && currentDoctorId === physicianId) {
        navigate(`/complete-aftercare-physician/${s._id}`, {
          state: { appointment: s },
        });
      } else if (currentDoctorId && currentDoctorId === counsellorId) {
        navigate(`/complete-aftercare-counselor/${s._id}`, {
          state: { appointment: s },
        });
      } else {
        setSelectedRoleSession(s);
        setShowRoleModal(true);
      }
    } else {
      navigate(`/mark-appointment/${s._id}`, { state: { appointment: s } });
    }
  };

  const handleAddCareTeamMember = () => {
    if (!selectedDeptId || !selectedDoctorId) return;

    const dept = departments.find((d) => d._id === selectedDeptId);
    const doc = doctors.find((d) => d._id === selectedDoctorId);

    if (dept && doc) {
      const newMember: CareTeamMember = {
        department_id: dept._id,
        department_name: dept.department_name,
        doctor_id: doc._id,
        doctor_name: `${doc.doctor_first_name} ${doc.doctor_last_name}`,
        role: selectedRole,
      };

      setDraftCareTeam((prev) => {
        if (selectedRole === "Head Counselor") {
          return [
            ...prev.filter((m) => m.role !== "Head Counselor"),
            newMember,
          ];
        }
        if (prev.some((m) => m.doctor_id === doc._id)) return prev;
        return [...prev, newMember];
      });

      setSelectedDeptId("");
      setSelectedDoctorId("");
      setDoctors([]);
    }
  };

  const handleRemoveCareTeamMember = (doctorId: string) => {
    setDraftCareTeam((prev) => prev.filter((m) => m.doctor_id !== doctorId));
  };

  const saveCareTeam = async () => {
    setIsSavingCareTeam(true);
    try {
      const response = await api.put(`/assigning/patient/${patientId}`, {
        care_team: draftCareTeam,
      });
      setPatient(response.data.patient);
      setShowCareTeamModal(false);
      alert("Care team updated successfully");
    } catch (err) {
      console.error("Failed to assign care team:", err);
      alert("Failed to update care team.");
    } finally {
      setIsSavingCareTeam(false);
    }
  };

  const handleCreateTherapyPlan = () => {
    setIsMenuOpen(false);
    if (patientId) navigate(`/createTherapy/${patientId}`);
  };

  const handleEditPatient = () => {
    setIsMenuOpen(false);
    if (patientId) navigate(`/updatePatient/${patientId}`);
  };

  const handleRecordPayment = () => {
    setIsMenuOpen(false);
    if (patientId) navigate(`/payment/${patientId}`);
  };

  const handlePlanClick = (planId: string) => {
    if (patientId) navigate(`/planDetails/${planId}`, { state: { patientId } });
  };

  const handleDocumentUpload = async (documentInfo: {
    uri: string;
    name: string;
    type: string;
    size?: number | null;
    file?: File;
    document_name?: string;
    document_type?: string;
  }) => {
    if (!patientId || !documentInfo.file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await uploadPatientDocumentDirect({
        patientId,
        file: documentInfo.file,
        documentName: documentInfo.document_name || documentInfo.name,
        documentType: documentInfo.document_type || "Other",
        onProgress: setUploadProgress,
      });

      const patientResponse = await api.get(`/patient/${patientId}`);
      setPatient(patientResponse.data.patientData);
    } catch (err: any) {
      console.error("Document upload error:", err);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleConsentDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !patientId) return;

    setIsUploadingConsent(true);
    try {
      const formData = new FormData();
      formData.append("signed_document", file);

      await api.put(`/consent/signed-document/${patientId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const response = await api.get(`/patient/${patientId}`);
      setPatient(response.data.patientData);
      alert("Signed consent document uploaded successfully!");
    } catch (err: any) {
      console.error("Error uploading consent document:", err);
      alert("Failed to upload signed consent document.");
    } finally {
      setIsUploadingConsent(false);
      if (consentFileInputRef.current) consentFileInputRef.current.value = "";
    }
  };

  const handleDocumentDeleteSuccess = async () => {
    if (!patientId) return;
    try {
      const response = await api.get(`/patient/${patientId}`);
      setPatient(response.data.patientData);
    } catch (err: any) {
      console.error("Error refreshing patient data:", err);
      alert("Failed to refresh patient data");
    }
  };

  const handleViewDocument = (url: string) => {
    if (!url) {
      alert("Document URL is invalid or missing");
      return;
    }
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error opening document:", err);
      alert("Failed to open document");
    }
  };

  const handleCreateSession = () => {
    if (patientId) navigate(`/createsession/${patientId}`);
  };

  const handleArchivePatient = async () => {
    setIsMenuOpen(false);
    if (patient?.status === "Archived") {
      if (
        window.confirm(
          `Are you sure you want to Undischarge ${patient?.patient_first_name} ${patient?.patient_last_name}?`,
        )
      ) {
        setIsArchiving(true);
        try {
          await api.post(`/patient/unarchive/${patientId}`);
          alert("Patient Un-discharge successfully");
          const response = await api.get(`/patient/${patientId}`);
          setPatient(response.data.patientData);
        } catch (error: any) {
          console.error("Error unarchiving patient:", error);
          alert("Failed to unarchive patient");
        } finally {
          setIsArchiving(false);
        }
      }
    } else {
      setShowArchiveModal(true);
    }
  };

  const handleDeletePatient = async () => {
    setIsMenuOpen(false);
    if (
      window.confirm(
        `Are you sure you want to permanently delete ${fullName}? This action cannot be undone.`,
      )
    ) {
      setIsDeleting(true);
      try {
        await api.delete(`/delete/patient/${patientId}`);
        alert("Patient deleted successfully");
        navigate("/PatientsList");
      } catch (error: any) {
        console.error("Error deleting patient:", error);
        alert(
          error.response?.data?.message ||
            "Failed to delete patient. Ensure there are no active treatment plans, sessions, or assessments.",
        );
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const confirmArchive = async (reason: string, followUpDate: string) => {
    setShowArchiveModal(false);
    setIsArchiving(true);

    try {
      const requestBody: any = {};
      if (reason.trim()) requestBody.archived_reason = reason.trim();
      if (followUpDate) requestBody.follow_Up_Date = followUpDate;

      await api.post(`/patient/archive/${patientId}`, requestBody);
      alert("Patient discharged successfully");
      const response = await api.get(`/patient/${patientId}`);
      setPatient(response.data.patientData);
    } catch (error: any) {
      console.error("Error archiving patient:", error);
      alert("Failed to discharge patient");
    } finally {
      setIsArchiving(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getDaysSinceRegistration = (
    dateString?: string,
    status?: string,
  ): string => {
    if (status?.toLowerCase() === "archived") {
      return "Completed";
    }

    if (!dateString) return "N/A";
    try {
      const regDate = new Date(dateString);
      if (isNaN(regDate.getTime())) return "N/A";

      const today = new Date();

      const regDateMidnight = new Date(
        regDate.getFullYear(),
        regDate.getMonth(),
        regDate.getDate(),
      );
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      const diffTime = todayMidnight.getTime() - regDateMidnight.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays < 0) return "N/A";
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } catch {
      return "N/A";
    }
  };

  const formatAddress = (addressObj?: Address): string => {
    if (!addressObj) return "N/A";
    const parts = [
      addressObj.street,
      addressObj.city,
      addressObj.state,
      addressObj.zip,
      addressObj.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const renderStatusBadge = (status?: string) => {
    let badgeClass = "";
    switch (status?.toLowerCase()) {
      case "active":
        badgeClass = styles.statusActive;
        break;
      case "inactive":
        badgeClass = styles.statusInactive;
        break;
      case "completed":
        badgeClass = styles.statusCompleted;
        break;
      case "archived":
        badgeClass = styles.statusArchived;
        break;
      default:
        badgeClass = "";
    }
    return (
      <span className={`${styles.statusBadge} ${badgeClass}`}>
        {status || "Unknown"}
      </span>
    );
  };

  const getRiskClass = (level?: string | null) => {
    switch (level) {
      case "Low":
        return styles.riskLow;
      case "Moderate":
        return styles.riskModerate;
      case "High":
        return styles.riskHigh;
      case "Critical":
        return styles.riskCritical;
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className={styles.centeredState}>
        <div className={styles.spinner}></div>
        <p className={styles.fontBody}>Loading clinical profile...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className={styles.centeredState}>
        <div className={styles.error}>{error || "Patient not found"}</div>
      </div>
    );
  }

  const fullName =
    `${patient.patient_first_name || ""}  ${patient.patient_middle_name || ""} ${patient.patient_last_name || ""}`.trim() ||
    "Unnamed Patient";

  const shouldShowRelapseCard =
    patient.therapy_plans?.some((plan) => {
      if (plan.status?.toLowerCase() === "completed") return true;
      if (!plan.therapy_start || !plan.therapy_end) return false;

      const start = new Date(plan.therapy_start).getTime();
      const end = new Date(plan.therapy_end).getTime();
      const now = new Date().getTime();

      if (Number.isNaN(start) || Number.isNaN(end) || start >= end)
        return false;

      const totalDuration = end - start;
      const elapsed = now - start;
      return elapsed / totalDuration >= 0.25;
    }) ?? false;

  return (
    <ErrorBoundary>
      <div className={styles.dashboardLayout}>
        <section className={styles.heroSection}>
          <svg
            className={styles.heroBackgroundSvg}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M44.7,-76.4C58.3,-69.2,70,-58.5,78.2,-45.5C86.4,-32.5,91.1,-17.2,89.3,-2.6C87.5,12,79.2,25.9,70.1,38.2C61.1,50.5,51.2,61.2,39.2,69.5C27.2,77.7,13.6,83.5,-0.6,84.5C-14.8,85.5,-29.6,81.8,-42.6,74.1C-55.6,66.4,-66.8,54.7,-74.6,41.2C-82.4,27.7,-86.8,12.4,-86.1,-2.7C-85.3,-17.8,-79.4,-32.7,-69.9,-44.9C-60.4,-57.1,-47.4,-66.6,-33.9,-73.9C-20.4,-81.2,-6.4,-86.3,8,-81.4C22.4,-76.5,44.7,-76.4Z"
              transform="translate(100 100)"
            ></path>
          </svg>

          <div className={styles.heroContent}>
            <div className={styles.avatarWrapper}>
              {patient.patient_image ? (
                <img
                  src={patient.patient_image}
                  alt="Avatar"
                  className={`${styles.avatarImg} ${styles.pointer}`}
                  onClick={() => setShowImageModal(true)}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {patient.patient_first_name?.charAt(0).toUpperCase() || "N"}
                </div>
              )}
              <span className={styles.statusBadgeHero}>
                {patient.status?.toLowerCase() === "archived"
                  ? "Discharged"
                  : patient.status || "Active"}
              </span>
            </div>

            <div className={styles.heroDetails}>
              <div className={styles.heroHeaderRow}>
                <div>
                  <h2
                    className={`${styles.patientName} ${styles.fontHeadline}`}
                  >
                    {fullName}
                  </h2>
                  <p className={`${styles.patientId} ${styles.fontBody}`}>
                    <FaFingerprint /> UHID: {patient.UHID || "Pending"}
                  </p>
                  <RelapseLinkControl
                    patientId={patientId || ""}
                    patientName={fullName}
                    previousPatientId={patient.previous_patient_id}
                    onLinked={(updatedPatient) => setPatient(updatedPatient)}
                  />
                </div>
                <div className={styles.heroActions}>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleEditPatient}
                  >
                    <FaPlus size={12} /> Edit Profile
                  </button>
                  <div className={`${styles.relativeContainer}`} ref={menuRef}>
                    <button
                      className={styles.btnSecondaryIcon}
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      <FaEllipsisV />
                    </button>
                    {isMenuOpen && (
                      <div className={styles.dropdownMenuRight}>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowCareTeamModal(true);
                          }}
                        >
                          <FaUserMd className={styles.menuIcon} /> Assign Care
                          Team
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate(`/take-assessment/${patientId}`);
                          }}
                        >
                          <FaFileMedical className={styles.menuIcon} /> Conduct
                          Assessment
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={handleRecordPayment}
                        >
                          <FaMoneyBillWave className={styles.menuIcon} /> Record
                          Payment
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={handleCreateTherapyPlan}
                        >
                          <FaNotesMedical className={styles.menuIcon} />
                          Treatment Plan
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={handleArchivePatient}
                        >
                          <FaArchive className={styles.menuIcon} />{" "}
                          {patient?.status === "Archived"
                            ? "Un-Discharge"
                            : "Discharge"}
                        </button>
                        <div className={styles.menuDivider}></div>
                        <button
                          className={styles.menuItem}
                          onClick={() =>
                            openPrintLanguageModal({ type: "assessments" })
                          }
                          disabled={isPrintingAssessments}
                        >
                          {isPrintingAssessments ? (
                            <FaSpinner
                              className={`fa-spin ${styles.menuIcon}`}
                            />
                          ) : (
                            <FaPrint className={styles.menuIcon} />
                          )}{" "}
                          Print Assessments
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() =>
                            openPrintLanguageModal({ type: "index" })
                          }
                          disabled={isPrintingIndex}
                        >
                          {isPrintingIndex ? (
                            <FaSpinner
                              className={`fa-spin ${styles.menuIcon}`}
                            />
                          ) : (
                            <FaPrint className={styles.menuIcon} />
                          )}{" "}
                          Print Index Page
                        </button>

                        <div className={styles.menuDivider}></div>
                        <button
                          className={styles.menuItem}
                          onClick={handleDeletePatient}
                          disabled={isDeleting}
                          style={{ color: "#dc2626" }}
                        >
                          {isDeleting ? (
                            <FaSpinner
                              className={`fa-spin ${styles.menuIcon}`}
                            />
                          ) : (
                            <FaTrash className={styles.menuIcon} />
                          )}{" "}
                          Delete Patient
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.heroQuickStats}>
                <div className={styles.statItem}>
                  <div className={styles.statIconWrapper}>
                    <FaEnvelope />
                  </div>
                  <div>
                    <p className={styles.statLabel}>Email Address</p>
                    <p className={styles.statValue}>
                      {patient.patient_email || "Not Provided"}
                    </p>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIconWrapper}>
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <p className={styles.statLabel}>Phone Number</p>
                    <p className={styles.statValue}>
                      {patient.patient_phone || "Not Provided"}
                    </p>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIconWrapper}>
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <p className={styles.statLabel}>Registration Date</p>
                    <p className={styles.statValue}>
                      {formatDate(patient.patient_registration_date)}
                    </p>
                  </div>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIconWrapper}>
                    <FaStethoscope />
                  </div>
                  <div>
                    <p className={styles.statLabel}>
                      {patient.status?.toLowerCase() === "archived"
                        ? "Follow-up Date"
                        : "Treatment Day"}
                    </p>
                    <p className={styles.statValue}>
                      {patient.status?.toLowerCase() === "archived"
                        ? patient.follow_Up_Date
                          ? formatDate(patient.follow_Up_Date)
                          : "Not Scheduled"
                        : getDaysSinceRegistration(
                            patient.patient_registration_date,
                          )}
                    </p>
                  </div>
                </div>

                {patient.relapse_risk_assessment &&
                  patient.relapse_risk_assessment.risk_level !==
                    "Insufficient Data" &&
                  typeof patient.relapse_risk_assessment.risk_score ===
                    "number" && (
                    <div className={styles.statItem}>
                      <div className={styles.statIconWrapper}>
                        <FaShieldAlt
                          className={getRiskClass(
                            patient.relapse_risk_assessment.risk_level,
                          )}
                        />
                      </div>
                      <div>
                        <p className={styles.statLabel}>Relapse Risk</p>
                        <p
                          className={`${styles.statValue} ${getRiskClass(patient.relapse_risk_assessment.risk_level)}`}
                        >
                          {patient.relapse_risk_assessment.risk_score}/100 (
                          {patient.relapse_risk_assessment.risk_level})
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </section>

        <nav className={styles.tabsNav}>
          {[
            "overview",
            "assessments",
            "Treatment plans(IPD)",
            "sessions",
            ...(patient?.status?.toLowerCase() === "archived" ? ["rehab"] : []),
            "documents",
            "consent-forms",
            "complete-info",
          ].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""} ${styles.fontBody}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </nav>

        <main>
          {activeTab === "overview" && (
            <div className={styles.overviewContainer}>
              <div className={styles.bentoGrid}>
                <div className={styles.colSpan8}>
                  <div className={styles.bentoCard}>
                    <div className={styles.cardHeader}>
                      <h3
                        className={`${styles.cardTitle} ${styles.fontHeadline}`}
                      >
                        Personal Information
                      </h3>
                      <FaUserEdit style={{ color: "#cbd5e1" }} />
                    </div>
                    <div className={styles.overviewGrid}>
                      <div className={styles.demoItem}>
                        <p>Full Name</p>
                        <p>{fullName}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Age</p>
                        <p>
                          {patient.patient_age
                            ? `${patient.patient_age} Years`
                            : "N/A"}
                        </p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Address</p>
                        <p className={styles.addressText}>
                          {formatAddress(patient.address)}
                        </p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Referral Source</p>
                        <p>{patient.referral_source || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Referral Details</p>
                        <p>{patient.referral_details || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.colSpan4}>
                  <div className={`${styles.bentoCard} ${styles.hFull}`}>
                    <div className={styles.cardHeader}>
                      <h3
                        className={`${styles.cardTitle} ${styles.fontHeadline}`}
                      >
                        Care Team
                      </h3>
                      <span
                        className={styles.editTeamBtn}
                        onClick={() => setShowCareTeamModal(true)}
                      >
                        Edit Team
                      </span>
                    </div>
                    <div className={styles.teamList}>
                      {patient.care_team && patient.care_team.length > 0 ? (
                        patient.care_team.map((m, i) => (
                          <div key={i} className={styles.teamMember}>
                            {m.doctor_photo ? (
                              <img
                                src={m.doctor_photo}
                                alt={`${m.doctor_name}`}
                                className={styles.teamAvatarImg}
                              />
                            ) : (
                              <div className={styles.teamAvatarFallback}>
                                <FaUserMd />
                              </div>
                            )}
                            <div className={styles.teamInfo}>
                              <p className={styles.teamName}>{m.doctor_name}</p>
                              <p className={styles.teamRole}>
                                {m.role} • {m.department_name}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p
                          className={`${styles.fontBody} ${styles.noTeamText}`}
                        >
                          No team assigned.
                        </p>
                      )}
                    </div>
                    <button
                      className={styles.btnAddProf}
                      onClick={() => setShowCareTeamModal(true)}
                    >
                      + Manage Professionals
                    </button>
                  </div>
                </div>

                {shouldShowRelapseCard && (
                  <div className={styles.fullWidthCol}>
                    <RelapseRiskCard
                      patientId={patientId || ""}
                      initialAssessment={patient.relapse_risk_assessment}
                      onAssessed={(updated) =>
                        setPatient((prev) =>
                          prev
                            ? { ...prev, relapse_risk_assessment: updated }
                            : prev,
                        )
                      }
                    />
                  </div>
                )}

                <div className={styles.fullWidthCol}>
                  <div className={styles.bentoCard}>
                    <div className={styles.cardHeader}>
                      <h3
                        className={`${styles.cardTitle} ${styles.fontHeadline}`}
                      >
                        Patient Journey
                      </h3>
                    </div>
                    {patient.patient_journey &&
                    patient.patient_journey.length > 0 ? (
                      <div className={styles.journeyWrapper}>
                        <div className={styles.journeyLine}></div>

                        {patient.patient_journey.map((stage, index) => (
                          <div
                            key={stage._id}
                            className={`${styles.journeyItem} ${index !== patient.patient_journey!.length - 1 ? styles.journeyItemMargin : ""}`}
                          >
                            <div className={styles.journeyAvatar}>
                              {stage.performed_by_photo ? (
                                <img
                                  src={stage.performed_by_photo}
                                  alt={stage.performed_by_name}
                                  className={styles.journeyAvatarImg}
                                />
                              ) : (
                                <div className={styles.journeyAvatarFallback}>
                                  <FaUserMd size={14} color="white" />
                                </div>
                              )}
                            </div>

                            <div
                              className={`${styles.stripCard} ${styles.journeyStripCard}`}
                            >
                              <div className={styles.journeyStripHeader}>
                                <div className={styles.journeyStripTitleWrap}>
                                  <div className={styles.journeyTitleRow}>
                                    <h4 className={styles.journeyStageTitle}>
                                      {stage.stage}
                                    </h4>
                                    {renderStatusBadge(stage.status)}
                                  </div>
                                  <div className={styles.journeyMetaRow}>
                                    <span className={styles.journeyMetaItem}>
                                      <FaUserMd
                                        size={12}
                                        className={styles.primaryIcon}
                                      />{" "}
                                      {stage.performed_by_name}
                                    </span>
                                    <span className={styles.journeyMetaDivider}>
                                      |
                                    </span>
                                    <span className={styles.journeyMetaItem}>
                                      <FaCalendarAlt
                                        size={12}
                                        className={styles.primaryIcon}
                                      />{" "}
                                      {formatDate(stage.performed_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {stage.notes && (
                                <div className={styles.journeyNotes}>
                                  <strong className={styles.journeyNotesLabel}>
                                    Notes:
                                  </strong>
                                  {stage.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`${styles.emptyState} ${styles.emptyStatePadded}`}
                      >
                        No journey records found for this patient.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assessments" && (
            <div className={styles.bentoCard}>
              <div className={styles.listHeaderRight}>
                <button
                  className={styles.btnPrimarySmall}
                  onClick={() => navigate(`/take-assessment/${patientId}`)}
                >
                  <FaPlus size={10} /> Conduct Assessment
                </button>
              </div>
              {assessments.length === 0 ? (
                <div className={styles.emptyState}>
                  No assessments found for this patient.
                </div>
              ) : (
                <div className={styles.stripGrid}>
                  {assessments.map((assessment) => (
                    <div
                      key={assessment._id}
                      className={styles.stripCard}
                      onClick={() => navigate(`/assessment/${assessment._id}`)}
                    >
                      <div className={styles.stripMain}>
                        <div
                          className={`${styles.stripIcon} ${styles.stripIconPurple}`}
                        >
                          <FaFileMedical />
                        </div>
                        <div className={styles.stripText}>
                          <h4>{assessment.assessment_name || "Assessment"}</h4>
                          <span>{formatDate(assessment.date_taken)}</span>
                        </div>
                      </div>
                      <div className={styles.stripMeta}>
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>Conducted By</span>
                          <span className={styles.metaValue}>
                            {assessment.doctor_id
                              ? `${assessment.doctor_id.doctor_first_name} ${assessment.doctor_id.doctor_last_name}`
                              : "N/A"}
                          </span>
                        </div>
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>Status</span>
                          {renderStatusBadge(assessment.status)}
                        </div>
                      </div>
                      <div className={styles.stripActions}>
                        <button
                          className={styles.btnSecondaryIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            openPrintLanguageModal({
                              type: "singleAssessment",
                              assessmentId: assessment._id,
                            });
                          }}
                          disabled={isPrintingAssessmentId === assessment._id}
                          title="Print Assessment"
                        >
                          {isPrintingAssessmentId === assessment._id ? (
                            <FaSpinner className="fa-spin" />
                          ) : (
                            <FaPrint />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Treatment plans(IPD)" && (
            <div className={styles.bentoCard}>
              <div className={styles.listHeaderRight}>
                <button
                  className={styles.btnPrimarySmall}
                  onClick={handleCreateTherapyPlan}
                >
                  <FaPlus size={10} /> Add Plan
                </button>
              </div>
              {patient.therapy_plans?.length === 0 ? (
                <div className={styles.emptyState}>
                  No therapy plans active.
                </div>
              ) : (
                <div className={styles.stripGrid}>
                  {patient.therapy_plans?.map((plan) => (
                    <div
                      key={plan._id}
                      className={styles.stripCard}
                      onClick={() => handlePlanClick(plan._id)}
                    >
                      <div className={styles.stripMain}>
                        <div className={styles.stripIcon}>
                          <FaNotesMedical />
                        </div>
                        <div className={styles.stripText}>
                          <h4>{plan.therapy_name || "Unnamed Plan"}</h4>
                          <span>
                            {formatDate(plan.therapy_start)} —{" "}
                            {plan.status?.toLowerCase() === "completed"
                              ? formatDate(
                                  plan.closure_date || plan.therapy_end,
                                )
                              : formatDate(plan.therapy_end)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.stripMetaStatusOnly}>
                        {(() => {
                          if (plan.status?.toLowerCase() === "completed") {
                            const reason = plan.closure_reason || "Completed";
                            let reasonClass = styles.statusCompleted;

                            switch (reason.toLowerCase()) {
                              case "incomplete":
                                reasonClass = styles.statusIncomplete;
                                break;
                              case "dropout":
                                reasonClass = styles.statusDropout;
                                break;
                              case "refer":
                                reasonClass = styles.statusRefer;
                                break;
                              case "opd":
                                reasonClass = styles.statusOpd;
                                break;
                            }
                            return (
                              <span
                                className={`${styles.statusBadge} ${reasonClass}`}
                                style={{ textTransform: "uppercase" }}
                              >
                                {reason}
                              </span>
                            );
                          }
                          return renderStatusBadge(plan.status);
                        })()}
                      </div>

                      <div
                        className={`planMenuContainer ${styles.stripActions} ${styles.relativeContainer}`}
                      >
                        <button
                          className={styles.btnSecondaryIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePlanMenuId(
                              activePlanMenuId === plan._id ? null : plan._id,
                            );
                          }}
                        >
                          <FaEllipsisV />
                        </button>

                        {activePlanMenuId === plan._id && (
                          <div
                            className={`${styles.dropdownMenuRight} ${styles.dropdownMenuRightAbsolute}`}
                          >
                            <button
                              className={styles.menuItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePlanMenuId(null);
                                openPrintLanguageModal({
                                  type: "singlePlan",
                                  planId: plan._id,
                                });
                              }}
                              disabled={isPrintingSinglePlanId === plan._id}
                            >
                              {isPrintingSinglePlanId === plan._id ? (
                                <FaSpinner
                                  className={`fa-spin ${styles.menuIcon}`}
                                />
                              ) : (
                                <FaPrint className={styles.menuIcon} />
                              )}{" "}
                              Print Plan
                            </button>

                            {plan.status?.toLowerCase() === "completed" && (
                              <button
                                className={styles.menuItem}
                                onClick={(e) => fetchAndPrintPlan(e, plan._id)}
                                disabled={isPrintingPlanId === plan._id}
                              >
                                {isPrintingPlanId === plan._id ? (
                                  <FaSpinner
                                    className={`fa-spin ${styles.menuIcon}`}
                                  />
                                ) : (
                                  <FaFileMedical className={styles.menuIcon} />
                                )}{" "}
                                Discharge Summery
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className={styles.bentoGrid}>
              {sessionsLoading ? (
                <div className={styles.fullWidthCol}>
                  <div className={styles.centeredState}>
                    <div className={styles.spinner}></div>
                    <p className={styles.fontBody}>Loading sessions...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.colSpan8}>
                    <div className={`${styles.bentoCard} ${styles.hFull}`}>
                      <div className={styles.sessionFilterHeader}>
                        <div className={styles.sessionFilterButtonGroup}>
                          {[
                            "All",
                            "Individual",
                            "Family",
                            "Group",
                            "Aftercare",
                          ].map((filter) => (
                            <button
                              key={filter}
                              onClick={() => handleFilterChange(filter)}
                              className={`${styles.filterBtn} ${sessionFilter === filter ? styles.filterBtnActive : ""}`}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>

                        <div
                          className={`${styles.listHeaderRight} ${styles.listHeaderRightCompact}`}
                        >
                          <button
                            className={styles.btnPrimarySmall}
                            onClick={handleCreateSession}
                          >
                            <FaPlus size={10} /> Add Session
                          </button>

                          <div
                            className={`menuContainer ${styles.relativeContainer}`}
                            ref={sessionMenuRef}
                          >
                            <button
                              className={`${styles.btnSecondaryIcon} ${styles.btnSecondaryIconSmall}`}
                              onClick={() =>
                                setIsSessionMenuOpen(!isSessionMenuOpen)
                              }
                            >
                              <FaEllipsisV size={12} />
                            </button>
                            {isSessionMenuOpen && (
                              <div className={styles.dropdownMenuRight}>
                                <button
                                  className={styles.menuItem}
                                  onClick={() =>
                                    openPrintLanguageModal({
                                      type: "allSessions",
                                    })
                                  }
                                  disabled={isPrintingAllSessions}
                                >
                                  {isPrintingAllSessions ? (
                                    <FaSpinner
                                      className={`fa-spin ${styles.menuIcon}`}
                                    />
                                  ) : (
                                    <FaPrint className={styles.menuIcon} />
                                  )}{" "}
                                  Print All Sessions
                                </button>
                                <button
                                  className={styles.menuItem}
                                  onClick={() => {
                                    setIsSessionMenuOpen(false);
                                    setShowAftercareModal(true);
                                  }}
                                >
                                  <FaPlus className={styles.menuIcon} /> Add
                                  Aftercare
                                </button>
                                {hasAftercareSessions && (
                                  <>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => {
                                        setIsSessionMenuOpen(false);
                                        aftercarePrinterRef.current?.triggerPrint();
                                      }}
                                      disabled={isPrintingAftercare}
                                    >
                                      {isPrintingAftercare ? (
                                        <FaSpinner
                                          className={`fa-spin ${styles.menuIcon}`}
                                        />
                                      ) : (
                                        <FaPrint className={styles.menuIcon} />
                                      )}{" "}
                                      After Care Report
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {sessions.length === 0 ? (
                        <div className={styles.emptyState}>
                          No{" "}
                          {sessionFilter !== "All"
                            ? sessionFilter.toLowerCase()
                            : ""}{" "}
                          sessions recorded.
                        </div>
                      ) : (
                        <div className={styles.stripGrid}>
                          {sessions.map((s) => (
                            <div
                              key={s._id}
                              className={styles.stripCard}
                              onClick={() => handleSessionClick(s)}
                            >
                              <div className={styles.stripMain}>
                                <div
                                  className={`${styles.stripIcon} ${styles.stripIconOrange}`}
                                >
                                  <FaStethoscope />
                                </div>
                                <div className={styles.stripText}>
                                  <h4>
                                    Session {s.session_number}
                                    {s.issue_dealt_with
                                      ? ` — ${s.issue_dealt_with.slice(0, 60)}${
                                          s.issue_dealt_with.length > 60
                                            ? "…"
                                            : ""
                                        }`
                                      : ""}
                                  </h4>
                                  <span>{formatDate(s.therepy_date)}</span>
                                </div>
                              </div>

                              <div className={styles.stripMeta}>
                                {s.therepy_type === "Aftercare" ||
                                s.therepy_type === "Follow-up" ? (
                                  <>
                                    <div className={styles.metaBlock}>
                                      <span className={styles.metaLabel}>
                                        Physician
                                      </span>
                                      <span className={styles.metaValue}>
                                        {s.aftercare_team?.physician_name ||
                                          s.doctor_name ||
                                          "N/A"}
                                      </span>
                                    </div>
                                    <div className={styles.metaBlock}>
                                      <span className={styles.metaLabel}>
                                        Counsellor
                                      </span>
                                      <span className={styles.metaValue}>
                                        {s.aftercare_team?.counsellor_name ||
                                          "N/A"}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className={styles.metaBlock}>
                                    <span className={styles.metaLabel}>
                                      Doctor
                                    </span>
                                    <span className={styles.metaValue}>
                                      {s.doctor_name || "N/A"}
                                    </span>
                                  </div>
                                )}
                                <div className={styles.metaBlock}>
                                  <span className={styles.metaLabel}>Type</span>
                                  <span className={styles.metaValue}>
                                    {s.therepy_type || "N/A"}
                                  </span>
                                </div>
                                <div className={styles.metaBlock}>
                                  <span className={styles.metaLabel}>
                                    Status
                                  </span>
                                  {renderStatusBadge(s.status)}
                                </div>
                              </div>

                              {s.status !== "pending_counselor" &&
                                s.status !== "pending_medical" &&
                                s.status?.toLowerCase() !== "completed" && (
                                  <div
                                    className={styles.stripActionsVisible}
                                    style={{
                                      marginLeft: "10px",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <button
                                      className={styles.actionBtnSoft}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/editSession/${s._id}`);
                                      }}
                                      title="Edit Session"
                                    >
                                      <FaEdit size={14} />
                                    </button>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}

                      {totalPages > 1 && (
                        <div className={styles.paginationContainer}>
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className={styles.btnSecondarySmall}
                          >
                            Previous
                          </button>
                          <span className={styles.paginationText}>
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages),
                              )
                            }
                            disabled={currentPage === totalPages}
                            className={styles.btnSecondarySmall}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.colSpan4}>
                    <RehabProgressChart patientId={patientId || ""} />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "rehab" &&
            patient?.status?.toLowerCase() === "archived" && (
              <div className={styles.bentoCard}>
                <div className={styles.cardHeader}>
                  <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                    Rehab & Follow-up
                  </h3>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => setShowFollowUpModal(true)}
                  >
                    <FaPlus size={12} /> Add Follow-up
                  </button>
                </div>

                {rehabSessionsLoading ? (
                  <div className={styles.centeredState}>
                    <div className={styles.spinner}></div>
                    <p className={styles.fontBody}>Loading follow-ups...</p>
                  </div>
                ) : rehabSessions.length === 0 ? (
                  <div className={styles.emptyState}>
                    No follow-up sessions recorded.
                  </div>
                ) : (
                  <>
                    <div className={styles.stripGrid}>
                      {rehabSessions.map((s, index) => {
                        // Calculate reverse 1-based chronological number because list is sorted newest first
                        const calculatedNumber =
                          rehabTotalCount > 0
                            ? rehabTotalCount -
                              ((rehabCurrentPage - 1) * sessionsPerPage + index)
                            : index + 1;

                        const displayFollowupNumber =
                          s.session_number || calculatedNumber;

                        return (
                          <div
                            key={s._id}
                            className={styles.stripCard}
                            onClick={() => handleSessionClick(s)}
                          >
                            <div className={styles.stripMain}>
                              <div
                                className={`${styles.stripIcon} ${styles.stripIconOrange}`}
                              >
                                <FaStethoscope />
                              </div>
                              <div className={styles.stripText}>
                                <h4>Follow-up #{displayFollowupNumber}</h4>
                                <span>{formatDate(s.therepy_date)}</span>
                              </div>
                            </div>

                            <div className={styles.stripMeta}>
                              <div className={styles.metaBlock}>
                                <span className={styles.metaLabel}>
                                  Physician
                                </span>
                                <span className={styles.metaValue}>
                                  {s.status === "pending_medical"
                                    ? "Pending"
                                    : s.aftercare_team?.physician_name ||
                                      s.doctor_name ||
                                      "N/A"}
                                </span>
                              </div>
                              <div className={styles.metaBlock}>
                                <span className={styles.metaLabel}>
                                  Counsellor
                                </span>
                                <span className={styles.metaValue}>
                                  {s.status === "pending_counselor"
                                    ? "Pending"
                                    : s.aftercare_team?.counsellor_name ||
                                      (s.status === "pending_medical"
                                        ? s.doctor_name
                                        : "N/A")}
                                </span>
                              </div>
                              <div className={styles.metaBlock}>
                                <span className={styles.metaLabel}>
                                  Total Score
                                </span>
                                <span className={styles.metaValue}>
                                  {typeof s.total_recovery_score === "number"
                                    ? `${s.total_recovery_score}/30`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className={styles.metaBlock}>
                                <span className={styles.metaLabel}>Type</span>
                                <span className={styles.metaValue}>
                                  {s.therepy_type || "N/A"}
                                </span>
                              </div>
                              <div className={styles.metaBlock}>
                                <span className={styles.metaLabel}>Status</span>
                                {renderStatusBadge(s.status)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {rehabTotalPages > 1 && (
                      <div className={styles.paginationContainer}>
                        <button
                          onClick={() =>
                            setRehabCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={rehabCurrentPage === 1}
                          className={styles.btnSecondarySmall}
                        >
                          Previous
                        </button>
                        <span className={styles.paginationText}>
                          Page {rehabCurrentPage} of {rehabTotalPages}
                        </span>
                        <button
                          onClick={() =>
                            setRehabCurrentPage((prev) =>
                              Math.min(prev + 1, rehabTotalPages),
                            )
                          }
                          disabled={rehabCurrentPage === rehabTotalPages}
                          className={styles.btnSecondarySmall}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          {activeTab === "complete-info" && (
            <div className={styles.overviewContainer}>
              <div className={styles.bentoGrid}>
                <div className={styles.colSpan8}>
                  <div className={styles.bentoCard}>
                    <div className={styles.cardHeader}>
                      <h3
                        className={`${styles.cardTitle} ${styles.fontHeadline}`}
                      >
                        Extended Demographics
                      </h3>
                      <FaUserEdit style={{ color: "#cbd5e1" }} />
                    </div>
                    <div className={styles.overviewGrid}>
                      <div className={styles.demoItem}>
                        <p>Date of Birth</p>
                        <p>{formatDate(patient.date_of_birth)}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Gender</p>
                        <p>{patient.gender || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Blood Group</p>
                        <p>{patient.patient_bloodGroup || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Marital Status</p>
                        <p>{patient.marital_status || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Education</p>
                        <p>{patient.education || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Occupation</p>
                        <p>{patient.occupation || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Caste/Category</p>
                        <p>{patient.caste || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Annual Income</p>
                        <p>
                          {patient.annual_income
                            ? `₹${patient.annual_income}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.colSpan4}>
                  <div className={`${styles.bentoCard} ${styles.hFull}`}>
                    <div className={styles.cardHeader}>
                      <h3
                        className={`${styles.cardTitle} ${styles.fontHeadline}`}
                      >
                        Legal & Witness
                      </h3>
                    </div>
                    <div className={styles.legalWitnessList}>
                      <div className={styles.demoItem}>
                        <p>
                          Identity Card ({patient.identity_card?.type || "N/A"})
                        </p>
                        <p>{patient.identity_card?.number || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Witness Name</p>
                        <p>{patient.witness_name || "N/A"}</p>
                      </div>
                      <div className={styles.demoItem}>
                        <p>Witness Relationship</p>
                        <p>{patient.witness_relationship || "N/A"}</p>
                      </div>
                      {patient.witness_photo_url && (
                        <div className={styles.witnessPhotoContainer}>
                          <p className={styles.witnessPhotoLabel}>
                            Witness Photo
                          </p>
                          <img
                            src={patient.witness_photo_url}
                            alt="Witness"
                            className={styles.witnessPhotoImg}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.fullWidthCol}>
                  <div className={styles.bentoCard}>
                    <div className={styles.cardHeader}>
                      <h3
                        className={`${styles.cardTitle} ${styles.fontHeadline}`}
                      >
                        Additional Contact & Context
                      </h3>
                    </div>
                    <div className={styles.contactGrid}>
                      <div className={styles.demoItem}>
                        <p>
                          {patient.guardian_relation
                            ? `${patient.guardian_relation}`
                            : "Primary Guardian Contact"}
                        </p>
                        <p>{patient.guardian_phone || "N/A"}</p>
                      </div>

                      <div className={styles.demoItem}>
                        <p>
                          {patient.guardian_relation_2
                            ? `${patient.guardian_relation_2}`
                            : "Secondary Guardian Contact"}
                        </p>
                        <p>{patient.guardian_phone_2 || "N/A"}</p>
                      </div>

                      <div className={styles.demoItem}>
                        <p>Facility Location</p>
                        <p>{patient.location_name || "N/A"}</p>
                      </div>

                      <div
                        className={`${styles.demoItem} ${styles.demoItemFullWidth}`}
                      >
                        <p>Prior Treatment / Medical Context</p>
                        <p className={styles.lineHeight15}>
                          {patient.prior_treatment ||
                            "No prior treatment history provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className={styles.bentoCard}>
              {!isUploading && (
                <PatientDocumentUploader
                  patientId={patientId || ""}
                  onDocumentSelected={handleDocumentUpload}
                  onDocumentRemoved={() => {}}
                  isUploading={isUploading}
                />
              )}

              {isUploading && (
                <div className={styles.uploadSpinnerContainer}>
                  <div className={styles.spinner}></div>
                  <span
                    className={`${styles.fontBody} ${styles.uploadSpinnerText}`}
                  >
                    Uploading document, please wait...
                  </span>
                </div>
              )}

              {!isUploading &&
                (patient.documents?.length === 0 ? (
                  <div className={styles.emptyState}>
                    No general documents found.
                  </div>
                ) : (
                  <div
                    className={`${styles.stripGrid} ${styles.stripGridMargin}`}
                  >
                    {patient.documents?.map((doc) => (
                      <div key={doc._id} className={styles.stripCard}>
                        <div className={styles.stripMain}>
                          <div
                            className={`${styles.stripIcon} ${styles.stripIconIndigo}`}
                          >
                            <FaFileMedical />
                          </div>
                          <div className={styles.stripText}>
                            <h4>{doc.document_name || "Document"}</h4>
                            <span>
                              {formatDate(doc.document_upload_date)} •{" "}
                              {doc.document_type}
                            </span>
                          </div>
                        </div>
                        <div className={styles.stripActionsVisible}>
                          <button
                            className={styles.actionBtnSoft}
                            onClick={() => handleViewDocument(doc.document_url)}
                          >
                            <FaDownload size={12} />
                          </button>
                          <DocumentDeleteDialog
                            document={doc}
                            patientId={patientId || ""}
                            onDeleteSuccess={handleDocumentDeleteSuccess}
                          >
                            <button className={styles.actionBtnSoftRed}>
                              <FaTrash size={12} />
                            </button>
                          </DocumentDeleteDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}

          {activeTab === "consent-forms" && (
            <div className={styles.bentoCard}>
              <div
                className={`${styles.listHeaderRight} ${styles.listHeaderRightGap}`}
              >
                <input
                  type="file"
                  ref={consentFileInputRef}
                  className={styles.hiddenInput}
                  onChange={handleConsentDocumentUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />

                <button
                  className={styles.btnSecondarySmall}
                  onClick={fetchAndPrintConsentForm}
                  disabled={isPrintingConsent}
                >
                  {isPrintingConsent ? (
                    <FaSpinner className="fa-spin" />
                  ) : (
                    <FaFileMedical size={10} />
                  )}{" "}
                  {isPrintingConsent ? "Generating..." : "Generate Form"}
                </button>

                <button
                  className={styles.btnPrimarySmall}
                  onClick={() => consentFileInputRef.current?.click()}
                  disabled={isUploadingConsent}
                >
                  {isUploadingConsent ? (
                    <FaSpinner className="fa-spin" />
                  ) : (
                    <FaUpload size={10} />
                  )}{" "}
                  {isUploadingConsent ? "Uploading..." : "Upload Signed"}
                </button>
              </div>
              {!patient.consent_history ||
              patient.consent_history.length === 0 ? (
                <div className={styles.emptyState}>
                  No signed consent forms uploaded yet.
                </div>
              ) : (
                <div className={styles.stripGrid}>
                  {patient.consent_history.map((doc, idx) => (
                    <div key={idx} className={styles.stripCard}>
                      <div className={styles.stripMain}>
                        <div
                          className={`${styles.stripIcon} ${styles.stripIconGreen}`}
                        >
                          <FaNotesMedical />
                        </div>
                        <div className={styles.stripText}>
                          <h4>Signed Consent Document</h4>
                          <span>
                            Uploaded: {formatDate(doc.uploaded_at)} by{" "}
                            {doc.uploaded_by_name}
                          </span>
                        </div>
                      </div>
                      <div className={styles.stripActionsVisible}>
                        <button
                          className={styles.actionBtnSoft}
                          onClick={() => handleViewDocument(doc.document_url)}
                        >
                          <FaDownload size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <ArchiveModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          onConfirm={confirmArchive}
          patientName={fullName}
          isLoading={isArchiving}
        />

        {showImageModal && patient.patient_image && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowImageModal(false)}
          >
            <div
              className={styles.imageModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImageModal(false)}
                className={styles.closeModalBtnFloating}
              >
                <FaTimes />
              </button>
              <img
                src={patient.patient_image}
                alt={fullName}
                className={styles.imageModalImg}
              />
            </div>
          </div>
        )}

        {/* --- Start Follow-up Session Modal --- */}
        {showFollowUpModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.roleModalContent}>
              <h3 className={styles.roleModalTitle}>Start Follow-up Session</h3>
              <p className={styles.roleModalText}>
                Which phase are you completing right now?
              </p>
              <div className={styles.roleModalBtnGroup}>
                <button
                  onClick={() => handleStartFollowUp("medical")}
                  className={styles.roleBtnPhysician}
                >
                  <FaStethoscope size={18} /> Medical Phase
                </button>
                <button
                  onClick={() => handleStartFollowUp("counselor")}
                  className={styles.roleBtnCounselor}
                >
                  <FaClipboardList size={18} /> Counselor Phase
                </button>
                <button
                  onClick={() => setShowFollowUpModal(false)}
                  className={styles.roleBtnCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Select Role (Aftercare) Modal --- */}
        {showRoleModal && selectedRoleSession && (
          <div className={styles.modalOverlay}>
            <div className={styles.roleModalContent}>
              <h3 className={styles.roleModalTitle}>
                Select Role for Completion
              </h3>
              <p className={styles.roleModalText}>
                Your profile doesn't strictly match the assigned Physician or
                Counselor for this session. Which phase would you like to
                complete?
              </p>
              <div className={styles.roleModalBtnGroup}>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    navigate(
                      `/complete-aftercare-physician/${selectedRoleSession._id}`,
                      { state: { appointment: selectedRoleSession } },
                    );
                  }}
                  className={styles.roleBtnPhysician}
                >
                  <FaStethoscope size={18} /> Continue as Physician
                </button>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    navigate(
                      `/complete-aftercare-counselor/${selectedRoleSession._id}`,
                      { state: { appointment: selectedRoleSession } },
                    );
                  }}
                  className={styles.roleBtnCounselor}
                >
                  <FaClipboardList size={18} /> Continue as Counselor
                </button>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className={styles.roleBtnCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showCareTeamModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.careTeamModal}>
              <div className={styles.modalHeader}>
                <h3>Assign Care Team</h3>
                <button
                  onClick={() => setShowCareTeamModal(false)}
                  className={styles.closeModalBtn}
                >
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.assignmentControls}>
                  <div className={styles.formGroup}>
                    <label>Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className={styles.selectInput}
                    >
                      <option value="Specialist">Specialist</option>
                      <option value="Head Counselor">Head Counselor</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Department</label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Select Dept...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Doctor</label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className={styles.selectInput}
                      disabled={!selectedDeptId || isLoadingDoctors}
                    >
                      <option value="">
                        {isLoadingDoctors ? "Loading..." : "Select Doctor..."}
                      </option>
                      {doctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.doctor_first_name} {doc.doctor_last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddCareTeamMember}
                    className={styles.addBtn}
                    disabled={
                      !selectedDeptId || !selectedDoctorId || isLoadingDoctors
                    }
                  >
                    Add
                  </button>
                </div>
                <div className={styles.draftTeamList}>
                  <h4>Draft Team</h4>
                  {draftCareTeam.length === 0 ? (
                    <p
                      className={`${styles.emptyState} ${styles.emptyStatePadded}`}
                    >
                      No members added.
                    </p>
                  ) : (
                    draftCareTeam.map((member, idx) => (
                      <div key={idx} className={styles.teamMemberRow}>
                        <div className={styles.memberInfo}>
                          <strong>{member.role}</strong> -{member.doctor_name}
                          <span className={styles.deptBadge}>
                            {member.department_name}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveCareTeamMember(member.doctor_id)
                          }
                          className={styles.removeMemberBtn}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowCareTeamModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCareTeam}
                  className={styles.saveBtn}
                  disabled={isSavingCareTeam}
                >
                  {isSavingCareTeam ? "Saving..." : "Save Team"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showIndexEditModal && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.careTeamModal} ${styles.indexModal}`}>
              <div className={styles.modalHeader}>
                <h3>Edit Index Page Numbers</h3>
                <button
                  onClick={() => setShowIndexEditModal(false)}
                  className={styles.closeModalBtn}
                >
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.indexModalDesc}>
                  Fill in the document names and page numbers for the index
                  before printing. Leave blank if not applicable.
                </p>
                {indexPageData.map((item, idx) => (
                  <div key={idx} className={styles.indexRow}>
                    <div className={styles.indexNumber}>{idx + 1}.</div>
                    <input
                      type="text"
                      placeholder="Document Name"
                      className={`${styles.selectInput} ${styles.indexInputFlex}`}
                      value={item.name}
                      onChange={(e) => {
                        setIndexPageData((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, name: e.target.value } : row,
                          ),
                        );
                      }}
                    />
                    <input
                      type="text"
                      placeholder="From"
                      className={`${styles.selectInput} ${styles.indexInputSmall}`}
                      value={item.from || ""}
                      onChange={(e) => {
                        setIndexPageData((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, from: e.target.value } : row,
                          ),
                        );
                      }}
                    />
                    <input
                      type="text"
                      placeholder="To"
                      className={`${styles.selectInput} ${styles.indexInputSmall}`}
                      value={item.to || ""}
                      onChange={(e) => {
                        setIndexPageData((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, to: e.target.value } : row,
                          ),
                        );
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIndexPageData((prev) =>
                          prev.filter(
                            (_, indexToRemove) => indexToRemove !== idx,
                          ),
                        );
                      }}
                      className={styles.indexDeleteBtn}
                      title="Remove Row"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setIndexPageData((prev) => [
                      ...prev,
                      { name: "", from: "", to: "" },
                    ])
                  }
                  className={`${styles.btnSecondarySmall} ${styles.addRowBtn}`}
                >
                  <FaPlus size={10} className={styles.addRowIcon} /> Add Row
                </button>

                <div className={styles.indexFooterContainer}>
                  <h4 className={styles.indexFooterTitle}>
                    Footer Total Pages Summary
                  </h4>
                  <div className={styles.indexFooterFlex}>
                    <span className={styles.indexFooterLabel}>
                      Page No. From:
                    </span>
                    <input
                      type="text"
                      className={`${styles.selectInput} ${styles.indexInputSmall}`}
                      value={indexFooterData.from || ""}
                      onChange={(e) =>
                        setIndexFooterData((prev) => ({
                          ...prev,
                          from: e.target.value,
                        }))
                      }
                    />
                    <span className={styles.indexFooterLabel}>To:</span>
                    <input
                      type="text"
                      className={`${styles.selectInput} ${styles.indexInputSmall}`}
                      value={indexFooterData.to || ""}
                      onChange={(e) =>
                        setIndexFooterData((prev) => ({
                          ...prev,
                          to: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowIndexEditModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizeIndexPrint}
                  className={styles.saveBtn}
                >
                  <FaPrint className={styles.printIcon} /> Print Index
                </button>
              </div>
            </div>
          </div>
        )}

        {showPrintLanguageModal && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.careTeamModal} ${styles.langModal}`}>
              <div className={styles.modalHeader}>
                <h3>Select Print Language</h3>
                <button
                  onClick={closePrintLanguageModal}
                  className={styles.closeModalBtn}
                >
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.langBtnContainer}>
                  {PRINT_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`${styles.btnSecondarySmall} ${styles.langBtn}`}
                      onClick={() => handleLanguageSelected(lang.code)}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <AftercareSessionBooking
          isOpen={showAftercareModal}
          onClose={() => setShowAftercareModal(false)}
          patientId={patientId || ""}
          careTeam={patient?.care_team}
          onSuccess={() => {
            setHasAftercareSessions(true);
            setSessionRefreshCounter((prev) => prev + 1);
          }}
        />

        <div className={styles.hiddenPrintContainer}>
          <AssessmentPrintTemplate ref={printIndexRef} data={indexPrintData} />

          <PlanTemplate ref={printPlanRef} data={planPrintData} />

          <AssessmentPrintTemplate
            ref={printSinglePlanInfoRef}
            data={singlePlanPrintData}
          />

          <AssessmentPrintTemplate
            ref={printAllSessionsRef}
            data={allSessionsPrintData}
          />

          <AssessmentPrintTemplate
            ref={printAssessmentsRef}
            data={assessmentsPrintData}
          />
          <SingleAssessmentPrintTemplate
            ref={printSingleAssessmentRef}
            data={singleAssessmentPrintData}
          />

          <ConsentPrintTemplate ref={printConsentRef} data={consentPrintData} />
        </div>

        <AftercareReportPrinter
          ref={aftercarePrinterRef}
          patientId={patientId || ""}
          patientDetails={{
            name: fullName,
            UHID: patient.UHID,
            age: patient.patient_age,
            gender: patient.gender,
            phone: patient.patient_phone,
          }}
          onStateChange={setIsPrintingAftercare}
        />
      </div>
    </ErrorBoundary>
  );
};

export default PatientView;
