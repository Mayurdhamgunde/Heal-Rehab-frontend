import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import api from "../../utils/central";
import styles from "../../css/Rehab/TakeAssessment.module.css";
import SmartTextInput from "./SmartInputText";
import SmartTextArea from "./SmartareaText";

// Backend responses aren't consistent about the key name (some routes use
// `msg`, others use `error`), so check both before falling back.
const getErrorMessage = (error: any, fallback: string): string => {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    fallback
  );
};

export default function EditAssessment() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [assessmentMeta, setAssessmentMeta] = useState<any>(null);

  const [responses, setResponses] = useState<Record<string, any>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [dateTaken, setDateTaken] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [focusedQuestionIdx, setFocusedQuestionIdx] = useState<number>(-1);

  // Fetch the existing assessment to edit
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const res = await api.get(`/assessment/${assessmentId}`);
        const data = res.data.assessment;

        setAssessmentMeta(data);
        // We use template_snapshot for editing so it doesn't break if original template changed
        setActiveTemplate(data.template_snapshot);
        setGeneralNotes(data.general_notes || "");

        if (data.date_taken) {
          setDateTaken(new Date(data.date_taken).toISOString().split("T")[0]);
        }

        // Populate initial responses map
        const initialResponses: Record<string, any> = {};
        if (data.responses) {
          data.responses.forEach((resItem: any) => {
            // CRITICAL: We use answer_raw so complex objects (like tables and nested_mcq) load correctly
            initialResponses[resItem.question_id] =
              resItem.answer_raw !== undefined
                ? resItem.answer_raw
                : resItem.answer;
          });
        }
        setResponses(initialResponses);
      } catch (error) {
        console.error("Failed to load assessment data", error);
        alert(
          getErrorMessage(
            error,
            "Failed to load assessment details for editing.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId) loadAssessment();
  }, [assessmentId]);

  const formSteps = useMemo(() => {
    if (!activeTemplate || !activeTemplate.questions) return [];

    const steps: {
      title: string;
      description?: string;
      questions: any[];
      isNotesStep?: boolean;
    }[] = [];
    let currentGroup = {
      title: "General Info",
      description: "",
      questions: [] as any[],
    };
    let globalIndex = 0;

    activeTemplate.questions.forEach((q: any) => {
      if (q.type === "section_header") {
        if (currentGroup.questions.length > 0) {
          steps.push({ ...currentGroup });
        }
        currentGroup = {
          title: q.title,
          description: q.description,
          questions: [],
        };
      } else {
        globalIndex++;
        currentGroup.questions.push({ ...q, globalIndex });
      }
    });

    if (currentGroup.questions.length > 0) {
      steps.push(currentGroup);
    }

    steps.push({
      title: "Clinical Notes",
      description: "Final observations and assessment submission.",
      questions: [],
      isNotesStep: true,
    });

    return steps;
  }, [activeTemplate]);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (
    questionId: string,
    optionValue: string,
    checked: boolean,
  ) => {
    setResponses((prev) => {
      const currentArr = prev[questionId] || [];
      if (checked)
        return { ...prev, [questionId]: [...currentArr, optionValue] };
      return {
        ...prev,
        [questionId]: currentArr.filter((v: string) => v !== optionValue),
      };
    });
  };

  const handleTableCellChange = (
    questionId: string,
    rowId: string,
    colId: string,
    value: any,
  ) => {
    setResponses((prev) => {
      const qState = prev[questionId] || {};
      const rowState = qState[rowId] || {};
      return {
        ...prev,
        [questionId]: { ...qState, [rowId]: { ...rowState, [colId]: value } },
      };
    });
  };

  const handleRowLabelChange = (
    questionId: string,
    rowId: string,
    value: string,
  ) => {
    setResponses((prev) => {
      const qState = prev[questionId] || {};
      const rowState = qState[rowId] || {};
      return {
        ...prev,
        [questionId]: {
          ...qState,
          [rowId]: { ...rowState, __rowLabel: value },
        },
      };
    });
  };

  const handleInlineBlankChange = (
    questionId: string,
    lineId: string,
    blankIdx: number,
    value: string,
  ) => {
    setResponses((prev) => {
      const qState = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: { ...qState, [`${lineId}_${blankIdx}`]: value },
      };
    });
  };

  const calculateTotalScore = (q: any) => {
    const qResponses = responses[q.id];
    if (!qResponses) return 0;

    let total = 0;
    q.rows?.forEach((row: any) => {
      const rowResponses = qResponses[row.id];
      if (!rowResponses) return;

      if (row.cellType === "rubric") {
        const lastColId = q.columns[q.columns.length - 1]?.id;
        const cellValue = rowResponses[lastColId];
        if (cellValue !== undefined && cellValue !== "") {
          const num = Number(cellValue);
          if (!isNaN(num)) total += num;
        }
      } else {
        Object.values(rowResponses).forEach((cellValue: any) => {
          if (
            cellValue !== undefined &&
            cellValue !== "" &&
            typeof cellValue !== "boolean"
          ) {
            const num = Number(cellValue);
            if (!isNaN(num)) total += num;
          }
        });
      }
    });

    return total;
  };

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    setFocusedQuestionIdx(-1);
  }, [currentStep]);

  const focusQuestion = useCallback((idx: number) => {
    const blocks = document.querySelectorAll<HTMLElement>(
      "[data-question-block]",
    );
    if (!blocks[idx]) return;
    const firstInput = blocks[idx].querySelector<HTMLElement>(
      "input:not([disabled]), select, textarea",
    );
    if (firstInput) {
      firstInput.focus();
      blocks[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setFocusedQuestionIdx(idx);
  }, []);

  useEffect(() => {
    if (!activeTemplate) return;

    const isTextTarget = (el: Element | null) => {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName;
      const type = (el as HTMLInputElement).type;
      return (
        tag === "TEXTAREA" ||
        (tag === "INPUT" &&
          ["text", "number", "email", "search", "url", "password"].includes(
            type,
          ))
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const inTextField = isTextTarget(active);

      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
        return;
      }
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
        return;
      }

      if (!inTextField) {
        const blocks = document.querySelectorAll<HTMLElement>(
          "[data-question-block]",
        );
        const total = blocks.length;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          let current = focusedQuestionIdx;
          if (current === -1)
            blocks.forEach((b, i) => {
              if (b.contains(active)) current = i;
            });
          const next = Math.min(current + 1, total - 1);
          focusQuestion(next);
          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          let current = focusedQuestionIdx;
          if (current === -1)
            blocks.forEach((b, i) => {
              if (b.contains(active)) current = i;
            });
          const prev = Math.max(current - 1, 0);
          focusQuestion(prev);
          return;
        }
      }

      if (e.key === "Escape") {
        (active as HTMLElement)?.blur();
        setFocusedQuestionIdx(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTemplate,
    currentStep,
    focusedQuestionIdx,
    formSteps.length,
    isSubmitting,
  ]);

  const handleUpdateSubmit = async () => {
    if (!activeTemplate) return;
    setIsSubmitting(true);

    const formattedResponses = activeTemplate.questions.map((q: any) => {
      let finalAnswer = responses[q.id] || null;

      if (
        q.type === "table" &&
        finalAnswer &&
        typeof finalAnswer === "object"
      ) {
        if (q.showTotalScore) {
          finalAnswer = {
            ...finalAnswer,
            savedTotalScore: calculateTotalScore(q),
          };
        }
      }

      return {
        question_id: q.id,
        question_title: q.title,
        question_type: q.type,
        answer: finalAnswer,
      };
    });

    try {
      await api.put(`/assessment/${assessmentId}`, {
        responses: formattedResponses,
        general_notes: generalNotes,
        status: "Completed",
        date_taken: dateTaken ? new Date(dateTaken).toISOString() : undefined,
      });
      alert("Assessment updated successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Update failed", error);
      alert(getErrorMessage(error, "Failed to update assessment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className="fa-spin" /> Loading Assessment Data...
      </div>
    );
  }

  const activeStepData = formSteps[currentStep];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <h1 className={styles.title}>Edit Clinical Assessment</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      <div className={styles.card}>
        {activeTemplate && formSteps.length > 0 && (
          <>
            <div className={styles.activeTemplateHeader}>
              <div className={styles.activeTemplateInfo}>
                <span className={styles.templateBadge}>Editing Assessment</span>
                <h2>{activeTemplate.assessmentName}</h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Patient: {assessmentMeta?.patient_id?.patient_first_name}{" "}
                  {assessmentMeta?.patient_id?.patient_last_name}
                </p>
              </div>
            </div>

            <div className={styles.progressWrapper}>
              <div className={styles.progressHeader}>
                <h3 className={styles.stepCurrentTitle}>
                  {activeStepData.title}
                </h3>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${((currentStep + 1) / formSteps.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className={styles.stepContent} key={currentStep}>
              {!activeStepData.isNotesStep ? (
                <div className={styles.formLayout}>
                  {activeStepData.questions.map((q: any, qIdx: number) => (
                    <div
                      key={q.id}
                      className={`${styles.questionBlock} ${focusedQuestionIdx === qIdx ? (styles.questionBlockFocused ?? "") : ""}`}
                      data-question-block={qIdx}
                    >
                      <h3 className={styles.questionTitle}>
                        {q.globalIndex}. {q.title}
                      </h3>
                      {q.description && (
                        <p className={styles.questionDesc}>{q.description}</p>
                      )}

                      {q.type === "text" && (
                        <SmartTextInput
                          value={responses[q.id] || ""}
                          onChange={(val) => handleResponseChange(q.id, val)}
                          className={styles.textInput}
                          placeholder="Enter patient response..."
                        />
                      )}

                      {q.type === "dropdown" && (
                        <select
                          value={responses[q.id] || ""}
                          onChange={(e) =>
                            handleResponseChange(q.id, e.target.value)
                          }
                          className={styles.textInput}
                        >
                          <option value="">-- Select an option --</option>
                          {q.options?.map((opt: any) => (
                            <option key={opt.id} value={opt.value}>
                              {opt.value}
                            </option>
                          ))}
                        </select>
                      )}

                      {q.type === "radio" && (
                        <div className={styles.optionsGroup}>
                          {q.options?.map((opt: any) => (
                            <label key={opt.id} className={styles.optionLabel}>
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt.value}
                                checked={responses[q.id] === opt.value}
                                onChange={(e) =>
                                  handleResponseChange(q.id, e.target.value)
                                }
                              />
                              {opt.value}
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === "checkbox" && (
                        <div className={styles.optionsGroup}>
                          {q.options?.map((opt: any) => (
                            <label key={opt.id} className={styles.optionLabel}>
                              <input
                                type="checkbox"
                                checked={(responses[q.id] || []).includes(
                                  opt.value,
                                )}
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    q.id,
                                    opt.value,
                                    e.target.checked,
                                  )
                                }
                              />
                              {opt.value}
                            </label>
                          ))}
                        </div>
                      )}

                      {/* --- ADDED: nested_mcq Handler --- */}
                      {q.type === "nested_mcq" && (
                        <div className={styles.optionsGroup}>
                          {q.options?.map((opt: any) => {
                            const isSelected =
                              responses[q.id]?.selectedParent === opt.value;

                            return (
                              <div
                                key={opt.id}
                                style={{ marginBottom: "16px" }}
                              >
                                <label className={styles.optionLabel}>
                                  <input
                                    type="radio"
                                    name={`edit_q_${q.id}`}
                                    value={opt.value}
                                    checked={isSelected}
                                    onChange={() =>
                                      handleResponseChange(q.id, {
                                        selectedParent: opt.value,
                                        subSelections: [],
                                      })
                                    }
                                  />
                                  <span style={{ fontWeight: 600 }}>
                                    {opt.value}
                                  </span>
                                </label>

                                {isSelected && opt.subOptions?.length > 0 && (
                                  <div
                                    style={{
                                      marginLeft: "28px",
                                      marginTop: "12px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "8px",
                                    }}
                                  >
                                    {opt.subOptions.map((sub: any) => {
                                      const isChecked = (
                                        responses[q.id]?.subSelections || []
                                      ).includes(sub.value);
                                      return (
                                        <label
                                          key={sub.id}
                                          className={styles.optionLabel}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentSubs =
                                                responses[q.id]
                                                  ?.subSelections || [];
                                              const newSubs = e.target.checked
                                                ? [...currentSubs, sub.value]
                                                : currentSubs.filter(
                                                    (v: string) =>
                                                      v !== sub.value,
                                                  );

                                              handleResponseChange(q.id, {
                                                ...responses[q.id],
                                                subSelections: newSubs,
                                              });
                                            }}
                                          />
                                          {sub.value}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === "inline_blanks" && (
                        <div className={styles.inlineBlanksWrapper}>
                          {(q.blankLines || []).map((line: any) => (
                            <div key={line.id} style={{ marginBottom: "16px" }}>
                              {(line.text || "")
                                .split("[blank]")
                                .map(
                                  (
                                    part: string,
                                    index: number,
                                    array: any[],
                                  ) => {
                                    const isLast = index === array.length - 1;
                                    const blankKey = `${line.id}_${index}`;
                                    const val =
                                      responses[q.id]?.[blankKey] || "";

                                    return (
                                      <React.Fragment key={index}>
                                        <span>{part}</span>
                                        {!isLast &&
                                          (q.blankType === "dropdown" ? (
                                            <select
                                              value={val}
                                              onChange={(e) =>
                                                handleInlineBlankChange(
                                                  q.id,
                                                  line.id,
                                                  index,
                                                  e.target.value,
                                                )
                                              }
                                              className={styles.inlineSelect}
                                            >
                                              <option value="">
                                                -- Select --
                                              </option>
                                              {q.options?.map((opt: any) => (
                                                <option
                                                  key={opt.id}
                                                  value={opt.value}
                                                >
                                                  {opt.value}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <input
                                              type="text"
                                              value={val}
                                              onChange={(e) =>
                                                handleInlineBlankChange(
                                                  q.id,
                                                  line.id,
                                                  index,
                                                  e.target.value,
                                                )
                                              }
                                              className={styles.inlineInput}
                                            />
                                          ))}
                                      </React.Fragment>
                                    );
                                  },
                                )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === "table" && (
                        <div className={styles.tableWrapper}>
                          <table className={styles.advancedTable}>
                            <thead className={styles.tableHeader}>
                              <tr>
                                {q.hasRowLabels !== false && (
                                  <th>{q.columns?.[0]?.value || "Details"}</th>
                                )}
                                {(q.hasRowLabels !== false
                                  ? q.columns.slice(1)
                                  : q.columns
                                ).map((col: any, colIdx: number) => (
                                  <th key={col.id}>
                                    {col.value || `Column ${colIdx + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {q.rows?.map((row: any) => (
                                <tr key={row.id} className={styles.tableRow}>
                                  {q.hasRowLabels !== false && (
                                    <td
                                      className={styles.tableCell}
                                      style={{
                                        paddingLeft: row.isSubRow
                                          ? "32px"
                                          : "16px",
                                      }}
                                    >
                                      <div className={styles.rowLabelWrapper}>
                                        {row.srNo && (
                                          <span className={styles.cellSrNo}>
                                            {row.srNo}
                                          </span>
                                        )}
                                        {row.labelEditable ? (
                                          <input
                                            type="text"
                                            value={
                                              responses[q.id]?.[row.id]
                                                ?.__rowLabel ??
                                              row.label ??
                                              ""
                                            }
                                            onChange={(e) =>
                                              handleRowLabelChange(
                                                q.id,
                                                row.id,
                                                e.target.value,
                                              )
                                            }
                                            className={styles.cellInput}
                                            placeholder={
                                              row.label || "Enter label..."
                                            }
                                          />
                                        ) : (
                                          <span className={styles.cellLabel}>
                                            {row.label}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  )}

                                  {(q.hasRowLabels !== false
                                    ? q.columns.slice(1)
                                    : q.columns
                                  ).map(
                                    (
                                      col: any,
                                      colIdx: number,
                                      array: any[],
                                    ) => {
                                      const isLastColumn =
                                        colIdx === array.length - 1;
                                      const cellValue =
                                        responses[q.id]?.[row.id]?.[col.id] ||
                                        "";
                                      const isCheckboxCell =
                                        (row.cellType === "per_column" &&
                                          col.colType === "checkbox") ||
                                        row.cellType === "checkbox";
                                      const isReferenceRange =
                                        col.colType === "reference_range";

                                      return (
                                        <td
                                          key={col.id}
                                          className={styles.tableCell}
                                        >
                                          {isReferenceRange ? (
                                            <span
                                              style={{
                                                fontSize: "0.85rem",
                                                color: "#64748b",
                                                fontWeight: 500,
                                              }}
                                            >
                                              {row.referenceValues?.[col.id] ||
                                                "—"}
                                            </span>
                                          ) : row.cellType === "rubric" ? (
                                            isLastColumn ? (
                                              <input
                                                type="number"
                                                value={cellValue}
                                                onChange={(e) =>
                                                  handleTableCellChange(
                                                    q.id,
                                                    row.id,
                                                    col.id,
                                                    e.target.value,
                                                  )
                                                }
                                                className={styles.cellInput}
                                                style={{ width: "80px" }}
                                              />
                                            ) : (
                                              <span
                                                className={styles.rubricText}
                                              >
                                                {row.cellDescriptions?.[
                                                  colIdx
                                                ] || ""}
                                              </span>
                                            )
                                          ) : isCheckboxCell ? (
                                            <input
                                              type="checkbox"
                                              checked={!!cellValue}
                                              onChange={(e) =>
                                                handleTableCellChange(
                                                  q.id,
                                                  row.id,
                                                  col.id,
                                                  e.target.checked,
                                                )
                                              }
                                              style={{
                                                width: "20px",
                                                height: "20px",
                                                accentColor: "#0b7b8a",
                                              }}
                                            />
                                          ) : (
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                              }}
                                            >
                                              <input
                                                type="text"
                                                value={cellValue}
                                                onChange={(e) =>
                                                  handleTableCellChange(
                                                    q.id,
                                                    row.id,
                                                    col.id,
                                                    e.target.value,
                                                  )
                                                }
                                                className={styles.cellInput}
                                              />
                                              {row.unit && (
                                                <span
                                                  className={styles.cellUnit}
                                                >
                                                  {row.unit}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                      );
                                    },
                                  )}
                                </tr>
                              ))}

                              {q.showTotalScore && (
                                <tr
                                  className={styles.tableRow}
                                  style={{ backgroundColor: "#f8fafc" }}
                                >
                                  <td
                                    colSpan={
                                      q.hasRowLabels !== false
                                        ? q.columns.length - 1
                                        : q.columns.length - 1
                                    }
                                    className={styles.tableCell}
                                    style={{
                                      textAlign: "right",
                                      fontWeight: "bold",
                                      color: "#0f172a",
                                      paddingRight: "16px",
                                    }}
                                  >
                                    Auto-Calculated Total Score:
                                  </td>
                                  <td className={styles.tableCell}>
                                    <input
                                      type="text"
                                      disabled
                                      value={calculateTotalScore(q)}
                                      className={styles.cellInput}
                                      style={{
                                        width: "80px",
                                        fontWeight: "bold",
                                        backgroundColor: "#e2e8f0",
                                        color: "#0b7b8a",
                                        cursor: "not-allowed",
                                        textAlign: "center",
                                      }}
                                    />
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.questionBlock}>
                  <div className={styles.dateFieldWrapper}>
                    <label className={styles.dateFieldLabel}>
                      Assessment Date
                      <span>Update date taken if correcting records</span>
                    </label>
                    <input
                      type="date"
                      value={dateTaken}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDateTaken(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                  <h3 className={styles.notesTitle}>
                    Additional Clinical Notes
                  </h3>
                  <SmartTextArea
                    value={generalNotes}
                    onChange={setGeneralNotes}
                    placeholder="Enter any qualitative observations, practitioner notes, or summaries here..."
                  />
                </div>
              )}
            </div>

            <div className={styles.stepFooter}>
              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || isSubmitting}
                className={`${styles.navButton} ${styles.navButtonSecondary}`}
              >
                <FaChevronLeft size={12} /> Previous Step
              </button>

              <span className={styles.stepCounter}>
                Section {currentStep + 1} of {formSteps.length}
              </span>

              {currentStep < formSteps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className={`${styles.navButton} ${styles.navButtonPrimary}`}
                >
                  Next Step <FaChevronRight size={12} />
                </button>
              ) : (
                <button
                  onClick={handleUpdateSubmit}
                  disabled={isSubmitting}
                  className={`${styles.navButton} ${styles.navButtonPrimary}`}
                >
                  {isSubmitting ? (
                    <FaSpinner className="fa-spin" />
                  ) : (
                    <FaSave />
                  )}
                  {isSubmitting ? "Updating..." : "Save Updates"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
