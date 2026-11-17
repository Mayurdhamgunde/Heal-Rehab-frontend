import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import api from '../utils/central';
import styles from "../css/AppointmentsTimeline.module.css";

interface AppointmentsTimelineProps {
  selectedMonth?: string;
  selectedYear?: string;
  startDate?: string;
  endDate?: string;
}

const AppointmentsTimeline: React.FC<AppointmentsTimelineProps> = ({
  selectedMonth,
  selectedYear,
  startDate,
  endDate,
}) => {
  const [chartType, setChartType] = useState("line");
  const [statusFilter, setStatusFilter] = useState("all");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;

  const fetchData = async () => {
    if (!token) {
      console.warn("Token not found! Please log in.");
      return;
    }
    setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      if (startDate && endDate) {
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        queryParams.append('timeframe', 'daily');
      } else if (selectedMonth && selectedYear) {
        queryParams.append('month', selectedMonth);
        queryParams.append('year', selectedYear);
        queryParams.append('timeframe', 'daily');
      } else if (selectedYear) {
        queryParams.append('year', selectedYear);
        queryParams.append('timeframe', 'monthly');
      } else {
        queryParams.append('timeframe', 'weekly');
      }

      const response = await api.get(`/appointments/chart?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        const transformedData = response.data.data.map((item: any) => {
          const scheduled =
            item.count - item.completed - item.pending - item.cancelled;
          // Calculate pending as all non-completed appointments (scheduled + pending + cancelled)
          const pendingNonCompleted = item.count - item.completed;

          return {
            date: item.date,
            day: item.date.slice(-2),
            month: new Date(item.date).toLocaleString("default", {
              month: "short",
            }),
            weekday: new Date(item.date).toLocaleDateString("en-US", {
              weekday: "short",
            }),
            appointments: item.count,
            completed: item.completed,
            cancelled: item.cancelled,
            pending: pendingNonCompleted, // This now represents all non-completed appointments
            originalPending: item.pending, // Keep the original pending value if needed
            scheduled: scheduled < 0 ? 0 : scheduled, // Ensure no negative values
          };
        });

        let sortedData;

        if (selectedYear && !selectedMonth && !startDate) {
          const monthOrder = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          sortedData = transformedData.sort(
            (a: any, b: any) =>
              monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
          );
        } else if ((selectedYear && selectedMonth) || startDate) {
          sortedData = transformedData.sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        } else {
          const weekdayOrder = [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
          ];
          sortedData = transformedData.sort(
            (a: any, b: any) =>
              weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday)
          );
        }

        setData(sortedData);
      } else {
        console.error("Failed to fetch data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, selectedMonth, selectedYear, startDate, endDate]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const tooltipLabel =
        statusFilter === "pending"
          ? "Non-Completed Appointments"
          : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);

      return (
        <div className={styles.tooltip}>
          <p style={{ margin: 0 }}>
            <strong>Date:</strong> {payload[0].payload.date}
          </p>
          <p style={{ margin: 0 }}>
            <strong>{tooltipLabel}:</strong> {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const getXAxisKey = () => {
    if ((selectedYear && selectedMonth) || startDate) return "day";
    if (selectedYear && !selectedMonth) return "month";
    return "weekday";
  };

  const getDataKey = () => {
    switch (statusFilter) {
      case "completed":
        return "completed";
      case "pending":
        return "pending"; // This now represents all non-completed appointments
      case "cancelled":
        return "cancelled";
      case "scheduled":
        return "scheduled";
      default:
        return "appointments";
    }
  };

  const getColor = () => {
    switch (statusFilter) {
      case "completed":
        return "#28a745"; // Green
      case "pending":
        return "#ffc107"; // Yellow
      case "cancelled":
        return "#dc3545"; // Red
      case "scheduled":
        return "#17a2b8"; // Cyan
      default:
        return "#007b8e"; // Default
    }
  };

  const ChartTypeOption = ({
    value,
    children,
  }: {
    value: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>;

  return (
    <div className={styles.container}>
      <div className={styles.filterContainer}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className={styles.select}
            style={{ paddingLeft: "2.5rem" }}
          >
            <ChartTypeOption value="line" icon={TrendingUp}>
              Line Chart
            </ChartTypeOption>
            <ChartTypeOption value="bar" icon={BarChart3}>
              Bar Chart
            </ChartTypeOption>
          </select>
          <div
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#007b8e",
            }}
          >
            {chartType === "line" ? (
              <TrendingUp size={16} />
            ) : (
              <BarChart3 size={16} />
            )}
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
          }}
          className={styles.select}
        >
          <option value="all">All Appointments</option>
          <option value="completed">Completed</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className={styles.chartContainer}>
        {loading ? (
          <div className={styles.loading}>Loading chart...</div>
        ) : data.length === 0 ? (
          <div className={styles.loading}>No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
                <XAxis
                  dataKey={getXAxisKey()}
                  stroke="#007b8e"
                  tick={{ fill: "#007b8e" }}
                  axisLine={{ stroke: "#007b8e" }}
                />
                <YAxis stroke="#007b8e" tick={{ fill: "#007b8e" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={getDataKey()}
                  stroke={getColor()}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, stroke: "#FF6B6B", strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
                <XAxis
                  dataKey={getXAxisKey()}
                  stroke="#007b8e"
                  tick={{ fill: "#007b8e" }}
                  axisLine={{ stroke: "#007b8e" }}
                />
                <YAxis stroke="#007b8e" tick={{ fill: "#007b8e" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={getDataKey()}
                  fill={getColor()}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AppointmentsTimeline;