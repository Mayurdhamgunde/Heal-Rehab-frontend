import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Phone,
  Users,
  Edit,
  User,
  Clock,
  Briefcase,
  Calendar,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import styles from "../css/EachDoctors.module.css";
import api from "../utils/central";

// --- Interfaces ---
interface UserData {
  doctor_photo?: string;
  doctor_first_name: string;
  doctor_last_name: string;
  email: string;
  token: string;
  is_admin: boolean;
}

interface Patient {
  _id: string;
  full_name?: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  patient_registration_date: string;
  formattedRegistrationDate?: string;
  status: string;
}

interface TimeSlot {
  start: string;
  end: string;
}
interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}
interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AssignedLocation {
  location_id: string;
  location_name: string;
  working_hours: WorkingHours;
  has_fixed_schedule: boolean;
  schedule_notes: string;
  assigned_at: string;
  is_active: boolean;
  _id?: string;
}

interface Appointment {
  _id: string;
  patient_name: string;
  therepy_start_time: string;
  therepy_type: string;
}

interface DoctorData {
  _id: string;
  doctor_email: string;
  doctor_first_name: string;
  doctor_last_name: string;
  is_admin: boolean;
  organization_name: string;
  department_id?: string;
  department_name?: string;
  doctor_phone: string;
  status: string;
  qualification: string;
  doctors_photo?: string;
  todayAppointments: Appointment[];
  assigned_locations?: AssignedLocation[];
}

// --- Components ---
const EnhancedProfilePhoto = ({ photoUri }: { photoUri?: string }) => (
  <div className={styles.avatarWrapper}>
    {photoUri ? (
      <img src={photoUri} alt="Doctor" className={styles.avatarImage} />
    ) : (
      <User size={40} color="var(--primary)" />
    )}
  </div>
);

const DoctorScreenSkeleton = () => (
  <div className={styles.dashboardLayout}>
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonCard}>
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonInfo}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonSubtitle} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Reduced font sizes and compact layout for LocationCard
const LocationCard: React.FC<{ location: AssignedLocation }> = ({
  location,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActiveDays = () => {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    return days.filter(
      (day) => location.working_hours[day as keyof WorkingHours]?.enabled,
    );
  };

  const activeDays = getActiveDays();

  return (
    <div
      className={styles.locationCard}
      style={{ padding: "0.6rem 0.8rem", marginBottom: "0.5rem" }}
    >
      <div
        className={styles.locationHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          className={styles.locationTitle}
          style={{ fontSize: "0.8rem", gap: "0.35rem" }}
        >
          <MapPin size={14} color="var(--primary)" />
          {location.location_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            className={
              location.is_active ? styles.statusActive : styles.statusInactive
            }
            style={{ fontSize: "0.55rem", padding: "2px 6px" }}
          >
            {location.is_active ? "Active" : "Inactive"}
          </span>
          {isExpanded ? (
            <ChevronUp size={16} color="var(--on-surface-variant)" />
          ) : (
            <ChevronDown size={16} color="var(--on-surface-variant)" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div
          className={styles.locationContent}
          style={{ marginTop: "0.5rem", paddingTop: "0.5rem" }}
        >
          {activeDays.length > 0 ? (
            <div>
              {activeDays.map((day) => {
                const daySchedule =
                  location.working_hours[day as keyof WorkingHours];
                return (
                  <div
                    key={day}
                    className={styles.daySchedule}
                    style={{ marginBottom: "0.25rem" }}
                  >
                    <span
                      className={styles.dayName}
                      style={{ fontSize: "0.7rem" }}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {daySchedule.slots.map((slot, idx) => (
                        <span
                          key={idx}
                          className={styles.timeBadge}
                          style={{ fontSize: "0.65rem", padding: "2px 4px" }}
                        >
                          {slot.start} - {slot.end}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--on-surface-variant)",
                textAlign: "center",
                margin: 0,
              }}
            >
              No active schedule
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const getUserFromStorage = (): UserData | null => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

const EachDoctors: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(getUserFromStorage());
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<string>(
    user?.is_admin ? "quickActions" : "patients",
  );

  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [isPatientsLoading, setIsPatientsLoading] = useState(false);
  const [patientPagination, setPatientPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/departments");
        setDepartments(response.data.departments || []);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepartments();
  }, []);

  const getDepartmentName = (id?: string) => {
    if (!id) return null;
    const dept = departments.find((d) => d._id === id);
    return dept ? dept.department_name : null;
  };

  useEffect(() => {
    const handleUserUpdate = () => {
      const updatedUser = getUserFromStorage();
      setUser(updatedUser);
      if (!updatedUser?.is_admin && activeTab === "quickActions") {
        setActiveTab("patients");
      }
    };
    window.addEventListener("userLogin", handleUserUpdate);
    return () => window.removeEventListener("userLogin", handleUserUpdate);
  }, [activeTab]);

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "N/A";
    const cleaned = phone.replace(/\D/g, "");
    if (phone.startsWith("+"))
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    return `+91 ${cleaned}`;
  };

  const fetchDoctorDetails = useCallback(async () => {
    if (!doctorId) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/web/doctor/${doctorId}`);
      setDoctorData(response.data);
    } catch (error) {
      console.error("Error fetching doctor details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  const fetchDoctorPatients = useCallback(
    async (page: number = 1) => {
      if (!doctorId) return;
      try {
        setIsPatientsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          doctorId: doctorId,
        });
        const response = await api.get("/patient/getAllMy", { params });
        setPatientsList(response.data.patients);
        setPatientPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount,
        });
      } catch (error) {
        console.error("Error fetching doctor patients:", error);
      } finally {
        setIsPatientsLoading(false);
      }
    },
    [doctorId],
  );

  useEffect(() => {
    fetchDoctorDetails();
  }, [fetchDoctorDetails]);

  // Fetches patient data in the background regardless of active tab so the stat counter populates
  useEffect(() => {
    fetchDoctorPatients(patientPagination.currentPage);
  }, [patientPagination.currentPage, fetchDoctorPatients]);

  if (!doctorId) {
    return (
      <div className={styles.dashboardLayout}>
        <div className={styles.emptyState}>
          No doctor ID provided. Please check the URL.
        </div>
      </div>
    );
  }

  if (isLoading || !doctorData) return <DoctorScreenSkeleton />;

  return (
    <div className={styles.dashboardLayout}>
      {/* --- HERO SECTION --- */}
      <section
        className={styles.heroSection}
        style={{ alignItems: "flex-start" }}
      >
        {/* <svg className={styles.heroBackgroundSvg} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M44.7,-76.4C58.3,-69.2,70,-58.5,78.2,-45.5C86.4,-32.5,91.1,-17.2,89.3,-2.6C87.5,12,79.2,25.9,70.1,38.2C61.1,50.5,51.2,61.2,39.2,69.5C27.2,77.7,13.6,83.5,-0.6,84.5C-14.8,85.5,-29.6,81.8,-42.6,74.1C-55.6,66.4,-66.8,54.7,-74.6,41.2C-82.4,27.7,-86.8,12.4,-86.1,-2.7C-85.3,-17.8,-79.4,-32.7,-69.9,-44.9C-60.4,-57.1,-47.4,-66.6,-33.9,-73.9C-20.4,-81.2,-6.4,-86.3,8,-81.4C22.4,-76.5,44.7,-76.4Z" transform="translate(100 100)" />
        </svg> */}
        <EnhancedProfilePhoto photoUri={doctorData?.doctors_photo} />

        {/* Container for split left (Info) and right (Locations) layout */}
        <div
          className={styles.heroContent}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "2rem",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          {/* Left Side: Name and Contact Info */}
          <div style={{ flex: "1", minWidth: "250px" }}>
            <h2 className={`${styles.doctorName} ${styles.fontHeadline}`}>
              {doctorData?.doctor_first_name} {doctorData?.doctor_last_name}
              {doctorData?.is_admin && (
                <span className={styles.adminBadge}>Admin</span>
              )}
            </h2>
            <div className={`${styles.doctorSubInfo} ${styles.fontBody}`}>
              <div className={styles.subInfoItem}>
                <Mail size={16} /> {doctorData?.doctor_email}
              </div>
              <div className={styles.subInfoItem}>
                <Phone size={16} /> {formatPhoneNumber(doctorData.doctor_phone)}
              </div>
            </div>
          </div>

          {/* Right Side: Locations placed cleanly aligned right */}
          {doctorData?.assigned_locations &&
            doctorData.assigned_locations.length > 0 && (
              <div style={{ flex: "1", minWidth: "250px", maxWidth: "320px" }}>
                <h4
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--on-surface-variant)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem",
                  }}
                >
                  Practice Locations
                </h4>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {doctorData.assigned_locations
                    .filter((loc) => loc.is_active)
                    .map((location) => (
                      <LocationCard
                        key={location.location_id}
                        location={location}
                      />
                    ))}
                </div>
              </div>
            )}
        </div>
      </section>

      {/* --- STATS GRID --- */}
      <div className={styles.bentoGrid}>
        <div className={styles.colSpan4}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div className={styles.statIconWrapper}>
              <Users size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Total Patients</p>
              <p className={styles.statValue}>
                {patientPagination.totalCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.colSpan4}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#16a34a", background: "rgba(22, 163, 74, 0.1)" }}
            >
              <Activity size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Status</p>
              <p
                className={styles.statValue}
                style={{ textTransform: "capitalize" }}
              >
                {doctorData.status || "N/A"}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.colSpan4}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{
                color: "#9333ea",
                background: "rgba(147, 51, 234, 0.1)",
              }}
            >
              <Briefcase size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Department / Org</p>
              <p
                className={styles.statValue}
                style={{
                  fontSize: "1rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {doctorData.department_name ||
                  getDepartmentName(doctorData.department_id) ||
                  doctorData.organization_name ||
                  "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className={styles.tabContainer}>
        {user?.is_admin && (
          <div
            className={`${styles.tab} ${activeTab === "quickActions" ? styles.active : ""}`}
            onClick={() => setActiveTab("quickActions")}
          >
            Quick Actions
          </div>
        )}
        <div
          className={`${styles.tab} ${activeTab === "patients" ? styles.active : ""}`}
          onClick={() => setActiveTab("patients")}
        >
          Assigned Patients
        </div>
        <div
          className={`${styles.tab} ${activeTab === "appointments" ? styles.active : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          Today's Appointments
        </div>
      </div>

      {/* --- TAB CONTENT --- */}
      <div className={styles.tabContent}>
        {/* QUICK ACTIONS */}
        {activeTab === "quickActions" && user?.is_admin && (
          <div className={styles.bentoCard}>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate(`/Doctor/${doctorId}/edit`)}
            >
              <Edit size={18} /> Update Profile
            </button>
          </div>
        )}

        {/* PATIENTS LIST */}
        {activeTab === "patients" && (
          <div className={styles.bentoCard}>
            {isPatientsLoading ? (
              <div className={styles.emptyState}>Loading patients...</div>
            ) : patientsList.length > 0 ? (
              <>
                <div className={styles.stripGrid}>
                  {patientsList.map((patient) => (
                    <div key={patient._id} className={styles.stripCard}>
                      <div className={styles.stripMain}>
                        <div className={styles.stripIcon}>
                          <User size={20} color="var(--on-primary)" />
                        </div>
                        <div className={styles.stripText}>
                          <h4>
                            {patient.full_name ||
                              `${patient.patient_first_name} ${patient.patient_last_name}`}
                          </h4>
                          <span className={styles.contactSpan}>
                            <Phone size={12} />{" "}
                            {formatPhoneNumber(patient.patient_phone)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.stripMeta}>
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>Email</span>
                          <span className={styles.metaValue}>
                            {patient.patient_email || "N/A"}
                          </span>
                        </div>
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>Reg Date</span>
                          <span className={styles.metaValue}>
                            {new Date(
                              patient.patient_registration_date,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PAGINATION */}
                {patientPagination.totalPages > 1 && (
                  <div className={styles.paginationContainer}>
                    <span className={styles.paginationText}>
                      Page <strong>{patientPagination.currentPage}</strong> of{" "}
                      <strong>{patientPagination.totalPages}</strong>
                    </span>
                    <div className={styles.paginationControls}>
                      <button
                        className={styles.pageButton}
                        disabled={patientPagination.currentPage === 1}
                        onClick={() =>
                          setPatientPagination((p) => ({
                            ...p,
                            currentPage: p.currentPage - 1,
                          }))
                        }
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        className={styles.pageButton}
                        disabled={
                          patientPagination.currentPage ===
                          patientPagination.totalPages
                        }
                        onClick={() =>
                          setPatientPagination((p) => ({
                            ...p,
                            currentPage: p.currentPage + 1,
                          }))
                        }
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <Users size={32} color="var(--on-surface-variant)" />
                <p>No patients assigned to this doctor yet.</p>
              </div>
            )}
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className={styles.bentoCard}>
            {doctorData?.todayAppointments &&
            doctorData.todayAppointments.length > 0 ? (
              <div className={styles.stripGrid}>
                {doctorData.todayAppointments.map((appointment) => (
                  <div key={appointment._id} className={styles.stripCard}>
                    <div className={styles.stripMain}>
                      <div
                        className={styles.stripIcon}
                        style={{
                          background: "var(--surface-container-low)",
                          color: "var(--primary)",
                        }}
                      >
                        <Clock size={20} />
                      </div>
                      <div className={styles.stripText}>
                        <h4>{appointment.patient_name}</h4>
                        <span className={styles.contactSpan}>
                          <Briefcase size={12} /> {appointment.therepy_type}
                        </span>
                      </div>
                    </div>
                    <div
                      className={styles.stripMeta}
                      style={{ flex: 1, justifyContent: "flex-end" }}
                    >
                      <div
                        className={styles.metaBlock}
                        style={{ alignItems: "flex-end" }}
                      >
                        <span className={styles.metaLabel}>Time</span>
                        <span
                          className={styles.metaValue}
                          style={{ color: "var(--primary)" }}
                        >
                          {appointment.therepy_start_time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Calendar size={32} color="var(--on-surface-variant)" />
                <p>No appointments scheduled for today.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EachDoctors;
