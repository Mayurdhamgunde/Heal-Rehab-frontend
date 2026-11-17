import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/DoctorRegister.module.css";
import DepartmentDropdown from "../components/Rehab/departmentDropdown";

const showSuccessToast = (message: string): void => {
  alert(message);
};

interface DoctorData {
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_phone: string;
  qualification: string;
  department_id: string;
  doctor_password: string;
  is_admin: boolean;
}

interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
}

const countries: Country[] = [
  { name: "India", code: "IN", flag: "IN", callingCode: "91" },
  { name: "United States", code: "US", flag: "US", callingCode: "1" },
  { name: "United Kingdom", code: "GB", flag: "GB", callingCode: "44" },
  { name: "Australia", code: "AU", flag: "AU", callingCode: "61" },
];

const DoctorRegister: React.FC = () => {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState<DoctorData>({
    doctor_first_name: "",
    doctor_last_name: "",
    doctor_email: "",
    doctor_phone: "",
    qualification: "",
    department_id: "",
    is_admin: false,
    doctor_password: "",
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Password Visibility State
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<
    Partial<DoctorData & { general: string }>
  >({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "doctor_phone") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "doctor_email") {
      newValue = value.toLowerCase();
    } else if (name.includes("name")) {
      newValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setDoctorData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name as keyof DoctorData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDepartmentChange = (value: string) => {
    setDoctorData((prev) => ({ ...prev, department_id: value }));
    if (errors.department_id) {
      setErrors((prev) => ({ ...prev, department_id: "" }));
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DoctorData> = {};

    if (!doctorData.doctor_first_name.trim())
      newErrors.doctor_first_name = "First name is required";
    if (!doctorData.doctor_last_name.trim())
      newErrors.doctor_last_name = "Last name is required";

    if (!doctorData.doctor_email.trim()) {
      newErrors.doctor_email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(doctorData.doctor_email)) {
      newErrors.doctor_email = "Please enter a valid email address";
    }

    if (!doctorData.doctor_phone.trim()) {
      newErrors.doctor_phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(doctorData.doctor_phone)) {
      newErrors.doctor_phone = "Please enter a valid 10-digit phone number";
    }

    if (!doctorData.qualification.trim())
      newErrors.qualification = "Qualification is required";
    if (!doctorData.doctor_password.trim()) {
      newErrors.doctor_password = "Password is required";
    } else if (doctorData.doctor_password.length < 6) {
      newErrors.doctor_password = "Password must be at least 6 characters";
    }

    if (!doctorData.department_id)
      newErrors.department_id = "Department selection is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const payload = {
        doctor_first_name: doctorData.doctor_first_name.trim(),
        doctor_last_name: doctorData.doctor_last_name.trim(),
        doctor_email: doctorData.doctor_email.trim().toLowerCase(),
        doctor_phone: `+${selectedCountry.callingCode}${doctorData.doctor_phone}`,
        qualification: doctorData.qualification.trim(),
        doctor_password: doctorData.doctor_password,
        department_id: doctorData.department_id,
        is_admin: doctorData.is_admin,
      };
      await api.post("/doctor/create", payload);

      setSubmitStatus("success");

      setDoctorData({
        doctor_first_name: "",
        doctor_last_name: "",
        doctor_email: "",
        doctor_phone: "",
        qualification: "",
        department_id: "",
        doctor_password: "",
        is_admin: false,
      });
      setSelectedCountry(countries[0]);
      showSuccessToast("Doctor registered successfully");
      navigate("/AllDoctors");
    } catch (error: any) {
      console.error("Registration failed:", error);
      setSubmitStatus("error");

      let errorMessage = "Registration failed. Please try again.";
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error?.includes("doctor_phone")) {
          errorMessage =
            "Invalid phone number. Please ensure the number is valid for the selected country.";
          setErrors((prev) => ({ ...prev, doctor_phone: errorMessage }));
        } else if (
          errorData.error?.includes("duplicate") ||
          errorData.msg?.includes("already exists")
        ) {
          errorMessage =
            "A doctor with this email or phone number already exists.";
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

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 7h-3V6a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
          </div>
          <h1 className={styles.title}>Doctor Registration</h1>
          <p className={styles.subtitle}>
            Please fill out the form below to register as a new doctor
          </p>
        </div>
        {/* Status Messages */}
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* First Name */}
            <div className={styles.formGroup}>
              <label htmlFor="doctor_first_name" className={styles.label}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                First Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                id="doctor_first_name"
                name="doctor_first_name"
                value={doctorData.doctor_first_name}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.doctor_first_name ? styles.inputError : ""}`}
                placeholder="Enter first name"
              />
              {errors.doctor_first_name && (
                <span className={styles.errorText}>
                  {errors.doctor_first_name}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className={styles.formGroup}>
              <label htmlFor="doctor_last_name" className={styles.label}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                Last Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                id="doctor_last_name"
                name="doctor_last_name"
                value={doctorData.doctor_last_name}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.doctor_last_name ? styles.inputError : ""}`}
                placeholder="Enter last name"
              />
              {errors.doctor_last_name && (
                <span className={styles.errorText}>
                  {errors.doctor_last_name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="doctor_email" className={styles.label}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email Address <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="email"
                id="doctor_email"
                name="doctor_email"
                value={doctorData.doctor_email}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.doctor_email ? styles.inputError : ""}`}
                placeholder="Enter email address"
              />
              {errors.doctor_email && (
                <span className={styles.errorText}>{errors.doctor_email}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className={styles.formGroup}>
              <label htmlFor="doctor_phone" className={styles.label}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Phone Number <span style={{ color: "red" }}>*</span>
              </label>
              <div className={styles.phoneInputContainer}>
                <select
                  value={selectedCountry.code}
                  onChange={handleCountryChange}
                  className={`${styles.countrySelect} ${errors.doctor_phone ? styles.inputError : ""}`}
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} +{country.callingCode}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="doctor_phone"
                  name="doctor_phone"
                  value={doctorData.doctor_phone}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.doctor_phone ? styles.inputError : ""}`}
                  placeholder="Enter phone number"
                  maxLength={10}
                />
              </div>
              {errors.doctor_phone && (
                <span className={styles.errorText}>{errors.doctor_phone}</span>
              )}
            </div>

            {/* Qualification */}
            <div className={styles.formGroup}>
              <label htmlFor="qualification" className={styles.label}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Qualification <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                id="qualification"
                name="qualification"
                value={doctorData.qualification}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.qualification ? styles.inputError : ""}`}
                placeholder="Enter qualification"
              />
              {errors.qualification && (
                <span className={styles.errorText}>{errors.qualification}</span>
              )}
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label htmlFor="doctor_password" className={styles.label}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Password <span style={{ color: "red" }}>*</span>
              </label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="doctor_password"
                  name="doctor_password"
                  value={doctorData.doctor_password}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.doctor_password ? styles.inputError : ""}`}
                  placeholder="Enter temporary password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.doctor_password && (
                <span className={styles.errorText}>
                  {errors.doctor_password}
                </span>
              )}
            </div>

            {/* Department Dropdown */}
            <DepartmentDropdown
              value={doctorData.department_id}
              onChange={handleDepartmentChange}
              error={errors.department_id}
            />
          </div>

          {/* Submit Button */}
          <div className={styles.submitSection}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ""}`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className={styles.spinner}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 11-6.22-8.56" />
                  </svg>
                  Registering...
                </>
              ) : (
                "Register Doctor"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorRegister;
