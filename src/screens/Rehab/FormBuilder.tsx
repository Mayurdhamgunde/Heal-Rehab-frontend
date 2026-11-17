import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Trash2,
  Plus,
  GripVertical,
  Eye,
  AlignLeft,
  CheckSquare,
  ChevronDown,
  Circle,
  LayoutGrid,
  Type,
  Heading,
  ArrowUp,
  ArrowDown,
  Upload,
} from "lucide-react";
import api from "../../utils/central"; // Adjust path if needed
import styles from "../../css/Rehab/FormBuilder.module.css"; // Adjust path if needed

export type QuestionType =
  | "text"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "table"
  | "inline_blanks"
  | "section_header"
  | "nested_mcq";

export interface ListItem {
  id: string;
  value: string;
  subOptions?: { id: string; value: string }[];
}

export interface TableColumnDef {
  id: string;
  value: string;
  colType?: "text" | "checkbox" | "reference_range";
}

export interface TableRowDef {
  id: string;
  srNo: string;
  label: string;
  cellType: "text" | "checkbox" | "none" | "rubric" | "per_column";
  isSubRow: boolean;
  unit?: string;
  cellDescriptions?: string[];
  labelEditable?: boolean;
  referenceValues?: Record<string, string>;
  defaultValues?: Record<string, string | boolean>;
}

export interface BlankLineDef {
  id: string;
  text: string;
  defaultValues?: string[];
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  templateText?: string;
  blankLines?: BlankLineDef[];
  blankType?: "text" | "dropdown";
  type: QuestionType;
  options: ListItem[];
  columns: TableColumnDef[];
  rows: TableRowDef[];
  hasRowLabels?: boolean;
  showTotalScore?: boolean;
  printSideBySide?: boolean;
  hideEmptyDashes?: boolean;
  largeTablePrint?: boolean;
  // Pre-fills the answer in Take Assessment; staff can still edit it.
  // string for text/dropdown/radio, string[] for checkbox,
  // { selectedParent, subSelections } for nested_mcq.
  defaultValue?: any;
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const [assessmentName, setAssessmentName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [sequence, setSequence] = useState<number | "">("");
  const [departments, setDepartments] = useState<any[]>([]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [departmentError, setDepartmentError] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState("");

  const migrateQuestions = (rawQuestions: any[]): Question[] => {
    return (rawQuestions || []).map((q: any) => {
      if (q.type === "inline_blanks" && !q.blankLines) {
        return {
          ...q,
          blankLines: [{ id: generateId(), text: q.templateText || "" }],
        };
      }
      if (q.type === "table") {
        return {
          ...q,
          columns: (q.columns || []).map((col: any) => ({
            ...col,
            colType: col.colType || "text",
          })),
          rows: (q.rows || []).map((row: any) => ({
            ...row,
            cellType: row.cellType || "text",
            referenceValues: row.referenceValues || {},
          })),
        };
      }
      return q;
    });
  };

  const handleImportButtonClick = () => {
    setImportError("");
    fileInputRef.current?.click();
  };

  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (!Array.isArray(data.questions)) {
          throw new Error("File must contain a 'questions' array.");
        }

        if (
          !window.confirm(
            "Importing this template will replace the current form elements below. Continue?",
          )
        ) {
          return;
        }

        if (data.assessmentName) setAssessmentName(data.assessmentName);
        if (data.department_id !== undefined)
          setSelectedDepartment(data.department_id || "");
        if (data.sequence !== undefined && data.sequence !== null) {
          setSequence(data.sequence);
        }
        setQuestions(migrateQuestions(data.questions));
        setImportError("");
      } catch (err: any) {
        setImportError(
          err?.message
            ? `Could not import file: ${err.message}`
            : "Could not import file: invalid JSON.",
        );
      } finally {
        // Allow re-selecting the same file again later
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/departments");
        setDepartments(response.data.departments || []);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (templateId) {
      const loadTemplate = async () => {
        try {
          const response = await api.get(
            `/form-builder/templates/${templateId}`,
          );
          const data = response.data.template;
          const migratedQuestions = migrateQuestions(data.questions);

          setAssessmentName(data.assessmentName);
          setSelectedDepartment(data.department_id || "");
          setSequence(
            data.sequence !== undefined && data.sequence !== null
              ? data.sequence
              : "",
          );
          setQuestions(migratedQuestions);
        } catch (error) {
          console.error("Failed to load template", error);
          setErrorMessage("Could not load the template for editing.");
          setSubmitStatus("error");
        }
      };
      loadTemplate();
    } else {
      handleAddQuestion();
    }
  }, [templateId]);

  const handleAddQuestion = (insertAfterIndex?: number) => {
    const newQuestion: Question = {
      id: generateId(),
      title: "",
      description: "",
      templateText: "",
      blankLines: [{ id: generateId(), text: "" }],
      blankType: "text",
      type: "text",
      options: [{ id: generateId(), value: "Option 1" }],
      columns: [
        { id: generateId(), value: "Details", colType: "text" },
        { id: generateId(), value: "Response", colType: "text" },
      ],
      rows: [
        {
          id: generateId(),
          srNo: "1",
          label: "Row 1",
          cellType: "per_column",
          isSubRow: false,
          cellDescriptions: [],
          unit: "",
          labelEditable: false,
          referenceValues: {},
        },
      ],
      hasRowLabels: true,
      showTotalScore: false,
      printSideBySide: false,
      hideEmptyDashes: false,
      largeTablePrint: false,
      defaultValue: null,
    };

    if (typeof insertAfterIndex === "number") {
      setQuestions((prev) => {
        const updated = [...prev];
        updated.splice(insertAfterIndex + 1, 0, newQuestion);
        return updated;
      });
    } else {
      setQuestions((prev) => [...prev, newQuestion]);
    }
  };

  const handleUpdateQuestion = (
    id: string,
    field: keyof Question,
    value: any,
  ) => {
    setQuestions((q) =>
      q.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((q) => q.filter((item) => item.id !== id));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      if (direction === "up" && index > 0) {
        [newQuestions[index - 1], newQuestions[index]] = [
          newQuestions[index],
          newQuestions[index - 1],
        ];
      } else if (direction === "down" && index < newQuestions.length - 1) {
        [newQuestions[index + 1], newQuestions[index]] = [
          newQuestions[index],
          newQuestions[index + 1],
        ];
      }
      return newQuestions;
    });
  };

  const handleAddBlankLine = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const currentLines = q.blankLines || [];
          return {
            ...q,
            blankLines: [...currentLines, { id: generateId(), text: "" }],
          };
        }
        return q;
      }),
    );
  };

  const handleUpdateBlankLine = (qId: string, lineId: string, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const currentLines = q.blankLines || [];
          return {
            ...q,
            blankLines: currentLines.map((line) =>
              line.id === lineId ? { ...line, text } : line,
            ),
          };
        }
        return q;
      }),
    );
  };

  const handleUpdateBlankLineDefault = (
    qId: string,
    lineId: string,
    blankIndex: number,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            blankLines: (q.blankLines || []).map((line) => {
              if (line.id !== lineId) return line;
              const defaults = [...(line.defaultValues || [])];
              defaults[blankIndex] = value;
              return { ...line, defaultValues: defaults };
            }),
          };
        }
        return q;
      }),
    );
  };

  const handleDeleteBlankLine = (qId: string, lineId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const currentLines = q.blankLines || [];
          return {
            ...q,
            blankLines: currentLines.filter((line) => line.id !== lineId),
          };
        }
        return q;
      }),
    );
  };

  const handleAddSimpleList = (qId: string, listType: "options") => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            [listType]: [
              ...q[listType],
              { id: generateId(), value: "", subOptions: [] },
            ],
          };
        }
        return q;
      }),
    );
  };

  const handleUpdateSimpleList = (
    qId: string,
    listType: "options",
    itemId: string,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            [listType]: q[listType].map((item) =>
              item.id === itemId ? { ...item, value } : item,
            ),
          };
        }
        return q;
      }),
    );
  };

  const handleDeleteSimpleList = (
    qId: string,
    listType: "options" | "columns",
    itemId: string,
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              [listType]: (q[listType] as any[]).filter(
                (item: any) => item.id !== itemId,
              ),
            }
          : q,
      ),
    );
  };

  const handleAddSubOption = (qId: string, optId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optId
                ? {
                    ...opt,
                    subOptions: [
                      ...(opt.subOptions || []),
                      { id: generateId(), value: "" },
                    ],
                  }
                : opt,
            ),
          };
        }
        return q;
      }),
    );
  };

  const handleUpdateSubOption = (
    qId: string,
    optId: string,
    subId: string,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optId
                ? {
                    ...opt,
                    subOptions: (opt.subOptions || []).map((sub) =>
                      sub.id === subId ? { ...sub, value } : sub,
                    ),
                  }
                : opt,
            ),
          };
        }
        return q;
      }),
    );
  };

  const handleDeleteSubOption = (qId: string, optId: string, subId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optId
                ? {
                    ...opt,
                    subOptions: (opt.subOptions || []).filter(
                      (sub) => sub.id !== subId,
                    ),
                  }
                : opt,
            ),
          };
        }
        return q;
      }),
    );
  };

  const handleAddColumn = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            columns: [
              ...q.columns,
              { id: generateId(), value: "", colType: "text" },
            ],
          };
        }
        return q;
      }),
    );
  };

  const handleUpdateColumn = (
    qId: string,
    colId: string,
    field: keyof TableColumnDef,
    value: any,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            columns: q.columns.map((col) =>
              col.id === colId ? { ...col, [field]: value } : col,
            ),
          };
        }
        return q;
      }),
    );
  };

  const handleAddTableRow = (qId: string, insertAfterIndex?: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newRow: TableRowDef = {
            id: generateId(),
            srNo: "",
            label: "",
            cellType: "per_column",
            isSubRow: false,
            cellDescriptions: [],
            unit: "",
            labelEditable: false,
            referenceValues: {},
          };
          if (typeof insertAfterIndex === "number") {
            const updatedRows = [...q.rows];
            updatedRows.splice(insertAfterIndex + 1, 0, newRow);
            return { ...q, rows: updatedRows };
          }
          return { ...q, rows: [...q.rows, newRow] };
        }
        return q;
      }),
    );
  };

  const handleMoveTableRow = (
    qId: string,
    rowIndex: number,
    direction: "up" | "down",
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const newRows = [...q.rows];
          if (direction === "up" && rowIndex > 0) {
            [newRows[rowIndex - 1], newRows[rowIndex]] = [
              newRows[rowIndex],
              newRows[rowIndex - 1],
            ];
          } else if (direction === "down" && rowIndex < newRows.length - 1) {
            [newRows[rowIndex + 1], newRows[rowIndex]] = [
              newRows[rowIndex],
              newRows[rowIndex + 1],
            ];
          }
          return { ...q, rows: newRows };
        }
        return q;
      }),
    );
  };

  const handleUpdateTableRow = (
    qId: string,
    rowId: string,
    field: keyof TableRowDef,
    value: any,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            rows: q.rows.map((row) =>
              row.id === rowId ? { ...row, [field]: value } : row,
            ),
          };
        }
        return q;
      }),
    );
  };

  const handleUpdateRubricDescription = (
    qId: string,
    rowId: string,
    colIndex: number,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            rows: q.rows.map((row) => {
              if (row.id === rowId) {
                const newDescriptions = [...(row.cellDescriptions || [])];
                newDescriptions[colIndex] = value;
                return { ...row, cellDescriptions: newDescriptions };
              }
              return row;
            }),
          };
        }
        return q;
      }),
    );
  };

  const handleDeleteTableRow = (qId: string, rowId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return { ...q, rows: q.rows.filter((r) => r.id !== rowId) };
        }
        return q;
      }),
    );
  };

  const handleSaveForm = async () => {
    setDepartmentError(false);
    setSubmitStatus("idle");

    if (!assessmentName.trim() || questions.length === 0) {
      alert("Please provide an assessment name and at least one form element.");
      return;
    }

    if (!selectedDepartment) {
      setDepartmentError(true);
      setErrorMessage(
        "Please select a department before saving this template.",
      );
      setSubmitStatus("error");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        assessmentName: assessmentName.trim(),
        department_id: selectedDepartment,
        sequence: sequence === "" ? null : Number(sequence),
        questions,
        status: "Published",
      };

      if (templateId) {
        await api.put(`/form-builder/templates/${templateId}`, payload);
      } else {
        await api.post("/form-builder/templates", payload);
      }
      navigate("/AssessmentsList");
    } catch (error: any) {
      setSubmitStatus("error");
      setErrorMessage(error.response?.data?.msg || "Failed to save template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "text":
        return <AlignLeft size={14} />;
      case "table":
        return <LayoutGrid size={14} />;
      case "radio":
        return <Circle size={14} />;
      case "checkbox":
        return <CheckSquare size={14} />;
      case "inline_blanks":
        return <Type size={14} />;
      case "section_header":
        return <Heading size={14} />;
      case "nested_mcq":
        return <CheckSquare size={14} />;
      default:
        return <AlignLeft size={14} />;
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "text":
        return "Short Text";
      case "radio":
        return "Single Choice";
      case "checkbox":
        return "Multiple Choice";
      case "table":
        return "Advanced Table";
      case "inline_blanks":
        return "Fill-in-the-Blanks";
      case "section_header":
        return "Section Header";
      case "nested_mcq":
        return "Conditional Choice";
      default:
        return "Short Text";
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1>Assessment Form Builder</h1>
          <p>Design clinical-grade instruments with semantic structure.</p>
        </div>

        <div
          className={styles.headerRight}
          style={{ border: departmentError ? "1px solid #ef4444" : "none" }}
        >
          <div className={styles.inputGroup}>
            <label>Assessment Name</label>
            <input
              type="text"
              placeholder="e.g., Intake Assessment"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              className={styles.globalNameInput}
            />
          </div>

          <div className={styles.divider}></div>

          <div className={styles.inputGroup}>
            <label style={{ color: departmentError ? "#ef4444" : "#0b7b8a" }}>
              Assigned Department *
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setDepartmentError(false);
              }}
              className={styles.globalSelectInput}
              style={{ color: departmentError ? "#ef4444" : undefined }}
            >
              <option value="" disabled hidden>
                Select Department
              </option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.divider}></div>
          <div className={styles.inputGroup}>
            <label>Order No. (Sequence)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={sequence}
              onChange={(e) =>
                setSequence(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={styles.globalNameInput}
              style={{ width: "90px", textAlign: "center" }}
              title="Leave blank to auto-add to the end"
            />
          </div>
        </div>
      </header>

      {submitStatus === "error" && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#ef4444",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>
      )}

      {importError && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#ef4444",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {importError}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFileSelected}
          style={{ display: "none" }}
        />
        <button
          onClick={handleImportButtonClick}
          className={styles.addFormElementBtn}
          title="Load an assessment template from a JSON file"
          type="button"
        >
          <Upload size={16} /> Import Template (JSON)
        </button>
      </div>

      {questions.map((q, index) => (
        <div
          key={q.id}
          className={styles.questionCard}
          style={
            q.type === "section_header"
              ? { borderLeftColor: "#334155", background: "#f8fafc" }
              : {}
          }
        >
          <div className={styles.cardHeader}>
            <div className={styles.headerInputs}>
              <input
                type="text"
                placeholder={
                  q.type === "section_header"
                    ? "Section Title (e.g., I - Socio-Demographic Information)"
                    : "Question Title (e.g., 4. Period of abstinence:)"
                }
                value={q.title}
                onChange={(e) =>
                  handleUpdateQuestion(q.id, "title", e.target.value)
                }
                className={styles.titleInput}
                style={
                  q.type === "section_header"
                    ? { fontSize: "1.25rem", color: "#0f172a" }
                    : {}
                }
              />
              <input
                type="text"
                placeholder={
                  q.type === "section_header"
                    ? "Optional section subtitle or instructions..."
                    : "Description or instructions..."
                }
                value={q.description || ""}
                onChange={(e) =>
                  handleUpdateQuestion(q.id, "description", e.target.value)
                }
                className={styles.descInput}
              />
            </div>

            <div className={styles.headerActions}>
              <button
                onClick={() => handleAddQuestion(index)}
                className={styles.actionBtn}
                title="Insert form element below"
              >
                <Plus size={16} />
              </button>

              <button
                onClick={() => handleMoveQuestion(index, "up")}
                disabled={index === 0}
                className={styles.actionBtn}
                title="Move Up"
              >
                <ArrowUp size={16} />
              </button>
              <button
                onClick={() => handleMoveQuestion(index, "down")}
                disabled={index === questions.length - 1}
                className={styles.actionBtn}
                title="Move Down"
              >
                <ArrowDown size={16} />
              </button>

              <div
                className={styles.typeSelectWrapper}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    pointerEvents: "none",
                  }}
                >
                  {getTypeIcon(q.type)}
                  <span style={{ flex: 1, paddingRight: "8px" }}>
                    {getTypeLabel(q.type)}
                  </span>
                  <ChevronDown size={14} color="#94a3b8" />
                </div>

                <select
                  value={q.type}
                  onChange={(e) =>
                    handleUpdateQuestion(
                      q.id,
                      "type",
                      e.target.value as QuestionType,
                    )
                  }
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="text">Short Text</option>
                  <option value="radio">Single Choice</option>
                  <option value="checkbox">Multiple Choice</option>
                  <option value="table">Advanced Table</option>
                  <option value="inline_blanks">Fill-in-the-Blanks</option>
                  <option value="nested_mcq">Conditional Choice</option>
                  <option value="section_header">Section Header</option>
                </select>
              </div>

              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className={styles.deleteBtn}
                title="Delete element"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {q.type === "section_header" && (
            <div
              className={styles.textPreview}
              style={{
                background: "#e2e8f0",
                color: "#334155",
                fontStyle: "normal",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Heading size={16} /> This block acts as a visual divider in the
              final form. No patient input is required here.
            </div>
          )}

          {q.type === "text" && (
            <div className={styles.configBlock}>
              <label
                className={styles.toggleLabel}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Default Answer (optional)
              </label>
              <input
                type="text"
                value={q.defaultValue || ""}
                onChange={(e) =>
                  handleUpdateQuestion(q.id, "defaultValue", e.target.value)
                }
                placeholder="Pre-filled text the clinician can edit while taking the assessment"
                className={styles.optionInput}
                style={{
                  width: "100%",
                  background: "#fff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                }}
              />
              <div className={styles.textPreview} style={{ marginTop: "10px" }}>
                Field Preview: Patient response will be captured in plain text
                format
                {q.defaultValue
                  ? " — pre-filled with the default above, editable at fill time."
                  : "."}
              </div>
            </div>
          )}

          {q.type === "inline_blanks" && (
            <div className={styles.configSection}>
              <div className={styles.configBlock}>
                <h4>Template Configuration</h4>

                <div
                  style={{
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <label
                    className={styles.toggleLabel}
                    style={{ fontSize: "0.85rem" }}
                  >
                    Blank Input Type:
                  </label>
                  <select
                    value={q.blankType || "text"}
                    onChange={(e) =>
                      handleUpdateQuestion(q.id, "blankType", e.target.value)
                    }
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: "0.85rem",
                      color: "#0f172a",
                      outline: "none",
                    }}
                  >
                    <option value="text">Text Input</option>
                    <option value="dropdown">Dropdown Options</option>
                  </select>
                </div>

                <p
                  className={styles.previewSubtext}
                  style={{
                    textAlign: "left",
                    marginTop: 0,
                    marginBottom: "12px",
                  }}
                >
                  Type your text below. Use <strong>[blank]</strong> wherever
                  you want to insert a fillable input line.
                </p>

                {(q.blankLines || []).map((line, index) => (
                  <div
                    key={line.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <textarea
                      value={line.text}
                      onChange={(e) =>
                        handleUpdateBlankLine(q.id, line.id, e.target.value)
                      }
                      placeholder={`Row ${index + 1}: e.g., Prior treatment for addiction: Year: [blank] Treatment Place: [blank]`}
                      className={styles.descInput}
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "12px",
                        borderRadius: "6px",
                        minHeight: "60px",
                        flex: 1,
                        resize: "vertical",
                        background: "#fff",
                      }}
                    />
                    {(q.blankLines || []).length > 1 && (
                      <button
                        onClick={() => handleDeleteBlankLine(q.id, line.id)}
                        className={styles.removeOptionBtn}
                        style={{
                          marginTop: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => handleAddBlankLine(q.id)}
                  className={styles.addBtnText}
                >
                  <Plus size={14} /> Add Text Row
                </button>
              </div>

              <div
                className={styles.previewSection}
                style={{ marginTop: "8px" }}
              >
                <div className={styles.previewHeader}>
                  <Eye size={14} /> Live Form Preview
                </div>
                <p
                  className={styles.previewSubtext}
                  style={{
                    textAlign: "left",
                    marginTop: 0,
                    marginBottom: "12px",
                  }}
                >
                  Optional: fill in a blank below to set its default value. It
                  will pre-fill the field when the assessment is taken, and
                  staff can still edit it.
                </p>
                <div
                  style={{
                    lineHeight: "2.5",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                  }}
                >
                  {(q.blankLines || []).map((line, lineIdx) => (
                    <div
                      key={line.id}
                      style={{
                        marginBottom:
                          lineIdx < (q.blankLines?.length || 1) - 1
                            ? "16px"
                            : "0",
                      }}
                    >
                      {(
                        line.text ||
                        "Preview will appear here once you start typing..."
                      )
                        .split("[blank]")
                        .map((part, index, array) => (
                          <React.Fragment key={index}>
                            {part}
                            {index < array.length - 1 &&
                              (q.blankType === "dropdown" ? (
                                <select
                                  value={line.defaultValues?.[index] || ""}
                                  onChange={(e) =>
                                    handleUpdateBlankLineDefault(
                                      q.id,
                                      line.id,
                                      index,
                                      e.target.value,
                                    )
                                  }
                                  className={styles.previewInput}
                                  style={{
                                    borderBottom: "1px solid #94a3b8",
                                    borderRadius: 0,
                                    background: "#f8fafc",
                                    width: "auto",
                                    minWidth: "100px",
                                    display: "inline-block",
                                    margin: "0 8px",
                                    padding: "4px",
                                  }}
                                >
                                  <option value="">No default...</option>
                                  {q.options.map((opt) => (
                                    <option key={opt.id} value={opt.value}>
                                      {opt.value || "(untitled option)"}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={line.defaultValues?.[index] || ""}
                                  onChange={(e) =>
                                    handleUpdateBlankLineDefault(
                                      q.id,
                                      line.id,
                                      index,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Default..."
                                  className={styles.previewInput}
                                  style={{
                                    borderBottom: "1px solid #94a3b8",
                                    borderRadius: 0,
                                    background: "transparent",
                                    width: "150px",
                                    display: "inline-block",
                                    margin: "0 8px",
                                    padding: "0 4px",
                                  }}
                                />
                              ))}
                          </React.Fragment>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(["radio", "checkbox", "dropdown", "nested_mcq"].includes(q.type) ||
            (q.type === "inline_blanks" && q.blankType === "dropdown")) && (
            <div
              className={styles.optionsList}
              style={{ marginTop: q.type === "inline_blanks" ? "16px" : "0" }}
            >
              {q.type === "inline_blanks" && (
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  Define Blank Dropdown Options
                </h4>
              )}
              {q.options.map((opt) => (
                <div key={opt.id} style={{ marginBottom: "12px" }}>
                  <div className={styles.optionItem}>
                    {q.type === "checkbox" || q.type === "dropdown" ? (
                      <CheckSquare size={16} className={styles.optionIcon} />
                    ) : (
                      <Circle size={16} className={styles.optionIcon} />
                    )}
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) =>
                        handleUpdateSimpleList(
                          q.id,
                          "options",
                          opt.id,
                          e.target.value,
                        )
                      }
                      className={styles.optionInput}
                      placeholder={
                        q.type === "nested_mcq"
                          ? "Parent category (e.g., Uncomplicated)"
                          : "Option text..."
                      }
                    />
                    <button
                      onClick={() =>
                        handleDeleteSimpleList(q.id, "options", opt.id)
                      }
                      className={styles.removeOptionBtn}
                    >
                      &times;
                    </button>
                  </div>

                  {q.type === "nested_mcq" && (
                    <div
                      style={{
                        marginLeft: "28px",
                        marginTop: "8px",
                        paddingLeft: "12px",
                        borderLeft: "2px solid #e2e8f0",
                      }}
                    >
                      {(opt.subOptions || []).map((sub) => (
                        <div
                          key={sub.id}
                          className={styles.optionItem}
                          style={{ marginBottom: "6px" }}
                        >
                          <CheckSquare size={14} color="#64748b" />
                          <input
                            type="text"
                            value={sub.value}
                            onChange={(e) =>
                              handleUpdateSubOption(
                                q.id,
                                opt.id,
                                sub.id,
                                e.target.value,
                              )
                            }
                            className={styles.optionInput}
                            style={{ fontSize: "0.85rem" }}
                            placeholder="Sub-option (e.g., Tremors)"
                          />
                          <button
                            onClick={() =>
                              handleDeleteSubOption(q.id, opt.id, sub.id)
                            }
                            className={styles.removeOptionBtn}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddSubOption(q.id, opt.id)}
                        className={styles.addBtnText}
                        style={{ fontSize: "0.75rem", padding: 0 }}
                      >
                        <Plus size={12} /> Add Checkbox Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddSimpleList(q.id, "options")}
                className={styles.addBtnText}
              >
                <Plus size={14} />{" "}
                {q.type === "nested_mcq" ? "Add Parent Category" : "Add Option"}
              </button>
            </div>
          )}

          {(q.type === "dropdown" || q.type === "radio") &&
            q.options.length > 0 && (
              <div className={styles.configBlock} style={{ marginTop: "12px" }}>
                <label
                  className={styles.toggleLabel}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Default Selection (optional)
                </label>
                <select
                  value={q.defaultValue || ""}
                  onChange={(e) =>
                    handleUpdateQuestion(
                      q.id,
                      "defaultValue",
                      e.target.value || null,
                    )
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: "0.85rem",
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  <option value="">-- No default --</option>
                  {q.options.map((opt) => (
                    <option key={opt.id} value={opt.value}>
                      {opt.value || "(untitled option)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {q.type === "checkbox" && q.options.length > 0 && (
            <div className={styles.configBlock} style={{ marginTop: "12px" }}>
              <label
                className={styles.toggleLabel}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Default Selections (optional — pre-checked, editable at fill
                time)
              </label>
              {q.options.map((opt) => {
                const defaults: string[] = Array.isArray(q.defaultValue)
                  ? q.defaultValue
                  : [];
                const checked = defaults.includes(opt.value);
                return (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                      fontSize: "0.85rem",
                      color: "#0f172a",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...defaults, opt.value]
                          : defaults.filter((v) => v !== opt.value);
                        handleUpdateQuestion(q.id, "defaultValue", next);
                      }}
                    />
                    {opt.value || "(untitled option)"}
                  </label>
                );
              })}
            </div>
          )}

          {q.type === "nested_mcq" && q.options.length > 0 && (
            <div className={styles.configBlock} style={{ marginTop: "12px" }}>
              <label
                className={styles.toggleLabel}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Default Selection (optional — editable at fill time)
              </label>
              {q.options.map((opt) => {
                const dv =
                  q.defaultValue && typeof q.defaultValue === "object"
                    ? q.defaultValue
                    : null;
                const isSelected = dv?.selectedParent === opt.value;
                return (
                  <div key={opt.id} style={{ marginBottom: "10px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.85rem",
                        color: "#0f172a",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      <input
                        type="radio"
                        name={`default_${q.id}`}
                        checked={isSelected}
                        onChange={() =>
                          handleUpdateQuestion(q.id, "defaultValue", {
                            selectedParent: opt.value,
                            subSelections: [],
                          })
                        }
                      />
                      {opt.value || "(untitled category)"}
                    </label>
                    {isSelected && (opt.subOptions || []).length > 0 && (
                      <div
                        style={{
                          marginLeft: "24px",
                          marginTop: "6px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        {(opt.subOptions || []).map((sub) => {
                          const currentSubs = dv?.subSelections || [];
                          const subChecked = currentSubs.includes(sub.value);
                          return (
                            <label
                              key={sub.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.8rem",
                                color: "#334155",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={subChecked}
                                onChange={(e) => {
                                  const nextSubs = e.target.checked
                                    ? [...currentSubs, sub.value]
                                    : currentSubs.filter(
                                        (v: string) => v !== sub.value,
                                      );
                                  handleUpdateQuestion(q.id, "defaultValue", {
                                    selectedParent: opt.value,
                                    subSelections: nextSubs,
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
              {q.defaultValue && (
                <button
                  onClick={() =>
                    handleUpdateQuestion(q.id, "defaultValue", null)
                  }
                  className={styles.addBtnText}
                  style={{ fontSize: "0.75rem", padding: 0, marginTop: "4px" }}
                >
                  Clear default
                </button>
              )}
            </div>
          )}

          {q.type === "table" && (
            <div className={styles.tableLayout}>
              <div className={styles.configSection}>
                <div
                  style={{
                    marginBottom: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <label
                    className={styles.toggleLabel}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={q.hasRowLabels !== false}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          q.id,
                          "hasRowLabels",
                          e.target.checked,
                        )
                      }
                      className={styles.toggleInput}
                    />
                    Show Row Labels (Uncheck to create a pure input grid)
                  </label>

                  <label
                    className={styles.toggleLabel}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={q.showTotalScore || false}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          q.id,
                          "showTotalScore",
                          e.target.checked,
                        )
                      }
                      className={styles.toggleInput}
                    />
                    Enable Total Score Row (Auto-calculates the final column)
                  </label>

                  <label
                    className={styles.toggleLabel}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={q.printSideBySide || false}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          q.id,
                          "printSideBySide",
                          e.target.checked,
                        )
                      }
                      className={styles.toggleInput}
                    />
                    Print Side by Side (Render table blocks next to each other
                    in PDF)
                  </label>

                  <label
                    className={styles.toggleLabel}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={q.hideEmptyDashes || false}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          q.id,
                          "hideEmptyDashes",
                          e.target.checked,
                        )
                      }
                      className={styles.toggleInput}
                    />
                    Hide Empty Dashes on Print (Leave blank instead of printing
                    "—")
                  </label>

                  <label
                    className={styles.toggleLabel}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={q.largeTablePrint || false}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          q.id,
                          "largeTablePrint",
                          e.target.checked,
                        )
                      }
                      className={styles.toggleInput}
                    />
                    Larger Field Prints (Increase font size and spacing in
                    print)
                  </label>
                </div>

                <div className={styles.configBlock}>
                  <h4>
                    <span>Define Columns (Headers)</span>
                    <button
                      onClick={() => handleAddColumn(q.id)}
                      className={styles.addBtnText}
                      style={{ margin: 0, padding: 0 }}
                    >
                      Add Column
                    </button>
                  </h4>
                  {q.columns.map((col, idx) => (
                    <div key={col.id} className={styles.configItem}>
                      <GripVertical size={14} className={styles.dragHandle} />
                      <input
                        type="text"
                        value={col.value}
                        onChange={(e) =>
                          handleUpdateColumn(
                            q.id,
                            col.id,
                            "value",
                            e.target.value,
                          )
                        }
                        className={styles.optionInput}
                        placeholder="Column Name"
                      />

                      {idx === 0 && q.hasRowLabels !== false ? (
                        <span
                          className={styles.typeBadge}
                          style={{ background: "#e2e8f0", color: "#475569" }}
                        >
                          Label
                        </span>
                      ) : (
                        <select
                          value={col.colType || "text"}
                          onChange={(e) =>
                            handleUpdateColumn(
                              q.id,
                              col.id,
                              "colType",
                              e.target.value,
                            )
                          }
                          style={{
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            outline: "none",
                            color: "#0f172a",
                            fontSize: "0.75rem",
                            padding: "4px",
                            borderRadius: "4px",
                          }}
                        >
                          <option value="text">Text Input</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="reference_range">
                            Reference Range
                          </option>
                        </select>
                      )}

                      {q.columns.length > 1 && (
                        <button
                          onClick={() =>
                            handleDeleteSimpleList(q.id, "columns", col.id)
                          }
                          className={styles.removeOptionBtn}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.configBlock}>
                  <h4>
                    <span>Define Rows</span>
                    <button
                      onClick={() => handleAddTableRow(q.id)}
                      className={styles.addBtnText}
                      style={{ margin: 0, padding: 0 }}
                    >
                      Add Row
                    </button>
                  </h4>

                  {q.rows.map((row, rowIdx) => (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginBottom: "16px",
                        background: "#f8fafc",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        className={styles.configItem}
                        style={{
                          border: "none",
                          background: "transparent",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            marginRight: "4px",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleMoveTableRow(q.id, rowIdx, "up")
                            }
                            disabled={rowIdx === 0}
                            className={styles.actionBtn}
                            style={{
                              width: "20px",
                              height: "20px",
                              padding: 0,
                              minHeight: "20px",
                            }}
                            title="Move Row Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() =>
                              handleMoveTableRow(q.id, rowIdx, "down")
                            }
                            disabled={rowIdx === q.rows.length - 1}
                            className={styles.actionBtn}
                            style={{
                              width: "20px",
                              height: "20px",
                              padding: 0,
                              minHeight: "20px",
                            }}
                            title="Move Row Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={row.srNo || ""}
                          onChange={(e) =>
                            handleUpdateTableRow(
                              q.id,
                              row.id,
                              "srNo",
                              e.target.value,
                            )
                          }
                          className={styles.optionInput}
                          placeholder="Sr."
                          style={{
                            maxWidth: "40px",
                            textAlign: "center",
                            borderRight: "1px solid #e2e8f0",
                            borderRadius: 0,
                            background: "#fff",
                          }}
                        />

                        {q.hasRowLabels !== false && (
                          <>
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) =>
                                handleUpdateTableRow(
                                  q.id,
                                  row.id,
                                  "label",
                                  e.target.value,
                                )
                              }
                              className={styles.optionInput}
                              placeholder="Row Label"
                              style={{
                                background: "#fff",
                                padding: "4px 8px",
                                borderRadius: "4px",
                              }}
                            />
                            <label className={styles.toggleLabel}>
                              Indent
                              <input
                                type="checkbox"
                                checked={row.isSubRow}
                                onChange={(e) =>
                                  handleUpdateTableRow(
                                    q.id,
                                    row.id,
                                    "isSubRow",
                                    e.target.checked,
                                  )
                                }
                                className={styles.toggleInput}
                              />
                            </label>
                            <label
                              className={styles.toggleLabel}
                              title="Let the person taking the assessment type into this row's first column"
                            >
                              Fillable
                              <input
                                type="checkbox"
                                checked={row.labelEditable || false}
                                onChange={(e) =>
                                  handleUpdateTableRow(
                                    q.id,
                                    row.id,
                                    "labelEditable",
                                    e.target.checked,
                                  )
                                }
                                className={styles.toggleInput}
                              />
                            </label>
                          </>
                        )}

                        <select
                          value={row.cellType}
                          onChange={(e) =>
                            handleUpdateTableRow(
                              q.id,
                              row.id,
                              "cellType",
                              e.target.value,
                            )
                          }
                          style={{
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            outline: "none",
                            color: "#0f172a",
                            fontSize: "0.75rem",
                            padding: "4px",
                            borderRadius: "4px",
                            marginLeft: q.hasRowLabels === false ? "auto" : "0",
                          }}
                        >
                          <option value="per_column">
                            Mixed (Per Column Types)
                          </option>
                          <option value="text">All Text Inputs</option>
                          <option value="checkbox">All Checkboxes</option>
                          <option value="rubric">Rubric / Score</option>
                        </select>

                        <button
                          onClick={() => handleAddTableRow(q.id, rowIdx)}
                          className={styles.actionBtn}
                          style={{
                            marginLeft: "auto",
                            width: "28px",
                            height: "28px",
                            color: "#0b7b8a",
                          }}
                          title="Insert Row Below"
                        >
                          <Plus size={14} />
                        </button>

                        {q.rows.length > 1 && (
                          <button
                            onClick={() => handleDeleteTableRow(q.id, row.id)}
                            className={styles.removeOptionBtn}
                            style={{ marginLeft: "4px" }}
                            title="Delete Row"
                          >
                            &times;
                          </button>
                        )}
                      </div>

                      {row.cellType === "text" && (
                        <div style={{ paddingLeft: "28px" }}>
                          <input
                            type="text"
                            placeholder="Unit (e.g., g/dl, kg) - Optional"
                            value={row.unit || ""}
                            onChange={(e) =>
                              handleUpdateTableRow(
                                q.id,
                                row.id,
                                "unit",
                                e.target.value,
                              )
                            }
                            className={styles.optionInput}
                            style={{
                              background: "#fff",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              maxWidth: "200px",
                              fontSize: "0.75rem",
                            }}
                          />
                        </div>
                      )}

                      {q.columns.some(
                        (c) => c.colType === "reference_range",
                      ) && (
                        <div
                          style={{
                            paddingLeft: "28px",
                            marginTop: "8px",
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {q.columns
                            .filter((c) => c.colType === "reference_range")
                            .map((col) => (
                              <input
                                key={col.id}
                                type="text"
                                placeholder={`Reference for: ${col.value}`}
                                value={row.referenceValues?.[col.id] || ""}
                                onChange={(e) => {
                                  const updatedRefs = {
                                    ...(row.referenceValues || {}),
                                  };
                                  updatedRefs[col.id] = e.target.value;
                                  handleUpdateTableRow(
                                    q.id,
                                    row.id,
                                    "referenceValues",
                                    updatedRefs,
                                  );
                                }}
                                className={styles.optionInput}
                                style={{
                                  background: "#fff",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  maxWidth: "200px",
                                  fontSize: "0.75rem",
                                }}
                              />
                            ))}
                        </div>
                      )}

                      {row.cellType === "rubric" && (
                        <div className={styles.rubricConfigArea}>
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "#64748b",
                              margin: "0 0 4px 0",
                            }}
                          >
                            Enter static descriptive text for each column. The
                            final column will automatically be an input field
                            (e.g., for Score).
                          </p>
                          {q.columns
                            .slice(q.hasRowLabels !== false ? 1 : 0)
                            .map((col, idx, array) => {
                              const isLast = idx === array.length - 1;
                              if (isLast)
                                return (
                                  <span
                                    key={col.id}
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#0b7b8a",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Column: "{col.value}" will be an Input Field
                                  </span>
                                );

                              return (
                                <input
                                  key={col.id}
                                  type="text"
                                  placeholder={`Text for column: ${col.value || "Col " + (idx + 1)}`}
                                  value={row.cellDescriptions?.[idx] || ""}
                                  onChange={(e) =>
                                    handleUpdateRubricDescription(
                                      q.id,
                                      row.id,
                                      idx,
                                      e.target.value,
                                    )
                                  }
                                  className={styles.optionInput}
                                  style={{
                                    background: "#fff",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    marginBottom: "4px",
                                    width: "100%",
                                    fontSize: "0.75rem",
                                  }}
                                />
                              );
                            })}
                        </div>
                      )}

                      {(row.cellType === "text" ||
                        row.cellType === "checkbox" ||
                        row.cellType === "per_column" ||
                        row.cellType === "rubric") && (
                        <div style={{ paddingLeft: "28px", marginTop: "8px" }}>
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "#64748b",
                              margin: "0 0 4px 0",
                            }}
                          >
                            Optional defaults — pre-fill this row's cells; still
                            editable when the assessment is taken.
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            {q.columns
                              .slice(q.hasRowLabels !== false ? 1 : 0)
                              .filter(
                                (col) => col.colType !== "reference_range",
                              )
                              .map((col, idx, arr) => {
                                const isLastCol = idx === arr.length - 1;
                                // Rubric rows only have a real input on the
                                // final column — earlier ones are static text.
                                if (row.cellType === "rubric" && !isLastCol)
                                  return null;

                                const isCheckboxCell =
                                  row.cellType === "checkbox" ||
                                  (row.cellType === "per_column" &&
                                    col.colType === "checkbox");

                                const currentDefaults = row.defaultValues || {};

                                if (isCheckboxCell) {
                                  return (
                                    <label
                                      key={col.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.75rem",
                                        color: "#334155",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={!!currentDefaults[col.id]}
                                        onChange={(e) => {
                                          const updated = {
                                            ...currentDefaults,
                                            [col.id]: e.target.checked,
                                          };
                                          handleUpdateTableRow(
                                            q.id,
                                            row.id,
                                            "defaultValues",
                                            updated,
                                          );
                                        }}
                                      />
                                      {col.value || `Col ${idx + 1}`}
                                    </label>
                                  );
                                }

                                return (
                                  <input
                                    key={col.id}
                                    type="text"
                                    placeholder={`Default for: ${col.value || "Column"}`}
                                    value={
                                      (currentDefaults[col.id] as string) || ""
                                    }
                                    onChange={(e) => {
                                      const updated = {
                                        ...currentDefaults,
                                        [col.id]: e.target.value,
                                      };
                                      handleUpdateTableRow(
                                        q.id,
                                        row.id,
                                        "defaultValues",
                                        updated,
                                      );
                                    }}
                                    className={styles.optionInput}
                                    style={{
                                      background: "#fff",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      maxWidth: "160px",
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.previewSection}>
                <div className={styles.previewHeader}>
                  <Eye size={14} /> Live Form Preview
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        {q.hasRowLabels !== false && (
                          <th>{q.columns[0]?.value || "Details"}</th>
                        )}
                        {q.columns
                          .slice(q.hasRowLabels !== false ? 1 : 0)
                          .map((col, idx) => (
                            <th key={col.id}>
                              {col.value || `Col ${idx + 1}`}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.rows.map((row) => (
                        <tr
                          key={row.id}
                          className={row.isSubRow ? styles.subRow : ""}
                        >
                          {q.hasRowLabels !== false && (
                            <td>
                              <span
                                style={{
                                  marginRight: "10px",
                                  color: "#64748b",
                                }}
                              >
                                {row.srNo}
                              </span>
                              {row.labelEditable ? (
                                <span
                                  style={{
                                    fontStyle: "italic",
                                    color: "#94a3b8",
                                  }}
                                >
                                  {row.label || "(fillable during assessment)"}
                                </span>
                              ) : (
                                <strong>
                                  {row.label || (row.srNo ? "" : "...")}
                                </strong>
                              )}
                            </td>
                          )}
                          {q.columns
                            .slice(q.hasRowLabels !== false ? 1 : 0)
                            .map((col, idx, array) => {
                              const isLastColumn = idx === array.length - 1;

                              return (
                                <td key={col.id}>
                                  {col.colType === "reference_range" ? (
                                    <span
                                      style={{
                                        fontSize: "0.85rem",
                                        color: "#475569",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {row.referenceValues?.[col.id] || "-"}
                                    </span>
                                  ) : row.cellType === "per_column" ? (
                                    col.colType === "checkbox" ? (
                                      <input type="checkbox" disabled />
                                    ) : (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                        }}
                                      >
                                        <input
                                          type="text"
                                          className={styles.previewInput}
                                          disabled
                                          placeholder=""
                                          style={{ width: "100%" }}
                                        />
                                      </div>
                                    )
                                  ) : row.cellType === "rubric" ? (
                                    isLastColumn ? (
                                      <input
                                        type="text"
                                        className={styles.previewInput}
                                        disabled
                                        placeholder=""
                                      />
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#475569",
                                        }}
                                      >
                                        {row.cellDescriptions?.[idx] || "..."}
                                      </span>
                                    )
                                  ) : row.cellType === "text" ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <input
                                        type="text"
                                        className={styles.previewInput}
                                        disabled
                                        placeholder=""
                                        style={{ width: "100%" }}
                                      />
                                      {row.unit && (
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#64748b",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {row.unit}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <input type="checkbox" disabled />
                                  )}
                                </td>
                              );
                            })}
                        </tr>
                      ))}

                      {q.showTotalScore && (
                        <tr style={{ background: "#f8fafc" }}>
                          <td
                            colSpan={Math.max(1, q.columns.length - 1)}
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            Total Score
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.previewInput}
                              disabled
                              placeholder="Auto-sum"
                              style={{
                                fontWeight: "bold",
                                color: "#0b7b8a",
                                width: "100%",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className={styles.previewSubtext}>
                  Interactive clinical layout preview
                </p>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => handleAddQuestion()}
        className={styles.addFormElementBtn}
      >
        <Plus size={18} /> Add Form Element
      </button>

      <div className={styles.submitWrapper}>
        <button
          onClick={handleSaveForm}
          disabled={isSubmitting}
          className={styles.saveBtn}
        >
          {isSubmitting ? "Saving..." : "Save Assessment Template"}
        </button>
      </div>
    </div>
  );
};

export default FormBuilder;
