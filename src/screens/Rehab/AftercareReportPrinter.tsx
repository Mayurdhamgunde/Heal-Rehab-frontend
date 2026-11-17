import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import api from "../../utils/central"; // adjust import path as needed

interface AftercareReportPrinterProps {
  patientId: string;
  patientDetails: {
    name: string;
    UHID?: string;
    age?: string | number;
    gender?: string;
    phone?: string;
  };
  onStateChange: (isPrinting: boolean) => void;
}

export interface AftercareReportPrinterRef {
  triggerPrint: () => Promise<void>;
}

// ---- Theme tokens (kept consistent with the rest of the clinical print templates) ----
const PRIMARY_COLOR = "#007b8e";
const TEXT_DARK = "#1e293b";
const TEXT_MUTED = "#64748b";
const BORDER_LIGHT = "#e2e8f0";
const BORDER = "#000000";

interface PhoneCallRow {
  sr_no?: string | number;
  date?: string;
  response?: string;
  recovery_status?: string;
}

interface HomeVisitRow {
  date_time?: string;
  contact_person?: string;
  issue_discussed?: string;
  conclusion?: string;
}

interface AftercareFormData {
  patient: {
    name: string;
    UHID?: string;
    age?: string | number;
    gender?: string;
    phone?: string;
  };
  organization: {
    name: string;
    logo?: string;
  };
  phone_calls: PhoneCallRow[];
  home_visits: HomeVisitRow[];
}

const formatDate = (d?: string) => {
  if (!d) return "";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

// ---- Section heading is defined further below as `SectionHeading` ----

const AftercareReportPrinter = forwardRef<
  AftercareReportPrinterRef,
  AftercareReportPrinterProps
>(({ patientId, patientDetails, onStateChange }, ref) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<AftercareFormData | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Aftercare_Report_${patientDetails.name.replace(/\s+/g, "_")}`,
    onAfterPrint: () => {
      setPrintData(null);
      onStateChange(false);
    },
  });

  useImperativeHandle(ref, () => ({
    triggerPrint: async () => {
      if (!patientId) return;
      onStateChange(true);

      try {
        const response = await api.get(`/session/report/${patientId}`);
        const data = response.data;

        const sessions: any[] = Array.isArray(data.sessions)
          ? data.sessions
          : [];

        const phoneCalls: PhoneCallRow[] = sessions
          .filter((s) => (s.meet_type || s.Typeofmeet) === "Phone Call")
          .map((s, idx) => ({
            sr_no: `F${idx + 1}`,
            date: s.date,
            response: s.issue_dealt_with || s.response,
            recovery_status: s.counselor_impression || s.session_impression,
          }));

        const homeVisits: HomeVisitRow[] = sessions
          .filter((s) => (s.meet_type || s.Typeofmeet) === "Home Visit")
          .map((s) => ({
            date_time: s.start_time
              ? `${formatDate(s.date)} ${s.start_time}`
              : formatDate(s.date),
            contact_person: s.doctor_name,
            issue_discussed: s.issue_dealt_with,
            conclusion: s.counselor_impression || s.session_impression,
          }));

        const formattedData: AftercareFormData = {
          patient: {
            name: data.patient_details?.patient_name || patientDetails.name,
            UHID: patientDetails.UHID,
            age: patientDetails.age,
            gender: patientDetails.gender,
            phone: patientDetails.phone,
          },
          organization: {
            name: data.organization?.name || "Clinical Organization",
            logo: data.organization?.logo,
          },
          phone_calls: phoneCalls,
          home_visits: homeVisits,
        };

        setPrintData(formattedData);

        // Allow the DOM to render the hidden component with the new data before printing
        setTimeout(() => {
          handlePrint();
        }, 500);
      } catch (err) {
        console.error("Error fetching aftercare report:", err);
        alert("Failed to load aftercare report for printing.");
        onStateChange(false);
      }
    },
  }));

  return (
    <div style={{ display: "none" }}>
      <AftercareFollowUpTemplate ref={printRef} data={printData} />
    </div>
  );
});

AftercareReportPrinter.displayName = "AftercareReportPrinter";

// ---------------------------------------------------------------------------
// Print template — standalone aftercare follow-up report covering Phone Call
// and Home Visit follow-ups, showing every recorded entry (no row cap).
// ---------------------------------------------------------------------------
interface AftercareFollowUpTemplateProps {
  data: AftercareFormData | null;
}

const AftercareFollowUpTemplate = forwardRef<
  HTMLDivElement,
  AftercareFollowUpTemplateProps
>(({ data }, ref) => {
  if (!data) return <div ref={ref} />;

  const { patient, organization } = data;

  return (
    <div ref={ref}>
      <style>
        {`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          `}
      </style>

      <div
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          backgroundColor: "#ffffff",
          color: TEXT_DARK,
          fontSize: "13px",
          lineHeight: "1.5",
        }}
      >
        {/* ---- Header band (kept consistent with other clinical print templates) ---- */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            border: `1px solid ${BORDER}`,
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "140px",
              padding: "8px",
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
                  maxHeight: "110px",
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
                  fontSize: "40px",
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
                fontSize: "28px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "'Times New Roman', serif",
              }}
            >
              {organization?.name || "Clinical Organization"}
            </div>
          </div>
        </div>

        {/* ---- Title bar ---- */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            position: "relative",
            borderBottom: `2px solid ${PRIMARY_COLOR}`,
            paddingBottom: "10px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: TEXT_DARK,
              textAlign: "center",
            }}
          >
            Aftercare Follow-Up &amp; Recovery Report
          </div>
        </div>

        {/* ---- Patient Details ---- */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
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
                  letterSpacing: "0.5px",
                  marginBottom: "3px",
                }}
              >
                Patient Name
              </div>
              <div
                style={{ fontSize: "15px", color: TEXT_DARK, fontWeight: 700 }}
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
                  letterSpacing: "0.5px",
                  marginBottom: "3px",
                }}
              >
                UHID
              </div>
              <div
                style={{ fontSize: "14px", color: TEXT_DARK, fontWeight: 500 }}
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
                  letterSpacing: "0.5px",
                  marginBottom: "3px",
                }}
              >
                Age / Gender
              </div>
              <div
                style={{ fontSize: "14px", color: TEXT_DARK, fontWeight: 500 }}
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
                  letterSpacing: "0.5px",
                  marginBottom: "3px",
                }}
              >
                Contact
              </div>
              <div
                style={{ fontSize: "14px", color: TEXT_DARK, fontWeight: 500 }}
              >
                {patient?.phone || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Phone Call Follow-Up ---- */}
        <div style={{ marginBottom: "26px", pageBreakInside: "avoid" }}>
          <SectionHeading accent={PRIMARY_COLOR}>
            Phone Call Follow-Up
          </SectionHeading>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12.5px",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Follow-Up</th>
                <th style={{ ...thStyle, textAlign: "left" }}>
                  Recovery Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.phone_calls.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: TEXT_MUTED,
                      fontStyle: "italic",
                      padding: "16px",
                    }}
                  >
                    No phone call follow-ups recorded.
                  </td>
                </tr>
              ) : (
                data.phone_calls.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <td style={tdStyle}>{formatDate(row.date) || "—"}</td>
                    <td style={tdStyle}>{row.response || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      {row.recovery_status || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ---- Home Visit Follow-Up ---- */}
        <div style={{ marginBottom: "26px", pageBreakInside: "avoid" }}>
          <SectionHeading accent={PRIMARY_COLOR}>
            Home Visit Follow-Up
          </SectionHeading>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12.5px",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Date &amp; Time</th>
                <th style={thStyle}>Contact Person</th>
                <th style={{ ...thStyle, textAlign: "left" }}>
                  Issue Discussed
                </th>
                <th style={{ ...thStyle, textAlign: "left" }}>Conclusion</th>
              </tr>
            </thead>
            <tbody>
              {data.home_visits.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: TEXT_MUTED,
                      fontStyle: "italic",
                      padding: "16px",
                    }}
                  >
                    No home visit follow-ups recorded.
                  </td>
                </tr>
              ) : (
                data.home_visits.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <td style={tdStyle}>{row.date_time || "—"}</td>
                    <td style={tdStyle}>{row.contact_person || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      {row.issue_discussed || "—"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      {row.conclusion || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ---- Footer ---- */}
        <div
          style={{
            marginTop: "36px",
            paddingTop: "10px",
            borderTop: `1px solid ${BORDER_LIGHT}`,
            fontSize: "10px",
            color: TEXT_MUTED,
            textAlign: "center",
          }}
        >
          This is a system-generated aftercare follow-up report from{" "}
          {organization?.name || "the clinical team"}.
        </div>
      </div>
    </div>
  );
});

AftercareFollowUpTemplate.displayName = "AftercareFollowUpTemplate";

const thStyle: React.CSSProperties = {
  borderBottom: `2px solid ${PRIMARY_COLOR}`,
  padding: "9px 10px",
  textAlign: "center",
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: "10.5px",
  letterSpacing: "0.5px",
  color: PRIMARY_COLOR,
};

const tdStyle: React.CSSProperties = {
  borderBottom: `1px solid ${BORDER_LIGHT}`,
  padding: "10px 10px",
  textAlign: "center",
  color: TEXT_DARK,
  verticalAlign: "top",
};

const SectionHeading = ({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "10px",
    }}
  >
    <div
      style={{
        width: "4px",
        height: "16px",
        backgroundColor: accent,
        borderRadius: "2px",
      }}
    />
    <h3
      style={{
        margin: 0,
        fontSize: "13.5px",
        fontWeight: 700,
        color: TEXT_DARK,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {children}
    </h3>
  </div>
);

export default AftercareReportPrinter;
