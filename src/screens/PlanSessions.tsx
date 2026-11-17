import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "../css/planSessions.module.css";
import api from "../utils/central";

interface TherapySession {
  _id: string;
  patient_id: string;
  patient_name: string;
  therepy_type: string;
  therepy_link: string | null;
  therepy_start_time: string;
  therepy_end_time: string;
  therepy_date: string;
  doctor_id: string;
  doctor_name: string;
  plan_id: string;
  status: string;
  session_start_time?: string;
  session_end_time?: string;
  session_duration?: number;
  google_calendar_event_id?: string;
}

interface SessionDetailsProps {
  onBack?: () => void;
}

const PlanSessions: React.FC<SessionDetailsProps> = ({ onBack }) => {
  const { planId } = useParams<{ planId: string }>();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // console.log('planId:', planId);
    if (!planId) {
      setError("No plan ID provided");
      setLoading(false);
      return;
    }
    fetchSessions();
  }, [planId]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/plan/therapy/${planId}`);
      // console.log('API Response:', response.data);
      setSessions(
        Array.isArray(response.data.sessions)
          ? response.data.sessions
          : response.data || [],
      );
    } catch (error: any) {
      console.error(
        "Error fetching sessions:",
        error.response || error.message,
      );
      setError("Failed to load therapy sessions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#4CAF50";
      case "scheduled":
        return "#f48c36";
      case "cancelled":
        return "#F44336";
      default:
        return "#007b8e";
    }
  };

  const openSessionLink = (link: string | null) => {
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const renderSkeletonLoader = () => (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonDate}></div>
            <div className={styles.skeletonStatus}></div>
          </div>
          <div className={styles.skeletonInfo}>
            <div className={styles.skeletonRow}></div>
            <div className={styles.skeletonRow}></div>
          </div>
          <div className={styles.skeletonButton}></div>
        </div>
      ))}
    </div>
  );

  const renderSessionCard = (session: TherapySession) => (
    <div key={session._id} className={styles.sessionCard}>
      <div className={styles.sessionHeader}>
        <div className={styles.dateTimeContainer}>
          <h3 className={styles.dateText}>
            {formatDate(session.therepy_date)}
          </h3>
          <p className={styles.timeText}>
            {session.therepy_start_time} - {session.therepy_end_time}
          </p>
        </div>
        <div
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor(session.status) }}
        >
          <span className={styles.statusText}>{session.status}</span>
        </div>
      </div>

      <div className={styles.sessionInfo}>
        <div className={styles.infoRow}>
          <div className={styles.iconContainer}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.infoText}>{session.doctor_name}</span>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.iconContainer}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
              <path
                d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.infoText}>{session.therepy_type}</span>
        </div>

        {session.therepy_link && (
          <button
            className={styles.linkButton}
            onClick={() => openSessionLink(session.therepy_link)}
          >
            <svg className={styles.linkIcon} viewBox="0 0 24 24" fill="none">
              <path
                d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.71"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Open Session Link
          </button>
        )}
      </div>
    </div>
  );

  // Separate sessions into completed and scheduled
  const completedSessions = sessions.filter(
    (session) => session.status.toLowerCase() === "completed",
  );
  const scheduledSessions = sessions.filter(
    (session) => session.status.toLowerCase() === "scheduled",
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            <svg className={styles.backIcon} viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5m7-7l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <h1 className={styles.pageTitle}>Plan Sessions</h1>
      </div>

      <div className={styles.content}>
        {loading ? (
          renderSkeletonLoader()
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Error Loading Sessions</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={fetchSessions}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Completed Sessions Section */}
            <div className={styles.sessionSection}>
              <h2 className={styles.sectionTitle}>Completed Sessions</h2>
              {completedSessions.length > 0 ? (
                <div className={styles.sessionsGrid}>
                  {completedSessions.map(renderSessionCard)}
                </div>
              ) : (
                <div className={styles.noSessionsContainer}>
                  <div className={styles.noSessionsIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 16l-4-4-4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className={styles.noSessionsTitle}>
                    No Completed Sessions
                  </h2>
                  <p className={styles.noSessionsMessage}>
                    There are currently no completed therapy sessions for this
                    plan.
                  </p>
                </div>
              )}
            </div>

            {/* Scheduled Sessions Section */}
            <div className={styles.sessionSection}>
              <h2 className={styles.sectionTitle}>Scheduled Sessions</h2>
              {scheduledSessions.length > 0 ? (
                <div className={styles.sessionsGrid}>
                  {scheduledSessions.map(renderSessionCard)}
                </div>
              ) : (
                <div className={styles.noSessionsContainer}>
                  <div className={styles.noSessionsIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 16l-4-4-4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className={styles.noSessionsTitle}>
                    No Scheduled Sessions
                  </h2>
                  <p className={styles.noSessionsMessage}>
                    There are currently no scheduled therapy sessions for this
                    plan.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanSessions;
