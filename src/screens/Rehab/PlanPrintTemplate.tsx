import React from "react";
import QRCode from "react-qr-code";

interface PlanTemplateProps {
  data: any;
}

// Helper function to translate common English instructions to Marathi
const translateInstruction = (instruction: string) => {
  if (!instruction) return "—";
  return instruction
    .replace(/after lunch/gi, "जेवणानंतर")
    .replace(/before lunch/gi, "जेवणापूर्वी")
    .replace(/after meal/gi, "जेवणानंतर")
    .replace(/before meal/gi, "जेवणापूर्वी")
    .replace(/after food/gi, "जेवणानंतर")
    .replace(/before food/gi, "जेवणापूर्वी");
};

const PlanTemplate = React.forwardRef<HTMLDivElement, PlanTemplateProps>(
  ({ data }, ref) => {
    if (!data) return null;

    const {
      organization,
      patient,
      plan,
      prescription,
      closure_summary,
      followup,
    } = data;

    const orgName = organization?.name || "Clinic Name";

    const PRIMARY = "#000000";
    const TEXT_DARK = "#000000";
    const TEXT_MUTED = "#000000";
    const BORDER = "#000000";
    const FONT_FAMILY = "Cambria, serif";

    const formatDate = (d: string) => {
      if (!d) return "N/A";
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const availableSocials = organization?.social_media
      ? Object.entries(organization.social_media).filter(
          ([_, link]) => link !== null && link !== "",
        )
      : [];

    return (
      <div ref={ref}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sura:wght@400;700&display=swap');

          @media print {
            @page { size: A4; margin: 12mm 14mm; }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important; padding: 0 !important;
              background: white;
            }
            * {
              font-family: ${FONT_FAMILY} !important;
            }
            .marathi-text, .marathi-text * {
              font-family: 'Sura', serif !important;
            }
          }
          .plan-print-root * { box-sizing: border-box; }
          .plan-print-root table { border-collapse: collapse; }
          .med-table th, .med-table td {
            border: 1px solid #000000;
            padding: 3px 8px;
            text-align: center;
            font-size: 10.5px;
          }
          .med-table th {
            background-color: #ffffff;
            font-weight: 700;
            color: ${PRIMARY};
            text-transform: uppercase;
            font-size: 10px;
          }
          .med-table td:first-child { text-align: left; font-weight: 600; }
          
          /* Screen preview styles for Marathi */
          .marathi-text {
            font-family: 'Sura', serif !important;
          }
        `}</style>

        <div
          className="plan-print-root"
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
          {/* ── HEADER (MATCHING CONSENT FORM DESIGN) ── */}
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
                    backgroundColor: PRIMARY,
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
                backgroundColor: "#007b8e",
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

          {/* ── DOCUMENT TITLE ── */}
          <div
            style={{
              textAlign: "center",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "underline",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "14px",
              color: TEXT_DARK,
            }}
          >
            {followup ? "Follow-up Summary" : "Discharge Summary"}
          </div>

          {/* ── PATIENT INFO ROW ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0",
              border: `1px solid ${BORDER}`,
              marginBottom: "14px",
              fontSize: "11.5px",
            }}
          >
            {/* Left column */}
            <div
              style={{
                borderRight: `1px solid ${BORDER}`,
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div>
                <strong>Name:</strong> {patient?.name || "N/A"}
              </div>
              <div>
                <strong>Age:</strong>{" "}
                {patient?.age ? `${patient.age} Year` : "N/A"}
              </div>
              <div>
                <strong>Gender:</strong> {patient?.gender || "N/A"}
              </div>
              <div>
                <strong>Patient Contact:</strong> {patient?.phone || "N/A"}
              </div>
            </div>
            {/* Right column */}
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div>
                <strong>UHID No:</strong> {patient?.UHID || "N/A"}
              </div>
              <div>
                <strong>Adm. Date:</strong>{" "}
                {formatDate(patient?.registration_date)}
              </div>
              {followup ? (
                <div>
                  <strong>Follow-up No:</strong> {followup.followup_number}
                </div>
              ) : (
                <div>
                  <strong>Dis. Date:</strong>{" "}
                  {formatDate(
                    closure_summary?.closure_date || plan?.discharge_date,
                  )}
                </div>
              )}
              <div>
                <strong>Category:</strong>{" "}
                {closure_summary?.closure_reason || "N/A"}
              </div>
            </div>
          </div>

          {/* ── HISTORY OF ILLNESS ── */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>
              History of illness :
            </div>
            <div style={{ paddingLeft: "4px", fontSize: "12.5px" }}>
              {closure_summary?.closure_details || (
                <>
                  {patient?.name && (
                    <>
                      {patient.name}
                      {patient.age ? `, Age ${patient.age} Yrs` : ""}
                      {patient.gender ? `/${patient.gender}` : ""} patient
                      admitted in our hospital with C/O{" "}
                    </>
                  )}
                  {plan?.patient_symptoms || "—"}.
                </>
              )}
            </div>
            <div style={{ marginTop: "6px", fontSize: "12.5px" }}>
              <strong>Investigation:</strong> All investigations are attached to
              file.
            </div>
          </div>

          {/* ── DIAGNOSIS ── */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: 700, marginBottom: "1.5px" }}>
              Final Diagnosis ICD – 11 Code(s):
            </div>
            <div style={{ paddingLeft: "4px", fontSize: "12.5px" }}>
              {plan?.ICD_11_Codes || ""} {plan?.patient_diagnosis || "N/A"}.
            </div>
          </div>

          {/* ── MEDICATIONS ── */}
          {prescription?.medications && prescription.medications.length > 0 && (
            <div
              style={{
                marginBottom: "30px", // Reduced a little from 80px
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                Medication:
              </div>
              <table className="med-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th
                      style={{ textAlign: "left", width: "30%" }}
                      className="marathi-text"
                    >
                      औषधांची नावे
                    </th>
                    <th title="Morning" className="marathi-text">
                      सकाळ
                    </th>
                    <th title="Afternoon" className="marathi-text">
                      दुपार
                    </th>
                    <th title="Evening" className="marathi-text">
                      संध्याकाळ
                    </th>
                    <th title="Night" className="marathi-text">
                      रात्र
                    </th>
                    <th className="marathi-text">कालावधी</th>
                    <th className="marathi-text">सूचना</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medications.map((med: any, idx: number) => {
                    let morning = "0";
                    let afternoon = "0";
                    let evening = "0";
                    let night = "0";

                    if (med.frequency) {
                      const freq = med.frequency
                        .toString()
                        .trim()
                        .toUpperCase();

                      const parts = freq.split(/[\s,-]+/);
                      let hasLetterFlags = false;

                      parts.forEach((part: string) => {
                        if (part === "M" || part === "MORNING") {
                          morning = "1";
                          hasLetterFlags = true;
                        }
                        if (part === "A" || part === "AFTERNOON") {
                          afternoon = "1";
                          hasLetterFlags = true;
                        }
                        if (part === "E" || part === "EVENING") {
                          evening = "1";
                          hasLetterFlags = true;
                        }
                        if (part === "N" || part === "NIGHT") {
                          night = "1";
                          hasLetterFlags = true;
                        }
                      });

                      if (!hasLetterFlags) {
                        const freqParts = freq.split("-");
                        morning = freqParts[0] ?? "0";
                        afternoon = freqParts[1] ?? "0";

                        if (freqParts.length === 4) {
                          evening = freqParts[2] ?? "0";
                          night = freqParts[3] ?? "0";
                        } else {
                          evening = "0";
                          night = freqParts[2] ?? "0";
                        }
                      }
                    }

                    if (
                      med.morning &&
                      med.morning !== "0" &&
                      med.morning !== null
                    )
                      morning = med.morning;
                    if (
                      med.afternoon &&
                      med.afternoon !== "0" &&
                      med.afternoon !== null
                    )
                      afternoon = med.afternoon;
                    if (med.night && med.night !== "0" && med.night !== null)
                      night = med.night;

                    return (
                      <tr key={idx}>
                        <td>
                          {med.drug_type ? `${med.drug_type.charAt(0)}. ` : ""}
                          {med.drug_name}
                          {med.strength ? ` (${med.strength})` : ""}
                        </td>

                        <td>{morning}</td>
                        <td>{afternoon}</td>
                        <td>{evening}</td>
                        <td>{night}</td>

                        <td className="marathi-text">
                          {med.duration ? `${med.duration} दिवस` : "—"}
                        </td>
                        <td className="marathi-text">
                          {translateInstruction(med.instructions)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── SPECIAL INSTRUCTIONS ── */}
          <div style={{ marginBottom: "10px", fontSize: "12.5px" }}>
            <strong>Special Instruction:</strong>{" "}
            <span className="marathi-text">
              1. औषधे वेळेवर घेणे &nbsp;&nbsp; 2. नियमितपणे तपासणी करणे
              &nbsp;&nbsp; 3. पोषक आहार व योगासने करणे
            </span>
          </div>

          {/* ── NEXT VISIT DATE ── */}
          {closure_summary?.next_visit_date && (
            <div style={{ marginBottom: "10px" }}>
              <strong>Next Visit Date:</strong>
              <div
                style={{
                  display: "inline-block",
                  marginLeft: "8px",
                  backgroundColor: "#ffffff",
                  padding: "2px 10px",
                  fontWeight: 700,
                  fontSize: "13px",
                  border: "1px solid #000000",
                }}
              >
                {formatDate(closure_summary.next_visit_date)}
              </div>
            </div>
          )}

          {/* ── TREATMENT OUTCOME ── */}
          {closure_summary?.treatment_outcome && (
            <div style={{ marginBottom: "10px" }}>
              <strong>Treatment Outcome:</strong>{" "}
              {closure_summary.treatment_outcome}
              {closure_summary.final_remarks
                ? ` — ${closure_summary.final_remarks}`
                : ""}
            </div>
          )}

          {/* ── WARNING BOX ── */}
          <div
            style={{
              border: `1px solid ${BORDER}`,
              padding: "8px 12px",
              marginBottom: "12px",
              fontSize: "12px",
              backgroundColor: "#ffffff",
            }}
          >
            Contact immediately to the hospital in case of following warning
            symptoms.
            <br />
            <strong>Intense Craving &amp; Relapse</strong>
            {organization?.phone ? ` ${organization.phone}` : ""}
          </div>

          {/* ── SIGNATURE STRIP — ORGANIZATION HEADS ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
              marginTop: "4px",
            }}
          >
            {(organization?.organization_heads || []).map(
              (head: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    textAlign: "center",
                    minWidth: "150px",
                    flex: "1",
                  }}
                >
                  <div style={{ height: "16px" }}></div>
                  <div
                    style={{
                      borderTop: `1px solid ${TEXT_DARK}`,
                      paddingTop: "4px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {head.name || "—"}
                  </div>
                  {head.degree && (
                    <div style={{ fontSize: "11px", color: TEXT_MUTED }}>
                      {head.degree}
                    </div>
                  )}
                  {head.reg_no && (
                    <div style={{ fontSize: "10px", color: TEXT_MUTED }}>
                      Reg. No: {head.reg_no}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {/* ── SOCIAL MEDIA QR CODES ── */}
          {availableSocials.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                marginBottom: "16px",
                flexWrap: "wrap",
                pageBreakBefore: "avoid",
                breakBefore: "avoid",
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              {availableSocials.map(([platform, link]) => (
                <div
                  key={platform}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <QRCode value={link as string} size={64} level="L" />
                  <div
                    style={{
                      fontSize: "10px",
                      marginTop: "6px",
                      textTransform: "capitalize",
                      fontWeight: 600,
                    }}
                  >
                    {platform}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BOTTOM NOTE ── */}
          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              color: TEXT_MUTED,
              borderTop: `1px solid ${BORDER}`,
              paddingTop: "8px",
              fontStyle: "italic",
            }}
          >
            Please carry this card | Confidential — For Authorized Use Only
          </div>
        </div>
      </div>
    );
  },
);

export default PlanTemplate;
