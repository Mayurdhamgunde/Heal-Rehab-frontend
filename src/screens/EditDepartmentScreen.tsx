import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/central";
// Reusing the same CSS module from the Create screen to maintain perfect consistency
import styles from "../css/EditDepartmentScreen.module.css";
import { Briefcase, AlignLeft, MapPin, X, ArrowLeft } from "lucide-react";
import LocationPicker from "../components/HospitalLocation";

interface AssignedLocation {
  location_id: string;
  location_name: string;
}

const EditDepartmentScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Form state
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [assignedLocations, setAssignedLocations] = useState<
    AssignedLocation[]
  >([]);
  const [isAdminDepartment, setIsAdminDepartment] = useState(false);
  const [privileges, setPrivileges] = useState({
    can_register_patients: false,
    can_update_patients: false,
    can_create_treatment_plans: false,
    can_access_all_assessments: false,
    can_give_prescription: false,
    can_create_sessions: false,
    can_delete_patients: false, // ← ADDED
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const session = { idToken: "mock-token" };

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch the existing department details when the component mounts
  useEffect(() => {
    const fetchDepartmentDetails = async () => {
      try {
        const response = await api.get(`/department/${id}`);
        const data = response.data;

        setDepartmentName(data.department_name || "");
        setDepartmentCode(data.department_code || "");
        setDescription(data.description || "");
        setStatus(data.status || "Active");
        setAssignedLocations(data.assigned_locations || []);
        setIsAdminDepartment(data.is_admin_department || false);
        setPrivileges({
          can_register_patients:
            data.privileges?.can_register_patients || false,
          can_update_patients: data.privileges?.can_update_patients || false,
          can_create_treatment_plans:
            data.privileges?.can_create_treatment_plans || false,
          can_access_all_assessments:
            data.privileges?.can_access_all_assessments || false,
          can_give_prescription:
            data.privileges?.can_give_prescription || false,
          can_create_sessions: data.privileges?.can_create_sessions || false,
          can_delete_patients: data.privileges?.can_delete_patients || false, // ← ADDED
        });
      } catch (err: any) {
        console.error("Error fetching department details:", err);
        showToast(
          err.response?.data?.error || "Failed to load department details",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentDetails();
  }, [id]);

  const handleAddLocation = (selectedLoc: any) => {
    const locId = selectedLoc.locationId || selectedLoc._id;

    // Prevent duplicate assignments
    if (assignedLocations.some((loc) => loc.location_id === locId)) {
      showToast(`${selectedLoc.name} is already assigned`, "error");
      return;
    }

    setAssignedLocations([
      ...assignedLocations,
      {
        location_id: locId,
        location_name: selectedLoc.name,
      },
    ]);
  };

  const handleRemoveLocation = (locationIdToRemove: string) => {
    setAssignedLocations(
      assignedLocations.filter((loc) => loc.location_id !== locationIdToRemove),
    );
  };

  const handleSave = async () => {
    if (!departmentName.trim()) {
      showToast("Department Name is required", "error");
      return;
    }

    // Format locations for backend
    const formattedLocations = assignedLocations.map((loc) => ({
      ...loc,
      is_active: true,
    }));

    setSaving(true);
    try {
      const payload = {
        department_name: departmentName.trim(),
        department_code: departmentCode.trim(),
        description: description.trim(),
        status: status,
        assigned_locations: formattedLocations,
        is_admin_department: isAdminDepartment,
        privileges,
      };

      // Ensure this endpoint matches your actual routing configuration (e.g., PUT or PATCH)
      await api.put(`/department/update/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
        },
      });

      showToast("Department updated successfully");

      // Navigate back to the details screen after a short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error: any) {
      console.error("Error updating department:", error);
      const errorMsg =
        error.response?.data?.msg ||
        error.response?.data?.error ||
        "Failed to update department";
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "#007b8e",
        }}
      >
        Loading department details...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toast && (
        <div className={styles.toastContainer}>
          <div
            className={`${styles.toast} ${
              toast.type === "success" ? styles.toastSuccess : styles.toastError
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className={styles.contentWrapper}>
        <div
          className={styles.header}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className={styles.headerTitle}>Edit Department</h1>
            <p className={styles.subtitle}>
              Update department details and location assignments
            </p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Basic Information Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Briefcase size={20} color="#007b8e" />
              <h2 className={styles.sectionTitle}>Basic Information</h2>
            </div>

            <div className={styles.row}>
              <div className={styles.halfInput}>
                <label className={styles.label}>Department Name *</label>
                <input
                  className={styles.input}
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="e.g. Cardiology, Neurology"
                />
              </div>
              <div className={styles.halfInput}>
                <label className={styles.label}>Department Code</label>
                <input
                  className={styles.input}
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  placeholder="e.g. CARDIO, NEURO"
                  style={{ textTransform: "uppercase" }}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.halfInput}>
                <label className={styles.label}>Status</label>
                <select
                  className={styles.input}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Admin Department Toggle */}
            <div className={styles.row}>
              <div className={styles.halfInput}>
                <label className={styles.label}>Admin Department</label>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${isAdminDepartment ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => {
                      const next = !isAdminDepartment;
                      setIsAdminDepartment(next);
                      if (next) {
                        setPrivileges({
                          can_register_patients: true,
                          can_update_patients: true,
                          can_create_treatment_plans: true,
                          can_access_all_assessments: true,
                          can_give_prescription: true,
                          can_create_sessions: true,
                          can_delete_patients: true, // ← ADDED
                        });
                      }
                    }}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                  <span className={styles.toggleLabel}>
                    {isAdminDepartment
                      ? "Doctors in this department will have admin access"
                      : "Standard department — no admin access"}
                  </span>
                </div>
              </div>
            </div>

            {/* Department Privileges */}
            <div className={styles.row}>
              <div style={{ width: "100%" }}>
                <label className={styles.label}>
                  Department Privileges
                  {isAdminDepartment && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "#007b8e",
                        fontWeight: 400,
                      }}
                    >
                      (All granted — admin department)
                    </span>
                  )}
                </label>
                {[
                  {
                    key: "can_register_patients" as const,
                    label: "Register Patients",
                    description: "Can create new patient records",
                  },
                  {
                    key: "can_update_patients" as const,
                    label: "Update Patients",
                    description: "Can edit existing patient information",
                  },
                  {
                    key: "can_create_treatment_plans" as const,
                    label: "Create Treatment Plans",
                    description: "Can create and manage treatment plans",
                  },
                  {
                    key: "can_access_all_assessments" as const,
                    label: "Access All Assessments",
                    description:
                      "Can view and submit assessments across all departments (for data entry and backdated records)",
                  },
                  {
                    key: "can_give_prescription" as const,
                    label: "Give Prescription",
                    description: "Can prescribe medications to patients",
                  },
                  {
                    key: "can_create_sessions" as const,
                    label: "Create Sessions",
                    description:
                      "Can schedule and create therapy or treatment sessions",
                  },
                  {
                    key: "can_delete_patients" as const,
                    label: "Delete Patients",
                    description:
                      "Can permanently remove patient records from the system",
                  },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className={styles.toggleRow}
                    style={{ marginBottom: 12 }}
                  >
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${
                        privileges[key] ? styles.toggleOn : styles.toggleOff
                      }`}
                      onClick={() => {
                        if (isAdminDepartment) return;
                        setPrivileges((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof privileges], // added strict typing for keys
                        }));
                      }}
                      style={{
                        opacity: isAdminDepartment ? 0.6 : 1,
                        cursor: isAdminDepartment ? "not-allowed" : "pointer",
                      }}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                    <div>
                      <span className={styles.toggleLabel}>{label}</span>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <AlignLeft size={20} color="#007b8e" />
              <h2 className={styles.sectionTitle}>Description</h2>
            </div>
            <div className={styles.inputSection}>
              <textarea
                className={`${styles.input} ${styles.descriptionInput}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a brief description of the department's role and responsibilities..."
                style={{ fontFamily: '"Inter", sans-serif' }}
              />
            </div>
          </div>

          {/* Location Assignment Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <MapPin size={20} color="#007b8e" />
              <h2 className={styles.sectionTitle}>Assigned Locations</h2>
            </div>

            {/* Display list of currently selected locations */}
            <div className={styles.assignedLocationsList}>
              {assignedLocations.length === 0 ? (
                <p className={styles.noLocationsText}>
                  No locations assigned yet.
                </p>
              ) : (
                assignedLocations.map((loc) => (
                  <div key={loc.location_id} className={styles.locationTag}>
                    <span className={styles.locationTagName}>
                      {loc.location_name}
                    </span>
                    <button
                      className={styles.locationTagRemove}
                      onClick={() => handleRemoveLocation(loc.location_id)}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.inputSection}>
              <label className={styles.label}>Add Location to Department</label>
              <LocationPicker
                selectedLocation={null}
                onLocationSelect={handleAddLocation}
                showSetAsDefault={false}
                autoSelectPreferred={false}
              />
            </div>
          </div>

          {/* Save Action */}
          <div className={styles.buttonContainer}>
            <button
              className={`${styles.saveButton} ${
                saving || !departmentName.trim() ? styles.disabledButton : ""
              }`}
              onClick={handleSave}
              disabled={saving || !departmentName.trim()}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDepartmentScreen;
