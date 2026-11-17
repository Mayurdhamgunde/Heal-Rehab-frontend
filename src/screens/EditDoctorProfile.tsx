import React, { useState, useEffect, useRef } from "react";
import {
  User,
  GraduationCap,
  Building2,
  Phone,
  DollarSign,
  FileText,
  Video,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import styles from "../css/EditDoctorProfile.module.css";
import api from "../utils/central";
import 'react-image-crop/dist/ReactCrop.css';

interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
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
  specialization: string;
  consultation_fee: number;
  therapy_fee: number;
  doctor_description: string;
  youtube_videos: YouTubeVideo[];
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
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
  specialization: "",
  consultation_fee: 0,
  therapy_fee: 0,
  doctor_description: "",
  youtube_videos: [],
};

const DoctorProfileEdit: React.FC = () => {
  const session = { idToken: "mock-token" };
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>(initialProfileState);
  const [originalProfileInfo, setOriginalProfileInfo] = useState<ProfileInfo>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    callingCode: "91",
  });
  const [phoneWithoutCode, setPhoneWithoutCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
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
      const matchedCountry = countries.find((country) =>
        profileInfo.doctor_phone.startsWith(`+${country.callingCode}`)
      );

      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneWithoutCode(
          profileInfo.doctor_phone.substring(matchedCountry.callingCode.length + 1)
        );
      } else {
        setSelectedCountry({
          name: "India",
          code: "IN",
          flag: "🇮🇳",
          callingCode: "91",
        });
        setPhoneWithoutCode(profileInfo.doctor_phone);
      }
    }
  }, [profileInfo.doctor_phone]);

  const handlePhoneChange = (text: string) => {
    const cleanedText = text.replace(/\D/g, "");
    const limitedText = cleanedText.slice(0, 10);

    setPhoneWithoutCode(limitedText);

    if (limitedText.length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number");
    } else {
      setPhoneError("");
    }

    const fullPhoneNumber = `+${selectedCountry.callingCode}${limitedText}`;
    handleInputChange("doctor_phone", fullPhoneNumber);
  };

  const fetchDoctorInfo = async () => {
    if (!session.idToken) return;

    setIsLoading(true);

    try {
      const response = await api.get(`/doctor`);
      const responseData = {
        ...response.data,
        specialization: response.data.specialization || "",
        youtube_videos: response.data.youtube_videos || [],
      };
      setProfileInfo(responseData);
      setOriginalProfileInfo(responseData);
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      showToast("Failed to fetch doctor info", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof ProfileInfo,
    value: string | number
  ) => {
    setProfileInfo((prev) => ({ ...prev, [field]: value }));
  };

  const hasChanges = () => {
    return (
      profileInfo.doctor_first_name !== originalProfileInfo.doctor_first_name ||
      profileInfo.doctor_last_name !== originalProfileInfo.doctor_last_name ||
      profileInfo.qualification !== originalProfileInfo.qualification ||
      profileInfo.doctor_email !== originalProfileInfo.doctor_email ||
      profileInfo.doctor_phone !== originalProfileInfo.doctor_phone ||
      profileInfo.specialization !== originalProfileInfo.specialization ||
      profileInfo.consultation_fee !== originalProfileInfo.consultation_fee ||
      profileInfo.therapy_fee !== originalProfileInfo.therapy_fee ||
      profileInfo.doctor_description !== originalProfileInfo.doctor_description ||
      JSON.stringify(profileInfo.youtube_videos) !== JSON.stringify(originalProfileInfo.youtube_videos) ||
      profileInfo.doctors_photo !== originalProfileInfo.doctors_photo
    );
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      showToast("No changes were made to your profile");
      return;
    }

    if (!session.idToken) {
      showToast("You must be logged in to update your profile", "error");
      return;
    }

    setIsSaving(true);

    try {
      await api.put(`/doctor/update/${profileInfo._id}`, {
        doctor_first_name: profileInfo.doctor_first_name,
        doctor_last_name: profileInfo.doctor_last_name,
        qualification: profileInfo.qualification,
        doctor_email: profileInfo.doctor_email,
        doctor_phone: profileInfo.doctor_phone,
        specialization: profileInfo.specialization,
        therapy_fee: profileInfo.therapy_fee,
        consultation_fee: profileInfo.consultation_fee,
        doctor_description: profileInfo.doctor_description,
        youtube_videos: profileInfo.youtube_videos,
      });

      setOriginalProfileInfo(profileInfo);
      showToast("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      showToast("Please enter both title and URL for the video", "error");
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
      const updatedVideos = profileInfo.youtube_videos.map((video) =>
        video.id === editingVideoId
          ? {
              ...video,
              title: newVideoTitle,
              url: newVideoUrl,
              description: newVideoDescription,
            }
          : video
      );
      setProfileInfo((prev) => ({ ...prev, youtube_videos: updatedVideos }));
    } else {
      const newVideo: YouTubeVideo = {
        id: Date.now().toString(),
        title: newVideoTitle,
        url: newVideoUrl,
        description: newVideoDescription,
      };
      setProfileInfo((prev) => ({
        ...prev,
        youtube_videos: [...prev.youtube_videos, newVideo],
      }));
    }

    setNewVideoTitle("");
    setNewVideoUrl("");
    setNewVideoDescription("");
    setEditingVideoId(null);
    setShowVideoModal(false);
  };

  const handleEditVideo = (video: YouTubeVideo) => {
    setNewVideoTitle(video.title);
    setNewVideoUrl(video.url);
    setNewVideoDescription(video.description || "");
    setEditingVideoId(video.id);
    setShowVideoModal(true);
  };

  const handleDeleteVideo = (videoId: string) => {
    if (window.confirm("Are you sure you want to remove this video?")) {
      const updatedVideos = profileInfo.youtube_videos.filter(
        (video) => video.id !== videoId
      );
      setProfileInfo((prev) => ({ ...prev, youtube_videos: updatedVideos }));
    }
  };

  const handleImagePick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setShowCropModal(true);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImage = async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg", 0.7);
    });
  };

  const renderPhotoViewerModal = () => (
    <div
      className={styles.modalOverlay}
      onClick={() => setShowPhotoViewer(false)}
    >
      <div
        className={styles.photoViewerModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.photoViewerCloseButton}
          onClick={() => setShowPhotoViewer(false)}
        >
          ✕
        </button>
        <img
          src={profileInfo.doctors_photo || "/assets/profile.png"}
          alt="Profile Full View"
          className={styles.photoViewerImage}
        />
      </div>
    </div>
  );

  const handleImageUpload = async () => {
    const croppedImage = await getCroppedImage();
    if (!croppedImage) {
      showToast("Failed to crop image", "error");
      return;
    }

    const fileName = `profile-${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("profile_photo", croppedImage, fileName);

    setIsLoading(true);

    try {
      const response = await api.put(
        `/doctor/update-photo/${profileInfo._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.imageUrl) {
        setProfileInfo((prev) => ({
          ...prev,
          doctors_photo: response.data.imageUrl,
        }));
        showToast("Profile photo updated successfully");
        fetchDoctorInfo();
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      showToast("Failed to upload profile photo", "error");
    } finally {
      setIsLoading(false);
      setShowCropModal(false);
      setSelectedImage(null);
      setCompletedCrop(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?"))
      return;

    setIsLoading(true);
    try {
      await api.delete(`/doctor/photo`);
      setProfileInfo((prev) => ({ ...prev, doctors_photo: "" }));
      showToast("Profile photo deleted successfully");
      fetchDoctorInfo();
    } catch (error) {
      console.error("Error deleting photo:", error);
      showToast("Failed to delete profile photo", "error");
    } finally {
      setIsLoading(false);
      setShowPhotoOptions(false);
    }
  };

  const renderPhotoOptionsModal = () => (
    <div
      className={styles.modalOverlay}
      onClick={() => setShowPhotoOptions(false)}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalOption} onClick={handleImagePick}>
          <span className={styles.modalOptionIcon}>
            {profileInfo.doctors_photo ? (
              <Edit size={18} />
            ) : (
              <Plus size={18} />
            )}
          </span>
          <span className={styles.modalOptionText}>
            {profileInfo.doctors_photo ? "Change Photo" : "Add Photo"}
          </span>
        </div>
        {profileInfo.doctors_photo && (
          <div
            className={[styles.modalOption, styles.deleteOption].join(" ")}
            onClick={handleDeletePhoto}
          >
            <span className={styles.modalOptionIcon}>
              <Trash2 size={18} />
            </span>
            <span className={styles.modalOptionText}>Delete Photo</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderCropModal = () => (
    <div
      className={styles.modalOverlay}
      onClick={() => {
        setShowCropModal(false);
        setSelectedImage(null);
        setCompletedCrop(null);
      }}
    >
      <div
        className={styles.videoModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.videoModalTitle}>Crop Profile Photo</h2>
        
        <div className={styles.cropModalContent}>
          {selectedImage && (
            <div className={styles.cropImageContainer}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="ReactCrop"
              >
                <img
                  ref={imgRef}
                  src={selectedImage}
                  alt="Crop"
                  className={styles.cropImage}
                  onLoad={() => {
                    // Reset crop when image loads to ensure it's visible
                    setCrop({
                      unit: "%",
                      x: 25,
                      y: 25,
                      width: 50,
                      height: 50,
                    });
                  }}
                />
              </ReactCrop>
            </div>
          )}
        </div>
        
        <div className={styles.videoModalButtonsRow}>
          <button
            className={styles.videoModalCancelButton}
            onClick={() => {
              setShowCropModal(false);
              setSelectedImage(null);
              setCompletedCrop(null);
            }}
          >
            Cancel
          </button>
          <button
            className={styles.videoModalSaveButton}
            onClick={handleImageUpload}
            disabled={!completedCrop}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  const renderVideoModal = () => (
    <div
      className={styles.modalOverlay}
      onClick={() => {
        setShowVideoModal(false);
        setNewVideoTitle("");
        setNewVideoUrl("");
        setEditingVideoId(null);
      }}
    >
      <div
        className={styles.videoModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.videoModalTitle}>
          {editingVideoId ? "Edit Video" : "Add YouTube Video"}
        </h2>
        <div className={styles.videoInputGroup}>
          <label className={styles.videoInputLabel}>Video Title</label>
          <input
            className={styles.videoInput}
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            placeholder="Enter video title"
          />
        </div>
        <div className={styles.videoInputGroup}>
          <label className={styles.videoInputLabel}>YouTube URL</label>
          <input
            className={styles.videoInput}
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            placeholder="Enter YouTube video URL"
          />
        </div>
        <div className={styles.videoInputGroup}>
          <label className={styles.videoInputLabel}>Description</label>
          <textarea
            className={[styles.videoInput, styles.videoDescriptionInput].join(" ")}
            value={newVideoDescription}
            onChange={(e) => setNewVideoDescription(e.target.value)}
            placeholder="Enter video description"
          />
        </div>
        <div className={styles.videoModalButtonsRow}>
          <button
            className={styles.videoModalCancelButton}
            onClick={() => {
              setShowVideoModal(false);
              setNewVideoTitle("");
              setNewVideoUrl("");
              setEditingVideoId(null);
            }}
          >
            Cancel
          </button>
          <button
            className={styles.videoModalSaveButton}
            onClick={handleAddVideo}
          >
            {editingVideoId ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={24} />
        <p>Loading doctor information...</p>
      </div>
    );
  }

  if (!session.idToken) {
    return (
      <div className={styles.loadingContainer}>
        <p>Please log in to edit your profile.</p>
      </div>
    );
  }

  const profilePhoto = profileInfo.doctors_photo || "/assets/profile.png";

  return (
    <div className={styles.container}>
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <header className={styles.header}>
        <h1>My Profile</h1>
      </header>
      <div className={styles.headerContainer}>
        <div className={styles.profileHeader}>
          <div 
            className={styles.profileImageContainer}
            onClick={() => {
              if (profileInfo.doctors_photo) {
                setShowPhotoViewer(true);
              } else {
                setShowPhotoOptions(true);
              }
            }}
          >
            <img
              src={profilePhoto}
              alt="Profile"
              className={styles.profilePhoto}
            />
            <button
              className={styles.plusButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowPhotoOptions(true);
              }}
              disabled={isSaving}
            >
              <Plus size={18} />
            </button>
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <div
                className={styles.inputGroup}
                style={{ flex: 1, marginRight: "10px" }}
              >
                <User className={styles.inputIcon} size={18} />
                <label className={styles.label}>First Name</label>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.input}
                    value={profileInfo.doctor_first_name}
                    onChange={(e) =>
                      handleInputChange("doctor_first_name", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <User className={styles.inputIcon} size={18} />
                <label className={styles.label}>Last Name</label>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.input}
                    value={profileInfo.doctor_last_name}
                    onChange={(e) =>
                      handleInputChange("doctor_last_name", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
            <div className={styles.qualificationRow}>
              <div
                className={styles.inputGroup}
                style={{ flex: 1, marginRight: "10px" }}
              >
                <GraduationCap className={styles.inputIcon} size={18} />
                <label className={styles.label}>Qualification</label>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.input}
                    value={profileInfo.qualification}
                    onChange={(e) =>
                      handleInputChange("qualification", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <User className={styles.inputIcon} size={18} />
                <label className={styles.label}>Specialization</label>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.input}
                    value={profileInfo.specialization}
                    onChange={(e) =>
                      handleInputChange("specialization", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.sectionHeader}>
          <User className={styles.sectionIcon} size={20} />
          <h3 className={styles.sectionTitle}>Personal Information</h3>
        </div>
        <div className={styles.card}>
          <div className={styles.inputGroup}>
            <Building2 className={styles.inputIcon} size={18} />
            <label className={styles.label}>Organization</label>
            <div
              className={[styles.inputWrapper, styles.disabledWrapper].join(" ")}
            >
              <input
                className={styles.input}
                value={profileInfo.organization_name}
                onChange={(e) =>
                  handleInputChange("organization_name", e.target.value)
                }
                disabled={true}
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <DollarSign className={styles.inputIcon} size={18} />
            <label className={styles.label}>Consultation Fee</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                value={String(profileInfo.consultation_fee)}
                onChange={(e) =>
                  handleInputChange("consultation_fee", Number(e.target.value))
                }
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <FileText className={styles.inputIcon} size={18} />
            <label className={styles.label}>Description</label>
            <div className={styles.inputWrapper}>
              <textarea
                className={[styles.input, styles.textarea].join(" ")}
                value={profileInfo.doctor_description}
                onChange={(e) =>
                  handleInputChange("doctor_description", e.target.value)
                }
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <Phone className={styles.inputIcon} size={18} />
            <label className={styles.label}>Phone Number</label>
            <div className={styles.phoneInputContainer}>
              <select
                className={styles.countrySelector}
                value={selectedCountry.callingCode}
                onChange={(e) => {
                  const country =
                    countries.find((c) => c.callingCode === e.target.value) ||
                    selectedCountry;
                  setSelectedCountry(country);
                  const fullPhoneNumber = `+${country.callingCode}${phoneWithoutCode}`;
                  handleInputChange("doctor_phone", fullPhoneNumber);
                }}
              >
                {countries.map((country) => (
                  <option key={country.callingCode} value={country.callingCode}>
                    {country.flag} +{country.callingCode}
                  </option>
                ))}
              </select>
              <input
                className={[
                  styles.inputWithBorder,
                  phoneError ? styles.inputError : "",
                ].join(" ")}
                value={phoneWithoutCode}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter phone number"
                maxLength={10}
              />
            </div>
            {phoneError && <p className={styles.errorText}>{phoneError}</p>}
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <Video className={styles.sectionIcon} size={20} />
          <h3 className={styles.sectionTitle}>YouTube Videos</h3>
        </div>
        <div className={styles.card}>
          <p className={styles.videosDescription}>
            Add YouTube videos to display on your profile. Patients will be able
            to view these videos to learn more about your expertise.
          </p>
          {profileInfo.youtube_videos.length === 0 ? (
            <div className={styles.noVideosContainer}>
              <Video className={styles.noVideosIcon} size={40} />
              <p className={styles.noVideosText}>No videos added yet</p>
            </div>
          ) : (
            <div className={styles.videoList}>
              {profileInfo.youtube_videos.map((item) => (
                <div key={item.id} className={styles.videoItem}>
                  <div className={styles.videoInfo}>
                    <Video className={styles.youtubeIcon} size={18} />
                    <div className={styles.videoTextContainer}>
                      <p className={styles.videoTitle}>{item.title}</p>
                      <p className={styles.videoUrl}>{item.url}</p>
                      {item.description && (
                        <p className={styles.videoDescription}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles.videoActions}>
                    <button
                      className={styles.videoEditButton}
                      onClick={() => handleEditVideo(item)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.videoDeleteButton}
                      onClick={() => handleDeleteVideo(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            className={styles.addVideoButton}
            onClick={() => {
              setNewVideoTitle("");
              setNewVideoUrl("");
              setEditingVideoId(null);
              setShowVideoModal(true);
            }}
            disabled={isSaving}
          >
            <Plus className={styles.addVideoIcon} size={20} />
            <span className={styles.addVideoButtonText}>Add YouTube Video</span>
          </button>
        </div>
      </div>
      <button
        className={[
          styles.saveButton,
          (isSaving || !hasChanges()) && styles.savingButton,
        ].join(" ")}
        onClick={handleSave}
        disabled={isSaving || !hasChanges()}
        style={{
          position: "absolute",
          right: "20px",
          width: "auto",
        }}
      >
        {isSaving ? (
          <Loader2 className={styles.spinner} size={20} />
        ) : (
          <Save size={18} />
        )}
        <span style={{ marginLeft: "10px" }}>Save Changes</span>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/jpeg,image/png"
        onChange={handleImageSelect}
      />
      {showPhotoOptions && renderPhotoOptionsModal()}
      {showCropModal && renderCropModal()}
      {showVideoModal && renderVideoModal()}
      {showPhotoViewer && renderPhotoViewerModal()}
    </div>
  );
};

const countries = [
  { name: "United States", code: "US", flag: "🇺🇸", callingCode: "1" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", callingCode: "44" },
  { name: "India", code: "IN", flag: "🇮🇳", callingCode: "91" },
  { name: "Canada", code: "CA", flag: "🇨🇦", callingCode: "1" },
  { name: "Australia", code: "AU", flag: "🇦🇺", callingCode: "61" },
  { name: "Germany", code: "DE", flag: "🇩🇪", callingCode: "49" },
  { name: "France", code: "FR", flag: "🇫🇷", callingCode: "33" },
  { name: "Italy", code: "IT", flag: "🇮🇹", callingCode: "39" },
  { name: "Spain", code: "ES", flag: "🇪🇸", callingCode: "34" },
  { name: "Japan", code: "JP", flag: "🇯🇵", callingCode: "81" },
  { name: "China", code: "CN", flag: "🇨🇳", callingCode: "86" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", callingCode: "55" },
  { name: "Russia", code: "RU", flag: "🇷🇺", callingCode: "7" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", callingCode: "27" },
  { name: "UAE", code: "AE", flag: "🇦🇪", callingCode: "971" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", callingCode: "65" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", callingCode: "64" },
  { name: "Ireland", code: "IE", flag: "🇮🇪", callingCode: "353" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", callingCode: "31" },
  { name: "Sweden", code: "SE", flag: "🇸🇪", callingCode: "46" },
];

export default DoctorProfileEdit;