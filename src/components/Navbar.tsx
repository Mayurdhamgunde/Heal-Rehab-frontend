import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HtLogo from "../assets/HTic.png";
import { FiMoreVertical, FiUser, FiLogOut } from "react-icons/fi";
import styles from "../css/Navbar.module.css";
import DefaultProfileImage from "../assets/profileimg.png";
const DEFAULT_PROFILE_IMAGE = DefaultProfileImage;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [user, setUser] = useState<{
    doctor_photo: string;
    doctor_first_name: string;
    doctor_last_name: string;
    email: string;
    token: string;
  } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Add event listener for login
    const handleLogin = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      }
    };

    window.addEventListener("userLogin", handleLogin);

    // Cleanup
    return () => {
      window.removeEventListener("userLogin", handleLogin);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsDropdownOpen(false);
    navigate("/");
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
  };

  const getNavLinkClass = (path: string) => {
    return location.pathname === path
      ? `${styles.navItem} ${styles.active}`
      : styles.navItem;
  };

  // Render dropdown menu items based on user login status
  const renderMoreDropdownItems = () => {
    return (
      <>
        {/* Only show these items when user is logged in */}
        {user && (
          <>
            <Link
              to="/All/patients"
              className={styles.moreItem}
              onClick={() => setIsMoreOpen(false)}
            >
              All Patients
            </Link>
            {/* <Link to="dashboard" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
              Dashboard
            </Link> */}
          </>
        )}
        {/* Always show these items */}

        <Link
          to="/privacy-policy"
          className={styles.moreItem}
          onClick={() => setIsMoreOpen(false)}
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms-of-service"
          className={styles.moreItem}
          onClick={() => setIsMoreOpen(false)}
        >
          Terms of Service
        </Link>
      </>
    );
  };

  return (
    <header className={styles.navbarContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <Link to="/" className={styles.navbarBrand}>
            <img
              src={HtLogo}
              alt="HealTrack Logo"
              className={styles.navbarLogo}
            />
          </Link>

          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span
              className={`${styles.hamburger} ${
                isMenuOpen ? styles.active : ""
              }`}
            ></span>
          </button>

          <div
            className={`${styles.navbarLinks} ${
              isMenuOpen ? styles.active : ""
            }`}
          >
            <div className={styles.mainLinks}>
              <Link to="/" className={getNavLinkClass("/")}>
                Home
              </Link>

              {/* <Link to="/about" className={getNavLinkClass("/about")}>
                About
              </Link>
              <Link to="/Features" className={getNavLinkClass("/Features")}>
                Features
              </Link> */}
            </div>

            <div className={styles.navActions}>
              {!user ? (
                <Link to="/login" className={styles.loginButton}>
                  Login
                </Link>
              ) : (
                <div className={styles.profileContainer} ref={profileRef}>
                  <img
                    src={user.doctor_photo || DEFAULT_PROFILE_IMAGE}
                    alt="Profile"
                    className={styles.profileImg}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    onError={handleImageError}
                  />
                  {isDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownImageWrapper}>
                        <div className={styles.dropdownImageContainer}>
                          <Link
                            to="/User"
                            onClick={() => setIsDropdownOpen(false)}
                            className={styles.profileImageLink} // Optional: Add styling if needed
                          >
                            <img
                              src={user.doctor_photo || DEFAULT_PROFILE_IMAGE}
                              alt="Profile"
                              className={styles.dropdownProfileImg}
                              onError={handleImageError}
                            />
                          </Link>
                        </div>
                      </div>
                      <p className={styles.dropdownName}>
                        {user.doctor_first_name} {user.doctor_last_name}
                      </p>
                      <p className={styles.dropdownEmail}>{user.email}</p>

                      <div className={styles.profileActions}>
                        <Link
                          to="/User"
                          className={styles.profileActionItem}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FiUser className={styles.actionIcon} />
                          <span>View Profile</span>
                        </Link>

                        <button
                          className={styles.profileActionItem}
                          onClick={handleLogout}
                        >
                          <FiLogOut className={styles.actionIcon} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.moreMenu} ref={moreMenuRef}>
                <button
                  className={styles.moreButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(!isMoreOpen);
                  }}
                >
                  <FiMoreVertical size={20} />
                </button>
                {isMoreOpen && (
                  <div className={styles.moreDropdown}>
                    {renderMoreDropdownItems()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
