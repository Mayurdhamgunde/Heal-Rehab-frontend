import React from "react";

interface ConsentPrintTemplateProps {
  data: any;
}

const ConsentPrintTemplate = React.forwardRef<
  HTMLDivElement,
  ConsentPrintTemplateProps
>(({ data }, ref) => {
  if (!data) return <div ref={ref}></div>;

  const actualData = data.data ? data.data : data;
  const { patient, organization, consent } = actualData;

  const orgName = organization?.name || "The Institute";

  const PRIMARY = "#000000";
  const TEXT_DARK = "#000000";
  const TEXT_MUTED = "#333333";
  const BORDER = "#000000";

  const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const regNo = consent?.reg_no || "";
  const regNoSlashIdx = regNo.indexOf("/");
  const uhidStr =
    regNoSlashIdx === -1 ? regNo : regNo.slice(0, regNoSlashIdx).trim();
  const ipdStr =
    regNoSlashIdx === -1 ? "" : regNo.slice(regNoSlashIdx + 1).trim();
  const apStr =
    patient?.address_breakdown?.ap ||
    patient?.address_breakdown?.address ||
    patient?.address_full ||
    patient?.address ||
    "";
  const tqStr = patient?.address_breakdown?.tq || "";
  const distStr = patient?.address_breakdown?.dist || "";

  const displayDate = consent?.date
    ? formatDateOnly(consent.date)
    : "____ / ____ / 20____";

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
          }
          .consent-print-root * { box-sizing: border-box; }
          .consent-table {
            border-collapse: collapse;
            width: 100%;
            table-layout: fixed;
          }
          .consent-table td {
            border: 1px solid ${BORDER};
            padding: 7px 11px;
            font-size: 12.5px;
            line-height: 1.35;
            vertical-align: middle;
            white-space: normal;
            overflow-wrap: break-word;
            word-break: break-word;
          }
          
          /* Condensing the second page to prevent spilling onto page 3 */
          .bilingual-block {
            margin-bottom: 4px; 
          }
          .marathi-text {
            font-family: 'Sura', serif;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.25;
            margin-bottom: 0px;
          }
          .english-text {
            font-family: 'Cambria', Georgia, serif;
            font-size: 11.5px;
            font-style: italic;
            color: #333;
            line-height: 1.15;
            margin-bottom: 2px;
          }
        `}</style>

      <div
        className="consent-print-root"
        style={{
          fontFamily: "'Cambria', Georgia, serif",
          backgroundColor: "#ffffff",
          color: TEXT_DARK,
          fontSize: "14px",
          lineHeight: "1.5",
          width: "100%",
          maxWidth: "210mm",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ========================================== */}
        {/*                 PAGE 1                     */}
        {/* ========================================== */}
        <div
          style={{ height: "273mm", display: "flex", flexDirection: "column" }}
        >
          {/* ── HEADER ── */}
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
                  {orgName.charAt(0) || "L"}
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
                  fontFamily: "'Cambria', serif",
                }}
              >
                {orgName}
              </div>
            </div>
          </div>

          {/* ── DOCUMENT TITLE & REGISTRATION INFO ROW ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              position: "relative",
              borderBottom: `2px solid ${BORDER}`,
              paddingBottom: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "0",
                bottom: "8px",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <strong>UHID:</strong> {uhidStr || "—"}
              {"  |  "}
              <strong>IPD:</strong> {ipdStr || "—"}
            </div>

            <div
              style={{
                fontSize: "18px",
                fontFamily: "'Cambria', serif",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: TEXT_DARK,
                textAlign: "center",
              }}
            >
              Consent /{" "}
              <span
                style={{ fontFamily: "'Sura', serif", textTransform: "none" }}
              >
                संमतीपत्र
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                fontFamily: "'Cambria', serif",
                right: "0",
                bottom: "8px",
                textAlign: "right",
                fontSize: "13px",
              }}
            >
              <strong>Date:</strong> {formatDateOnly(consent?.date) || "—"}
            </div>
          </div>

          {/* ── DECLARATION TEXT ── */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.5",
                textAlign: "justify",
                marginBottom: "12px",
              }}
            >
              I/We have been informed by the authorities that the undersigned
              person in a photograph who is under treatment at{" "}
              <strong>{orgName}</strong> is a high-risk patient. This could
              result in a serious casualty or even a sudden death. We have also
              been made aware that <strong>{orgName}</strong> does not have any
              emergency medical facilities to cater to these kinds of incidents.
              We hereby agree in the event of any such untoward incident
              including death, we would not hold <strong>{orgName}</strong> or
              any of its staff responsible for the same.
            </div>

            <div
              style={{
                fontFamily: "'Sura', serif",
                fontSize: "14px",
                lineHeight: "1.6",
                textAlign: "justify",
                fontWeight: 700,
              }}
            >
              आयुष व्यसनमुक्ती उपचार व संशोधन केंद्र के अधिकारीओ / कर्मचारीयो ने
              हमे, हमारा मरीज, जिसने नीचे दस्तखत किया है, और जो केंद्र से उपचार
              लेने वाला है, उसके चिंताजनक प्रकृती के बारे मे जानकारी दी है। मरीज
              कि यह स्थिती मरीज को गंभीर पहुंचा सकती है या इस मे उसकी जान जा
              सकती है। इस परिस्थिती को निपटने के लिये आयुष व्यसनमुक्ती उपचार व
              संशोधन केंद्र के पास कोई आपत्कालीन सुविधा नही है। इस बारे मे हमे
              बताया गया है। इस तरह की कोई अघटीत घटना घट जाती है, जिस मे मरीज की
              मौत भी शामील होगी तो यह हमे मंजूर होगी। इस के लिये हम आयुष
              व्यसनमुक्ती उपचार व संशोधन केंद्र, या उसके कर्मचारी या उसका
              व्यवस्थापन को जिम्मेदार नही ठहराएंगे।
            </div>
          </div>

          {/* ── PHOTOS & SIGNATURES ROW ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: "20px",
              marginBottom: "18px",
            }}
          >
            {/* Witness Block */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "105px",
                  height: "120px",
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {consent?.photos?.witness_photo ? (
                  <img
                    src={consent.photos.witness_photo}
                    alt="Witness"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "11.5px", color: TEXT_MUTED }}>
                    Photo
                  </span>
                )}
              </div>

              {/* Signature area */}
              <div style={{ width: "200px", textAlign: "center" }}>
                <div style={{ height: "30px" }} />
                <div
                  style={{
                    borderTop: `1px solid ${TEXT_DARK}`,
                    paddingTop: "5px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                  }}
                >
                  {consent?.witness_name || "Witness Signature"}
                </div>
                <div style={{ fontSize: "11.5px", color: TEXT_MUTED }}>
                  Relation: {consent?.witness_relationship || "—"}
                </div>
              </div>
            </div>

            {/* Patient Block */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "105px",
                  height: "120px",
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {consent?.photos?.patient_photo ? (
                  <img
                    src={consent.photos.patient_photo}
                    alt="Patient"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "11.5px", color: TEXT_MUTED }}>
                    Photo
                  </span>
                )}
              </div>

              {/* Signature area */}
              <div style={{ width: "200px", textAlign: "center" }}>
                <div style={{ height: "30px" }} />
                <div
                  style={{
                    borderTop: `1px solid ${TEXT_DARK}`,
                    paddingTop: "5px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                  }}
                >
                  {patient?.name || "Patient Signature"}
                </div>
                <div
                  style={{
                    fontSize: "12.5px",
                    color: TEXT_MUTED,
                    fontFamily: "'Sura', serif",
                    fontWeight: 700,
                  }}
                >
                  मरीज कि स्वाक्षरी
                </div>
              </div>
            </div>
          </div>

          {/* ── PATIENT INFORMATION PROFILE TABLE ── */}
          <div>
            <div
              style={{
                fontWeight: 800,
                fontFamily: "'Cambria', serif",
                marginBottom: "6px",
                textTransform: "uppercase",
                fontSize: "13px",
              }}
            >
              TREATMENT DAYS: {patient?.treatment_days || "—"}
            </div>
            <table className="consent-table">
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <strong>Full Name:</strong> {patient?.name || "—"}
                  </td>
                  <td>
                    <strong>Age/Sex:</strong>{" "}
                    {patient?.age ? `${patient.age} Yrs` : "—"} /{" "}
                    {patient?.gender?.toUpperCase() || "—"}
                  </td>
                  <td>
                    <strong>DOB:</strong> {formatDateOnly(patient?.dob) || "—"}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong>Address (A/P):</strong> {apStr || "—"}
                  </td>
                  <td>
                    <strong>City:</strong> {tqStr || "—"}
                  </td>
                  <td>
                    <strong>State:</strong> {distStr || "—"}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong>Education:</strong> {patient?.education || "—"}
                  </td>
                  <td>
                    <strong>Occupation:</strong> {patient?.occupation || "—"}
                  </td>
                  <td>
                    <strong>Marital Status:</strong>{" "}
                    {patient?.marital_status || "—"}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Caste:</strong> {patient?.caste || "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <strong>Mobile No:</strong> {patient?.mobile || "—"}
                  </td>
                  <td colSpan={2}>
                    <strong>
                      I-Card ({patient?.identity_card?.type || "AADHAR"}):
                    </strong>{" "}
                    {patient?.identity_card?.number || "—"}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ whiteSpace: "nowrap" }}>
                    <strong>
                      {patient?.guardian_relation
                        ? `${patient.guardian_relation}'s No:`
                        : "Guardian Ph 1:"}
                    </strong>{" "}
                    {patient?.guardian_phone || "—"}
                  </td>
                  <td colSpan={2} style={{ whiteSpace: "nowrap" }}>
                    <strong>
                      {patient?.guardian_relation_2
                        ? `${patient.guardian_relation_2}'s No:`
                        : "Guardian Ph 2:"}
                    </strong>{" "}
                    {patient?.guardian_phone_2 || "—"}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong>Annual Income:</strong>{" "}
                    {patient?.annual_income || "—"}
                  </td>
                  <td colSpan={2}>
                    <strong>E-Mail:</strong> {patient?.email || "—"}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong>Prior Treatment:</strong>{" "}
                    {patient?.prior_treatment || "—"}
                  </td>
                  <td colSpan={2}>
                    <strong>Referred By:</strong> {patient?.referred_by || "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ flex: 1 }} />
          <div
            style={{
              textAlign: "center",
              fontSize: "10.5px",
              color: TEXT_MUTED,
              borderTop: `1px solid ${BORDER}`,
              paddingTop: "9px",
              marginTop: "14px",
              fontStyle: "italic",
            }}
          >
            Confidential — For Ayush Institute's Use Only
          </div>
        </div>

        {/* ========================================== */}
        {/*                 PAGE 2                     */}
        {/* ========================================== */}
        <div
          style={{
            breakBefore: "page",
            pageBreakBefore: "always",
            paddingTop: "10px",
            display: "flex",
            flexDirection: "column",
            maxHeight:
              "270mm" /* Restricting to fit strictly within 2nd page limits */,
            overflow: "hidden",
          }}
        >
          {/* Header Title for Page 2 */}
          <div
            style={{
              textAlign: "center",
              borderBottom: `2px solid ${BORDER}`,
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            <div className="marathi-text" style={{ fontSize: "15px" }}>
              माहितीपूर्वक संमतीपत्र
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: "bold", marginTop: "2px" }}
            >
              Informed Consent for Admission & Treatment
            </div>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <h4
              style={{
                margin: "0 0 4px 0",
                textDecoration: "underline",
                fontSize: "13.5px",
              }}
            >
              <span style={{ fontFamily: "'Sura', serif" }}>
                माहितीपूर्वक संमती
              </span>{" "}
              / Informed Consent
            </h4>

            <div className="bilingual-block">
              <div className="marathi-text">
                मी, खाली सही करणारा/करणारी, माझ्या स्वेच्छेने खालील बाबींना
                संमती देत आहे.
              </div>
              <div className="english-text">
                I, the undersigned, voluntarily give my consent to the
                following:
              </div>
            </div>

            <div className="bilingual-block">
              <div className="marathi-text">
                मला माझ्या व्यसनासंबंधी आजाराची, उपचाराची आवश्यकता, उपचारपद्धती,
                संभाव्य लाभ, जोखीम व उपचाराचा कालावधी याबाबत समजेल अशा भाषेत
                माहिती देण्यात आली आहे.
              </div>
              <div className="english-text">
                I have been informed, in a language I understand, about my
                substance use disorder, the need for treatment, the proposed
                treatment plan, expected benefits, possible risks, and the
                expected duration of treatment.
              </div>
            </div>

            <div className="bilingual-block">
              <div className="marathi-text">
                मी आयुष व्यसनमुक्ती उपचार व संशोधन केंद्रात स्वेच्छेने दाखल होत
                असून माझ्यावर आवश्यकतेनुसार आयुर्वेद, योग, समुपदेशन, मानसोपचार,
                औषधोपचार तसेच इतर आवश्यक उपचार करण्यास माझी संमती आहे.
              </div>
              <div className="english-text">
                I am voluntarily seeking admission to Ayush De-Addiction
                Treatment & Research Centre and consent to receive Ayurveda,
                Yoga, counselling, psychotherapy, medications, and any other
                treatment considered necessary for my care.
              </div>
            </div>

            <div className="bilingual-block">
              <div className="marathi-text">
                उपचारादरम्यान केंद्राचे नियम, शिस्त, सुरक्षा व उपचाराशी संबंधित
                सूचना पाळण्याची मी जबाबदारी स्वीकारतो/स्वीकारते.
              </div>
              <div className="english-text">
                I agree to follow the rules, discipline, safety measures, and
                treatment-related instructions of the Centre during my stay.
              </div>
            </div>

            <div className="bilingual-block">
              <div className="marathi-text">
                माझी वैद्यकीय माहिती गोपनीय ठेवली जाईल. कायद्याने आवश्यक असल्यास
                किंवा माझ्या उपचाराच्या हितासाठी अधिकृत व्यक्तींनाच ती उपलब्ध
                करून दिली जाईल.
              </div>
              <div className="english-text">
                My medical information will remain confidential and will only be
                disclosed to authorized persons when required by law or for my
                treatment.
              </div>
            </div>

            <div className="bilingual-block">
              <div className="marathi-text">
                मला उपचाराबाबत प्रश्न विचारण्याची संधी देण्यात आली असून माझ्या
                सर्व शंकांचे समाधानकारक निरसन करण्यात आले आहे.
              </div>
              <div className="english-text">
                I have been given the opportunity to ask questions regarding my
                treatment, and all my queries have been answered satisfactorily.
              </div>
            </div>

            <div className="bilingual-block">
              <div className="marathi-text">
                मी कोणत्याही दबाव, धमकी किंवा फसवणुकीशिवाय ही संमती स्वेच्छेने
                देत आहे.
              </div>
              <div className="english-text">
                I am giving this consent voluntarily without any force,
                coercion, threat, or misrepresentation.
              </div>
            </div>

            <div className="bilingual-block" style={{ marginBottom: 0 }}>
              <div className="marathi-text">
                Mental Healthcare Act, 2017 अंतर्गत माझ्या हक्कांविषयी मला
                माहिती देण्यात आली आहे.
              </div>
              <div className="english-text">
                I have been informed about my rights under the Mental Healthcare
                Act, 2017.
              </div>
            </div>
          </div>

          {/* Section: Declaration */}
          <div
            style={{
              border: `1px solid ${BORDER}`,
              padding: "6px 8px",
              marginBottom: "6px",
            }}
          >
            <h4 style={{ margin: "0 0 2px 0", fontSize: "12.5px" }}>
              <span style={{ fontFamily: "'Sura', serif" }}>घोषणा</span> /
              Declaration
            </h4>
            <div className="marathi-text">
              मी वरील सर्व माहिती वाचली आहे किंवा मला वाचून दाखविण्यात आली आहे.
              ती मला समजली असून मी स्वेच्छेने उपचारासाठी संमती देत आहे.
            </div>
            <div className="english-text">
              I have read the above information or it has been read out to me in
              a language I understand. I have understood it and voluntarily
              consent to receive treatment.
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "35px",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              <div>
                <span style={{ fontFamily: "'Sura', serif" }}>
                  रुग्णाची स्वाक्षरी/अंगठा
                </span>{" "}
                / Patient's Signature/Thumb Impression: _______________________
              </div>
              <div>
                <span style={{ fontFamily: "'Sura', serif" }}>दिनांक</span> /
                Date: {displayDate}
              </div>
            </div>
          </div>

          {/* Section: Nominated Representative */}
          <div
            style={{
              border: `1px solid ${BORDER}`,
              padding: "6px 8px",
              marginBottom: "6px",
            }}
          >
            <h4 style={{ margin: "0 0 2px 0", fontSize: "12.5px" }}>
              <span style={{ fontFamily: "'Sura', serif" }}>
                नामनिर्देशित प्रतिनिधीची संमती (लागू असल्यास)
              </span>{" "}
              / Consent of Nominated Representative (If Applicable)
            </h4>
            <div className="marathi-text">
              मी रुग्णाचा नामनिर्देशित प्रतिनिधी/जवळचा नातेवाईक असून वरील माहिती
              समजून घेतली आहे व उपचारास माझी संमती आहे.
            </div>
            <div className="english-text">
              I am the patient's Nominated Representative/nearest relative. I
              have understood the above information and hereby provide my
              consent for the patient's treatment.
            </div>

            <div
              style={{
                marginTop: "10px",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "35px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "'Sura', serif" }}>नाव</span> /
                  Name:{" "}
                  {consent?.witness_name ? (
                    <u>{consent.witness_name}</u>
                  ) : (
                    "___________________________"
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "'Sura', serif" }}>नाते</span> /
                  Relationship:{" "}
                  {consent?.witness_relationship ? (
                    <u>{consent.witness_relationship}</u>
                  ) : (
                    "_____________________"
                  )}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "'Sura', serif" }}>स्वाक्षरी</span>{" "}
                  / Signature: ____________________
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "'Sura', serif" }}>दिनांक</span> /
                  Date: {displayDate}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Medical Officer */}
          <div style={{ border: `1px solid ${BORDER}`, padding: "6px 8px" }}>
            <h4 style={{ margin: "0 0 2px 0", fontSize: "12.5px" }}>
              <span style={{ fontFamily: "'Sura', serif" }}>
                वैद्यकीय अधिकाऱ्याचे प्रमाणपत्र
              </span>{" "}
              / Medical Officer's Certificate
            </h4>
            <div className="marathi-text">
              मी रुग्ण/नामनिर्देशित प्रतिनिधी यांना उपचार, संभाव्य लाभ, जोखीम,
              पर्यायी उपचार व रुग्णांचे अधिकार समजेल अशा भाषेत समजावून सांगितले
              आहेत. त्यांनी ती माहिती समजून स्वेच्छेने संमती दिली आहे.
            </div>
            <div className="english-text">
              I certify that I have explained the nature of the illness,
              proposed treatment, expected benefits, possible risks, alternative
              treatment options, and the patient's rights in a language
              understood by the patient/Nominated Representative. They have
              voluntarily provided informed consent.
            </div>

            <div
              style={{
                marginTop: "10px",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <span style={{ fontFamily: "'Sura', serif" }}>
                  वैद्यकीय अधिकाऱ्याचे नाव
                </span>{" "}
                / Name of Medical Officer:{" "}
                {organization?.head?.name ? (
                  <u>
                    {organization.head.name}
                    {organization.head.degree
                      ? `, ${organization.head.degree}`
                      : ""}
                  </u>
                ) : (
                  "_______________________"
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {/* Left Side: Registration & Date */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontFamily: "'Sura', serif" }}>
                      नोंदणी क्रमांक
                    </span>{" "}
                    / Registration No.:{" "}
                    {organization?.head?.reg_no ? (
                      <u>{organization.head.reg_no}</u>
                    ) : (
                      "_______________________"
                    )}
                  </div>
                  <div style={{ marginTop: "65px" }}>
                    <span style={{ fontFamily: "'Sura', serif" }}>दिनांक</span>{" "}
                    / Date: {displayDate}
                  </div>
                </div>

                {/* Right Side: Stamp & Signature Space */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    width: "45%",
                  }}
                >
                  <div style={{ marginTop: "65px", textAlign: "center" }}>
                    <div
                      style={{
                        borderBottom: "1px solid #000",
                        marginBottom: "4px",
                      }}
                    ></div>
                    <div>
                      <span style={{ fontFamily: "'Sura', serif" }}>
                        स्वाक्षरी व शिक्का
                      </span>{" "}
                      / Signature & Seal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer for bottom layout on Page 2 */}
          <div style={{ flex: 1 }} />
          <div
            style={{
              textAlign: "center",
              fontSize: "10px",
              color: TEXT_MUTED,
              borderTop: `1px solid ${BORDER}`,
              paddingTop: "6px",
              marginTop: "4px",
              fontStyle: "italic",
            }}
          >
            Confidential — For Ayush Institute's Use Only
          </div>
        </div>
      </div>
    </div>
  );
});

ConsentPrintTemplate.displayName = "ConsentPrintTemplate";
export default ConsentPrintTemplate;
