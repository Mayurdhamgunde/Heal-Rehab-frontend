import React from "react";

interface AssessmentPrintTemplateProps {
  data: any;
}

const AssessmentPrintTemplate = React.forwardRef<
  HTMLDivElement,
  AssessmentPrintTemplateProps
>(({ data }, ref) => {
  if (!data) return null;

  // Destructure sessions and printType from the root data object
  const {
    patient,
    organization,
    assessments,
    therapy_plans,
    sessions,
    user,
    printType,
    indexPageData,
    indexFooterData, // Now captures footer total states
  } = data;

  const orgName = organization?.name || "Clinical Organization";

  // Quiet Clinical Palette
  const PRIMARY_COLOR = "#007b8e";
  const TEXT_DARK = "#0f172a"; // Slate 900
  const TEXT_MUTED = "#64748b"; // Slate 500
  const BORDER_LIGHT = "#cbd5e1"; // Slate 300
  const BORDER_SUBTLE = "#f1f5f9"; // Slate 100
  const BORDER = "#000000";
  const FONT_FAMILY = "Cambria, serif";

  const formatDate = (d: string) => {
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

  const hasAssessments = assessments && assessments.length > 0;
  const hasPlans = therapy_plans && therapy_plans.length > 0;
  const hasSessions = sessions && sessions.length > 0;

  // Conditional flags based on printType
  const showIndex = printType === "index" || printType === "all" || !printType;
  const showAssessments = hasAssessments && printType !== "index";
  const showPlans = hasPlans && printType !== "index";
  const showSessions = hasSessions && printType !== "index";

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
              /* Force table headers to repeat on new pages */
              thead {
                display: table-header-group;
              }
              /* Prevent rows from splitting horizontally across pages */
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
            {/* --- LOGO + CLINIC NAME BANNER --- */}
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
                    {orgName.charAt(0) || "C"}
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
                  {orgName}
                </div>
              </div>
            </div>

            {/* --- PATIENT DETAILS --- */}
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
                  // Updated to 4 columns since Treatment Days was removed
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
                    {patient?.UHID || patient?.uhid || "N/A"}
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

                {/* MODIFIED: Guardians stacked in place of Patient Phone */}
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `2px solid ${TEXT_DARK}`,
                paddingBottom: "10px",
              }}
            ></div>
          </div>

          {/* --- INDEX PAGE SECTION --- */}
          {showIndex && (
            <div style={{ pageBreakAfter: "always", paddingBottom: "20px" }}>
              <IndexBlock
                orgName={orgName}
                patient={patient}
                formatDate={formatDate}
                TEXT_DARK={TEXT_DARK}
                TEXT_MUTED={TEXT_MUTED}
                PRIMARY_COLOR={PRIMARY_COLOR}
                BORDER_LIGHT={BORDER_LIGHT}
                indexPageData={indexPageData}
                indexFooterData={indexFooterData}
              />
            </div>
          )}

          <div
            style={{
              fontFamily: FONT_FAMILY,
            }}
          >
            {!showAssessments && !showPlans && !showSessions && !showIndex && (
              <div
                style={{
                  textAlign: "center",
                  color: TEXT_MUTED,
                  fontStyle: "italic",
                  padding: "40px",
                }}
              >
                No clinical assessments, therapy plans, or sessions found for
                this patient.
              </div>
            )}

            {/* --- ASSESSMENTS SECTION --- */}
            {showAssessments && (
              <>
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    padding: "8px 16px",
                    marginBottom: "24px",
                    borderLeft: `4px solid ${PRIMARY_COLOR}`,
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      color: TEXT_DARK,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Clinical Assessments
                  </h2>
                </div>

                {assessments.map((assessment: any, idx: number) => (
                  <div
                    key={assessment.assessment_id || idx}
                    style={{
                      pageBreakBefore: idx > 0 ? "always" : "auto",
                      breakBefore: idx > 0 ? "page" : "auto",
                    }}
                  >
                    <AssessmentBlock
                      assessment={assessment}
                      formatDate={formatDate}
                      PRIMARY_COLOR={PRIMARY_COLOR}
                      TEXT_DARK={TEXT_DARK}
                      TEXT_MUTED={TEXT_MUTED}
                      BORDER_LIGHT={BORDER_LIGHT}
                      BORDER_SUBTLE={BORDER_SUBTLE}
                    />
                  </div>
                ))}
              </>
            )}

            {/* --- THERAPY PLANS SECTION --- */}
            {showPlans && (
              <div
                style={{
                  pageBreakBefore: hasAssessments ? "always" : "auto",
                  breakBefore: hasAssessments ? "page" : "auto",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    padding: "8px 16px",
                    marginBottom: "24px",
                    borderLeft: `4px solid ${PRIMARY_COLOR}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      color: TEXT_DARK,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Treatment plan (IPD)
                  </h2>
                </div>

                {therapy_plans.map((plan: any, idx: number) => (
                  <div
                    key={plan.plan_id || idx}
                    style={{
                      pageBreakBefore: idx > 0 ? "always" : "auto",
                      breakBefore: idx > 0 ? "page" : "auto",
                    }}
                  >
                    <TherapyPlanBlock
                      plan={plan}
                      patient={patient}
                      formatDate={formatDate}
                      PRIMARY_COLOR={PRIMARY_COLOR}
                      TEXT_DARK={TEXT_DARK}
                      TEXT_MUTED={TEXT_MUTED}
                      BORDER_LIGHT={BORDER_LIGHT}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* --- SESSIONS SECTION --- */}
            {showSessions && (
              <div
                style={{
                  pageBreakBefore:
                    hasAssessments || hasPlans ? "always" : "auto",
                  breakBefore: hasAssessments || hasPlans ? "page" : "auto",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    padding: "8px 16px",
                    marginBottom: "24px",
                    borderLeft: `4px solid ${PRIMARY_COLOR}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      color: TEXT_DARK,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Councellor Sessions
                  </h2>
                </div>

                <SessionsBlock
                  sessions={sessions}
                  formatDate={formatDate}
                  PRIMARY_COLOR={PRIMARY_COLOR}
                  TEXT_DARK={TEXT_DARK}
                  TEXT_MUTED={TEXT_MUTED}
                  BORDER_LIGHT={BORDER_LIGHT}
                />
              </div>
            )}
          </div>

          {/* FOOTER */}
          {printType !== "index" && (
            <footer
              style={{
                marginTop: "24px",
                paddingTop: "12px",
                borderTop: `1px solid ${BORDER_LIGHT}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pageBreakInside: "avoid",
              }}
            >
              <div style={{ fontSize: "10px", color: TEXT_MUTED }}>
                Electronically generated by {organization?.name || "System"}
              </div>

              <div style={{ display: "flex", gap: "40px" }}>
                <div
                  style={{
                    width: "180px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      borderBottom: `1px solid ${TEXT_MUTED}`,
                      height: "30px",
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
                <div
                  style={{
                    width: "180px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  {user?.signature ? (
                    <img
                      src={user.signature}
                      alt="Signature"
                      style={{
                        maxHeight: "30px",
                        marginBottom: "2px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div style={{ height: "32px" }}></div>
                  )}
                  <div
                    style={{
                      borderBottom: `1px solid ${TEXT_MUTED}`,
                      width: "100%",
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
                    Clinician Signature
                  </span>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* BLOCK COMPONENTS                                                           */
/* -------------------------------------------------------------------------- */

// 0. INDEX PAGE BLOCK (STYLED TO MATCH THE CLINICAL TEMPLATE)
const IndexBlock: React.FC<{
  orgName: string;
  patient: any;
  formatDate: (d: string) => string;
  TEXT_DARK: string;
  TEXT_MUTED: string;
  PRIMARY_COLOR: string;
  BORDER_LIGHT: string;
  indexPageData?: Array<{ name: string; from: string; to: string }>;
  indexFooterData?: { from: string; to: string };
}> = ({
  orgName,
  patient,
  formatDate,
  TEXT_DARK,
  TEXT_MUTED,
  PRIMARY_COLOR,
  BORDER_LIGHT,
  indexPageData = [],
  indexFooterData = { from: "", to: "" },
}) => {
  return (
    <div style={{ width: "100%", color: TEXT_DARK }}>
      {/* Title Banner - Matches standard section headers */}
      <div
        style={{
          backgroundColor: "#f1f5f9",
          padding: "8px 16px",
          marginBottom: "16px",
          borderLeft: `4px solid ${PRIMARY_COLOR}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            color: TEXT_DARK,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Index
        </h2>
      </div>

      {/* Patient Info & Dates Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: `1px solid ${BORDER_LIGHT}`,
          borderBottom: "none",
          backgroundColor: "#ffffff",
          fontSize: "12px",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderRight: `1px solid ${BORDER_LIGHT}`,
            borderBottom: `1px solid ${BORDER_LIGHT}`,
          }}
        >
          <span
            style={{
              color: TEXT_MUTED,
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: "10px",
              marginRight: "8px",
            }}
          >
            Admission Date:
          </span>
          <span style={{ color: TEXT_DARK, fontWeight: 600 }}>
            {patient?.admission_date
              ? formatDate(patient.admission_date)
              : "N/A"}
          </span>
        </div>
        <div
          style={{
            padding: "10px 12px",
            borderBottom: `1px solid ${BORDER_LIGHT}`,
          }}
        >
          <span
            style={{
              color: TEXT_MUTED,
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: "10px",
              marginRight: "8px",
            }}
          >
            Dis. Date:
          </span>
          <span style={{ color: TEXT_DARK, fontWeight: 600 }}>
            {patient?.discharge_date
              ? formatDate(patient.discharge_date)
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Main Index Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          border: `1px solid ${BORDER_LIGHT}`,
        }}
      >
        <thead>
          <tr>
            <th
              rowSpan={2}
              style={{
                backgroundColor: "#e6f4f6",
                color: TEXT_MUTED,
                padding: "10px 12px",
                textAlign: "left",
                fontWeight: 700,
                fontSize: "11px",
                textTransform: "uppercase",
                width: "6%",
                borderBottom: `2px solid ${BORDER_LIGHT}`,
                borderRight: `1px solid ${BORDER_LIGHT}`,
              }}
            >
              No.
            </th>
            <th
              rowSpan={2}
              style={{
                backgroundColor: "#e6f4f6",
                color: TEXT_MUTED,
                padding: "10px 12px",
                textAlign: "left",
                fontWeight: 700,
                fontSize: "11px",
                textTransform: "uppercase",
                borderBottom: `2px solid ${BORDER_LIGHT}`,
                borderRight: `1px solid ${BORDER_LIGHT}`,
              }}
            >
              Document Name
            </th>
            <th
              colSpan={2}
              style={{
                backgroundColor: "#e6f4f6",
                color: TEXT_MUTED,
                padding: "6px 12px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "11px",
                textTransform: "uppercase",
                borderBottom: `1px solid ${BORDER_LIGHT}`,
              }}
            >
              Page Reference
            </th>
          </tr>
          <tr>
            <th
              style={{
                backgroundColor: "#e6f4f6",
                color: TEXT_MUTED,
                padding: "6px 12px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "10px",
                textTransform: "uppercase",
                width: "15%",
                borderBottom: `2px solid ${BORDER_LIGHT}`,
                borderRight: `1px solid ${BORDER_LIGHT}`,
              }}
            >
              From
            </th>
            <th
              style={{
                backgroundColor: "#e6f4f6",
                color: TEXT_MUTED,
                padding: "6px 12px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "10px",
                textTransform: "uppercase",
                width: "15%",
                borderBottom: `2px solid ${BORDER_LIGHT}`,
              }}
            >
              To
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Mapping over dynamic indexPageData array passed from PatientView */}
          {indexPageData.map((item, idx) => (
            <tr key={idx} style={{ pageBreakInside: "avoid" }}>
              <td
                style={{
                  borderBottom: `1px solid ${BORDER_LIGHT}`,
                  borderRight: `1px solid ${BORDER_LIGHT}`,
                  padding: "10px 12px",
                  color: TEXT_MUTED,
                  fontWeight: 600,
                }}
              >
                {String(idx + 1).padStart(2, "0")}
              </td>
              <td
                style={{
                  borderBottom: `1px solid ${BORDER_LIGHT}`,
                  borderRight: `1px solid ${BORDER_LIGHT}`,
                  padding: "10px 12px",
                  fontWeight: 600,
                  color: TEXT_DARK,
                }}
              >
                {item.name}
              </td>
              <td
                style={{
                  borderBottom: `1px solid ${BORDER_LIGHT}`,
                  borderRight: `1px solid ${BORDER_LIGHT}`,
                  padding: "10px 12px",
                  textAlign: "center",
                  fontWeight: 600,
                  color: TEXT_DARK,
                }}
              >
                {item.from || ""}
              </td>
              <td
                style={{
                  borderBottom: `1px solid ${BORDER_LIGHT}`,
                  padding: "10px 12px",
                  textAlign: "center",
                  fontWeight: 600,
                  color: TEXT_DARK,
                }}
              >
                {item.to || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Description Text */}
      <div style={{ marginTop: "24px", fontSize: "12px", color: TEXT_MUTED }}>
        This client record file contains page No.{" "}
        <span
          style={{
            borderBottom: `1px dashed ${TEXT_DARK}`,
            padding: "0 16px",
            color: TEXT_DARK,
            fontWeight: 600,
          }}
        >
          {indexFooterData.from || ""}
        </span>{" "}
        to{" "}
        <span
          style={{
            borderBottom: `1px dashed ${TEXT_DARK}`,
            padding: "0 16px",
            color: TEXT_DARK,
            fontWeight: 600,
          }}
        >
          {indexFooterData.to || ""}
        </span>{" "}
        as described in the index.
      </div>

      {/* Admin Signatures */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "80px",
          padding: "0 16px",
        }}
      >
        <div style={{ textAlign: "center", width: "200px" }}>
          <div
            style={{
              borderBottom: `1px solid ${TEXT_MUTED}`,
              width: "100%",
              marginBottom: "6px",
            }}
          ></div>
          <span
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 700,
              color: TEXT_MUTED,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            HR Manager
          </span>
          <span
            style={{
              fontSize: "12px",
              display: "block",
              color: TEXT_DARK,
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            {orgName}
          </span>
        </div>
        <div style={{ textAlign: "center", width: "200px" }}>
          <div
            style={{
              borderBottom: `1px solid ${TEXT_MUTED}`,
              width: "100%",
              marginBottom: "6px",
            }}
          ></div>
          <span
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 700,
              color: TEXT_MUTED,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            M.R.D
          </span>
          <span
            style={{
              fontSize: "12px",
              display: "block",
              color: TEXT_DARK,
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            {orgName}
          </span>
        </div>
      </div>
    </div>
  );
};

// 1. ASSESSMENT BLOCK (Unchanged)
interface AssessmentBlockProps {
  assessment: any;
  formatDate: (d: string) => string;
  PRIMARY_COLOR: string;
  TEXT_DARK: string;
  TEXT_MUTED: string;
  BORDER_LIGHT: string;
  BORDER_SUBTLE: string;
}

const AssessmentBlock: React.FC<AssessmentBlockProps> = ({
  assessment,
  formatDate,
  PRIMARY_COLOR,
  TEXT_DARK,
  TEXT_MUTED,
  BORDER_LIGHT,
  BORDER_SUBTLE,
}) => {
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

      // Filtering logic
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
              fontSize: "11.5px",
              lineHeight: "1.35",
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
                      padding: "6px 8px",
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "9.5px",
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
                        padding: "6px 8px",
                        textAlign: "left",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "9.5px",
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
                          padding: "6px 8px",
                          fontWeight: 600,
                          color: TEXT_DARK,
                          paddingLeft: row.is_sub_row ? "20px" : "8px",
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
                        const isReferenceRange =
                          cell.col_type === "reference_range" ||
                          col.colType === "reference_range";

                        if (isReferenceRange) {
                          displayVal = cell.reference_value || "—";
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
                          displayVal = "—";
                        } else if (row.unit) {
                          displayVal = `${displayVal} ${row.unit}`;
                        }

                        const cellIsChecked = displayVal === "Yes";

                        return (
                          <td
                            key={col.id || colIdx}
                            style={{
                              padding: "6px 8px",
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
                            {isCheckbox ? (
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
                      padding: "8px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontSize: "10px",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                      borderRight: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    Total Score
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    <strong
                      style={{
                        color: PRIMARY_COLOR,
                        fontSize: "13px",
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

    // 1b. Table Format (Object Version)
    if (
      type === "table" &&
      answer !== null &&
      typeof answer === "object" &&
      !Array.isArray(answer)
    ) {
      let tableRows = res.rows || [];
      let tableColumns = res.columns || columns || [];

      if (tableRows.length === 0) {
        const rowKeys = Object.keys(answer).filter(
          (k) => k !== "savedTotalScore",
        );
        tableRows = rowKeys.map((k) => ({
          id: k,
          label: answer[k].__rowLabel || k,
        }));
      }

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
              fontSize: "11.5px",
              lineHeight: "1.35",
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
                      padding: "6px 8px",
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "9.5px",
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
                      padding: "6px 8px",
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "9.5px",
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
                          padding: "6px 8px",
                          fontWeight: 600,
                          color: TEXT_DARK,
                          paddingLeft:
                            row.isSubRow || row.is_sub_row ? "20px" : "8px",
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
                        const isReferenceRange =
                          col.colType === "reference_range";

                        if (isReferenceRange) {
                          displayVal = row.referenceValues?.[col.id] || "—";
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
                          displayVal = "—";
                        } else if (row.unit) {
                          displayVal = `${displayVal} ${row.unit}`;
                        }

                        const cellIsChecked = displayVal === "Yes";

                        return (
                          <td
                            key={col.id || colIdx}
                            style={{
                              padding: "6px 8px",
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
                            {isCheckbox ? (
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
                      padding: "8px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontSize: "10px",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                      borderRight: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    Total Score
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      borderTop: `1px solid ${BORDER_LIGHT}`,
                    }}
                  >
                    <strong
                      style={{
                        color: PRIMARY_COLOR,
                        fontSize: "13px",
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
    <div style={{ marginBottom: "30px", breakInside: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
            color: TEXT_DARK,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "-0.4px",
          }}
        >
          {assessment.assessment_name}
        </h3>
        <div
          style={{ textAlign: "right", fontSize: "11px", color: TEXT_MUTED }}
        >
          <span style={{ fontFamily: "monospace", display: "block" }}>
            DATE: {formatDate(assessment.date_taken)}
          </span>
          {assessment.doctor && (
            <span style={{ fontWeight: 600, color: TEXT_DARK }}>
              Attending: {assessment.doctor}
            </span>
          )}
        </div>
      </div>

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

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {groupedResponses.length === 0 ? (
          <div
            style={{ fontStyle: "italic", fontSize: "13px", color: TEXT_MUTED }}
          >
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

                  const questionLabel = res.question || res.question_title;
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
                            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
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
                              style={{ paddingLeft: "20px", paddingTop: "2px" }}
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
                              marginTop: res.type === "table" ? "0px" : "2px",
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
  );
};

// 2. THERAPY PLAN BLOCK
interface TherapyPlanBlockProps {
  plan: any;
  patient: any;
  formatDate: (d: string) => string;
  PRIMARY_COLOR: string;
  TEXT_DARK: string;
  TEXT_MUTED: string;
  BORDER_LIGHT: string;
}

const TherapyPlanBlock: React.FC<TherapyPlanBlockProps> = ({
  plan,
  PRIMARY_COLOR,
  TEXT_DARK,
  TEXT_MUTED,
  BORDER_LIGHT,
}) => {
  const hasPrescriptions = plan.prescriptions && plan.prescriptions.length > 0;
  const hasMedicalIdentifiers = plan.ICD_11_Codes || plan.MarksOfIdentification;

  return (
    <div style={{ marginBottom: "40px", breakInside: "auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              color: PRIMARY_COLOR,
              fontWeight: 700,
            }}
          >
            {plan.therapy_name || "Unnamed Therapy Plan"}
          </h3>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            color: TEXT_MUTED,
            marginTop: "6px",
          }}
        >
          <div>
            Status:{" "}
            <strong style={{ color: TEXT_DARK }}>{plan.status || "N/A"}</strong>{" "}
            &nbsp;
          </div>

          {hasMedicalIdentifiers && (
            <div style={{ display: "flex", gap: "16px", textAlign: "right" }}>
              {plan.ICD_11_Codes && (
                <div>
                  <strong
                    style={{ textTransform: "uppercase", fontSize: "10px" }}
                  >
                    ICD-11:{" "}
                  </strong>
                  <span style={{ color: TEXT_DARK }}>{plan.ICD_11_Codes}</span>
                </div>
              )}
              {plan.MarksOfIdentification && (
                <div>
                  <strong
                    style={{ textTransform: "uppercase", fontSize: "10px" }}
                  >
                    Marks:{" "}
                  </strong>
                  <span style={{ color: TEXT_DARK }}>
                    {plan.MarksOfIdentification}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {hasPrescriptions && (
        <div style={{ marginBottom: "32px" }}>
          <h4
            style={{
              margin: "0 0 16px 0",
              fontSize: "14px",
              color: PRIMARY_COLOR,
            }}
          >
            Prescriptions & Medications (History)
          </h4>

          {plan.prescriptions.map((rx: any, rxIdx: number) => (
            <div
              key={rx._id || rxIdx}
              style={{
                marginBottom: "24px",
                pageBreakInside: "avoid",
              }}
            >
              {rx.diagnosis && (
                <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                  <strong style={{ color: TEXT_MUTED }}>Diagnosis: </strong>
                  <span style={{ color: TEXT_DARK }}>{rx.diagnosis}</span>
                </div>
              )}

              <div>
                {/* --- PRESCRIBED MEDICATIONS --- */}
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ padding: "0" }}>
                    {!rx?.medications || rx.medications.length === 0 ? (
                      <div
                        style={{
                          fontStyle: "italic",
                          fontSize: "13px",
                          color: TEXT_MUTED,
                        }}
                      >
                        No active medications prescribed.
                      </div>
                    ) : (
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "13px",
                          border: `1px solid ${BORDER_LIGHT}`,
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                backgroundColor: "#e6f4f6",
                                color: TEXT_MUTED,
                                padding: "8px 12px",
                                textAlign: "left",
                                fontWeight: 700,
                                fontSize: "11px",
                                width: "5%",
                              }}
                            >
                              Sr.
                            </th>
                            <th
                              style={{
                                backgroundColor: "#e6f4f6",
                                color: TEXT_MUTED,
                                padding: "8px 12px",
                                textAlign: "left",
                                fontWeight: 700,
                                fontSize: "11px",
                                width: "30%",
                              }}
                            >
                              Drug Name
                            </th>
                            <th
                              style={{
                                backgroundColor: "#e6f4f6",
                                color: TEXT_MUTED,
                                padding: "8px 12px",
                                textAlign: "left",
                                fontWeight: 700,
                                fontSize: "11px",
                              }}
                            >
                              Type / Strength
                            </th>
                            <th
                              style={{
                                backgroundColor: "#e6f4f6",
                                color: TEXT_MUTED,
                                padding: "8px 12px",
                                textAlign: "left",
                                fontWeight: 700,
                                fontSize: "11px",
                              }}
                            >
                              Frequency
                            </th>
                            <th
                              style={{
                                backgroundColor: "#e6f4f6",
                                color: TEXT_MUTED,
                                padding: "8px 12px",
                                textAlign: "left",
                                fontWeight: 700,
                                fontSize: "11px",
                              }}
                            >
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rx.medications.map((med: any, idx: number) => {
                            const hasNewPhases =
                              med.schedules && med.schedules.length > 0;

                            return (
                              <tr
                                key={idx}
                                style={{
                                  backgroundColor:
                                    idx % 2 === 0 ? "transparent" : "#fdfdfd",
                                  pageBreakInside: "avoid",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "6px 12px",
                                    color: TEXT_MUTED,
                                    verticalAlign: "top",
                                  }}
                                >
                                  {idx + 1}
                                </td>
                                <td
                                  style={{
                                    padding: "6px 12px",
                                    color: TEXT_DARK,
                                    verticalAlign: "top",
                                  }}
                                >
                                  <strong style={{ display: "block" }}>
                                    {med.drug_name}
                                  </strong>
                                  {med.generic_name && (
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: TEXT_MUTED,
                                      }}
                                    >
                                      {med.generic_name}
                                    </span>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "6px 12px",
                                    color: TEXT_DARK,
                                    verticalAlign: "top",
                                  }}
                                >
                                  {med.drug_type || "Tablet"}
                                  {med.strength ? ` / ${med.strength}` : ""}
                                </td>
                                <td
                                  style={{
                                    padding: "6px 12px",
                                    color: TEXT_DARK,
                                    fontWeight: 500,
                                    verticalAlign: "top",
                                  }}
                                >
                                  {hasNewPhases
                                    ? med.schedules.map(
                                        (sch: any, sIdx: number) => (
                                          <div
                                            key={sIdx}
                                            style={{
                                              marginBottom:
                                                sIdx !==
                                                med.schedules.length - 1
                                                  ? "4px"
                                                  : "0",
                                            }}
                                          >
                                            {med.schedules.length > 1 && (
                                              <span
                                                style={{
                                                  fontSize: "10px",
                                                  color: TEXT_MUTED,
                                                }}
                                              >
                                                P{sIdx + 1}:{" "}
                                              </span>
                                            )}
                                            {sch.frequency}
                                          </div>
                                        ),
                                      )
                                    : med.frequency || "—"}
                                </td>
                                <td
                                  style={{
                                    padding: "6px 12px",
                                    color: TEXT_DARK,
                                    fontWeight: 500,
                                    verticalAlign: "top",
                                  }}
                                >
                                  {hasNewPhases
                                    ? med.schedules.map(
                                        (sch: any, sIdx: number) => (
                                          <div
                                            key={sIdx}
                                            style={{
                                              marginBottom:
                                                sIdx !==
                                                med.schedules.length - 1
                                                  ? "4px"
                                                  : "0",
                                            }}
                                          >
                                            {sch.duration} days
                                          </div>
                                        ),
                                      )
                                    : med.duration
                                      ? `${med.duration} days`
                                      : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {rx.notes && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "10px 12px",
                    backgroundColor: "#fdfdfd",
                    borderLeft: `2px solid ${BORDER_LIGHT}`,
                    pageBreakInside: "avoid",
                  }}
                >
                  <strong
                    style={{
                      color: TEXT_MUTED,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Notes:{" "}
                  </strong>
                  <span
                    style={{
                      fontSize: "14px",
                      color: TEXT_DARK,
                      fontStyle: "italic",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {rx.notes}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 3. SESSIONS BLOCK (Unchanged)
interface SessionsBlockProps {
  sessions: any[];
  formatDate: (d: string) => string;
  PRIMARY_COLOR: string;
  TEXT_DARK: string;
  TEXT_MUTED: string;
  BORDER_LIGHT: string;
}

const SessionsBlock: React.FC<SessionsBlockProps> = ({
  sessions,
  formatDate,
  PRIMARY_COLOR,
  TEXT_DARK,
  TEXT_MUTED,
  BORDER_LIGHT,
}) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div style={{ fontStyle: "italic", fontSize: "13px", color: TEXT_MUTED }}>
        No sessions recorded for this patient.
      </div>
    );
  }

  const groupedSessions = sessions.reduce(
    (acc: Record<string, any[]>, session: any) => {
      const rawType = session.type || "Other";
      const type = rawType.charAt(0).toUpperCase() + rawType.slice(1);
      if (!acc[type]) acc[type] = [];
      acc[type].push(session);
      return acc;
    },
    {},
  );

  const preferredOrder = ["Individual", "Group", "Family"];
  const sortedTypes = Object.keys(groupedSessions).sort((a, b) => {
    const indexA = preferredOrder.indexOf(a);
    const indexB = preferredOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div>
      {sortedTypes.map((type) => {
        const counselorName = groupedSessions[type][0]?.doctor_name;

        return (
          <div
            key={type}
            style={{ marginBottom: "32px", pageBreakInside: "avoid" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: `1px solid ${BORDER_LIGHT}`,
                paddingBottom: "4px",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: PRIMARY_COLOR,
                  fontWeight: 700,
                }}
              >
                {type} Sessions
              </h3>
              {counselorName && (
                <span
                  style={{
                    fontSize: "11px",
                    color: TEXT_MUTED,
                    fontWeight: 600,
                  }}
                >
                  Counsellor.{" "}
                  <span style={{ color: TEXT_DARK }}>{counselorName}</span>
                </span>
              )}
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      borderBottom: `2px solid ${BORDER_LIGHT}`,
                      color: TEXT_MUTED,
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  >
                    No.
                  </th>
                  <th
                    style={{
                      borderBottom: `2px solid ${BORDER_LIGHT}`,
                      color: TEXT_MUTED,
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      borderBottom: `2px solid ${BORDER_LIGHT}`,
                      color: TEXT_MUTED,
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  >
                    Issue Dealt With
                  </th>
                  <th
                    style={{
                      borderBottom: `2px solid ${BORDER_LIGHT}`,
                      color: TEXT_MUTED,
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  >
                    Impression
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedSessions[type].map((session: any, idx: number) => (
                  <tr
                    key={session.session_id || idx}
                    style={{ pageBreakInside: "avoid" }}
                  >
                    <td
                      style={{
                        borderBottom: `1px solid ${BORDER_LIGHT}`,
                        padding: "8px",
                        color: TEXT_DARK,
                        verticalAlign: "top",
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        borderBottom: `1px solid ${BORDER_LIGHT}`,
                        padding: "8px",
                        color: TEXT_DARK,
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(session.date)}
                      <br />
                      {session.start_time && (
                        <span style={{ fontSize: "9px", color: TEXT_MUTED }}>
                          {session.start_time}
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        borderBottom: `1px solid ${BORDER_LIGHT}`,
                        padding: "8px",
                        color: TEXT_DARK,
                        verticalAlign: "top",
                      }}
                    >
                      {session.issue_dealt_with || "—"}
                    </td>
                    <td
                      style={{
                        borderBottom: `1px solid ${BORDER_LIGHT}`,
                        padding: "8px",
                        color: TEXT_DARK,
                        verticalAlign: "top",
                      }}
                    >
                      {session.counselor_impression || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default AssessmentPrintTemplate;
