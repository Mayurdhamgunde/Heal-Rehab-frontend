import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCheckCircle,
  FaCalendarCheck,
  FaUser,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";
import styles from "../css/Appointmentsuccess.module.css";

interface SuccessPageState {
  appointmentId?: string;
  patientName?: string;
  appointmentDate?: string;
  status?: "completed" | "cancelled" | "no-show";
}

const AppointmentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: SuccessPageState };

  useEffect(() => {
    // If no state, redirect back
    if (!state?.appointmentId) {
      navigate("/appointments");
    }
  }, [state, navigate]);

  const getStatusConfig = () => {
    switch (state?.status) {
      case "completed":
        return {
          icon: <FaCheckCircle className={styles.successIcon} />,
          title: "Appointment Completed Successfully!",
          message:
            "The appointment has been marked as completed and all details have been saved.",
          color: "#10b981",
        };
      case "cancelled":
        return {
          icon: (
            <FaCheckCircle
              className={styles.successIcon}
              style={{ color: "#ef4444" }}
            />
          ),
          title: "Appointment Cancelled",
          message:
            "The appointment has been marked as cancelled and the patient has been notified.",
          color: "#ef4444",
        };
      case "no-show":
        return {
          icon: (
            <FaCheckCircle
              className={styles.successIcon}
              style={{ color: "#f59e0b" }}
            />
          ),
          title: "Marked as No Show",
          message:
            "The appointment has been marked as no show and recorded in the system.",
          color: "#f59e0b",
        };
      default:
        return {
          icon: <FaCheckCircle className={styles.successIcon} />,
          title: "Status Updated Successfully!",
          message: "The appointment status has been updated.",
          color: "#10b981",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div
          className={styles.iconContainer}
          style={{ background: `${config.color}15` }}
        >
          {config.icon}
        </div>

        <h1 className={styles.title}>{config.title}</h1>
        <p className={styles.message}>{config.message}</p>

        <div className={styles.detailsCard}>
          {state?.patientName && (
            <div className={styles.detailRow}>
              <div className={styles.detailIcon}>
                <FaUser />
              </div>
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Patient Name</span>
                <span className={styles.detailValue}>{state.patientName}</span>
              </div>
            </div>
          )}

          {state?.appointmentDate && (
            <div className={styles.detailRow}>
              <div className={styles.detailIcon}>
                <FaCalendarCheck />
              </div>
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Appointment Date</span>
                <span className={styles.detailValue}>
                  {new Date(state.appointmentDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}

          <div className={styles.detailRow}>
            <div className={styles.detailIcon}>
              <FaClock />
            </div>
            <div className={styles.detailText}>
              <span className={styles.detailLabel}>Updated At</span>
              <span className={styles.detailValue}>
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.primaryButton}
            onClick={() => navigate("/appointments")}
          >
            View All Appointments
            <FaArrowRight />
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSuccess;
