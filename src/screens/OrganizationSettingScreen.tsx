import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/OrganizationSettingsScreen.module.css";
import {
  Building2,
  Camera,
  Trash2,
  Video,
  PlusCircle,
  Edit,
  Instagram,
  Facebook,
  Users,
  Mail,
  Phone,
  Calendar,
  Globe,
  MapPin,
  Clock,
  Briefcase,
  Save,
  Link as LinkIcon,
} from "lucide-react";
import IndustryDropdown from "../components/IndustryDropDown";
import OrganizationLocations from "./OrganizationLocations";

// Import the default banner image from assets
import defaultBanner from "../assets/banner1.png";

interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface MedicalProfessional {
  _id?: string;
  id?: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  locationId: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressLink?: string;
}

interface OrganizationHead {
  _id?: string;
  id?: string;
  name: string;
  degree: string;
  reg_no: string;
}

interface OrganizationInfo {
  organization_name: string;
  organization_photo: string;
  organization_employees: string;
  organization_email: string;
  organization_phone: string;
  organization_banner: string;
  organization_address_street: string;
  organization_address_city: string;
  organization_address_state: string;
  organization_address_zip: string;
  organization_address_country: string;
  organization_website: string;
  organization_description: string;
  organization_tax_id: string;
  organization_founded_year: string;
  organization_industry: string;
  organization_timezone: string;
  organization_operating_hours: string;
  organization_social_media: { [key: string]: string };
  youtube_videos: YouTubeVideo[];
  organization_locations: Location[];
  organization_heads: OrganizationHead[];
  medicalProfessional: MedicalProfessional[];
}

const socialMediaPlatforms = [
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "facebook", name: "Facebook", icon: Facebook },
  { id: "twitter", name: "Twitter", icon: "twitter" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" },
  { id: "youtube", name: "YouTube", icon: "youtube" },
];

const OrganizationSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showBannerOptions, setShowBannerOptions] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [, setShowSetupPopup] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [showSocialMediaDropdown, setShowSocialMediaDropdown] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [originalOrgInfo, setOriginalOrgInfo] =
    useState<OrganizationInfo | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const session = { idToken: "mock-token" };

  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({
    organization_name: "",
    organization_photo: "",
    organization_employees: "",
    organization_email: "",
    organization_phone: "",
    organization_banner: "",
    organization_address_street: "",
    organization_address_city: "",
    organization_address_state: "",
    organization_address_zip: "",
    organization_address_country: "",
    organization_website: "",
    organization_description: "",
    organization_tax_id: "",
    organization_founded_year: "",
    organization_industry: "",
    organization_timezone: "",
    organization_operating_hours: "",
    organization_social_media: {},
    youtube_videos: [],
    organization_locations: [],
    organization_heads: [],
    medicalProfessional: [],
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchOrganizationInfo();
  }, []);

  useEffect(() => {
    if (location.state?.showOrgPopup) {
      setShowSetupPopup(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchOrganizationInfo = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/getOrg");
      const orgData = response.data.organization;
      const socialMediaKeys = Object.keys(
        orgData.organization_social_media || {},
      ).filter((key) => orgData.organization_social_media[key] !== "");

      const newOrgInfo: OrganizationInfo = {
        organization_name: orgData.organization_name || "",
        organization_photo: orgData.organization_logo || "",
        organization_employees: orgData.organization_employees || "",
        organization_email: orgData.organization_email || "",
        organization_phone: orgData.organization_phone || "",
        organization_banner: orgData.organization_banner || "",
        organization_address_street: orgData.organization_address?.street || "",
        organization_address_city: orgData.organization_address?.city || "",
        organization_address_state: orgData.organization_address?.state || "",
        organization_address_zip: orgData.organization_address?.zip || "",
        organization_address_country:
          orgData.organization_address?.country || "",
        organization_website: orgData.organization_website || "",
        organization_description: orgData.organization_description || "",
        organization_tax_id: orgData.organization_tax_id || "",
        organization_founded_year: orgData.organization_founded_year || "",
        organization_industry: orgData.organization_industry || "",
        organization_timezone: orgData.organization_timezone || "",
        organization_operating_hours:
          orgData.organization_operating_hours || "",
        organization_social_media: orgData.organization_social_media || {},
        youtube_videos: orgData.youtube_videos || [],
        organization_locations: orgData.organization_locations || [],
        organization_heads: orgData.organization_heads || [],
        medicalProfessional: orgData.medicalProfessional || [],
      };

      setOrganizationInfo(newOrgInfo);
      setOriginalOrgInfo(newOrgInfo);
      setSelectedPlatforms(socialMediaKeys);
    } catch (error) {
      console.error("Error fetching organization info:", error);
      showToast("Failed to load organization information", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationsChange = (newLocations: Location[]) => {
    setOrganizationInfo((prev) => ({
      ...prev,
      organization_locations: newLocations,
    }));
  };

  const handleAddHead = () => {
    setOrganizationInfo((prev) => ({
      ...prev,
      organization_heads: [
        ...prev.organization_heads,
        { id: Date.now().toString(), name: "", degree: "", reg_no: "" },
      ],
    }));
  };

  const handleUpdateHead = (
    index: number,
    field: keyof OrganizationHead,
    value: string,
  ) => {
    setOrganizationInfo((prev) => {
      const updatedHeads = [...prev.organization_heads];
      updatedHeads[index] = { ...updatedHeads[index], [field]: value };
      return { ...prev, organization_heads: updatedHeads };
    });
  };

  const handleRemoveHead = (index: number) => {
    setOrganizationInfo((prev) => ({
      ...prev,
      organization_heads: prev.organization_heads.filter((_, i) => i !== index),
    }));
  };

  const handleAddMedicalProfessional = () => {
    setOrganizationInfo((prev) => ({
      ...prev,
      medicalProfessional: [
        ...prev.medicalProfessional,
        { id: Date.now().toString(), name: "" },
      ],
    }));
  };

  const handleUpdateMedicalProfessional = (index: number, value: string) => {
    setOrganizationInfo((prev) => {
      const updatedProfs = [...prev.medicalProfessional];
      updatedProfs[index] = { ...updatedProfs[index], name: value };
      return { ...prev, medicalProfessional: updatedProfs };
    });
  };

  const handleRemoveMedicalProfessional = (index: number) => {
    setOrganizationInfo((prev) => ({
      ...prev,
      medicalProfessional: prev.medicalProfessional.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const hasChanges = useMemo(() => {
    if (!originalOrgInfo) return false;
    return JSON.stringify(organizationInfo) !== JSON.stringify(originalOrgInfo);
  }, [organizationInfo, originalOrgInfo]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "banner",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_photo", file);

    setIsLoading(true);
    try {
      const response = await api.put(
        `/org/update${type === "photo" ? "Photo" : "Banner"}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      if (response.data.imageUrl) {
        setOrganizationInfo((prev) => ({
          ...prev,
          [type === "photo" ? "organization_photo" : "organization_banner"]:
            response.data.imageUrl,
        }));
        showToast(
          `${type === "photo" ? "Logo" : "Banner"} updated successfully`,
        );
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      showToast(
        `Failed to upload ${type === "photo" ? "logo" : "banner"}`,
        "error",
      );
    } finally {
      setIsLoading(false);
      setShowPhotoOptions(false);
      setShowBannerOptions(false);
    }
  };

  const handleDeleteImage = async (type: "photo" | "banner") => {
    if (
      window.confirm(
        `Are you sure you want to delete the organization ${type}?`,
      )
    ) {
      try {
        setIsLoading(true);
        await api.delete(`/org/${type}`, {
          headers: { Authorization: `Bearer ${session.idToken}` },
        });
        setOrganizationInfo((prev) => ({
          ...prev,
          [type === "photo" ? "organization_photo" : "organization_banner"]: "",
        }));
        showToast(
          `${type === "photo" ? "Logo" : "Banner"} deleted successfully`,
        );
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        showToast(`Failed to delete ${type}`, "error");
      } finally {
        setIsLoading(false);
        setShowPhotoOptions(false);
        setShowBannerOptions(false);
      }
    }
  };

  const handleAddVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      showToast("Please enter both title and URL", "error");
      return;
    }
    if (
      !newVideoUrl.includes("youtube.com/") &&
      !newVideoUrl.includes("youtu.be/")
    ) {
      showToast("Please enter a valid YouTube video URL", "error");
      return;
    }

    if (editingVideoId) {
      setOrganizationInfo((prev) => ({
        ...prev,
        youtube_videos: prev.youtube_videos.map((video) =>
          video.id === editingVideoId
            ? {
                ...video,
                title: newVideoTitle,
                url: newVideoUrl,
                description: newVideoDescription,
              }
            : video,
        ),
      }));
    } else {
      setOrganizationInfo((prev) => ({
        ...prev,
        youtube_videos: [
          ...prev.youtube_videos,
          {
            id: Date.now().toString(),
            title: newVideoTitle,
            url: newVideoUrl,
            description: newVideoDescription,
          },
        ],
      }));
    }

    setNewVideoTitle("");
    setNewVideoUrl("");
    setNewVideoDescription("");
    setEditingVideoId(null);
    setShowVideoModal(false);
  };

  const handleSave = async () => {
    if (
      !organizationInfo.organization_name ||
      !organizationInfo.organization_email
    ) {
      showToast("Organization Name and Email are required", "error");
      return;
    }
    const incompleteProfs = organizationInfo.medicalProfessional.some(
      (prof) => !prof.name.trim(),
    );
    if (incompleteProfs) {
      showToast("Please provide a name for all Medical Professionals", "error");
      return;
    }

    const locationIds = organizationInfo.organization_locations.map(
      (loc) => loc.locationId,
    );
    if (locationIds.length !== new Set(locationIds).size) {
      showToast("Location IDs must be unique", "error");
      return;
    }

    const incompleteHeads = organizationInfo.organization_heads.some(
      (head) => !head.name.trim() || !head.degree.trim() || !head.reg_no.trim(),
    );
    if (incompleteHeads) {
      showToast("Please fill in all fields for Organization Heads", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/update/org", organizationInfo, {
        headers: { Authorization: `Bearer ${session.idToken}` },
      });
      setOriginalOrgInfo(organizationInfo);
      showToast("Organization updated successfully");
    } catch (error) {
      console.error("Error updating:", error);
      showToast("Failed to update organization", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTitleSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!tempTitle.trim()) return showToast("Name cannot be empty", "error");
      setOrganizationInfo((prev) => ({
        ...prev,
        organization_name: tempTitle,
      }));
      setIsEditingTitle(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "OR";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className={styles.centeredState}>
        <div className={styles.spinner}></div>
        <p className={styles.fontBody}>Loading Organization Settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      {toast && (
        <div className={styles.toastContainer}>
          <div
            className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* --- Hero Section --- */}
      <section
        className={styles.heroSection}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(220, 233, 232, 0.85), rgba(0, 104, 95, 0.7)), url(${organizationInfo.organization_banner || defaultBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <button
          className={styles.editBannerBtnHero}
          onClick={() => setShowBannerOptions(true)}
        >
          <Camera size={16} /> Edit Banner
        </button>

        <div className={styles.heroContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarImgContainer}>
              {organizationInfo.organization_photo ? (
                <img
                  src={organizationInfo.organization_photo}
                  alt="Logo"
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {getInitials(organizationInfo.organization_name)}
                </div>
              )}
              <button
                className={styles.editAvatarBtn}
                onClick={() => setShowPhotoOptions(true)}
              >
                <Camera size={14} />
              </button>
            </div>
            <span className={styles.statusBadgeHero}>Active</span>
          </div>

          <div className={styles.heroDetails}>
            <div className={styles.heroHeaderRow}>
              <div>
                {isEditingTitle ? (
                  <input
                    className={styles.heroTitleInput}
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={handleTitleSave}
                    onBlur={() => setIsEditingTitle(false)}
                    autoFocus
                  />
                ) : (
                  <h2
                    className={`${styles.patientName} ${styles.fontHeadline}`}
                  >
                    {organizationInfo.organization_name || "Organization Name"}
                    <button
                      className={styles.inlineEditBtn}
                      onClick={() => {
                        setTempTitle(organizationInfo.organization_name);
                        setIsEditingTitle(true);
                      }}
                    >
                      <Edit size={14} />
                    </button>
                  </h2>
                )}
                <p className={`${styles.patientId} ${styles.fontBody}`}>
                  <Briefcase size={14} />{" "}
                  {organizationInfo.organization_industry ||
                    "Unspecified Industry"}
                </p>
              </div>
              <div className={styles.heroActions}>
                <button
                  className={`${styles.btnPrimary} ${!hasChanges || saving ? styles.btnDisabled : ""}`}
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div className={styles.heroQuickStats}>
              <div className={styles.statItem}>
                <div className={styles.statIconWrapper}>
                  <Mail size={14} />
                </div>
                <div>
                  <p className={styles.statLabel}>Email</p>
                  <p className={styles.statValue}>
                    {organizationInfo.organization_email || "Not Provided"}
                  </p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconWrapper}>
                  <Phone size={14} />
                </div>
                <div>
                  <p className={styles.statLabel}>Phone</p>
                  <p className={styles.statValue}>
                    {organizationInfo.organization_phone || "Not Provided"}
                  </p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconWrapper}>
                  <Calendar size={14} />
                </div>
                <div>
                  <p className={styles.statLabel}>Founded</p>
                  <p className={styles.statValue}>
                    {organizationInfo.organization_founded_year || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Navigation Tabs --- */}
      <nav className={styles.tabsNav}>
        {[
          "overview",
          "locations",
          "leadership",
          "medical professionals",
          "media",
        ].map((tab) => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""} ${styles.fontBody}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* --- MAIN TAB PANELS --- */}
      <main>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className={styles.bentoGrid}>
            <div className={styles.colSpan8}>
              <div className={styles.bentoCard}>
                <div className={styles.cardHeader}>
                  <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                    Core Details
                  </h3>
                  <Building2 size={18} color="var(--primary)" />
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>
                      Organization Description
                    </label>
                    <textarea
                      className={styles.textarea}
                      rows={4}
                      value={organizationInfo.organization_description}
                      onChange={(e) =>
                        setOrganizationInfo({
                          ...organizationInfo,
                          organization_description: e.target.value,
                        })
                      }
                      placeholder="Enter a brief description of your organization..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address *</label>
                    <input
                      className={styles.input}
                      type="email"
                      value={organizationInfo.organization_email}
                      onChange={(e) =>
                        setOrganizationInfo({
                          ...organizationInfo,
                          organization_email: e.target.value,
                        })
                      }
                      placeholder="contact@org.com"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Phone Number</label>
                    <input
                      className={styles.input}
                      type="tel"
                      value={organizationInfo.organization_phone}
                      onChange={(e) =>
                        setOrganizationInfo({
                          ...organizationInfo,
                          organization_phone: e.target.value,
                        })
                      }
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.colSpan4}>
              <div className={styles.bentoCard} style={{ height: "100%" }}>
                <div className={styles.cardHeader}>
                  <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                    Additional Info
                  </h3>
                  <Globe size={18} color="var(--primary)" />
                </div>
                <div className={styles.formGridCols1}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Website URL</label>
                    <input
                      className={styles.input}
                      type="url"
                      value={organizationInfo.organization_website}
                      onChange={(e) =>
                        setOrganizationInfo({
                          ...organizationInfo,
                          organization_website: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Industry Specialty</label>
                    <IndustryDropdown
                      selectedValue={organizationInfo.organization_industry}
                      onValueChange={(val) =>
                        setOrganizationInfo({
                          ...organizationInfo,
                          organization_industry: val,
                        })
                      }
                      placeholder="Select Industry"
                    />
                  </div>
                  <div className={styles.formGroupRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Tax ID</label>
                      <input
                        className={styles.input}
                        value={organizationInfo.organization_tax_id}
                        onChange={(e) =>
                          setOrganizationInfo({
                            ...organizationInfo,
                            organization_tax_id: e.target.value,
                          })
                        }
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Employees</label>
                      <input
                        className={styles.input}
                        type="number"
                        value={organizationInfo.organization_employees}
                        onChange={(e) =>
                          setOrganizationInfo({
                            ...organizationInfo,
                            organization_employees: e.target.value,
                          })
                        }
                        placeholder="e.g. 50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.colSpan12}>
              <div className={styles.bentoCard}>
                <div className={styles.cardHeader}>
                  <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                    Operations
                  </h3>
                  <Clock size={18} color="var(--primary)" />
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Operating Hours</label>
                    <input
                      className={styles.input}
                      value={organizationInfo.organization_operating_hours}
                      onChange={(e) =>
                        setOrganizationInfo({
                          ...organizationInfo,
                          organization_operating_hours: e.target.value,
                        })
                      }
                      placeholder="Mon-Fri 9AM - 5PM"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Timezone</label>
                    <input
                      className={styles.input}
                      value={organizationInfo.organization_timezone}
                      onChange={(e) =>
                        setOrganizationInfo({
                          ...organizationInfo,
                          organization_timezone: e.target.value,
                        })
                      }
                      placeholder="UTC-5 / EST"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOCATIONS TAB */}
        {activeTab === "locations" && (
          <div className={styles.overviewContainer}>
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  Primary Headquarters
                </h3>
                <MapPin size={18} color="var(--primary)" />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Street Address</label>
                  <input
                    className={styles.input}
                    value={organizationInfo.organization_address_street}
                    onChange={(e) =>
                      setOrganizationInfo({
                        ...organizationInfo,
                        organization_address_street: e.target.value,
                      })
                    }
                    placeholder="123 Main St, Suite 100"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>City</label>
                  <input
                    className={styles.input}
                    value={organizationInfo.organization_address_city}
                    onChange={(e) =>
                      setOrganizationInfo({
                        ...organizationInfo,
                        organization_address_city: e.target.value,
                      })
                    }
                    placeholder="City"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>State / Province</label>
                  <input
                    className={styles.input}
                    value={organizationInfo.organization_address_state}
                    onChange={(e) =>
                      setOrganizationInfo({
                        ...organizationInfo,
                        organization_address_state: e.target.value,
                      })
                    }
                    placeholder="State"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>ZIP / Postal Code</label>
                  <input
                    className={styles.input}
                    value={organizationInfo.organization_address_zip}
                    onChange={(e) =>
                      setOrganizationInfo({
                        ...organizationInfo,
                        organization_address_zip: e.target.value,
                      })
                    }
                    placeholder="ZIP Code"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Country</label>
                  <input
                    className={styles.input}
                    value={organizationInfo.organization_address_country}
                    onChange={(e) =>
                      setOrganizationInfo({
                        ...organizationInfo,
                        organization_address_country: e.target.value,
                      })
                    }
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            <div className={styles.bentoCardWrapper}>
              <OrganizationLocations
                locations={organizationInfo.organization_locations}
                onLocationsChange={handleLocationsChange}
              />
            </div>
          </div>
        )}

        {/* LEADERSHIP TAB */}
        {activeTab === "leadership" && (
          <div className={styles.bentoCard}>
            <div className={styles.cardHeader}>
              <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                Organization Heads
              </h3>
              <Users size={18} color="var(--primary)" />
            </div>
            <p className={styles.helperText}>
              Manage the primary leaders, directors, or chief medical officers
              of this organization.
            </p>

            <div className={styles.stripGrid}>
              {organizationInfo.organization_heads.map((head, index) => (
                <div
                  key={head._id || head.id || index}
                  className={styles.formCardStrip}
                >
                  <div className={styles.stripHeaderRow}>
                    <h4>Leader #{index + 1}</h4>
                    <button
                      className={styles.actionBtnSoftRed}
                      onClick={() => handleRemoveHead(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroupFull}>
                      <label className={styles.label}>Full Name *</label>
                      <input
                        className={styles.input}
                        value={head.name}
                        onChange={(e) =>
                          handleUpdateHead(index, "name", e.target.value)
                        }
                        placeholder="e.g., Dr. Jane Doe"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Degree / Qualification *
                      </label>
                      <input
                        className={styles.input}
                        value={head.degree}
                        onChange={(e) =>
                          handleUpdateHead(index, "degree", e.target.value)
                        }
                        placeholder="e.g., MBBS, MD"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Registration No. *</label>
                      <input
                        className={styles.input}
                        value={head.reg_no}
                        onChange={(e) =>
                          handleUpdateHead(index, "reg_no", e.target.value)
                        }
                        placeholder="e.g., MED-12345"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className={styles.btnDashed}
              onClick={handleAddHead}
              disabled={saving}
            >
              <PlusCircle size={16} /> Add Organization Head
            </button>
          </div>
        )}

        {/* MEDICAL PROFESSIONALS TAB */}
        {activeTab === "medical professionals" && (
          <div className={styles.bentoCard}>
            <div className={styles.cardHeader}>
              <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                Medical Professionals
              </h3>
              <Users size={18} color="var(--primary)" />
            </div>
            <p className={styles.helperText}>
              Manage the medical professionals associated with this
              organization.
            </p>

            <div className={styles.stripGrid}>
              {organizationInfo.medicalProfessional.map((prof, index) => (
                <div
                  key={prof._id || prof.id || index}
                  className={styles.formCardStrip}
                >
                  <div className={styles.stripHeaderRow}>
                    <h4>Professional #{index + 1}</h4>
                    <button
                      className={styles.actionBtnSoftRed}
                      onClick={() => handleRemoveMedicalProfessional(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroupFull}>
                      <label className={styles.label}>Full Name *</label>
                      <input
                        className={styles.input}
                        value={prof.name}
                        onChange={(e) =>
                          handleUpdateMedicalProfessional(index, e.target.value)
                        }
                        placeholder="e.g., Dr. Alice Smith"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className={styles.btnDashed}
              onClick={handleAddMedicalProfessional}
              disabled={saving}
            >
              <PlusCircle size={16} /> Add Medical Professional
            </button>
          </div>
        )}

        {/* MEDIA & SOCIAL TAB */}
        {activeTab === "media" && (
          <div className={styles.overviewContainer}>
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  Social Platforms
                </h3>
                <LinkIcon size={18} color="var(--primary)" />
              </div>

              <button
                className={styles.btnSecondaryIconFull}
                onClick={() => setShowSocialMediaDropdown(true)}
              >
                Select Platforms to Display
              </button>

              <div
                className={styles.formGridCols1}
                style={{ marginTop: "1rem" }}
              >
                {selectedPlatforms.map((platform) => {
                  const platformInfo = socialMediaPlatforms.find(
                    (p) => p.id === platform,
                  );
                  const IconComponent = platformInfo?.icon;
                  return (
                    <div key={platform} className={styles.socialInputWrapper}>
                      <div className={styles.socialIconBox}>
                        {IconComponent && typeof IconComponent !== "string" ? (
                          <IconComponent size={18} />
                        ) : (
                          <span>{platform.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <input
                        className={styles.input}
                        style={{
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          borderLeft: 0,
                        }}
                        placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile URL`}
                        value={
                          organizationInfo.organization_social_media[
                            platform
                          ] || ""
                        }
                        onChange={(e) =>
                          setOrganizationInfo((prev) => ({
                            ...prev,
                            organization_social_media: {
                              ...prev.organization_social_media,
                              [platform]: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <h3 className={`${styles.cardTitle} ${styles.fontHeadline}`}>
                  YouTube Showcase
                </h3>
                <button
                  className={styles.btnPrimarySmall}
                  onClick={() => {
                    setNewVideoTitle("");
                    setNewVideoUrl("");
                    setNewVideoDescription("");
                    setEditingVideoId(null);
                    setShowVideoModal(true);
                  }}
                >
                  <PlusCircle size={12} /> Add Video
                </button>
              </div>

              {organizationInfo.youtube_videos.length === 0 ? (
                <div className={styles.emptyState}>
                  No showcase videos added yet.
                </div>
              ) : (
                <div className={styles.stripGrid}>
                  {organizationInfo.youtube_videos.map((video) => (
                    <div key={video.id} className={styles.stripCard}>
                      <div className={styles.stripMain}>
                        <div
                          className={styles.stripIcon}
                          style={{
                            background: "rgba(220, 38, 38, 0.1)",
                            color: "#DC2626",
                          }}
                        >
                          <Video />
                        </div>
                        <div className={styles.stripText}>
                          <h4>{video.title}</h4>
                          <span>{video.url}</span>
                          {video.description && (
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--on-surface-variant)",
                                marginTop: "4px",
                                margin: 0,
                              }}
                            >
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={styles.stripActionsVisible}>
                        <button
                          className={styles.actionBtnSoft}
                          onClick={() => {
                            setNewVideoTitle(video.title);
                            setNewVideoUrl(video.url);
                            setNewVideoDescription(video.description || "");
                            setEditingVideoId(video.id);
                            setShowVideoModal(true);
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={styles.actionBtnSoftRed}
                          onClick={() => {
                            if (window.confirm("Remove this video?"))
                              setOrganizationInfo((prev) => ({
                                ...prev,
                                youtube_videos: prev.youtube_videos.filter(
                                  (v) => v.id !== video.id,
                                ),
                              }));
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {/* Photo / Banner Upload Modal logic remains structurally similar but styled via CSS */}
      {showPhotoOptions && (
        <div
          className={styles.modalOverlay}
          onClick={(e) =>
            e.target === e.currentTarget && setShowPhotoOptions(false)
          }
        >
          <div className={styles.modalContent}>
            <h4 className={styles.modalTitle}>Update Logo</h4>
            <label className={styles.modalOption}>
              <Camera size={18} /> Change Logo Image
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => handleImageUpload(e, "photo")}
              />
            </label>
            {organizationInfo.organization_photo && (
              <button
                className={`${styles.modalOption} ${styles.deleteOption}`}
                onClick={() => handleDeleteImage("photo")}
              >
                <Trash2 size={18} /> Remove Logo
              </button>
            )}
          </div>
        </div>
      )}

      {showBannerOptions && (
        <div
          className={styles.modalOverlay}
          onClick={(e) =>
            e.target === e.currentTarget && setShowBannerOptions(false)
          }
        >
          <div className={styles.modalContent}>
            <h4 className={styles.modalTitle}>Update Banner</h4>
            <label className={styles.modalOption}>
              <Camera size={18} /> Upload New Banner
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => handleImageUpload(e, "banner")}
              />
            </label>
            {organizationInfo.organization_banner && (
              <button
                className={`${styles.modalOption} ${styles.deleteOption}`}
                onClick={() => handleDeleteImage("banner")}
              >
                <Trash2 size={18} /> Remove Banner
              </button>
            )}
          </div>
        </div>
      )}

      {showSocialMediaDropdown && (
        <div
          className={styles.modalOverlay}
          onClick={(e) =>
            e.target === e.currentTarget && setShowSocialMediaDropdown(false)
          }
        >
          <div className={styles.dropdownContainer}>
            <h4 className={styles.modalTitle}>Toggle Platforms</h4>
            {socialMediaPlatforms.map((platform) => (
              <label key={platform.id} className={styles.dropdownItem}>
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform.id)}
                  onChange={() =>
                    setSelectedPlatforms((prev) =>
                      prev.includes(platform.id)
                        ? prev.filter((p) => p !== platform.id)
                        : [...prev, platform.id],
                    )
                  }
                  style={{ marginRight: "10px" }}
                />
                {platform.name}
              </label>
            ))}
            <div className={styles.modalFooter}>
              <button
                className={styles.btnPrimary}
                style={{ width: "100%" }}
                onClick={() => setShowSocialMediaDropdown(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) =>
            e.target === e.currentTarget && setShowVideoModal(false)
          }
        >
          <div className={styles.videoModalContent}>
            <h3 className={styles.modalTitle}>
              {editingVideoId ? "Edit Video" : "Add YouTube Video"}
            </h3>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Video Title</label>
              <input
                className={styles.input}
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>YouTube URL</label>
              <input
                className={styles.input}
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                type="url"
              />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                value={newVideoDescription}
                onChange={(e) => setNewVideoDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondarySmall}
                onClick={() => setShowVideoModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimarySmall}
                onClick={handleAddVideo}
              >
                {editingVideoId ? "Update Video" : "Add Video"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSettingsScreen;
