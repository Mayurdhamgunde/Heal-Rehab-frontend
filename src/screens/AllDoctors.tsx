import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUserMd,
  FaUserShield,
  FaUsers,
  FaLayerGroup,
  FaSearch,
  FaTimes,
  FaPlus,
  FaThLarge,
  FaList,
  FaPhoneAlt,
  FaEnvelope,
  FaBuilding,
} from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/AllDoctors.module.css";

interface Department {
  _id: string;
  department_name: string;
}

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_phone: string;
  doctor_email: string;
  is_admin: boolean;
  organization_name: string;
  department_id?: string;
  department?: any;
  department_name?: string;
  doctors_photo?: string;
}

interface CurrentUser {
  is_admin: boolean;
  [key: string]: any;
}

const handleError = (error: unknown) => {
  console.error("Error:", error);
};

const AllDoctors: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter((doctor) =>
      `${doctor.doctor_first_name} ${doctor.doctor_last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (phone.startsWith("+")) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    }
    return `+91 ${cleaned}`;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      try {
        const deptResponse = await api.get("/departments");
        setDepartments(deptResponse.data.departments || []);
      } catch (deptErr) {
        console.error("Failed to fetch departments", deptErr);
      }

      const response = await api.get("/getalldoctor");
      const sortedDoctors = response.data.doctors.sort(
        (a: Doctor, b: Doctor) => {
          if (a.is_admin === b.is_admin) {
            return (a.doctor_first_name || "").localeCompare(
              b.doctor_first_name || "",
            );
          }
          return a.is_admin ? -1 : 1;
        },
      );
      setDoctors(sortedDoctors);
      setFilteredDoctors(sortedDoctors);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDepartmentName = (doctor: any) => {
    if (doctor.department_name) {
      return doctor.department_name;
    }
    if (
      doctor.department &&
      typeof doctor.department === "object" &&
      doctor.department.department_name
    ) {
      return doctor.department.department_name;
    }
    const idToSearch =
      doctor.department_id ||
      (typeof doctor.department === "string" ? doctor.department : null);
    if (idToSearch) {
      const dept = departments.find((d) => d._id === idToSearch);
      return dept ? dept.department_name : "Not Specified";
    }
    return "Not Specified";
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const navigateToDoctor = (doctorId: string) => {
    if (doctorId) {
      navigate(`/Doctor/${doctorId}`);
    } else {
      handleError(new Error("Invalid doctor ID: " + doctorId));
    }
  };

  const navigateToRegister = () => {
    navigate("/doctorRegister");
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "card" ? "table" : "card");
  };

  const adminCount = doctors.filter((d) => d.is_admin).length;

  const colStyle = { gridColumn: "span 12" };
  const getDesktopColStyle = () =>
    window.innerWidth > 768 ? { gridColumn: "span 3" } : colStyle;

  return (
    <div className={styles.dashboardLayout}>
      <section className={styles.heroSection}>
        <svg
          className={styles.heroBackgroundSvg}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.7,-76.4C58.3,-69.2,70,-58.5,78.2,-45.5C86.4,-32.5,91.1,-17.2,89.3,-2.6C87.5,12,79.2,25.9,70.1,38.2C61.1,50.5,51.2,61.2,39.2,69.5C27.2,77.7,13.6,83.5,-0.6,84.5C-14.8,85.5,-29.6,81.8,-42.6,74.1C-55.6,66.4,-66.8,54.7,-74.6,41.2C-82.4,27.7,-86.8,12.4,-86.1,-2.7C-85.3,-17.8,-79.4,-32.7,-69.9,-44.9C-60.4,-57.1,-47.4,-66.6,-33.9,-73.9C-20.4,-81.2,-6.4,-86.3,8,-81.4C22.4,-76.5,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
        <div className={styles.heroContent}>
          <div className={styles.heroHeaderRow}>
            <div>
              <h2 className={`${styles.pageTitle} ${styles.fontHeadline}`}>
                <FaUserMd className={styles.titleIcon} /> Our Doctors
              </h2>
              <p className={`${styles.pageSubtitle} ${styles.fontBody}`}>
                Browse care providers, specialties, and contact details
                across your organization
              </p>
            </div>
            {user?.is_admin && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={styles.btnPrimary}
                onClick={navigateToRegister}
              >
                <FaPlus size={12} /> Register Doctor
              </motion.button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className={styles.bentoGrid}>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div className={styles.statIconWrapper}>
              <FaUserMd />
            </div>
            <div>
              <p className={styles.statLabel}>Total Doctors</p>
              <p className={styles.statValue}>{doctors.length}</p>
            </div>
          </div>
        </div>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#9333ea", background: "rgba(147, 51, 234, 0.1)" }}
            >
              <FaUserShield />
            </div>
            <div>
              <p className={styles.statLabel}>Admin</p>
              <p className={styles.statValue}>{adminCount}</p>
            </div>
          </div>
        </div>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#16a34a", background: "rgba(22, 163, 74, 0.1)" }}
            >
              <FaUsers />
            </div>
            <div>
              <p className={styles.statLabel}>Clinical Staff</p>
              <p className={styles.statValue}>{doctors.length - adminCount}</p>
            </div>
          </div>
        </div>
        <div style={getDesktopColStyle()}>
          <div className={`${styles.bentoCard} ${styles.statCard}`}>
            <div
              className={styles.statIconWrapper}
              style={{ color: "#eab308", background: "rgba(234, 179, 8, 0.1)" }}
            >
              <FaLayerGroup />
            </div>
            <div>
              <p className={styles.statLabel}>Departments</p>
              <p className={styles.statValue}>{departments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className={`${styles.bentoCard} ${styles.mainListCard}`}>
        <div className={styles.filtersHeader}>
          <div className={styles.searchForm}>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={`${styles.searchInput} ${styles.fontBody}`}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          <div className={styles.filterControls}>
            <button
              className={`${styles.btnSecondaryIcon} ${
                viewMode === "table" ? styles.activeViewButton : ""
              }`}
              onClick={toggleViewMode}
              title={viewMode === "card" ? "Table View" : "Card View"}
            >
              {viewMode === "card" ? <FaList size={14} /> : <FaThLarge size={14} />}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.centeredState}>
            <div className={styles.spinner} />
            <p className={styles.fontBody}>Loading doctors...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className={styles.emptyState}>
            <FaSearch
              size={24}
              style={{ marginBottom: "0.5rem", color: "var(--on-surface-variant)" }}
            />
            <p>No doctors found matching your search.</p>
          </div>
        ) : viewMode === "table" ? (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Organization</th>
                  <th>Department</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doctor, index) => (
                  <tr
                    key={doctor._id}
                    className={styles.tableRow}
                    style={{ animationDelay: `${index * 0.03}s` }}
                    onClick={() => navigateToDoctor(doctor._id)}
                  >
                    <td>
                      <div className={styles.providerCell}>
                        {doctor.doctors_photo ? (
                          <img
                            src={doctor.doctors_photo}
                            alt={`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
                            className={styles.avatarImgSmall}
                          />
                        ) : (
                          <div className={styles.stripIcon}>
                            <FaUserMd size={14} />
                          </div>
                        )}
                        <span className={styles.providerName}>
                          {doctor.doctor_first_name} {doctor.doctor_last_name}
                        </span>
                      </div>
                    </td>
                    <td>{formatPhoneNumber(doctor.doctor_phone)}</td>
                    <td>{doctor.doctor_email}</td>
                    <td>{doctor.organization_name}</td>
                    <td>{getDepartmentName(doctor)}</td>
                    <td>
                      {doctor.is_admin ? (
                        <span className={`${styles.statusBadge} ${styles.statusAdmin}`}>
                          Admin
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.statusDoctor}`}>
                          Doctor
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.doctorsGrid}>
            {filteredDoctors.map((doctor, index) => (
              <div
                key={doctor._id}
                className={styles.doctorCard}
                style={{ animationDelay: `${index * 0.03}s` }}
                onClick={() => navigateToDoctor(doctor._id)}
              >
                {doctor.is_admin && (
                  <div className={styles.doctorCardAdminBadge}>
                    <FaUserShield size={15} />
                  </div>
                )}
                <div className={styles.doctorCardTop}>
                  {doctor.doctors_photo ? (
                    <img
                      src={doctor.doctors_photo}
                      alt={`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
                      className={styles.doctorAvatar}
                    />
                  ) : (
                    <div className={styles.doctorAvatarFallback}>
                      <FaUserMd size={15} />
                    </div>
                  )}
                  <div>
                    <h4 className={styles.doctorCardName} title={`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}>
                      {doctor.doctor_first_name} {doctor.doctor_last_name}
                    </h4>
                    <span className={styles.doctorCardDept}>
                      {getDepartmentName(doctor)}
                    </span>
                  </div>
                </div>
                <div className={styles.doctorCardMeta}>
                  <div className={styles.metaRow}>
                    <FaPhoneAlt />
                    <span>{formatPhoneNumber(doctor.doctor_phone)}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <FaEnvelope />
                    <span>{doctor.doctor_email}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <FaBuilding />
                    <span>{doctor.organization_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDoctors;