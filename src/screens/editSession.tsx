import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaStethoscope,
  FaClipboardList,
  FaChartLine,
} from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/editSession.module.css";
import CircularProgress from "@mui/material/CircularProgress";
import PrescriptionFormComponent from "../components/PrescriptionFormComponent";

interface SessionFormData {
  session_number: string;
  session_type: string;
  originalStatus: string;
  aftercare_team?: any;
  issue_dealt_with: string;
  counselor_impression: string;
  therepy_date: string;
  // Follow-up Medical Review
  patient_complaints: string;
  // Follow-up Counselor Review
  issues_addressed: string;
  recovery_status: string;
  other_communication: string;
  recovery_domain_scores: {
    alcohol_drug_free: number;
    physical_well_being: number;
    family_relationships: number;
    crime_free_status: number;
    gainfully_employed: number;
    financial_stability: number;
  };
  total_recovery_score: number;
  clinical_observations: {
    withdrawal_symptoms: string[];
    appetite: string | null;
    physical_appearance: string | null;
  };
  rehab_indicators: {
    craving_intensity: string | null;
    behavioural_compliance: string | null;
    emotional_stability: string | null;
    sleep_quality: string | null;
    session_impression: string | null;
  };
  actionType: string;
  typeOfMeet: string;
  sessionStartTime: string;
  sessionEndTime: string;
  sessionDuration: string;
}

const DOMAIN_OPTIONS = {
  alcohol_drug_free: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Continues to drink" },
    { value: 2, label: "2 = Substituting with drugs" },
    { value: 3, label: "3 = Severe relapses, sober" },
    { value: 4, label: "4 = Mild relapses, sober" },
    { value: 5, label: "5 = No relapse" },
  ],
  physical_well_being: [
    { value: 0, label: "0 = No news" },
    {
      value: 1,
      label:
        "1 = Persistent inability to function due to poor physical / psychological condition",
    },
    {
      value: 2,
      label: "2 = Unable to function most of the time due to poor condition",
    },
    { value: 3, label: "3 = Average health with transient problems" },
    {
      value: 4,
      label: "4 = Absent or minimal symptoms but functions well generally",
    },
    { value: 5, label: "5 = Superior functioning with no problems" },
  ],
  family_relationships: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Disowned by family" },
    { value: 2, label: "2 = By and large alienated from family" },
    { value: 3, label: "3 = Mixed or indifferent feelings" },
    { value: 4, label: "4 = Usually friendly, minor conflicts" },
    { value: 5, label: "5 = Highly supportive" },
  ],
  crime_free_status: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Arrest for illicit sale and production" },
    { value: 2, label: "2 = Arrest for violent behaviour" },
    { value: 3, label: "3 = Violent under intoxication (not arrested)" },
    { value: 4, label: "4 = Crime free" },
    { value: 5, label: "5 = Adopting higher values" },
  ],
  gainfully_employed: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Illegal employment" },
    { value: 2, label: "2 = Unemployed" },
    { value: 3, label: "3 = Irregular for work" },
    { value: 4, label: "4 = Mostly regular" },
    { value: 5, label: "5 = Regular for work and productive" },
  ],
  financial_stability: [
    { value: 0, label: "0 = No news" },
    { value: 1, label: "1 = Severe debts, difficult to repay" },
    { value: 2, label: "2 = Moderate level of debts, can be repaid" },
    { value: 3, label: "3 = No debts, no savings" },
    { value: 4, label: "4 = Average savings" },
    { value: 5, label: "5 = High level of savings" },
  ],
};

const SYMPTOM_OPTIONS = ["tremors", "sweating", "nausea", "insomnia", "none"];
const CRAVING_OPTIONS = ["none", "mild", "moderate", "strong", "overwhelming"];
const COMPLIANCE_OPTIONS = [
  "resistant",
  "passive",
  "cooperative",
  "engaged",
  "proactive",
];
const APPETITE_OPTIONS = ["poor", "fair", "normal", "good"];
const APPEARANCE_OPTIONS = [
  "dishevelled",
  "unkempt",
  "adequate",
  "well_groomed",
];

const EMOTIONAL_OPTIONS = [
  { label: "Volatile", value: "volatile", emoji: "🌋" },
  { label: "Distressed", value: "distressed", emoji: "😭" },
  { label: "Unsettled", value: "unsettled", emoji: "🌪️" },
  { label: "Stable", value: "stable", emoji: "🧘" },
  { label: "Regulated", value: "regulated", emoji: "☀️" },
];

const SLEEP_OPTIONS = [
  { label: "None", value: "none", emoji: "🚫" },
  { label: "Poor", value: "poor", emoji: "😫" },
  { label: "Disturbed", value: "disturbed", emoji: "😵‍💫" },
  { label: "Fair", value: "fair", emoji: "😌" },
  { label: "Restful", value: "restful", emoji: "😴" },
];

const IMPRESSION_OPTIONS = [
  { label: "Concerning", value: "concerning", emoji: "🚨" },
  { label: "Below Exp.", value: "below_expectations", emoji: "📉" },
  { label: "Neutral", value: "neutral", emoji: "😐" },
  { label: "Positive", value: "positive", emoji: "📈" },
  { label: "Breakthrough", value: "breakthrough", emoji: "🌟" },
];

const formatLabel = (val: string) =>
  val.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const parseTime = (timeStr?: string) => {
  if (!timeStr) return "";
  if (timeStr.includes("T"))
    return new Date(timeStr).toTimeString().slice(0, 5);
  return timeStr.slice(0, 5);
};

const calculateDurationStr = (start: string, end: string) => {
  if (!start || !end) return "0m";
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  const diffMinutes =
    endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  if (diffMinutes <= 0) return "0m";
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const calculateDurationMinutes = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  const diffMinutes =
    endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  return diffMinutes > 0 ? diffMinutes : 0;
};

const EditSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const sessionUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isPhysiotherapy =
    sessionUser.organization_industry?.toLowerCase().trim() === "physiotherapy";

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [includePrescription, setIncludePrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  const [formData, setFormData] = useState<SessionFormData>({
    session_number: "1",
    session_type: "Individual",
    originalStatus: "",
    issue_dealt_with: "",
    counselor_impression: "",
    therepy_date: "",
    patient_complaints: "",
    issues_addressed: "",
    recovery_status: "",
    other_communication: "",
    recovery_domain_scores: {
      alcohol_drug_free: 0,
      physical_well_being: 0,
      family_relationships: 0,
      crime_free_status: 0,
      gainfully_employed: 0,
      financial_stability: 0,
    },
    total_recovery_score: 0,
    clinical_observations: {
      withdrawal_symptoms: ["none"],
      appetite: null,
      physical_appearance: null,
    },
    rehab_indicators: {
      craving_intensity: null,
      behavioural_compliance: null,
      emotional_stability: null,
      sleep_quality: null,
      session_impression: null,
    },
    actionType: "completed",
    typeOfMeet: "",
    sessionStartTime: "10:00",
    sessionEndTime: "10:30",
    sessionDuration: "30m",
  });

  const [errors, setErrors] = useState<Partial<SessionFormData>>({});

  const [departments, setDepartments] = useState<any[]>([]);
  const [physicianDeptId, setPhysicianDeptId] = useState("");
  const [physicianDoctors, setPhysicianDoctors] = useState<any[]>([]);
  const [isLoadingPhysicians, setIsLoadingPhysicians] = useState(false);
  const [selectedPhysician, setSelectedPhysician] = useState("");

  const [counsellorDeptId, setCounsellorDeptId] = useState("");
  const [counsellorDoctors, setCounsellorDoctors] = useState<any[]>([]);
  const [isLoadingCounsellors, setIsLoadingCounsellors] = useState(false);
  const [selectedCounsellor, setSelectedCounsellor] = useState("");

  const isScheduledAftercare =
    formData.session_type === "Aftercare" &&
    formData.originalStatus?.toLowerCase() === "scheduled";

  const isFollowUp = formData.session_type === "Follow-up";

  const showAdvancedClinical =
    !isScheduledAftercare &&
    !isFollowUp &&
    (formData.session_type === "Individual" ||
      formData.session_type === "Aftercare");

  useEffect(() => {
    if (isScheduledAftercare) {
      api
        .get("/departments")
        .then((res) => setDepartments(res.data.departments || []))
        .catch((err) => console.error("Failed to load departments", err));
    }
  }, [isScheduledAftercare]);

  useEffect(() => {
    if (
      isScheduledAftercare &&
      departments.length > 0 &&
      formData.aftercare_team
    ) {
      const targetPhysicianId = formData.aftercare_team.physician_id;
      const targetCounsellorId = formData.aftercare_team.counsellor_id;

      Promise.all(
        departments.map((dept) =>
          api.get(`/department/${dept._id}`).catch(() => null),
        ),
      ).then((responses) => {
        let foundPhysicianDept = "";
        let foundCounsellorDept = "";
        const deptMembersMap: Record<string, any[]> = {};

        responses.forEach((res, index) => {
          if (!res) return;
          const deptId = departments[index]._id;
          const members = res.data.members || [];
          deptMembersMap[deptId] = members;

          if (
            targetPhysicianId &&
            members.some(
              (m: any) => String(m._id) === String(targetPhysicianId),
            )
          ) {
            foundPhysicianDept = deptId;
          }
          if (
            targetCounsellorId &&
            members.some(
              (m: any) => String(m._id) === String(targetCounsellorId),
            )
          ) {
            foundCounsellorDept = deptId;
          }
        });

        if (foundPhysicianDept) {
          setPhysicianDeptId(foundPhysicianDept);
          setPhysicianDoctors(deptMembersMap[foundPhysicianDept]);
          setSelectedPhysician(String(targetPhysicianId));
        }
        if (foundCounsellorDept) {
          setCounsellorDeptId(foundCounsellorDept);
          setCounsellorDoctors(deptMembersMap[foundCounsellorDept]);
          setSelectedCounsellor(String(targetCounsellorId));
        }
      });
    }
  }, [isScheduledAftercare, departments, formData.aftercare_team]);

  const handlePhysicianDeptChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newDeptId = e.target.value;
    setPhysicianDeptId(newDeptId);
    setSelectedPhysician("");
    if (!newDeptId) return setPhysicianDoctors([]);
    setIsLoadingPhysicians(true);
    try {
      const res = await api.get(`/department/${newDeptId}`);
      setPhysicianDoctors(res.data.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPhysicians(false);
    }
  };

  const handleCounsellorDeptChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newDeptId = e.target.value;
    setCounsellorDeptId(newDeptId);
    setSelectedCounsellor("");
    if (!newDeptId) return setCounsellorDoctors([]);
    setIsLoadingCounsellors(true);
    try {
      const res = await api.get(`/department/${newDeptId}`);
      setCounsellorDoctors(res.data.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCounsellors(false);
    }
  };

  const fetchSessionDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/get/session/details/${sessionId}`);

      if (response.data?.data) {
        const { session_info, prescription } = response.data.data;

        const startStr =
          parseTime(
            session_info?.session_start_time ||
              session_info?.therepy_start_time,
          ) || "10:00";
        const endStr =
          parseTime(
            session_info?.session_end_time || session_info?.therepy_end_time,
          ) || "10:30";

        const domainScores = session_info?.recovery_domain_scores || {
          alcohol_drug_free: 0,
          physical_well_being: 0,
          family_relationships: 0,
          crime_free_status: 0,
          gainfully_employed: 0,
          financial_stability: 0,
        };

        const totalScore = Object.values(domainScores).reduce(
          (sum: number, val: any) => sum + Number(val || 0),
          0,
        );

        setFormData({
          session_number: (session_info?.session_number ?? 1).toString(),
          session_type: session_info?.therepy_type || "Individual",
          originalStatus: session_info?.status || "",
          aftercare_team: session_info?.aftercare_team || null,
          issue_dealt_with: session_info?.issue_dealt_with || "",
          counselor_impression: session_info?.counselor_impression || "",
          therepy_date: session_info?.therepy_date
            ? session_info.therepy_date.split("T")[0]
            : new Date().toISOString().split("T")[0],
          patient_complaints: session_info?.patient_complaints || "",
          issues_addressed: session_info?.issues_addressed || "",
          recovery_status: session_info?.recovery_status || "",
          other_communication: session_info?.other_communication || "",
          recovery_domain_scores: domainScores,
          total_recovery_score:
            session_info?.total_recovery_score ?? totalScore,
          clinical_observations: {
            withdrawal_symptoms: session_info?.clinical_observations
              ?.withdrawal_symptoms?.length
              ? session_info.clinical_observations.withdrawal_symptoms
              : ["none"],
            appetite: session_info?.clinical_observations?.appetite || null,
            physical_appearance:
              session_info?.clinical_observations?.physical_appearance || null,
          },
          rehab_indicators: {
            craving_intensity:
              session_info?.rehab_indicators?.craving_intensity || null,
            behavioural_compliance:
              session_info?.rehab_indicators?.behavioural_compliance || null,
            emotional_stability:
              session_info?.rehab_indicators?.emotional_stability || null,
            sleep_quality:
              session_info?.rehab_indicators?.sleep_quality || null,
            session_impression:
              session_info?.rehab_indicators?.session_impression || null,
          },
          actionType: [
            "completed",
            "Completed",
            "No Show",
            "Cancelled",
          ].includes(session_info?.status)
            ? session_info.status.toLowerCase()
            : "completed",
          typeOfMeet:
            session_info?.Typeofmeet || session_info?.typeOfMeet || "",
          sessionStartTime: startStr,
          sessionEndTime: endStr,
          sessionDuration: calculateDurationStr(startStr, endStr),
        });

        if (
          prescription &&
          prescription.medications &&
          prescription.medications.length > 0
        ) {
          setIncludePrescription(true);
          setPrescriptionData(prescription);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Failed to load session details");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sessionDuration: calculateDurationStr(
        prev.sessionStartTime,
        prev.sessionEndTime,
      ),
    }));
  }, [formData.sessionStartTime, formData.sessionEndTime]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SessionFormData])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const setRehabIndicator = (
    field: keyof SessionFormData["rehab_indicators"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      rehab_indicators: { ...prev.rehab_indicators, [field]: value },
    }));
  };

  const setClinicalObservation = (
    field: keyof SessionFormData["clinical_observations"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      clinical_observations: { ...prev.clinical_observations, [field]: value },
    }));
  };

  const toggleSymptom = (symptom: string) => {
    setFormData((prev) => {
      let currentSymptoms = [...prev.clinical_observations.withdrawal_symptoms];
      if (symptom === "none") currentSymptoms = ["none"];
      else {
        currentSymptoms = currentSymptoms.filter((s) => s !== "none");
        if (currentSymptoms.includes(symptom))
          currentSymptoms = currentSymptoms.filter((s) => s !== symptom);
        else currentSymptoms.push(symptom);
      }
      if (currentSymptoms.length === 0) currentSymptoms = ["none"];
      return {
        ...prev,
        clinical_observations: {
          ...prev.clinical_observations,
          withdrawal_symptoms: currentSymptoms,
        },
      };
    });
  };

  const handleDomainScoreChange = (
    field: keyof SessionFormData["recovery_domain_scores"],
    val: number,
  ) => {
    setFormData((prev) => {
      const updatedScores = {
        ...prev.recovery_domain_scores,
        [field]: val,
      };
      const newTotal = Object.values(updatedScores).reduce(
        (sum, score) => sum + Number(score || 0),
        0,
      );
      return {
        ...prev,
        recovery_domain_scores: updatedScores,
        total_recovery_score: newTotal,
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SessionFormData> = {};

    if (isScheduledAftercare) {
      if (!selectedPhysician) newErrors.actionType = "Physician is required";
      if (!selectedCounsellor) newErrors.actionType = "Counsellor is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      if (
        formData.session_type === "Aftercare" ||
        formData.session_type === "Follow-up"
      ) {
        const startDateTime = new Date(
          `${formData.therepy_date}T${formData.sessionStartTime}:00`,
        );
        const endDateTime = new Date(
          `${formData.therepy_date}T${formData.sessionEndTime}:00`,
        );
        const durationInMinutes = calculateDurationMinutes(
          formData.sessionStartTime,
          formData.sessionEndTime,
        );

        let prescriptionPayload = null;
        if (
          includePrescription &&
          prescriptionData &&
          prescriptionData.medications?.length > 0
        ) {
          prescriptionPayload = {
            vitals: {
              weight:
                prescriptionData.weight ||
                prescriptionData.vitals?.weight ||
                "",
              bp: prescriptionData.bp || prescriptionData.vitals?.bp || "",
            },
            medications: prescriptionData.medications,
            notes: prescriptionData.notes || "",
            diagnosis: formData.session_type || "General Therapy",
          };
        }

        const aftercarePayload: any = {
          session_start_time: startDateTime.toISOString(),
          session_end_time: endDateTime.toISOString(),
          manual_duration: durationInMinutes,
          therepy_date: formData.therepy_date,
          counselor_impression: formData.counselor_impression,
          status: formData.actionType,
          prescription: prescriptionPayload
            ? JSON.stringify(prescriptionPayload)
            : undefined,
        };

        if (formData.session_type === "Aftercare") {
          aftercarePayload.Typeofmeet = formData.typeOfMeet;
          aftercarePayload.rehab_indicators = formData.rehab_indicators;
          aftercarePayload.clinical_observations =
            formData.clinical_observations;

          if (isScheduledAftercare) {
            const physician = physicianDoctors.find(
              (d) => d._id === selectedPhysician,
            );
            const counsellor = counsellorDoctors.find(
              (d) => d._id === selectedCounsellor,
            );
            if (physician) {
              aftercarePayload.physician_id = physician._id;
              aftercarePayload.physician_name = `${physician.doctor_first_name} ${physician.doctor_last_name}`;
            }
            if (counsellor) {
              aftercarePayload.counsellor_id = counsellor._id;
              aftercarePayload.counsellor_name = `${counsellor.doctor_first_name} ${counsellor.doctor_last_name}`;
            }
          }
        }

        if (formData.session_type === "Follow-up") {
          aftercarePayload.patient_complaints = formData.patient_complaints;
          aftercarePayload.issues_addressed = formData.issues_addressed;
          aftercarePayload.recovery_status = formData.recovery_status;
          aftercarePayload.other_communication = formData.other_communication;
          aftercarePayload.recovery_domain_scores =
            formData.recovery_domain_scores;
          aftercarePayload.total_recovery_score = formData.total_recovery_score;
        }

        await api.patch(`/edit/aftercare/${sessionId}`, aftercarePayload);
      } else {
        const standardPayload = {
          session_number: parseInt(formData.session_number, 10),
          session_type: formData.session_type,
          issue_dealt_with: formData.issue_dealt_with,
          counselor_impression: formData.counselor_impression,
          therepy_date: formData.therepy_date,
          clinical_observations: showAdvancedClinical
            ? formData.clinical_observations
            : null,
          rehab_indicators: showAdvancedClinical
            ? formData.rehab_indicators
            : null,
          prescription: null,
        };

        await api.put(`/edit/session/${sessionId}`, standardPayload);
      }

      alert("Session updated successfully");
      navigate(`/sessionDetails/${sessionId}`, { replace: true });
    } catch (error: any) {
      alert(
        error.response?.data?.msg ||
          error.response?.data?.error ||
          "Update failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPillSelector = (
    options: string[],
    currentValue: string | null,
    onClick: (val: string) => void,
  ) => (
    <div className={styles.pillSelector}>
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          className={`${styles.togglePill} ${currentValue === opt ? styles.togglePillActive : ""}`}
          onClick={() => onClick(opt)}
        >
          {formatLabel(opt)}
        </button>
      ))}
    </div>
  );

  const renderEmojiSelector = (
    options: { label: string; value: string; emoji: string }[],
    currentValue: string | null,
    onClick: (val: string) => void,
  ) => (
    <div className={styles.emojiGroup}>
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          className={`${styles.emojiBtn} ${currentValue === opt.value ? styles.emojiBtnActive : ""}`}
          onClick={() => onClick(opt.value)}
          title={opt.label}
        >
          <span className={styles.emojiIcon}>{opt.emoji}</span>
          <span className={styles.emojiLabel}>{opt.label}</span>
        </button>
      ))}
    </div>
  );

  if (isLoading)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <CircularProgress
          size={50}
          thickness={4}
          style={{ color: "#007b8e" }}
        />
        <p style={{ color: "#007b8e", fontWeight: 600 }}>
          Loading session details...
        </p>
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft
            size={16}
            style={{ cursor: "pointer", color: "#6b7280", marginRight: "5px" }}
            onClick={() => navigate(-1)}
          />
          {isScheduledAftercare
            ? "Reschedule Aftercare Session"
            : isFollowUp
              ? "Edit Follow-up Session"
              : "Edit Session Notes"}
        </h1>
      </div>

      <form onSubmit={handleUpdate}>
        {isScheduledAftercare ? (
          <div
            className={styles.card}
            style={{ maxWidth: "800px", margin: "0 auto" }}
          >
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Session Scheduling</h2>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="therepy_date" className={styles.label}>
                Session Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                id="therepy_date"
                name="therepy_date"
                value={formData.therepy_date}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.rowGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Start Time</label>
                <input
                  type="time"
                  name="sessionStartTime"
                  value={formData.sessionStartTime}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>End Time</label>
                <input
                  type="time"
                  name="sessionEndTime"
                  value={formData.sessionEndTime}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
            </div>

            <hr
              style={{
                borderTop: "1px solid #e5e7eb",
                margin: "1.5rem 0 1rem 0",
              }}
            />
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Care Team Assignment</h2>
            </div>

            <div className={styles.rowGrid} style={{ marginBottom: "1rem" }}>
              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>Physician Dept *</label>
                <select
                  value={physicianDeptId}
                  onChange={handlePhysicianDeptChange}
                  className={styles.input}
                >
                  <option value="">-- Select --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>Assign Physician *</label>
                <select
                  value={selectedPhysician}
                  onChange={(e) => setSelectedPhysician(e.target.value)}
                  className={styles.input}
                  disabled={!physicianDeptId || isLoadingPhysicians}
                >
                  <option value="">
                    {isLoadingPhysicians ? "Loading..." : "-- Select --"}
                  </option>
                  {physicianDoctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.doctor_first_name} {doc.doctor_last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Counsellor Dept *</label>
                <select
                  value={counsellorDeptId}
                  onChange={handleCounsellorDeptChange}
                  className={styles.input}
                >
                  <option value="">-- Select --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Assign Counsellor *</label>
                <select
                  value={selectedCounsellor}
                  onChange={(e) => setSelectedCounsellor(e.target.value)}
                  className={styles.input}
                  disabled={!counsellorDeptId || isLoadingCounsellors}
                >
                  <option value="">
                    {isLoadingCounsellors ? "Loading..." : "-- Select --"}
                  </option>
                  {counsellorDoctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.doctor_first_name} {doc.doctor_last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.actionType && (
              <span
                className={styles.errorText}
                style={{ display: "block", marginTop: "10px" }}
              >
                {errors.actionType}
              </span>
            )}
          </div>
        ) : (
          <div className={styles.mainGrid}>
            {/* ── LEFT COLUMN ──────────────────────────── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* ── FOLLOW-UP SPECIFIC: MEDICAL REVIEW ── */}
              {isFollowUp && (
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      <FaStethoscope color="var(--primary)" /> Medical Review
                    </h2>
                  </div>
                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label
                      htmlFor="patient_complaints"
                      className={styles.label}
                    >
                      Patient complaints / findings
                    </label>
                    <textarea
                      id="patient_complaints"
                      name="patient_complaints"
                      value={formData.patient_complaints}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      placeholder="Note physical symptoms, patient concerns, and medical findings..."
                      style={{ minHeight: "90px" }}
                    />
                  </div>
                </div>
              )}

              {/* ── FOLLOW-UP SPECIFIC: COUNSELOR REVIEW ── */}
              {isFollowUp && (
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      <FaClipboardList color="var(--primary)" /> Counselor
                      Review
                    </h2>
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="issues_addressed" className={styles.label}>
                      Issues addressed in counselling
                    </label>
                    <textarea
                      id="issues_addressed"
                      name="issues_addressed"
                      value={formData.issues_addressed}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      placeholder="Detail the issues covered..."
                      style={{ minHeight: "75px" }}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="recovery_status" className={styles.label}>
                      Recovery status: abstinence and progress
                    </label>
                    <textarea
                      id="recovery_status"
                      name="recovery_status"
                      value={formData.recovery_status}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      placeholder="Note abstinence status, relapse triggers, overall progress..."
                      style={{ minHeight: "75px" }}
                    />
                  </div>
                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label
                      htmlFor="other_communication"
                      className={styles.label}
                    >
                      Other communication: calls, letters, etc.
                    </label>
                    <textarea
                      id="other_communication"
                      name="other_communication"
                      value={formData.other_communication}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      placeholder="Record any family calls, letters, or external contacts..."
                      style={{ minHeight: "60px" }}
                    />
                  </div>
                </div>
              )}

              {/* Standard Clinical Notes (for Non-Followup sessions) */}
              {!isFollowUp && (
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Clinical Notes</h2>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="issue_dealt_with" className={styles.label}>
                      Issue Dealt With
                    </label>
                    <textarea
                      id="issue_dealt_with"
                      name="issue_dealt_with"
                      value={formData.issue_dealt_with}
                      disabled
                      readOnly
                      className={styles.textarea}
                      placeholder="No issues recorded."
                      style={{
                        minHeight: "100px",
                        backgroundColor: "#e5e7eb",
                        color: "#6b7280",
                        cursor: "not-allowed",
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label
                      htmlFor="counselor_impression"
                      className={styles.label}
                    >
                      Counselor Impression{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      id="counselor_impression"
                      name="counselor_impression"
                      value={formData.counselor_impression}
                      onChange={handleInputChange}
                      className={`${styles.textarea} ${errors.counselor_impression ? styles.inputError : ""}`}
                      placeholder="Document your clinical impressions, patient progress, and next steps..."
                      style={{ minHeight: "100px" }}
                    />
                  </div>
                </div>
              )}

              {/* Follow-up Counselor Impression */}
              {isFollowUp && (
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      Final Remarks / Impression
                    </h2>
                  </div>
                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label
                      htmlFor="counselor_impression"
                      className={styles.label}
                    >
                      Counselor Impression
                    </label>
                    <textarea
                      id="counselor_impression"
                      name="counselor_impression"
                      value={formData.counselor_impression}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      placeholder="Final remarks or impression..."
                      style={{ minHeight: "80px" }}
                    />
                  </div>
                </div>
              )}

              {/* Prescription Component (Allowed for Aftercare or Follow-up) */}
              {!isPhysiotherapy &&
                (formData.session_type === "Aftercare" || isFollowUp) && (
                  <div className={styles.card} style={{ marginBottom: 0 }}>
                    <div
                      className={styles.cardHeader}
                      style={{
                        marginBottom: includePrescription ? "1rem" : "0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h2 className={styles.cardTitle}>Medical Prescription</h2>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#4b5563",
                          }}
                        >
                          {includePrescription ? "Included" : "Add Rx"}
                        </label>
                        <input
                          type="checkbox"
                          checked={includePrescription}
                          onChange={(e) =>
                            setIncludePrescription(e.target.checked)
                          }
                          style={{
                            width: "18px",
                            height: "18px",
                            accentColor: "#007b8e",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                    </div>
                    {includePrescription && (
                      <div className={styles.prescriptionWrapper}>
                        <PrescriptionFormComponent
                          initialData={prescriptionData}
                          hideFooter={true}
                          onDataChange={setPrescriptionData}
                        />
                      </div>
                    )}
                  </div>
                )}

              {/* Rehabilitation Indicators (for Individual or standard Aftercare) */}
              {showAdvancedClinical && (
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      Rehabilitation Indicators
                    </h2>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Craving Intensity</label>
                    {renderPillSelector(
                      CRAVING_OPTIONS,
                      formData.rehab_indicators.craving_intensity,
                      (v) => setRehabIndicator("craving_intensity", v),
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Behavioural Compliance
                    </label>
                    {renderPillSelector(
                      COMPLIANCE_OPTIONS,
                      formData.rehab_indicators.behavioural_compliance,
                      (v) => setRehabIndicator("behavioural_compliance", v),
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Emotional Stability</label>
                    {renderEmojiSelector(
                      EMOTIONAL_OPTIONS,
                      formData.rehab_indicators.emotional_stability,
                      (v) => setRehabIndicator("emotional_stability", v),
                    )}
                  </div>

                  <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Sleep Quality</label>
                      {renderEmojiSelector(
                        SLEEP_OPTIONS,
                        formData.rehab_indicators.sleep_quality,
                        (v) => setRehabIndicator("sleep_quality", v),
                      )}
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Session Impression</label>
                      {renderEmojiSelector(
                        IMPRESSION_OPTIONS,
                        formData.rehab_indicators.session_impression,
                        (v) => setRehabIndicator("session_impression", v),
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ────────────────────────── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Session Info */}
              <div className={styles.card} style={{ marginBottom: 0 }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Session Info</h2>
                </div>

                <div className={styles.rowGrid}>
                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label className={styles.label}>Session #</label>
                    <input
                      type="number"
                      name="session_number"
                      value={formData.session_number}
                      disabled
                      readOnly
                      style={{
                        backgroundColor: "#e5e7eb",
                        cursor: "not-allowed",
                        fontWeight: 600,
                      }}
                      className={styles.input}
                    />
                  </div>

                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label className={styles.label}>
                      Session Type <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="session_type"
                      value={formData.session_type}
                      disabled
                      readOnly
                      style={{
                        backgroundColor: "#e5e7eb",
                        color: "#6b7280",
                        cursor: "not-allowed",
                        fontWeight: 600,
                      }}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div
                  className={styles.inputGroup}
                  style={{ marginBottom: 0, marginTop: "1rem" }}
                >
                  <label htmlFor="therepy_date" className={styles.label}>
                    Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="therepy_date"
                    name="therepy_date"
                    value={formData.therepy_date}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              {/* Follow-up Recovery Domain Scores */}
              {isFollowUp && (
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div
                    className={styles.cardHeader}
                    style={{
                      marginBottom: "1rem",
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "0.75rem",
                    }}
                  >
                    <h2 className={styles.cardTitle}>
                      <FaChartLine color="var(--primary)" /> Recovery Domain
                      Scores
                    </h2>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#007b8e",
                        fontSize: "1.05rem",
                      }}
                    >
                      Score: {formData.total_recovery_score} / 30
                    </span>
                  </div>

                  <div className={styles.rowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Alcohol / drug-free life
                      </label>
                      <select
                        value={
                          formData.recovery_domain_scores.alcohol_drug_free
                        }
                        onChange={(e) =>
                          handleDomainScoreChange(
                            "alcohol_drug_free",
                            Number(e.target.value),
                          )
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.alcohol_drug_free.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Physical well-being
                      </label>
                      <select
                        value={
                          formData.recovery_domain_scores.physical_well_being
                        }
                        onChange={(e) =>
                          handleDomainScoreChange(
                            "physical_well_being",
                            Number(e.target.value),
                          )
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.physical_well_being.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.rowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Healthy relationship with family
                      </label>
                      <select
                        value={
                          formData.recovery_domain_scores.family_relationships
                        }
                        onChange={(e) =>
                          handleDomainScoreChange(
                            "family_relationships",
                            Number(e.target.value),
                          )
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.family_relationships.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Crime-free status</label>
                      <select
                        value={
                          formData.recovery_domain_scores.crime_free_status
                        }
                        onChange={(e) =>
                          handleDomainScoreChange(
                            "crime_free_status",
                            Number(e.target.value),
                          )
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.crime_free_status.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                    <div
                      className={styles.inputGroup}
                      style={{ marginBottom: 0 }}
                    >
                      <label className={styles.label}>Gainfully employed</label>
                      <select
                        value={
                          formData.recovery_domain_scores.gainfully_employed
                        }
                        onChange={(e) =>
                          handleDomainScoreChange(
                            "gainfully_employed",
                            Number(e.target.value),
                          )
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.gainfully_employed.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      className={styles.inputGroup}
                      style={{ marginBottom: 0 }}
                    >
                      <label className={styles.label}>
                        Financial stability
                      </label>
                      <select
                        value={
                          formData.recovery_domain_scores.financial_stability
                        }
                        onChange={(e) =>
                          handleDomainScoreChange(
                            "financial_stability",
                            Number(e.target.value),
                          )
                        }
                        className={styles.select}
                      >
                        {DOMAIN_OPTIONS.financial_stability.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Clinical Observations (for Individual or standard Aftercare) */}
              {showAdvancedClinical && (
                <div className={styles.card} style={{ marginBottom: 0 }}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Clinical Observations</h2>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Withdrawal Symptoms Observed (Multi-select)
                    </label>
                    <div className={styles.chipGroup}>
                      {SYMPTOM_OPTIONS.map((sym) => {
                        const isActive =
                          formData.clinical_observations.withdrawal_symptoms.includes(
                            sym,
                          );
                        return (
                          <button
                            type="button"
                            key={sym}
                            className={`${styles.chip} ${isActive ? styles.chipActive : ""} ${sym === "none" && isActive ? styles.chipNone : ""}`}
                            onClick={() => toggleSymptom(sym)}
                          >
                            {formatLabel(sym)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Appetite</label>
                    {renderPillSelector(
                      APPETITE_OPTIONS,
                      formData.clinical_observations.appetite,
                      (v) => setClinicalObservation("appetite", v),
                    )}
                  </div>

                  <div
                    className={styles.inputGroup}
                    style={{ marginBottom: 0 }}
                  >
                    <label className={styles.label}>Physical Appearance</label>
                    {renderPillSelector(
                      APPEARANCE_OPTIONS,
                      formData.clinical_observations.physical_appearance,
                      (v) => setClinicalObservation("physical_appearance", v),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.stickyFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Session"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSession;
