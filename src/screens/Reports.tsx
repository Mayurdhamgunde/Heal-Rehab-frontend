import React, { useState } from "react";
import LeaderBoard from "./LeaderBoard";
import Graph from "./AppointmentsTimeline";
import DailyReport from "./DailyReport";
import styles from "../css/Reports.module.css";
import TherapyTypeByDoctor from "./TherapyTypesByDoctor";
import AdminReports from "./AdminReport";
import { ReferralDetails } from "./reportComponent";
import { FaChartBar } from "react-icons/fa";

interface DashboardProps {
  // Add any props you might need in the future
}

const Reports: React.FC<DashboardProps> = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const periodOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "this month", label: "This Month" },
    { value: "last month", label: "Last Month" },
    { value: "this year", label: "This Year" },
    { value: "last year", label: "Last Year" },
    { value: "custom", label: "Custom" },
  ];

  // Calculate month and year based on selected period
  const getDateFilters = () => {
    const now = new Date();
    let month = "";
    let year = "";
    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    const formatDate = (date: Date) => date.toISOString().split("T")[0]; // YYYY-MM-DD

    switch (selectedPeriod) {
      case "today":
        const today = formatDate(now);
        startDate = today;
        endDate = today;
        month = (now.getMonth() + 1).toString().padStart(2, "0");
        year = now.getFullYear().toString();
        console.log("Time Period: Today →", {
          startDate,
          endDate,
          month,
          year,
        });
        break;

      case "this month":
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
        startDate = formatDate(firstDay);
        endDate = formatDate(lastDay);
        month = (now.getMonth() + 1).toString().padStart(2, "0");
        year = now.getFullYear().toString();
        console.log("Time Period: This Month →", {
          startDate,
          endDate,
          month,
          year,
        });
        break;

      case "last month":
        const lastMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const firstDayLast = new Date(
          lastMonthDate.getFullYear(),
          lastMonthDate.getMonth(),
          1,
        );
        const lastDayLast = new Date(
          lastMonthDate.getFullYear(),
          lastMonthDate.getMonth() + 1,
          0,
        );
        startDate = formatDate(firstDayLast);
        endDate = formatDate(lastDayLast);
        month = (lastMonthDate.getMonth() + 1).toString().padStart(2, "0");
        year = lastMonthDate.getFullYear().toString();
        console.log("Time Period: Last Month →", {
          startDate,
          endDate,
          month,
          year,
        });
        break;

      case "this year":
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
        year = now.getFullYear().toString();
        console.log("Time Period: This Year →", { startDate, endDate, year });
        break;

      case "last year":
        const lastYear = now.getFullYear() - 1;
        startDate = `${lastYear}-01-01`;
        endDate = `${lastYear}-12-31`;
        year = lastYear.toString();
        console.log("Time Period: Last Year →", { startDate, endDate, year });
        break;

      case "all":
        startDate = undefined;
        endDate = undefined;
        console.log("Time Period: All Time → No date filters");
        break;

      case "custom":
        startDate = customStartDate || undefined;
        endDate = customEndDate || undefined;
        console.log("Time Period: Custom →", { startDate, endDate });
        break;
    }

    return { month, year, startDate, endDate };
  };

  const { month, year, startDate, endDate } = getDateFilters();
  return (
    <div className={styles.dashboardContainer}>
      {/* Updated Header with filters beside */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <FaChartBar className={styles.titleIcon} />
            Reports Dashboard
          </h1>
          <p className={styles.pageSubtitle}>
            View comprehensive analytics and performance reports
          </p>
        </div>
        <div className={styles.filterControls}>
          <div className={styles.dropdown}>
            <label htmlFor="period-select" className={styles.filterLabel}>
              Time Period
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  if (e.target.value !== "custom") {
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }
                }}
                className={styles.periodSelect}
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className={styles.dropdownIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </div>
          </div>
          {selectedPeriod === "custom" && (
            <div className={styles.dateRangePicker}>
              <div className={styles.dateField}>
                <label htmlFor="start-date" className={styles.SfilterLabel}>
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateField}>
                <label htmlFor="end-date" className={styles.SfilterLabel}>
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentCard}>
          <h2 className={styles.contentTitle}>Leader Board</h2>
          <div className={styles.componentWrapper}>
            <LeaderBoard
              selectedMonth={month}
              selectedYear={year}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        </div>

        {/* Other Components (Single-Column Layout) */}
        <div className={styles.singleColumn}>
          <div className={styles.contentCard}>
            <h2 className={styles.contentTitle}>Appointment Timeline</h2>
            <div className={styles.componentWrapper}>
              <Graph
                startDate={startDate}
                endDate={endDate}
                selectedMonth={month}
                selectedYear={year}
              />
            </div>
          </div>

          <div className={styles.topCards}>
            <div className={styles.contentCard}>
              <div className={styles.componentWrapper}>
                <ReferralDetails
                  startDate={startDate}
                  endDate={endDate}
                  selectedMonth={month}
                  selectedYear={year}
                />
              </div>
            </div>
          </div>

          <div className={styles.contentCard}>
            <h2 className={styles.contentTitle}>Admin Reports</h2>
            <div className={styles.componentWrapper}>
              <AdminReports
                startDate={startDate}
                endDate={endDate}
                selectedMonth={month}
                selectedYear={year}
              />
            </div>
          </div>

          <div className={styles.contentCard}>
            <h2 className={styles.contentTitle}>Doctor Performance</h2>
            <div className={styles.componentWrapper}>
              <TherapyTypeByDoctor
                startDate={startDate}
                endDate={endDate}
                selectedMonth={month}
                selectedYear={year}
              />
            </div>
          </div>

          <div className={styles.contentCard}>
            <h2 className={styles.contentTitle}>Daily Report</h2>
            <div className={styles.componentWrapper}>
              <DailyReport
                startDate={startDate}
                endDate={endDate}
                selectedMonth={month}
                selectedYear={year}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
