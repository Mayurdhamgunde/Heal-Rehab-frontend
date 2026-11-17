import React, { useMemo, useState, useEffect } from "react";
import { FaChartLine, FaArrowUp, FaArrowDown, FaSpinner } from "react-icons/fa";
import styles from "../../css/PatientView.module.css";
import api from "../../utils/central"; // Make sure this path is correct for your project

interface RehabProgressChartProps {
  patientId: string;
}

interface ScoreSeries {
  session_id: string;
  date: string;
  score: number;
}

interface TrendChange {
  previous_score: number;
  current_score: number;
  net_change: number;
  percentage_change: number;
  trend: string;
}

interface TrendData {
  success: boolean;
  patient_details: {
    patient_id: string;
    patient_name: string;
  };
  current_score: number | null;
  change: TrendChange | null;
  series: ScoreSeries[];
}

// Resized for the side panel widget
const CHART_WIDTH = 400;
const CHART_HEIGHT = 220;
const PAD_X = 15;
const PAD_Y = 35;

const RehabProgressChart: React.FC<RehabProgressChartProps> = ({ patientId }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .get(`/patient/score/${patientId}`)
      .then((res) => {
        if (isMounted) {
          setTrendData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to fetch recovery trend:", err);
          setError("Failed to load trend data.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const dataPoints = useMemo(() => {
    if (!trendData?.series) return [];
    return trendData.series.map((s) => ({
      id: s.session_id,
      date: new Date(s.date),
      score: s.score,
    }));
  }, [trendData]);

  if (isLoading) {
    return (
      <div className={styles.bentoCard} style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FaSpinner className="fa-spin" style={{ color: "var(--primary)", fontSize: "1.5rem" }} />
      </div>
    );
  }

  if (error || dataPoints.length < 2) {
    return (
      <div className={styles.bentoCard} style={{ height: "100%" }}>
        <div className={styles.cardHeader}>
          <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
            Recovery Trend
          </h3>
          <FaChartLine style={{ color: "#cbd5e1" }} />
        </div>
        <div className={styles.emptyState}>
          {error || "At least two evaluated sessions are needed to generate a trend analysis."}
        </div>
      </div>
    );
  }

  const currentScore = trendData?.current_score ?? dataPoints[dataPoints.length - 1].score;
  const scoreChange = trendData?.change?.net_change ?? 0;
  const percentChange = trendData?.change?.percentage_change ?? 0;
  const isPositive = scoreChange >= 0;

  const themeColor = isPositive ? "#10b981" : "#ef4444";
  const bgGradient = isPositive ? "url(#gradientGreen)" : "url(#gradientRed)";

  const minScore = Math.min(...dataPoints.map((d) => d.score));
  const maxScore = Math.max(...dataPoints.map((d) => d.score));
  const range = Math.max(maxScore - minScore, 10);
  const yMin = Math.max(0, minScore - range * 0.1);
  const yMax = Math.min(100, maxScore + range * 0.1);

  const plotW = CHART_WIDTH - PAD_X * 2;
  const plotH = CHART_HEIGHT - PAD_Y * 2;

  const xFor = (i: number) => PAD_X + (i / (dataPoints.length - 1)) * plotW;
  const yFor = (score: number) => PAD_Y + plotH - ((score - yMin) / (yMax - yMin)) * plotH;

  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.score)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xFor(dataPoints.length - 1)} ${CHART_HEIGHT - PAD_Y} L ${PAD_X} ${CHART_HEIGHT - PAD_Y} Z`;

  return (
    <div
      className={styles.bentoCard}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h3
            className={`${styles.cardTitle} ${styles.fontHeadline}`}
            style={{ marginBottom: "0.25rem" }}
          >
            Overall Recovery
          </h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                fontFamily: "Manrope",
                color: "var(--on-surface)",
              }}
            >
              {currentScore}
            </span>
            {trendData?.change && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: themeColor,
                }}
              >
                {isPositive ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                {Math.abs(scoreChange)} ({Math.abs(percentChange)}%)
              </span>
            )}
          </div>
        </div>
        <FaChartLine style={{ color: "#cbd5e1" }} />
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          flex: 1,
          minHeight: "150px",
          cursor: "crosshair",
        }}
      >
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line
            x1={PAD_X}
            y1={CHART_HEIGHT - PAD_Y}
            x2={CHART_WIDTH - PAD_X}
            y2={CHART_HEIGHT - PAD_Y}
            stroke="rgba(188, 201, 198, 0.3)"
            strokeWidth={1}
          />
          <path d={areaPath} fill={bgGradient} />
          <path
            d={linePath}
            fill="none"
            stroke={themeColor}
            strokeWidth={3}
            strokeLinejoin="round"
          />

          {dataPoints.map((p, i) => {
            const x = xFor(i);
            const y = yFor(p.score);
            return (
              <g
                key={p.id}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <text
                  x={x}
                  y={CHART_HEIGHT - PAD_Y + 16}
                  fontSize="10"
                  fill="var(--on-surface-variant)"
                  textAnchor="middle"
                >
                  {p.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </text>

                {hoverIdx === i && (
                  <>
                    <line
                      x1={x}
                      y1={PAD_Y - 10}
                      x2={x}
                      y2={CHART_HEIGHT - PAD_Y}
                      stroke="var(--on-surface-variant)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <circle cx={x} cy={y} r={5} fill={themeColor} stroke="#fff" strokeWidth={2} />
                  </>
                )}
                <rect
                  x={x - plotW / dataPoints.length / 2}
                  y={0}
                  width={plotW / dataPoints.length}
                  height={CHART_HEIGHT}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>

        {hoverIdx !== null && (
          <div
            className={styles.chartStockTooltip}
            style={{
              left: `${(xFor(hoverIdx) / CHART_WIDTH) * 100}%`,
              top: `${(yFor(dataPoints[hoverIdx].score) / CHART_HEIGHT) * 100}%`,
            }}
          >
            <div className={styles.chartStockTooltipDate}>
              {dataPoints[hoverIdx].date.toLocaleDateString()}
            </div>
            <div className={styles.chartStockTooltipScore}>
              Score: <span>{dataPoints[hoverIdx].score}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RehabProgressChart;