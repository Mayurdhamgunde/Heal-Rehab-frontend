import React, { useState } from "react";
import styles from "../css/TermsndConditions.module.css";

const TermsAndConditions: React.FC = () => {
  const [activeSection, setActiveSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? null : index);
  };

  const sections = [
    {
      title: "1. Introduction",
      content:
        "These Terms and Conditions govern the use of HealTrack's services by patients, doctors, and practitioners. By using our platform, you agree to comply with these terms. If you do not agree, you should refrain from using our services.",
    },
    {
      title: "2. User Eligibility",
      content: (
        <>
          <ul>
            <li>
              Patients must be at least 18 years old or have parental/guardian
              consent.
            </li>
            <li>
              Practitioners and healthcare professionals must provide valid
              certification and licenses as required by regulatory authorities.
            </li>
            <li>
              Users are responsible for maintaining the confidentiality of their
              accounts.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Role of HealTrack",
      content: (
        <>
          <ul>
            <li>
              HealTrack is a technology platform that connects patients with
              healthcare professionals for physiotherapy, wellness
              consultations, and holistic health solutions.
            </li>
            <li>
              HealTrack does not practice medicine or provide medical advice.
              All healthcare services are delivered by independent professionals
              registered on the platform.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "4. Responsibilities of Patients",
      content: (
        <>
          <ul>
            <li>
              Patients must provide accurate and complete health information.
            </li>
            <li>
              Appointments must be scheduled and cancelled in accordance with
              HealTrack's cancellation policy.
            </li>
            <li>
              Patients agree that HealTrack is not liable for any treatment
              outcomes.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. Responsibilities of Doctors and Practitioners",
      content: (
        <>
          <ul>
            <li>
              Practitioners must ensure compliance with medical and regulatory
              guidelines applicable in India and the USA.
            </li>
            <li>
              They must maintain confidentiality and ensure ethical patient
              care.
            </li>
            <li>
              Practitioners are solely responsible for the accuracy of medical
              advice and treatment plans they provide.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "6. Payments, Cancellation, and Refunds",
      content: (
        <>
          <p>
            <strong>Payments:</strong> Payments for consultations and services
            must be completed before availing services. All transactions are
            processed through secure payment gateways.
          </p>

          <p>
            <strong>Cancellations by Patients:</strong>
          </p>
          <ul>
            <li>
              Appointments cancelled at least 24 hours before the scheduled time
              are eligible for a full refund or rescheduling.
            </li>
            <li>
              Cancellations made within 24 hours of the appointment may be
              subject to a partial refund or no refund, depending on HealTrack's
              discretion.
            </li>
          </ul>

          <p>
            <strong>Cancellations by Practitioners:</strong> If a healthcare
            professional cancels an appointment, patients will receive a full
            refund or the option to reschedule at no extra cost.
          </p>

          <p>
            <strong>Refunds:</strong> Refund requests will be processed within
            7-10 business days. Any applicable service fees may be deducted from
            the refund amount.
          </p>

          <p>
            <strong>No-Show Policy:</strong> If a patient fails to attend a
            scheduled appointment without prior notice, no refund will be
            issued.
          </p>

          <p>
            <strong>Subscription Plans:</strong> Subscription-based services are
            billed on a recurring basis. Users may cancel their subscription
            before the next billing cycle to avoid charges. No refunds will be
            issued for partial usage of a subscription plan.
          </p>

          <p>
            HealTrack reserves the right to modify payment structures and refund
            policies at any time.
          </p>
        </>
      ),
    },
    {
      title: "7. Limitation of Liability",
      content: (
        <>
          <ul>
            <li>
              HealTrack acts only as a facilitator and is not liable for the
              actions, decisions, or advice of registered healthcare
              professionals.
            </li>
            <li>
              The platform is not responsible for any indirect or consequential
              damages arising from the use of its services.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "8. Termination of Accounts",
      content: (
        <>
          <ul>
            <li>
              HealTrack reserves the right to suspend or terminate user accounts
              in cases of misconduct, violation of terms, or fraudulent
              activities.
            </li>
            <li>Users may request account deletion by contacting support.</li>
          </ul>
        </>
      ),
    },
    {
      title: "9. Governing Law",
      content: (
        <>
          <ul>
            <li>
              These terms are governed by the laws of India and the United
              States, based on the user's region.
            </li>
            <li>
              Disputes will be subject to the jurisdiction of courts in India or
              the USA as applicable.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "10. Amendments to Terms",
      content: (
        <>
          <ul>
            <li>
              HealTrack may update these Terms and Conditions periodically.
            </li>
            <li>
              Continued use of the platform signifies acceptance of the updated
              terms.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "11. Intellectual Property Rights",
      content: (
        <>
          <p>
            HealTrack owns all intellectual property related to the platform,
            including trademarks, branding, software, website content, and
            proprietary features.
          </p>
          <p>
            <strong>Key Points:</strong>
          </p>
          <ul>
            <li>
              Users cannot copy, modify, or distribute HealTrack's content,
              branding, or technology without explicit permission.
            </li>
            <li>
              Doctors and practitioners using HealTrack's platform cannot offer
              similar services using proprietary tools developed by HealTrack.
            </li>
            <li>
              Any feedback or suggestions provided by users may be used by
              HealTrack without compensation.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "12. Dispute Resolution",
      content: (
        <>
          <p>
            HealTrack aims to resolve conflicts amicably but provides structured
            mechanisms for dispute resolution.
          </p>

          <p>
            <strong>Patients vs. Practitioners:</strong>
          </p>
          <ul>
            <li>
              If a patient has a complaint about a doctor's consultation, they
              may report the issue through HealTrack's grievance redressal
              system.
            </li>
            <li>
              HealTrack may mediate between the patient and practitioner, but
              the final resolution is at HealTrack's discretion.
            </li>
          </ul>

          <p>
            <strong>Users vs. HealTrack:</strong>
          </p>
          <ul>
            <li>
              India: Disputes will be governed by Indian Consumer Protection
              Laws and may be resolved through arbitration in accordance with
              the Arbitration and Conciliation Act, 1996.
            </li>
            <li>
              USA: Disputes will be resolved under U.S. state laws applicable to
              the user's jurisdiction, with arbitration as the preferred method.
            </li>
            <li>
              Users waive the right to participate in class-action lawsuits
              against HealTrack.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "13. User Conduct Policy",
      content: (
        <>
          <p>
            All users must follow ethical and legal conduct while using
            HealTrack.
          </p>
          <p>
            <strong>Prohibited Behavior:</strong>
          </p>
          <ul>
            <li>Providing false or misleading health information.</li>
            <li>
              Abusing, threatening, or harassing doctors, practitioners, or
              customer service agents.
            </li>
            <li>
              Fraudulent appointment bookings or misuse of the refund policy.
            </li>
            <li>Selling or transferring accounts to third parties.</li>
          </ul>
          <p>
            Non-compliance may result in account suspension or permanent ban.
          </p>
        </>
      ),
    },
    {
      title: "14. Third-Party Integrations",
      content: (
        <>
          <p>
            HealTrack integrates with payment gateways, cloud storage providers,
            and AI-based wellness analysis tools.
          </p>
          <p>
            <strong>Key Terms:</strong>
          </p>
          <ul>
            <li>
              HealTrack is not liable for security breaches or service failures
              by third-party vendors.
            </li>
            <li>
              Users must review and accept third-party policies before making
              transactions.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "15. Medical Disclaimer",
      content: (
        <>
          <p>
            HealTrack is a facilitation platform and not a substitute for
            emergency medical care.
          </p>
          <p>
            <strong>Key Points:</strong>
          </p>
          <ul>
            <li>
              The platform does not provide medical diagnoses—all healthcare
              decisions should be made in consultation with licensed
              practitioners.
            </li>
            <li>
              Patients must not use HealTrack in life-threatening emergencies
              and should directly contact emergency services instead.
            </li>
            <li>
              HealTrack does not guarantee specific health outcomes from any
              physiotherapy or wellness program.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "16. Emergency Situations Policy",
      content: (
        <>
          <p>HealTrack is not equipped to handle medical emergencies.</p>
          <p>
            <strong>User Advisory:</strong>
          </p>
          <ul>
            <li>
              If experiencing severe pain, trauma, or critical health issues,
              users must seek immediate medical attention.
            </li>
            <li>
              HealTrack practitioners are not liable for any delays in emergency
              intervention due to online consultations.
            </li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Terms and Conditions</h1>
      </div>

      <div className={styles.termsWrapper}>
        <div className={styles.header}>
          <h1>Terms and Conditions</h1>
        </div>

        <div className={styles.termsContent}>
          <div className={styles.introduction}>
            <p>
              Welcome to HealTrack. Please read these Terms and Conditions
              carefully before using our services. By accessing or using
              HealTrack, you agree to be bound by these terms.
            </p>
          </div>

          <div className={styles.sections}>
            {sections.map((section, index) => (
              <div key={index} className={styles.section}>
                <div
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(index)}
                >
                  <h2>{section.title}</h2>
                  <span
                    className={
                      activeSection === index
                        ? styles.arrowUp
                        : styles.arrowDown
                    }
                  >
                    {activeSection === index ? "−" : "+"}
                  </span>
                </div>

                <div
                  className={`${styles.sectionContent} ${activeSection === index ? styles.active : ""}`}
                >
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <p>
              For any inquiries about these Terms and Conditions, please contact
              us at{" "}
              <a href="mailto:support@healtrack.com">support@healtrack.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
