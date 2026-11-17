import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiLogOut,
  FiLogIn,
  FiMenu,
  FiSettings,
  FiCalendar,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiFile,
  FiSliders,
  FiShield,
  FiFileText,
  FiUserPlus,
  FiLayout,
  FiActivity,
  FiLayers,
  FiArchive,
} from "react-icons/fi";
import { FaUserMd, FaChartLine } from "react-icons/fa";
import { Pill } from "lucide-react";
import DefaultProfileImage from "../assets/profileimg.png";
import Logo from "../assets/HTic.png";
import LogoClosed from "../assets/Healtrack-05.jpg";
import api from "../utils/central";
import styles from "../css/sidebar.module.css";

const DEFAULT_PROFILE_IMAGE = DefaultProfileImage;

interface User {
  doctor_photo?: string;
  doctor_first_name: string;
  doctor_last_name: string;
  email: string;
  token: string;
  is_admin: boolean;
}

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTemporaryOpen, setIsTemporaryOpen] = useState(false);
  const [isPermanentlyOpen, setIsPermanentlyOpen] = useState(true);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [, setAnalyticsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [patientsExpanded, setPatientsExpanded] = useState(false);
  const [appointmentsExpanded, setAppointmentsExpanded] = useState(false);
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  const [medicinesExpanded, setMedicinesExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Initialize user and orgLogo synchronously from localStorage
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [orgLogo, setOrgLogo] = useState<string | null>(() => {
    return localStorage.getItem("orgLogo") || null;
  });

  // Refs to track manual collapse so route changes don't re-open submenus
  const manuallyCollapsedPatients = useRef(false);
  const manuallyCollapsedAppointments = useRef(false);
  const manuallyCollapsedSettings = useRef(false);
  const manuallyCollapsedGroups = useRef(false);
  const manuallyCollapsedMedicines = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();

  const routeGroups = {
    analytics: {
      routes: [
        "/dashboard",
        "/doctorperformance",
        "/paymentDashboard",
        "/collection",
      ],
      priority: 10,
    },
    settings: {
      routes: [
        "/notifications",
        "/SettingsScreen",
        "/organizationSettings",
        "/AssessmentsList",
      ],
      priority: 9,
    },
    patients: {
      routes: [
        "/PatientsList",
        "/registerPatient",
        "/updatePatient",
        "/MyPatients",
        "/Patient",
        "/createTherapy",
        "/planDetails",
        "/editTherapyPlan",
        "/therapySessions",
        "/bookAppoinment",
        "/ArchivedPatientsList",
      ],
      priority: 8,
    },
    groups: {
      routes: ["/create-group-session", "/lectureSessionList"],
      priority: 5.5,
    },
    appointments: {
      routes: ["/get/appointments", "/appointment-details", "/myAppointments"],
      priority: 5,
    },
    doctors: {
      routes: ["/AllDoctors", "/Doctor", "/DoctorRegister"],
      priority: 6,
    },
    reports: {
      routes: [
        "/Reports",
        "/leaderReport",
        "/DailyReport",
        "/AppointmentsTimeline",
        "/TherapyTypeByDoctor",
        "/AdminReport",
        "/aftercarereport",
      ],
      priority: 4,
    },
    profile: {
      routes: ["/profile", "/OrganizationSettings"],
      priority: 3,
    },
    logs: {
      routes: ["/UserLogs"],
      priority: 7,
    },
    medicines: {
      routes: ["/medicines", "/prescriptiontemplates"],
      priority: 7,
    },
    blog: {
      routes: ["/blog", "/Updateblog", "/createBlogDetailsScreen"],
      priority: 2,
    },
    video: {
      routes: ["/videoCall"],
      priority: 1,
    },
  };

  const isRouteInGroup = (groupRoutes: string[]) => {
    return groupRoutes.some(
      (route) =>
        location.pathname === route ||
        location.pathname.startsWith(route + "/"),
    );
  };

  const getHighestPriorityMatchingGroup = () => {
    const matchingGroups: { name: string; priority: number }[] = [];

    for (const [groupName, groupData] of Object.entries(routeGroups)) {
      if (isRouteInGroup(groupData.routes)) {
        matchingGroups.push({ name: groupName, priority: groupData.priority });
      }
    }

    if (matchingGroups.length === 0) return null;

    matchingGroups.sort((a, b) => b.priority - a.priority);
    return matchingGroups[0].name;
  };

  const shouldHighlightNavItem = (groupName: string) => {
    const highestPriorityGroup = getHighestPriorityMatchingGroup();
    return highestPriorityGroup === groupName;
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      const tablet = width > 768 && width <= 1024;

      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setIsOpen(false);
        setIsPermanentlyOpen(false);
        setIsTemporaryOpen(false);
      } else if (tablet) {
        setIsOpen(false);
        setIsPermanentlyOpen(false);
        setIsTemporaryOpen(false);
        setShowMobileMenu(false);
      } else {
        setIsOpen(isPermanentlyOpen);
        setShowMobileMenu(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleLogin = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      }
    };

    window.addEventListener("userLogin", handleLogin);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("userLogin", handleLogin);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [isPermanentlyOpen, hoverTimeout]);

  // Fetch the organization logo
  useEffect(() => {
    const fetchOrgLogo = async () => {
      if (user) {
        try {
          const response = await api.get("/getOrg");
          const fetchedLogo = response.data?.organization?.organization_logo;
          if (fetchedLogo) {
            setOrgLogo(fetchedLogo);
            localStorage.setItem("orgLogo", fetchedLogo);
          }
        } catch (error) {
          console.error("Error fetching organization logo:", error);
        }
      } else {
        setOrgLogo(null);
        localStorage.removeItem("orgLogo");
      }
    };

    fetchOrgLogo();
  }, [user]);

  // Handle active states on route change
  useEffect(() => {
    if (isTablet || isMobile) {
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
      return;
    }

    const currentHighestPriorityGroup = getHighestPriorityMatchingGroup();

    if (currentHighestPriorityGroup === "analytics") {
      setAnalyticsExpanded(true);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
      manuallyCollapsedPatients.current = false;
      manuallyCollapsedAppointments.current = false;
      manuallyCollapsedSettings.current = false;
      manuallyCollapsedGroups.current = false;
      manuallyCollapsedMedicines.current = false;
    } else if (currentHighestPriorityGroup === "settings") {
      if (!manuallyCollapsedSettings.current) setSettingsExpanded(true);
      setAnalyticsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
    } else if (currentHighestPriorityGroup === "patients") {
      if (!manuallyCollapsedPatients.current) setPatientsExpanded(true);
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
    } else if (currentHighestPriorityGroup === "appointments") {
      if (!manuallyCollapsedAppointments.current) setAppointmentsExpanded(true);
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
    } else if (currentHighestPriorityGroup === "groups") {
      if (!manuallyCollapsedGroups.current) setGroupsExpanded(true);
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setMedicinesExpanded(false);
    } else if (currentHighestPriorityGroup === "medicines") {
      if (!manuallyCollapsedMedicines.current) setMedicinesExpanded(true);
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
    } else {
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
      manuallyCollapsedPatients.current = false;
      manuallyCollapsedAppointments.current = false;
      manuallyCollapsedSettings.current = false;
      manuallyCollapsedGroups.current = false;
      manuallyCollapsedMedicines.current = false;
    }
  }, [location.pathname, isTablet, isMobile]);

  useEffect(() => {
    const actuallyOpen = isOpen || isTemporaryOpen;
    if (actuallyOpen) {
      document.body.classList.add("sidebar-open");
      document.body.classList.remove("sidebar-closed");
    } else {
      document.body.classList.add("sidebar-closed");
      document.body.classList.remove("sidebar-open");
    }

    return () => {
      document.body.classList.remove("sidebar-open", "sidebar-closed");
    };
  }, [isOpen, isTemporaryOpen]);

  // Clear the cached logo from local storage on logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("orgLogo");
    setUser(null);
    setOrgLogo(null);
    navigate("/");
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleSettings = () => {
    const next = !settingsExpanded;
    manuallyCollapsedSettings.current = !next;
    setSettingsExpanded(next);
    if (next) {
      setAnalyticsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
  };

  const toggleSidebar = () => {
    const newState = !isPermanentlyOpen;
    setIsPermanentlyOpen(newState);
    setIsOpen(newState);
    setIsTemporaryOpen(false);

    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleSidebarMouseEnter = () => {
    if (!isPermanentlyOpen && !isMobile && !isTablet) {
      if (hoverTimeout) {
        window.clearTimeout(hoverTimeout);
      }

      const timeout = window.setTimeout(() => {
        setIsTemporaryOpen(true);
      }, 150);

      setHoverTimeout(timeout);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    if (!isPermanentlyOpen && isTemporaryOpen) {
      setIsTemporaryOpen(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();

    if (isTablet || isMobile) return;

    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    if (isTemporaryOpen && !isPermanentlyOpen) {
      setIsPermanentlyOpen(true);
      setIsOpen(true);
      setIsTemporaryOpen(false);
    } else {
      toggleSidebar();
    }
  };

  const togglePatients = () => {
    const next = !patientsExpanded;
    manuallyCollapsedPatients.current = !next;
    setPatientsExpanded(next);
    if (next) {
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
    }
  };

  const toggleAppointments = () => {
    const next = !appointmentsExpanded;
    manuallyCollapsedAppointments.current = !next;
    setAppointmentsExpanded(next);
    if (next) {
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setGroupsExpanded(false);
      setMedicinesExpanded(false);
    }
  };

  const toggleGroups = () => {
    const next = !groupsExpanded;
    manuallyCollapsedGroups.current = !next;
    setGroupsExpanded(next);
    if (next) {
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setMedicinesExpanded(false);
    }
  };

  const toggleMedicines = () => {
    const next = !medicinesExpanded;
    manuallyCollapsedMedicines.current = !next;
    setMedicinesExpanded(next);
    if (next) {
      setAnalyticsExpanded(false);
      setSettingsExpanded(false);
      setPatientsExpanded(false);
      setAppointmentsExpanded(false);
      setGroupsExpanded(false);
    }
  };

  const handleNavClick = () => {
    setAnalyticsExpanded(false);
    setSettingsExpanded(false);
    setPatientsExpanded(false);
    setAppointmentsExpanded(false);
    setGroupsExpanded(false);
    setMedicinesExpanded(false);
    if (isMobile) setShowMobileMenu(false);
  };

  const handleSubMenuClick = () => {
    manuallyCollapsedPatients.current = false;
    manuallyCollapsedAppointments.current = false;
    manuallyCollapsedSettings.current = false;
    manuallyCollapsedGroups.current = false;
    manuallyCollapsedMedicines.current = false;

    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  const getNavLinkClass = (path: string, groupName?: string) => {
    const isExactMatch = location.pathname === path;

    if (isExactMatch) {
      return `${styles.navItem} ${styles.active}`;
    }

    if (groupName) {
      const isGroupActive = shouldHighlightNavItem(groupName);
      return isGroupActive
        ? `${styles.navItem} ${styles.active}`
        : styles.navItem;
    }

    return styles.navItem;
  };

  const getSubNavLinkClass = (path: string) => {
    return location.pathname === path ||
      location.pathname.startsWith(path + "/")
      ? `${styles.subNavItem} ${styles.active}`
      : styles.subNavItem;
  };

  const getSettingsParentClass = () => {
    const baseClass = styles.navItem;
    const highestPriorityGroup = getHighestPriorityMatchingGroup();
    return highestPriorityGroup === "settings"
      ? `${baseClass} ${styles.active}`
      : baseClass;
  };

  const getPatientsParentClass = () => {
    const baseClass = styles.navItem;
    const highestPriorityGroup = getHighestPriorityMatchingGroup();
    return highestPriorityGroup === "patients"
      ? `${baseClass} ${styles.active}`
      : baseClass;
  };

  const getAppointmentsParentClass = () => {
    const baseClass = styles.navItem;
    const highestPriorityGroup = getHighestPriorityMatchingGroup();
    return highestPriorityGroup === "appointments"
      ? `${baseClass} ${styles.active}`
      : baseClass;
  };

  const getGroupsParentClass = () => {
    const baseClass = styles.navItem;
    const highestPriorityGroup = getHighestPriorityMatchingGroup();
    return highestPriorityGroup === "groups"
      ? `${baseClass} ${styles.active}`
      : baseClass;
  };

  const getMedicinesParentClass = () => {
    const baseClass = styles.navItem;
    const highestPriorityGroup = getHighestPriorityMatchingGroup();
    return highestPriorityGroup === "medicines"
      ? `${baseClass} ${styles.active}`
      : baseClass;
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const actuallyOpen =
    isOpen || isTemporaryOpen || (isMobile && showMobileMenu);

  const floatingSubmenuStyle: React.CSSProperties = {
    display: "block",
    position: "absolute",
    left: "80px",
    top: "0",
    width: "220px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
    border: "1px solid #f0f0f0",
    borderRadius: "8px",
    zIndex: 2000,
    margin: "0",
    padding: "8px 0",
  };

  return (
    <>
      {isMobile && (
        <button
          className={styles.mobileMenuToggle}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <FiMenu size={24} />
        </button>
      )}

      {isMobile && showMobileMenu && (
        <div className={styles.mobileOverlay} onClick={toggleMobileMenu} />
      )}

      <aside
        className={`${styles.sidebar} ${actuallyOpen ? styles.open : ""} ${
          isMobile ? styles.mobile : ""
        }`}
        data-open={actuallyOpen}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        style={!actuallyOpen && isTablet ? { overflow: "visible" } : undefined}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.headerContainer}>
            <div className={styles.logoWrapper}>
              <img
                src={orgLogo ? orgLogo : actuallyOpen ? Logo : LogoClosed}
                alt="HealTrack Logo"
                className={`${styles.logoImage} ${
                  actuallyOpen ? styles.logoOpen : styles.logoClosed
                }`}
                onClick={handleLogoClick}
                style={{
                  cursor: isTablet || isMobile ? "default" : "pointer",
                  userSelect: "none",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <ul>
            {!user && (
              <li>
                <Link
                  to="/"
                  className={getNavLinkClass("/")}
                  onClick={handleNavClick}
                >
                  <FiHome className={styles.navIcon} />
                  {actuallyOpen && <span>Home</span>}
                </Link>
                <Link
                  to="/privacypolicy"
                  className={getNavLinkClass("/privacypolicy")}
                  onClick={handleNavClick}
                >
                  <FiShield className={styles.navIcon} />
                  {actuallyOpen && <span>Privacy Policy</span>}
                </Link>
                <Link
                  to="/termsofservice"
                  className={getNavLinkClass("/termsofservice")}
                  onClick={handleNavClick}
                >
                  <FiFileText className={styles.navIcon} />
                  {actuallyOpen && <span>Terms of Service</span>}
                </Link>
              </li>
            )}
            {user ? (
              <>
                {user.is_admin && (
                  <li>
                    <Link
                      to="/dashboard"
                      className={getNavLinkClass("/dashboard", "analytics")}
                      onClick={handleNavClick}
                    >
                      <FiHome className={styles.navIcon} />
                      {actuallyOpen && <span>Dashboard</span>}
                    </Link>
                  </li>
                )}

                {/* --- PATIENTS --- */}
                <li style={{ position: "relative" }}>
                  <button
                    className={getPatientsParentClass()}
                    onClick={togglePatients}
                    title={!actuallyOpen ? "Patients" : undefined}
                    style={{
                      justifyContent: actuallyOpen ? "space-between" : "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <FiUsers className={styles.navIcon} />
                      {actuallyOpen && <span>Patients</span>}
                    </div>
                    {actuallyOpen &&
                      (patientsExpanded ? (
                        <FiChevronUp className={styles.chevronIcon} />
                      ) : (
                        <FiChevronDown className={styles.chevronIcon} />
                      ))}
                  </button>
                  {patientsExpanded && (actuallyOpen || isTablet) && (
                    <ul
                      className={styles.subMenu}
                      style={!actuallyOpen ? floatingSubmenuStyle : undefined}
                    >
                      <li>
                        <Link
                          to="/registerPatient"
                          className={getSubNavLinkClass("/registerPatient")}
                          onClick={handleSubMenuClick}
                        >
                          <FiUserPlus className={styles.navIcon} />
                          <span>Register Patient</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/MyPatients"
                          className={getSubNavLinkClass("/MyPatients")}
                          onClick={handleSubMenuClick}
                        >
                          <FiUsers className={styles.navIcon} />
                          <span>My Patients</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/PatientsList"
                          className={getSubNavLinkClass("/PatientsList")}
                          onClick={handleSubMenuClick}
                        >
                          <FiUsers className={styles.navIcon} />
                          <span>Active Patients</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/ArchivedPatientsList"
                          className={getSubNavLinkClass(
                            "/ArchivedPatientsList",
                          )}
                          onClick={handleSubMenuClick}
                        >
                          <FiArchive className={styles.navIcon} />
                          <span>Discharged Patients</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                <li>
                  <Link
                    to="/ActivePlans"
                    className={getNavLinkClass("/ActivePlans")}
                    onClick={handleNavClick}
                  >
                    <FiActivity className={styles.navIcon} />
                    {actuallyOpen && <span>Active Plans</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/get/aftercare"
                    className={getNavLinkClass("/get/aftercare")}
                    onClick={handleNavClick}
                  >
                    <FiCalendar className={styles.navIcon} />
                    {actuallyOpen && <span>Follow-ups</span>}
                  </Link>
                </li>

                {/* --- MEDICINES (UPDATED AS TAB GROUP) --- */}
                <li style={{ position: "relative" }}>
                  <button
                    className={getMedicinesParentClass()}
                    onClick={toggleMedicines}
                    title={!actuallyOpen ? "Medicines" : undefined}
                    style={{
                      justifyContent: actuallyOpen ? "space-between" : "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Pill className={styles.navIcon} size="1em" />
                      {actuallyOpen && <span>Medicines</span>}
                    </div>
                    {actuallyOpen &&
                      (medicinesExpanded ? (
                        <FiChevronUp className={styles.chevronIcon} />
                      ) : (
                        <FiChevronDown className={styles.chevronIcon} />
                      ))}
                  </button>
                  {medicinesExpanded && (actuallyOpen || isTablet) && (
                    <ul
                      className={styles.subMenu}
                      style={!actuallyOpen ? floatingSubmenuStyle : undefined}
                    >
                      <li>
                        <Link
                          to="/medicines"
                          className={getSubNavLinkClass("/medicines")}
                          onClick={handleSubMenuClick}
                        >
                          <Pill className={styles.navIcon} size="1em" />
                          <span>List</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/prescriptiontemplates"
                          className={getSubNavLinkClass(
                            "/prescriptiontemplates",
                          )}
                          onClick={handleSubMenuClick}
                        >
                          <FiFileText className={styles.navIcon} />
                          <span>Templates</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* --- SESSIONS --- */}
                <li style={{ position: "relative" }}>
                  <button
                    className={getAppointmentsParentClass()}
                    onClick={toggleAppointments}
                    title={!actuallyOpen ? "Sessions" : undefined}
                    style={{
                      justifyContent: actuallyOpen ? "space-between" : "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <FiCalendar className={styles.navIcon} />
                      {actuallyOpen && <span>Sessions</span>}
                    </div>
                    {actuallyOpen &&
                      (appointmentsExpanded ? (
                        <FiChevronUp className={styles.chevronIcon} />
                      ) : (
                        <FiChevronDown className={styles.chevronIcon} />
                      ))}
                  </button>
                  {appointmentsExpanded && (actuallyOpen || isTablet) && (
                    <ul
                      className={styles.subMenu}
                      style={!actuallyOpen ? floatingSubmenuStyle : undefined}
                    >
                      <li>
                        <Link
                          to="/get/appointments"
                          className={getSubNavLinkClass("/get/appointments")}
                          onClick={handleSubMenuClick}
                        >
                          <FiCalendar className={styles.navIcon} />
                          <span>All Sessions</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/myAppointments"
                          className={getSubNavLinkClass("/myAppointments")}
                          onClick={handleSubMenuClick}
                        >
                          <FiCalendar className={styles.navIcon} />
                          <span>My Sessions</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* --- GROUPS --- */}
                <li style={{ position: "relative" }}>
                  <button
                    className={getGroupsParentClass()}
                    onClick={toggleGroups}
                    title={!actuallyOpen ? "Groups" : undefined}
                    style={{
                      justifyContent: actuallyOpen ? "space-between" : "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <FiLayers className={styles.navIcon} />
                      {actuallyOpen && <span>Groups</span>}
                    </div>
                    {actuallyOpen &&
                      (groupsExpanded ? (
                        <FiChevronUp className={styles.chevronIcon} />
                      ) : (
                        <FiChevronDown className={styles.chevronIcon} />
                      ))}
                  </button>
                  {groupsExpanded && (actuallyOpen || isTablet) && (
                    <ul
                      className={styles.subMenu}
                      style={!actuallyOpen ? floatingSubmenuStyle : undefined}
                    >
                      <li>
                        <Link
                          to="/create-group-session"
                          className={getSubNavLinkClass(
                            "/create-group-session",
                          )}
                          onClick={handleSubMenuClick}
                        >
                          <FiUsers className={styles.navIcon} />
                          <span>Group Session</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/lectureSessionList"
                          className={getSubNavLinkClass("/lectureSessionList")}
                          onClick={handleSubMenuClick}
                        >
                          <FiUsers className={styles.navIcon} />
                          <span>Lecture Session</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                <li>
                  <Link
                    to="/AllDoctors"
                    className={getNavLinkClass("/AllDoctors")}
                    onClick={handleNavClick}
                  >
                    <FaUserMd className={styles.navIcon} />
                    {actuallyOpen && <span>All Doctors</span>}
                  </Link>
                </li>

                {/* --- PERFORMANCE REPORT --- */}
                <li>
                  <Link
                    to="/performanceReport"
                    className={getNavLinkClass("/performanceReport")}
                    onClick={handleNavClick}
                  >
                    <FaChartLine className={styles.navIcon} />
                    {actuallyOpen && <span>Performance Report</span>}
                  </Link>
                </li>

                {/* --- AFTERCARE REPORT: ADMIN ONLY --- */}
                {user.is_admin && (
                  <li>
                    <Link
                      to="/aftercarereport"
                      className={getNavLinkClass("/aftercarereport", "reports")}
                      onClick={handleNavClick}
                    >
                      <FiFileText className={styles.navIcon} />
                      {actuallyOpen && <span>Aftercare Report</span>}
                    </Link>
                  </li>
                )}

                {/* --- SETTINGS: ADMIN ONLY --- */}
                {user.is_admin && (
                  <li style={{ position: "relative" }}>
                    <button
                      className={getSettingsParentClass()}
                      onClick={handleSettings}
                      title={!actuallyOpen ? "Settings" : undefined}
                      style={{
                        justifyContent: actuallyOpen
                          ? "space-between"
                          : "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <FiSettings className={styles.navIcon} />
                        {actuallyOpen && <span>Settings</span>}
                      </div>
                      {actuallyOpen &&
                        (settingsExpanded ? (
                          <FiChevronUp className={styles.chevronIcon} />
                        ) : (
                          <FiChevronDown className={styles.chevronIcon} />
                        ))}
                    </button>
                    {settingsExpanded && (actuallyOpen || isTablet) && (
                      <ul
                        className={styles.subMenu}
                        style={!actuallyOpen ? floatingSubmenuStyle : undefined}
                      >
                        <li>
                          <Link
                            to="/SettingsScreen"
                            className={getSubNavLinkClass("/SettingsScreen")}
                            onClick={handleSubMenuClick}
                          >
                            <FiSliders className={styles.navIcon} />
                            <span>Organization</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/notifications"
                            className={getSubNavLinkClass("/notifications")}
                            onClick={handleSubMenuClick}
                          >
                            <FiBell className={styles.navIcon} />
                            <span>Notifications</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/AssessmentsList"
                            className={getSubNavLinkClass("/AssessmentsList")}
                            onClick={handleSubMenuClick}
                          >
                            <FiLayout className={styles.navIcon} />
                            <span>Assessment List</span>
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {/* --- USER LOGS: ADMIN ONLY --- */}
                {user.is_admin && (
                  <li>
                    <Link
                      to="/UserLogs"
                      className={getNavLinkClass("/UserLogs", "logs")}
                      onClick={handleNavClick}
                    >
                      <FiFile className={styles.navIcon} />
                      {actuallyOpen && <span>User Logs</span>}
                    </Link>
                  </li>
                )}
              </>
            ) : (
              <li>
                <button onClick={handleLogin} className={styles.loginButton}>
                  <FiLogIn className={styles.navIcon} />
                  {actuallyOpen && <span>Login</span>}
                </button>
              </li>
            )}
          </ul>
        </nav>

        {user && (
          <div className={styles.userProfile}>
            <Link
              to="/profile"
              className={styles.profileLink}
              onClick={handleNavClick}
            >
              <div className={styles.profileImageWrapper}>
                <img
                  src={user.doctor_photo || DEFAULT_PROFILE_IMAGE}
                  alt="Profile"
                  className={styles.profileImage}
                  onError={handleImageError}
                />
              </div>
              {actuallyOpen && (
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>
                    {user.doctor_first_name} {user.doctor_last_name}
                  </span>
                  <span className={styles.profileEmail}>{user.email}</span>
                </div>
              )}
            </Link>
            <div className={styles.userActions}>
              <button
                onClick={handleLogoutClick}
                className={styles.logoutButton}
              >
                <FiLogOut className={styles.actionIcon} />
                {actuallyOpen && <span>Logout</span>}
              </button>
            </div>
          </div>
        )}
      </aside>

      {showLogoutModal && (
        <div className={styles.logoutModal}>
          <div className={styles.logoutModalContent}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className={styles.logoutModalActions}>
              <button
                className={styles.logoutModalButton}
                onClick={handleConfirmLogout}
              >
                Yes
              </button>
              <button
                className={`${styles.logoutModalButton} ${styles.cancelButton}`}
                onClick={handleCancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
