import React from "react";

interface PlanPrintTemplateProps {
  data: any;
}

const PlanPrintTemplate = React.forwardRef<
  HTMLDivElement,
  PlanPrintTemplateProps
>(({ data }, ref) => {
  if (!data) return <div ref={ref}></div>;

  // Handle nested data structures gracefully
  const actualData = data.data ? data.data : data;
  const { plan, patient, organization, doctor, metadata } = actualData;

  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: "#475569",
    fontSize: "12px",
    padding: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#f8fafc",
    width: "20%",
  };

  const valueStyle: React.CSSProperties = {
    padding: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    color: "#0f172a",
    width: "30%",
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      ref={ref}
      style={{
        padding: "40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#fff",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <style type="text/css">
        {`
            @media print { 
              @page { size: A4; margin: 0; } 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}
      </style>

      {/* 1. Organization Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "2px solid #0f172a",
          paddingBottom: "15px",
          marginBottom: "20px",
        }}
      >
        {organization?.logo ? (
          <img
            src={organization.logo}
            alt="Org Logo"
            style={{
              width: "80px",
              height: "80px",
              objectFit: "contain",
              marginRight: "20px",
            }}
          />
        ) : null}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: "0 0 5px 0",
              fontSize: "24px",
              color: "#0f172a",
              textTransform: "uppercase",
            }}
          >
            {organization?.name || "Clinic"}
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
            {organization?.address?.street}, {organization?.address?.city},{" "}
            {organization?.address?.state} - {organization?.address?.zip}
          </p>
          <p
            style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#475569" }}
          >
            Phone: {organization?.phone} | Email: {organization?.email}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#334155" }}>
            THERAPY PLAN
          </h2>
          <p
            style={{ margin: "5px 0 0 0", fontSize: "11px", color: "#64748b" }}
          >
            Printed On: {formatDate(metadata?.printed_on)}
          </p>
        </div>
      </div>

      {/* 2. Patient Details */}
      <h3
        style={{
          fontSize: "16px",
          marginBottom: "10px",
          color: "#1e293b",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "5px",
        }}
      >
        Patient Information
      </h3>

      <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
        {/* Patient Image Box */}
        {patient?.image && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={patient.image}
              alt="Patient"
              style={{
                width: "110px",
                height: "130px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>
        )}

        {/* Patient Info Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td style={labelStyle}>Patient Name</td>
              <td style={valueStyle}>{patient?.name}</td>
              <td style={labelStyle}>UHID</td>
              <td style={valueStyle}>{patient?.uhid}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Age / Gender</td>
              <td style={valueStyle}>
                {patient?.age} Yrs / {patient?.gender}
              </td>
              <td style={labelStyle}>Mobile</td>
              <td style={valueStyle}>{patient?.mobile}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Email</td>
              <td style={valueStyle}>{patient?.email || "N/A"}</td>
              <td style={labelStyle}>Blood Group</td>
              <td style={valueStyle}>{patient?.blood_group || "N/A"}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Marital Status</td>
              <td style={valueStyle}>{patient?.marital_status}</td>
              <td style={labelStyle}>Consulting Dr.</td>
              <td style={{ ...valueStyle, fontWeight: "bold" }}>
                {doctor?.name}
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>Address</td>
              <td style={valueStyle} colSpan={3}>
                {patient?.address_full}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Therapy Plan Details */}
      <h3
        style={{
          fontSize: "16px",
          marginBottom: "10px",
          color: "#1e293b",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "5px",
        }}
      >
        Plan Details
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "25px",
        }}
      >
        <tbody>
          <tr>
            <td style={labelStyle}>Plan Name</td>
            <td style={valueStyle}>{plan?.name}</td>
            <td style={labelStyle}>Status</td>
            <td
              style={{
                ...valueStyle,
                fontWeight: "bold",
                color: plan?.status === "Active" ? "#16a34a" : "#0f172a",
              }}
            >
              {plan?.status?.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Category</td>
            <td style={valueStyle}>{plan?.category}</td>
            <td style={labelStyle}>Duration</td>
            <td style={valueStyle}>
              {formatDate(plan?.start_date)} to {formatDate(plan?.end_date)}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Diagnosis</td>
            <td style={valueStyle} colSpan={3}>
              {plan?.diagnosis}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Symptoms</td>
            <td style={valueStyle} colSpan={3}>
              {plan?.symptoms}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Total Sessions</td>
            <td style={valueStyle}>{plan?.estimated_sessions}</td>
            <td style={labelStyle}>Completed</td>
            <td style={valueStyle}>{plan?.completed_sessions}</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Financial Details */}
      <h3
        style={{
          fontSize: "16px",
          marginBottom: "10px",
          color: "#1e293b",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "5px",
        }}
      >
        Financial Summary
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "40px",
        }}
      >
        <tbody>
          <tr>
            <td style={labelStyle}>Payment Type</td>
            <td style={valueStyle}>{plan?.payment_type?.replace("-", " ")}</td>
            <td style={labelStyle}>Total Amount</td>
            <td style={valueStyle}>₹ {plan?.total_amount}</td>
          </tr>
          <tr>
            <td style={labelStyle}>Amount Received</td>
            <td style={valueStyle}>₹ {plan?.received_amount}</td>
            <td style={labelStyle}>Balance Due</td>
            <td
              style={{
                ...valueStyle,
                color: Number(plan?.balance) > 0 ? "#dc2626" : "#16a34a",
                fontWeight: "bold",
              }}
            >
              ₹ {plan?.balance}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Signatures */}
      <div
        style={{
          marginTop: "80px",
          display: "flex",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ textAlign: "center", width: "200px" }}>
          <div
            style={{
              borderBottom: "1px solid #000",
              height: "40px",
              marginBottom: "10px",
            }}
          ></div>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>
            Patient Signature
          </span>
        </div>

        <div style={{ textAlign: "center", width: "200px" }}>
          <div
            style={{
              borderBottom: "1px solid #000",
              height: "40px",
              marginBottom: "10px",
            }}
          ></div>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>
            Authorized Signatory
          </span>
          <br />
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            {organization?.name}
          </span>
        </div>
      </div>
    </div>
  );
});

export default PlanPrintTemplate;
