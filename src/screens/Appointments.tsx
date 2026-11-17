import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaTimes,
  FaCalendarAlt,
  FaPlay,
  FaVideo,
  FaCheckCircle,
  FaForward,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/Appointments.module.css";
import WhatsAppReminderButton from "../components/WhatsappReminder";

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
  consultationId?: string;
  therapy_reason?: string;
  is_consultation?: boolean;
}

interface DayData {
  date: Date;
  appointments: Appointment[];
}

const DAYS_TO_LOAD = 7;

const formatLocalTime = (timeStr?: string) => {
  if (!timeStr) return "--:--";

  try {
    const [hourStr, minuteStr] = timeStr.split(":");
    if (!hourStr || !minuteStr) return timeStr.slice(0, 5);

    let hours = parseInt(hourStr, 10);
    const minutes = minuteStr.substring(0, 2);
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  } catch (error) {
    return timeStr.slice(0, 5);
  }
};

const isPastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

const isFutureDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate > today;
};

const isSessionTerminated = (status?: string) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "completed" || s === "cancelled" || s === "no show";
};

const AppointmentsPage: React.FC = () => {
  const [data, setData] = useState<DayData[]>([]);
  const [hasMorePast, setHasMorePast] = useState(true);
  const [hasMoreFuture, setHasMoreFuture] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAppointmentsForDateRange = async (
    startDate: Date,
    endDate: Date,
  ): Promise<DayData[]> => {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const response = await api.post("/get/appointments/dates", {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });
      const appointments = response.data.appointments || {};
      const dayDataArray: DayData[] = [];
      let currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const dateString = currentDate.toISOString().split("T")[0];
        dayDataArray.push({
          date: new Date(currentDate),
          appointments: appointments[dateString] || [],
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dayDataArray;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startDate = new Date(today);
      const endDate = new Date(today);

      startDate.setDate(today.getDate() - 2);
      endDate.setDate(today.getDate() + DAYS_TO_LOAD - 2);

      const appointments = await fetchAppointmentsForDateRange(
        startDate,
        endDate,
      );
      setData(appointments);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreDays = async (direction: "past" | "future") => {
    if (
      loadingMore ||
      (direction === "past" && !hasMorePast) ||
      (direction === "future" && !hasMoreFuture)
    )
      return;

    setLoadingMore(true);
    try {
      const baseDate =
        direction === "past" && data.length > 0
          ? new Date(data[0].date)
          : direction === "future" && data.length > 0
            ? new Date(data[data.length - 1].date)
            : new Date();

      const startDate = new Date(baseDate);
      const endDate = new Date(baseDate);

      if (direction === "past") {
        startDate.setDate(baseDate.getDate() - DAYS_TO_LOAD);
        endDate.setDate(baseDate.getDate() - 1);
      } else {
        startDate.setDate(baseDate.getDate() + 1);
        endDate.setDate(baseDate.getDate() + DAYS_TO_LOAD);
      }

      const newAppointments = await fetchAppointmentsForDateRange(
        startDate,
        endDate,
      );

      if (newAppointments.length === 0) {
        direction === "past" ? setHasMorePast(false) : setHasMoreFuture(false);
      } else {
        setData((prevData) =>
          direction === "past"
            ? [...newAppointments, ...prevData]
            : [...prevData, ...newAppointments],
        );
      }
    } catch (error) {
      console.error("Error loading more days:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === "completed") return "#16a34a";
    if (s === "in_progress") return "#FFA726";
    if (s === "cancelled") return "#ba1a1a";
    if (s === "no show") return "#8E24AA";
    return "var(--primary)";
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

  const handleCardClick = (appointment: Appointment) => {
    navigateToManagement(appointment, false);
  };

  const handleActionClick = (e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation();
    navigateToManagement(appointment, true);
  };

  const handleWhatsAppSuccess = () => {
    setSuccessMessage("WhatsApp reminder sent successfully");
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const navigateToManagement = (
    appointment: Appointment,
    isActionButton: boolean,
  ) => {
    if (appointment.is_consultation) {
      if (isSessionTerminated(appointment.status)) {
        navigate(`/consultationDetails/${appointment.consultationId}`);
      } else {
        navigate(
          `/complete-consultation/${appointment.patient_id}/${appointment._id}`,
        );
      }
      return;
    }

    if (isSessionTerminated(appointment.status)) {
      navigate(`/sessionDetails/${appointment._id}`);
    } else {
      if (isActionButton) {
        navigate(`/mark-appointment/${appointment._id}`, {
          state: { appointment },
        });
      } else {
        if (appointment.plan_id) {
          navigate(`/planDetails/${appointment.plan_id}`);
        }
      }
    }
  };

  const scrollToToday = () => {
    const todayIndex = data.findIndex(
      (day) => day.date.toDateString() === new Date().toDateString(),
    );
    if (todayIndex !== -1 && listRef.current) {
      const element = listRef.current.querySelector(
        `[data-date="${data[todayIndex].date.toISOString()}"]`,
      );
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (!loading) scrollToToday();
  }, [loading]);

  const renderActionButton = (appointment: any, date: Date) => {
    if (isSessionTerminated(appointment.status)) return null;
    if (isFutureDate(date)) return null;

    if (isPastDate(date)) {
      return (
        <button
          className={styles.finishButton}
          onClick={(e) => handleActionClick(e, appointment)}
        >
          <FaCheckCircle size={12} /> Finish?
        </button>
      );
    }

    if (appointment.status?.toLowerCase() === "in_progress") {
      return (
        <button
          className={styles.resumeButton}
          onClick={(e) => handleActionClick(e, appointment)}
        >
          <FaForward size={12} /> Resume
        </button>
      );
    }

    return (
      <button
        className={styles.startButton}
        onClick={(e) => handleActionClick(e, appointment)}
      >
        <FaPlay size={12} /> Start
      </button>
    );
  };

  return (
    <div className={styles.dashboardLayout}>
      {successMessage && (
        <div className={styles.successMessage}>
          <p>{successMessage}</p>
          <button
            className={styles.closeSuccessButton}
            onClick={() => setSuccessMessage(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <svg
          className={styles.heroBackgroundSvg}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.7,-76.4C58.3,-69.2,70,-58.5,78.2,-45.5C86.4,-32.5,91.1,-17.2,89.3,-2.6C87.5,12,79.2,25.9,70.1,38.2C61.1,50.5,51.2,61.2,39.2,69.5C27.2,77.7,13.6,83.5,-0.6,84.5C-14.8,85.5,-29.6,81.8,-42.6,74.1C-55.6,66.4,-66.8,54.7,-74.6,41.2C-82.4,27.7,-86.8,12.4,-86.1,-2.7C-85.3,-17.8,-79.4,-32.7,-69.9,-44.9C-60.4,-57.1,-47.4,-66.6,-33.9,-73.9C-20.4,-81.2,-6.4,-86.3,8,-81.4C22.4,-76.5,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
        <div className={styles.heroContent}>
          <div className={styles.heroHeaderRow}>
            <div>
              <h2 className={`${styles.pageTitle} ${styles.fontHeadline}`}>
                <FaCalendarAlt className={styles.titleIcon} /> All Appointments
              </h2>
              <p className={`${styles.pageSubtitle} ${styles.fontBody}`}>
                Manage your schedule efficiently
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.btnPrimary}
                onClick={() => loadMoreDays("past")}
                disabled={loadingMore || !hasMorePast}
              >
                {loadingMore ? (
                  <div
                    className={styles.spinner}
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                    }}
                  ></div>
                ) : (
                  <>
                    <FaPlay style={{ transform: "rotate(180deg)" }} size={10} />{" "}
                    Load Previous
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.centeredState}>
            <div className={styles.spinner} />
            <p className={styles.fontBody}>Loading Sessions...</p>
          </div>
        ) : (
          <div ref={listRef} className={styles.appointmentList}>
            {data.map((day) => (
              <div
                key={day.date.toISOString()}
                data-date={day.date.toISOString()}
                className={styles.daySection}
              >
                <div className={styles.dayHeader}>
                  <h2 className={styles.dayTitle}>{formatDate(day.date)}</h2>
                  <div className={styles.dayMeta}>
                    <span className={styles.appointmentCount}>
                      {day.appointments.length} appointments
                    </span>
                    <span className={styles.dayDate}>
                      {day.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {day.appointments.length > 0 ? (
                  <div className={styles.stripGrid}>
                    {day.appointments.map((appointment, index) => (
                      <div
                        key={appointment._id}
                        className={styles.stripCard}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => handleCardClick(appointment)}
                      >
                        <div className={styles.stripMain}>
                          <div className={styles.stripIcon}>
                            {appointment.therepy_type
                              .toLowerCase()
                              .includes("video") ? (
                              <FaVideo />
                            ) : (
                              <FaUser />
                            )}
                          </div>
                          <div className={styles.stripText}>
                            <h4>
                              {formatLocalTime(appointment.therepy_start_time)}
                              {appointment.is_consultation && (
                                <span className={styles.consultationBadge}>
                                  Conslt
                                </span>
                              )}
                            </h4>
                            <span className={styles.contactSpan}>
                              {appointment.therepy_type}
                            </span>
                          </div>
                        </div>

                        <div className={styles.stripMeta}>
                          <div className={styles.metaBlock}>
                            <span className={styles.metaLabel}>Patient</span>
                            <span className={styles.metaValue}>
                              {appointment.patient_name || "N/A"}
                            </span>
                          </div>
                          <div className={styles.metaBlock}>
                            <span className={styles.metaLabel}>Doctor</span>
                            <span className={styles.metaValue}>
                              {appointment.doctor_name || "N/A"}
                            </span>
                          </div>
                          <div className={styles.metaBlock}>
                            <span className={styles.metaLabel}>Status</span>
                            <span className={styles.metaValue}>
                              <span
                                className={styles.statusBadge}
                                style={{
                                  backgroundColor: getStatusColor(
                                    appointment.status,
                                  ),
                                }}
                              >
                                {getFormattedStatus(appointment.status)}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className={styles.stripActionsVisible}>
                          {!isSessionTerminated(appointment.status) &&
                            !isPastDate(day.date) && (
                              <div className={styles.whatsappContainer}>
                                <WhatsAppReminderButton
                                  sessionId={appointment._id}
                                  patientName={
                                    appointment.patient_name ||
                                    appointment.doctor_name ||
                                    "Patient"
                                  }
                                  size="small"
                                  disabled={false}
                                  onSuccess={handleWhatsAppSuccess}
                                  onClick={(e: React.MouseEvent) =>
                                    e.stopPropagation()
                                  }
                                />
                              </div>
                            )}
                          {renderActionButton(appointment, day.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noAppointments}>
                    <p>No appointments scheduled for this day.</p>
                  </div>
                )}
              </div>
            ))}

            <div className={styles.loadMoreContainer}>
              <button
                className={styles.btnPrimary}
                onClick={() => loadMoreDays("future")}
                disabled={loadingMore || !hasMoreFuture}
              >
                {loadingMore ? (
                  <div
                    className={styles.spinner}
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                    }}
                  ></div>
                ) : (
                  <>
                    <FaPlay size={10} /> Load More Days
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Toggle Control */}
      <div className={styles.floatingToggleContainer}>
        <button className={`${styles.floatingToggleButton} ${styles.active}`}>
          All Sessions
        </button>
        <button
          className={styles.floatingToggleButton}
          onClick={() => navigate("/get/aftercare")}
        >
          Aftercare
        </button>
      </div>
    </div>
  );
};

export default AppointmentsPage;
