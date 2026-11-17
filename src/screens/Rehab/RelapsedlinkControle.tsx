import React, { useState } from "react";
import {
  FaTimes,
  FaSearch,
  FaSpinner,
  FaLink,
  FaHistory,
} from "react-icons/fa";
import styles from "../../css/Rehab/RelapseLinkControl.module.css";
import api from "../../utils/central";

// ── Wire these up to whatever routes point at the backend controllers ──
// searchPotentialPreviousPatients and linkRelapsedPatient. Adjust the
// paths below if your router mounts them differently.
const SEARCH_PREVIOUS_PATIENTS_URL = "/get/previous";
const linkRelapseUrl = (patientId: string) => `/link/previous/${patientId}`;

const MATCH_LABELS: Record<string, string> = {
  patient_phone: "Phone",
  guardian_phone: "Guardian Phone",
  guardian_phone_2: "Guardian Phone",
  patient_alternate_number: "Alternate Phone",
  identity_card: "ID Card",
};

interface MatchCandidate {
  _id: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_phone?: string;
  guardian_phone?: string;
  guardian_phone_2?: string;
  patient_alternate_number?: string;
  identity_card?: { type?: string; number?: string };
  patient_registration_date?: string;
  status?: string;
  UHID?: string;
  patient_image?: string;
  matched_on?: string[];
}

interface RelapseLinkControlProps {
  /** The patient currently being viewed — the one that will be marked as a relapse. */
  patientId: string;
  /** Used only for confirm dialogs / success messages. */
  patientName?: string;
  /** patient.previous_patient_id from the current patient record, if already linked. */
  previousPatientId?: string | null;
  /** Called with the updated patient document once linking succeeds, so the
   *  parent can refresh its own state (e.g. setPatient(updatedPatient)). */
  onLinked: (updatedPatient: any) => void;
}

function formatCandidateDate(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

const RelapseLinkControl: React.FC<RelapseLinkControlProps> = ({
  patientId,
  patientName,
  previousPatientId,
  onLinked,
}) => {
  const isRelapsed = !!previousPatientId;

  const [showModal, setShowModal] = useState(false);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsSource, setResultsSource] = useState<"auto" | "manual">("auto");
  const [manualPhone, setManualPhone] = useState("");
  const [manualIdentity, setManualIdentity] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const runSearch = async (
    params: Record<string, string>,
    source: "auto" | "manual",
  ) => {
    setSearchLoading(true);
    setSearchError(null);
    setLinkError(null);
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(
        `${SEARCH_PREVIOUS_PATIENTS_URL}?${query}`,
      );
      setCandidates(response.data.patients || []);
      setResultsSource(source);
    } catch (err: any) {
      console.error("Error searching for potential previous patients:", err);
      setSearchError(
        err.response?.data?.message ||
          "Failed to search for matching patients.",
      );
      setCandidates([]);
    } finally {
      setSearchLoading(false);
      setHasSearched(true);
    }
  };

  const openModal = () => {
    if (isRelapsed) return;
    setShowModal(true);
    setCandidates([]);
    setHasSearched(false);
    setSearchError(null);
    setLinkError(null);
    setManualPhone("");
    setManualIdentity("");
    // Auto-search using this patient's own saved phone numbers & ID card.
    runSearch({ patient_id: patientId }, "auto");
  };

  const closeModal = () => setShowModal(false);

  const handleManualSearch = () => {
    if (!manualPhone.trim() && !manualIdentity.trim()) {
      setSearchError("Enter a phone number or identity card number to search.");
      return;
    }
    const params: Record<string, string> = {};
    if (manualPhone.trim()) params.patient_phone = manualPhone.trim();
    if (manualIdentity.trim())
      params.identity_card_number = manualIdentity.trim();
    runSearch(params, "manual");
  };

  const handleLink = async (candidate: MatchCandidate) => {
    const candidateName =
      `${candidate.patient_first_name || ""} ${candidate.patient_last_name || ""}`.trim() ||
      "this patient";

    if (
      !window.confirm(
        `Link ${candidateName} (UHID: ${candidate.UHID || "N/A"}) as ${
          patientName || "this patient"
        }'s previous record? This marks the current record as a relapse / re-admission.`,
      )
    ) {
      return;
    }

    setLinkingId(candidate._id);
    setLinkError(null);
    try {
      const response = await api.patch(linkRelapseUrl(patientId), {
        previous_patient_id: candidate._id,
      });
      onLinked(response.data.patient);
      setShowModal(false);
      alert(`${patientName || "Patient"} marked as a relapsed patient.`);
    } catch (err: any) {
      console.error("Error linking relapsed patient:", err);
      setLinkError(
        err.response?.data?.message ||
          "Failed to link the selected patient record.",
      );
    } finally {
      setLinkingId(null);
    }
  };

  const handleViewPreviousRecord = () => {
    if (!previousPatientId) return;
    // Swap the current patient's ID for the previous one in the current URL,
    // since this page's own route is whatever the app already mounted it on.
    window.location.href = window.location.pathname.replace(
      patientId,
      previousPatientId,
    );
  };

  return (
    <div className={styles.relapseControl}>
      {isRelapsed ? (
        <div className={styles.relapseBadgeGroup}>
          <span className={styles.relapseBadge}>
            <FaHistory size={10} /> Relapsed Patient
          </span>
          <button
            type="button"
            className={styles.viewLinkedBtn}
            onClick={handleViewPreviousRecord}
          >
            View previous record
          </button>
        </div>
      ) : (
        <label className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={false}
            onChange={openModal}
          />
          <span className={styles.checkboxLabel}>
            Mark as Relapsed / Re-admission
          </span>
        </label>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.relapseModal}>
            <div className={styles.modalHeader}>
              <h3>
                <FaHistory className={styles.headerIcon} /> Link Previous Record
              </h3>
              <button className={styles.closeModalBtn} onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalIntro}>
                Search for an earlier record for {patientName || "this patient"}{" "}
                by matching phone number or identity card, then link it to mark
                this as a relapse / re-admission.
              </p>

              <div className={styles.searchSection}>
                <p className={styles.sectionLabel}>
                  Search by phone or identity card
                </p>
                <div className={styles.searchRow}>
                  <input
                    type="text"
                    placeholder="Phone number"
                    className={styles.searchInput}
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Identity card number"
                    className={styles.searchInput}
                    value={manualIdentity}
                    onChange={(e) => setManualIdentity(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.searchBtn}
                    onClick={handleManualSearch}
                    disabled={searchLoading}
                  >
                    <FaSearch size={11} /> Search
                  </button>
                </div>
              </div>

              {searchError && <p className={styles.errorText}>{searchError}</p>}
              {linkError && <p className={styles.errorText}>{linkError}</p>}

              <p className={styles.sectionLabel}>
                {resultsSource === "auto"
                  ? "Matches based on this patient's saved phone & ID"
                  : "Search results"}
              </p>

              {searchLoading ? (
                <div className={styles.loadingRow}>
                  <FaSpinner className="fa-spin" /> Searching...
                </div>
              ) : candidates.length === 0 ? (
                hasSearched && (
                  <div className={styles.emptyState}>
                    No matching patient records found.
                  </div>
                )
              ) : (
                <div className={styles.candidateList}>
                  {candidates.map((candidate) => {
                    const name =
                      `${candidate.patient_first_name || ""} ${candidate.patient_last_name || ""}`.trim() ||
                      "Unnamed Patient";
                    return (
                      <div key={candidate._id} className={styles.candidateCard}>
                        {candidate.patient_image ? (
                          <img
                            src={candidate.patient_image}
                            alt={name}
                            className={styles.candidateAvatar}
                          />
                        ) : (
                          <div className={styles.candidateAvatarFallback}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={styles.candidateInfo}>
                          <p className={styles.candidateName}>{name}</p>
                          <div className={styles.candidateMeta}>
                            <span>UHID: {candidate.UHID || "N/A"}</span>
                            <span>{candidate.patient_phone || "No phone"}</span>
                            <span>
                              {formatCandidateDate(
                                candidate.patient_registration_date,
                              )}
                            </span>
                          </div>
                          {candidate.matched_on &&
                            candidate.matched_on.length > 0 && (
                              <div className={styles.matchTagRow}>
                                {candidate.matched_on.map((field) => (
                                  <span key={field} className={styles.matchTag}>
                                    {MATCH_LABELS[field] || field}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => handleLink(candidate)}
                          disabled={linkingId === candidate._id}
                        >
                          {linkingId === candidate._id ? (
                            <FaSpinner className="fa-spin" size={11} />
                          ) : (
                            <FaLink size={11} />
                          )}{" "}
                          Link
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelapseLinkControl;
