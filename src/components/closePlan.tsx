import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { FaCheckCircle, FaArrowLeft, FaTimes, FaUserMd } from "react-icons/fa";
import api from "../utils/central";
// Update this path to point to your EditTherapyPlan CSS module
import styles from "../css/EditTherapyPlan.module.css";
import PrescriptionFormComponent from "../components/PrescriptionFormComponent";
import type { PrescriptionFormDataType } from "../components/PrescriptionFormComponent";

interface CloseFormData {
  closure_reason: string;
  closure_details?: string;
  final_remarks?: string;
  treatment_outcome?: string;
  follow_up_recommendations?: string;
  closure_date?: string;
  next_visit_date?: string;
}

const CLOSURE_REASONS = [
  "Completed",
  "Incomplete",
  "Dropout",
  "Refer",
  "OPD",
] as const;

const ClosePlanScreen: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] =
    useState<PrescriptionFormDataType | null>(null);
  const [therapyStart, setTherapyStart] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const [nextVisitTouched, setNextVisitTouched] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CloseFormData>({
    defaultValues: {
      closure_reason: "",
      closure_details: "",
      final_remarks: "",
      treatment_outcome: "",
      follow_up_recommendations: "",
      closure_date: new Date().toISOString().split("T")[0],
      next_visit_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  const closureDateValue = watch("closure_date");

  // Keep Next Follow-up Date defaulted to 28 days after the Closure Date,
  // unless the user has manually changed the follow-up date themselves.
  useEffect(() => {
    if (!closureDateValue || nextVisitTouched) return;
    const base = new Date(closureDateValue);
    if (isNaN(base.getTime())) return;
    base.setDate(base.getDate() + 28);
    setValue("next_visit_date", base.toISOString().split("T")[0]);
  }, [closureDateValue, nextVisitTouched, setValue]);

  // Fetch plan details to get the therapy_start date for validation and patient name for the header[cite: 5, 8]
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await api.get(`/get/plan/${planId}`);
        if (response.data?.therapy_plan?.therapy_start) {
          setTherapyStart(response.data.therapy_plan.therapy_start);
        }
        if (response.data?.patient_name) {
          setPatientName(response.data.patient_name);
        }
      } catch (error) {
        console.error("Failed to fetch plan details", error);
        setSubmitError("Failed to fetch plan details required for validation.");
      } finally {
        setLoading(false);
      }
    };
    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  const onSubmit = async (data: CloseFormData) => {
    setSubmitError(null);

    if (!data.closure_reason) {
      setError("closure_reason", { message: "Please select a closure reason" });
      return;
    }

    if (data.closure_date && therapyStart) {
      const closureDate = new Date(data.closure_date);
      const startDate = new Date(therapyStart);
      if (closureDate < startDate) {
        setError("closure_date", {
          message: "Closure date cannot be before therapy start date",
        });
        return;
      }
    }

    const payload = {
      closure_reason: data.closure_reason,
      closure_details: data.closure_details,
      final_remarks: data.final_remarks,
      treatment_outcome: data.treatment_outcome,
      follow_up_recommendations: data.follow_up_recommendations,
      closure_date: data.closure_date,
      next_visit_date: data.next_visit_date,
      prescription: prescriptionData,
    };

    try {
      await api.post(`/plan/close/${planId}`, payload);
      alert("Therapy plan completed successfully");
      navigate(`/planDetails/${planId}`); // Navigate back to the plan details page[cite: 5]
    } catch (err: any) {
      const msg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Failed to complete therapy plan";
      setSubmitError(msg);
    }
  };

  if (loading) {
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
      {/* --- HEADER --- */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft
            size={16}
            style={{ cursor: "pointer", color: "#6b7280", marginRight: "5px" }}
            onClick={() => navigate(-1)}
          />
          Complete Therapy Plan
        </h1>
        {patientName && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span className={styles.patientNameBadge}>
              <FaUserMd /> {patientName}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* --- MAIN GRID (2 Columns) --- */}
        <div className={styles.mainGrid}>
          {/* --- LEFT COLUMN --- */}
          <div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Post-Care Prescription</h2>
              </div>

              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <PrescriptionFormComponent
                  hideFooter={true}
                  onDataChange={(data) => setPrescriptionData(data)}
                />
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Closure Information</h2>
              </div>

              <div className={styles.rowGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Closure Reason <span className={styles.required}>*</span>
                  </label>
                  <Controller
                    name="closure_reason"
                    control={control}
                    rules={{ required: "Please select a closure reason" }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`${styles.select} ${errors.closure_reason ? styles.inputError : ""}`}
                      >
                        <option value="">Select a reason</option>
                        {CLOSURE_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.closure_reason && (
                    <span className={styles.errorText}>
                      {errors.closure_reason.message}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Closure Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    {...register("closure_date")}
                    className={`${styles.input} ${errors.closure_date ? styles.inputError : ""}`}
                  />
                  {errors.closure_date && (
                    <span className={styles.errorText}>
                      {errors.closure_date.message}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Next Follow-up Date</label>
                <input
                  type="date"
                  {...register("next_visit_date", {
                    onChange: () => setNextVisitTouched(true),
                  })}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>
                  History of illness / Details
                </label>
                <textarea
                  {...register("closure_details")}
                  className={styles.textarea}
                  placeholder="Additional details about closure"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- STICKY FOOTER --- */}
        <div className={styles.stickyFooter}>
          {submitError && (
            <span
              className={styles.errorText}
              style={{ alignSelf: "center", marginRight: "auto" }}
            >
              {submitError}
            </span>
          )}

          <button
            type="button"
            className={styles.discardBtn}
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            <FaTimes size={12} /> Cancel
          </button>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            <FaCheckCircle size={12} />{" "}
            {isSubmitting ? "Completing..." : "Complete Plan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClosePlanScreen;
