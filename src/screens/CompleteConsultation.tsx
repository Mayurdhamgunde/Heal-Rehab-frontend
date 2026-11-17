import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaStethoscope,
  FaCalendarAlt,
  FaClock,
  FaUserInjured,
  FaNotesMedical,
  FaFilePrescription,
  FaClipboardList,
} from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/CompleteConsultation.module.css";
import PrescriptionFormComponent from "../components/PrescriptionFormComponent";

const CompleteConsultation: React.FC = () => {
  const { patientId, appointmentId } = useParams();
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem("user") || "{}");
  const isPhysiotherapy =
    session.organization_industry?.toLowerCase().trim() === "physiotherapy";

  const [formData, setFormData] = useState({
    patientSymptoms: "",
    causes: "",
    notes: "",
    results: "",
    consultationDate: new Date().toISOString().split("T")[0],
    consultationTime: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  const [includePrescription, setIncludePrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionDataChange = (data: any) => {
    setPrescriptionData(data);
  };

  const validateForm = (): string | null => {
    if (!formData.patientSymptoms.trim())
      return "Please enter Patient Symptoms.";
    if (!formData.causes.trim()) return "Please enter Causes.";
    if (!formData.notes.trim()) return "Please enter Notes.";
    if (isPhysiotherapy && !formData.results) return "Please select a Result.";

    if (includePrescription) {
      if (!prescriptionData) return "Please add at least one medication.";
      const medications = prescriptionData.medications || [];
      const validMedications = medications.filter(
        (med: any) => med && med.drug_name && med.drug_name.trim() !== "",
      );
      if (validMedications.length === 0) {
        return "Please add at least one medication to the prescription.";
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      let resultsValue =
        formData.results === "therapy_needed"
          ? "Therapy needed"
          : formData.results === "therapy_not_needed"
            ? "Therapy not needed"
            : "";

      const payload: any = {
        patientSymptoms: formData.patientSymptoms,
        causes: formData.causes,
        notes: formData.notes,
        results: resultsValue,
        consultationDate: formData.consultationDate,
        consultationTime: formData.consultationTime,
        appointmentId: appointmentId || null,
      };

      if (includePrescription && prescriptionData) {
        payload.prescription = {
          vitals: { weight: prescriptionData.weight, bp: prescriptionData.bp },
          medications: prescriptionData.medications,
          notes: prescriptionData.notes,
          diagnosis: resultsValue,
        };
      }

      await api.post(`/${patientId}/consultations`, payload);
      alert("Consultation Completed Successfully");
      navigate(-1);
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Failed to complete consultation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FaStethoscope />
          </div>
          <h1 className={styles.title}>Consultation Details</h1>
          <p className={styles.subtitle}>
            Complete the patient check-up and diagnosis
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>
                <FaCalendarAlt className={styles.icon} />
                Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                name="consultationDate"
                value={formData.consultationDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className={styles.field}>
              <label>
                <FaClock className={styles.icon} />
                Time <span className={styles.required}>*</span>
              </label>
              <input
                type="time"
                name="consultationTime"
                value={formData.consultationTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>
              <FaUserInjured className={styles.icon} />
              Patient Symptoms <span className={styles.required}>*</span>
            </label>
            <textarea
              name="patientSymptoms"
              value={formData.patientSymptoms}
              onChange={handleInputChange}
              placeholder="Describe the patient's symptoms in detail..."
              required
            />
          </div>

          <div className={styles.field}>
            <label>
              <FaClipboardList className={styles.icon} />
              Causes / Diagnosis <span className={styles.required}>*</span>
            </label>
            <textarea
              name="causes"
              value={formData.causes}
              onChange={handleInputChange}
              placeholder="Describe likely causes or diagnosis..."
              required
            />
          </div>

          <div className={styles.field}>
            <label>
              <FaNotesMedical className={styles.icon} />
              Medical Notes <span className={styles.required}>*</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add additional notes, observations, or recommendations..."
              required
            />
          </div>

          {/* Find this section in the return statement */}
          {isPhysiotherapy ? (
            <div className={styles.field}>
              <label>
                Results <span className={styles.required}>*</span>
              </label>
              <select
                name="results"
                value={formData.results}
                onChange={handleInputChange}
                required
                className={styles.select}
              >
                <option value="">Select Result</option>
                <option value="therapy_needed">Therapy Needed</option>
                <option value="therapy_not_needed">Therapy Not Needed</option>
              </select>
            </div>
          ) : (
            /* This block only renders if NOT physiotherapy */
            <div className={styles.prescriptionSection}>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>
                  <FaFilePrescription className={styles.icon} />
                  Prescription
                </span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={includePrescription}
                    onChange={(e) => setIncludePrescription(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              {includePrescription && (
                <div className={styles.prescriptionContent}>
                  <PrescriptionFormComponent
                    onDataChange={handlePrescriptionDataChange}
                    hideFooter={true}
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinner}></span>
            ) : (
              "Complete Consultation"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteConsultation;
