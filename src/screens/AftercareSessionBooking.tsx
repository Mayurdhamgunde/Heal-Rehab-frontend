import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import styles from "../css/AftercareSessionBooking.module.css";
import api from "../utils/central";

interface AftercareSessionBookingProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: () => void;
  careTeam?: any[];
}

// Utility to calculate: Today + 28 days -> Next Sunday
const calculateDefaultDate = () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 28);

  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfWeek = targetDate.getDay();

  // If it's already Sunday, this adds 0 days. Otherwise, it shifts to the next one.
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  targetDate.setDate(targetDate.getDate() + daysUntilSunday);

  return targetDate.toISOString().split("T")[0];
};

const AftercareSessionBooking: React.FC<AftercareSessionBookingProps> = ({
  isOpen,
  onClose,
  patientId,
  onSuccess,
  careTeam,
}) => {
  const [isCreatingAftercare, setIsCreatingAftercare] = useState(false);

  // Department and Cascading Doctor States
  const [departments, setDepartments] = useState<any[]>([]);

  const [physicianDeptId, setPhysicianDeptId] = useState("");
  const [physicianDoctors, setPhysicianDoctors] = useState<any[]>([]);
  const [isLoadingPhysicians, setIsLoadingPhysicians] = useState(false);
  const [selectedPhysician, setSelectedPhysician] = useState("");

  const [counsellorDeptId, setCounsellorDeptId] = useState("");
  const [counsellorDoctors, setCounsellorDoctors] = useState<any[]>([]);
  const [isLoadingCounsellors, setIsLoadingCounsellors] = useState(false);
  const [selectedCounsellor, setSelectedCounsellor] = useState("");

  // Scheduling States
  const [sessionDate, setSessionDate] = useState(calculateDefaultDate());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");

  // 1. Fetch departments when modal opens and set defaults based on care team
  useEffect(() => {
    if (isOpen && departments.length === 0) {
      api
        .get("/departments")
        .then((res) => {
          const fetchedDepartments = res.data.departments || [];
          setDepartments(fetchedDepartments);

          // Physician Department Logic
          const assignedSpecialist = careTeam?.find(
            (m) => m.role === "Specialist",
          );
          if (assignedSpecialist) {
            setPhysicianDeptId(assignedSpecialist.department_id);
          } else {
            const defaultPhysicianDept =
              fetchedDepartments.find(
                (d: any) =>
                  !d.is_admin_department && d.privileges?.can_give_prescription,
              ) ||
              fetchedDepartments.find(
                (d: any) => d.privileges?.can_give_prescription,
              );

            if (defaultPhysicianDept) {
              setPhysicianDeptId(defaultPhysicianDept._id);
            }
          }

          // Counsellor Department Logic
          const assignedCounselor = careTeam?.find(
            (m) => m.role === "Head Counselor",
          );
          if (assignedCounselor) {
            setCounsellorDeptId(assignedCounselor.department_id);
          } else {
            const defaultCounsellorDept =
              fetchedDepartments.find(
                (d: any) =>
                  !d.is_admin_department && d.privileges?.can_create_sessions,
              ) ||
              fetchedDepartments.find(
                (d: any) => d.privileges?.can_create_sessions,
              );

            if (defaultCounsellorDept) {
              setCounsellorDeptId(defaultCounsellorDept._id);
            }
          }
        })
        .catch((err) => console.error("Failed to load departments", err));
    }
  }, [isOpen, departments.length, careTeam]);

  // 2. Fetch physician doctors and auto-select if in care team
  useEffect(() => {
    setSelectedPhysician("");
    if (physicianDeptId) {
      setIsLoadingPhysicians(true);
      api
        .get(`/department/${physicianDeptId}`)
        .then((res) => {
          const members = res.data.members || [];
          setPhysicianDoctors(members);

          // Auto-select assigned Specialist
          const assignedSpecialist = careTeam?.find(
            (m) =>
              m.role === "Specialist" && m.department_id === physicianDeptId,
          );
          if (
            assignedSpecialist &&
            members.some((m: any) => m._id === assignedSpecialist.doctor_id)
          ) {
            setSelectedPhysician(assignedSpecialist.doctor_id);
          }
        })
        .catch((err) => console.error("Failed to load physician doctors", err))
        .finally(() => setIsLoadingPhysicians(false));
    } else {
      setPhysicianDoctors([]);
    }
  }, [physicianDeptId, careTeam]);

  // 3. Fetch counsellor doctors and auto-select if in care team
  useEffect(() => {
    setSelectedCounsellor("");
    if (counsellorDeptId) {
      setIsLoadingCounsellors(true);
      api
        .get(`/department/${counsellorDeptId}`)
        .then((res) => {
          const members = res.data.members || [];
          setCounsellorDoctors(members);

          // Auto-select assigned Head Counselor
          const assignedCounselor = careTeam?.find(
            (m) =>
              m.role === "Head Counselor" &&
              m.department_id === counsellorDeptId,
          );
          if (
            assignedCounselor &&
            members.some((m: any) => m._id === assignedCounselor.doctor_id)
          ) {
            setSelectedCounsellor(assignedCounselor.doctor_id);
          }
        })
        .catch((err) => console.error("Failed to load counsellor doctors", err))
        .finally(() => setIsLoadingCounsellors(false));
    } else {
      setCounsellorDoctors([]);
    }
  }, [counsellorDeptId, careTeam]);

  // Reset the date calculation if the modal is closed and reopened later
  useEffect(() => {
    if (isOpen) {
      setSessionDate(calculateDefaultDate());
    }
  }, [isOpen]);

  const handleBookSession = async () => {
    if (!patientId) return;

    if (!selectedPhysician || !selectedCounsellor) {
      alert("Both a Physician and a Counsellor are required for Aftercare.");
      return;
    }

    setIsCreatingAftercare(true);

    const physician = physicianDoctors.find((d) => d._id === selectedPhysician);
    const counsellor = counsellorDoctors.find(
      (d) => d._id === selectedCounsellor,
    );

    try {
      const payload = {
        physician_id: physician._id,
        physician_name: `${physician.doctor_first_name} ${physician.doctor_last_name}`,
        counsellor_id: counsellor._id,
        counsellor_name: `${counsellor.doctor_first_name} ${counsellor.doctor_last_name}`,
        reference_date: sessionDate,
        aftercare_config: {
          session_start_time: startTime,
          session_end_time: endTime,
        },
      };

      await api.post(`/create/aftercareSessions/${patientId}`, payload);

      alert("Aftercare session scheduled successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating aftercare session:", err);
      const errorMsg =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.msg ||
        "Failed to schedule the session.";
      alert(errorMsg);
    } finally {
      setIsCreatingAftercare(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>Schedule Aftercare Session</h3>
          <button onClick={onClose} className={styles.closeModalBtn}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formContent}>
            {/* ROW 1: PHYSICIAN SELECTION */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Physician Department *</label>
                <select
                  value={physicianDeptId}
                  onChange={(e) => setPhysicianDeptId(e.target.value)}
                  className={styles.selectInput}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Assign Physician *</label>
                <select
                  value={selectedPhysician}
                  onChange={(e) => setSelectedPhysician(e.target.value)}
                  className={styles.selectInput}
                  disabled={!physicianDeptId || isLoadingPhysicians}
                  required
                >
                  <option value="">
                    {isLoadingPhysicians
                      ? "Loading..."
                      : "-- Select Physician --"}
                  </option>
                  {physicianDoctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.doctor_first_name} {doc.doctor_last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ROW 2: COUNSELLOR SELECTION */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Counsellor Department *</label>
                <select
                  value={counsellorDeptId}
                  onChange={(e) => setCounsellorDeptId(e.target.value)}
                  className={styles.selectInput}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Assign Counsellor *</label>
                <select
                  value={selectedCounsellor}
                  onChange={(e) => setSelectedCounsellor(e.target.value)}
                  className={styles.selectInput}
                  disabled={!counsellorDeptId || isLoadingCounsellors}
                  required
                >
                  <option value="">
                    {isLoadingCounsellors
                      ? "Loading..."
                      : "-- Select Counsellor --"}
                  </option>
                  {counsellorDoctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.doctor_first_name} {doc.doctor_last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DATE (Calculated 28 days + Sunday, editable) */}
            <div className={styles.formGroup}>
              <label>Session Reference Date (Editable)</label>
              <input
                type="date"
                className={styles.selectInput}
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Start Time</label>
                <input
                  type="time"
                  className={styles.selectInput}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>End Time</label>
                <input
                  type="time"
                  className={styles.selectInput}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleBookSession}
            className={styles.saveBtn}
            disabled={isCreatingAftercare}
          >
            {isCreatingAftercare ? "Scheduling..." : "Book Session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AftercareSessionBooking;
