import React from "react";

interface PrescriptionPrintTemplateProps {
  data: any;
}

const PrescriptionPrintTemplate = React.forwardRef<
  HTMLDivElement,
  PrescriptionPrintTemplateProps
>(({ data }, ref) => {
  if (!data) return null;

  const { prescription, patient, organization, user } = data;

  const orgName = organization?.name || "Clinical Organization";
  
  const PRIMARY_COLOR = "#007b8e";
  const TEXT_DARK = "#1e293b";
  const TEXT_MUTED = "#64748b";
  const BORDER_LIGHT = "#e2e8f0";
  const BORDER = "#000000";
  const FONT_FAMILY = "Cambria, serif";

  const formatDate = (d: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div ref={ref}>
      <style>
        {`
          @media print {
            @page {
              size: A4;
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
          }
        `}
      </style>

      <div
        style={{
          fontFamily: FONT_FAMILY,
          backgroundColor: "#ffffff",
          color: TEXT_DARK,
          fontSize: "13px",
          lineHeight: "1.5",
          width: "100%",
          maxWidth: "210mm",
          margin: "0 auto",
        }}
      >
        <div style={{ boxSizing: "border-box" }}>
          {/* --- HEADER SECTION --- */}
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

          {/* --- TITLE & METADATA --- */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              position: "relative",
              borderBottom: `2px solid ${BORDER}`,
              paddingBottom: "8px",
              marginBottom: "20px",
            }}
          >
            {/* Left side: UHID */}
            <div
              style={{
                position: "absolute",
                left: "0",
                bottom: "8px",
                textAlign: "left",
                fontSize: "12.5px",
              }}
            >
             <div>
                <strong>UHID:</strong> {patient?.uhid || patient?.UHID || "________________"}
              </div> 
            </div>

            {/* Center: Title */}
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: TEXT_DARK,
                textAlign: "center",
              }}
            >
              Medical Prescription
            </div>

            {/* Right side: Date */}
            <div
              style={{
                position: "absolute",
                right: "0",
                bottom: "8px",
                textAlign: "right",
                fontSize: "12.5px",
              }}
            >
              <div>
                <strong>Date:</strong> {formatDate(prescription?.date)}
              </div>
              
            </div>
          </div>

          {/* --- PATIENT DETAILS --- */}
          <div
            style={{
              borderBottom: `1px solid ${BORDER_LIGHT}`,
              padding: "0 0 16px 0",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
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
                  {patient?.name || "________________"}
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
                  {patient?.age ? `${patient.age} Y` : "____ Y"} /{" "}
                  {patient?.gender || "______"}
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
                  Contact
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: TEXT_DARK,
                    fontWeight: 500,
                  }}
                >
                  {patient?.mobile || patient?.phone || "________________"}
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
                  Vitals
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: TEXT_DARK,
                    fontWeight: 500,
                  }}
                >
                  {prescription?.vitals?.weight
                    ? `Wt: ${prescription.vitals.weight}`
                    : ""}
                  {prescription?.vitals?.weight && prescription?.vitals?.bp
                    ? " | "
                    : ""}
                  {prescription?.vitals?.bp
                    ? `BP: ${prescription.vitals.bp}`
                    : ""}
                  {!prescription?.vitals?.weight && !prescription?.vitals?.bp
                    ? "________________"
                    : ""}
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* --- PRESCRIBED MEDICATIONS --- */}
            <div style={{ marginBottom: "8px" }}>
              
                <div style={{ padding: "16px" }}>

                  {/* Medications Table - RESTORED ORIGINAL LAYOUT WITH BULLETPROOF BACKWARD COMPATIBILITY */}
                  {!prescription?.medications ||
                  prescription.medications.length === 0 ? (
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
                        {prescription.medications.map(
                          (med: any, idx: number) => {
                            // Safe check for the new format vs old format
                            const hasNewPhases = med.schedules && med.schedules.length > 0;

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
                                  {/* Maps schedules internally for frequency OR falls back to old format */}
                                  {hasNewPhases ? (
                                    med.schedules.map((sch: any, sIdx: number) => (
                                      <div key={sIdx} style={{ marginBottom: sIdx !== med.schedules.length - 1 ? '4px' : '0' }}>
                                        {med.schedules.length > 1 && <span style={{ fontSize: '10px', color: TEXT_MUTED }}>P{sIdx + 1}: </span>}
                                        {sch.frequency}
                                      </div>
                                    ))
                                  ) : (
                                    med.frequency || "—"
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "6px 12px",
                                    color: TEXT_DARK,
                                    fontWeight: 500,
                                    verticalAlign: "top",
                                  }}
                                >
                                  {/* Maps schedules internally for duration OR falls back to old format */}
                                  {hasNewPhases ? (
                                    med.schedules.map((sch: any, sIdx: number) => (
                                      <div key={sIdx} style={{ marginBottom: sIdx !== med.schedules.length - 1 ? '4px' : '0' }}>
                                        {sch.duration} days
                                      </div>
                                    ))
                                  ) : (
                                    med.duration ? `${med.duration} days` : "—"
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Clinical Notes */}
                  {prescription?.notes && (
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
                        {prescription.notes}
                      </span>
                    </div>
                  )}
                </div>
            </div>

            {/* --- DOCTOR SIGNATURE --- */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "10px",
                paddingRight: "16px",
              }}
            >
              <div style={{ textAlign: "center", width: "200px" }}>
                {user?.signature ? (
                  <img
                    src={user.signature}
                    alt="Signature"
                    style={{ maxHeight: "40px", marginBottom: "8px" }}
                  />
                ) : (
                  <div style={{ height: "40px", marginBottom: "8px" }} />
                )}
                <div
                  style={{
                    borderTop: `1px solid ${BORDER}`,
                    paddingTop: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: TEXT_DARK,
                  }}
                >
                  {user?.name || "_______________"}
                </div>
              </div>
            </div>
          </div>

          {/* --- PAGE 2: FOLLOW-UP TRACKING TABLE --- */}
          <div
            style={{
              pageBreakBefore: "always",
              height: "267mm",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <table
              style={{
                width: "100%",
                height: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: `1px solid ${BORDER}`,
                      color: TEXT_DARK,
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: "12px",
                      width: "18%",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      border: `1px solid ${BORDER}`,
                      color: TEXT_DARK,
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: "12px",
                      width: "41%",
                    }}
                  >
                    Signs and Symptoms
                  </th>
                  <th
                    style={{
                      border: `1px solid ${BORDER}`,
                      color: TEXT_DARK,
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: "12px",
                      width: "41%",
                    }}
                  >
                    Plan of Care
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ height: "100%" }}>
                  <td
                    style={{
                      border: `1px solid ${BORDER}`,
                      verticalAlign: "top",
                      padding: "8px 12px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      border: `1px solid ${BORDER}`,
                      verticalAlign: "top",
                      padding: "8px 12px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      border: `1px solid ${BORDER}`,
                      verticalAlign: "top",
                      padding: "8px 12px",
                    }}
                  >
                    &nbsp;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

PrescriptionPrintTemplate.displayName = "PrescriptionPrintTemplate";
export default PrescriptionPrintTemplate;