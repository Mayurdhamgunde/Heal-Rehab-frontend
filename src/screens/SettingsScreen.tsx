import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../utils/central";
import GoogleSignInButton from "../components/GoogleSignInButton";
import styles from "../css/SettingsScreen.module.css";
import {
  ChevronRight,
  RefreshCw,
  Building2,
  Briefcase,
  CalendarCheck,
} from "lucide-react";

interface SessionInfo {
  lastUpdated?: string;
  updatedBy?: string;
  organization_name?: string;
  doctor_name?: string;
}

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
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

  const fetchSessionStatus = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/get/googlestatus");
      if (response.data) {
        setSessionInfo(response.data);
      } else {
        setSessionInfo(null);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setSessionInfo(null);
      } else {
        console.error("Error fetching session status:", error);
        showToast("Failed to fetch session status", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const navigateToOrganizationSettings = () => {
    navigate("/organizationSettings");
  };

  const navigateToCreateDepartment = () => {
    navigate("/departments");
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>
          <RefreshCw className={styles.spinner} size={24} />
          <p>Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        {toast && (
          <div className={styles.toastContainer}>
            <div
              className={`${styles.toast} ${
                toast.type === "success"
                  ? styles.toastSuccess
                  : styles.toastError
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}

        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Settings</h1>
          <p className={styles.subtitle}>
            Manage your workspace preferences and integrations
          </p>
        </header>

        <div className={styles.settingsContent}>
          {/* WORKSPACE GROUP */}
          <div className={styles.settingsGroup}>
            <h2 className={styles.groupTitle}>Workspace</h2>

            <div className={styles.settingsCard}>
              {/* Organization Item */}
              <button
                className={styles.settingsRowButton}
                onClick={navigateToOrganizationSettings}
              >
                <div className={styles.rowIconContainer}>
                  <Building2 size={20} className={styles.rowIcon} />
                </div>
                <div className={styles.rowTextContainer}>
                  <span className={styles.rowTitle}>Organization Settings</span>
                  <span className={styles.rowDescription}>
                    Update company details, logo, and contact info
                  </span>
                </div>
                <ChevronRight size={20} className={styles.chevron} />
              </button>

              <div className={styles.divider} />

              {/* Department Item */}
              <button
                className={styles.settingsRowButton}
                onClick={navigateToCreateDepartment}
              >
                <div className={styles.rowIconContainer}>
                  <Briefcase size={20} className={styles.rowIcon} />
                </div>
                <div className={styles.rowTextContainer}>
                  <span className={styles.rowTitle}>Department Management</span>
                  <span className={styles.rowDescription}>
                    Create and configure organizational departments
                  </span>
                </div>
                <ChevronRight size={20} className={styles.chevron} />
              </button>
            </div>
          </div>

          {/* INTEGRATIONS GROUP */}
          <div className={styles.settingsGroup}>
            <h2 className={styles.groupTitle}>Integrations</h2>

            <div className={styles.settingsCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.rowIconContainer}>
                  <CalendarCheck size={20} className={styles.rowIcon} />
                </div>
                <div className={styles.rowTextContainer}>
                  <span className={styles.rowTitle}>Google Calendar</span>
                  <span className={styles.rowDescription}>
                    {sessionInfo
                      ? "Connected and syncing appointments"
                      : "Connect to sync your appointments automatically"}
                  </span>
                </div>
              </div>

              {sessionInfo ? (
                <div className={styles.integrationDetails}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Doctor</span>
                      <span className={styles.infoValue}>
                        {sessionInfo.doctor_name}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Organization</span>
                      <span className={styles.infoValue}>
                        {sessionInfo.organization_name}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Last Synced</span>
                      <span className={styles.infoValue}>
                        {formatDate(sessionInfo.lastUpdated || "")}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Synced By</span>
                      <span className={styles.infoValue}>
                        {sessionInfo.updatedBy}
                      </span>
                    </div>
                  </div>

                  <div className={styles.integrationActions}>
                    <button
                      className={styles.secondaryActionBtn}
                      onClick={fetchSessionStatus}
                    >
                      <RefreshCw size={16} />
                      Refresh Sync Status
                    </button>
                    <div className={styles.googleBtnWrapper}>
                      <GoogleSignInButton
                        onSignInSuccess={() => {
                          fetchSessionStatus();
                          showToast(
                            "Google Calendar integration updated successfully",
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.integrationDetailsConnect}>
                  <GoogleSignInButton
                    onSignInSuccess={() => {
                      fetchSessionStatus();
                      showToast("Google Calendar connected successfully");
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;