import React, { useState, useRef, useEffect } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import styles from "../css/registerPatient.module.css";
import api from "../utils/central";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../components/HospitalLocation";

// Define Country interface
interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
}

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
}

// Sample country list
const countries: Country[] = [
  { name: "India", code: "IN", flag: "IN", callingCode: "91" },
  { name: "United States", code: "US", flag: "US", callingCode: "1" },
  { name: "United Kingdom", code: "GB", flag: "GB", callingCode: "44" },
  { name: "Australia", code: "AU", flag: "AU", callingCode: "61" },
];

interface PatientData {
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  referral_source: string;
  referral_details: string;
  patient_registration_date: string; // ← ADD THIS
}

// Helper: Image Cropping
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const RegisterPatient: React.FC = () => {
  const [formData, setFormData] = useState<PatientData>({
    patient_first_name: "",
    patient_last_name: "",
    patient_email: "",
    patient_phone: "",
    referral_source: "",
    referral_details: "",
    patient_registration_date: new Date().toISOString().split("T")[0],
  });

  // Image States
  const [patientImage, setPatientImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Crop States
  const [imgSrc, setImgSrc] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Webcam States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Location State
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<
    Partial<PatientData & { general: string; location: string }>
  >({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "patient_phone") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
    } else if (name === "referral_source" && value === "Self") {
      setFormData((prev) => ({
        ...prev,
        referral_source: value,
        referral_details: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof PatientData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    if (errors.location) setErrors((prev) => ({ ...prev, location: "" }));
  };

  // --- Image Upload Logic ---
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- Webcam Logic ---
  const startWebcam = async (mode: "user" | "environment" = "user") => {
    setFacingMode(mode);
    setIsWebcamOpen(true);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam", err);
      alert(
        "Could not access the camera. Please check your browser permissions.",
      );
      setIsWebcamOpen(false);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    startWebcam(newMode);
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsWebcamOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");

        setImgSrc(dataUrl);
        stopWebcam();
        setIsCropModalOpen(true);
      }
    }
  };

  useEffect(() => {
    return () => stopWebcam();
  }, []);

  // --- Crop Logic ---
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  const generateCroppedImage = async () => {
    if (
      !imgRef.current ||
      !completedCrop ||
      completedCrop.width <= 0 ||
      completedCrop.height <= 0
    ) {
      alert("Please drag to select a crop area first.");
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      400,
      400,
    );

    canvas.toBlob((blob) => {
      if (!blob) return;

      const fileName = `patient_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(file);

      setPatientImage(file);
      setImagePreview(previewUrl);

      setIsCropModalOpen(false);
      setImgSrc("");
    }, "image/jpeg");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientData & { location: string }> = {};

    if (!formData.patient_first_name.trim())
      newErrors.patient_first_name = "First name is required";
    if (!formData.patient_last_name.trim())
      newErrors.patient_last_name = "Last name is required";

    if (
      formData.patient_email.trim() &&
      !/\S+@\S+\.\S+/.test(formData.patient_email)
    ) {
      newErrors.patient_email = "Please enter a valid email address";
    }

    if (!formData.patient_phone.trim()) {
      newErrors.patient_phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.patient_phone)) {
      newErrors.patient_phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.referral_source.trim()) {
      newErrors.referral_source = "Referral source is required";
    }

    const referralSource = formData.referral_source.trim();
    const referralDetailsValue = formData.referral_details.trim();
    if (
      referralDetailsValue &&
      referralSource !== "Social Media" &&
      referralDetailsValue.length < 5
    ) {
      newErrors.referral_details =
        "Referral details must be at least 5 characters long";
    }

    if (!selectedLocation) {
      newErrors.location = "Facility location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append(
        "patient_first_name",
        formData.patient_first_name.trim(),
      );
      formDataToSend.append(
        "patient_last_name",
        formData.patient_last_name.trim(),
      );
      formDataToSend.append(
        "patient_email",
        formData.patient_email.trim().toLowerCase(),
      );
      formDataToSend.append(
        "patient_phone",
        `+${selectedCountry.callingCode}${formData.patient_phone}`,
      );
      formDataToSend.append("referral_source", formData.referral_source.trim());
      formDataToSend.append(
        "patient_registration_date",
        new Date(formData.patient_registration_date).toISOString(),
      );

      const referralDetails = formData.referral_details.trim();
      if (referralDetails) {
        formDataToSend.append("referral_details", referralDetails);
      }

      if (selectedLocation) {
        formDataToSend.append("location_name", selectedLocation.name);
        formDataToSend.append("location_id", selectedLocation._id);
      }

      if (patientImage) {
        formDataToSend.append("patient_image", patientImage);
      }

      const response = await api.post("/patient/registration", formDataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("idToken")}`,
        },
      });

      setSubmitStatus("success");

      setFormData({
        patient_first_name: "",
        patient_last_name: "",
        patient_email: "",
        patient_phone: "",
        referral_source: "",
        referral_details: "",
        patient_registration_date: new Date().toISOString().split("T")[0],
      });
      setPatientImage(null);
      setImagePreview(null);
      setSelectedLocation(null);
      setSelectedCountry(countries[0]);

      const patientId = response.data.patient._id;
      alert("Patient registered successfully!");
      navigate(`/updatePatient/${patientId}`);
    } catch (error: any) {
      console.error("Registration failed:", error);
      setSubmitStatus("error");

      let errorMessage = "Registration failed. Please try again.";
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error?.includes("patient_phone")) {
          errorMessage =
            "Invalid phone number. Please ensure the number is valid for the selected country.";
          setErrors((prev) => ({ ...prev, patient_phone: errorMessage }));
        } else if (errorData.error?.includes("duplicate")) {
          errorMessage =
            "A patient with this email or phone number already exists.";
        } else {
          errorMessage = errorData.error || errorData.msg || errorMessage;
        }
      } else if (error.request) {
        errorMessage =
          "No response received from server. Please check your network connection.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const referralSources = [
    "Social Media",
    "Ex Client",
    "Self",
    "Family",
    "Awareness Program",
  ];
  const socialMediaPlatforms = [
    "Instagram",
    "Facebook",
    "WhatsApp",
    "YouTube",
    "Google",
  ];

  return (
    <div className={styles.container}>
      {/* WEBCAM MODAL */}
      {isWebcamOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Take a Photo</h3>
              <button
                type="button"
                onClick={toggleCamera}
                className={styles.flipBtn}
              >
                Flip Camera 🔄
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={styles.videoPreview}
              style={{
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
            <div className={styles.cropControls}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={stopWebcam}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={capturePhoto}
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CROP MODAL */}
      {isCropModalOpen && imgSrc && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Crop Photo</h3>
            <div className={styles.cropContainer}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={true}
                style={{ maxWidth: "100%", maxHeight: "50vh" }}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className={styles.cropImage}
                />
              </ReactCrop>
            </div>
            <div className={styles.cropControls}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImgSrc("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={generateCroppedImage}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageWrapper}>
        {/* Top Header Section */}
        <div className={styles.topHeader}>
          <div className={styles.headerTitles}>
            <h1 className={styles.title}>New Patient Registration</h1>
          </div>
        </div>

        {submitStatus === "success" && (
          <div className={styles.successMessage}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            <span>Registration successful! We'll contact you soon.</span>
          </div>
        )}

        {submitStatus === "error" && (
          <div className={styles.errorMessage}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>
              {errors.general ||
                "Registration failed. Please check the debug info below."}
            </span>
          </div>
        )}

        {/* 2-Column Main Content Layout */}
        <div className={styles.mainContentGrid}>
          {/* LEFT COLUMN: Photo Upload Card */}
          <div className={styles.leftColumn}>
            <div className={styles.panelCard}>
              <h3 className={styles.panelCardHeader}>IDENTIFICATION PHOTO</h3>
              <div className={styles.photoUploadContainer}>
                <div className={styles.dashedPhotoBox}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Patient"
                      className={styles.previewImage}
                    />
                  ) : (
                    <div className={styles.emptyPhotoState}>
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <line x1="12" y1="9" x2="12" y2="15" />
                        <line x1="9" y1="12" x2="15" y2="12" />
                      </svg>
                      <span>UPLOAD PORTRAIT</span>
                    </div>
                  )}
                </div>

                <div className={styles.photoActionButtons}>
                  <label className={styles.uploadBtnLabel}>
                    Select File
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                      onChange={onSelectFile}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.uploadBtnLabel}
                    onClick={() => startWebcam()}
                  >
                    Capture Live
                  </button>
                </div>

                <p className={styles.photoHelperText}>
                  Ensure the face is clear and centered.
                  <br />
                  Supports JPG, PNG up to 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Patient Information Form */}
          <div className={styles.rightColumn}>
            <form
              id="register-form"
              onSubmit={handleSubmit}
              className={styles.panelCard}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.verticalAccent}></div>
                <h2>Patient Information</h2>
              </div>

              <div className={styles.formGrid}>
                {/* First Name */}
                <div className={styles.formGroup}>
                  <label htmlFor="patient_first_name" className={styles.label}>
                    First Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="patient_first_name"
                    name="patient_first_name"
                    value={formData.patient_first_name}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.patient_first_name ? styles.inputError : ""}`}
                    placeholder="Enter first name"
                  />
                  {errors.patient_first_name && (
                    <span className={styles.errorText}>
                      {errors.patient_first_name}
                    </span>
                  )}
                </div>

                {/* Last Name */}
                <div className={styles.formGroup}>
                  <label htmlFor="patient_last_name" className={styles.label}>
                    Last Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="patient_last_name"
                    name="patient_last_name"
                    value={formData.patient_last_name}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.patient_last_name ? styles.inputError : ""}`}
                    placeholder="Enter last name"
                  />
                  {errors.patient_last_name && (
                    <span className={styles.errorText}>
                      {errors.patient_last_name}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className={styles.formGroup}>
                  <label htmlFor="patient_email" className={styles.label}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="patient_email"
                    name="patient_email"
                    value={formData.patient_email}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.patient_email ? styles.inputError : ""}`}
                    placeholder="Enter email address"
                  />
                  {errors.patient_email && (
                    <span className={styles.errorText}>
                      {errors.patient_email}
                    </span>
                  )}
                </div>

                {/* Phone Number */}
                <div className={styles.formGroup}>
                  <label htmlFor="patient_phone" className={styles.label}>
                    Phone Number <span style={{ color: "red" }}>*</span>
                  </label>
                  <div className={styles.phoneInputContainer}>
                    <select
                      value={selectedCountry.code}
                      onChange={handleCountryChange}
                      className={`${styles.countrySelect} ${errors.patient_phone ? styles.inputError : ""}`}
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} +{country.callingCode}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="patient_phone"
                      name="patient_phone"
                      value={formData.patient_phone}
                      onChange={handleInputChange}
                      className={`${styles.input} ${errors.patient_phone ? styles.inputError : ""}`}
                      placeholder="Enter phone number"
                      maxLength={10}
                    />
                  </div>
                  {errors.patient_phone && (
                    <span className={styles.errorText}>
                      {errors.patient_phone}
                    </span>
                  )}
                </div>

                {/* Facility Location */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    Facility Location <span style={{ color: "red" }}>*</span>
                  </label>
                  <LocationPicker
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    disabled={false}
                    showSetAsDefault={true}
                    autoSelectPreferred={true}
                  />
                  {errors.location && (
                    <span className={styles.errorText}>{errors.location}</span>
                  )}
                </div>
                {/* Registration Date */}
                <div className={styles.formGroup}>
                  <label
                    htmlFor="patient_registration_date"
                    className={styles.label}
                  >
                    Registration Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="patient_registration_date"
                    name="patient_registration_date"
                    value={formData.patient_registration_date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>
                {/* Referral Source */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="referral_source" className={styles.label}>
                    Referral Source <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    id="referral_source"
                    name="referral_source"
                    value={formData.referral_source}
                    onChange={handleInputChange}
                    className={`${styles.select} ${errors.referral_source ? styles.inputError : ""}`}
                  >
                    <option value="">Select an option</option>
                    {referralSources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                  {errors.referral_source && (
                    <span className={styles.errorText}>
                      {errors.referral_source}
                    </span>
                  )}
                </div>

                {/* Referral Details (Conditional) */}
                {formData.referral_source &&
                  formData.referral_source !== "Self" && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label
                        htmlFor="referral_details"
                        className={styles.label}
                      >
                        {formData.referral_source === "Social Media"
                          ? "Social Media Platform"
                          : "Referral Details"}
                      </label>
                      {formData.referral_source === "Social Media" ? (
                        <select
                          id="referral_details"
                          name="referral_details"
                          value={formData.referral_details}
                          onChange={handleInputChange}
                          className={`${styles.select} ${errors.referral_details ? styles.inputError : ""}`}
                        >
                          <option value="">Select a platform</option>
                          {socialMediaPlatforms.map((platform) => (
                            <option key={platform} value={platform}>
                              {platform}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <textarea
                          id="referral_details"
                          name="referral_details"
                          value={formData.referral_details}
                          onChange={handleInputChange}
                          className={`${styles.textarea} ${errors.referral_details ? styles.inputError : ""}`}
                          placeholder={`Please provide details about your ${formData.referral_source.toLowerCase()} (optional, minimum 5 characters if provided)`}
                          rows={3}
                        />
                      )}
                      {errors.referral_details && (
                        <span className={styles.errorText}>
                          {errors.referral_details}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </form>

            {/* Form Actions - Moved completely OUTSIDE the panel card */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.btnCancelSmall}
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="register-form"
                disabled={isSubmitting}
                className={`${styles.submitButtonSmall} ${isSubmitting ? styles.submitButtonDisabled : ""}`}
              >
                {isSubmitting ? (
                  <svg
                    className={styles.spinner}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 11-6.22-8.56" />
                  </svg>
                ) : (
                  <>Register Patient</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatient;
