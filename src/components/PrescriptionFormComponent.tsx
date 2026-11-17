import React, { useEffect, useRef, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import styles from "../css/PrescriptionFormComponent.module.css";
import DrugSearchComponent, { type DrugItem } from "./DrugSearchComponent";
import api from "../utils/central";

export type ScheduleItem = {
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string;
  quantity: string;
};

export type MedicineItem = {
  drug_name: string;
  generic_name?: string;
  drug_type?: string;
  strength: string;
  route: string;
  instructions: string;
  schedules: ScheduleItem[];
};

export type PrescriptionFormDataType = {
  weight: string;
  bp: string;
  notes: string;
  prescriptionDate: string;
  medications: MedicineItem[];
};

export interface PrescriptionFormComponentProps {
  initialData?: Partial<PrescriptionFormDataType>;
  onSubmit?: (data: PrescriptionFormDataType) => void;
  onDataChange?: (data: PrescriptionFormDataType) => void;
  isSubmitting?: boolean;
  hideFooter?: boolean;
  isTemplateBuilder?: boolean; // <-- NEW PROP to separate logic from hideFooter
  planId?: string;
  patientId?: string;
}

const STRENGTH_PRESETS = ["100mg", "250mg", "500mg", "1g", "5ml", "10ml"];

const getLocalToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const extractJustDate = (dateString?: string) => {
  if (!dateString) return getLocalToday();
  return dateString.split("T")[0];
};

const formatForDisplay = (dateString: string) => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const createEmptySchedule = (
  startDate: string = getLocalToday(),
): ScheduleItem => ({
  frequency: "0-0-0-0",
  duration: "",
  start_date: startDate,
  end_date: "",
  quantity: "0",
});

const EMPTY_MED: MedicineItem = {
  drug_name: "",
  generic_name: "",
  drug_type: "",
  strength: "",
  route: "Oral",
  instructions: "After Lunch",
  schedules: [createEmptySchedule()],
};

const PrescriptionFormComponent: React.FC<PrescriptionFormComponentProps> = ({
  initialData,
  onSubmit,
  onDataChange,
  isSubmitting = false,
  hideFooter = false,
  isTemplateBuilder = false,
  planId,
  patientId,
}) => {
  const [formData, setFormData] = useState<PrescriptionFormDataType>({
    weight: initialData?.weight || "",
    bp: initialData?.bp || "",
    notes: initialData?.notes || "",
    prescriptionDate: extractJustDate(initialData?.prescriptionDate),
    medications: (initialData?.medications || []).map((med: any) => ({
      ...med,
      schedules: med.schedules?.length
        ? med.schedules.map((sch: any) => ({
            ...sch,
            start_date: extractJustDate(sch.start_date),
            end_date: extractJustDate(sch.end_date),
          }))
        : [createEmptySchedule()],
    })),
  });

  const [currentMed, setCurrentMed] = useState<MedicineItem>({ ...EMPTY_MED });
  const [editingMedIndex, setEditingMedIndex] = useState<number | null>(null);

  const [previousPrescriptions, setPreviousPrescriptions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [selectedPreviousId, setSelectedPreviousId] = useState<string>("");

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [activeDosePicker, setActiveDosePicker] = useState<{
    schIdx: number;
    timeIdx: number;
  } | null>(null);

  const addSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (
        (!planId && !patientId) ||
        (initialData?.medications && initialData.medications.length > 0)
      ) {
        return;
      }

      setIsLoadingHistory(true);
      try {
        const endpoint = planId
          ? `/prescriptions/plan/${planId}`
          : `/prescriptions/patient/${patientId}`;

        const res = await api.get(endpoint);
        if (res.data && res.data.prescriptions) {
          setPreviousPrescriptions(res.data.prescriptions);
        }
      } catch (error) {
        console.error("Failed to fetch prescription history", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [planId, patientId, initialData]);

  // --- UPDATED: Fetch Prescription Templates using isTemplateBuilder ---
  useEffect(() => {
    const fetchTemplates = async () => {
      if (isTemplateBuilder) return;

      setIsLoadingTemplates(true);
      try {
        const res = await api.get("/prescription-templates");
        if (res.data && res.data.templates) {
          setTemplates(res.data.templates);
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [isTemplateBuilder]);

  const recalculateSchedules = (schedules: ScheduleItem[]) => {
    return schedules.map((sch) => {
      let newQty = "0";
      let newEndDate = "";
      const days = parseInt(sch.duration) || 0;

      if (days > 0) {
        const pattern = sch.frequency.split("-");
        let totalDosesPerDay = 0;
        pattern.forEach((val) => {
          if (val === "1/2") totalDosesPerDay += 0.5;
          else if (val === "1 1/2") totalDosesPerDay += 1.5;
          else totalDosesPerDay += parseFloat(val) || 0;
        });
        newQty = (totalDosesPerDay * days).toString();

        if (sch.start_date) {
          const [year, month, day] = sch.start_date.split("-").map(Number);
          const startDateObj = new Date(year, month - 1, day);
          startDateObj.setDate(startDateObj.getDate() + days - 1);
          const y = startDateObj.getFullYear();
          const m = String(startDateObj.getMonth() + 1).padStart(2, "0");
          const d = String(startDateObj.getDate()).padStart(2, "0");
          newEndDate = `${y}-${m}-${d}`;
        }
      }
      return { ...sch, quantity: newQty, end_date: newEndDate };
    });
  };

  const applyPrescriptionData = (dataSource: any, isHistory: boolean) => {
    if (formData.medications.length > 0) {
      if (
        !window.confirm(
          `Loading this ${isHistory ? "prescription" : "template"} will replace your currently entered medications. Continue?`,
        )
      ) {
        setSelectedPreviousId("");
        setSelectedTemplateId("");
        return;
      }
    }

    const newMeds = (dataSource.medications || []).map((med: any) => {
      const resetSchedules = med.schedules?.length
        ? med.schedules.map((sch: any) => ({
            ...sch,
            start_date: getLocalToday(),
          }))
        : [createEmptySchedule()];

      return {
        ...med,
        schedules: recalculateSchedules(resetSchedules),
      };
    });

    setFormData((prev) => ({
      ...prev,
      weight: dataSource.vitals?.weight || prev.weight,
      bp: dataSource.vitals?.bp || prev.bp,
      notes: dataSource.notes || prev.notes,
      medications: newMeds,
    }));
  };

  const handleLoadPrevious = (prescriptionId: string) => {
    if (!prescriptionId || !previousPrescriptions.length) return;
    const p = previousPrescriptions.find((x) => x._id === prescriptionId);
    if (!p) return;
    setSelectedTemplateId("");
    applyPrescriptionData(p, true);
  };

  const handleLoadTemplate = (templateId: string) => {
    if (!templateId || !templates.length) return;
    const t = templates.find((x) => x._id === templateId);
    if (!t) return;
    setSelectedPreviousId("");
    applyPrescriptionData(t, false);
  };

  const updateSchedule = (
    index: number,
    field: keyof ScheduleItem,
    value: string,
  ) => {
    const updatedSchedules = [...currentMed.schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setCurrentMed((prev) => ({
      ...prev,
      schedules: recalculateSchedules(updatedSchedules),
    }));
  };

  const handleFrequencyPartChange = (
    scheduleIdx: number,
    partIdx: number,
    value: string,
  ) => {
    const updatedSchedules = [...currentMed.schedules];
    const freqArr = (
      updatedSchedules[scheduleIdx].frequency || "0-0-0-0"
    ).split("-");
    while (freqArr.length < 4) freqArr.push("0");

    freqArr[partIdx] = value.trim() || "0";
    updatedSchedules[scheduleIdx].frequency = freqArr.join("-");

    setCurrentMed((prev) => ({
      ...prev,
      schedules: recalculateSchedules(updatedSchedules),
    }));
  };

  const addNextPhase = () => {
    const lastSchedule = currentMed.schedules[currentMed.schedules.length - 1];

    let newStartDate = getLocalToday();
    if (lastSchedule.end_date) {
      const [year, month, day] = lastSchedule.end_date.split("-").map(Number);
      const nextDay = new Date(year, month - 1, day);
      nextDay.setDate(nextDay.getDate() + 1);
      const y = nextDay.getFullYear();
      const m = String(nextDay.getMonth() + 1).padStart(2, "0");
      const d = String(nextDay.getDate()).padStart(2, "0");
      newStartDate = `${y}-${m}-${d}`;
    }

    const newSchedules = [
      ...currentMed.schedules,
      createEmptySchedule(newStartDate),
    ];
    setCurrentMed((prev) => ({ ...prev, schedules: newSchedules }));
  };

  const removePhase = (index: number) => {
    const newSchedules = currentMed.schedules.filter((_, i) => i !== index);
    setCurrentMed((prev) => ({
      ...prev,
      schedules: recalculateSchedules(newSchedules),
    }));
  };

  const handleSelectDrug = (drug: DrugItem) => {
    setCurrentMed((prev) => ({
      ...prev,
      drug_name: drug.drug_name,
      generic_name: drug.generic_name,
      drug_type: drug.drug_type,
      strength: drug.strength || "",
      route: ["Tablet", "Capsule", "Syrup"].includes(drug.drug_type)
        ? "Oral"
        : "Other",
      instructions: drug.meal_timing || "After Lunch",
    }));
  };

  const handleEditMedicine = (index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingMedIndex(index);
    setCurrentMed({ ...formData.medications[index] });
    setTimeout(() => {
      addSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleCancelEdit = () => {
    setEditingMedIndex(null);
    setCurrentMed({ ...EMPTY_MED, schedules: [createEmptySchedule()] });
    setActiveDosePicker(null);
  };

  const handleAddMedicine = () => {
    if (!currentMed.drug_name.trim()) return alert("Please select a medicine");

    for (let i = 0; i < currentMed.schedules.length; i++) {
      const sch = currentMed.schedules[i];
      if (sch.frequency === "0-0-0-0" || !sch.frequency)
        return alert(`Phase ${i + 1}: Please select dosing amounts (M-A-E-N)`);
      if (!sch.duration)
        return alert(`Phase ${i + 1}: Please enter duration (Days)`);
      if (!sch.start_date)
        return alert(`Phase ${i + 1}: Please select a start date`);
    }

    if (editingMedIndex !== null) {
      setFormData((prev) => {
        const updated = [...prev.medications];
        updated[editingMedIndex] = { ...currentMed };
        return { ...prev, medications: updated };
      });
      setEditingMedIndex(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        medications: [...prev.medications, { ...currentMed }],
      }));
    }

    setCurrentMed({ ...EMPTY_MED, schedules: [createEmptySchedule()] });
    setActiveDosePicker(null);
  };

  const removeMedicine = (index: number) => {
    if (editingMedIndex === index) {
      handleCancelEdit();
    } else if (editingMedIndex !== null && editingMedIndex > index) {
      setEditingMedIndex((prev) => (prev !== null ? prev - 1 : null));
    }
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const isEditing = editingMedIndex !== null;
  const isReadyToAdd = Boolean(
    currentMed.drug_name.trim() &&
    currentMed.schedules[0]?.duration &&
    currentMed.schedules[0]?.frequency !== "0-0-0-0",
  );

  return (
    <div className={styles.formContainer}>
      {(previousPrescriptions.length > 0 ||
        isLoadingHistory ||
        templates.length > 0 ||
        isLoadingTemplates) && (
        <div className={styles.section} style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {(previousPrescriptions.length > 0 || isLoadingHistory) && (
              <div>
                <label className={styles.sectionLabel}>
                  Start from a previous prescription
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.compactInput}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                    value={selectedPreviousId}
                    onChange={(e) => {
                      setSelectedPreviousId(e.target.value);
                      handleLoadPrevious(e.target.value);
                    }}
                    disabled={isLoadingHistory}
                  >
                    {isLoadingHistory ? (
                      <option value="" disabled>
                        Loading past prescriptions...
                      </option>
                    ) : (
                      <>
                        <option value="" disabled>
                          -- Select a previous prescription to load --
                        </option>
                        {previousPrescriptions.map((p) => (
                          <option key={p._id} value={p._id}>
                            {new Date(p.prescription_date).toLocaleDateString()}{" "}
                            ({p.medications?.length || 0} medications) -{" "}
                            {p.status || "Completed"}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {isLoadingHistory && (
                    <div className={styles.selectSpinner}></div>
                  )}
                </div>
              </div>
            )}

            {(templates.length > 0 || isLoadingTemplates) && (
              <div>
                <label className={styles.sectionLabel}>
                  Start from a template
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.compactInput}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      handleLoadTemplate(e.target.value);
                    }}
                    disabled={isLoadingTemplates}
                  >
                    {isLoadingTemplates ? (
                      <option value="" disabled>
                        Loading templates...
                      </option>
                    ) : (
                      <>
                        <option value="" disabled>
                          -- Select a template to load --
                        </option>
                        {templates.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.template_name} ({t.medications?.length || 0}{" "}
                            meds)
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {isLoadingTemplates && (
                    <div className={styles.selectSpinner}></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div
          className={styles.vitalsGrid}
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          }}
        >
          <div className={styles.vitalInput}>
            <label className={styles.sectionLabel}>Date</label>
            <input
              type="date"
              title="Prescription Date"
              value={formData.prescriptionDate}
              onChange={(e) =>
                setFormData((p) => ({ ...p, prescriptionDate: e.target.value }))
              }
            />
          </div>
          <div className={styles.vitalInput}>
            <label className={styles.sectionLabel}>Weight (kg)</label>
            <input
              type="number"
              placeholder="Weight (kg)"
              value={formData.weight}
              onChange={(e) =>
                setFormData((p) => ({ ...p, weight: e.target.value }))
              }
            />
          </div>
          <div className={styles.vitalInput}>
            <label className={styles.sectionLabel}>BP (120/80)</label>
            <input
              type="text"
              placeholder="BP (120/80)"
              value={formData.bp}
              onChange={(e) =>
                setFormData((p) => ({ ...p, bp: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      {formData.medications.length > 0 && (
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Prescribed medicines</label>
          <div className={styles.medList}>
            {formData.medications.map((med, index) => (
              <div
                key={index}
                className={`${styles.medItemCard} ${editingMedIndex === index ? styles.medItemCardEditing : ""}`}
              >
                <div className={styles.medBadge}>
                  {editingMedIndex === index ? (
                    <EditOutlinedIcon fontSize="inherit" />
                  ) : (
                    <DoneIcon fontSize="inherit" />
                  )}
                </div>
                <div className={styles.medDetails}>
                  <strong>
                    {med.drug_name} {med.strength && `(${med.strength})`}
                  </strong>
                  {med.generic_name && (
                    <span className={styles.genericName}>
                      {med.generic_name}
                    </span>
                  )}

                  {med.schedules.map((sch, schIdx) => (
                    <div key={schIdx} className={styles.phaseDisplayItem}>
                      Phase {schIdx + 1}: Take <strong>{sch.frequency}</strong>{" "}
                      for <strong>{sch.duration} Days</strong> (
                      {formatForDisplay(sch.start_date)} to{" "}
                      {formatForDisplay(sch.end_date)}) • Qty: {sch.quantity}
                    </div>
                  ))}
                  <div className={styles.medInstruction}>
                    Instr: {med.instructions}
                  </div>
                </div>

                <div className={styles.medCardActions}>
                  <button
                    type="button"
                    className={`${styles.editMedBtn} ${editingMedIndex === index ? styles.editMedBtnActive : ""}`}
                    onClick={(e) => handleEditMedicine(index, e)}
                    disabled={isEditing && editingMedIndex !== index}
                  >
                    <EditOutlinedIcon fontSize="inherit" />
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeMedicine(index)}
                  >
                    <DeleteOutlineIcon fontSize="inherit" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`${styles.addMedicineSection} ${isEditing ? styles.addMedicineSectionEditing : ""}`}
        ref={addSectionRef}
      >
        <div className={styles.addMedicineSectionHeader}>
          <label className={styles.sectionLabel}>
            {isEditing
              ? `Editing: ${formData.medications[editingMedIndex!]?.drug_name}`
              : "Add new medication"}
          </label>
          {isEditing && (
            <button
              type="button"
              className={styles.cancelEditBtn}
              onClick={handleCancelEdit}
            >
              <CloseIcon fontSize="inherit" /> Cancel edit
            </button>
          )}
        </div>

        <DrugSearchComponent
          selectedName={currentMed.drug_name}
          onSelectDrug={handleSelectDrug}
        />

        <div className={styles.configGrid}>
          <div className={`${styles.configItem} ${styles.fullWidthItem}`}>
            <label>Strength / power</label>
            <div className={styles.strengthInputRow}>
              <div className={styles.pillGroup}>
                {STRENGTH_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={
                      currentMed.strength === s
                        ? styles.pillActive
                        : styles.pill
                    }
                    onClick={() =>
                      setCurrentMed((p) => ({
                        ...p,
                        strength: p.strength === s ? "" : s,
                      }))
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className={styles.compactInput}
                placeholder="Other..."
                value={
                  STRENGTH_PRESETS.includes(currentMed.strength)
                    ? ""
                    : currentMed.strength
                }
                onChange={(e) =>
                  setCurrentMed((p) => ({ ...p, strength: e.target.value }))
                }
              />
            </div>
          </div>

          <div className={styles.configItem}>
            <label>Meal timing / Instructions</label>
            <input
              type="text"
              value={currentMed.drug_name ? currentMed.instructions : ""}
              placeholder="Awaiting selection..."
              onChange={(e) =>
                setCurrentMed((p) => ({ ...p, instructions: e.target.value }))
              }
              className={styles.compactInput}
            />
          </div>
        </div>

        <div className={styles.scheduleSection}>
          <label className={styles.sectionLabel}>
            Dosing Schedules (Phases)
          </label>

          {currentMed.schedules.map((sch, schIdx) => {
            const isLastPhase = schIdx === currentMed.schedules.length - 1;

            return (
              <div key={schIdx} className={styles.phaseCard}>
                <div className={styles.phaseHeader}>
                  <span className={styles.phaseTitle}>Phase {schIdx + 1}</span>
                  {schIdx > 0 && (
                    <button
                      type="button"
                      className={styles.removePhaseBtn}
                      onClick={() => removePhase(schIdx)}
                    >
                      <CloseIcon fontSize="inherit" /> Remove
                    </button>
                  )}
                </div>

                <div className={styles.phaseGrid}>
                  <div className={styles.dosingPatternContainer}>
                    <div className={styles.dosingPatternGroup}>
                      {["M", "A", "E", "N"].map((timeLabel, timeIdx) => {
                        const currentVal =
                          sch.frequency.split("-")[timeIdx] || "0";
                        const isDropdownOpen =
                          activeDosePicker?.schIdx === schIdx &&
                          activeDosePicker?.timeIdx === timeIdx;
                        const isDoseSet = currentVal !== "0";

                        return (
                          <div
                            key={timeLabel}
                            className={styles.dosingTimeSlot}
                            style={{ position: "relative" }}
                          >
                            <small>{timeLabel}</small>
                            <button
                              type="button"
                              className={styles.dosingInput}
                              style={{
                                cursor: "pointer",
                                backgroundColor: isDropdownOpen
                                  ? "#f0fdfa"
                                  : isDoseSet
                                    ? "#f0fdfa"
                                    : "#fff",
                                borderColor:
                                  isDropdownOpen || isDoseSet
                                    ? "#007b8e"
                                    : "#cbd5e1",
                                borderStyle: isDoseSet ? "solid" : "dashed",
                                color: isDoseSet ? "#007b8e" : "#94a3b8",
                                fontWeight: isDoseSet ? 700 : 400,
                              }}
                              onClick={() =>
                                setActiveDosePicker(
                                  isDropdownOpen ? null : { schIdx, timeIdx },
                                )
                              }
                            >
                              {isDoseSet ? currentVal : timeLabel}
                            </button>

                            {isDropdownOpen && (
                              <>
                                <div
                                  style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 9,
                                  }}
                                  onClick={() => setActiveDosePicker(null)}
                                />

                                <div
                                  style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    marginTop: "4px",
                                    backgroundColor: "#fff",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "6px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    zIndex: 10,
                                    display: "flex",
                                    flexDirection: "column",
                                    minWidth: "55px",
                                    overflow: "hidden",
                                  }}
                                >
                                  {["0", "1/2", "1", "1 1/2", "2"].map(
                                    (val) => (
                                      <div
                                        key={val}
                                        style={{
                                          padding: "8px 12px",
                                          fontSize: "0.8rem",
                                          cursor: "pointer",
                                          textAlign: "center",
                                          borderBottom:
                                            val !== "2"
                                              ? "1px solid #f1f5f9"
                                              : "none",
                                          backgroundColor:
                                            currentVal === val
                                              ? "#f0fdfa"
                                              : "transparent",
                                          color:
                                            currentVal === val
                                              ? "#007b8e"
                                              : "#334155",
                                          fontWeight:
                                            currentVal === val
                                              ? "bold"
                                              : "normal",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (currentVal !== val)
                                            e.currentTarget.style.backgroundColor =
                                              "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                          if (currentVal !== val)
                                            e.currentTarget.style.backgroundColor =
                                              "transparent";
                                        }}
                                        onClick={() => {
                                          handleFrequencyPartChange(
                                            schIdx,
                                            timeIdx,
                                            val,
                                          );
                                          setActiveDosePicker(null);
                                        }}
                                      >
                                        {val}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      className={styles.compactInput}
                      placeholder="Days"
                      value={sch.duration}
                      onChange={(e) =>
                        updateSchedule(schIdx, "duration", e.target.value)
                      }
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      className={styles.compactInput}
                      value={sch.start_date}
                      onChange={(e) =>
                        updateSchedule(schIdx, "start_date", e.target.value)
                      }
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>End Date</label>
                    <div className={styles.readOnlyBox}>
                      {sch.end_date ? formatForDisplay(sch.end_date) : "-"}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Total Qty</label>
                    <div className={styles.readOnlyBox}>
                      {sch.quantity || "0"}
                    </div>
                  </div>
                </div>

                {isLastPhase && (
                  <button
                    type="button"
                    className={styles.addPhaseBtn}
                    onClick={addNextPhase}
                  >
                    <AddIcon fontSize="inherit" /> Add Next Phase
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.notesSection} style={{ marginTop: "1.5rem" }}>
          <label>Medication notes</label>
          <textarea
            className={styles.notesInput}
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Specific instructions for pharmacist or patient..."
            rows={2}
          />
        </div>

        <div
          className={styles.addMedBtnContainer}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {isEditing && (
            <button
              type="button"
              className={styles.cancelEditBtnSecondary}
              onClick={handleCancelEdit}
            >
              <CloseIcon fontSize="inherit" /> Discard changes
            </button>
          )}
          <button
            type="button"
            className={`${styles.smallAddBtn} ${isReadyToAdd ? (isEditing ? styles.btnUpdate : styles.btnHighlight) : ""}`}
            onClick={handleAddMedicine}
          >
            {isEditing ? (
              <>
                <DoneIcon fontSize="inherit" /> Update medication
              </>
            ) : (
              <>
                <AddIcon fontSize="inherit" /> Add to prescription
              </>
            )}
          </button>
        </div>
      </div>

      {!hideFooter && onSubmit && (
        <div className={styles.footerAction}>
          <button
            type="button"
            className={`${styles.saveBtn} ${formData.medications.length > 0 ? styles.saveBtnHighlight : ""}`}
            onClick={() => onSubmit(formData)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save prescription"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionFormComponent;
