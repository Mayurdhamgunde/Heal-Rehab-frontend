import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/DepartmentDetailsScreen.module.css";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Users,
  Edit,
  Trash2,
  AlignLeft,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Member {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctors_photo?: string;
  specialization?: string;
  roles: string[];
}

interface AssignedLocation {
  location_id: string;
  location_name: string;
  is_active: boolean;
}

interface Privileges {
  can_register_patients?: boolean;
  can_update_patients?: boolean;
  can_create_treatment_plans?: boolean;
  can_access_all_assessments?: boolean;
  can_give_prescription?: boolean;
  can_create_sessions?: boolean;
  can_delete_patients?: boolean;
}

interface Department {
  _id: string;
  department_name: string;
  department_code: string;
  description: string;
  status: string;
  assigned_locations: AssignedLocation[];
  members: Member[];
  memberCount: number;
  createdAt: string;
  is_admin_department?: boolean;
  privileges?: Privileges;
}

const privilegeConfig = [
  { key: "can_register_patients", label: "Register Patients" },
  { key: "can_update_patients", label: "Update Patients" },
  { key: "can_create_treatment_plans", label: "Create Treatment Plans" },
  { key: "can_access_all_assessments", label: "Access All Assessments" },
  { key: "can_give_prescription", label: "Give Prescription" },
  { key: "can_create_sessions", label: "Create Sessions" },
  { key: "can_delete_patients", label: "Delete Patients" },
];

const DepartmentDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchDepartmentDetails();
  }, [id]);

  const fetchDepartmentDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Assuming your route is setup as /department/:id in the backend
      const response = await api.get(`/department/${id}`);
      setDepartment(response.data);
    } catch (err: any) {
      console.error("Error fetching department details:", err);
      setError(
        err.response?.data?.error || "Failed to load department details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!department) return;

    // Safety check matching your backend logic
    if (department.memberCount > 0) {
      showToast(
        "Cannot delete a department that has assigned doctors.",
        "error",
      );
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete ${department.department_name}? This action cannot be undone.`,
      )
    ) {
      setIsDeleting(true);
      try {
        await api.delete(`/department/delete/${id}`);
        showToast("Department deleted successfully");
        setTimeout(() => {
          navigate("/departments");
        }, 1500);
      } catch (err: any) {
        console.error("Error deleting department:", err);
        showToast(
          err.response?.data?.error || "Failed to delete department",
          "error",
        );
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    // Navigate to edit screen (You will need to create this route/screen later)
    navigate(`/edit/department/${id}`);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>
          <Briefcase className={styles.spinner} size={24} />
          <p>Loading Department Details...</p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className={styles.pageBackground}>
        <div className={styles.container}>
          <div className={styles.errorMessage}>
            <h3>Error</h3>
            <p>{error || "Department not found."}</p>
            <button
              className={styles.backButton}
              onClick={() => navigate("/departments")}
            >
              <ArrowLeft size={16} /> Back to Departments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBackground}>
      {toast && (
        <div className={styles.toastContainer}>
          <div
            className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className={styles.container}>
        {/* Top Navigation & Actions */}
        <div className={styles.topNavigation}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className={styles.actionButtons}>
            <button className={styles.editButton} onClick={handleEdit}>
              <Edit size={16} /> Edit
            </button>
            <button
              className={`${styles.deleteButton} ${department.memberCount > 0 ? styles.disabledDelete : ""}`}
              onClick={handleDelete}
              disabled={isDeleting || department.memberCount > 0}
              title={
                department.memberCount > 0
                  ? "Cannot delete department with active members"
                  : "Delete Department"
              }
            >
              <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* Main Info Column */}
          <div className={styles.mainColumn}>
            {/* Header Card */}
            <div className={styles.card}>
              <div className={styles.departmentHeader}>
                <div className={styles.iconContainerBig}>
                  <Briefcase size={32} className={styles.headerIcon} />
                </div>
                <div className={styles.headerText}>
                  <h1 className={styles.departmentName}>
                    {department.department_name}
                  </h1>
                  <div className={styles.headerBadges}>
                    {department.department_code && (
                      <span className={styles.codeBadge}>
                        {department.department_code}
                      </span>
                    )}
                    <span
                      className={`${styles.statusBadge} ${department.status.toLowerCase() === "active" ? styles.statusActive : styles.statusInactive}`}
                    >
                      {department.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <AlignLeft size={20} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Description</h2>
              </div>
              <p className={styles.descriptionText}>
                {department.description ||
                  "No description provided for this department."}
              </p>
            </div>

            {/* Members List Card */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div className={styles.headerWithCount}>
                  <Users size={20} className={styles.sectionIcon} />
                  <h2 className={styles.sectionTitle}>Department Members</h2>
                  <span className={styles.countBadge}>
                    {department.memberCount}
                  </span>
                </div>
              </div>

              {department.members && department.members.length > 0 ? (
                <div className={styles.membersList}>
                  {department.members.map((member) => (
                    <div key={member._id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>
                        {member.doctors_photo ? (
                          <img
                            src={member.doctors_photo}
                            alt={member.doctor_first_name}
                          />
                        ) : (
                          <span>
                            {member.doctor_first_name.charAt(0)}
                            {member.doctor_last_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={styles.memberInfo}>
                        <h4 className={styles.memberName}>
                          {member.doctor_first_name} {member.doctor_last_name}
                        </h4>
                        <div className={styles.memberRoles}>
                          {member.roles?.map((role) => (
                            <span key={role} className={styles.roleTag}>
                              {role}
                            </span>
                          ))}
                          {member.specialization && (
                            <span className={styles.specializationText}>
                              {member.specialization}
                            </span>
                          )}
                        </div>
                        <div className={styles.memberContact}>
                          <span className={styles.contactItem}>
                            <Mail size={12} /> {member.doctor_email}
                          </span>
                          {member.doctor_phone && (
                            <span className={styles.contactItem}>
                              <Phone size={12} /> {member.doctor_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Users size={32} className={styles.emptyIcon} />
                  <p>No doctors assigned to this department yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className={styles.sidebarColumn}>
            {/* Privileges Card */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <ShieldCheck size={20} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Department Privileges</h2>
              </div>

              {department.is_admin_department ? (
                <div className={styles.adminPrivilegeAlert}>
                  <ShieldCheck size={18} />
                  <span>Admin Department - Full Access Enabled</span>
                </div>
              ) : (
                <div className={styles.privilegesList}>
                  {privilegeConfig.map(({ key, label }) => {
                    const hasPrivilege =
                      department.privileges?.[key as keyof Privileges];
                    return (
                      <div key={key} className={styles.privilegeItem}>
                        {hasPrivilege ? (
                          <CheckCircle2
                            size={16}
                            className={styles.privilegeGranted}
                          />
                        ) : (
                          <XCircle
                            size={16}
                            className={styles.privilegeDenied}
                          />
                        )}
                        <span
                          className={
                            hasPrivilege
                              ? styles.privilegeTextGranted
                              : styles.privilegeTextDenied
                          }
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Locations Card */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <MapPin size={20} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Assigned Locations</h2>
              </div>

              {department.assigned_locations &&
              department.assigned_locations.length > 0 ? (
                <div className={styles.locationsList}>
                  {department.assigned_locations.map((loc) => (
                    <div key={loc.location_id} className={styles.locationItem}>
                      <div className={styles.locationIconWrapper}>
                        <MapPin size={16} className={styles.locationIcon} />
                      </div>
                      <div className={styles.locationDetails}>
                        <span className={styles.locationName}>
                          {loc.location_name}
                        </span>
                        {!loc.is_active && (
                          <span className={styles.inactiveLabel}>
                            (Inactive)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateSmall}>
                  <p>No locations assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsScreen;
