import { forwardRef } from "react";

interface PrintProps {
  data: any;
}

const PrescriptionPrintTemplate = forwardRef<HTMLDivElement, PrintProps>(
  ({ data }, ref) => {
    if (!data) return null;

    const {
      prescription,
      organization,
      user,
      patient,
      session,
      plan,
      consultation,
    } = data;

    // --- Styling Constants (Synced with Mobile) ---
    const primaryColor = "#007B8E";
    const textColor = "#333";
    const lightGrayBg = "#f4f6f8";
    const borderColor = "#eee";

    // --- Helpers ---
    const getShortType = (type: string) => {
      if (!type) return "";
      const upperType = type.toUpperCase();
      if (upperType.includes("TABLET")) return "TAB";
      if (upperType.includes("CAPSULE")) return "CAP";
      if (upperType.includes("SYRUP")) return "SYP";
      if (upperType.includes("INJECTION")) return "INJ";
      return upperType;
    };

    const formatFrequency = (freq: string) => {
      if (!freq) return "N/A";
      return freq
        .replace(/M/g, "Morning")
        .replace(/A/g, "Afternoon")
        .replace(/N/g, "Night")
        .split("-")
        .join(" - ");
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "N/A";
      const d = new Date(dateString);
      return d.toLocaleDateString();
    };

    const address = organization?.address
      ? `${organization.address.street || ""}, ${organization.address.city || ""}, ${organization.address.state || ""} ${organization.address.zip || ""}`
      : "";

    const displayDate =
      consultation?.date || session?.date || prescription?.prescription_date;

    return (
      <div
        ref={ref}
        style={{
          padding: "30px",
          fontFamily: "'Helvetica', sans-serif",
          color: textColor,
          backgroundColor: "#fff",
          lineHeight: "1.4",
        }}
      >
        {/* 1. Header Section */}
        <table
          style={{
            width: "100%",
            borderBottom: `2px solid ${primaryColor}`,
            marginBottom: "20px",
            paddingBottom: "10px",
          }}
        >
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: primaryColor,
                  marginBottom: "2px",
                }}
              >
                {organization?.name || "Clinic Name"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#444",
                  marginBottom: "4px",
                }}
              >
                {organization?.phone ? `Ph: ${organization.phone}` : ""}
                {organization?.phone && organization?.email ? " | " : ""}
                {organization?.email || ""}
              </div>
              <div
                style={{ fontSize: "11px", color: "#666", maxWidth: "350px" }}
              >
                {address}
              </div>
            </td>
            <td style={{ textAlign: "right", verticalAlign: "top" }}>
              {organization?.logo && (
                <img
                  src={organization.logo}
                  alt="Logo"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                  }}
                />
              )}
            </td>
          </tr>
        </table>

        {/* 2. Patient Info Box */}
        <div
          style={{
            background: lightGrayBg,
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <div>
            <strong>Patient:</strong>{" "}
            {patient?.name || prescription?.patient_name || "N/A"}
            <br />
            <strong>Date:</strong> {formatDate(displayDate)}
            <br />
            <strong>Contact:</strong> {patient?.mobile || "N/A"}
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>Vitals:</strong> BP: {prescription?.vitals?.bp || "N/A"} |
            Weight: {prescription?.vitals?.weight || "N/A"} kg
            {/* Condition added here to hide session if it's a consultation */}
            {!consultation && (
              <>
                <br />
                <strong>Session:</strong> #{session?.session_number || "N/A"}{" "}
                {session?.type ? `(${session.type})` : ""}
              </>
            )}
            <br />
            <strong>ID:</strong> {prescription?.prescription_number || "N/A"}
          </div>
        </div>

        {/* 3. Plan / Consultation Notes */}
        {(plan || consultation) && (
          <div
            style={{ marginBottom: "20px", fontSize: "13px", padding: "0 5px" }}
          >
            <h4
              style={{
                color: primaryColor,
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "16px",
                borderBottom: `1px solid ${borderColor}`,
                paddingBottom: "4px",
              }}
            >
              {plan ? `Plan Overview: ${plan.plan_name}` : "Clinical Notes"}
            </h4>
            {plan && (
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontWeight: "bold" }}>Duration:</span>{" "}
                {formatDate(plan.start_date)} to {formatDate(plan.end_date)}
              </div>
            )}
            <div style={{ marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold" }}>Symptoms:</span>{" "}
              {plan?.symptoms || consultation?.symptoms || "N/A"}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold" }}>Diagnosis:</span>{" "}
              {plan?.diagnosis || consultation?.causes || "N/A"}
            </div>
            {consultation?.notes && (
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontWeight: "bold" }}>Additional Notes:</span>{" "}
                {consultation.notes}
              </div>
            )}
            {/* Condition added here to hide session remarks if it's a consultation */}
            {!consultation && session?.postsession_remarks && (
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontWeight: "bold" }}>Session Remarks:</span>{" "}
                {session.postsession_remarks}
              </div>
            )}
          </div>
        )}

        {/* 4. Session Schedule */}
        {plan?.all_sessions?.length > 0 && !consultation && (
          <>
            <h3
              style={{
                color: primaryColor,
                borderBottom: `1px solid ${borderColor}`,
                paddingBottom: "5px",
                marginTop: "30px",
                fontSize: "18px",
              }}
            >
              Session Schedule
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: primaryColor, color: "white" }}>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      fontSize: "12px",
                      width: "15%",
                    }}
                  >
                    Session
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      fontSize: "12px",
                      width: "25%",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      fontSize: "12px",
                      width: "35%",
                    }}
                  >
                    Time
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      fontSize: "12px",
                      width: "25%",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.all_sessions.map((s: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: `1px solid ${borderColor}` }}
                  >
                    <td style={{ padding: "10px", fontSize: "12px" }}>
                      <strong>#{s.session_number}</strong>
                    </td>
                    <td style={{ padding: "10px", fontSize: "12px" }}>
                      {formatDate(s.date)}
                    </td>
                    <td style={{ padding: "10px", fontSize: "12px" }}>
                      {s.start_time} - {s.end_time || "TBD"}
                    </td>
                    <td style={{ padding: "10px", fontSize: "12px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          backgroundColor:
                            s.status?.toLowerCase() === "completed"
                              ? "#d4edda"
                              : "#fff3cd",
                          color:
                            s.status?.toLowerCase() === "completed"
                              ? "#155724"
                              : "#856404",
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* 5. Prescription Table */}
        <h3
          style={{
            color: primaryColor,
            borderBottom: `1px solid ${borderColor}`,
            paddingBottom: "5px",
            marginTop: "30px",
            fontSize: "18px",
          }}
        >
          Rx - Prescription
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: primaryColor, color: "white" }}>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  fontSize: "12px",
                  width: "40%",
                }}
              >
                Drug Details
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  fontSize: "12px",
                  width: "15%",
                }}
              >
                Route
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  fontSize: "12px",
                  width: "25%",
                }}
              >
                Frequency
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  fontSize: "12px",
                  width: "10%",
                }}
              >
                Duration
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  fontSize: "12px",
                  width: "10%",
                }}
              >
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {prescription?.medications?.length > 0 ? (
              prescription.medications.map((med: any, index: number) => (
                <tr
                  key={index}
                  style={{ borderBottom: `1px solid ${borderColor}` }}
                >
                  <td
                    style={{
                      padding: "10px",
                      fontSize: "12px",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        display: "block",
                        color: "#000",
                      }}
                    >
                      <span
                        style={{
                          color: "#555",
                          fontWeight: "normal",
                          marginRight: "4px",
                        }}
                      >
                        {med.drug_type
                          ? `${getShortType(med.drug_type)} - `
                          : ""}
                      </span>
                      {med.drug_name}
                    </span>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        marginTop: "2px",
                      }}
                    >
                      Gen: {med.generic_name || "N/A"} | Str:{" "}
                      {med.strength || "N/A"}
                    </div>
                    {med.instructions && (
                      <div
                        style={{
                          fontStyle: "italic",
                          color: primaryColor,
                          fontSize: "11px",
                          marginTop: "4px",
                        }}
                      >
                        Note: {med.instructions}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontSize: "12px",
                      verticalAlign: "top",
                    }}
                  >
                    {med.route || "Oral"}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontSize: "12px",
                      verticalAlign: "top",
                    }}
                  >
                    {formatFrequency(med.frequency)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontSize: "12px",
                      verticalAlign: "top",
                    }}
                  >
                    {med.duration} Days
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontSize: "12px",
                      verticalAlign: "top",
                    }}
                  >
                    <strong>{med.quantity || "-"}</strong>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "10px" }}
                >
                  No medications prescribed.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 6. Notes & Footer */}
        {prescription?.notes && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderLeft: `4px solid ${primaryColor}`,
              fontSize: "12px",
              color: "#444",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <strong style={{ color: primaryColor }}>Note:</strong>{" "}
            {prescription.notes}
          </div>
        )}

        <div style={{ marginTop: "60px", textAlign: "right" }}>
          <p style={{ marginBottom: "2px" }}>
            <strong> {user?.name || prescription?.doctor_name || ""}</strong>
          </p>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "0" }}>
            {user?.specialization || "Gynaecologist"}
            <br />
            Reg No: {user?.registration_number || "N/A"}
          </p>
        </div>
      </div>
    );
  },
);

export default PrescriptionPrintTemplate;
