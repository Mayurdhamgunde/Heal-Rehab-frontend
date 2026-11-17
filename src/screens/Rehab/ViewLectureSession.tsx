import React, { useState, useEffect } from "react";
import styles from "../../css/Rehab/CreateLectureSession.module.css";
import api from "../../utils/central";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { Loader2 } from "lucide-react"; // Imported Loader

const ViewLectureSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get(`/lecture/session/${id}`);
        if (response.status === 200 && response.data.lecture) {
          setSession(response.data.lecture);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        alert("Failed to load session details.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, navigate]);

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

  if (!session) return <div className={styles.pageContainer}>Session not found.</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FaArrowLeft size={15} style={{ cursor: "pointer", color: "#6b7280", marginRight: "6px" }} onClick={() => navigate(-1)} />
          View Lecture Session #{session.lecture_number}
        </h1>
        <p className={styles.pageSubtitle}>Status: {session.status}</p>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Absentees ({session.absent_patients?.length || 0})</h2>
          </div>
          <div className={styles.patientListContainer}>
            {session.absent_patients?.length > 0 ? (
              session.absent_patients.map((p: any) => (
                <div key={p.patient_id} className={styles.patientListItem}>
                  <div className={styles.patientInfo}>
                    <p className={styles.patientName}>{p.patient_name}</p>
                    <p className={styles.patientEmail}>Reason: {p.reason}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ padding: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>No absentees recorded.</p>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.topCardsRow}>
            <div className={styles.card}>
              <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Lecture Info</h2></div>
              <div className={styles.rowGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Date & Time</label>
                  <p className={styles.standardText}>{session.lecture_date} at {session.lecture_start_time}</p>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Counselor</label>
                  <p className={styles.standardText}>{session.counselor_name}</p>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Topic Name</label>
                <p className={styles.standardText}>{session.topic_name}</p>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Description</label>
                <p className={styles.standardText}>{session.description || "N/A"}</p>
              </div>
            </div>

            <div className={`${styles.card} ${styles.flex1}`}>
              <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Counselor Notes</h2></div>
              <p className={styles.standardText}>{session.counselor_notes || "No notes provided."}</p>
            </div>
          </div>
          
          <div className={styles.actionCard}>
            <div className={styles.footerSummary}>
              <span className={styles.summaryBadge}>{session.attendance_count} / {session.total_patients}</span> Total Present
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLectureSession;