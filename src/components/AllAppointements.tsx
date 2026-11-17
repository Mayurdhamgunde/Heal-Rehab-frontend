import React, { useState, useEffect } from "react";
import {
  FaPen,
  FaTrashAlt,
  FaTimes,
  FaPlus,
  FaStethoscope, // Icon for Consultation
  FaCalendarCheck, // Icon for Therapy
} from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "../css/AllAppointments.module.css";
import api from "../utils/central";
import EditTherapy from "../components/EditTherapy";
import WhatsAppReminderButton from "./WhatsappReminder";

interface TherapyAppointment {
  _id: string;
  plan_id: string;
  patient_id: string;
  is_consultation?: boolean;
  consultationId?: string;
  therepy_id: string;
  therepy_type: string;
  therepy_remarks: string;
  therepy_link: string;
  therepy_date: string;
  therepy_start_time: string;
  therepy_end_time?: string;
  status?: string;
  therepy_cost?: string;
  doctor_name?: string;
  doctor_id?: string;
}

interface AllAppointmentsProps {
  patientId: string;
  onAddAppointment?: () => void; // Keeping this optional in case you use it elsewhere
}

const AllAppointments: React.FC<AllAppointmentsProps> = ({ patientId }) => {
  const navigate = useNavigate(); // Initialize hook
  const [therapyAppointments, setTherapyAppointments] = useState<
    TherapyAppointment[]
  >([]);
  const [therapyLoading, setTherapyLoading] = useState<boolean>(false);
  const [therapyError, setTherapyError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<"all" | "past" | "upcoming">(
    "all",
  );

  // Modal States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // New State for the Add Selection Modal
  const [isAddSelectionVisible, setIsAddSelectionVisible] = useState(false);

  const [selectedTherapy, setSelectedTherapy] =
    useState<TherapyAppointment | null>(null);
  const [therapyToDelete, setTherapyToDelete] =
    useState<TherapyAppointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTherapyAppointments = async () => {
      if (!patientId) return;

      setTherapyLoading(true);
      setTherapyError(null);

      try {
        const response = await api.get(`/therepy/${patientId}`);
        if (response.data.therepys && Array.isArray(response.data.therepys)) {
          setTherapyAppointments(response.data.therepys);
        } else {
          setTherapyAppointments([]);
        }
      } catch (err: any) {
        console.error("Error fetching therapy appointments:", err);
        if (err.response?.status === 404) {
          setTherapyAppointments([]);
        } else {
          setTherapyError(
            err.response?.data?.message ||
              "Error fetching therapy appointments",
          );
        }
      } finally {
        setTherapyLoading(false);
      }
    };

    fetchTherapyAppointments();
  }, [patientId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ... [Keep getFilteredTherapyAppointments logic as is] ...
  const getFilteredTherapyAppointments = () => {
    const now = new Date();
    return therapyAppointments.filter((appointment) => {
      const therapyEndTime = appointment.therepy_end_time
        ? new Date(
            `${appointment.therepy_date}T${appointment.therepy_end_time}`,
          )
        : new Date(`${appointment.therepy_date}T23:59:59`);

      const isPast =
        therapyEndTime < now ||
        appointment.status?.toLowerCase() === "completed";
      const isUpcoming =
        therapyEndTime >= now &&
        appointment.status?.toLowerCase() !== "completed";

      switch (selectedView) {
        case "past":
          return isPast;
        case "upcoming":
          return isUpcoming;
        case "all":
        default:
          return true;
      }
    });
  };

  const renderStatusBadge = (status: string) => {
    let badgeClass = "";
    switch (status?.toLowerCase()) {
      case "ongoing":
      case "in progress":
        badgeClass = styles.statusOngoing;
        break;
      case "completed":
        badgeClass = styles.statusCompleted;
        break;
      case "scheduled":
        badgeClass = styles.statusScheduled;
        break;
      default:
        badgeClass = styles.statusScheduled;
    }
    return (
      <span className={`${styles.statusBadge} ${badgeClass}`}>
        {status || "Scheduled"}
      </span>
    );
  };

  // ... [Keep Delete/Edit/Update/Join/Reminder handlers as is] ...
  const handleEditTherapy = (therapy: TherapyAppointment) => {
    setSelectedTherapy(therapy);
    setIsEditModalVisible(true);
  };

  const handleDeleteTherapy = (therapy: TherapyAppointment) => {
    setTherapyToDelete(therapy);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteTherapy = async () => {
    if (!therapyToDelete) return;
    setIsDeleting(true);
    try {
      const response = await api.delete(
        `/therapy/delete/${therapyToDelete._id}`,
      );
      if (response.status !== 200)
        throw new Error(`HTTP error! status: ${response.status}`);

      setTherapyAppointments((prevAppointments) =>
        prevAppointments.filter((app) => app._id !== therapyToDelete._id),
      );
      setSuccessMessage("Therapy deleted successfully");
    } catch (err: any) {
      console.error(
        "Error deleting therapy:",
        err.response?.data || err.message,
      );
      setTherapyError(
        err.response?.data?.message || "Failed to delete appointment",
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setTherapyToDelete(null);
    }
  };

  const handleUpdateTherapy = async (updatedTherapy: TherapyAppointment) => {
    try {
      const response = await api.patch(
        `/therepy/update/${updatedTherapy._id}`,
        updatedTherapy,
      );
      setTherapyAppointments((prevAppointments) =>
        prevAppointments.map((app) =>
          app._id === updatedTherapy._id ? response.data.therapy : app,
        ),
      );
      setIsEditModalVisible(false);
      setSuccessMessage("Therapy updated successfully");
    } catch (err: any) {
      console.error(
        "Error updating therapy:",
        err.response?.data || err.message,
      );
      setTherapyError(
        err.response?.data?.message || "Failed to update appointment",
      );
    }
  };

  const handleJoinTherapy = (therapy: TherapyAppointment) => {
    if (therapy.therepy_link) window.open(therapy.therepy_link, "_blank");
  };

  const handleViewRecording = (therapy: TherapyAppointment) => {
    if (therapy.therepy_id) {
      const recordingUrl = `https://app.contact.liveswitch.com/conversations/${therapy.therepy_id}`;
      window.open(recordingUrl, "_blank");
    }
  };

  const handleWhatsAppSuccess = () => {
    setSuccessMessage("WhatsApp reminder sent successfully");
  };

  // --- NEW: Handle Add Button Click ---
  const handleAddClick = () => {
    // Open the selection modal instead of immediately firing callback
    setIsAddSelectionVisible(true);
  };

  // --- NEW: Handle Selection Navigation ---
  const handleSelection = (type: "therapy" | "consultation") => {
    setIsAddSelectionVisible(false);

    if (type === "therapy") {
      // Navigate to bookAppointment.tsx route
      navigate(`/bookAppoinment/${patientId}`);
    } else {
      // Navigate to setupConsultation.tsx route
      // Assuming route is /consultations/:patientId or similar
      navigate(`/consultations/${patientId}`);
    }
  };

  return (
    <div className={styles.appointmentsTab}>
      {successMessage && (
        <div className={styles.successMessage}>
          <p>{successMessage}</p>
          <button
            className={styles.closeSuccessButton}
            onClick={() => setSuccessMessage(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.headerControls}>
          <div className={styles.viewSelector}>
            <button
              className={`${styles.viewButton} ${selectedView === "all" ? styles.activeView : ""}`}
              onClick={() => setSelectedView("all")}
            >
              All
            </button>
            <button
              className={`${styles.viewButton} ${selectedView === "upcoming" ? styles.activeView : ""}`}
              onClick={() => setSelectedView("upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`${styles.viewButton} ${selectedView === "past" ? styles.activeView : ""}`}
              onClick={() => setSelectedView("past")}
            >
              Past
            </button>
          </div>

          {/* Modified Add Button */}
          <button
            className={styles.addAppointmentBtn}
            onClick={handleAddClick} // Changed from onAddAppointment to local handler
            title="Create New"
          >
            <FaPlus size={20} />
          </button>
        </div>
      </div>

      {/* List Rendering Logic (Unchanged) */}
      {therapyLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading appointments...</p>
        </div>
      ) : therapyError ? (
        <div className={styles.error}>{therapyError}</div>
      ) : (
        <div className={styles.appointmentsList}>
          {getFilteredTherapyAppointments().length === 0 ? (
            <div className={styles.noRecords}>
              <p>
                No {selectedView === "all" ? "" : selectedView} appointments
                found for this patient.
              </p>
            </div>
          ) : (
            getFilteredTherapyAppointments().map((appointment) => {
              const now = new Date();
              const therapyStartTime = new Date(
                `${appointment.therepy_date}T${appointment.therepy_start_time}`,
              );
              const therapyEndTime = appointment.therepy_end_time
                ? new Date(
                    `${appointment.therepy_date}T${appointment.therepy_end_time}`,
                  )
                : new Date(`${appointment.therepy_date}T23:59:59`);

              const isPast =
                now > therapyEndTime ||
                appointment.status?.toLowerCase() === "completed";
              const canStart =
                now >= therapyStartTime &&
                now < therapyEndTime &&
                appointment.status?.toLowerCase() !== "completed";
              const isEditable =
                appointment.status?.toLowerCase() !== "completed";

              const handleCardClick = () => {
                // Only navigate if the status is "completed"
                if (appointment.status?.toLowerCase() === "completed") {
                  if (
                    appointment.is_consultation &&
                    appointment.consultationId
                  ) {
                    navigate(
                      `/consultationDetails/${appointment.consultationId}`,
                    );
                  } else {
                    navigate(`/sessionDetails/${appointment._id}`);
                  }
                } else {
                  // Optional: You could show a small toast or message here
                  // saying "Details are only available for completed sessions."
                  console.log(
                    "Navigation restricted: Session is not completed.",
                  );
                }
              };
              return (
                <div
                  key={appointment._id}
                  className={styles.therapyAppointmentCard}
                  onClick={handleCardClick}
                  style={{
                    cursor:
                      appointment.status?.trim().toLowerCase() === "completed"
                        ? "pointer"
                        : "not-allowed", // 'not-allowed' gives better feedback than 'default'
                  }}
                >
                  <div className={styles.appointmentHeader}>
                    <div className={styles.appointmentTitle}>
                      <h4>{appointment.therepy_type}</h4>

                      {/* Type Badge: Consultation vs Session */}
                      <span
                        className={`${styles.typeBadge} ${appointment.is_consultation ? styles.consultationType : styles.sessionType}`}
                      >
                        {appointment.is_consultation
                          ? "Consultation"
                          : "Session"}
                      </span>

                      {/* Status Badge: Completed, Scheduled, etc. */}
                      <span className={styles.appointmentStatus}>
                        {renderStatusBadge(appointment.status || "Scheduled")}
                      </span>
                    </div>
                    <div className={styles.appointmentActions}>
                      {isEditable && (
                        <>
                          <button
                            className={styles.editButton}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents the card's navigate() from firing
                              handleEditTherapy(appointment);
                            }}
                            title="Edit"
                          >
                            <FaPen />
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents the card's navigate() from firing
                              handleDeleteTherapy(appointment);
                            }}
                            title="Delete"
                          >
                            <FaTrashAlt />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.appointmentDetails}>
                    <div className={styles.appointmentItem}>
                      <span className={styles.appointmentLabel}>Date:</span>
                      <span className={styles.appointmentValue}>
                        {formatDate(appointment.therepy_date)}
                      </span>
                    </div>
                    <div className={styles.appointmentItem}>
                      <span className={styles.appointmentLabel}>Time:</span>
                      <span className={styles.appointmentValue}>
                        {appointment.therepy_start_time} -{" "}
                        {appointment.therepy_end_time || "N/A"}
                      </span>
                    </div>
                    <div className={styles.appointmentItem}>
                      <span className={styles.appointmentLabel}>Doctor:</span>
                      <span className={styles.appointmentValue}>
                        {appointment.doctor_name || "Not assigned"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.appointmentButtons}>
                    {(!appointment.status ||
                      appointment.status.toLowerCase() !== "completed") && (
                      <WhatsAppReminderButton
                        sessionId={appointment._id}
                        onClick={(e) => e.stopPropagation()}
                        patientName={appointment.doctor_name || "Patient"}
                        size="small"
                        disabled={
                          isPast &&
                          appointment.status?.toLowerCase() !== "scheduled"
                        }
                        onSuccess={handleWhatsAppSuccess}
                      />
                    )}
                    {canStart && appointment.therepy_link && (
                      <button
                        className={`${styles.appointmentButton} ${styles.joinButton}`}
                        onClick={() => handleJoinTherapy(appointment)}
                      >
                        Start Therapy
                      </button>
                    )}
                    {isPast && appointment.therepy_id && (
                      <button
                        className={`${styles.appointmentButton} ${styles.recordingButton}`}
                        onClick={() => handleViewRecording(appointment)}
                      >
                        View Recording
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalVisible && selectedTherapy && (
        <div className={styles.editOverlay}>
          <EditTherapy
            therapy={selectedTherapy as any}
            onUpdate={handleUpdateTherapy}
            onCancel={() => setIsEditModalVisible(false)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Confirm Deletion</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowDeleteConfirmation(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete this therapy?</p>
              {therapyError && <p className={styles.error}>{therapyError}</p>}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.updateButton} ${isDeleting ? styles.disabled : ""}`}
                onClick={confirmDeleteTherapy}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: Selection Modal for "Plus" Button --- */}
      {isAddSelectionVisible && (
        <div className={styles.overlay}>
          <div className={styles.selectionModal}>
            <div className={styles.selectionHeader}>
              <h3 className={styles.selectionTitle}>Create New</h3>
              <p className={styles.selectionSubtitle}>
                What would you like to schedule?
              </p>
              <button
                className={styles.closeButton}
                style={{ position: "absolute", right: "1rem", top: "1rem" }}
                onClick={() => setIsAddSelectionVisible(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.selectionGrid}>
              {/* Option 1: Therapy */}
              <div
                className={styles.optionCard}
                onClick={() => handleSelection("therapy")}
              >
                <div className={styles.optionIconCircle}>
                  <FaCalendarCheck />
                </div>
                <div>
                  <div className={styles.optionLabel}>Book Session</div>
                  <div className={styles.optionDesc}>
                    Book a regular therapy appointment
                  </div>
                </div>
              </div>

              {/* Option 2: Consultation */}
              <div
                className={styles.optionCard}
                onClick={() => handleSelection("consultation")}
              >
                <div className={styles.optionIconCircle}>
                  <FaStethoscope />
                </div>
                <div>
                  <div className={styles.optionLabel}>Book Consultation</div>
                  <div className={styles.optionDesc}>
                    Schedule a doctor consultation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAppointments;
