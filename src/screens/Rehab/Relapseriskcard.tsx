import React, { useState } from "react";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaSyncAlt,
  FaSpinner,
  FaCheckCircle,
  FaRegClock,
} from "react-icons/fa";
// Adjust this path if your folder structure differs — this assumes
// RelapseRiskCard.tsx sits at screens/Rehab/, mirroring RelapsedlinkControle.
import api from "../../utils/central";
import styles from "../../css/Rehab/Relapseriskcard.module.css";

export interface RelapseRiskAssessment {
  risk_level: "Low" | "Moderate" | "High" | "Critical" | "Insufficient Data";
  risk_score: number | null;
  confidence: "Low" | "Medium" | "High" | null;
  contributing_factors: string[];
  protective_factors: string[];
  recommended_actions: string[];
  rationale: string;
  assessed_at?: string | null;
}

interface RelapseRiskCardProps {
  patientId: string;
  /** Pass patient.relapse_risk_assessment here so the card shows the
   *  last-saved prediction immediately, with no network call on mount. */
  initialAssessment?: RelapseRiskAssessment | null;
  /** Fires after a successful (re-)assessment so the parent can sync its
   *  own patient state, mirroring RelapseLinkControl's onLinked prop. */
  onAssessed?: (assessment: RelapseRiskAssessment) => void;
}

const RISK_STYLES: Record<string, string> = {
  Low: styles.riskLow,
  Moderate: styles.riskModerate,
  High: styles.riskHigh,
  Critical: styles.riskCritical,
  "Insufficient Data": styles.riskUnknown,
};

function formatAssessedAt(value?: string | null): string {
  if (!value) return "Not yet assessed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet assessed";
  return `Assessed ${date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} · ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * Displays the patient's stored relapse risk prediction and lets the user
 * (re-)run it on demand via GET /patient/relapse/risk/:patientId.
 *
 * Deliberately does NOT auto-fetch a fresh assessment on mount — that
 * endpoint calls Gemini and overwrites the stored prediction every time
 * it's hit, so firing it just because the page loaded would burn tokens
 * silently. It only shows what's already on the patient record until the
 * user explicitly asks for a new read.
 */
const RelapseRiskCard: React.FC<RelapseRiskCardProps> = ({
  patientId,
  initialAssessment = null,
  onAssessed,
}) => {
  const [assessment, setAssessment] = useState<RelapseRiskAssessment | null>(
    initialAssessment,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRun = assessment !== null;

  const runAssessment = async () => {
    if (!patientId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/patient/relapse/risk/${patientId}`);
      const data: RelapseRiskAssessment = response.data.data;
      setAssessment(data);
      onAssessed?.(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Couldn't generate a risk assessment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const riskClass = assessment
    ? RISK_STYLES[assessment.risk_level] || styles.riskUnknown
    : styles.riskUnknown;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <FaShieldAlt className={styles.titleIcon} />
          <h3 className={styles.title}>Relapse Risk Assessment</h3>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={runAssessment}
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className={styles.spinIcon} /> Analyzing
            </>
          ) : hasRun ? (
            <>
              <FaSyncAlt /> Re-assess
            </>
          ) : (
            "Run Assessment"
          )}
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {!hasRun && !loading && (
        <div className={styles.emptyState}>
          <FaShieldAlt className={styles.emptyIcon} />
          <p>
            No relapse risk assessment has been run for this patient yet. Run
            one to get an AI-weighted read on current risk signals.
          </p>
        </div>
      )}

      {loading && !hasRun && (
        <div className={styles.loadingState}>
          <FaSpinner className={styles.spinIcon} />
          <p>Weighing sessions, assessments, and relapse history…</p>
        </div>
      )}

      {hasRun && assessment && (
        <>
          <div className={styles.summaryRow}>
            <span className={`${styles.riskPill} ${riskClass}`}>
              {assessment.risk_level}
            </span>
            {assessment.risk_score !== null && (
              <span className={styles.scoreBlock}>
                <span className={styles.scoreValue}>
                  {assessment.risk_score}
                </span>
                <span className={styles.scoreMax}>/100</span>
              </span>
            )}
            {assessment.confidence && (
              <span className={styles.confidenceTag}>
                {assessment.confidence} confidence
              </span>
            )}
            <span className={styles.timestamp}>
              <FaRegClock /> {formatAssessedAt(assessment.assessed_at)}
            </span>
          </div>

          {(assessment.contributing_factors.length > 0 ||
            assessment.protective_factors.length > 0) && (
            <div className={styles.factorsGrid}>
              <div className={styles.factorColumn}>
                <p className={styles.factorLabel}>Contributing Factors</p>
                {assessment.contributing_factors.length > 0 ? (
                  <ul className={styles.factorList}>
                    {assessment.contributing_factors.map((f, i) => (
                      <li key={i} className={styles.factorItemWarn}>
                        <FaExclamationTriangle /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.factorEmpty}>None identified</p>
                )}
              </div>
              <div className={styles.factorColumn}>
                <p className={styles.factorLabel}>Protective Factors</p>
                {assessment.protective_factors.length > 0 ? (
                  <ul className={styles.factorList}>
                    {assessment.protective_factors.map((f, i) => (
                      <li key={i} className={styles.factorItemGood}>
                        <FaCheckCircle /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.factorEmpty}>None identified</p>
                )}
              </div>
            </div>
          )}

          {assessment.recommended_actions.length > 0 && (
            <div className={styles.actionsBlock}>
              <p className={styles.factorLabel}>Recommended Actions</p>
              <ul className={styles.actionsList}>
                {assessment.recommended_actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {assessment.rationale && (
            <p className={styles.rationale}>{assessment.rationale}</p>
          )}
        </>
      )}
    </div>
  );
};

export default RelapseRiskCard;
