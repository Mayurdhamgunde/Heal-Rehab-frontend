import React, { useState, useEffect } from "react";
import { MapPin, Edit, Trash2, Plus, Clock } from "lucide-react";
import styles from "../css/EditDoctor.module.css";
import api from "../utils/central";
import { useNavigate, useParams } from "react-router-dom";
import EditLocationModal from "../components/EditLocationModal";
import DepartmentDropdown from "../components/Rehab/departmentDropdown";

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

interface ActiveHours {
  type: "24h" | "fixed";
  start: string;
  end: string;
  enabled: boolean;
}

interface ProfileInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  qualification: string;
  organization_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctors_photo: string;
  department_id?: string;
  is_admin: boolean;
  status: string;
  assigned_locations?: AssignedLocation[];
  active_hours?: ActiveHours;
}

const initialProfileState: ProfileInfo = {
  _id: "",
  doctor_first_name: "",
  doctor_last_name: "",
  qualification: "",
  organization_name: "",
  doctor_email: "",
  doctor_phone: "",
  doctors_photo: "",
  department_id: "",
  is_admin: false,
  status: "active",
  assigned_locations: [],
  active_hours: {
    type: "24h",
    start: "09:00",
    end: "18:00",
    enabled: false,
  },
};

const EditDoctor: React.FC = () => {
  const session = { idToken: "mock-token" };
  const { doctorId } = useParams<{ doctorId: string }>();
  const [profileInfo, setProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [originalProfileInfo, setOriginalProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({
    doctor_first_name: false,
    doctor_last_name: false,
    qualification: false,
    doctor_email: false,
    doctor_phone: false,
    department_id: false,
    address: false,
    city: false,
    state: false,
    password: false,
    is_admin: false,
    status: false,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<AssignedLocation | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [activeHoursError, setActiveHoursError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleActiveHoursChange = (patch: Partial<ActiveHours>) => {
    setProfileInfo((prev) => ({
      ...prev,
      active_hours: {
        type: "24h",
        start: "09:00",
        end: "18:00",
        enabled: false,
        ...prev.active_hours,
        ...patch,
      },
    }));

    // Validate start < end when type is "fixed"
    const merged = {
      ...(profileInfo.active_hours || {}),
      ...patch,
    } as ActiveHours;

    if (merged.type === "fixed" && merged.start && merged.end) {
      setActiveHoursError(
        merged.start >= merged.end
          ? "Start time must be earlier than end time"
          : null,
      );
    } else {
      setActiveHoursError(null);
    }
  };

  const validatePhone = (fullPhone: string): boolean => {
    let isValid = false;

    if (fullPhone.startsWith("+1")) {
      const usRegex = /^\+1[2-9]\d{9}$/;
      isValid = usRegex.test(fullPhone);
      setPhoneError(
        isValid
          ? null
          : "US numbers must start with 2-9 and be 10 digits total",
      );
    } else if (fullPhone.startsWith("+44")) {
      const ukRegex = /^\+44[1-5]\d{9}$/;
      isValid = ukRegex.test(fullPhone);
      setPhoneError(isValid ? null : "UK numbers must be 12 digits total");
    } else {
      const defaultRegex = /^\+\d{1,4}\d{6,}$/;
      isValid = defaultRegex.test(fullPhone);
      setPhoneError(isValid ? null : "Please enter a valid phone number");
    }

    return isValid;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailError(isValid ? null : "Please enter a valid email address");
    return isValid;
  };

  const validateField = (field: string, value: any): boolean => {
    if (field === "doctor_email") {
      return validateEmail(value);
    } else if (field === "doctor_phone") {
      return validatePhone(countryCode + phoneDigits);
    } else if (field === "is_admin" || field === "status") {
      return true;
    } else {
      return typeof value === "string" ? value.trim() !== "" : true;
    }
  };

  useEffect(() => {
    if (session.idToken) {
      fetchDoctorInfo();
    } else {
      setIsLoading(false);
    }
  }, [session.idToken]);

  useEffect(() => {
    if (profileInfo.doctor_phone) {
      let code = "";
      let digits = "";

      if (profileInfo.doctor_phone.includes(" ")) {
        const parts = profileInfo.doctor_phone.split(" ");
        code = parts[0];
        digits = parts.slice(1).join("");
      } else {
        const match = profileInfo.doctor_phone.match(/^(\+\d{1,4})(\d{10})$/);
        if (match) {
          code = match[1];
          digits = match[2];
        } else {
          code = profileInfo.doctor_phone.slice(0, 3);
          digits = profileInfo.doctor_phone.slice(3);
        }
      }

      setCountryCode(code);
      setPhoneDigits(digits);
    }
  }, [profileInfo.doctor_phone]);

  const fetchDoctorInfo = async () => {
    if (!session.idToken) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.get(`/doctor/${doctorId}`);
      const doctorData = {
        ...(response.data || response),
        assigned_locations:
          (response.data || response).assigned_locations || [],
      };
      setProfileInfo(doctorData);
      setOriginalProfileInfo(doctorData);
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      alert("Failed to fetch doctor information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    const limited = cleaned.slice(0, 10);
    setPhoneDigits(limited);
    validatePhone(countryCode + limited);

    setFormErrors((prev) => ({
      ...prev,
      doctor_phone: limited.length === 0,
      address: prev.address,
      city: prev.city,
      state: prev.state,
      password: prev.password,
    }));
  };

  const handleInputChange = (field: keyof ProfileInfo, value: any) => {
    if (field === "doctor_phone") {
      handlePhoneChange(value);
    } else {
      if (field === "is_admin") {
        if (typeof value === "string") {
          value = value === "true";
        }
      }

      setProfileInfo((prev) => ({ ...prev, [field]: value }));

      if (field !== "is_admin" && field !== "status") {
        setFormErrors((prev) => ({
          ...prev,
          [field]: !validateField(field, value),
          address: prev.address,
          city: prev.city,
          state: prev.state,
          password: prev.password,
        }));
      }

      if (field === "doctor_email") {
        validateEmail(value);
      }
    }
  };

  const hasChanges = () => {
    const currentFullPhone = countryCode + phoneDigits;

    return (
      JSON.stringify(profileInfo) !== JSON.stringify(originalProfileInfo) ||
      currentFullPhone !== originalProfileInfo.doctor_phone
    );
  };

  const validateAllFields = (): boolean => {
    const fullPhone = countryCode + phoneDigits;

    const errors = {
      doctor_first_name: profileInfo.doctor_first_name.trim() === "",
      doctor_last_name: profileInfo.doctor_last_name.trim() === "",
      qualification: profileInfo.qualification.trim() === "",
      doctor_email: !validateEmail(profileInfo.doctor_email),
      doctor_phone: !validatePhone(fullPhone),
      department_id:
        !profileInfo.department_id || profileInfo.department_id.trim() === "",
      is_admin: false,
      status: false,
      address: false,
      city: false,
      state: false,
      password: false,
    };

    setFormErrors(errors);

    return !Object.values(errors).some((error) => error === true);
  };

  // Location handlers
  const handleAddLocation = () => {
    setEditingLocation(null);
    setIsEditingLocation(false);
    setShowLocationModal(true);
  };

  const handleEditLocation = (location: AssignedLocation) => {
    setEditingLocation(location);
    setIsEditingLocation(true);
    setShowLocationModal(true);
  };

  const handleSaveLocation = (location: AssignedLocation) => {
    if (isEditingLocation) {
      const updatedLocations =
        profileInfo.assigned_locations?.map((loc) =>
          loc.location_id === location.location_id ? location : loc,
        ) || [];
      setProfileInfo((prev) => ({
        ...prev,
        assigned_locations: updatedLocations,
      }));
    } else {
      setProfileInfo((prev) => ({
        ...prev,
        assigned_locations: [...(prev.assigned_locations || []), location],
      }));
    }
  };

  const handleDeleteLocation = (locationId: string) => {
    if (window.confirm("Are you sure you want to remove this location?")) {
      const updatedLocations =
        profileInfo.assigned_locations?.filter(
          (loc) => loc.location_id !== locationId,
        ) || [];
      setProfileInfo((prev) => ({
        ...prev,
        assigned_locations: updatedLocations,
      }));
    }
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      alert("Please fill in all required fields correctly.");
      return;
    }

    const fullPhone = countryCode + phoneDigits;

    if (!hasChanges()) {
      alert("No changes were made to the profile.");
      return;
    }

    if (!session.idToken) {
      alert("You must be logged in to update the profile");
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.put(`/doctor/update/${profileInfo._id}`, {
        doctor_first_name: profileInfo.doctor_first_name,
        doctor_last_name: profileInfo.doctor_last_name,
        qualification: profileInfo.qualification,
        organization_name: profileInfo.organization_name,
        doctor_email: profileInfo.doctor_email,
        doctor_phone: fullPhone,
        department_id: profileInfo.department_id,
        is_admin: profileInfo.is_admin,
        status: profileInfo.status,
        assigned_locations: profileInfo.assigned_locations,
        active_hours: profileInfo.active_hours,
      });

      if (response) {
        setOriginalProfileInfo({ ...profileInfo, doctor_phone: fullPhone });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = (continueEditing: boolean) => {
    setShowSuccessModal(false);
    if (!continueEditing) {
      navigate(`/doctor/${doctorId}`);
    }
  };

  // Helper to extract initials
  const getInitials = (first: string, last: string) => {
    const firstInitial = first ? first.charAt(0).toUpperCase() : "";
    const lastInitial = last ? last.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}` || "DR";
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.fontBody}>Loading doctor information...</p>
        </div>
      </div>
    );
  }

  if (!session.idToken) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p className={styles.fontBody}>Please log in to edit the doctor profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <h1 className={styles.fontHeadline}>Edit Doctor Profile</h1>
      </header>

      <div className={styles.formCard}>
        {/* Profile Header Section */}
        <div className={styles.profileHeader}>
          <div className={styles.profilePhotoContainer}>
            {profileInfo.doctors_photo ? (
              <img
                src={profileInfo.doctors_photo}
                alt="Doctor Profile"
                className={styles.profilePhoto}
              />
            ) : (
              <div className={styles.initialsFallback}>
                {getInitials(
                  profileInfo.doctor_first_name,
                  profileInfo.doctor_last_name,
                )}
              </div>
            )}
          </div>
          <div className={styles.profileBasicInfo}>
            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName">
                  First Name <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  className={`${styles.input} ${
                    formErrors.doctor_first_name ? styles.error : styles.valid
                  }`}
                  value={profileInfo.doctor_first_name}
                  onChange={(e) =>
                    handleInputChange("doctor_first_name", e.target.value)
                  }
                  required
                  aria-invalid={formErrors.doctor_first_name}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName">
                  Last Name <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={`${styles.input} ${
                    formErrors.doctor_last_name ? styles.error : styles.valid
                  }`}
                  value={profileInfo.doctor_last_name}
                  onChange={(e) =>
                    handleInputChange("doctor_last_name", e.target.value)
                  }
                  required
                  aria-invalid={formErrors.doctor_last_name}
                />
              </div>
            </div>
            <div className={styles.qualificationRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="qualification">
                  Qualification{" "}
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  id="qualification"
                  type="text"
                  className={`${styles.input} ${
                    formErrors.qualification ? styles.error : styles.valid
                  }`}
                  value={profileInfo.qualification}
                  onChange={(e) =>
                    handleInputChange("qualification", e.target.value)
                  }
                  required
                  aria-invalid={formErrors.qualification}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="organization">Organization Name</label>
                <input
                  id="organization"
                  type="text"
                  className={styles.input}
                  value={profileInfo.organization_name}
                  onChange={(e) =>
                    handleInputChange("organization_name", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className={styles.additionalInfo}>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <DepartmentDropdown
                value={profileInfo.department_id || ""}
                onChange={(value) => handleInputChange("department_id", value)}
                error={
                  formErrors.department_id
                    ? "Please select a department"
                    : undefined
                }
              />
            </div>
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">
                Email Address <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`${styles.input} ${
                  emailError || formErrors.doctor_email
                    ? styles.error
                    : styles.valid
                }`}
                value={profileInfo.doctor_email}
                onChange={(e) =>
                  handleInputChange("doctor_email", e.target.value)
                }
                required
                aria-invalid={formErrors.doctor_email}
                aria-describedby={emailError ? "emailError" : undefined}
              />
              {emailError && (
                <span id="emailError" className={styles.errorText}>
                  {emailError}
                </span>
              )}
            </div>
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">
                Contact Number{" "}
                <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div className={styles.phoneContainer}>
                <select
                  className={styles.countrySelect}
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    validatePhone(e.target.value + phoneDigits);
                  }}
                  aria-label="Country Code"
                >
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (IN)</option>
                </select>
                <input
                  id="phone"
                  type="tel"
                  className={`${styles.input} ${
                    phoneError || formErrors.doctor_phone
                      ? styles.error
                      : styles.valid
                  }`}
                  value={phoneDigits}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Mobile Number"
                  maxLength={10}
                  required
                  aria-invalid={formErrors.doctor_phone}
                  aria-describedby={phoneError ? "phoneError" : undefined}
                />
              </div>
              {phoneError && (
                <span id="phoneError" className={styles.errorText}>
                  {phoneError}
                </span>
              )}
            </div>
          </div>

          <div className={styles.locationSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Locations</h3>
            </div>
            <p className={styles.sectionDescription}>
              Manage practice locations and working hours for this doctor.
            </p>

            {!profileInfo.assigned_locations ||
            profileInfo.assigned_locations.length === 0 ? (
              <div className={styles.noLocationsContainer}>
                <MapPin className={styles.noLocationsIcon} size={28} />
                <p className={styles.noLocationsText}>
                  No locations assigned yet
                </p>
              </div>
            ) : (
              <div className={styles.locationsList}>
                {profileInfo.assigned_locations.map((location) => (
                  <div
                    key={location.location_id}
                    className={styles.locationItem}
                  >
                    <div className={styles.locationInfo}>
                      <MapPin className={styles.locationIcon} size={16} />
                      <div className={styles.locationTextContainer}>
                        <p className={styles.locationName}>
                          {location.location_name}
                        </p>
                        {location.schedule_notes && (
                          <p className={styles.locationNotes}>
                            {location.schedule_notes}
                          </p>
                        )}
                        <p className={styles.locationStatus}>
                          {location.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.locationActions}>
                      <button
                        className={styles.locationEditButton}
                        onClick={() => handleEditLocation(location)}
                        aria-label="Edit location"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className={styles.locationDeleteButton}
                        onClick={() =>
                          handleDeleteLocation(location.location_id)
                        }
                        aria-label="Delete location"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className={styles.addLocationButton}
              onClick={handleAddLocation}
              disabled={isSaving}
            >
              <Plus className={styles.addLocationIcon} size={16} />
              <span>Add Location</span>
            </button>
          </div>

          {/* Active Hours Section */}
          <div className={styles.activeHoursSection}>
            <div className={styles.sectionHeader}>
              <Clock className={styles.sectionIcon} size={16} />
              <h3 className={styles.sectionTitle}>Active Hours</h3>
            </div>
            <p className={styles.sectionDescription}>
              Restrict when this doctor can access the app. Set to{" "}
              <strong>Fixed window</strong> and enable to enforce login hours.
            </p>

            {/* Enable toggle */}
            <div className={styles.activeHoursToggleRow}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.toggleCheckbox}
                  checked={profileInfo.active_hours?.enabled ?? false}
                  onChange={(e) =>
                    handleActiveHoursChange({ enabled: e.target.checked })
                  }
                />
                <span className={styles.toggleSlider} />
                <span className={styles.toggleText}>
                  {profileInfo.active_hours?.enabled
                    ? "Restriction enabled"
                    : "No restriction (always allowed)"}
                </span>
              </label>
            </div>

            {/* Shift type */}
            <div className={styles.activeHoursTypeRow}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="activeHoursType"
                  value="24h"
                  checked={(profileInfo.active_hours?.type ?? "24h") === "24h"}
                  onChange={() => handleActiveHoursChange({ type: "24h" })}
                />
                <span>24-hour shift (full day)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="activeHoursType"
                  value="fixed"
                  checked={profileInfo.active_hours?.type === "fixed"}
                  onChange={() => handleActiveHoursChange({ type: "fixed" })}
                />
                <span>Fixed window</span>
              </label>
            </div>

            {/* Start / End time pickers — only shown for fixed */}
            {profileInfo.active_hours?.type === "fixed" && (
              <div className={styles.activeHoursTimeRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="activeStart">Start Time</label>
                  <input
                    id="activeStart"
                    type="time"
                    className={`${styles.input} ${
                      activeHoursError ? styles.error : styles.valid
                    }`}
                    value={profileInfo.active_hours?.start ?? "09:00"}
                    onChange={(e) =>
                      handleActiveHoursChange({ start: e.target.value })
                    }
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="activeEnd">End Time</label>
                  <input
                    id="activeEnd"
                    type="time"
                    className={`${styles.input} ${
                      activeHoursError ? styles.error : styles.valid
                    }`}
                    value={profileInfo.active_hours?.end ?? "18:00"}
                    onChange={(e) =>
                      handleActiveHoursChange({ end: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {activeHoursError && (
              <span className={styles.errorText}>{activeHoursError}</span>
            )}

            {/* Summary badge */}
            <div
              className={`${styles.activeHoursBadge} ${
                profileInfo.active_hours?.enabled
                  ? styles.activeHoursBadgeOn
                  : styles.activeHoursBadgeOff
              }`}
            >
              {profileInfo.active_hours?.enabled
                ? profileInfo.active_hours?.type === "24h"
                  ? "🕐 24-hour shift — doctor can log in at any time"
                  : `🕐 Allowed: ${profileInfo.active_hours?.start ?? "09:00"} – ${profileInfo.active_hours?.end ?? "18:00"} (IST)`
                : "🔓 No time restriction applied"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
          <button
            className={styles.cancelButton}
            onClick={() => navigate(`/doctor/${doctorId}`)}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className={`${styles.saveButton} ${
              isSaving ? styles.savingButton : ""
            }`}
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
            aria-label="Save Profile Changes"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Success!</h2>
            <p>Your profile has been updated successfully.</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalContinueButton}
                onClick={() => handleModalClose(false)}
              >
                Continue
              </button>
              <button
                className={styles.modalEditButton}
                onClick={() => handleModalClose(true)}
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationModal && (
        <EditLocationModal
          visible={showLocationModal}
          location={editingLocation}
          onClose={() => {
            setShowLocationModal(false);
            setEditingLocation(null);
            setIsEditingLocation(false);
          }}
          onSave={handleSaveLocation}
          isEdit={isEditingLocation}
          assignedLocations={profileInfo.assigned_locations || []}
          session={session}
        />
      )}
    </div>
  );
};

export default EditDoctor;