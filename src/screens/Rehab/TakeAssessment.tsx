import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaChevronRight,
  FaChevronLeft,
  FaClipboardCheck,
  FaExchangeAlt,
  FaFolderOpen,
} from "react-icons/fa";
import api from "../../utils/central";
import styles from "../../css/Rehab/TakeAssessment.module.css";
import SmartTextInput from "./SmartInputText";
import SmartTextArea from "./SmartareaText";

// Builds a short, human-readable description of what a field represents so
// the AI suggestion backend can tailor completions instead of guessing from
// a bare text fragment (e.g. a table cell just says "no", context tells the
// model *what* is being scored). Falsy parts are dropped automatically.
function buildFieldContext(
  parts: Record<string, string | number | null | undefined>,
): string {
  return Object.entries(parts)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([label, v]) => `${label}: ${v}`)
    .join(" | ");
}

// Seeds the responses map from each question's optional default value, so
// the form opens pre-filled but every field stays editable through the same
// handlers (handleResponseChange, handleTableCellChange, etc.) used for a
// normal edit.
function buildDefaultResponses(template: any): Record<string, any> {
  const defaults: Record<string, any> = {};

  (template?.questions || []).forEach((q: any) => {
    if (q.type === "text" || q.type === "dropdown" || q.type === "radio") {
      if (q.defaultValue) defaults[q.id] = q.defaultValue;
    } else if (q.type === "checkbox") {
      if (Array.isArray(q.defaultValue) && q.defaultValue.length > 0) {
        defaults[q.id] = [...q.defaultValue];
      }
    } else if (q.type === "nested_mcq") {
      if (q.defaultValue?.selectedParent) {
        defaults[q.id] = {
          selectedParent: q.defaultValue.selectedParent,
          subSelections: [...(q.defaultValue.subSelections || [])],
        };
      }
    } else if (q.type === "inline_blanks") {
      const blankDefaults: Record<string, string> = {};
      (q.blankLines || []).forEach((line: any) => {
        (line.defaultValues || []).forEach((val: string, idx: number) => {
          if (val) blankDefaults[`${line.id}_${idx}`] = val;
        });
      });
      if (Object.keys(blankDefaults).length > 0) {
        defaults[q.id] = blankDefaults;
      }
    } else if (q.type === "table") {
      const rowDefaults: Record<string, any> = {};
      (q.rows || []).forEach((row: any) => {
        const cellDefaults: Record<string, any> = {};
        Object.entries(row.defaultValues || {}).forEach(([colId, val]) => {
          if (val !== "" && val !== undefined && val !== null) {
            cellDefaults[colId] = val;
          }
        });
        if (Object.keys(cellDefaults).length > 0) {
          rowDefaults[row.id] = cellDefaults;
        }
      });
      if (Object.keys(rowDefaults).length > 0) defaults[q.id] = rowDefaults;
    }
  });

  return defaults;
}

export default function TakeAssessment() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [activeTemplate, setActiveTemplate] = useState<any>(null);

  const [responses, setResponses] = useState<Record<string, any>>({});
  const [generalNotes, setGeneralNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dateTaken, setDateTaken] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [doctorDeptId, setDoctorDeptId] = useState<string | null>(
    localStorage.getItem("doctorDeptId"),
  );

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const res = await api.get("/doctor");
        const doctorData = res.data;

        if (doctorData && doctorData.department_id) {
          const currentDeptId = doctorData.department_id;
          if (currentDeptId !== doctorDeptId) {
            localStorage.setItem("doctorDeptId", currentDeptId);
            setDoctorDeptId(currentDeptId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch doctor info", err);
      }
    };
    fetchDoctorInfo();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [deptRes, tempRes] = await Promise.all([
          api.get("/departments"),
          api.get("/form-builder/templates"),
        ]);

        setDepartments(deptRes.data.departments || []);
        setAllTemplates(tempRes.data.templates || []);
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const groupedTemplates = useMemo(() => {
    if (!doctorDeptId || departments.length === 0) return {};

    const doctorDept = departments.find((d) => d._id === doctorDeptId);
    const canAccessAll =
      doctorDept?.privileges?.can_access_all_assessments === true;
    const visibleTemplates = canAccessAll
      ? allTemplates
      : allTemplates.filter((t) => t.department_id === doctorDeptId);

    const grouped = visibleTemplates.reduce(
      (acc, template) => {
        const deptId = template.department_id;
        const dept = departments.find((d) => d._id === deptId);
        const deptName = dept ? dept.department_name : "General / Unassigned";

        if (!acc[deptName]) acc[deptName] = [];
        acc[deptName].push(template);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a: any, b: any) => {
        const aSeq = a.sequence;
        const bSeq = b.sequence;
        if (typeof aSeq === "number" && typeof bSeq === "number")
          return aSeq - bSeq;
        if (typeof aSeq === "number") return -1;
        if (typeof bSeq === "number") return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    });

    return grouped;
  }, [allTemplates, departments, doctorDeptId]);

  const sortedDepartments = useMemo(() => {
    return Object.keys(groupedTemplates).sort((a, b) => {
      if (a === "General / Unassigned") return 1;
      if (b === "General / Unassigned") return -1;
      return a.localeCompare(b);
    });
  }, [groupedTemplates]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setActiveTemplate(null);
      setResponses({});
      setCurrentStep(0);
      return;
    }
    const loadTemplate = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(
          `/form-builder/templates/${selectedTemplateId}`,
        );
        const template = res.data.template;
        setActiveTemplate(template);
        setResponses(buildDefaultResponses(template));
        setCurrentStep(0);
      } catch (error) {
        console.error("Failed to load template details", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplate();
  }, [selectedTemplateId]);

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

  const [focusedQuestionIdx, setFocusedQuestionIdx] = useState<number>(-1);

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
          if (current === -1) {
            blocks.forEach((b, i) => {
              if (b.contains(active)) current = i;
            });
          }
          const next = Math.min(current + 1, total - 1);
          focusQuestion(next);
          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          let current = focusedQuestionIdx;
          if (current === -1) {
            blocks.forEach((b, i) => {
              if (b.contains(active)) current = i;
            });
          }
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

  const handleSubmit = async () => {
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
      await api.post("/create/assessment", {
        patient_id: patientId,
        template_id: activeTemplate._id,
        assessment_name: activeTemplate.assessmentName,
        responses: formattedResponses,
        general_notes: generalNotes,
        status: "Completed",
        date_taken: new Date(dateTaken).toISOString(),
      });
      alert("Assessment saved successfully!");
      navigate(`/patient/${patientId}`);
    } catch (error) {
      console.error("Submission failed", error);
      alert("Failed to save assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && allTemplates.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className="fa-spin" />
      </div>
    );
  }

  const activeStepData = formSteps[currentStep];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Patient
        </button>
        <h1 className={styles.title}>Conduct Clinical Assessment</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      <div className={styles.card}>
        {!activeTemplate && (
          <div className={styles.templateSelectionContainer}>
            <div className={styles.selectionHeader}>
              <h2>Select an Assessment</h2>
              <p>Choose a clinical instrument to begin the evaluation.</p>
            </div>

            {sortedDepartments.length > 0 ? (
              <div className={styles.templateList}>
                {sortedDepartments.map((deptName) => (
                  <React.Fragment key={deptName}>
                    <div className={styles.departmentGroupHeader}>
                      <FaFolderOpen className={styles.folderIcon} />
                      {deptName} Forms
                    </div>

                    {groupedTemplates[deptName].map((t: any) => (
                      <button
                        key={t._id}
                        className={styles.templateListItem}
                        onClick={() => setSelectedTemplateId(t._id)}
                      >
                        <div className={styles.templateItemMain}>
                          <div
                            className={
                              t.sequence != null
                                ? styles.sequenceBadge
                                : styles.sequenceBadgeDash
                            }
                          >
                            {t.sequence != null ? `#${t.sequence}` : "-"}
                          </div>

                          <div className={styles.templateItemIcon}>
                            <FaClipboardCheck />
                          </div>

                          <div className={styles.templateItemText}>
                            <h4>{t.assessmentName}</h4>
                            <p>Click to start this evaluation</p>
                          </div>
                        </div>
                        <div className={styles.templateItemArrow}>
                          <FaChevronRight />
                        </div>
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "1rem",
                  color: "#64748b",
                  fontStyle: "italic",
                  background: "#f8fafc",
                  borderRadius: "0.5rem",
                  border: "1px dashed #cbd5e1",
                }}
              >
                {!doctorDeptId && isLoading
                  ? "Loading your department assignments..."
                  : "No assessment templates are currently assigned to your department."}
              </div>
            )}
          </div>
        )}

        {isLoading && selectedTemplateId && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem 0",
            }}
          >
            <FaSpinner
              className={`fa-spin ${styles.inlineSpinner}`}
              size={24}
              color="var(--primary)"
            />
          </div>
        )}

        {activeTemplate && !isLoading && formSteps.length > 0 && (
          <>
            <div className={styles.activeTemplateHeader}>
              <div className={styles.activeTemplateInfo}>
                <span className={styles.templateBadge}>Current Assessment</span>
                <h2>{activeTemplate.assessmentName}</h2>
              </div>
              <button
                className={styles.changeTemplateBtn}
                onClick={() => setSelectedTemplateId("")}
              >
                <FaExchangeAlt /> Change
              </button>
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
                          context={buildFieldContext({
                            Template: activeTemplate?.assessmentName,
                            Question: q.title,
                            Details: q.description,
                          })}
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
                                {/* Parent Radio Button */}
                                <label className={styles.optionLabel}>
                                  <input
                                    type="radio"
                                    name={`q_${q.id}`}
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

                                {/* Conditional Sub-Options (Checkboxes) */}
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
                                            <SmartTextInput
                                              value={val}
                                              onChange={(newVal) =>
                                                handleInlineBlankChange(
                                                  q.id,
                                                  line.id,
                                                  index,
                                                  newVal,
                                                )
                                              }
                                              className={styles.inlineInput}
                                              inline
                                              context={buildFieldContext({
                                                Template:
                                                  activeTemplate?.assessmentName,
                                                Question: q.title,
                                                Sentence: (
                                                  line.text || ""
                                                ).replace("[blank]", "___"),
                                              })}
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
                                          <SmartTextInput
                                            value={
                                              responses[q.id]?.[row.id]
                                                ?.__rowLabel ??
                                              row.label ??
                                              ""
                                            }
                                            onChange={(val) =>
                                              handleRowLabelChange(
                                                q.id,
                                                row.id,
                                                val,
                                              )
                                            }
                                            className={styles.cellInput}
                                            placeholder={
                                              row.label || "Enter label..."
                                            }
                                            context={buildFieldContext({
                                              Template:
                                                activeTemplate?.assessmentName,
                                              Table: q.title,
                                              Field: "Row label",
                                            })}
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
                                              <SmartTextInput
                                                value={cellValue}
                                                onChange={(val) =>
                                                  handleTableCellChange(
                                                    q.id,
                                                    row.id,
                                                    col.id,
                                                    val,
                                                  )
                                                }
                                                className={styles.cellInput}
                                                context={buildFieldContext({
                                                  Template:
                                                    activeTemplate?.assessmentName,
                                                  Table: q.title,
                                                  Row:
                                                    responses[q.id]?.[row.id]
                                                      ?.__rowLabel ?? row.label,
                                                  Column: col.value,
                                                  Unit: row.unit,
                                                })}
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
                                  style={{
                                    backgroundColor: "#f8fafc",
                                  }}
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
                      <span>Backdated entries allowed</span>
                    </label>
                    <input
                      type="date"
                      value={dateTaken}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDateTaken(e.target.value)}
                      className={styles.dateInput}
                    />
                    {dateTaken &&
                      dateTaken < new Date().toISOString().split("T")[0] && (
                        <span className={styles.backdatedBadge}>
                          ⚠ Backdated entry
                        </span>
                      )}
                  </div>
                  <h3 className={styles.notesTitle}>
                    Additional Clinical Notes
                  </h3>

                  <SmartTextArea
                    value={generalNotes}
                    onChange={setGeneralNotes}
                    placeholder="Enter any qualitative observations, practitioner notes, or summaries here..."
                    context={buildFieldContext({
                      Field: "General clinical notes",
                      Template: activeTemplate?.assessmentName,
                    })}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                padding: "6px 16px",
                background: "#f1f5f9",
                borderRadius: "8px",
                marginBottom: "8px",
                fontSize: "11.5px",
                color: "#64748b",
                flexWrap: "wrap",
              }}
            >
              <span title="Jump to previous/next question">
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  ↑
                </kbd>
                {" / "}
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  ↓
                </kbd>
                {" Between questions"}
              </span>
              <span title="Navigate steps even while typing">
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  Alt
                </kbd>
                {" + "}
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  ←
                </kbd>
                {" / "}
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  →
                </kbd>
                {" Between steps"}
              </span>
              <span title="Move between fields">
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  Tab
                </kbd>
                {" Next field"}
              </span>
              <span title="Deselect current field">
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  Esc
                </kbd>
                {" Deselect"}
              </span>
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
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`${styles.navButton} ${styles.navButtonPrimary}`}
                >
                  {isSubmitting ? (
                    <FaSpinner className="fa-spin" />
                  ) : (
                    <FaSave />
                  )}
                  {isSubmitting ? "Saving..." : "Submit Assessment"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
