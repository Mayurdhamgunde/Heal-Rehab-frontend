import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../css/EditTherapyPlan.module.css"; // Ensure this uses the new CSS you saved earlier
import api from "../utils/central";
import LocationPicker from "../components/HospitalLocation";
import PrescriptionFormComponent from "../components/PrescriptionFormComponent";
import {
  FaTrash,
  FaUserPlus,
  FaChevronDown,
  FaChevronUp,
  FaArrowLeft,
  FaUserMd,
  FaEdit,
  FaTimes,
  FaSave,
  FaCheckCircle,
} from "react-icons/fa";

interface TherapyPlan {
  therapy_name: string;
  patient_diagnosis: string;
  patient_symptoms: string;
  therapy_duration: string;
  therapy_start: string;
  therapy_end: string;
  therapy_category: string;
  total_amount: string;
  received_amount: string;
  balance: string;
  payment_type: string;
  estimated_sessions: string;
  per_session_amount: string;
}

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
}

interface CareTeamMember {
  department_id: string;
  department_name: string;
  doctor_id: string;
  doctor_name: string;
  role: "Head Counselor" | "Specialist";
}

const EditTherapyPlan: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const sessionUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isPhysiotherapy =
    sessionUser.organization_industry?.toLowerCase().trim() === "physiotherapy";

  // --- UI & Meta States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);

  // --- Core Form States ---
  const [therapyPlan, setTherapyPlan] = useState<TherapyPlan>({
    therapy_name: "",
    patient_diagnosis: "",
    patient_symptoms: "",
    therapy_duration: "",
    therapy_start: "",
    therapy_end: "",
    therapy_category: "",
    total_amount: "0",
    received_amount: "0",
    balance: "0",
    payment_type: "recurring",
    estimated_sessions: "0",
    per_session_amount: "0",
  });
  const [initialTherapyPlan, setInitialTherapyPlan] =
    useState<TherapyPlan>(therapyPlan);
  const [errors, setErrors] = useState<
    Partial<TherapyPlan & { location: string; submit: string }>
  >({});

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [initialLocation, setInitialLocation] = useState<Location | null>(null);

  // --- Prescription States ---
  const [includePrescription, setIncludePrescription] = useState(false);
  const [initialIncludePrescription, setInitialIncludePrescription] =
    useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [initialPrescriptionData, setInitialPrescriptionData] =
    useState<any>(null);

  // --- Payment State ---
  const [showPayment, setShowPayment] = useState(false);

  // --- Care Team States ---
  const [draftCareTeam, setDraftCareTeam] = useState<CareTeamMember[]>([]);
  const [initialCareTeam, setInitialCareTeam] = useState<CareTeamMember[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "Head Counselor" | "Specialist"
  >("Specialist");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);

  const categories = [
    "Addiction Management",
    "Cognitive Behavioral Therapy",
    "Physical Therapy",
  ];
  const paymentTypes = [
    { label: "Recurring", value: "recurring" },
    { label: "One-time", value: "one-time" },
  ];

  // --- Data Fetching ---
  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const response = await api.get(`/get/plan/${planId}`);
        const { therapy_plan, patient_name, patient_id, prescription } =
          response.data;

        setPatientName(patient_name);
        setPatientId(patient_id);

        const start = therapy_plan.therapy_start
          ? therapy_plan.therapy_start.split("T")[0]
          : "";
        const end = therapy_plan.therapy_end
          ? therapy_plan.therapy_end.split("T")[0]
          : "";

        const loadedPlan: TherapyPlan = {
          therapy_name: therapy_plan.therapy_name || "",
          patient_diagnosis: therapy_plan.patient_diagnosis || "",
          patient_symptoms: therapy_plan.patient_symptoms || "",
          therapy_duration: therapy_plan.therapy_duration || "",
          therapy_start: start,
          therapy_end: end,
          therapy_category: therapy_plan.patient_therapy_category || "",
          total_amount: therapy_plan.total_amount?.toString() || "0",
          received_amount: therapy_plan.received_amount?.toString() || "0",
          balance: therapy_plan.balance?.toString() || "0",
          payment_type: therapy_plan.payment_type || "recurring",
          estimated_sessions:
            therapy_plan.estimated_sessions?.toString() || "0",
          per_session_amount:
            therapy_plan.per_session_amount?.toString() || "0",
        };

        setTherapyPlan(loadedPlan);
        setInitialTherapyPlan(loadedPlan);

        // Pre-fill location if present
        if (therapy_plan.location_id) {
          const loc = {
            _id: therapy_plan.location_id,
            id: therapy_plan.location_id,
            name: therapy_plan.location_name || "",
            addressLink: therapy_plan.location_address || "",
            locationId: therapy_plan.location_id,
            createdAt: new Date().toISOString(), // Add fallback
            updatedAt: new Date().toISOString(), // Add fallback
          };
          setSelectedLocation(loc);
          setInitialLocation(loc);
        }

        // Pre-fill prescription if present
        if (prescription) {
          setIncludePrescription(true);
          setInitialIncludePrescription(true);
          setPrescriptionData(prescription);
          setInitialPrescriptionData(prescription);
        }

        // Fetch patient's Care Team using the returned patient_id
        if (patient_id) {
          const patientRes = await api.get(`/patient/${patient_id}`);
          if (patientRes.data?.patientData?.care_team) {
            setDraftCareTeam(patientRes.data.patientData.care_team);
            setInitialCareTeam(patientRes.data.patientData.care_team);
          }
        }
      } catch (error) {
        console.error("Failed to fetch plan details:", error);
        alert("Failed to fetch therapy plan details");
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanData();
  }, [planId, navigate]);

  // Load Departments for Care Team
  useEffect(() => {
    api
      .get("/departments")
      .then((res) => setDepartments(res.data.departments || []))
      .catch((err) => console.error("Failed to load departments", err));
  }, []);

  // Load Doctors when Department changes
  useEffect(() => {
    setSelectedDoctorId("");
    if (selectedDeptId) {
      setIsLoadingDoctors(true);
      api
        .get(`/department/${selectedDeptId}`)
        .then((res) => setDoctors(res.data.members || []))
        .catch((err) => {
          console.error("Failed to load doctors", err);
          setDoctors([]);
        })
        .finally(() => setIsLoadingDoctors(false));
    } else {
      setDoctors([]);
    }
  }, [selectedDeptId]);

  // --- Unsaved Changes Detection ---
  useEffect(() => {
    const isPlanChanged =
      JSON.stringify(therapyPlan) !== JSON.stringify(initialTherapyPlan);
    const isLocationChanged =
      JSON.stringify(selectedLocation) !== JSON.stringify(initialLocation);
    const isPrescriptionToggled =
      includePrescription !== initialIncludePrescription;
    const isPrescriptionDataChanged =
      includePrescription &&
      JSON.stringify(prescriptionData) !==
        JSON.stringify(initialPrescriptionData);
    const isTeamChanged =
      JSON.stringify(draftCareTeam) !== JSON.stringify(initialCareTeam);

    setHasUnsavedChanges(
      isPlanChanged ||
        isLocationChanged ||
        isPrescriptionToggled ||
        isPrescriptionDataChanged ||
        isTeamChanged,
    );
  }, [
    therapyPlan,
    selectedLocation,
    includePrescription,
    prescriptionData,
    draftCareTeam,
    initialTherapyPlan,
    initialLocation,
    initialIncludePrescription,
    initialPrescriptionData,
    initialCareTeam,
  ]);

  // --- Input Handlers & Calculations (Same as CreatePlan) ---
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "received_amount" && value === "") newValue = "0";
    if (name === "per_session_amount") newValue = value.replace(/\./g, "");

    setTherapyPlan((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name as keyof TherapyPlan])
      setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "total_amount" || name === "received_amount") {
      const total =
        name === "total_amount"
          ? parseFloat(value) || 0
          : parseFloat(therapyPlan.total_amount) || 0;
      const received =
        name === "received_amount"
          ? parseFloat(value) || 0
          : parseFloat(therapyPlan.received_amount) || 0;
      setTherapyPlan((prev) => ({
        ...prev,
        [name]: newValue,
        balance: (total - received).toFixed(2),
      }));
    }

    if (name === "estimated_sessions" || name === "per_session_amount") {
      const sessions =
        name === "estimated_sessions"
          ? parseFloat(value) || 0
          : parseFloat(therapyPlan.estimated_sessions) || 0;
      const perSession =
        name === "per_session_amount"
          ? parseFloat(value) || 0
          : parseFloat(therapyPlan.per_session_amount) || 0;
      setTherapyPlan((prev) => ({
        ...prev,
        [name]: newValue,
        total_amount: (sessions * perSession).toFixed(2),
      }));
    }
  };

  const handlePaymentTypeChange = (value: string) => {
    setTherapyPlan((prev) => ({ ...prev, payment_type: value }));
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    if (errors.location) setErrors((prev) => ({ ...prev, location: "" }));
  };

  useEffect(() => {
    if (therapyPlan.therapy_start && therapyPlan.therapy_end) {
      const startDate = new Date(therapyPlan.therapy_start);
      const endDate = new Date(therapyPlan.therapy_end);
      if (endDate >= startDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTherapyPlan((prev) => ({
          ...prev,
          therapy_duration: `${diffDays} days`,
        }));
      }
    }
  }, [therapyPlan.therapy_start, therapyPlan.therapy_end]);

  useEffect(() => {
    if (
      therapyPlan.payment_type === "recurring" &&
      therapyPlan.estimated_sessions &&
      therapyPlan.total_amount
    ) {
      const perSession = Math.round(
        parseFloat(therapyPlan.total_amount) /
          parseFloat(therapyPlan.estimated_sessions),
      );
      if (isFinite(perSession)) {
        setTherapyPlan((prev) => ({
          ...prev,
          per_session_amount: perSession.toString(),
        }));
      }
    }
  }, [
    therapyPlan.total_amount,
    therapyPlan.estimated_sessions,
    therapyPlan.payment_type,
  ]);

  // --- Care Team Handlers ---
  const handleAddCareTeamMember = (e: React.MouseEvent) => {
    e.preventDefault();
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
      setIsAddingTeamMember(false);
    }
  };

  const handleRemoveCareTeamMember = (
    e: React.MouseEvent,
    doctorId: string,
  ) => {
    e.preventDefault();
    setDraftCareTeam((prev) => prev.filter((m) => m.doctor_id !== doctorId));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<
      TherapyPlan & { location: string; submit: string }
    > = {};

    if (!therapyPlan.therapy_name.trim()) newErrors.therapy_name = "Required";
    if (!therapyPlan.patient_diagnosis.trim())
      newErrors.patient_diagnosis = "Required";
    if (!therapyPlan.patient_symptoms.trim())
      newErrors.patient_symptoms = "Required";
    if (!therapyPlan.therapy_duration.trim())
      newErrors.therapy_duration = "Required";
    if (!therapyPlan.therapy_start) newErrors.therapy_start = "Required";
    if (!therapyPlan.therapy_end) newErrors.therapy_end = "Required";
    if (!therapyPlan.therapy_category.trim())
      newErrors.therapy_category = "Required";
    if (!selectedLocation) newErrors.location = "Required";

    if (showPayment) {
      if (!therapyPlan.total_amount.toString().trim())
        newErrors.total_amount = "Required";
      if (!therapyPlan.received_amount.toString().trim())
        newErrors.received_amount = "Required";
      if (
        therapyPlan.payment_type === "recurring" &&
        !therapyPlan.per_session_amount.toString().trim()
      ) {
        newErrors.per_session_amount = "Required";
      }
      if (
        therapyPlan.payment_type === "one-time" &&
        parseFloat(therapyPlan.received_amount) !==
          parseFloat(therapyPlan.total_amount)
      ) {
        newErrors.received_amount = "Requires full amount";
      }
    }

    if (therapyPlan.therapy_start && therapyPlan.therapy_end) {
      const startDate = new Date(therapyPlan.therapy_start);
      const endDate = new Date(therapyPlan.therapy_end);
      if (endDate < startDate)
        newErrors.therapy_end = "Must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateTherapyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      // 1. Sync Care Team if it changed
      if (
        patientId &&
        JSON.stringify(draftCareTeam) !== JSON.stringify(initialCareTeam)
      ) {
        await api.put(`/assigning/patient/${patientId}`, {
          care_team: draftCareTeam,
        });
        setInitialCareTeam(draftCareTeam);
      }

      // 2. Prepare Form Data
      const formData: any = {
        therapy_name: therapyPlan.therapy_name,
        patient_diagnosis: therapyPlan.patient_diagnosis,
        patient_symptoms: therapyPlan.patient_symptoms,
        therapy_duration: therapyPlan.therapy_duration,
        therapy_start: therapyPlan.therapy_start,
        therapy_end: therapyPlan.therapy_end,
        patient_therapy_category: therapyPlan.therapy_category,
        total_amount: therapyPlan.total_amount,
        received_amount: therapyPlan.received_amount,
        balance: therapyPlan.balance,
        payment_type: therapyPlan.payment_type,
        estimated_sessions: parseInt(therapyPlan.estimated_sessions),
        per_session_amount: parseFloat(therapyPlan.per_session_amount),
        location_id: selectedLocation?._id,
        location_name: selectedLocation?.name,
        location_address: selectedLocation?.addressLink,
      };

      // 3. Append Prescription if toggled on and has data
      if (
        includePrescription &&
        prescriptionData &&
        prescriptionData.medications?.length > 0
      ) {
        formData.prescription = {
          prescription_number: prescriptionData.prescription_number || null,
          vitals: {
            weight: prescriptionData.vitals?.weight || "",
            bp: prescriptionData.vitals?.bp || "",
          },
          medications: prescriptionData.medications,
          notes: prescriptionData.notes || "",
          diagnosis:
            therapyPlan.patient_diagnosis || "Therapy Plan Prescription",
        };
      }

      const response = await api.put(`/update/plan/${planId}`, formData);

      if (response.status === 200) {
        setHasUnsavedChanges(false);
        setInitialTherapyPlan(therapyPlan);
        setInitialLocation(selectedLocation);
        setInitialIncludePrescription(includePrescription);
        setInitialPrescriptionData(prescriptionData);

        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          navigate(-1);
        }, 2000);
      }
    } catch (error: any) {
      console.error(error);
      setErrors({
        ...errors,
        submit: error.response?.data?.msg || "Failed to update therapy plan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (window.confirm("Are you sure you want to discard all changes?")) {
      setTherapyPlan(initialTherapyPlan);
      setSelectedLocation(initialLocation);
      setIncludePrescription(initialIncludePrescription);
      setPrescriptionData(initialPrescriptionData);
      setDraftCareTeam(initialCareTeam);
      setErrors({});
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div
            className={`${styles.skeleton}`}
            style={{ width: "200px", height: "2rem" }}
          ></div>
        </div>
        <div className={styles.mainGrid}>
          <div className={styles.card}>
            <div
              className={`${styles.skeleton}`}
              style={{ width: "40%", height: "1.5rem", marginBottom: "1rem" }}
            ></div>
            <div
              className={`${styles.skeleton}`}
              style={{ width: "100%", height: "2.5rem", marginBottom: "1rem" }}
            ></div>
            <div
              className={`${styles.skeleton}`}
              style={{ width: "100%", height: "5rem" }}
            ></div>
          </div>
          <div className={styles.card}>
            <div
              className={`${styles.skeleton}`}
              style={{ width: "40%", height: "1.5rem", marginBottom: "1rem" }}
            ></div>
            <div
              className={`${styles.skeleton}`}
              style={{ width: "100%", height: "2.5rem", marginBottom: "1rem" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {showSuccessPopup && (
        <div className={styles.successPopup}>
          <FaCheckCircle className={styles.successIcon} />
          <h3 className={styles.successTitle}>Success!</h3>
          <p className={styles.successMessage}>
            Therapy plan updated successfully
          </p>
        </div>
      )}

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft
            size={16}
            style={{ cursor: "pointer", color: "#6b7280", marginRight: "5px" }}
            onClick={() => navigate(-1)}
          />
          Edit Therapy Plan
        </h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {hasUnsavedChanges && (
            <div className={styles.unsavedBadge}>
              <FaEdit size={12} />
              Unsaved Changes
            </div>
          )}
          <span className={styles.patientNameBadge}>
            <FaUserMd /> {patientName}
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdateTherapyPlan}>
        <div className={styles.mainGrid}>
          {/* --- LEFT COLUMN --- */}
          <div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Plan Details</h2>
              </div>

              <div className={styles.rowGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="therapy_category" className={styles.label}>
                    Category <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="therapy_category"
                    name="therapy_category"
                    value={therapyPlan.therapy_category}
                    onChange={handleInputChange}
                    className={`${styles.select} ${errors.therapy_category ? styles.inputError : ""}`}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.therapy_category && (
                    <span className={styles.errorText}>
                      {errors.therapy_category}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="therapy_name" className={styles.label}>
                    Plan Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="therapy_name"
                    name="therapy_name"
                    value={therapyPlan.therapy_name}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.therapy_name ? styles.inputError : ""}`}
                    placeholder="e.g. Intensive Rehab"
                  />
                  {errors.therapy_name && (
                    <span className={styles.errorText}>
                      {errors.therapy_name}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="patient_diagnosis" className={styles.label}>
                  Diagnosis <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="patient_diagnosis"
                  name="patient_diagnosis"
                  value={therapyPlan.patient_diagnosis}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.patient_diagnosis ? styles.inputError : ""}`}
                  placeholder="e.g. Chronic Substance Dependency"
                />
                {errors.patient_diagnosis && (
                  <span className={styles.errorText}>
                    {errors.patient_diagnosis}
                  </span>
                )}
              </div>

              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label htmlFor="patient_symptoms" className={styles.label}>
                  Symptoms & Observation{" "}
                  <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="patient_symptoms"
                  name="patient_symptoms"
                  value={therapyPlan.patient_symptoms}
                  onChange={handleInputChange}
                  className={`${styles.textarea} ${errors.patient_symptoms ? styles.inputError : ""}`}
                  placeholder="Describe clinical findings..."
                />
                {errors.patient_symptoms && (
                  <span className={styles.errorText}>
                    {errors.patient_symptoms}
                  </span>
                )}
              </div>
            </div>

            {/* Prescription Management Card */}
            {!isPhysiotherapy && (
              <div className={styles.card}>
                <div
                  className={styles.cardHeader}
                  style={{
                    marginBottom: includePrescription ? "1.25rem" : "0",
                  }}
                >
                  <h2 className={styles.cardTitle}>Prescription Management</h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#4b5563",
                        fontWeight: 500,
                      }}
                    >
                      Include Prescription
                    </span>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={includePrescription}
                        onChange={(e) =>
                          setIncludePrescription(e.target.checked)
                        }
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                {includePrescription && (
                  <div className={styles.prescriptionWrapper}>
                    <PrescriptionFormComponent
                      hideFooter={true}
                      onDataChange={setPrescriptionData}
                      initialData={initialPrescriptionData} // Passes existing data down
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div>
            {/* Care Team Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Care Team</h2>
              </div>

              <div className={styles.teamList}>
                {draftCareTeam.map((member, idx) => (
                  <div key={idx} className={styles.teamMemberCard}>
                    <div className={styles.teamMemberInfo}>
                      <div className={styles.avatar}>
                        {member.doctor_name.charAt(0)}
                      </div>
                      <div className={styles.teamMemberDetails}>
                        <span className={styles.teamMemberName}>
                          {member.doctor_name}
                        </span>
                        <span className={styles.teamMemberRole}>
                          {member.role} • {member.department_name}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) =>
                        handleRemoveCareTeamMember(e, member.doctor_id)
                      }
                      className={styles.removeBtn}
                      title="Remove Specialist"
                      type="button"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {!isAddingTeamMember ? (
                <button
                  className={styles.dashedAddBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddingTeamMember(true);
                  }}
                >
                  <FaUserPlus size={12} /> Add Specialist
                </button>
              ) : (
                <div className={styles.addTeamForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className={styles.select}
                    >
                      <option value="Specialist">Specialist</option>
                      <option value="Head Counselor">Head Counselor</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Department</label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Doctor</label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className={styles.select}
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
                  <div className={styles.addTeamActions}>
                    <button
                      type="button"
                      className={styles.addBtnSm}
                      onClick={handleAddCareTeamMember}
                      disabled={
                        !selectedDeptId || !selectedDoctorId || isLoadingDoctors
                      }
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className={styles.cancelBtnSm}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAddingTeamMember(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Schedule</h2>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Facility Location <span className={styles.required}>*</span>
                </label>
                <LocationPicker
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                  disabled={false}
                  showSetAsDefault={true}
                  autoSelectPreferred={true}
                />
                {errors.location && (
                  <span className={styles.errorText}>{errors.location}</span>
                )}
              </div>

              <div
                className={styles.dateGrid}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div className={styles.inputGroup}>
                  <label htmlFor="therapy_start" className={styles.label}>
                    Start Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="therapy_start"
                    name="therapy_start"
                    value={therapyPlan.therapy_start}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.therapy_start ? styles.inputError : ""}`}
                  />
                  {errors.therapy_start && (
                    <span className={styles.errorText}>
                      {errors.therapy_start}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="therapy_end" className={styles.label}>
                    End Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="therapy_end"
                    name="therapy_end"
                    value={therapyPlan.therapy_end}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.therapy_end ? styles.inputError : ""}`}
                  />
                  {errors.therapy_end && (
                    <span className={styles.errorText}>
                      {errors.therapy_end}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="estimated_sessions" className={styles.label}>
                    Est. Sessions <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    id="estimated_sessions"
                    name="estimated_sessions"
                    value={therapyPlan.estimated_sessions}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.estimated_sessions ? styles.inputError : ""}`}
                    placeholder="E.g., 12"
                    min="1"
                  />
                  {errors.estimated_sessions && (
                    <span className={styles.errorText}>
                      {errors.estimated_sessions}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="therapy_duration" className={styles.label}>
                    Plan Duration
                  </label>
                  <input
                    type="text"
                    id="therapy_duration"
                    name="therapy_duration"
                    value={therapyPlan.therapy_duration}
                    readOnly
                    className={`${styles.input} ${styles.readOnly}`}
                  />
                </div>
              </div>
            </div>

            {/* Payment Configuration Card */}
            <div
              className={styles.card}
              style={{ padding: showPayment ? "1.25rem" : "1rem 1.25rem" }}
            >
              <div
                className={styles.cardHeader}
                style={{ margin: 0, cursor: "pointer" }}
                onClick={() => setShowPayment(!showPayment)}
              >
                <h2 className={styles.cardTitle} style={{ color: "#4b5563" }}>
                  Payment Configuration
                </h2>
                {showPayment ? (
                  <FaChevronUp color="#9ca3af" />
                ) : (
                  <FaChevronDown color="#9ca3af" />
                )}
              </div>

              {showPayment && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "1rem",
                  }}
                >
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Payment Type</label>
                    <div className={styles.radioGroup}>
                      {paymentTypes.map((type) => (
                        <label key={type.value} className={styles.radioButton}>
                          <input
                            type="radio"
                            name="payment_type"
                            value={type.value}
                            checked={therapyPlan.payment_type === type.value}
                            onChange={() => handlePaymentTypeChange(type.value)}
                            className={styles.radioInput}
                          />
                          <span
                            style={{ fontSize: "0.85rem", color: "#4b5563" }}
                          >
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.rowGrid}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="total_amount" className={styles.label}>
                        Total Amount <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        id="total_amount"
                        name="total_amount"
                        value={therapyPlan.total_amount}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.total_amount ? styles.inputError : ""}`}
                        placeholder="0"
                        min="0"
                      />
                      {errors.total_amount && (
                        <span className={styles.errorText}>
                          {errors.total_amount}
                        </span>
                      )}
                    </div>

                    {therapyPlan.payment_type === "recurring" && (
                      <div className={styles.inputGroup}>
                        <label
                          htmlFor="per_session_amount"
                          className={styles.label}
                        >
                          Per Session Amount{" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="number"
                          id="per_session_amount"
                          name="per_session_amount"
                          value={therapyPlan.per_session_amount}
                          onChange={handleInputChange}
                          className={`${styles.input} ${errors.per_session_amount ? styles.inputError : ""}`}
                          placeholder="0"
                          min="0"
                        />
                        {errors.per_session_amount && (
                          <span className={styles.errorText}>
                            {errors.per_session_amount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.rowGrid} style={{ marginBottom: 0 }}>
                    <div
                      className={styles.inputGroup}
                      style={{ marginBottom: 0 }}
                    >
                      <label htmlFor="received_amount" className={styles.label}>
                        Received Amount{" "}
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        id="received_amount"
                        name="received_amount"
                        value={
                          therapyPlan.received_amount === "0"
                            ? ""
                            : therapyPlan.received_amount
                        }
                        onChange={handleInputChange}
                        onFocus={() => {
                          if (therapyPlan.received_amount === "0") {
                            setTherapyPlan((prev) => ({
                              ...prev,
                              received_amount: "",
                            }));
                          }
                        }}
                        className={`${styles.input} ${errors.received_amount ? styles.inputError : ""}`}
                        placeholder="0"
                        min="0"
                      />
                      {errors.received_amount && (
                        <span className={styles.errorText}>
                          {errors.received_amount}
                        </span>
                      )}
                    </div>

                    <div
                      className={styles.inputGroup}
                      style={{ marginBottom: 0 }}
                    >
                      <label htmlFor="balance" className={styles.label}>
                        Balance
                      </label>
                      <input
                        type="number"
                        id="balance"
                        name="balance"
                        value={therapyPlan.balance}
                        readOnly
                        className={`${styles.input} ${styles.readOnly}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- STICKY FOOTER --- */}
        <div className={styles.stickyFooter}>
          {errors.submit && (
            <span
              className={styles.errorText}
              style={{ alignSelf: "center", marginRight: "auto" }}
            >
              {errors.submit}
            </span>
          )}

          <button
            type="button"
            className={styles.discardBtn}
            onClick={handleDiscardChanges}
            disabled={!hasUnsavedChanges || isSaving}
          >
            <FaTimes size={12} /> Discard Changes
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!hasUnsavedChanges || isSaving}
          >
            <FaSave size={12} /> {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTherapyPlan;
