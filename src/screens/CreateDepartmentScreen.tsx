import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/CreateDepartmentScreen.module.css";
import { Briefcase, AlignLeft, MapPin, X } from "lucide-react";
import LocationPicker from "../components/HospitalLocation";

// Simplified interface specifically for the department's payload
interface AssignedLocation {
  location_id: string;
  location_name: string;
}

const CreateDepartmentScreen: React.FC = () => {
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
    can_access_all_assessments: false, // ← NEW
  });

  // UI state
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
        department_name: departmentName,
        department_code: departmentCode,
        description: description,
        status: status,
        assigned_locations: formattedLocations,
        is_admin_department: isAdminDepartment,
        privileges,
      };

      await api.post("/department/create", payload, {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
        },
      });

      showToast("Department created successfully");

      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error: any) {
      console.error("Error creating department:", error);
      const errorMsg =
        error.response?.data?.msg || "Failed to create department";
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

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
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Create New Department</h1>
          <p className={styles.subtitle}>
            Set up a new department for your organization
          </p>
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
                      // Admin departments automatically receive all privileges
                      if (next) {
                        setPrivileges({
                          can_register_patients: true,
                          can_update_patients: true,
                          can_create_treatment_plans: true,
                          can_access_all_assessments: true, // ← NEW
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
                    key: "can_access_all_assessments" as const, // ← NEW
                    label: "Access All Assessments",
                    description:
                      "Can view and submit assessments across all departments (for data entry and backdated records)",
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
                          [key]: !prev[key],
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
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.inputSection}>
              <label className={styles.label}>Add Location to Department</label>
              {/* Force selectedLocation to null so it acts purely as an 'Add' selector */}
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
              {saving ? "Creating Department..." : "Create Department"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDepartmentScreen;
