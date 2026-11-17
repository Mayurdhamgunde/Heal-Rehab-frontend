import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaStethoscope,
  FaCalendarAlt,
  FaPlay,
  FaInfoCircle,
  FaCheck,
  FaClock,
  FaTimes,
  FaExchangeAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/MyAppointmnets.module.css";

interface Appointment {
  _id: string;
  plan_id: string;
  patient_id: string;
  therepy_type: string;
  therepy_link?: string;
  therepy_start_time: string;
  therepy_end_time: string;
  therepy_date: string;
  patient_name?: string;
  doctor_name?: string;
  status?: string;
  doctor_id: string;
  therapy_reason?: string;
  is_consultation?: boolean;
}

const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await api.get("/appointments/getevents");
        const todayAppointments = response.data.appointments.filter(
          (appointment: Appointment) => appointment.therepy_date === today,
        );
        setAppointments(todayAppointments);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching today's appointments:", error);
        setAppointments([]);
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, []);

  const getStatusColor = (status?: string) => {
    const colors = {
      completed: "#4CAF50",
      in_progress: "#FF9800",
      cancelled: "#f44336",
      default: "#007b8e",
    };
    switch (status?.toLowerCase()) {
      case "completed":
        return colors.completed;
      case "in_progress":
        return colors.in_progress;
      case "cancelled":
        return colors.cancelled;
      default:
        return colors.default;
    }
  };

  const getFormattedStatus = (status?: string) => {
    if (!status) return "Scheduled";
    switch (status.toLowerCase()) {
      case "in_progress":
        return "In Progress";
      default:
        return status
          .split("_")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <FaCheck />;
      case "in_progress":
        return <FaClock />;
      case "cancelled":
        return <FaTimes />;
      default:
        return <FaCalendarAlt />;
    }
  };

  const handleCardClick = (appointment: Appointment) => {
    navigate(`/planDetails/${appointment.plan_id}`, {
      state: { appointment },
    });
  };

  return (
    <div className={styles.container}>
      {/* Updated Header Section - matching MyPatients style */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <FaCalendarAlt className={styles.titleIcon} />
            Today's Appointments
          </h1>
          <p className={styles.pageSubtitle}>
            View and manage your scheduled appointments for today
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaCalendarAlt />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>{appointments.length}</div>
            <div className={styles.statLabel}>Today's Total</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaCheck />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>
              {appointments.filter((a) => a.status === "completed").length}
            </div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>
              {
                appointments.filter(
                  (a) => a.status === "in_progress" || !a.status,
                ).length
              }
            </div>
            <div className={styles.statLabel}>Upcoming</div>
          </div>
        </div>
      </div>

      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.skeletonLoader}>
            {[...Array(3)].map((_, index) => (
              <div key={index} className={styles.appointmentSkeleton}>
                <div className={styles.skeletonTime}></div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonSubtitle}></div>
                  <div className={styles.skeletonBadge}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.appointmentList}>
            {appointments.length > 0 ? (
              appointments.map((appointment, appointmentIndex) => (
                <div
                  key={appointment._id}
                  className={styles.appointmentCard}
                  style={{ animationDelay: `${appointmentIndex * 0.1}s` }}
                  onClick={() => handleCardClick(appointment)}
                >
                  <div className={styles.appointmentTimeline}>
                    <div className={styles.timeSlot}>
                      <span className={styles.startTime}>
                        {appointment.therepy_start_time}
                      </span>
                      <span className={styles.endTime}>
                        {appointment.therepy_end_time}
                      </span>
                    </div>
                    <div className={styles.timelineConnector}>
                      <div
                        className={styles.timelineDot}
                        style={{
                          backgroundColor: getStatusColor(appointment.status),
                        }}
                      ></div>
                      <div className={styles.timelineLine}></div>
                    </div>
                  </div>

                  <div className={styles.appointmentContent}>
                    <div className={styles.appointmentHeader}>
                      <h3 className={styles.appointmentType}>
                        <FaStethoscope className={styles.typeIcon} />
                        {appointment.therepy_type}
                      </h3>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: getStatusColor(appointment.status),
                        }}
                      >
                        {getStatusIcon(appointment.status)}
                        {getFormattedStatus(appointment.status)}
                      </span>
                    </div>

                    <div className={styles.appointmentDetails}>
                      {appointment.patient_name && (
                        <div className={styles.detailItem}>
                          <FaUser className={styles.detailIcon} />
                          <span className={styles.detailText}>
                            {appointment.patient_name}
                          </span>
                        </div>
                      )}
                      {appointment.doctor_name && (
                        <div className={styles.detailItem}>
                          <FaUser className={styles.detailIcon} />
                          <span className={styles.detailText}>
                            {appointment.doctor_name}
                          </span>
                        </div>
                      )}
                      {appointment.therapy_reason && (
                        <div className={styles.detailItem}>
                          <FaInfoCircle className={styles.detailIcon} />
                          <span className={styles.detailText}>
                            {appointment.therapy_reason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.appointmentActions}>
                    {appointment.status?.toLowerCase() !== "completed" && (
                      <button
                        className={styles.startButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (appointment.is_consultation) {
                            navigate(
                              `/consultation/${appointment.patient_id}/${appointment._id}`,
                              {
                                state: { appointment },
                              },
                            );
                          } else {
                            navigate(
                              `/appointment-details/${appointment._id}`,
                              {
                                state: { appointment },
                              },
                            );
                          }
                        }}
                      >
                        <FaPlay className={styles.buttonIcon} />
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noAppointments}>
                <div className={styles.emptyStateIcon}>
                  <FaCalendarAlt />
                </div>
                <h3 className={styles.emptyStateTitle}>
                  No appointments scheduled for today
                </h3>
                <p className={styles.emptyStateText}>
                  Your appointments for today will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <button
        className={styles.floatingButton}
        onClick={() => navigate("/get/appointments")}
        title="View All Appointments"
      >
        <FaExchangeAlt className={styles.floatingButtonIcon} />
      </button>
    </div>
  );
};

export default MyAppointments;
