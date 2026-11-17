import React, { forwardRef } from "react";

interface RegistrationPrintTemplateProps {
  data: any;
}

const RegistrationPrintTemplate = forwardRef<
  HTMLDivElement,
  RegistrationPrintTemplateProps
>(({ data }, ref) => {
  if (!data) return null;

  const { patient, organization, doctor, metadata } = data;

  // --- Styling Constants (Synced with Prescription Template) ---
  const primaryColor = "#007B8E";
  const textColor = "#333";
  const lightGrayBg = "#f4f6f8";
  const borderColor = "#eee";

  // --- Helpers ---
  const orgName = organization?.name || "Clinic / Hospital Name";
  const orgAddress = organization?.address || {};
  const orgPhone = organization?.phone || "";
  const orgEmail = organization?.email || "";

  const addressString = [
    orgAddress?.street,
    orgAddress?.city,
    orgAddress?.state,
    orgAddress?.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const formatDateOnly = (dateStr: string) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const labelCellStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "12px",
    color: "#555",
    backgroundColor: lightGrayBg,
    borderBottom: `1px solid ${borderColor}`,
    fontWeight: 600,
    width: "20%",
  };

  const valueCellStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "13px",
    color: textColor,
    fontWeight: "bold",
    borderBottom: `1px solid ${borderColor}`,
    width: "30%",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    color: primaryColor,
    borderBottom: `1px solid ${borderColor}`,
    paddingBottom: "5px",
    marginTop: "30px",
    marginBottom: "10px",
    fontSize: "18px",
  };

  return (
    <div
      ref={ref}
      style={{
        padding: "30px",
        fontFamily: "'Helvetica', sans-serif",
        color: textColor,
        backgroundColor: "#fff",
        lineHeight: "1.4",
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <style type="text/css">
        {`
            @media print {
              @page { size: A4; margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
            }
          `}
      </style>

      {/* 1. Header Section */}
      <table
        style={{
          width: "100%",
          borderBottom: `2px solid ${primaryColor}`,
          marginBottom: "20px",
          paddingBottom: "10px",
        }}
      >
        <tbody>
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: primaryColor,
                  marginBottom: "2px",
                  textTransform: "uppercase",
                }}
              >
                {orgName}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#444",
                  marginBottom: "4px",
                }}
              >
                {orgPhone ? `Ph: ${orgPhone}` : ""}
                {orgPhone && orgEmail ? " | " : ""}
                {orgEmail || ""}
              </div>
              <div
                style={{ fontSize: "11px", color: "#666", maxWidth: "350px" }}
              >
                {addressString}
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
        </tbody>
      </table>

      {/* 2. Document Title */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2
          style={{
            margin: "0",
            fontSize: "18px",
            color: textColor,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Patient Registration Sheet
        </h2>
      </div>

      {/* 3. Top Info Box (Matches Prescription Top Box) */}
      <div
        style={{
          background: lightGrayBg,
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "13px",
          border: `1px solid ${borderColor}`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: "6px" }}>
            <span style={{ color: "#666" }}>Patient Name:</span>{" "}
            <strong style={{ fontSize: "15px" }}>
              {patient?.name || "N/A"}
            </strong>
          </div>
          <div style={{ marginBottom: "6px" }}>
            <span style={{ color: "#666" }}>Registration Date:</span>{" "}
            <strong>{formatDateOnly(patient?.registration_date)}</strong>
          </div>
          <div>
            <span style={{ color: "#666" }}>Primary Doctor:</span>{" "}
            <strong>{doctor?.name || "N/A"}</strong>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            textAlign: "center",
            borderLeft: `1px solid ${borderColor}`,
            borderRight: `1px solid ${borderColor}`,
            padding: "0 15px",
            margin: "0 15px",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            <span style={{ color: "#666" }}>UHID:</span>{" "}
            <strong style={{ fontSize: "16px", color: primaryColor }}>
              {patient?.uhid || "N/A"}
            </strong>
          </div>
          <div style={{ marginBottom: "6px" }}>
            <span style={{ color: "#666" }}>Age/Gender:</span>{" "}
            <strong>
              {patient?.age || "N/A"} / {patient?.gender || "N/A"}
            </strong>
          </div>
          <div>
            <span style={{ color: "#666" }}>Contact:</span>{" "}
            <strong>{patient?.mobile || "N/A"}</strong>
          </div>
        </div>

        <div
          style={{
            width: "90px",
            height: "100px",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#fff",
            border: `1px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {patient?.image ? (
            <img
              src={patient.image}
              alt="Patient"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{ color: "#999", fontSize: "11px", textAlign: "center" }}
            >
              No Photo
            </span>
          )}
        </div>
      </div>

      {/* 4. Personal Information */}
      <h3 style={sectionHeaderStyle}>Personal Information</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <tbody>
          <tr>
            <td style={labelCellStyle}>Date of Birth</td>
            <td style={valueCellStyle}>
              {formatDateOnly(patient?.date_of_birth)}
            </td>
            <td style={labelCellStyle}>Marital Status</td>
            <td style={valueCellStyle}>{patient?.marital_status}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Alt / Guardian No.</td>
            <td style={valueCellStyle}>
              {patient?.alternate_mobile !== "N/A"
                ? patient?.alternate_mobile
                : patient?.guardian_phone}
            </td>
            <td style={labelCellStyle}>Email</td>
            <td style={valueCellStyle}>{patient?.email}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Full Address</td>
            <td colSpan={3} style={{ ...valueCellStyle, width: "80%" }}>
              {patient?.address_full}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Background & Referral Information */}
      <h3 style={sectionHeaderStyle}>Background & Referral</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <tbody>
          <tr>
            <td style={labelCellStyle}>Education</td>
            <td style={valueCellStyle}>{patient?.education}</td>
            <td style={labelCellStyle}>Occupation</td>
            <td style={valueCellStyle}>{patient?.occupation}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Annual Income</td>
            <td style={valueCellStyle}>{patient?.annual_income}</td>
            <td style={labelCellStyle}>Identity Card</td>
            <td style={valueCellStyle}>{patient?.identity_card}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Referral Source</td>
            <td style={valueCellStyle}>{patient?.referral_source}</td>
            <td style={labelCellStyle}>Referral Details</td>
            <td style={valueCellStyle}>{patient?.referral_details}</td>
          </tr>
        </tbody>
      </table>

      {/* 6. Emergency Contact */}
      <h3 style={sectionHeaderStyle}>Emergency Contact</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <tbody>
          <tr>
            <td style={labelCellStyle}>Contact Name</td>
            <td style={valueCellStyle}>{patient?.emergency_contact?.name}</td>
            <td style={labelCellStyle}>Relationship</td>
            <td style={valueCellStyle}>
              {patient?.emergency_contact?.relationship}
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Phone Number</td>
            <td colSpan={3} style={valueCellStyle}>
              {patient?.emergency_contact?.phone}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 7. Footer & Signatures */}
      <div
        style={{
          marginTop: "60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ textAlign: "center", width: "220px" }}>
          <div
            style={{
              borderBottom: `1px solid ${textColor}`,
              height: "40px",
              marginBottom: "8px",
            }}
          ></div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#444" }}>
            Patient / Guardian Signature
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              borderBottom: `1px solid ${textColor}`,
              height: "40px",
              marginBottom: "8px",
              width: "220px",
              display: "inline-block",
            }}
          ></div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#444",
              textAlign: "center",
              width: "220px",
              float: "right",
            }}
          >
            Authorized Signatory
          </div>
          <div style={{ clear: "both" }}></div>
        </div>
      </div>

      <div
        style={{
          marginTop: "40px",
          paddingTop: "15px",
          borderTop: `1px solid ${borderColor}`,
          fontSize: "11px",
          color: "#999",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Document: {metadata?.document_type || "Registration"}</span>
        <span>
          Printed On:{" "}
          {metadata?.printed_on
            ? new Date(metadata.printed_on).toLocaleString()
            : new Date().toLocaleString()}
        </span>
      </div>
    </div>
  );
});

export default RegistrationPrintTemplate;
