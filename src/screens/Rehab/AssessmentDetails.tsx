import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaFileMedicalAlt,
  FaUserMd,
  FaNotesMedical,
  FaCalendarDay,
  FaSpinner,
  FaUserCircle,
  FaListAlt,
  FaEdit,
} from "react-icons/fa";
import api from "../../utils/central";
import styles from "../../css/Rehab/AssessmentDetails.module.css";

interface AssessmentResponse {
  question_id: string;
  question_title?: string;
  question?: string;
  type?: string;
  question_type?: string;
  answer: any;
  answer_raw?: any;
  columns?: any[];
  blanks?: any[];
  has_row_labels?: boolean;
  show_total_score?: boolean;
  score?: number;
  notes?: string;
}

interface AssessmentDetail {
  _id: string;
  assessment_name: string;
  date_taken: string;
  status: string;
  general_notes: string;
  responses: AssessmentResponse[];
  doctor_id: {
    doctor_first_name: string;
    doctor_last_name: string;
  };
  patient_id: {
    _id: string;
    patient_first_name: string;
    patient_last_name: string;
    UHID: string;
    patient_image?: string;
  };
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  color: "var(--on-surface-variant)",
  fontWeight: "700",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid rgba(188, 201, 198, 0.2)",
  verticalAlign: "middle",
};

const AssessmentDetails: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/assessment/${assessmentId}`);
        setAssessment(response.data.assessment);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load assessment.");
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) fetchData();
  }, [assessmentId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderAnswer = (res: AssessmentResponse) => {
    const {
      type,
      answer,
      answer_raw,
      columns,
      blanks,
      has_row_labels,
      show_total_score,
    } = res;

    // ── 1. TABLE FORMAT ────────────────────────────────────────────────────
    if (type === "table" && Array.isArray(answer)) {
      if (answer.length === 0) {
        return (
          <span
            style={{
              fontStyle: "italic",
              color: "var(--on-surface-variant)",
              fontSize: "0.85rem",
            }}
          >
            No data recorded
          </span>
        );
      }

      const dataColumns =
        has_row_labels && columns && columns.length > 0
          ? columns.slice(1)
          : columns || [];
      const rowHeaderLabel =
        has_row_labels && columns && columns.length > 0
          ? columns[0].label || columns[0].value || "Item"
          : "Item";

      // Identify rows that actually contain data
      const mappedRows = answer.map((row: any) => {
        const hasVal = dataColumns.some((col: any, colIdx: number) => {
          let cell = (row.cells || []).find((c: any) => c.col_id === col.id);
          if (!cell) {
            const targetIndex =
              has_row_labels && row.cells?.length === columns?.length
                ? colIdx + 1
                : colIdx;
            cell = (row.cells || [])[targetIndex] || {};
          }
          const val = cell.value;
          const isCheckbox =
            cell.col_type === "checkbox" || row.cell_type === "checkbox";
          if (isCheckbox) return val !== undefined;
          return val !== undefined && val !== null && val !== "";
        });
        return { ...row, _hasVal: hasVal };
      });

      // Filter out empty rows, preserving parent categories if a child has data
      const answeredRows: any[] = [];
      for (let i = 0; i < mappedRows.length; i++) {
        const row = mappedRows[i];
        if (row._hasVal) {
          answeredRows.push(row);
        } else if (!row.is_sub_row) {
          let hasChildWithValue = false;
          for (let j = i + 1; j < mappedRows.length; j++) {
            if (!mappedRows[j].is_sub_row) break;
            if (mappedRows[j]._hasVal) {
              hasChildWithValue = true;
              break;
            }
          }
          if (hasChildWithValue) answeredRows.push(row);
        }
      }

      if (answeredRows.length === 0) {
        return (
          <span
            style={{
              fontStyle: "italic",
              color: "var(--on-surface-variant)",
              fontSize: "0.85rem",
            }}
          >
            No data recorded
          </span>
        );
      }

      const shouldShowRowLabels =
        has_row_labels &&
        answeredRows.some(
          (row: any) =>
            (row.row_label !== undefined &&
              row.row_label !== null &&
              String(row.row_label).trim() !== "") ||
            (row.sr_no !== undefined &&
              row.sr_no !== null &&
              String(row.sr_no).trim() !== ""),
        );

      const hasTotalScore =
        show_total_score && answer_raw?.savedTotalScore !== undefined;

      return (
        <div
          className={styles.tableContainer}
          style={{ overflowX: "auto", marginTop: "8px" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "var(--surface-container-lowest)",
              border: "1px solid rgba(188, 201, 198, 0.3)",
              borderRadius: "0.5rem",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  borderBottom: "2px solid rgba(188, 201, 198, 0.3)",
                }}
              >
                {shouldShowRowLabels && (
                  <th style={thStyle}>{rowHeaderLabel}</th>
                )}
                {dataColumns.map((col: any, colIdx: number) => (
                  <th
                    key={col.id || colIdx}
                    style={{ ...thStyle, textAlign: "center" }}
                  >
                    {col.label || col.value || "Value"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {answeredRows.map((row: any, idx: number) => {
                const srNo = row.sr_no || row.srNo;
                return (
                  <tr key={row.row_id || idx}>
                    {shouldShowRowLabels && (
                      <td
                        style={{
                          ...tdStyle,
                          paddingLeft: row.is_sub_row ? "28px" : "12px",
                          background: row.is_sub_row
                            ? "var(--surface-container-lowest)"
                            : "#fafafa",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {srNo && (
                            <span
                              style={{
                                color: "var(--on-surface-variant)",
                                fontSize: "0.75rem",
                                minWidth: "15px",
                              }}
                            >
                              {srNo}.
                            </span>
                          )}
                          <strong
                            style={{
                              color: "var(--on-secondary-fixed)",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                            }}
                          >
                            {row.row_label}
                          </strong>
                        </div>
                      </td>
                    )}

                    {dataColumns.map((col: any, colIdx: number) => {
                      let cell = (row.cells || []).find(
                        (c: any) => c.col_id === col.id,
                      );
                      if (!cell) {
                        const targetIndex =
                          has_row_labels &&
                          row.cells?.length === columns?.length
                            ? colIdx + 1
                            : colIdx;
                        cell = (row.cells || [])[targetIndex] || {};
                      }

                      const isReferenceRange =
                        cell.col_type === "reference_range" ||
                        col.colType === "reference_range";
                      let displayVal = cell.value;
                      const isCheckbox =
                        cell.col_type === "checkbox" ||
                        row.cell_type === "checkbox";

                      const cellIsChecked = isCheckbox
                        ? displayVal === true || displayVal === "Yes"
                        : false;

                      return (
                        <td
                          key={col.id || colIdx}
                          style={{
                            ...tdStyle,
                            background: "var(--surface-container-lowest)",
                            textAlign: "center",
                          }}
                        >
                          {isReferenceRange ? (
                            <span
                              style={{
                                fontWeight: "500",
                                color: "var(--on-surface-variant)",
                                fontSize: "0.85rem",
                              }}
                            >
                              {cell.reference_value || "—"}
                            </span>
                          ) : isCheckbox ? (
                            <input
                              type="checkbox"
                              checked={cellIsChecked}
                              readOnly
                              style={{
                                width: "18px",
                                height: "18px",
                                accentColor: "var(--primary)",
                                cursor: "default",
                                display: "block",
                                margin: "0 auto",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: "600",
                                color: "var(--on-secondary-fixed)",
                                fontSize: "0.85rem",
                              }}
                            >
                              {displayVal === undefined ||
                              displayVal === null ||
                              displayVal === ""
                                ? "—"
                                : `${displayVal}${row.unit ? ` ${row.unit}` : ""}`}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {hasTotalScore && (
                <tr style={{ backgroundColor: "var(--surface-container-low)" }}>
                  <td
                    colSpan={Math.max(
                      1,
                      dataColumns.length + (shouldShowRowLabels ? 0 : -1),
                    )}
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      borderTop: "2px solid rgba(188, 201, 198, 0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontSize: "0.75rem",
                    }}
                  >
                    Total Score:
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderTop: "2px solid rgba(188, 201, 198, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "rgba(0, 104, 95, 0.1)",
                        color: "var(--primary)",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "800",
                      }}
                    >
                      {answer_raw.savedTotalScore}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // ── 2. INLINE BLANKS FORMAT ────────────────────────────────────────────
    if (type === "inline_blanks" && Array.isArray(blanks)) {
      if (blanks.length === 0) {
        return (
          <span
            style={{
              fontStyle: "italic",
              color: "var(--on-surface-variant)",
              fontSize: "0.85rem",
            }}
          >
            No inputs recorded
          </span>
        );
      }
      return (
        <div
          style={{
            lineHeight: "2",
            fontSize: "0.85rem",
            color: "var(--on-surface-variant)",
          }}
        >
          {blanks.map((b: any) => {
            const parts = (b.blank_label || "").split("[blank]");
            return (
              <div key={b.blank_id} style={{ marginBottom: "6px" }}>
                {parts.map((part: string, index: number, array: any[]) => {
                  const isLast = index === array.length - 1;
                  const valKey = `${b.blank_id}_${index}`;
                  const val = answer?.[valKey] || b.value;
                  return (
                    <React.Fragment key={index}>
                      <span>{part}</span>
                      {!isLast && (
                        <span
                          style={{
                            display: "inline-block",
                            minWidth: "60px",
                            padding: "2px 8px",
                            margin: "0 6px",
                            borderBottom: "2px solid var(--primary)",
                            color: "var(--on-secondary-fixed)",
                            fontWeight: "700",
                            textAlign: "center",
                            backgroundColor: "var(--surface-container-lowest)",
                            borderRadius: "4px 4px 0 0",
                          }}
                        >
                          {val || (
                            <span
                              style={{ color: "var(--surface-container-low)" }}
                            >
                              —
                            </span>
                          )}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    if (answer === null || answer === undefined || answer === "") {
      return (
        <span
          style={{
            color: "var(--on-surface-variant)",
            fontStyle: "italic",
            fontSize: "0.85rem",
          }}
        >
          No answer provided
        </span>
      );
    }

    // ── 3. ARRAY FORMAT (Checkboxes) ───────────────────────────────────────
    if (Array.isArray(answer)) {
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "4px",
          }}
        >
          {answer.map((item, idx) => (
            <span
              key={idx}
              style={{
                background: "var(--surface-container-lowest)",
                border: "1px solid rgba(188, 201, 198, 0.4)",
                color: "var(--on-secondary-fixed)",
                padding: "2px 10px",
                borderRadius: "12px",
                fontSize: "0.8rem",
                fontWeight: "600",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    // ── 4. OBJECT FORMAT ───────────────────────────────────────────────────
    if (typeof answer === "object") {
      return (
        <div
          style={{
            marginTop: "4px",
            fontSize: "0.85rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 16px",
          }}
        >
          {Object.entries(answer).map(([key, val]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px dotted rgba(188, 201, 198, 0.4)",
                paddingBottom: "4px",
              }}
            >
              <span style={{ color: "var(--on-surface-variant)" }}>{key}</span>
              <span
                style={{
                  color: "var(--on-secondary-fixed)",
                  fontWeight: "600",
                }}
              >
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // ── 5. PLAIN TEXT / BOOLEAN FORMAT ─────────────────────────────────────
    const isBool = typeof answer === "boolean";
    const displayStr = isBool ? (answer ? "Yes" : "No") : String(answer);

    return (
      <span
        style={{
          fontSize: "0.85rem",
          color: "var(--on-secondary-fixed)",
          fontWeight: "600",
        }}
      >
        {displayStr}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <FaSpinner
          className="fa-spin"
          size={30}
          style={{ color: "var(--primary)" }}
        />
        <span>Loading assessment record...</span>
      </div>
    );
  }

  if (error) return <div className={styles.error}>{error}</div>;
  if (!assessment)
    return <div className={styles.error}>Assessment not found.</div>;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back to Patient Profile
      </button>

      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            <FaFileMedicalAlt size={22} />
          </div>
          <div>
            <h1>{assessment.assessment_name}</h1>
            <span className={styles.statusBadge}>{assessment.status}</span>
          </div>
        </div>
        <button
          className={styles.editButton}
          onClick={() => navigate(`/editAssessment/${assessmentId}`)}
        >
          <FaEdit /> Edit Assessment
        </button>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h3>
            <FaUserMd size={12} /> Conducted By
          </h3>
          <p>
            {assessment.doctor_id?.doctor_first_name}{" "}
            {assessment.doctor_id?.doctor_last_name}
          </p>
        </div>

        <div className={styles.infoCard}>
          <h3>
            <FaCalendarDay size={12} /> Date Taken
          </h3>
          <p>{formatDate(assessment.date_taken)}</p>
        </div>

        <div className={styles.infoCard}>
          <h3>Patient Summary</h3>
          <div className={styles.patientProfileRow}>
            {assessment.patient_id?.patient_image ? (
              <img
                src={assessment.patient_id.patient_image}
                alt="Patient Avatar"
                className={styles.patientAvatar}
              />
            ) : (
              <FaUserCircle className={styles.patientAvatarFallback} />
            )}
            <div>
              <p>
                {assessment.patient_id?.patient_first_name}{" "}
                {assessment.patient_id?.patient_last_name}
              </p>
              <small>UHID: {assessment.patient_id?.UHID}</small>
            </div>
          </div>
        </div>
      </div>

      {assessment.general_notes && (
        <div className={styles.notesCard}>
          <h3>
            <FaNotesMedical size={12} /> General Notes
          </h3>
          <p>{assessment.general_notes}</p>
        </div>
      )}

      <div className={styles.responsesSection}>
        <h2 className={styles.sectionHeader}>
          <FaListAlt color="var(--primary)" size={16} /> Detailed Responses
        </h2>

        {assessment.responses && assessment.responses.length > 0 ? (
          <div className={styles.responseList}>
            {assessment.responses.map((res, index) => {
              const questionLabel = res.question_title || res.question;
              const hasQuestionLabel =
                questionLabel && questionLabel.trim().length > 0;

              if (
                res.question_type === "section_header" ||
                res.type === "section_header"
              ) {
                return (
                  <div key={index} className={styles.sectionDivider}>
                    {questionLabel}
                  </div>
                );
              }

              return (
                <div key={index} className={styles.responseItem}>
                  {hasQuestionLabel && (
                    <div className={styles.question}>
                      <span className={styles.questionIndex}>{index + 1}</span>
                      {questionLabel}
                    </div>
                  )}

                  <div className={styles.answerBox}>
                    {hasQuestionLabel && (
                      <span className={styles.answerLabel}>
                        Recorded Answer
                      </span>
                    )}
                    <div>{renderAnswer(res)}</div>
                  </div>

                  {res.score !== undefined && (
                    <div className={styles.score}>
                      <strong>Score Computed:</strong> {res.score}
                    </div>
                  )}
                  {res.notes && (
                    <div className={styles.answerNotes}>
                      <strong>Clinical Notes:</strong> {res.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noData}>
            No responses were recorded for this assessment.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentDetails;
