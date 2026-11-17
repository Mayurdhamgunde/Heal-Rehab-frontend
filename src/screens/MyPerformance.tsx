import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/central";
import styles from "../css/MyPerformance.module.css";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
interface TeamStats {
  completed: number;
  completed_as_physician: number;
  completed_as_counsellor: number;
  my_part_done_waiting_on_partner: number;
  awaiting_my_part: number;
  scheduled: number;
}

interface PerformanceResponse {
  range: { from: string; to: string; days: number };
  summary: {
    completed: number;
    upcoming: number;
    in_progress: number;
    cancelled: number;
    no_show: number;
    unique_patients_seen: number;
    avg_duration_minutes: number | null;
    completed_prev_period: number;
    completed_delta: number;
    total_scheduled_in_range: number;
  };
  sessions_by_type: { type: string; count: number }[];
  sessions_by_day: { date: string; label: string; count: number }[];
  new_patients: {
    treated_count: number;
    registered_to_me_count: number;
    list: {
      patient_id: string;
      patient_name: string;
      first_session_date: string;
      first_session_type: string;
      registered_in_range: boolean;
      sessions_this_month: number;
      assessments_this_month: number;
    }[];
  };
  team_sessions: {
    followup: TeamStats;
    awaiting_my_part_total: number;
    awaiting_my_part: {
      session_id: string;
      patient_id: string;
      patient_name: string;
      type: string;
      date: string;
      my_role: "physician" | "counsellor";
      partner_name: string | null;
    }[];
  };
  assessments: {
    total: number;
    drafts: number;
    unique_patients: number;
    most_taken: {
      template_id: string;
      name: string;
      count: number;
      unique_patients: number;
    } | null;
    by_template: {
      template_id: string;
      name: string;
      count: number;
      unique_patients: number;
    }[];
  };
}

// -------------------------------------------------------------------
// Date helpers (calendar months, YYYY-MM strings, no extra deps)
// -------------------------------------------------------------------
const monthInfo = (offsetMonths: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const label = d.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return { key, label };
};

const TYPE_COLORS: Record<string, string> = {
  Individual: "#2f6f62",
  Family: "#c27c2c",
  Group: "#5b5fa8",
  Aftercare: "#a24b6b",
  "Follow-up": "#3d7ea6",
  "In Clinic": "#6b7f3a",
  "In Home": "#8a6a4f",
  "IP/ICU": "#b0463c",
  Online: "#4a8f9c",
};
const colorFor = (t: string) => TYPE_COLORS[t] || "#6c7a7d";

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------
const MyPerformance: React.FC = () => {
  const [offset, setOffset] = useState(0); // 0 = this month, -1 = last month, ...
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bounds = useMemo(() => monthInfo(offset), [offset]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get("/my/performance", { params: { month: bounds.key } })
      .then((res) => !cancelled && setData(res.data))
      .catch(
        () =>
          !cancelled &&
          setError("Could not load your report. Please try again."),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [bounds.key]);

  const maxDay = Math.max(
    1,
    ...(data?.sessions_by_day.map((d) => d.count) || [1]),
  );
  const totalByType = (data?.sessions_by_type || []).reduce(
    (s, t) => s + t.count,
    0,
  );
  const maxType = Math.max(
    1,
    ...(data?.sessions_by_type.map((t) => t.count) || [1]),
  );
  const delta = data?.summary.completed_delta ?? 0;
  const maxAssess = Math.max(
    1,
    ...(data?.assessments.by_template.map((t) => t.count) || [1]),
  );

  return (
    <div className={styles.dashboardLayout}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My performance</h1>
          <p className={styles.pageSubtitle}>{bounds.label}</p>
        </div>
        <div className={styles.monthNav} role="group" aria-label="Choose month">
          <button
            className={styles.navBtn}
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            className={`${styles.navBtn} ${offset === 0 ? "" : styles.navBtnActive}`}
            onClick={() => setOffset(0)}
            disabled={offset === 0}
          >
            This month
          </button>
          <button
            className={styles.navBtn}
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}
      {loading && !data && (
        <p className={styles.mutedText}>Loading your report…</p>
      )}

      {data && (
        <div className={loading ? styles.loadingFade : ""}>
          {/* Headline: sessions taken */}
          <section className={styles.heroSection}>
            <div className={styles.heroMain}>
              <span className={styles.heroNumber}>
                {data.summary.completed}
              </span>
              <div>
                <p className={styles.heroLabel}>Sessions completed</p>
                <span
                  className={`${styles.delta} ${delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : ""}`}
                >
                  {delta === 0
                    ? "Same as previous month"
                    : `${delta > 0 ? "+" : ""}${delta} vs previous month (${data.summary.completed_prev_period})`}
                </span>
              </div>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>Patients seen</p>
                <p className={styles.statValue}>
                  {data.summary.unique_patients_seen}
                </p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>New patients</p>
                <p className={styles.statValue}>
                  {data.new_patients.treated_count}
                </p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>Assessments</p>
                <p className={styles.statValue}>{data.assessments.total}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>Upcoming</p>
                <p className={styles.statValue}>
                  {data.summary.upcoming + data.summary.in_progress}
                </p>
              </div>
            </div>
          </section>

          <div className={styles.bentoGrid}>
            {/* Daily bars */}
            <section className={`${styles.bentoCard} ${styles.colMain}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Sessions per day</h2>
              </div>
              <div
                className={styles.bars}
                role="img"
                aria-label="Completed sessions per day"
              >
                {data.sessions_by_day.map((d) => (
                  <div
                    className={styles.barCol}
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                  >
                    <span className={styles.barValue}>{d.count || ""}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.bar}
                        style={{ height: `${(d.count / maxDay) * 100}%` }}
                      />
                    </div>
                    <span className={styles.barLabel}>
                      {Number(d.label) % 5 === 1 ? d.label : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* By type */}
            <section className={`${styles.bentoCard} ${styles.colSide}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Session types</h2>
              </div>
              {data.sessions_by_type.length === 0 ? (
                <div className={styles.emptyState}>
                  No completed sessions this month.
                </div>
              ) : (
                <ul className={styles.typeList}>
                  {data.sessions_by_type.map((t) => (
                    <li key={t.type}>
                      <div className={styles.typeRow}>
                        <span>
                          <i
                            className={styles.typeDot}
                            style={{ background: colorFor(t.type) }}
                          />
                          {t.type}
                        </span>
                        <span>
                          {t.count}{" "}
                          <small>
                            · {Math.round((t.count / totalByType) * 100)}%
                          </small>
                        </span>
                      </div>
                      <div className={styles.typeTrack}>
                        <div
                          className={styles.typeFill}
                          style={{
                            width: `${(t.count / maxType) * 100}%`,
                            background: colorFor(t.type),
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Follow-up sessions (physician + counsellor) */}
            <section className={`${styles.bentoCard} ${styles.colMain}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Follow-up sessions</h2>
                <span className={styles.mutedText}>
                  Finished in two steps: physician and counsellor
                </span>
              </div>
              <div className={styles.teamStatGrid}>
                <div>
                  <p className={styles.statLabel}>Completed</p>
                  <p className={styles.statValue}>
                    {data.team_sessions.followup.completed}
                  </p>
                </div>
                <div>
                  <p className={styles.statLabel}>As physician</p>
                  <p className={styles.statValue}>
                    {data.team_sessions.followup.completed_as_physician}
                  </p>
                </div>
                <div>
                  <p className={styles.statLabel}>As counsellor</p>
                  <p className={styles.statValue}>
                    {data.team_sessions.followup.completed_as_counsellor}
                  </p>
                </div>
                <div>
                  <p className={styles.statLabel}>Waiting on partner</p>
                  <p className={styles.statValue}>
                    {
                      data.team_sessions.followup
                        .my_part_done_waiting_on_partner
                    }
                  </p>
                </div>
                <div>
                  <p className={styles.statLabel}>Needs your part</p>
                  <p className={styles.statValue}>
                    {data.team_sessions.followup.awaiting_my_part}
                  </p>
                </div>
                <div>
                  <p className={styles.statLabel}>Scheduled</p>
                  <p className={styles.statValue}>
                    {data.team_sessions.followup.scheduled}
                  </p>
                </div>
              </div>

              {data.team_sessions.awaiting_my_part.length > 0 && (
                <div className={styles.tableWrapper}>
                  <p className={styles.teamListTitle}>
                    Waiting for you ({data.team_sessions.awaiting_my_part_total}
                    )
                  </p>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date</th>
                        <th>Your part</th>
                        <th className={styles.hideOnMobile}>Partner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.team_sessions.awaiting_my_part.map((a) => (
                        <tr key={a.session_id}>
                          <td className={styles.patientCell}>
                            {a.patient_name}
                          </td>
                          <td>
                            {new Date(a.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${styles.statusActive}`}
                            >
                              {a.my_role === "physician"
                                ? "Medical review"
                                : "Counselling review"}
                            </span>
                          </td>
                          <td className={styles.hideOnMobile}>
                            {a.partner_name || "Not assigned yet"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Assessments */}
            <section className={`${styles.bentoCard} ${styles.colSide}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Assessments</h2>
                {data.assessments.drafts > 0 && (
                  <span
                    className={`${styles.statusBadge} ${styles.statusArchived}`}
                  >
                    {data.assessments.drafts} draft
                    {data.assessments.drafts > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {data.assessments.total === 0 ? (
                <div className={styles.emptyState}>
                  No assessments taken this month.
                </div>
              ) : (
                <div className={styles.assessLayout}>
                  <div>
                    <div className={styles.assessSummary}>
                      <span className={styles.assessTotal}>
                        {data.assessments.total}
                      </span>
                      <span className={styles.mutedText}>
                        taken across {data.assessments.unique_patients} patient
                        {data.assessments.unique_patients > 1 ? "s" : ""}
                      </span>
                    </div>
                    {data.assessments.most_taken && (
                      <div className={styles.topPick}>
                        <p className={styles.statLabel}>Most taken</p>
                        <p className={styles.topPickName}>
                          {data.assessments.most_taken.name}
                        </p>
                        <p className={styles.mutedText}>
                          {data.assessments.most_taken.count} time
                          {data.assessments.most_taken.count > 1
                            ? "s"
                            : ""} ·{" "}
                          {data.assessments.most_taken.unique_patients} patient
                          {data.assessments.most_taken.unique_patients > 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  <ul className={styles.typeList}>
                    {data.assessments.by_template.map((t) => (
                      <li key={t.template_id}>
                        <div className={styles.typeRow}>
                          <span className={styles.assessName}>{t.name}</span>
                          <span>
                            {t.count}{" "}
                            <small>
                              · {t.unique_patients} patient
                              {t.unique_patients > 1 ? "s" : ""}
                            </small>
                          </span>
                        </div>
                        <div className={styles.typeTrack}>
                          <div
                            className={styles.typeFill}
                            style={{
                              width: `${(t.count / maxAssess) * 100}%`,
                              background: "var(--primary)",
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* New patients */}
            <section className={`${styles.bentoCard} ${styles.cardWide}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>New patients treated</h2>
                <span className={styles.mutedText}>
                  First session with you this month ·{" "}
                  {data.new_patients.registered_to_me_count} newly registered to
                  your care
                </span>
              </div>
              {data.new_patients.list.length === 0 ? (
                <div className={styles.emptyState}>
                  No first-time patients this month.
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>First session</th>
                        <th className={styles.hideOnMobile}>Type</th>
                        <th className={styles.numCell}>Sessions</th>
                        <th className={styles.numCell}>Assessments</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.new_patients.list.map((p) => (
                        <tr key={p.patient_id}>
                          <td className={styles.patientCell}>
                            {p.patient_name}
                          </td>
                          <td>
                            {new Date(p.first_session_date).toLocaleDateString(
                              "en-IN",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </td>
                          <td className={styles.hideOnMobile}>
                            <i
                              className={styles.typeDot}
                              style={{
                                background: colorFor(p.first_session_type),
                              }}
                            />
                            {p.first_session_type}
                          </td>
                          <td className={styles.numCell}>
                            {p.sessions_this_month}
                          </td>
                          <td className={styles.numCell}>
                            {p.assessments_this_month}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${p.registered_in_range ? styles.statusActive : styles.statusArchived}`}
                            >
                              {p.registered_in_range
                                ? "Newly registered"
                                : "First time with you"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPerformance;
