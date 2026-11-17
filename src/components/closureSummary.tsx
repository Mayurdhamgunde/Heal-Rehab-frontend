import React from "react";
import {
  FaCheckCircle,
  FaShieldAlt,
  FaChartLine,
  FaCalendarAlt,
  FaExclamationCircle,
  FaTimesCircle,
  FaShareSquare,
  FaHospital,
} from "react-icons/fa";
import styles from "../css/closureSummary.module.css";

interface ClosureInformation {
  closure_date?: string;
  next_visit_date?: string | null;
  closure_reason?: string;
  closure_details?: string;
  final_remarks?: string;
  treatment_outcome?: string;
  follow_up_recommendations?: string;
  closed_by_name?: string;
}

interface SessionStatistics {
  estimated_sessions?: number;
  completed_sessions?: number;
  total_sessions_conducted?: number;
  completion_rate?: string;
}

interface TherapyDuration {
  planned_start?: string;
  planned_end?: string;
  actual_closure?: string;
}

interface TotalRemarks {
  presession?: number;
  postsession?: number;
}

interface Prescription {
  prescription_number?: string;
  [key: string]: any;
}

interface ClosureSummaryData {
  therapy_plan_id: string;
  therapy_name: string;
  patient_diagnosis: string;
  closure_information: ClosureInformation;
  session_statistics: SessionStatistics;
  therapy_duration: TherapyDuration;
  total_remarks: TotalRemarks;
  total_images: number;
  extra_addons: number;
  post_care_prescription_id?: string | null;
  post_care_prescription?: Prescription | null;
}

interface ClosureSummaryProps {
  summaryData: ClosureSummaryData;
  children?: React.ReactNode;
}

const ClosureSummary: React.FC<ClosureSummaryProps> = ({
  summaryData,
  children,
}) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const {
    closure_information,
    post_care_prescription,
    session_statistics,
    therapy_duration,
  } = summaryData;

  const reason = closure_information.closure_reason || "Completed";

  const getBannerConfig = (statusReason: string) => {
    switch (statusReason.toLowerCase()) {
      case "incomplete":
        return {
          bg: "#f59e0b",
          icon: <FaExclamationCircle className={styles.bannerIcon} />,
          title: "Therapy Plan Incomplete",
        };
      case "dropout":
        return {
          bg: "#ef4444",
          icon: <FaTimesCircle className={styles.bannerIcon} />,
          title: "Patient Dropped Out",
        };
      case "refer":
        return {
          bg: "#3b82f6",
          icon: <FaShareSquare className={styles.bannerIcon} />,
          title: "Patient Referred",
        };
      case "opd":
        return {
          bg: "#8b5cf6",
          icon: <FaHospital className={styles.bannerIcon} />,
          title: "Transferred to OPD",
        };
      case "completed":
      default:
        return {
          bg: "var(--success)",
          icon: <FaCheckCircle className={styles.bannerIcon} />,
          title: "Therapy Plan Completed",
        };
    }
  };

  const config = getBannerConfig(reason);

  return (
    <div className={styles.closureContainer}>
      <div
        className={styles.successBanner}
        style={{
          backgroundColor: config.bg,
          boxShadow: `0 4px 6px -1px ${config.bg}40`,
        }}
      >
        <div className={styles.bannerLeft}>
          {config.icon}
          <div>
            <h3 className={styles.bannerTitle}>{config.title}</h3>
            <p className={styles.bannerSubtitle}>Closure Summary</p>
          </div>
        </div>
        <div className={styles.statusPill}>STATUS: {reason.toUpperCase()}</div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainCol}>
          <div className={styles.mainInfoCard}>
            <div className={styles.cardHeader}>
              <FaShieldAlt className={styles.headerIcon} />
              <span>Closure status</span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoBlock}>
                <label>CLOSED BY</label>
                <div className={styles.infoTextPrimary}>
                  {closure_information.closed_by_name || "Unknown"}
                </div>
              </div>
              <div className={styles.infoBlock}>
                <label>REASON</label>
                <div
                  className={styles.infoTextSuccess}
                  style={{ color: config.bg }}
                >
                  {reason}
                </div>
              </div>
              <div className={styles.infoBlock}>
                <label>CLOSURE DATE</label>
                <div className={styles.infoText}>
                  {formatDate(closure_information.closure_date)}
                </div>
              </div>
            </div>

            {closure_information.closure_details && (
              <div className={styles.innerDetailBox}>
                <label>DETAILED SUMMARY</label>
                <p>{closure_information.closure_details}</p>
              </div>
            )}

            {closure_information.treatment_outcome && (
              <div className={styles.innerDetailBox}>
                <label>TREATMENT OUTCOME</label>
                <p>{closure_information.treatment_outcome}</p>
              </div>
            )}

            <div className={styles.infoGridRow}>
              {closure_information.final_remarks && (
                <div className={styles.innerDetailBox}>
                  <label>FINAL REMARKS</label>
                  <p>{closure_information.final_remarks}</p>
                </div>
              )}
              {closure_information.follow_up_recommendations && (
                <div className={styles.innerDetailBox}>
                  <label>FOLLOW UP RECOMMENDATIONS</label>
                  <p>{closure_information.follow_up_recommendations}</p>
                </div>
              )}
            </div>
          </div>
          {children}
        </div>

        <div className={styles.sideCol}>
          <div className={styles.sideCard}>
            <div className={styles.cardHeader}>
              <FaChartLine className={styles.headerIcon} />
              <span>Session Stats</span>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  {session_statistics.estimated_sessions || 0}
                </span>
                <span className={styles.statLabel}>ESTIMATED</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  {session_statistics.completed_sessions || 0}
                </span>
                <span className={styles.statLabel}>COMPLETED</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  {session_statistics.total_sessions_conducted || 0}
                </span>
                <span className={styles.statLabel}>CONDUCTED</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValuePrimary}>
                  {session_statistics.completion_rate || "0%"}
                </span>
                <span className={styles.statLabel}>RATE</span>
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.cardHeader}>
              <FaCalendarAlt className={styles.headerIcon} />
              <span>Therapy Duration</span>
            </div>
            <div className={styles.timeline}>
              <div className={styles.timelineNode}>
                <div className={styles.dot}></div>
                <div className={styles.nodeData}>
                  <label>PLANNED START</label>
                  <span>{formatDate(therapy_duration.planned_start)}</span>
                </div>
              </div>
              <div className={styles.timelineNode}>
                <div className={styles.dot}></div>
                <div className={styles.nodeData}>
                  <label>PLANNED END</label>
                  <span>{formatDate(therapy_duration.planned_end)}</span>
                </div>
              </div>
              <div className={styles.timelineNode}>
                <div className={`${styles.dot} ${styles.dotActive}`}></div>
                <div className={styles.nodeData}>
                  <label>ACTUAL CLOSURE</label>
                  <span className={styles.textPrimary}>
                    {formatDate(therapy_duration.actual_closure)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.cardHeader}>
              <FaShieldAlt className={styles.headerIcon} />
              <span>Next Step</span>
            </div>
            <div className={styles.nextStepsFlex}>
              <div className={styles.infoBlock}>
                <label>FOLLOW UP DATE</label>
                <div className={styles.infoTextPrimary}>
                  {formatDate(closure_information.next_visit_date)}
                </div>
              </div>
              <div className={styles.infoBlock}>
                <label>POST-CARE RX</label>
                <div className={styles.rxBadge}>
                  {post_care_prescription
                    ? post_care_prescription.prescription_number || "Issued"
                    : "None"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosureSummary;
