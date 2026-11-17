import React from "react";

interface PrintDataShape {
  organization?: {
    name?: string;
    logo?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
    };
    phone?: string;
    email?: string;
  };
  patient?: {
    name?: string;
    UHID?: string;
    age?: string | number;
    gender?: string;
    phone?: string;
    guardian_phone?: string;
    guardian_relation?: string;
    guardian_phone_2?: string;
    guardian_relation_2?: string;
  };
  assessment?: {
    assessment_name?: string;
    doctor?: string;
    date_taken?: string;
    status?: string;
    general_notes?: string;
    responses?: Array<any>;
  };
}

interface SingleAssessmentPrintTemplateProps {
  data: PrintDataShape | any;
}

/**
 * Print template for a single clinical assessment.
 * Design Philosophy: Quiet Clinical Elegance
 * - Structural thin rules replace heavy boxes
 * - Compact typographic scale to prevent multi-page overflow
 * - High-contrast monochromatic baseline with a single clinical accent
 */
const SingleAssessmentPrintTemplate = React.forwardRef<
  HTMLDivElement,
  SingleAssessmentPrintTemplateProps
>(({ data }, ref) => {
  if (!data) return null;

  const { patient, organization, assessment } = data;

  // Quiet Clinical Palette
  const PRIMARY_COLOR = "#007b8e";
  const TEXT_DARK = "#0f172a"; // Slate 900
  const TEXT_MUTED = "#64748b"; // Slate 500
  const BORDER_LIGHT = "#cbd5e1"; // Slate 300
  const BORDER_SUBTLE = "#f1f5f9"; // Slate 100
  const BORDER = "#000000";
  const FONT_FAMILY = "Cambria, serif";

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  const renderPrintAnswer = (res: any, isInline: boolean = false) => {
    const {
      type,
      answer,
      answer_raw,
      columns,
      blanks,
      has_row_labels,
      show_total_score,
    } = res;

    // Resolve table print customization flags
    const hideEmptyDashes = Boolean(
      res.hide_empty_dashes ?? res.hideEmptyDashes,
    );
    const isLargePrint = Boolean(res.large_table_print ?? res.largeTablePrint);
    const emptyPlaceholder = hideEmptyDashes ? "" : "—";

    // Dynamic typography & spacing tokens
    const tableFontSize = isLargePrint ? "13.5px" : "11.5px";
    const tableHeaderFontSize = isLargePrint ? "11px" : "9.5px";
    const tablePadding = isLargePrint ? "8px 10px" : "6px 8px";
    const tableLineHeight = isLargePrint ? "1.45" : "1.35";

    // 1a. Table Format (Array Version - Legacy Backup)
    if (type === "table" && Array.isArray(answer)) {
      if (answer.length === 0) {
        return (
          <span
            style={{ fontStyle: "italic", color: TEXT_MUTED, fontSize: "12px" }}
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

      // --- FILTERING LOGIC WITH PARENT/CHILD SUPPORT ---
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
          if (hasChildWithValue) {
            answeredRows.push(row);
          }
        }
      }

      if (answeredRows.length === 0) {
        return (
          <span
            style={{ fontStyle: "italic", color: TEXT_MUTED, fontSize: "12px" }}
          >
            No data recorded
          </span>
        );
      }

      const shouldShowRowLabels =
        has_row_labels &&
        answeredRows.some(
          (row: any) =>
            (row.__rowLabel !== undefined &&
              row.__rowLabel !== null &&
              String(row.__rowLabel).trim() !== "") ||
            (row.row_label !== undefined &&
              row.row_label !== null &&
              String(row.row_label).trim() !== "") ||
            (row.label !== undefined &&
              row.label !== null &&
              String(row.label).trim() !== "") ||
            (row.sr_no !== undefined &&
              row.sr_no !== null &&
              String(row.sr_no).trim() !== "") ||
            (row.srNo !== undefined &&
              row.srNo !== null &&
              String(row.srNo).trim() !== ""),
        );

      const hasTotalScore =
        show_total_score && answer_raw?.savedTotalScore !== undefined;

      return (
        <div
          style={{ marginTop: isInline ? "0px" : "8px", marginBottom: "12px" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: tableFontSize,
              lineHeight: tableLineHeight,
              border: `1px solid ${BORDER_LIGHT}`,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#fafafa" }}>
                {shouldShowRowLabels && (
                  <th
                    style={{
                      borderBottom: `1.5px solid ${TEXT_DARK}`,
                      borderRight: `1px solid ${BORDER_LIGHT}`,
                      color: TEXT_MUTED,
                      padding: tablePadding,
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: tableHeaderFontSize,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {rowHeaderLabel}
                  </th>
                )}
                {dataColumns.map((col: any, colIdx: number, arr: any[]) => {
                  const isLastCol = colIdx === arr.length - 1;
                  return (
                    <th
                      key={col.id || colIdx}
                      style={{
                        borderBottom: `1.5px solid ${TEXT_DARK}`,
                        borderRight: isLastCol
                          ? "none"
                          : `1px solid ${BORDER_LIGHT}`,
                        color: TEXT_MUTED,
                        padding: tablePadding,
                        textAlign: "left",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: tableHeaderFontSize,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {col.label || col.value || "Value"}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {answeredRows.map((row: any, idx: number, arr: any[]) => {
                const srNo = row.sr_no || row.srNo;
                const isLastRow = idx === arr.length - 1 && !hasTotalScore;

                // Prioritize editable label first, then standard labels
                const displayRowLabel =
                  row.__rowLabel ?? row.row_label ?? row.label;

                return (
                  <tr
                    key={row.row_id || idx}
                    style={{ pageBreakInside: "avoid" }}
                  >
                    {shouldShowRowLabels && (
                      <td
                        style={{
                          padding: tablePadding,
                          fontWeight: 600,
                          color: TEXT_DARK,
                          paddingLeft: row.is_sub_row
                            ? "20px"
                            : isLargePrint
                              ? "10px"
                              : "8px",
                          borderBottom: isLastRow
                            ? "none"
                            : `1px solid ${BORDER_LIGHT}`,
                          borderRight: `1px solid ${BORDER_LIGHT}`,
                          backgroundColor: row.is_sub_row
                            ? "#ffffff"
                            : "#fdfdfd",
                        }}
                      >
                        {srNo ? (
                          <span
                            style={{
                              color: TEXT_MUTED,
                              marginRight: "4px",
                              fontFamily: "monospace",
                            }}
                          >
                            {srNo}.
                          </span>
                        ) : null}
                        {displayRowLabel}
                      </td>
                    )}

                    {dataColumns.map(
                      (col: any, colIdx: number, colArr: any[]) => {
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

                        let displayVal = cell.value;
                        const isCheckbox =
                          cell.col_type === "checkbox" ||
                          row.cell_type === "checkbox";
                        const isLastCol = colIdx === colArr.length - 1;
                        const hasReferenceValue =
                          cell.reference_value !== undefined &&
                          cell.reference_value !== null &&
                          cell.reference_value !== "";

                        const isReferenceRange =
                          cell.col_type === "reference_range" ||
                          col.col_type === "reference_range" ||
                          col.colType === "reference_range" ||
                          hasReferenceValue;

                        if (isReferenceRange) {
                          displayVal = cell.reference_value || emptyPlaceholder;
                        } else if (
                          isCheckbox ||
                          typeof displayVal === "boolean"
                        ) {
                          displayVal = displayVal ? "Yes" : "No";
                        } else if (
                          displayVal === undefined ||
                          displayVal === null ||
                          displayVal === ""
                        ) {
                          displayVal = emptyPlaceholder;
                        } else if (row.unit) {
                          displayVal = `${displayVal} ${row.unit}`;
                        }

                        const cellIsChecked = displayVal === "Yes";

                        return (
                          <td
                            key={col.id || colIdx}
                            style={{
                              padding: tablePadding,
                              textAlign: "left",
                              color: TEXT_DARK,
                              borderBottom: isLastRow
                                ? "none"
                                : `1px solid ${BORDER_LIGHT}`,
                              borderRight: isLastCol
                                ? "none"
                                : `1px solid ${BORDER_LIGHT}`,
                            }}
                          >
                            {isReferenceRange ? (
                              displayVal
                            ) : isCheckbox ? (
                              <span
                                aria-label={
                                  cellIsChecked ? "Checked" : "Unchecked"
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "16px",
                                  height: "16px",
                                  margin: "0 auto",
                                }}
                              >
                                {cellIsChecked ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={PRIMARY_COLOR}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ width: "14px", height: "14px" }}
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={BORDER_LIGHT}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ width: "12px", height: "12px" }}
                                  >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                )}
                              </span>
                            ) : (
                              displayVal
                            )}
                          </td>
                        );
                      },
                    )}
                  </tr>
                );
              })}

              {hasTotalScore && (
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <td
                    colSpan={Math.max(
                      1,
                      dataColumns.length + (shouldShowRowLabels ? 0 : -1),
                    )}
                    style={{
                      padding: isLargePrint ? "10px" : "8px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontSize: isLargePrint ? "11px" : "10px",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                      borderRight: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    Total Score
                  </td>
                  <td
                    style={{
                      padding: isLargePrint ? "10px" : "8px",
                      textAlign: "center",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    <strong
                      style={{
                        color: PRIMARY_COLOR,
                        fontSize: isLargePrint ? "15px" : "13px",
                        fontFamily: "monospace",
                      }}
                    >
                      {answer_raw.savedTotalScore}
                    </strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // 1b. Table Format (Object Version - New Advanced Tables)
    if (
      type === "table" &&
      answer !== null &&
      typeof answer === "object" &&
      !Array.isArray(answer)
    ) {
      let tableRows = res.rows || [];
      let tableColumns = res.columns || columns || [];

      // Fallback: Infer rows from answer keys if schema missing
      if (tableRows.length === 0) {
        const rowKeys = Object.keys(answer).filter(
          (k) => k !== "savedTotalScore",
        );
        tableRows = rowKeys.map((k) => ({
          id: k,
          label: answer[k].__rowLabel || k,
        }));
      }

      // Fallback: Infer columns from first row answer if schema missing
      const tableHasRowLabels =
        res.hasRowLabels !== false && has_row_labels !== false;
      if (tableColumns.length === 0) {
        const firstRowKey = tableRows[0]?.id;
        if (firstRowKey && answer[firstRowKey]) {
          const colKeys = Object.keys(answer[firstRowKey]).filter(
            (k) => k !== "__rowLabel",
          );
          tableColumns = tableHasRowLabels
            ? [
                { id: "label_col", value: "Item" },
                ...colKeys.map((k) => ({ id: k, value: k })),
              ]
            : colKeys.map((k) => ({ id: k, value: k }));
        }
      }

      const dataColumns =
        tableHasRowLabels && tableColumns.length > 0
          ? tableColumns.slice(1)
          : tableColumns;
      const rowHeaderLabel =
        tableHasRowLabels && tableColumns.length > 0
          ? tableColumns[0]?.label || tableColumns[0]?.value || "Item"
          : "";

      const answeredRows = tableRows.filter((row: any) => {
        const rowAns = answer[row.id];
        if (!rowAns) return false;

        return dataColumns.some((col: any) => {
          const val = rowAns[col.id];
          if (typeof val === "boolean") return true;
          return val !== undefined && val !== null && val !== "";
        });
      });

      if (answeredRows.length === 0) {
        return (
          <span
            style={{ fontStyle: "italic", color: TEXT_MUTED, fontSize: "12px" }}
          >
            No data recorded
          </span>
        );
      }

      const hasTotalScore =
        show_total_score && answer.savedTotalScore !== undefined;

      return (
        <div
          style={{ marginTop: isInline ? "0px" : "8px", marginBottom: "12px" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: tableFontSize,
              lineHeight: tableLineHeight,
              border: `1px solid ${BORDER_LIGHT}`,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#fafafa" }}>
                {tableHasRowLabels && (
                  <th
                    style={{
                      borderBottom: `1.5px solid ${TEXT_DARK}`,
                      borderRight: `1px solid ${BORDER_LIGHT}`,
                      color: TEXT_MUTED,
                      padding: tablePadding,
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: tableHeaderFontSize,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {rowHeaderLabel}
                  </th>
                )}
                {dataColumns.map((col: any, colIdx: number, arr: any[]) => (
                  <th
                    key={col.id || colIdx}
                    style={{
                      borderBottom: `1.5px solid ${TEXT_DARK}`,
                      borderRight:
                        colIdx === arr.length - 1
                          ? "none"
                          : `1px solid ${BORDER_LIGHT}`,
                      color: TEXT_MUTED,
                      padding: tablePadding,
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: tableHeaderFontSize,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {col.label || col.value || `Column ${colIdx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {answeredRows.map((row: any, idx: number, arr: any[]) => {
                const rowAns = answer[row.id] || {};
                const isLastRow = idx === arr.length - 1 && !hasTotalScore;
                const srNo = row.sr_no || row.srNo;

                // Prioritize editable label first, then fallback to standard schema labels
                const rowLabel =
                  rowAns.__rowLabel ??
                  rowAns.row_label ??
                  row.label ??
                  row.row_label ??
                  row.id;

                return (
                  <tr key={row.id || idx} style={{ pageBreakInside: "avoid" }}>
                    {tableHasRowLabels && (
                      <td
                        style={{
                          padding: tablePadding,
                          fontWeight: 600,
                          color: TEXT_DARK,
                          paddingLeft:
                            row.isSubRow || row.is_sub_row
                              ? "20px"
                              : isLargePrint
                                ? "10px"
                                : "8px",
                          borderBottom: isLastRow
                            ? "none"
                            : `1px solid ${BORDER_LIGHT}`,
                          borderRight: `1px solid ${BORDER_LIGHT}`,
                          backgroundColor:
                            row.isSubRow || row.is_sub_row
                              ? "#ffffff"
                              : "#fdfdfd",
                        }}
                      >
                        {srNo ? (
                          <span
                            style={{
                              color: TEXT_MUTED,
                              marginRight: "4px",
                              fontFamily: "monospace",
                            }}
                          >
                            {srNo}.
                          </span>
                        ) : null}
                        {rowLabel}
                      </td>
                    )}
                    {dataColumns.map(
                      (col: any, colIdx: number, colArr: any[]) => {
                        let displayVal = rowAns[col.id];
                        const isCheckbox =
                          (row.cellType === "per_column" &&
                            col.colType === "checkbox") ||
                          row.cellType === "checkbox" ||
                          col.colType === "checkbox" ||
                          typeof displayVal === "boolean";
                        const isLastCol = colIdx === colArr.length - 1;
                        const referenceValue = row.referenceValues?.[col.id];
                        const hasReferenceValue =
                          referenceValue !== undefined &&
                          referenceValue !== null &&
                          referenceValue !== "";

                        const isReferenceRange =
                          col.colType === "reference_range" ||
                          col.col_type === "reference_range" ||
                          hasReferenceValue;

                        if (isReferenceRange) {
                          displayVal = referenceValue || emptyPlaceholder;
                        } else if (
                          isCheckbox ||
                          typeof displayVal === "boolean"
                        ) {
                          displayVal = displayVal ? "Yes" : "No";
                        } else if (
                          displayVal === undefined ||
                          displayVal === null ||
                          displayVal === ""
                        ) {
                          displayVal = emptyPlaceholder;
                        } else if (row.unit) {
                          displayVal = `${displayVal} ${row.unit}`;
                        }

                        const cellIsChecked = displayVal === "Yes";

                        return (
                          <td
                            key={col.id || colIdx}
                            style={{
                              padding: tablePadding,
                              textAlign: "left",
                              color: TEXT_DARK,
                              borderBottom: isLastRow
                                ? "none"
                                : `1px solid ${BORDER_LIGHT}`,
                              borderRight: isLastCol
                                ? "none"
                                : `1px solid ${BORDER_LIGHT}`,
                            }}
                          >
                            {isReferenceRange ? (
                              displayVal
                            ) : isCheckbox ? (
                              <span
                                aria-label={
                                  cellIsChecked ? "Checked" : "Unchecked"
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "16px",
                                  height: "16px",
                                  margin: "0 auto",
                                }}
                              >
                                {cellIsChecked ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={PRIMARY_COLOR}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ width: "14px", height: "14px" }}
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={BORDER_LIGHT}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ width: "12px", height: "12px" }}
                                  >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                )}
                              </span>
                            ) : (
                              displayVal
                            )}
                          </td>
                        );
                      },
                    )}
                  </tr>
                );
              })}
              {hasTotalScore && (
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <td
                    colSpan={Math.max(
                      1,
                      dataColumns.length + (tableHasRowLabels ? 0 : -1),
                    )}
                    style={{
                      padding: isLargePrint ? "10px" : "8px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontSize: isLargePrint ? "11px" : "10px",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                      borderRight: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    Total Score
                  </td>
                  <td
                    style={{
                      padding: isLargePrint ? "10px" : "8px",
                      textAlign: "center",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    <strong
                      style={{
                        color: PRIMARY_COLOR,
                        fontSize: isLargePrint ? "15px" : "13px",
                        fontFamily: "monospace",
                      }}
                    >
                      {answer.savedTotalScore}
                    </strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // 2. Inline Blanks Format
    if (type === "inline_blanks" && Array.isArray(blanks)) {
      if (blanks.length === 0) {
        return (
          <span
            style={{ fontStyle: "italic", color: TEXT_MUTED, fontSize: "12px" }}
          >
            No inputs recorded
          </span>
        );
      }

      return (
        <div
          style={{
            marginTop: isInline ? "0px" : "4px",
            lineHeight: "1.8",
            fontSize: "12.5px",
            color: TEXT_DARK,
          }}
        >
          {blanks.map((b: any) => {
            const parts = (b.blank_label || "").split("[blank]");
            return (
              <div
                key={b.blank_id}
                style={{
                  marginBottom: "6px",
                  pageBreakInside: "avoid",
                  overflowWrap: "break-word",
                }}
              >
                {parts.map((part: string, index: number, array: any[]) => {
                  const isLast = index === array.length - 1;
                  const valKey = `${b.blank_id}_${index}`;
                  const val = answer?.[valKey];
                  const isLongVal =
                    typeof val === "string" && val.trim().length > 40;

                  return (
                    <React.Fragment key={index}>
                      <span>{part}</span>
                      {!isLast &&
                        (isLongVal ? (
                          <span
                            style={{
                              display: "inline",
                              margin: "0 4px",
                              color: PRIMARY_COLOR,
                              fontWeight: 600,
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            {val || " "}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              minWidth: "48px",
                              maxWidth: "100%",
                              textAlign: "center",
                              padding: "0 6px",
                              margin: "0 4px",
                              color: PRIMARY_COLOR,
                              fontWeight: 700,
                              borderBottom: `1px solid ${TEXT_MUTED}`,
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              whiteSpace: "normal",
                              verticalAlign: "bottom",
                            }}
                          >
                            {val || " "}
                          </span>
                        ))}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    // 3. Nested MCQ Format
    if (
      type === "nested_mcq" &&
      answer !== null &&
      typeof answer === "object"
    ) {
      const { selectedParent, subSelections } = answer;
      if (!selectedParent) return <span style={{ color: TEXT_MUTED }}>—</span>;

      return (
        <div
          style={{
            marginTop: isInline ? "0px" : "2px",
            fontSize: "12.5px",
            color: TEXT_DARK,
            pageBreakInside: "avoid",
          }}
        >
          <div style={{ fontWeight: 600 }}>{selectedParent}</div>
          {Array.isArray(subSelections) && subSelections.length > 0 && (
            <ul
              style={{
                margin: "4px 0 0 0",
                paddingLeft: "20px",
                color: TEXT_DARK,
                lineHeight: "1.5",
              }}
            >
              {subSelections.map((sub: string, i: number) => (
                <li key={i} style={{ marginBottom: "2px" }}>
                  {sub}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (answer === null || answer === undefined || answer === "") {
      return <span style={{ color: TEXT_MUTED }}>—</span>;
    }

    // 4. Arrays
    if (Array.isArray(answer)) {
      return (
        <div
          style={{
            marginTop: isInline ? "0px" : "2px",
            fontSize: "12.5px",
            color: isInline ? PRIMARY_COLOR : TEXT_DARK,
            fontWeight: isInline ? 600 : "normal",
            pageBreakInside: "avoid",
          }}
        >
          {answer.join(", ")}
        </div>
      );
    }

    // 5. Flat Objects
    if (typeof answer === "object") {
      return (
        <div
          style={{
            marginTop: isInline ? "0px" : "4px",
            fontSize: "12px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 16px",
            pageBreakInside: "avoid",
          }}
        >
          {Object.entries(answer).map(([key, val]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: `1px dotted ${BORDER_SUBTLE}`,
                paddingBottom: "2px",
              }}
            >
              <span style={{ color: TEXT_MUTED }}>{key}</span>
              <span style={{ color: TEXT_DARK, fontWeight: 500 }}>
                {typeof val === "object" && val !== null
                  ? JSON.stringify(val)
                  : String(val)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // 6. Booleans & Standard Text
    const isBool = typeof answer === "boolean";
    const displayStr = isBool ? (answer ? "Yes" : "No") : String(answer);

    return (
      <div
        style={{
          fontSize: "12.5px",
          color: isInline ? PRIMARY_COLOR : TEXT_DARK,
          fontWeight: isInline ? 600 : "normal",
          marginTop: isInline ? "0px" : "2px",
          lineHeight: "1.5",
          pageBreakInside: "avoid",
          overflowWrap: "break-word",
        }}
      >
        {displayStr}
      </div>
    );
  };

  const isSimpleInlineAnswer = (res: any) => {
    const { type, answer } = res;

    if (type === "table" || type === "inline_blanks" || type === "nested_mcq") {
      return false;
    }

    if (answer === null || answer === undefined || answer === "") return false;

    if (typeof answer === "object" && !Array.isArray(answer)) return false;

    return true;
  };

  // --- PRE-PROCESS RESPONSES TO GROUP SIDE-BY-SIDE TABLES ---
  const groupedResponses: Array<Array<{ res: any; idx: number }>> = [];
  let currentSideBySideGroup: Array<{ res: any; idx: number }> = [];

  (assessment?.responses || []).forEach((res: any, idx: number) => {
    if (res.type === "table" && res.print_side_by_side) {
      currentSideBySideGroup.push({ res, idx });

      if (currentSideBySideGroup.length === 2) {
        groupedResponses.push(currentSideBySideGroup);
        currentSideBySideGroup = [];
      }
    } else {
      if (currentSideBySideGroup.length > 0) {
        groupedResponses.push(currentSideBySideGroup);
        currentSideBySideGroup = [];
      }
      groupedResponses.push([{ res, idx }]);
    }
  });

  if (currentSideBySideGroup.length > 0) {
    groupedResponses.push(currentSideBySideGroup);
  }

  return (
    <div ref={ref}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Sura:wght@400;700&display=swap');

          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm 14mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white;
            }
            * {
              font-family: ${FONT_FAMILY} !important;
            }
            .marathi-text, .marathi-text * {
              font-family: 'Sura', serif !important;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
            }
          }
          .marathi-text {
            font-family: 'Sura', serif !important;
          }
        `}
      </style>

      <div
        style={{
          fontFamily: FONT_FAMILY,
          backgroundColor: "#ffffff",
          color: TEXT_DARK,
          fontSize: "12px",
          lineHeight: "1.4",
          width: "100%",
          maxWidth: "210mm",
          margin: "0 auto",
        }}
      >
        <div style={{ boxSizing: "border-box" }}>
          {/* HEADER */}
          <div
            style={{
              paddingBottom: "12px",
              marginBottom: "16px",
            }}
          >
            {/* LOGO + CLINIC NAME BANNER */}
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                border: `1px solid ${BORDER}`,
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "150px",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ffffff",
                }}
              >
                {organization?.logo ? (
                  <img
                    src={organization.logo}
                    alt="Logo"
                    style={{
                      width: "100%",
                      maxHeight: "115px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "100px",
                      width: "100px",
                      backgroundColor: "#000000",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                      fontSize: "42px",
                      fontWeight: 900,
                    }}
                  >
                    {(organization?.name || "C").charAt(0)}
                  </div>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  backgroundColor: PRIMARY_COLOR,
                  color: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {organization?.name || "Clinical Organization"}
                </div>
              </div>
            </div>

            {/* PATIENT DETAILS */}
            <div
              style={{
                backgroundColor: BORDER_SUBTLE,
                padding: "12px 16px",
                borderRadius: "6px",
                marginBottom: "16px",
                fontFamily: FONT_FAMILY,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1.5fr",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: "2px",
                    }}
                  >
                    Name
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: TEXT_DARK,
                      fontWeight: 700,
                    }}
                  >
                    {patient?.name || "N/A"}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: "2px",
                    }}
                  >
                    UHID
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: TEXT_DARK,
                      fontWeight: 500,
                    }}
                  >
                    {patient?.UHID || "N/A"}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: "2px",
                    }}
                  >
                    Age / Gender
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: TEXT_DARK,
                      fontWeight: 500,
                    }}
                  >
                    {patient?.age ? `${patient.age} Y` : "N/A"} /{" "}
                    {patient?.gender || "N/A"}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: "2px",
                    }}
                  >
                    Guardian Contact(s)
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: TEXT_DARK,
                      fontWeight: 500,
                      lineHeight: "1.4",
                    }}
                  >
                    {patient?.guardian_phone ? (
                      <div>
                        <span style={{ fontWeight: 700, color: TEXT_MUTED }}>
                          {patient.guardian_relation || "Guardian"}:
                        </span>{" "}
                        {patient.guardian_phone}
                      </div>
                    ) : null}

                    {patient?.guardian_phone_2 ? (
                      <div>
                        <span style={{ fontWeight: 700, color: TEXT_MUTED }}>
                          {patient.guardian_relation_2 || "Guardian 2"}:
                        </span>{" "}
                        {patient.guardian_phone_2}
                      </div>
                    ) : null}

                    {!patient?.guardian_phone && !patient?.guardian_phone_2 && (
                      <span style={{ fontSize: "15px" }}>N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ASSESSMENT TITLE + PRINT META */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `2px solid ${TEXT_DARK}`,
                paddingBottom: "10px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: TEXT_DARK,
                  textTransform: "uppercase",
                  letterSpacing: "-0.4px",
                }}
              >
                {assessment?.assessment_name || "Clinical Assessment"}
              </h1>
              <div
                style={{
                  textAlign: "right",
                  fontSize: "11px",
                  color: TEXT_MUTED,
                }}
              >
                <span style={{ fontFamily: "monospace", display: "block" }}>
                  Assessment DATE: {formatDate(assessment?.date_taken)}
                </span>
                {assessment?.doctor && (
                  <span style={{ fontWeight: 600, color: TEXT_DARK }}>
                    Attending: {assessment.doctor}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <main>
            {!assessment ? (
              <div
                style={{
                  textAlign: "center",
                  color: TEXT_MUTED,
                  padding: "30px",
                }}
              >
                No assessment data found.
              </div>
            ) : (
              <div>
                {assessment.general_notes && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "8px 12px",
                      backgroundColor: "#f8fafc",
                      borderLeft: `3px solid ${PRIMARY_COLOR}`,
                      pageBreakInside: "avoid",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: PRIMARY_COLOR,
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      Provider Notes
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: TEXT_DARK,
                        fontStyle: "italic",
                        lineHeight: "1.5",
                      }}
                    >
                      "{assessment.general_notes}"
                    </p>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {groupedResponses.length === 0 ? (
                    <div style={{ fontStyle: "italic", color: TEXT_MUTED }}>
                      No detailed responses recorded.
                    </div>
                  ) : (
                    groupedResponses.map((group, groupIdx) => {
                      const isSideBySide = group.length > 1;

                      return (
                        <div
                          key={`group-${groupIdx}`}
                          style={{
                            display: isSideBySide ? "grid" : "block",
                            gridTemplateColumns: isSideBySide
                              ? `repeat(${group.length}, 1fr)`
                              : "1fr",
                            gap: isSideBySide ? "16px" : "0",
                            pageBreakInside: "auto",
                          }}
                        >
                          {group.map(({ res, idx }) => {
                            if (res.type === "section_header") return null;

                            const questionLabel =
                              res.question || res.question_title;
                            const hasQuestionLabel =
                              questionLabel && questionLabel.trim().length > 0;
                            const inlineWithQuestion =
                              hasQuestionLabel && isSimpleInlineAnswer(res);

                            return (
                              <div
                                key={idx}
                                style={{
                                  pageBreakInside:
                                    res.type === "table" ? "auto" : "avoid",
                                }}
                              >
                                {hasQuestionLabel ? (
                                  inlineWithQuestion ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        flexWrap: "wrap",
                                        gap: "6px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: TEXT_MUTED,
                                          fontFamily: "monospace",
                                          fontSize: "11px",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {String(idx + 1).padStart(2, "0")}.
                                      </span>
                                      <span
                                        style={{
                                          fontWeight: 600,
                                          fontSize: "12.5px",
                                          color: TEXT_DARK,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {questionLabel}:
                                      </span>
                                      <div
                                        style={{
                                          flex: "1 1 200px",
                                          minWidth: 0,
                                        }}
                                      >
                                        {renderPrintAnswer(res, true)}
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "baseline",
                                          gap: "6px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            color: TEXT_MUTED,
                                            fontFamily: "monospace",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                          }}
                                        >
                                          {String(idx + 1).padStart(2, "0")}.
                                        </span>
                                        <span
                                          style={{
                                            fontWeight: 600,
                                            fontSize: "12.5px",
                                            color: TEXT_DARK,
                                          }}
                                        >
                                          {questionLabel}
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          paddingLeft: "20px",
                                          paddingTop: "2px",
                                        }}
                                      >
                                        {renderPrintAnswer(res, false)}
                                      </div>
                                    </>
                                  )
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "6px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: TEXT_MUTED,
                                        fontFamily: "monospace",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        marginTop:
                                          res.type === "table" ? "0px" : "2px",
                                      }}
                                    >
                                      {String(idx + 1).padStart(2, "0")}.
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      {renderPrintAnswer(res, true)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </main>

          {/* FOOTER */}
          <footer
            style={{
              marginTop: "36px",
              paddingTop: "8px",
              borderTop: `1px solid ${BORDER_LIGHT}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pageBreakInside: "avoid",
            }}
          >
            <div style={{ fontSize: "10px", color: TEXT_MUTED }}>
              Page 1 of 1 • Electronically generated by{" "}
              {organization?.name || "System"}
            </div>

            <div style={{ display: "flex", gap: "40px" }}>
              <div style={{ width: "180px", textAlign: "center" }}>
                <div
                  style={{
                    borderBottom: `1px solid ${TEXT_MUTED}`,
                    height: "20px",
                    marginBottom: "4px",
                  }}
                ></div>
                <span
                  style={{
                    fontSize: "10px",
                    color: TEXT_MUTED,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Patient/Guardian Signature
                </span>
              </div>
              <div style={{ width: "180px", textAlign: "center" }}>
                <div
                  style={{
                    borderBottom: `1px solid ${TEXT_MUTED}`,
                    height: "20px",
                    marginBottom: "4px",
                  }}
                ></div>
                <span
                  style={{
                    fontSize: "10px",
                    color: TEXT_DARK,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {assessment?.doctor || "Clinician"}
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
});

SingleAssessmentPrintTemplate.displayName = "SingleAssessmentPrintTemplate";

export default SingleAssessmentPrintTemplate;
