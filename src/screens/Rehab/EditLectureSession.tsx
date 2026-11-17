import React, { useState, useEffect, useMemo } from "react";
import styles from "../../css/Rehab/CreateLectureSession.module.css";
import api from "../../utils/central";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaCheck } from "react-icons/fa";
import { Loader2 } from "lucide-react"; // Imported Loader

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email?: string;
  patient_image?: string;
}

interface LectureSessionFormData {
  lecture_number: string | number;
  topic_name: string;
  description: string;
  counselor_notes: string;
}

const EditLectureSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [absentPatientIds, setAbsentPatientIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<LectureSessionFormData>({
    lecture_number: "",
    topic_name: "",
    description: "",
    counselor_notes: "",
  });

  const [errors, setErrors] = useState<Partial<LectureSessionFormData>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const patientsRes = await api.get(`/patient/getAll?limit=100&status=active`);
        if (patientsRes.status === 200 && patientsRes.data.patients) {
          setPatients(patientsRes.data.patients);
        }

        const lectureRes = await api.get(`/lecture/session/${id}`);
        if (lectureRes.status === 200 && lectureRes.data.lecture) {
          const session = lectureRes.data.lecture;
          
          setFormData({
            lecture_number: session.lecture_number,
            topic_name: session.topic_name,
            description: session.description || "",
            counselor_notes: session.counselor_notes || "",
          });

          if (session.absent_patients && session.absent_patients.length > 0) {
            const absentIds = session.absent_patients.map((p: any) => p.patient_id);
            setAbsentPatientIds(new Set(absentIds));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load session details.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LectureSessionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const togglePatientSelection = (patientId: string) => {
    const newSelection = new Set(absentPatientIds);
    if (newSelection.has(patientId)) {
      newSelection.delete(patientId);
    } else {
      newSelection.add(patientId);
    }
    setAbsentPatientIds(newSelection);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const fullName = `${p.patient_first_name} ${p.patient_last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [patients, searchTerm]);

  const absentCount = absentPatientIds.size;
  const presentCount = patients.length - absentCount;
  
  const absentNames = patients
    .filter((p) => absentPatientIds.has(p._id))
    .map((p) => `${p.patient_first_name} ${p.patient_last_name}`)
    .join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic_name.toString().trim()) {
      setErrors({ topic_name: "Topic name is required" });
      return;
    }
    
    setSubmitting(true);

    try {
      const absent_patients_payload = patients
        .filter(p => absentPatientIds.has(p._id))
        .map(p => ({
            contactId: p._id,
            reason: "Not provided" 
        }));

      const payload = {
        topic_name: formData.topic_name,
        total_patients: patients.length,
        absent_patients: absent_patients_payload,
        description: formData.description,
        counselor_notes: formData.counselor_notes
      };

      await api.put(`/lecture/session/${id}`, payload);
      alert("Lecture session updated successfully!");
      navigate(-1);
    } catch (error: any) {
      console.error("Error updating session:", error);
      alert(error.response?.data?.msg || "Failed to update lecture session.");
    } finally {
      setSubmitting(false);
    }
  };

  // Premium Loading State
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageLoaderContainer}>
          <Loader2 className={styles.spinner} size={32} />
          <p>Loading session details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft size={15} style={{ cursor: "pointer", color: "#6b7280", marginRight: "6px" }} onClick={() => navigate(-1)} />
          Edit Lecture Session #{formData.lecture_number}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        <div className={styles.mainGrid}>
          {/* LEFT COLUMN: Participant Selection */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Mark Absentees ({absentCount} selected)</h2>
            </div>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Search to mark absent..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className={styles.patientListContainer}>
              {filteredPatients.map((patient) => {
                const isSelected = absentPatientIds.has(patient._id);
                return (
                  <div key={patient._id} className={`${styles.patientListItem} ${isSelected ? styles.selectedItem : ""}`} onClick={() => togglePatientSelection(patient._id)}>
                    <div className={`${styles.checkbox} ${isSelected ? styles.checkboxActive : ""}`}>
                      {isSelected && <FaCheck size={9} color="#fff" />}
                    </div>
                    <div className={styles.patientInfo}>
                      <p className={styles.patientName}>{patient.patient_first_name} {patient.patient_last_name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Lecture Details */}
          <div className={styles.rightColumn}>
            <div className={styles.topCardsRow}>
              <div className={styles.card}>
                <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Lecture Info</h2></div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Topic Name <span className={styles.required}>*</span></label>
                  <input type="text" name="topic_name" value={formData.topic_name} onChange={handleInputChange} className={`${styles.input} ${errors.topic_name ? styles.inputError : ""}`} />
                  {errors.topic_name && <span className={styles.errorText}>{errors.topic_name}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className={styles.textarea} />
                </div>
              </div>

              <div className={`${styles.card} ${styles.flex1}`}>
                <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Logbook Output</h2></div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Counselor Notes</label>
                  <input type="text" name="counselor_notes" value={formData.counselor_notes} onChange={handleInputChange} className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Absent Client Names</label>
                  <textarea readOnly value={absentNames} className={`${styles.textarea} ${styles.readOnly}`} />
                </div>
              </div>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.footerSummary}>
                <span className={styles.summaryBadge}>{presentCount} / {patients.length}</span> Total Present
              </div>
              <div className={styles.footerActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? "Saving..." : "Update Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditLectureSession;