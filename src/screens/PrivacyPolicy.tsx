import React, { useState } from "react";
import styles from "../css/PrivacyPolicy.module.css";

const PrivacyPolicy: React.FC = () => {
  const [openSection, setOpenSection] = useState<number>(1);

  const toggleSection = (sectionNumber: number) => {
    if (openSection === sectionNumber) {
      setOpenSection(0);
    } else {
      setOpenSection(sectionNumber);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerBanner}>
        <div className={styles.headerContent}>
          <h1>Privacy Policy</h1>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.introBox}>
          <p>
            Welcome to HealTrack. Please read this Privacy Policy carefully
            before using our services. By accessing or using HealTrack, you
            agree to be bound by these terms.
          </p>
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(1)}
          >
            <h2>1. Introduction</h2>
            <span
              className={openSection === 1 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 1 && (
            <div className={styles.sectionContent}>
              <p>
                At HealTrack, we prioritize your privacy and are committed to
                safeguarding your personal information. This Privacy Policy
                outlines how we collect, use, disclose, and protect your data
                when you access our physiotherapy and wellness services. By
                using HealTrack, you consent to the practices described in this
                policy.
              </p>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(2)}
          >
            <h2>2. Information We Collect</h2>
            <span
              className={openSection === 2 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 2 && (
            <div className={styles.sectionContent}>
              <p>
                We collect the following types of information to provide and
                improve our services:
              </p>
              <ul>
                <li>
                  <strong>Personal Information:</strong> Name, contact details,
                  gender, date of birth, and government-issued ID (if required
                  for verification).
                </li>
                <li>
                  <strong>Health Information:</strong> Medical history,
                  consultation records, physiotherapy treatment plans, and other
                  health-related data provided by you or your healthcare
                  professional.
                </li>
                <li>
                  <strong>Payment Information:</strong> Billing details,
                  transaction history, and payment method details for services
                  availed.
                </li>
                <li>
                  <strong>Device and Usage Data:</strong> IP address, device
                  type, operating system, app interactions, and other technical
                  data for analytics and security purposes.
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(3)}
          >
            <h2>3. How We Use Your Information</h2>
            <span
              className={openSection === 3 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 3 && (
            <div className={styles.sectionContent}>
              <p>HealTrack uses your information to:</p>
              <ul>
                <li>
                  Deliver physiotherapy consultations, wellness plans, and
                  related services.
                </li>
                <li>
                  Provide a personalized user experience based on your health
                  needs.
                </li>
                <li>Process payments and issue invoices securely.</li>
                <li>
                  Ensure regulatory compliance under applicable laws in India
                  (IT Act, 2000) and the United States (HIPAA and state privacy
                  laws).
                </li>
                <li>
                  Improve platform security, customer support, and overall
                  service efficiency.
                </li>
                <li>
                  Send updates, reminders, and promotional content (you can opt
                  out at any time).
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(4)}
          >
            <h2>4. Data Sharing and Disclosure</h2>
            <span
              className={openSection === 4 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 4 && (
            <div className={styles.sectionContent}>
              <ul>
                <li>
                  <strong>With Healthcare Professionals:</strong> Your
                  health-related data is shared only with authorized
                  physiotherapists and wellness experts for consultations and
                  treatment plans.
                </li>
                <li>
                  <strong>With Service Providers:</strong> Payment processors,
                  cloud storage providers, and analytics platforms may access
                  necessary data for operational purposes.
                </li>
                <li>
                  <strong>Legal and Compliance Requirements:</strong> If
                  required by law or regulatory authorities, we may disclose
                  necessary information in accordance with legal obligations.
                </li>
                <li>
                  <strong>No Third-Party Sales:</strong> We do not sell your
                  personal data to third parties for marketing purposes.
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(5)}
          >
            <h2>5. Data Security</h2>
            <span
              className={openSection === 5 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 5 && (
            <div className={styles.sectionContent}>
              <p>
                HealTrack employs industry-standard security measures, including
                encryption, secure servers, and access controls, to protect your
                personal and health information. While we take every precaution,
                no online service can guarantee absolute security.
              </p>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(6)}
          >
            <h2>6. Your Rights</h2>
            <span
              className={openSection === 6 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 6 && (
            <div className={styles.sectionContent}>
              <ul>
                <li>
                  <strong>Access and Correction:</strong> You may request access
                  to or correction of your personal data.
                </li>
                <li>
                  <strong>Data Deletion:</strong> You can request account
                  deletion, subject to regulatory and contractual obligations.
                </li>
                <li>
                  <strong>Marketing Preferences:</strong> You may opt out of
                  promotional communications at any time.
                </li>
                <li>
                  <strong>Region-Specific Rights:</strong> Users in the U.S. may
                  have additional rights under HIPAA and state-specific
                  regulations.
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(7)}
          >
            <h2>7. Retention of Data</h2>
            <span
              className={openSection === 7 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 7 && (
            <div className={styles.sectionContent}>
              <p>
                We retain your personal and health information only as long as
                necessary for service delivery, compliance, and legitimate
                business purposes. Once data is no longer required, it is
                securely deleted or anonymized.
              </p>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(8)}
          >
            <h2>8. Changes to This Policy</h2>
            <span
              className={openSection === 8 ? styles.minus : styles.plus}
            ></span>
          </div>
          {openSection === 8 && (
            <div className={styles.sectionContent}>
              <p>
                HealTrack may update this Privacy Policy from time to time to
                reflect changes in laws, regulations, or business practices. We
                encourage users to review this policy periodically. Continued
                use of HealTrack constitutes acceptance of any updates.
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p>
            For any inquiries about these Terms and Conditions, please contact
            us at{" "}
            <a href="mailto:arogya@healtrackai.com">support@healtrack.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
