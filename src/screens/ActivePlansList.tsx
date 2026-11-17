import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  User,
  ArrowRight,
  Activity,
  Search,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import api from "../utils/central"; // Adjust path as needed
import styles from "../css/ActivePlansList.module.css";

interface TherapySession {
  _id: string;
  status: string;
  date: string;
  session_number: number;
}

interface ActivePlan {
  _id: string;
  therapy_name: string;
  patient_name: string;
  patient_image: string | null;
  patient_diagnosis: string;
  patient_symptoms: string;
  patient_therapy_category: string;
  therapy_start: string;
  therapy_end: string;
  estimated_sessions: number;
  completed_sessions: number;
  days_remaining: number;
  status: string;
  balance: string;
  total_amount: string;
  therapy_sessions: TherapySession[];
}

const ActivePlansList: React.FC = () => {
  const [plans, setPlans] = useState<ActivePlan[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/get/active/plans");
      const fetchedPlans: ActivePlan[] = response.data.active_plans || [];

      // Newest first: sort by therapy_start date, descending
      const sortedPlans = [...fetchedPlans].sort(
        (a, b) =>
          new Date(b.therapy_start).getTime() -
          new Date(a.therapy_start).getTime(),
      );
      setPlans(sortedPlans);
    } catch (error) {
      console.error("Error fetching active plans:", error);
      alert("Failed to load active plans.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calculateDayProgress = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const total = endDate - startDate;
    const elapsed = today - startDate;
    if (total <= 0) return 100;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  };

  const handleCardClick = (planId: string) => {
    navigate(`/planDetails/${planId}`);
  };

  const filteredPlans = plans.filter((p) =>
    p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading active plans...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Active Therapy Plans</h1>
        </div>

        <div className={styles.controlsWrapper}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === "card" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("card")}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === "table" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Plan Status Tabs */}
      <div className={styles.planTabs}>
        <button
          className={`${styles.planTab} ${styles.planTabActive}`}
          disabled
        >
          <Clock size={15} />
          Active Plans
          <span className={styles.tabCount}>{plans.length}</span>
        </button>
        <button
          className={styles.planTab}
          onClick={() => navigate("/CompletedPlans")}
        >
          <CheckCircle2 size={15} />
          Completed Plans
        </button>
      </div>

      {filteredPlans.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No plans found matching your criteria.</p>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className={styles.tableContainer}>
          <table className={styles.plansTable}>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Therapy Plan</th>
                <th>Category</th>
                <th>Progress</th>
                <th>Days Left</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => {
                const isCompleted =
                  plan.status === "Completed" || plan.status === "completed";
                const progress = isCompleted
                  ? 100
                  : calculateDayProgress(plan.therapy_start, plan.therapy_end);

                return (
                  <tr
                    key={plan._id}
                    className={styles.tableRow}
                    onClick={() => handleCardClick(plan._id)}
                  >
                    <td>
                      <div className={styles.patientInfo}>
                        {plan.patient_image ? (
                          <img
                            src={plan.patient_image}
                            alt={plan.patient_name}
                            className={styles.avatar}
                            style={{ width: "32px", height: "32px" }}
                          />
                        ) : (
                          <div
                            className={styles.avatarFallback}
                            style={{ width: "32px", height: "32px" }}
                          >
                            <User size={16} />
                          </div>
                        )}
                        <span className={styles.patientName}>
                          {plan.patient_name}
                        </span>
                      </div>
                    </td>
                    <td>{plan.therapy_name}</td>
                    <td>{plan.patient_therapy_category}</td>
                    <td style={{ width: "20%" }}>
                      <div
                        className={styles.progressHeader}
                        style={{ marginBottom: "4px" }}
                      >
                        <span className={styles.progressPercent}>
                          {progress}%
                        </span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={`${styles.progressBarFill} ${
                            isCompleted ? styles.fillDone : styles.fillSafe
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      {isCompleted
                        ? "-"
                        : plan.days_remaining < 0
                          ? 0
                          : plan.days_remaining}
                    </td>
                    <td>
                      <span
                        className={`${styles.tableStatus} ${
                          isCompleted
                            ? styles.statusCompleted
                            : styles.statusActive
                        }`}
                      >
                        {isCompleted ? "Completed" : "Active"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className={styles.cardsGrid}>
          {filteredPlans.map((plan) => {
            const isCompleted =
              plan.status === "Completed" || plan.status === "completed";
            const progress = isCompleted
              ? 100
              : calculateDayProgress(plan.therapy_start, plan.therapy_end);

            return (
              <div
                key={plan._id}
                className={styles.card}
                onClick={() => handleCardClick(plan._id)}
              >
                {/* Top Section: Patient & Days Left */}
                <div className={styles.cardHeader}>
                  <div className={styles.patientInfo}>
                    {plan.patient_image ? (
                      <img
                        src={plan.patient_image}
                        alt={plan.patient_name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        <User size={20} />
                      </div>
                    )}
                    <div className={styles.patientDetailsText}>
                      <h3 className={styles.patientName}>
                        {plan.patient_name}
                      </h3>
                    </div>
                  </div>

                  {/* Days badge: completed (green) or teal with days */}
                  <div
                    className={`${styles.daysBadge} ${
                      isCompleted ? styles.badgeDone : styles.badgeSafe
                    }`}
                  >
                    {isCompleted ? (
                      <span
                        className={styles.daysText}
                        style={{ fontSize: "0.55rem", padding: "2px 0" }}
                      >
                        DONE
                      </span>
                    ) : (
                      <>
                        <span className={styles.daysNumber}>
                          {plan.days_remaining < 0 ? 0 : plan.days_remaining}
                        </span>
                        <span className={styles.daysText}>
                          DAYS
                          <br />
                          LEFT
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Middle Section: Therapy Name */}
                <div className={styles.planInfo}>
                  <span className={styles.planLabel}>Therapy Plan</span>
                  <h4 className={styles.planTitle}>{plan.therapy_name}</h4>
                </div>

                {/* Progress Bar & Dates */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span
                      className={`${styles.progressLabel} ${
                        isCompleted ? styles.textDone : styles.textSafe
                      }`}
                    >
                      {isCompleted ? "Completed" : "Progress"}
                    </span>
                    <span className={styles.progressPercent}>{progress}%</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={`${styles.progressBarFill} ${
                        isCompleted ? styles.fillDone : styles.fillSafe
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className={styles.progressDates}>
                    <span>{formatDate(plan.therapy_start)}</span>
                    <span>{formatDate(plan.therapy_end)}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className={styles.cardFooter}>
                  <span className={styles.footerActionText}>
                    View Plan Details{" "}
                    <Activity size={14} style={{ marginLeft: "4px" }} />
                  </span>
                  <div className={styles.arrowCircle}>
                    <ArrowRight size={14} color="#007b8e" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivePlansList;