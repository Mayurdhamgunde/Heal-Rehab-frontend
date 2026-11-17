import React, { useState, useEffect } from "react";
import styles from "../css/createTherapyPlan.module.css";
import api from "../utils/central";
import { useParams, useNavigate } from "react-router-dom";
import LocationPicker from "../components/HospitalLocation";
import PrescriptionFormComponent from "../components/PrescriptionFormComponent";
import {
  FaTrash,
  FaUserPlus,
  FaChevronDown,
  FaChevronUp,
  FaArrowLeft,
} from "react-icons/fa";

interface TherapyPlan {
  therapy_name: string;
  patient_diagnosis: string;
  ICD_11_Codes: string;
  MarksOfIdentification: string;
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

const ESTIMATED_SESSIONS = "19";

const CreateTherapyPlan: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const sessionUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isPhysiotherapy =
    sessionUser.organization_industry?.toLowerCase().trim() === "physiotherapy";

  // Date Helpers
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDatePlusDays = (startDateString: string, daysToAdd: number) => {
    const date = new Date(startDateString);
    date.setDate(date.getDate() + daysToAdd);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const initialStartDate = getTodayDate();
  const initialEndDate = getDatePlusDays(initialStartDate, 28); // 28 Days later

  const [therapyPlan, setTherapyPlan] = useState<TherapyPlan>({
    therapy_name: "Addiction Management",
    patient_diagnosis: "",
    ICD_11_Codes: "",
    MarksOfIdentification: "",
    patient_symptoms: "",
    therapy_duration: "28 days",
    therapy_start: initialStartDate,
    therapy_end: initialEndDate,
    therapy_category: "",
    total_amount: "0",
    received_amount: "0",
    balance: "0",
    payment_type: "recurring",
    estimated_sessions: ESTIMATED_SESSIONS,
    per_session_amount: "0",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<TherapyPlan & { location: string; care_team: string }>
  >({});
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  const [includePrescription, setIncludePrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  const [draftCareTeam, setDraftCareTeam] = useState<CareTeamMember[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "Head Counselor" | "Specialist"
  >("Specialist");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);

  const categories = ["Addiction Management"];
  const paymentTypes = [
    { label: "Recurring", value: "recurring" },
    { label: "One-time", value: "one-time" },
  ];

  // Data Fetching
  useEffect(() => {
    if (patientId) {
      api
        .get(`/patient/${patientId}`)
        .then((res) => {
          if (res.data?.patientData?.care_team) {
            setDraftCareTeam(res.data.patientData.care_team);
          }
        })
        .catch((err) =>
          console.error("Failed to fetch existing care team:", err),
        );
    }
  }, [patientId]);

  useEffect(() => {
    api
      .get("/departments")
      .then((res) => setDepartments(res.data.departments || []))
      .catch((err) => console.error("Failed to load departments", err));
  }, []);

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

  // Care Team Handlers
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

  // Input Change Handlers
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

    if (errors[name as keyof TherapyPlan]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "total_amount" || name === "received_amount") {
      const total =
        name === "total_amount"
          ? parseFloat(value) || 0
          : parseFloat(therapyPlan.total_amount) || 0;
      const received =
        name === "received_amount"
          ? parseFloat(value) || 0
          : parseFloat(therapyPlan.received_amount) || 0;
      const balance = total - received;
      setTherapyPlan((prev) => ({
        ...prev,
        [name]: newValue,
        balance: balance.toFixed(2),
      }));
    }

    if (name === "per_session_amount") {
      const perSession = parseFloat(value) || 0;
      const sessions = parseInt(ESTIMATED_SESSIONS, 10);
      const total = sessions * perSession;
      setTherapyPlan((prev) => ({
        ...prev,
        [name]: newValue,
        total_amount: total.toFixed(2),
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

  // Recalculate duration based on dates (sessions are managed independently)
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
    if (therapyPlan.payment_type === "recurring" && therapyPlan.total_amount) {
      const perSession = Math.round(
        parseFloat(therapyPlan.total_amount) / parseInt(ESTIMATED_SESSIONS, 10),
      );
      setTherapyPlan((prev) => ({
        ...prev,
        per_session_amount: perSession.toString(),
      }));
    }
  }, [therapyPlan.total_amount, therapyPlan.payment_type]);

  const validateForm = (): boolean => {
    const newErrors: Partial<
      TherapyPlan & { location: string; care_team: string }
    > = {};

    if (!therapyPlan.patient_diagnosis.trim())
      newErrors.patient_diagnosis = "Diagnosis is required";
    if (!therapyPlan.patient_symptoms.trim())
      newErrors.patient_symptoms = "Symptoms are required";
    if (!therapyPlan.therapy_duration.trim())
      newErrors.therapy_duration = "Duration is required";
    if (!therapyPlan.therapy_start)
      newErrors.therapy_start = "Start date is required";
    if (!therapyPlan.therapy_end)
      newErrors.therapy_end = "End date is required";
    if (!therapyPlan.therapy_category.trim())
      newErrors.therapy_category = "Category is required";
    if (!selectedLocation) newErrors.location = "Please select a location";

    if (therapyPlan.therapy_start && therapyPlan.therapy_end) {
      const startDate = new Date(therapyPlan.therapy_start);
      const endDate = new Date(therapyPlan.therapy_end);

      if (endDate <= startDate)
        newErrors.therapy_end = "Must be after start date";
    }

    if (showPayment) {
      if (!therapyPlan.total_amount.toString().trim())
        newErrors.total_amount = "Total is required";
      if (!therapyPlan.received_amount.toString().trim())
        newErrors.received_amount = "Received is required";
      if (
        therapyPlan.payment_type === "recurring" &&
        !therapyPlan.per_session_amount.toString().trim()
      ) {
        newErrors.per_session_amount = "Per session required";
      }
      if (
        therapyPlan.payment_type === "one-time" &&
        parseFloat(therapyPlan.received_amount) !==
          parseFloat(therapyPlan.total_amount)
      ) {
        newErrors.received_amount = "Requires full amount";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    setLoading(true);

    try {
      await api.put(`/assigning/patient/${patientId}`, {
        care_team: draftCareTeam,
      });

      const formData: any = {
        therapy_name: therapyPlan.therapy_name,
        patient_diagnosis: therapyPlan.patient_diagnosis,
        ICD_11_Codes: therapyPlan.ICD_11_Codes,
        MarksOfIdentification: therapyPlan.MarksOfIdentification,
        patient_symptoms: therapyPlan.patient_symptoms,
        therapy_duration: therapyPlan.therapy_duration,
        therapy_start: therapyPlan.therapy_start,
        therapy_end: therapyPlan.therapy_end,
        patient_therapy_category: therapyPlan.therapy_category,
        total_amount: therapyPlan.total_amount,
        received_amount: therapyPlan.received_amount,
        balance: therapyPlan.balance,
        payment_type: therapyPlan.payment_type,
        estimated_sessions: parseInt(ESTIMATED_SESSIONS, 10),
        per_session_amount: parseFloat(therapyPlan.per_session_amount),
        location_id: selectedLocation?._id,
        location_name: selectedLocation?.name,
        location_address: selectedLocation?.addressLink,
      };

      if (
        includePrescription &&
        prescriptionData &&
        prescriptionData.medications?.length > 0
      ) {
        formData.prescription = {
          vitals: {
            weight: prescriptionData.weight || "",
            bp: prescriptionData.bp || "",
          },
          medications: prescriptionData.medications,
          notes: prescriptionData.notes || "",
          diagnosis:
            therapyPlan.patient_diagnosis || "Therapy Plan Prescription",
        };
      }

      const response = await api.post(`/therapy/plan/${patientId}`, formData);

      if (response.status === 200 || response.status === 201) {
        alert("Therapy plan created successfully!");
        navigate(`/Patient/${patientId}`);
      }
    } catch (error: any) {
      console.error("Error creating therapy plan:", error);
      alert(
        error.response?.data?.msg ||
          error.response?.data?.error ||
          "Failed to create therapy plan.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft
            size={16}
            style={{ cursor: "pointer", color: "#6b7280", marginRight: "5px" }}
            onClick={() => navigate(-1)}
          />
          New Therapy Plan
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
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
              </div>

              <div className={styles.rowGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="ICD_11_Codes" className={styles.label}>
                    ICD-11 Codes
                  </label>
                  <input
                    type="text"
                    id="ICD_11_Codes"
                    name="ICD_11_Codes"
                    value={therapyPlan.ICD_11_Codes}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g. 6C40.2"
                  />
                </div>
                <div
                  className={styles.inputGroup}
                  style={{ marginBottom: "1rem" }}
                >
                  <label
                    htmlFor="MarksOfIdentification"
                    className={styles.label}
                  >
                    Marks of Identification
                  </label>
                  <input
                    type="text"
                    id="MarksOfIdentification"
                    name="MarksOfIdentification"
                    value={therapyPlan.MarksOfIdentification}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Any visible identification marks..."
                  />
                </div>
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

            {!isPhysiotherapy && (
              <div className={styles.card}>
                <div
                  className={styles.cardHeader}
                  style={{
                    marginBottom: includePrescription ? "1rem" : "0",
                  }}
                >
                  <h2 className={styles.cardTitle}>Prescription Management</h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
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
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div>
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
                      className={styles.addBtnSm}
                      onClick={handleAddCareTeamMember}
                      disabled={
                        !selectedDeptId || !selectedDoctorId || isLoadingDoctors
                      }
                    >
                      Add
                    </button>
                    <button
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

              <div className={styles.dateGrid}>
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
            </div>

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
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating..." : "Create Therapy Plan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTherapyPlan;
