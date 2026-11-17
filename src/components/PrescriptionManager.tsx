import React, { useState, useEffect } from "react";
import api from "../utils/central";
import {
  FaPlus,
  FaEdit,
  FaTimesCircle,
  FaNotesMedical,
  FaHistory,
  FaArrowLeft,
  FaPills,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
} from "react-icons/fa";
import PrescriptionFormComponent, {
  type PrescriptionFormDataType,
} from "./PrescriptionFormComponent";
import styles from "../css/PrescriptionManager.module.css";

export interface PrescriptionManagerProps {
  planId: string;
  patientId: string;
  prescriptions?: any[];
  onRefresh: () => void;
  // When the plan has been closed, this is the prescription issued at
  // closure (post_care_prescription_id on the therapy plan). When present,
  // it's featured as the "active" prescription card regardless of its own
  // `status` field, since post-care prescriptions aren't necessarily
  // marked "Active" the way an in-progress plan's prescription is.
  postCarePrescriptionId?: string | null;
}

const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({
  planId,
  patientId,
  prescriptions = [],
  onRefresh,
  postCarePrescriptionId = null,
}) => {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editingPrescription, setEditingPrescription] = useState<any | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    null,
  );

  const [allPrescriptions, setAllPrescriptions] =
    useState<any[]>(prescriptions);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchAllPrescriptions = async () => {
    if (!planId) return;
    setIsLoadingHistory(true);
    try {
      const res = await api.get(`/prescriptions/plan/${planId}`);
      if (res.data && res.data.prescriptions) {
        setAllPrescriptions(res.data.prescriptions);
      }
    } catch (error) {
      console.error("Failed to fetch prescription history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchAllPrescriptions();
  }, [planId]);

  const handleRefresh = async () => {
    await onRefresh();
    await fetchAllPrescriptions();
  };

  // Once a plan is completed, feature the post-care prescription (issued at
  // closure) as the "active" card, regardless of its own `status` field.
  // Otherwise, fall back to the normal in-progress-plan behavior of looking
  // for a prescription explicitly marked "Active".
  const activePrescription = postCarePrescriptionId
    ? allPrescriptions.find((p) => p._id === postCarePrescriptionId)
    : allPrescriptions.find((p) => p.status === "Active");

  const historicalPrescriptions = allPrescriptions.filter((p) => {
    if (activePrescription && p._id === activePrescription._id) return false;
    // Plan is completed: everything besides the featured post-care
    // prescription belongs in history, regardless of its status field.
    if (postCarePrescriptionId) return true;
    return p.status === "Completed" || p.status === "Ended";
  });

  const toggleHistoryItem = (id: string) => {
    setExpandedHistoryId((prev) => (prev === id ? null : id));
  };

  const handleAddSubmit = async (formData: PrescriptionFormDataType) => {
    setIsSubmitting(true);
    try {
      await api.post(`/prescription/plan/${planId}/patient/${patientId}`, {
        vitals: { weight: formData.weight, bp: formData.bp },
        notes: formData.notes,
        medications: formData.medications,
        prescriptionDate: formData.prescriptionDate, // Include the custom date payload
      });
      await handleRefresh();
      setView("list");
    } catch (error) {
      console.error("Failed to add prescription", error);
      alert("Failed to add prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (formData: PrescriptionFormDataType) => {
    if (!editingPrescription?._id) return;
    setIsSubmitting(true);
    try {
      await api.put(`/prescription/${editingPrescription._id}`, {
        vitals: { weight: formData.weight, bp: formData.bp },
        notes: formData.notes,
        medications: formData.medications,
        prescriptionDate: formData.prescriptionDate, // Include the custom date payload
      });
      await handleRefresh();
      setView("list");
      setEditingPrescription(null);
    } catch (error) {
      console.error("Failed to update prescription", error);
      alert("Failed to update prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndPrescription = async (prescriptionId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to end this active prescription? All medications will be capped to today.",
      )
    )
      return;
    try {
      await api.put(`/prescription/${prescriptionId}/end`);
      await handleRefresh();
    } catch (error) {
      console.error("Failed to end prescription", error);
      alert("Failed to end prescription");
    }
  };

  const openEdit = (prescription: any) => {
    setEditingPrescription(prescription);
    setView("edit");
  };

  const getInitialFormData = (
    prescription: any,
  ): Partial<PrescriptionFormDataType> => {
    return {
      weight: prescription.vitals?.weight || "",
      bp: prescription.vitals?.bp || "",
      notes: prescription.notes || "",
      medications: prescription.medications || [],
      prescriptionDate: prescription.prescription_date || "", // Pre-fill when editing
    };
  };

  const getSerialNumber = (prescriptionId: string) => {
    const index = allPrescriptions.findIndex((p) => p._id === prescriptionId);
    return index >= 0 ? allPrescriptions.length - index : "-";
  };

  const isHistoricalEdit =
    view === "edit" &&
    (editingPrescription?.status === "Completed" ||
      editingPrescription?.status === "Ended");

  const editingSerialNumber = editingPrescription
    ? getSerialNumber(editingPrescription._id)
    : "-";

  if (view === "add" || view === "edit") {
    return (
      <div className={styles.managerCard}>
        <div className={styles.cardHeader}>
          <button
            className={styles.backBtn}
            onClick={() => {
              setView("list");
              setEditingPrescription(null);
            }}
          >
            <FaArrowLeft /> <span>Back</span>
          </button>

          <div className={styles.headerTitleGroup}>
            <h2 className={styles.headerTitle}>
              {view === "add"
                ? "New Prescription"
                : `Edit Prescription #${editingSerialNumber}`}
            </h2>
            {isHistoricalEdit && (
              <span className={styles.historicalBadge}>Historical</span>
            )}
          </div>
          <div style={{ width: "80px" }} />
        </div>

        {isHistoricalEdit && (
          <div className={styles.historicalBanner}>
            <FaExclamationTriangle className={styles.historicalBannerIcon} />
            <span>
              You are editing a <strong>completed</strong> prescription. Changes
              will update the historical record without changing its status.
            </span>
          </div>
        )}

        <div className={styles.cardBody}>
          <PrescriptionFormComponent
            initialData={
              view === "edit"
                ? getInitialFormData(editingPrescription)
                : undefined
            }
            planId={planId}
            patientId={patientId}
            onSubmit={view === "add" ? handleAddSubmit : handleEditSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.managerCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.iconWrapper}>
            <FaNotesMedical />
          </div>
          <h2 className={styles.headerTitle}>Prescriptions</h2>
        </div>
        <button className={styles.addBtn} onClick={() => setView("add")}>
          <FaPlus fontSize="0.8rem" /> New
        </button>
      </div>

      <div className={styles.cardBodyScrollable}>
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionTitle}>
            <span className={styles.pulseDot}></span>{" "}
            {postCarePrescriptionId
              ? "Post-Care Prescription"
              : "Current Active"}
          </h4>

          {activePrescription ? (
            <div className={styles.activePrescriptionBox}>
              <div className={styles.boxHeader}>
                <div>
                  <span className={styles.statusActive}>
                    {postCarePrescriptionId ? "Post-Care" : "Active"}
                  </span>
                  <span className={styles.prescNumber}>
                    Prescription #{getSerialNumber(activePrescription._id)}
                  </span>
                </div>
                <span className={styles.prescDate}>
                  {new Date(
                    activePrescription.prescription_date,
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className={styles.activeMedsGrid}>
                {activePrescription.medications?.map(
                  (med: any, idx: number) => (
                    <div key={idx} className={styles.activeMedItem}>
                      <div className={styles.medIcon}>
                        <FaPills />
                      </div>
                      <div className={styles.medInfo}>
                        <span className={styles.medName}>
                          {med.drug_name}{" "}
                          {med.strength && (
                            <span className={styles.medStrength}>
                              {med.strength}
                            </span>
                          )}
                        </span>
                        <span className={styles.medMeta}>
                          {med.schedules && med.schedules.length > 0 ? (
                            med.schedules.map((sch: any, sIdx: number) => (
                              <div key={sIdx} className={styles.phaseListItem}>
                                Phase {sIdx + 1}: Take {sch.frequency} for{" "}
                                {sch.duration} Days
                              </div>
                            ))
                          ) : (
                            <div className={styles.phaseListItem}>
                              Take {med.frequency} for {med.duration} Days
                            </div>
                          )}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className={styles.actionRow}>
                <button
                  className={styles.editBtn}
                  onClick={() => openEdit(activePrescription)}
                >
                  <FaEdit /> Edit
                </button>
                {!postCarePrescriptionId && (
                  <button
                    className={styles.endBtn}
                    onClick={() =>
                      handleEndPrescription(activePrescription._id)
                    }
                  >
                    <FaTimesCircle /> End
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FaNotesMedical className={styles.emptyIcon} />
              <p>No active prescription found.</p>
              <button
                className={styles.emptyAddBtn}
                onClick={() => setView("add")}
              >
                Create New Prescription
              </button>
            </div>
          )}
        </div>

        <hr className={styles.divider} />

        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionTitle}>
            <FaHistory className={styles.historyIcon} /> History
          </h4>

          {isLoadingHistory ? (
            <div className={styles.emptyStateText}>
              Loading prescription history...
            </div>
          ) : historicalPrescriptions.length > 0 ? (
            <div className={styles.historyList}>
              {historicalPrescriptions.map((p) => (
                <div
                  key={p._id}
                  className={`${styles.historyBox} ${
                    expandedHistoryId === p._id ? styles.historyBoxExpanded : ""
                  }`}
                >
                  <div
                    className={styles.historyTop}
                    onClick={() => toggleHistoryItem(p._id)}
                  >
                    <div className={styles.historyIdentifier}>
                      <span className={styles.statusEnded}>Completed</span>
                      <span className={styles.historyPrescNumber}>
                        Prescription #{getSerialNumber(p._id)}
                      </span>
                    </div>

                    <div className={styles.historyRowActions}>
                      <span className={styles.historyDate}>
                        {new Date(p.prescription_date).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>

                      <button
                        className={styles.historyEditIconBtn}
                        title="Edit this prescription"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(p);
                        }}
                      >
                        <FaEdit />
                      </button>

                      <span className={styles.toggleIcon}>
                        {expandedHistoryId === p._id ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    className={styles.historySummary}
                    onClick={() => toggleHistoryItem(p._id)}
                  >
                    {p.medications?.length} Medications prescribed
                  </div>

                  {expandedHistoryId === p._id && (
                    <div className={styles.expandedContent}>
                      {p.medications && p.medications.length > 0 ? (
                        <div className={styles.tableContainer}>
                          <table className={styles.medTable}>
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Dose</th>
                                <th>Freq</th>
                                <th>Days</th>
                                <th>Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.medications.map((med: any, idx: number) => (
                                <tr key={idx}>
                                  <td>
                                    <strong>{med.drug_name}</strong>
                                    {med.strength && (
                                      <span> {med.strength}</span>
                                    )}
                                  </td>
                                  <td colSpan={3}>
                                    {med.schedules?.map(
                                      (sch: any, sIdx: number) => (
                                        <div
                                          key={sIdx}
                                          className={styles.phaseListItem}
                                        >
                                          <span className={styles.freqBadge}>
                                            {sch.frequency}
                                          </span>{" "}
                                          for {sch.duration} Days (Qty:{" "}
                                          {sch.quantity})
                                        </div>
                                      ),
                                    )}
                                  </td>
                                  <td>{med.instructions || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className={styles.emptyTable}>
                          No medications listed.
                        </div>
                      )}

                      {p.notes && (
                        <div className={styles.notesBox}>
                          <strong>Doctor's Notes:</strong> {p.notes}
                        </div>
                      )}

                      <div className={styles.historyEditRow}>
                        <button
                          className={styles.historyEditBtn}
                          onClick={() => openEdit(p)}
                        >
                          <FaEdit /> Edit Prescription
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyStateText}>
              No previous history available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionManager;
