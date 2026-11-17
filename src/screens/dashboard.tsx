import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  FaUsers,
  FaChartPie,
  FaMapMarkerAlt,
  FaClipboardList,
  FaExclamationTriangle,
  FaFilter,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import styles from "../css/dashboard.module.css";
import api from "../utils/central";

// --- Interfaces ---
interface AgeBucket {
  _id: number | string;
  count: number;
}
interface DemographicItem {
  _id: string;
  count: number;
}
interface GeographicItem {
  state: string;
  city: string;
  count: number;
}
interface PlanMetrics {
  total_plans: number;
  completed_on_time: number;
  completed_incomplete: number;
  exceeding_plans: number;
  on_time_percentage: number;
  dropout_percentage: number;
}
interface TimeSeriesPoint {
  name: string;
  val: number;
}
interface PlanTimeSeriesPoint {
  name: string;
  on_time_percentage: number;
  dropout_percentage: number;
}

const COLORS = [
  "#00685f",
  "#008378",
  "#89f5e7",
  "#924628",
  "#131b2e",
  "#3d4947",
];

// --- Sub-components ---
const TrendBadge = ({ trend }: { trend: any }) => {
  if (!trend) return null;
  return (
    <div
      className={`${styles.trendBadge} ${
        trend.isPositive ? styles.trendPositive : styles.trendNegative
      }`}
    >
      {trend.isUp ? <FaArrowUp /> : <FaArrowDown />}
      <span>{trend.value}%</span>
    </div>
  );
};

const TrendChart = ({ trend, metricId }: { trend: any; metricId: string }) => {
  if (!trend || !trend.sparklineData || trend.sparklineData.length < 2)
    return null;

  const gradientId = `colorGradient-${metricId}-${
    trend.isPositive ? "pos" : "neg"
  }`;
  const strokeColor = trend.isPositive ? "var(--primary)" : "var(--error)";

  return (
    <div className={styles.largeSparklineWrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={trend.sparklineData}
          margin={{ top: 10, right: 35, left: -25, bottom: 5 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.6} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(188, 201, 198, 0.2)"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--on-surface-variant)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            orientation="right"
            tick={{ fontSize: 10, fill: "var(--on-surface-variant)" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "var(--shadow-ambient)",
            }}
            labelStyle={{ fontWeight: "bold", color: "var(--on-surface)" }}
          />
          <Area
            type="monotone"
            dataKey="val"
            stroke={strokeColor}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Skeleton Loader Component ---
const DashboardSkeleton = () => (
  <div className={styles.bentoGrid}>
    <div className={`${styles.colSpan8} ${styles.kpiWrapper}`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`${styles.bentoCard} ${styles.kpiCard} ${styles.skeletonCard}`}
        >
          <div
            className={`${styles.skeletonBlock} ${styles.skeletonText}`}
            style={{ width: "40%", height: "20px", marginBottom: "8px" }}
          />
          <div
            className={`${styles.skeletonBlock} ${styles.skeletonText}`}
            style={{ width: "30%", height: "32px" }}
          />
          <div
            className={styles.skeletonBlock}
            style={{ width: "100%", height: "90px", marginTop: "auto" }}
          />
        </div>
      ))}
    </div>
    <div className={styles.colSpan4}>
      <div className={`${styles.bentoCard} ${styles.autoHeightCard}`}>
        <div
          className={`${styles.skeletonBlock} ${styles.skeletonText}`}
          style={{ width: "50%", height: "24px", marginBottom: "20px" }}
        />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`${styles.skeletonBlock} ${styles.skeletonText}`}
            style={{ width: "100%", height: "44px", marginBottom: "8px" }}
          />
        ))}
      </div>
    </div>
    <div className={styles.colSpan4}>
      <div className={`${styles.bentoCard} ${styles.fixedHeightCard}`}>
        <div
          className={`${styles.skeletonBlock} ${styles.skeletonText}`}
          style={{ width: "60%", height: "24px", marginBottom: "30px" }}
        />
        <div
          className={styles.skeletonBlock}
          style={{
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            margin: "0 auto",
          }}
        />
      </div>
    </div>
    <div className={styles.colSpan8}>
      <div className={`${styles.bentoCard} ${styles.fixedHeightCard}`}>
        <div
          className={`${styles.skeletonBlock} ${styles.skeletonText}`}
          style={{ width: "30%", height: "24px", marginBottom: "30px" }}
        />
        <div
          className={styles.skeletonBlock}
          style={{ width: "100%", height: "250px" }}
        />
      </div>
    </div>
  </div>
);

const PatientAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States updated to default to "this_month" ---
  const [timeline, setTimeline] = useState<string>("this_month");
  const [, setDropoutTimeline] = useState<string>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  // --- Dashboard Data States ---
  const [newPatientsCount, setNewPatientsCount] = useState<number>(0);
  const [patientTimeSeries, setPatientTimeSeries] = useState<TimeSeriesPoint[]>(
    [],
  );
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [ageData, setAgeData] = useState<AgeBucket[]>([]);
  const [maritalData, setMaritalData] = useState<DemographicItem[]>([]);
  const [referralData, setReferralData] = useState<DemographicItem[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicItem[]>([]);
  const [planMetrics, setPlanMetrics] = useState<PlanMetrics | null>(null);
  const [planTimeSeries, setPlanTimeSeries] = useState<PlanTimeSeriesPoint[]>(
    [],
  );

  useEffect(() => {
    if (timeline !== "custom") {
      setFetchTrigger((prev) => prev + 1);
    }
  }, [timeline]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("timeline", timeline);
        if (timeline === "custom") {
          if (startDate) params.append("startDate", startDate);
          if (endDate) params.append("endDate", endDate);
        }
        const query = `?${params.toString()}`;

        const dropoutParams = new URLSearchParams();
        const currentDropoutTimeline = timeline;
        dropoutParams.append("timeline", currentDropoutTimeline);
        if (timeline === "custom") {
          if (startDate) dropoutParams.append("startDate", startDate);
          if (endDate) dropoutParams.append("endDate", endDate);
        }
        const dropoutQuery = `?${dropoutParams.toString()}`;

        const [
          newPatientsRes,
          ageRes,
          demographicsRes,
          referralRes,
          geographicRes,
          dropoutRes,
        ] = await Promise.all([
          api.get(`/new/patients${query}`),
          api.get(`/age/patients${query}`),
          api.get(`/demographics/patients${query}`),
          api.get(`/referral/patients${query}`),
          api.get(`/geographic/patients${query}`),
          api.get(`/get/dropoutrate${dropoutQuery}`),
        ]);

        setNewPatientsCount(newPatientsRes.data.count || 0);
        setPatientTimeSeries(newPatientsRes.data.timeSeries || []);
        setRecentImages(newPatientsRes.data.recentImages || []);

        const formattedAge = ageRes.data.data.map((item: any) => ({
          name: item._id === "56+" ? "56+" : `${item._id} yrs`,
          count: item.count,
        }));
        setAgeData(formattedAge);
        setMaritalData(demographicsRes.data.data.maritalStatus || []);
        setReferralData(referralRes.data.data || []);
        setGeographicData((geographicRes.data.data || []).slice(0, 10));

        setPlanMetrics(dropoutRes.data.data);
        setPlanTimeSeries(dropoutRes.data.timeSeries || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Error loading dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchTrigger]);

  const handleCustomApply = () => setFetchTrigger((prev) => prev + 1);

  // --- Time-Series Trend Calculation Logic ---
  const calculateTimeSeriesTrend = (
    timeSeriesData: TimeSeriesPoint[],
    lowerIsBetter: boolean = false,
  ) => {
    if (!timeSeriesData || timeSeriesData.length < 2) return null;

    const firstPoint = timeSeriesData[0].val;
    const lastPoint = timeSeriesData[timeSeriesData.length - 1].val;

    const diff = lastPoint - firstPoint;
    const percentChange =
      firstPoint === 0 ? (diff > 0 ? 100 : 0) : (diff / firstPoint) * 100;

    let isPositiveTrend;
    if (lowerIsBetter) {
      isPositiveTrend = diff <= 0;
    } else {
      isPositiveTrend = diff >= 0;
    }

    return {
      value: Math.abs(percentChange).toFixed(1),
      isPositive: isPositiveTrend,
      isUp: diff >= 0,
      sparklineData: timeSeriesData,
    };
  };

  const dropoutSeries = planTimeSeries.map((d) => ({
    name: d.name,
    val: d.dropout_percentage,
  }));
  const onTimeSeries = planTimeSeries.map((d) => ({
    name: d.name,
    val: d.on_time_percentage,
  }));

  const patientTrend = calculateTimeSeriesTrend(patientTimeSeries, false);
  const dropoutTrend = calculateTimeSeriesTrend(dropoutSeries, true);
  const onTimeTrend = calculateTimeSeriesTrend(onTimeSeries, false);

  return (
    <div className={styles.dashboardLayout}>
      <div className={styles.topControlBar}>
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <FaFilter className={styles.filterIcon} />
            <select
              className={styles.filterSelect}
              value={timeline}
              onChange={(e) => {
                setTimeline(e.target.value);
                setDropoutTimeline(e.target.value);
              }}
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {timeline === "custom" && (
            <div className={styles.filterGroup}>
              <FaCalendarAlt className={styles.filterIcon} />
              <input
                type="date"
                className={styles.filterInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className={styles.filterToText}>to</span>
              <input
                type="date"
                className={styles.filterInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button
                className={styles.filterApplyBtn}
                onClick={handleCustomApply}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button
            onClick={() => setFetchTrigger((prev) => prev + 1)}
            className={styles.retryBtn}
          >
            Retry
          </button>
        </div>
      )}

      {/* Show the Skeleton when loading, otherwise show the dashboard grid */}
      {loading && !error ? (
        <DashboardSkeleton />
      ) : (
        <div
          className={`${styles.bentoGrid} ${loading ? styles.gridLoading : ""}`}
        >
          {/* ROW 1 */}
          <div className={`${styles.colSpan8} ${styles.kpiWrapper}`}>
            {/* Patient Card */}
            <div className={`${styles.bentoCard} ${styles.kpiCard}`}>
              <div className={styles.kpiHeaderRow}>
                <div className={styles.kpiTopLeft}>
                  <div className={styles.kpiHeader}>
                    <FaUsers className={styles.headerIconSmall} />
                    <span className={styles.statLabel}>
                      Patients (Filtered)
                    </span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValueTop}>
                      {newPatientsCount}
                    </span>
                    <TrendBadge trend={patientTrend} />
                  </div>
                </div>
                {recentImages.length > 0 && (
                  <div className={styles.avatarGroup}>
                    {recentImages.map((imgUrl, index) => (
                      <img
                        key={index}
                        src={imgUrl}
                        alt={`Patient ${index + 1}`}
                        className={styles.avatarImage}
                      />
                    ))}
                  </div>
                )}
              </div>
              <TrendChart trend={patientTrend} metricId="patients" />
            </div>

            {/* Dropout Rate Card */}
            <div className={`${styles.bentoCard} ${styles.kpiCard}`}>
              <div className={styles.kpiHeaderRow}>
                <div className={styles.kpiTopLeft}>
                  <div className={styles.kpiHeader}>
                    <FaExclamationTriangle
                      className={`${styles.headerIconSmall} ${styles.textTertiary}`}
                    />
                    <span className={styles.statLabel}>Plan Dropout Rate</span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValueTop}>
                      {planMetrics
                        ? `${planMetrics.dropout_percentage}%`
                        : "--"}
                    </span>
                    <TrendBadge trend={dropoutTrend} />
                  </div>
                </div>
              </div>
              <TrendChart trend={dropoutTrend} metricId="dropout" />
            </div>

            {/* On-Time Card */}
            <div className={`${styles.bentoCard} ${styles.kpiCard}`}>
              <div className={styles.kpiHeaderRow}>
                <div className={styles.kpiTopLeft}>
                  <div className={styles.kpiHeader}>
                    <FaClipboardList className={styles.headerIconSmall} />
                    <span className={styles.statLabel}>On-Time Completion</span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValueTop}>
                      {planMetrics
                        ? `${planMetrics.on_time_percentage}%`
                        : "--"}
                    </span>
                    <TrendBadge trend={onTimeTrend} />
                  </div>
                </div>
              </div>
              <TrendChart trend={onTimeTrend} metricId="ontime" />
            </div>
          </div>

          {/* Therapy Plan Metrics Breakdown */}
          <div className={styles.colSpan4}>
            <div className={`${styles.bentoCard} ${styles.autoHeightCard}`}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  <FaClipboardList className={styles.headerIcon} /> Therapy Plan
                  Metrics
                </h3>
              </div>
              {planMetrics ? (
                <div className={styles.teamList}>
                  <div className={styles.teamMemberRow}>
                    <div className={styles.memberInfo}>Total Plans</div>
                    <div className={styles.deptBadge}>
                      {planMetrics.total_plans}
                    </div>
                  </div>
                  <div className={styles.teamMemberRow}>
                    <div className={styles.memberInfo}>Completed On Time</div>
                    <div
                      className={`${styles.statusBadge} ${styles.badgePrimary}`}
                    >
                      {planMetrics.completed_on_time}
                    </div>
                  </div>
                  <div className={styles.teamMemberRow}>
                    <div className={styles.memberInfo}>
                      Incomplete / Dropout
                    </div>
                    <div
                      className={`${styles.statusBadge} ${styles.badgeError}`}
                    >
                      {planMetrics.completed_incomplete}
                    </div>
                  </div>
                  <div className={styles.teamMemberRow}>
                    <div className={styles.memberInfo}>Exceeding Plans</div>
                    <div
                      className={`${styles.statusBadge} ${styles.badgeTertiary}`}
                    >
                      {planMetrics.exceeding_plans}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No plan metrics available.
                </div>
              )}
            </div>
          </div>

          {/* Marital Status Breakdown */}
          <div className={styles.colSpan4}>
            <div className={`${styles.bentoCard} ${styles.fixedHeightCard}`}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  Marital Status Breakdown
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={maritalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {maritalData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 3) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(
                      value: number | undefined,
                      name: string | undefined,
                    ) => [
                      value ?? 0,
                      name
                        ? name.charAt(0).toUpperCase() + name.slice(1)
                        : "Unknown",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution */}
          <div className={styles.colSpan8}>
            <div className={`${styles.bentoCard} ${styles.fixedHeightCard}`}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  <FaChartPie className={styles.headerIcon} /> Age Distribution
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart
                  data={ageData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(188, 201, 198, 0.3)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
                  />
                  <Tooltip cursor={{ fill: "rgba(0, 104, 95, 0.05)" }} />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className={styles.colSpan8}>
            <div className={`${styles.bentoCard} ${styles.fixedHeightCard}`}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  <FaMapMarkerAlt className={styles.headerIcon} /> Top Home
                  Cities (Catchment Area)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart
                  data={geographicData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="rgba(188, 201, 198, 0.3)"
                  />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="city"
                    type="category"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: string) =>
                      value
                        ? value.charAt(0).toUpperCase() + value.slice(1)
                        : ""
                    }
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="var(--primary-container)"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Referral Sources */}
          <div className={styles.colSpan4}>
            <div className={`${styles.bentoCard} ${styles.fixedHeightCard}`}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  Referral Sources
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={referralData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {referralData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAnalyticsDashboard;
