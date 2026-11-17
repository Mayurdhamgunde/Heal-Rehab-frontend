import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import api from "../utils/central";
import styles from "../css/DoctorRegistration.module.css";

// ===================== TYPES =====================
interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
}

const countries: Country[] = [
  { name: "India", code: "IN", flag: "🇮🇳", callingCode: "91" },
  { name: "United States", code: "US", flag: "🇺🇸", callingCode: "1" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", callingCode: "44" },
  { name: "Australia", code: "AU", flag: "🇦🇺", callingCode: "61" },
];

const medicalDegrees = [
  "MBBS",
  "BDS",
  "BAMS",
  "BHMS",
  "BUMS",
  "BYNS",
  "B.V.Sc & AH",
  "MD",
  "MS",
  "DNB",
  "MDS",
  "DM",
  "MCh",
  "Diploma",
  "Ph.D",
  "BPT",
  "MPT",
];

const medicalSpecialities = [
  "General Physician",
  "Pediatrics",
  "Gynecology & Obstetrics",
  "Orthopedics",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "Psychiatry",
  "General Surgery",
  "Anesthesiology",
  "Pathology",
  "Radiology",
  "Cardiology",
  "Neurology",
  "Gastroenterology",
  "Pulmonology",
  "Nephrology",
  "Urology",
  "Oncology",
  "Endocrinology",
  "Rheumatology",
  "Physiotherapy",
  "Ayurveda",
  "Homeopathy",
  "Dentistry",
];

const medicalSuperSpecialities = [
  "Cardiology",
  "Neurology",
  "Nephrology",
  "Gastroenterology",
  "Urology",
  "Medical Oncology",
  "Surgical Oncology",
  "Radiation Oncology",
  "Endocrinology",
  "Rheumatology",
  "Hematology",
  "Neonatology",
  "Plastic Surgery",
  "Neurosurgery",
  "Cardiothoracic Surgery",
  "Pediatric Surgery",
  "Critical Care Medicine",
  "Interventional Cardiology",
  "Immunology",
  "Infectious Diseases",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

interface Education {
  degree: string;
  speciality: string;
  super_speciality?: string;
  pass_out_year?: string | number; // Updated to allow custom text input
  university?: string;
  location?: string;
}

interface Experience {
  years_of_experience: number | "";
  clinic_hospital_name: string;
  designation: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
}

interface Reference {
  ref_name: string;
  ref_email: string;
  ref_contact_no: string;
  ref_country_code: string;
  ref_profession: string;
}

interface FormData {
  prefix: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  mobile_number: string;
  alternate_mobile_number: string;
  email: string;
  date_of_birth: string;
  gender: string;

  address_line_1: string;
  address_line_2: string;
  current_location_pincode: string;
  city_district: string;
  state: string;

  open_for_consultation: boolean;
  open_for_duty_doctorship: boolean;
  open_for_shift: boolean;
  shift_preference: string;

  available_days: string[];
  doctor_license_no: string;
  current_clinic_hospital_name: string;
  education: Education[];

  is_fresher: boolean;
  experience: Experience[];
  references: Reference[];
  profile_pic: File | null;
  resume: File | null;
}

// Define initial state outside component for easy reset
const initialFormData: FormData = {
  prefix: "Dr.",
  first_name: "",
  middle_name: "",
  last_name: "",
  mobile_number: "",
  alternate_mobile_number: "",
  email: "",
  date_of_birth: "",
  gender: "",

  address_line_1: "",
  address_line_2: "",
  current_location_pincode: "",
  city_district: "",
  state: "",

  open_for_consultation: false,
  open_for_duty_doctorship: false,
  open_for_shift: false,
  shift_preference: "",

  available_days: [],
  doctor_license_no: "",
  current_clinic_hospital_name: "",
  education: [
    {
      degree: "",
      speciality: "",
      super_speciality: "",
      university: "",
      location: "",
    },
  ],
  is_fresher: false,
  experience: [
    {
      years_of_experience: "",
      clinic_hospital_name: "",
      designation: "",
      start_date: "",
      is_current: false,
    },
  ],
  references: [
    {
      ref_name: "",
      ref_email: "",
      ref_contact_no: "",
      ref_country_code: "IN",
      ref_profession: "",
    },
  ],
  profile_pic: null,
  resume: null,
};

// ===================== DOCTOR REGISTRATION COMPONENT =====================
const DoctorRegistration: React.FC<{ onComplete?: () => void }> = ({
  onComplete,
}) => {
  const navigate = useNavigate(); // Hook for navigation
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [selectedAltCountry, setSelectedAltCountry] = useState<Country>(
    countries[0],
  );

  const educationRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- ADD THIS NEW REF ---
  const topRef = useRef<HTMLDivElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  // Initialize with the constant created above
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null,
  );
  const [isRegistered, setIsRegistered] = useState(false);

  // Validation and Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const totalSteps = 7;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const today = new Date();
  const maxDateForDob = new Date(
    today.getFullYear() - 21,
    today.getMonth(),
    today.getDate(),
  )
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    if (formData.education.length > 0) {
      const firstElement = educationRefs.current[0];
      if (firstElement) {
        firstElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [formData.education.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [currentStep]);
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.first_name.trim())
          newErrors.first_name = "First name is required";
        if (!formData.last_name.trim())
          newErrors.last_name = "Last name is required";

        if (!formData.mobile_number.trim()) {
          newErrors.mobile_number = "Mobile number is required";
        } else if (!/^\d{10}$/.test(formData.mobile_number)) {
          newErrors.mobile_number =
            "Please enter a valid 10-digit mobile number";
        }

        if (
          formData.alternate_mobile_number &&
          !/^\d{10}$/.test(formData.alternate_mobile_number)
        ) {
          newErrors.alternate_mobile_number =
            "Please enter a valid 10-digit alternate number";
        }

        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }

        if (!formData.date_of_birth.trim()) {
          newErrors.date_of_birth = "Date of Birth is required";
        } else {
          const dob = new Date(formData.date_of_birth);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          if (age < 21) {
            newErrors.date_of_birth =
              "You must be at least 21 years old to register";
          }
        }

        if (!formData.gender) {
          newErrors.gender = "Gender is required";
        }

        if (!formData.doctor_license_no.trim()) {
          newErrors.doctor_license_no = "Doctor license number is required";
        }
        break;

      case 2:
        if (!formData.address_line_1.trim())
          newErrors.address_line_1 = "Address Line 1 is required";
        if (!formData.current_location_pincode.trim()) {
          newErrors.current_location_pincode = "Pincode is required";
        } else if (!/^\d{6}$/.test(formData.current_location_pincode)) {
          newErrors.current_location_pincode =
            "Please enter a valid 6-digit pincode";
        }
        if (!formData.city_district.trim())
          newErrors.city_district = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        break;

      case 3:
        // 1. Require at least one Work Preference
        if (
          !formData.open_for_consultation &&
          !formData.open_for_duty_doctorship &&
          !formData.open_for_shift
        ) {
          newErrors.work_preference =
            "Please select at least one work preference type";
        }

        // 2. If 'Open for Shift' is checked, Shift Preference is required
        if (formData.open_for_shift && !formData.shift_preference) {
          newErrors.shift_preference = "Please select a shift preference";
        }

        // 3. Available Days are required
        if (formData.available_days.length === 0) {
          newErrors.available_days = "Please select at least one available day";
        }

        // 4. Current Clinic Name is required
        if (!formData.current_clinic_hospital_name.trim()) {
          newErrors.current_clinic_hospital_name =
            "Current Clinic/Hospital name is required";
        }
        break;

      case 4:
        formData.education.forEach((edu, index) => {
          if (!edu.degree.trim())
            newErrors[`education_${index}_degree`] = `Degree is required`;
          if (!edu.speciality.trim())
            newErrors[`education_${index}_speciality`] =
              `Speciality is required`;
        });
        break;

      case 5:
        if (!formData.is_fresher) {
          formData.experience.forEach((exp, index) => {
            if (!exp.years_of_experience || exp.years_of_experience <= 0) {
              newErrors[`experience_${index}_years`] =
                `Experience years required`;
            }
            if (!exp.clinic_hospital_name?.trim()) {
              newErrors[`experience_${index}_clinic`] =
                `Hospital Name required`;
            }
            if (!exp.designation?.trim()) {
              newErrors[`experience_${index}_designation`] =
                `Designation required`;
            }
          });
        }
        break;

      case 6:
        formData.references.forEach((ref, index) => {
          if (
            ref.ref_email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ref.ref_email)
          ) {
            newErrors[`reference_${index}_email`] = `Invalid email`;
          }
          if (
            ref.ref_contact_no.trim() &&
            !/^\d{10}$/.test(ref.ref_contact_no)
          ) {
            newErrors[`reference_${index}_contact`] = `Invalid contact number`;
          }
        });
        break;

      case 7:
        if (!formData.profile_pic) {
          newErrors.profile_pic = "Profile picture is required";
        }
        if (!formData.resume) {
          newErrors.resume = "Resume document is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const lookupPincode = async (pincode: string) => {
    setIsFetchingPincode(true);
    // Clear previous pincode errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.current_location_pincode;
      return newErrors;
    });

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success") {
        const details = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          city_district: details.District,
          state: details.State,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          current_location_pincode: "Invalid Pincode. Please check again.",
        }));
        setFormData((prev) => ({ ...prev, city_district: "", state: "" }));
      }
    } catch (error) {
      console.error("Error fetching pincode:", error);
      setErrors((prev) => ({
        ...prev,
        current_location_pincode: "Network error fetching location details.",
      }));
    } finally {
      setIsFetchingPincode(false);
    }
  };
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) setSelectedCountry(country);
  };

  const handleAltCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) setSelectedAltCountry(country);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (serverError) setServerError(null);

    // --- NEW PINCODE LOGIC ---
    if (name === "current_location_pincode") {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);

      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
        // If pincode is changed/deleted, clear city/state to force re-validation
        ...(cleaned.length !== 6 ? { city_district: "", state: "" } : {}),
      }));

      if (cleaned.length === 6) {
        lookupPincode(cleaned);
      }
      return;
    }
    // -------------------------

    if (name === "mobile_number" || name === "alternate_mobile_number") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
  };

  const handleSelectAllDays = () => {
    if (formData.available_days.length === days.length) {
      // If all are selected, clear them
      setFormData((prev) => ({ ...prev, available_days: [] }));
    } else {
      // Otherwise, select all
      setFormData((prev) => ({ ...prev, available_days: [...days] }));
    }
  };

  const handleEducationChange = (
    index: number,
    field: keyof Education,
    value: string | number,
  ) => {
    const errorKey = `education_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e[errorKey];
        return e;
      });
    }
    const newEducation = [...formData.education];
    // @ts-ignore
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData((prev) => ({ ...prev, education: newEducation }));
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        { degree: "", speciality: "", university: "", location: "" },
        ...prev.education,
      ],
    }));
  };

  const removeEducation = (index: number) => {
    if (formData.education.length > 1) {
      setFormData((prev) => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      }));
    }
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string | number | boolean,
  ) => {
    const newExperience = [...formData.experience];
    // @ts-ignore
    newExperience[index] = { ...newExperience[index], [field]: value };
    setFormData((prev) => ({ ...prev, experience: newExperience }));
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          years_of_experience: "",
          clinic_hospital_name: "",
          designation: "",
          is_current: false,
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    // Check if there is more than one entry to allow deletion
    if (formData.experience.length > 1) {
      const exp = formData.experience[index];

      // Check if the user has entered any data in the main fields
      // We consider it "empty" if years is 0/empty, and name/designation are empty strings
      const hasData =
        (exp.years_of_experience !== "" && exp.years_of_experience !== 0) ||
        exp.clinic_hospital_name.trim() !== "" ||
        exp.designation.trim() !== "";

      if (hasData) {
        // 1. If fields have data, ask for Confirmation
        const isConfirmed = window.confirm(
          "Are you sure you want to delete this experience detail?",
        );
        if (isConfirmed) {
          setFormData((prev) => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index),
          }));
        }
      } else {
        // 2. If fields are empty, Delete Immediately (No confirmation)
        setFormData((prev) => ({
          ...prev,
          experience: prev.experience.filter((_, i) => i !== index),
        }));
      }
    }
  };
  const handleReferenceChange = (
    index: number,
    field: keyof Reference,
    value: string,
  ) => {
    const newReferences = [...formData.references];
    if (field === "ref_contact_no")
      value = value.replace(/\D/g, "").slice(0, 10);
    newReferences[index] = { ...newReferences[index], [field]: value };
    setFormData((prev) => ({ ...prev, references: newReferences }));
  };

  const removeReference = (index: number) => {
    if (formData.references.length > 1) {
      setFormData((prev) => ({
        ...prev,
        references: prev.references.filter((_, i) => i !== index),
      }));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profile_pic" | "resume",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, [field]: file }));

      if (errors[field]) {
        setErrors((prev) => {
          const e = { ...prev };
          delete e[field];
          return e;
        });
      }

      if (field === "profile_pic") {
        const reader = new FileReader();
        reader.onloadend = () => setProfilePicPreview(reader.result as string);
        reader.readAsDataURL(file);
        if (isRegistered && profileId) updateProfilePhoto(file);
      } else if (field === "resume") {
        if (isRegistered && profileId) updateResume(file);
      }
    }
  };

  const removeFile = (field: "profile_pic" | "resume") => {
    // 1. If user is already registered, delete from Server using existing functions
    if (isRegistered && profileId) {
      if (field === "profile_pic") {
        deleteProfilePhoto(); // Now this function is used
      } else {
        deleteResume(); // Now this function is used
      }
      return; // The API functions will handle state clearing on success
    }

    // 2. If not registered yet, just clear Local State
    setFormData((prev) => ({ ...prev, [field]: null }));

    if (field === "profile_pic") {
      setProfilePicPreview(null);
      // Reset the file input value so onChange triggers even if same file selected
      if (profilePicInputRef.current) profilePicInputRef.current.value = "";
    }

    if (field === "resume") {
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  // ===================== API CALLS =====================
  const updateProfilePhoto = async (file: File) => {
    if (!profileId) return;
    try {
      const fd = new FormData();
      fd.append("profile_pic", file);
      const response = await api.put(`/medipro/update-photo/${profileId}`, fd);
      if (response.status === 200) setProfilePicPreview(response.data.imageUrl);
    } catch (error: any) {
      console.error("Error updating photo:", error);
    }
  };

  const deleteProfilePhoto = async () => {
    if (!profileId || !window.confirm("Delete profile photo?")) return;
    try {
      const response = await api.delete(`/medipro/delete-photo/${profileId}`);
      if (response.status === 200) {
        setProfilePicPreview(null);
        setFormData((prev) => ({ ...prev, profile_pic: null }));
      }
    } catch (error: any) {
      console.error("Error deleting photo:", error);
    }
  };

  const updateResume = async (file: File) => {
    if (!profileId) return;
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const response = await api.put(`/medipro/update-resume/${profileId}`, fd);
      if (response.status === 200)
        setFormData((prev) => ({ ...prev, resume: null }));
    } catch (error: any) {
      console.error("Error updating resume:", error);
    }
  };

  const deleteResume = async () => {
    if (!profileId || !window.confirm("Delete resume?")) return;
    try {
      const response = await api.delete(`/medipro/delete-resume/${profileId}`);
      if (response.status === 200)
        setFormData((prev) => ({ ...prev, resume: null }));
    } catch (error: any) {
      console.error("Error deleting resume:", error);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setServerError(null);
    let isValid = true;

    for (let step = 1; step <= 7; step++) {
      if (!validateStep(step)) {
        isValid = false;
        if (step !== currentStep) {
          setCurrentStep(step);
        }
        break;
      }
    }

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("prefix", formData.prefix);
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("middle_name", formData.middle_name || "");
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append(
        "mobile_number",
        `+${selectedCountry.callingCode}${formData.mobile_number}`,
      );
      formDataToSend.append(
        "alternate_mobile_number",
        formData.alternate_mobile_number
          ? `+${selectedAltCountry.callingCode}${formData.alternate_mobile_number}`
          : "",
      );
      formDataToSend.append("email", formData.email);
      formDataToSend.append("date_of_birth", formData.date_of_birth);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("doctor_license_no", formData.doctor_license_no);

      formDataToSend.append("address_line_1", formData.address_line_1);
      formDataToSend.append("address_line_2", formData.address_line_2);
      formDataToSend.append(
        "current_location_pincode",
        formData.current_location_pincode,
      );
      formDataToSend.append("city_district", formData.city_district);
      formDataToSend.append("state", formData.state);

      formDataToSend.append(
        "current_clinic_hospital_name",
        formData.current_clinic_hospital_name || "",
      );
      formDataToSend.append(
        "open_for_consultation",
        String(formData.open_for_consultation),
      );
      formDataToSend.append(
        "open_for_duty_doctorship",
        String(formData.open_for_duty_doctorship),
      );
      formDataToSend.append("open_for_shift", String(formData.open_for_shift));
      if (formData.open_for_shift)
        formDataToSend.append("shift_preference", formData.shift_preference);

      formDataToSend.append("is_fresher", String(formData.is_fresher));
      formDataToSend.append(
        "available_days",
        JSON.stringify(formData.available_days),
      );
      formDataToSend.append("education", JSON.stringify(formData.education));
      formDataToSend.append("experience", JSON.stringify(formData.experience));

      const formattedReferences = formData.references.map((ref) => {
        const country = countries.find((c) => c.code === ref.ref_country_code);
        const callingCode = country ? country.callingCode : "91";
        return {
          ref_name: ref.ref_name,
          ref_email: ref.ref_email,
          ref_profession: ref.ref_profession,
          ref_contact_no: ref.ref_contact_no
            ? `+${callingCode}${ref.ref_contact_no}`
            : "",
        };
      });

      formDataToSend.append("references", JSON.stringify(formattedReferences));

      if (formData.profile_pic)
        formDataToSend.append("profile_pic", formData.profile_pic);
      if (formData.resume) formDataToSend.append("resume", formData.resume);

      const response = await api.post(
        `/medipro/onboard-doctor`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.status === 201 || response.status === 200) {
        setProfileId(response.data.profileId);
        setIsRegistered(true);
        setShowSuccessPopup(true);
        if (onComplete) onComplete();
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      if (error.response && error.response.data) {
        const backendMsg =
          error.response.data.message ||
          error.response.data.error ||
          "An error occurred during registration.";
        setServerError(backendMsg);
      } else {
        setServerError("Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================== CLOSE & REDIRECT =====================
  const closeSuccessPopup = () => {
    // 1. Hide popup
    setShowSuccessPopup(false);

    // 2. Clear Form Data to Initial State
    setFormData(initialFormData);

    // 3. Reset UI States
    setCurrentStep(1);
    setProfilePicPreview(null);
    setProfileId(null);
    setIsRegistered(false);
    setSelectedCountry(countries[0]);
    setSelectedAltCountry(countries[0]);
    setErrors({});

    // 4. Redirect to Home
    navigate("/");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Basic Information</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Prefix</label>
                <select
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleInputChange}
                >
                  <option value="Dr.">Dr.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className={errors.first_name ? styles.inputError : ""}
                />
                {errors.first_name && (
                  <span className={styles.errorText}>{errors.first_name}</span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  placeholder="Enter middle name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className={errors.last_name ? styles.inputError : ""}
                />
                {errors.last_name && (
                  <span className={styles.errorText}>{errors.last_name}</span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Mobile Number <span className={styles.required}>*</span>
                </label>
                <div className={styles.phoneInputContainer}>
                  <select
                    value={selectedCountry.code}
                    onChange={handleCountryChange}
                    className={styles.countrySelect}
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} +{country.callingCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                    maxLength={10}
                    className={errors.mobile_number ? styles.inputError : ""}
                  />
                </div>
                {errors.mobile_number && (
                  <span className={styles.errorText}>
                    {errors.mobile_number}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Alternate Mobile</label>
                <div className={styles.phoneInputContainer}>
                  <select
                    value={selectedAltCountry.code}
                    onChange={handleAltCountryChange}
                    className={styles.countrySelect}
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} +{country.callingCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="alternate_mobile_number"
                    value={formData.alternate_mobile_number}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                    maxLength={10}
                    className={
                      errors.alternate_mobile_number ? styles.inputError : ""
                    }
                  />
                </div>
                {errors.alternate_mobile_number && (
                  <span className={styles.errorText}>
                    {errors.alternate_mobile_number}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="doctor@example.com"
                  className={errors.email ? styles.inputError : ""}
                />
                {errors.email && (
                  <span className={styles.errorText}>{errors.email}</span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Date of Birth <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  max={maxDateForDob}
                  className={errors.date_of_birth ? styles.inputError : ""}
                  required
                />
                {errors.date_of_birth && (
                  <span className={styles.errorText}>
                    {errors.date_of_birth}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  Gender <span className={styles.required}>*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={errors.gender ? styles.inputError : ""}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <span className={styles.errorText}>{errors.gender}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  Doctor Register/License No{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="doctor_license_no"
                  value={formData.doctor_license_no}
                  onChange={handleInputChange}
                  placeholder="Enter license number"
                  className={errors.doctor_license_no ? styles.inputError : ""}
                />
                {errors.doctor_license_no && (
                  <span className={styles.errorText}>
                    {errors.doctor_license_no}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Location Details</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>
                  Address Line 1 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="address_line_1"
                  value={formData.address_line_1}
                  onChange={handleInputChange}
                  placeholder="Street address, house number"
                  className={errors.address_line_1 ? styles.inputError : ""}
                />
                {errors.address_line_1 && (
                  <span className={styles.errorText}>
                    {errors.address_line_1}
                  </span>
                )}
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="address_line_2"
                  value={formData.address_line_2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit (optional)"
                />
              </div>

              {/* --- UPDATED PINCODE INPUT --- */}
              <div className={styles.formGroup}>
                <label>
                  Pincode <span className={styles.required}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="current_location_pincode"
                    value={formData.current_location_pincode}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit Pincode"
                    maxLength={6}
                    className={
                      errors.current_location_pincode ? styles.inputError : ""
                    }
                  />
                  {isFetchingPincode && (
                    <span
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "12px",
                        color: "#007bff",
                        background: "white",
                        padding: "0 4px",
                      }}
                    >
                      Fetching...
                    </span>
                  )}
                </div>
                {errors.current_location_pincode && (
                  <span className={styles.errorText}>
                    {errors.current_location_pincode}
                  </span>
                )}
              </div>

              {/* --- UPDATED CITY INPUT (READ ONLY) --- */}
              <div className={styles.formGroup}>
                <label>
                  City <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="city_district"
                  value={formData.city_district}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                  placeholder="Auto-filled via Pincode"
                  className={errors.city_district ? styles.inputError : ""}
                />
                {errors.city_district && (
                  <span className={styles.errorText}>
                    {errors.city_district}
                  </span>
                )}
              </div>

              {/* --- UPDATED STATE INPUT (READ ONLY) --- */}
              <div className={styles.formGroup}>
                <label>
                  State <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                  placeholder="Auto-filled via Pincode"
                  className={errors.state ? styles.inputError : ""}
                />
                {errors.state && (
                  <span className={styles.errorText}>{errors.state}</span>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Professional Preferences</h2>

            {/* Work Preferences Section */}
            <div className={styles.checkboxSection}>
              <label className={styles.formGroup}>
                <span
                  style={{
                    fontWeight: 600,
                    color: "#333",
                    marginBottom: "10px",
                    display: "block",
                  }}
                >
                  Work Preference Type{" "}
                  <span className={styles.required}>*</span>
                </span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="open_for_consultation"
                  checked={formData.open_for_consultation}
                  onChange={handleInputChange}
                />
                <span>Open for Consultation</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="open_for_duty_doctorship"
                  checked={formData.open_for_duty_doctorship}
                  onChange={handleInputChange}
                />
                <span>Open for Duty Doctorship</span>
              </label>

              <div className={styles.shiftSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="open_for_shift"
                    checked={formData.open_for_shift}
                    onChange={handleInputChange}
                  />
                  <span>Open for Shift</span>
                </label>

                {formData.open_for_shift && (
                  <div className={styles.shiftOptions}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="shift_preference"
                        value="Day"
                        checked={formData.shift_preference === "Day"}
                        onChange={handleInputChange}
                      />
                      <span>Day Shift</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="shift_preference"
                        value="Night"
                        checked={formData.shift_preference === "Night"}
                        onChange={handleInputChange}
                      />
                      <span>Night Shift</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="shift_preference"
                        value="Both"
                        checked={formData.shift_preference === "Both"}
                        onChange={handleInputChange}
                      />
                      <span>Both</span>
                    </label>
                  </div>
                )}
                {/* Error for Shift Preference */}
                {errors.shift_preference && (
                  <span
                    className={styles.errorText}
                    style={{ marginLeft: "32px" }}
                  >
                    {errors.shift_preference}
                  </span>
                )}
              </div>

              {/* Error for Work Preference (General) */}
              {errors.work_preference && (
                <span
                  className={styles.errorText}
                  style={{ marginTop: "10px" }}
                >
                  {errors.work_preference}
                </span>
              )}
            </div>

            {/* Available Days Section */}
            <div className={styles.formGroup} style={{ marginTop: "20px" }}>
              <div className={styles.daysHeader}>
                <label>
                  Available Days <span className={styles.required}>*</span>
                </label>

                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className={`${styles.selectAllBtn} ${
                    formData.available_days.length === days.length
                      ? styles.active
                      : ""
                  }`}
                >
                  {formData.available_days.length === days.length ? (
                    <>
                      <span>✓</span> All Selected
                    </>
                  ) : (
                    "Select All"
                  )}
                </button>
              </div>

              <div className={styles.daysContainer}>
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`${styles.dayButton} ${
                      formData.available_days.includes(day) ? styles.active : ""
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {/* Error for Available Days */}
              {errors.available_days && (
                <span className={styles.errorText}>
                  {errors.available_days}
                </span>
              )}
            </div>

            {/* Current Clinic Section */}
            <div className={styles.formGroup}>
              <label>
                Current Clinic/Hospital{" "}
                <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="current_clinic_hospital_name"
                value={formData.current_clinic_hospital_name}
                onChange={handleInputChange}
                placeholder="Enter current workplace"
                className={
                  errors.current_clinic_hospital_name ? styles.inputError : ""
                }
              />
              {/* Error for Current Clinic */}
              {errors.current_clinic_hospital_name && (
                <span className={styles.errorText}>
                  {errors.current_clinic_hospital_name}
                </span>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.stepTitle}>Education</h2>
              <button
                type="button"
                onClick={addEducation}
                className={styles.addButton}
              >
                + Add
              </button>
            </div>
            {formData.education.map((edu, index) => {
              const isDegreeCustom =
                edu.degree && !medicalDegrees.includes(edu.degree);
              const isSpecialityCustom =
                edu.speciality && !medicalSpecialities.includes(edu.speciality);

              // Logic for custom year
              const isYearCustom =
                edu.pass_out_year && !years.includes(Number(edu.pass_out_year));

              return (
                <div
                  key={index}
                  className={styles.dynamicCard}
                  ref={(el) => {
                    educationRefs.current[index] = el;
                  }}
                >
                  {formData.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  )}
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>
                        Degree <span className={styles.required}>*</span>
                      </label>
                      <select
                        value={
                          medicalDegrees.includes(edu.degree)
                            ? edu.degree
                            : edu.degree
                              ? "Other"
                              : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          handleEducationChange(
                            index,
                            "degree",
                            val === "Other" ? "Other" : val,
                          );
                        }}
                        className={
                          errors[`education_${index}_degree`]
                            ? styles.inputError
                            : ""
                        }
                      >
                        <option value="">Select Degree</option>
                        {medicalDegrees.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {(edu.degree === "Other" || isDegreeCustom) && (
                        <input
                          type="text"
                          placeholder="Enter your Degree"
                          className={styles.customInput}
                          value={edu.degree === "Other" ? "" : edu.degree}
                          onChange={(e) =>
                            handleEducationChange(
                              index,
                              "degree",
                              e.target.value,
                            )
                          }
                        />
                      )}
                      {errors[`education_${index}_degree`] && (
                        <span className={styles.errorText}>
                          {errors[`education_${index}_degree`]}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Speciality <span className={styles.required}>*</span>
                      </label>
                      <select
                        value={
                          medicalSpecialities.includes(edu.speciality)
                            ? edu.speciality
                            : edu.speciality
                              ? "Other"
                              : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          handleEducationChange(
                            index,
                            "speciality",
                            val === "Other" ? "Other" : val,
                          );
                        }}
                        className={
                          errors[`education_${index}_speciality`]
                            ? styles.inputError
                            : ""
                        }
                      >
                        <option value="">Select Speciality</option>
                        {medicalSpecialities.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {(edu.speciality === "Other" || isSpecialityCustom) && (
                        <input
                          type="text"
                          placeholder="Enter your Speciality"
                          className={styles.customInput}
                          value={
                            edu.speciality === "Other" ? "" : edu.speciality
                          }
                          onChange={(e) =>
                            handleEducationChange(
                              index,
                              "speciality",
                              e.target.value,
                            )
                          }
                        />
                      )}
                      {errors[`education_${index}_speciality`] && (
                        <span className={styles.errorText}>
                          {errors[`education_${index}_speciality`]}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Super Speciality</label>
                      <select
                        value={
                          !edu.super_speciality
                            ? ""
                            : medicalSuperSpecialities.includes(
                                  edu.super_speciality,
                                )
                              ? edu.super_speciality
                              : "Other"
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          handleEducationChange(
                            index,
                            "super_speciality",
                            val === "Other" ? "Other" : val,
                          );
                        }}
                      >
                        <option value="">Select Super Speciality</option>
                        {medicalSuperSpecialities.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {(edu.super_speciality === "Other" ||
                        (edu.super_speciality &&
                          !medicalSuperSpecialities.includes(
                            edu.super_speciality,
                          ))) && (
                        <input
                          type="text"
                          placeholder="Enter Super Speciality"
                          className={styles.customInput}
                          value={
                            edu.super_speciality === "Other"
                              ? ""
                              : edu.super_speciality
                          }
                          onChange={(e) =>
                            handleEducationChange(
                              index,
                              "super_speciality",
                              e.target.value,
                            )
                          }
                        />
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Pass Out Year</label>
                      <select
                        value={
                          years.includes(Number(edu.pass_out_year))
                            ? edu.pass_out_year
                            : edu.pass_out_year
                              ? "Other"
                              : ""
                        }
                        onChange={(e) =>
                          handleEducationChange(
                            index,
                            "pass_out_year",
                            e.target.value === "Other"
                              ? "Other"
                              : parseInt(e.target.value),
                          )
                        }
                        className={
                          errors[`education_${index}_pass_out_year`]
                            ? styles.inputError
                            : ""
                        }
                      >
                        <option value="">Select Year</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>

                      {/* Manual Text Input for Custom Year */}
                      {(edu.pass_out_year === "Other" || isYearCustom) && (
                        <input
                          type="number"
                          placeholder="Enter Pass Out Year"
                          className={styles.customInput}
                          value={
                            edu.pass_out_year === "Other"
                              ? ""
                              : edu.pass_out_year
                          }
                          onChange={(e) =>
                            handleEducationChange(
                              index,
                              "pass_out_year",
                              e.target.value,
                            )
                          }
                        />
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>University</label>
                      <input
                        type="text"
                        value={edu.university || ""}
                        onChange={(e) =>
                          handleEducationChange(
                            index,
                            "university",
                            e.target.value,
                          )
                        }
                        placeholder="Enter university name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input
                        type="text"
                        value={edu.location || ""}
                        onChange={(e) =>
                          handleEducationChange(
                            index,
                            "location",
                            e.target.value,
                          )
                        }
                        placeholder="Enter location"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.stepTitle}>Experience</h2>
            </div>

            <div className={styles.fresherContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_fresher"
                  checked={formData.is_fresher}
                  onChange={handleInputChange}
                />
                <span>I am a Fresher (No Experience)</span>
              </label>
            </div>

            {!formData.is_fresher && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={addExperience}
                    className={styles.addButton}
                  >
                    + Add Experience
                  </button>
                </div>
                {formData.experience.map((exp, index) => (
                  <div key={index} className={styles.dynamicCard}>
                    {formData.experience.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className={styles.removeButton}
                      >
                        ×
                      </button>
                    )}
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>
                          Years of Experience{" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="number"
                          value={exp.years_of_experience}
                          onChange={(e) =>
                            handleExperienceChange(
                              index,
                              "years_of_experience",
                              parseInt(e.target.value),
                            )
                          }
                          placeholder="e.g., 5"
                          min="0"
                          max="50"
                          className={
                            errors[`experience_${index}_years`]
                              ? styles.inputError
                              : ""
                          }
                        />
                        {errors[`experience_${index}_years`] && (
                          <span className={styles.errorText}>
                            {errors[`experience_${index}_years`]}
                          </span>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          Clinic/Hospital Name{" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.clinic_hospital_name || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              index,
                              "clinic_hospital_name",
                              e.target.value,
                            )
                          }
                          placeholder="Enter clinic/hospital name"
                          className={
                            errors[`experience_${index}_clinic`]
                              ? styles.inputError
                              : ""
                          }
                        />
                        {errors[`experience_${index}_clinic`] && (
                          <span className={styles.errorText}>
                            {errors[`experience_${index}_clinic`]}
                          </span>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          Designation <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.designation || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              index,
                              "designation",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Senior Consultant"
                          className={
                            errors[`experience_${index}_designation`]
                              ? styles.inputError
                              : ""
                          }
                        />
                        {errors[`experience_${index}_designation`] && (
                          <span className={styles.errorText}>
                            {errors[`experience_${index}_designation`]}
                          </span>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Start Date</label>
                        <input
                          /* 1. Show 'text' if empty to display placeholder */
                          type={exp.start_date ? "date" : "text"}
                          /* 2. Custom Placeholder */
                          placeholder="DD/MM/YYYY"
                          /* 3. Switch to date picker on tap */
                          onFocus={(e) => (e.target.type = "date")}
                          /* 4. Switch back to text if left empty */
                          onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                          }}
                          name="start_date"
                          value={exp.start_date || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              index,
                              "start_date",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>End Date</label>
                        <input
                          /* 1. Show 'text' if empty to display placeholder */
                          type={exp.end_date ? "date" : "text"}
                          /* 2. Custom Placeholder */
                          placeholder="DD/MM/YYYY"
                          /* 3. Switch to date picker on tap */
                          onFocus={(e) => (e.target.type = "date")}
                          /* 4. Switch back to text if left empty */
                          onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                          }}
                          name="end_date"
                          value={exp.end_date || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              index,
                              "end_date",
                              e.target.value,
                            )
                          }
                          disabled={exp.is_current}
                          style={
                            exp.is_current
                              ? {
                                  backgroundColor: "#f5f5f5",
                                  cursor: "not-allowed",
                                }
                              : {}
                          }
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={exp.is_current}
                            onChange={(e) =>
                              handleExperienceChange(
                                index,
                                "is_current",
                                e.target.checked,
                              )
                            }
                          />
                          <span>Currently Working</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );

      case 6:
        return (
          <div className={styles.stepContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.stepTitle}>References</h2>
            </div>
            {formData.references.map((ref, index) => (
              <div key={index} className={styles.dynamicCard}>
                {formData.references.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                )}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Reference Name</label>
                    <input
                      type="text"
                      value={ref.ref_name}
                      onChange={(e) =>
                        handleReferenceChange(index, "ref_name", e.target.value)
                      }
                      placeholder="Enter reference name"
                      className={
                        errors[`reference_${index}_name`]
                          ? styles.inputError
                          : ""
                      }
                    />
                    {errors[`reference_${index}_name`] && (
                      <span className={styles.errorText}>
                        {errors[`reference_${index}_name`]}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Reference Email</label>
                    <input
                      type="email"
                      value={ref.ref_email}
                      onChange={(e) =>
                        handleReferenceChange(
                          index,
                          "ref_email",
                          e.target.value,
                        )
                      }
                      placeholder="reference@example.com"
                      className={
                        errors[`reference_${index}_email`]
                          ? styles.inputError
                          : ""
                      }
                    />
                    {errors[`reference_${index}_email`] && (
                      <span className={styles.errorText}>
                        {errors[`reference_${index}_email`]}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Contact Number</label>
                    <div className={styles.phoneInputContainer}>
                      <select
                        value={ref.ref_country_code}
                        onChange={(e) =>
                          handleReferenceChange(
                            index,
                            "ref_country_code",
                            e.target.value,
                          )
                        }
                        className={styles.countrySelect}
                      >
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} +{country.callingCode}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={ref.ref_contact_no}
                        onChange={(e) =>
                          handleReferenceChange(
                            index,
                            "ref_contact_no",
                            e.target.value,
                          )
                        }
                        placeholder="1234567890"
                        maxLength={10}
                        className={
                          errors[`reference_${index}_contact`]
                            ? styles.inputError
                            : ""
                        }
                      />
                    </div>
                    {errors[`reference_${index}_contact`] && (
                      <span className={styles.errorText}>
                        {errors[`reference_${index}_contact`]}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Profession</label>
                    <input
                      type="text"
                      value={ref.ref_profession}
                      onChange={(e) =>
                        handleReferenceChange(
                          index,
                          "ref_profession",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., Doctor, Professor"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 7:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Upload Documents</h2>

            <div className={styles.uploadSection}>
              {/* === PROFILE PICTURE === */}
              <div className={styles.formGroup}>
                <label>
                  Profile Picture <span className={styles.required}>*</span>
                </label>

                {/* PREVIEW IMAGE */}
                {profilePicPreview && (
                  <div className={styles.imagePreview}>
                    <img src={profilePicPreview} alt="Profile" />
                  </div>
                )}

                {/* SHOW INPUT ONLY IF NO FILE IS SELECTED */}
                {!formData.profile_pic && (
                  <input
                    type="file"
                    accept="image/*"
                    ref={profilePicInputRef} /* Attached Ref */
                    onChange={(e) => handleFileChange(e, "profile_pic")}
                    className={`${styles.fileInput} ${
                      errors.profile_pic ? styles.inputError : ""
                    }`}
                  />
                )}

                {/* SHOW FILE STATUS & REMOVE BUTTON IF FILE EXISTS */}
                {formData.profile_pic && (
                  <div className={styles.fileStatusContainer}>
                    <span className={styles.fileName}>
                      ✓ {formData.profile_pic.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile("profile_pic")}
                      className={styles.removeFileBtn}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {errors.profile_pic && (
                  <span className={styles.errorText}>{errors.profile_pic}</span>
                )}
              </div>

              {/* === RESUME === */}
              <div className={styles.formGroup}>
                <label>
                  Resume (PDF/DOC) <span className={styles.required}>*</span>
                </label>

                {/* SHOW INPUT ONLY IF NO FILE IS SELECTED */}
                {!formData.resume && (
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    ref={resumeInputRef} /* Attached Ref */
                    onChange={(e) => handleFileChange(e, "resume")}
                    className={`${styles.fileInput} ${
                      errors.resume ? styles.inputError : ""
                    }`}
                  />
                )}

                {/* SHOW FILE STATUS & REMOVE BUTTON IF FILE EXISTS */}
                {formData.resume && (
                  <div className={styles.fileStatusContainer}>
                    <span className={styles.fileName}>
                      ✓ {formData.resume.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile("resume")}
                      className={styles.removeFileBtn}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {errors.resume && (
                  <span className={styles.errorText}>{errors.resume}</span>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.wizardContainer} ref={topRef}>
      <div className={styles.wizardCard}>
        <div
          className={styles.progressBar}
          style={{ "--progress": currentStep - 1 } as React.CSSProperties}
        >
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`${styles.progressStep} ${
                i + 1 <= currentStep ? styles.active : ""
              }`}
            >
              <div className={styles.stepNumber}>{i + 1}</div>
              <div className={styles.stepLabel}>
                {
                  [
                    "Basic",
                    "Location",
                    "Preferences",
                    "Education",
                    "Experience",
                    "References",
                    "Documents",
                  ][i]
                }
              </div>
            </div>
          ))}
        </div>

        {renderStep()}

        {/* Backend Error Display */}
        {serverError && (
          <div
            style={{
              color: "#dc3545",
              textAlign: "center",
              margin: "20px 0",
              padding: "10px",
              backgroundColor: "#fff5f5",
              borderRadius: "8px",
              border: "1px solid #dc3545",
            }}
          >
            ⚠️ {serverError}
          </div>
        )}

        <div className={styles.buttonGroup}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className={styles.btnSecondary}
            >
              ← Previous
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className={styles.btnPrimary}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className={styles.btnSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "✓ Submit"}
            </button>
          )}
        </div>
        <div>
          <p className={styles.noteText}>
            If you have any questions, please contact us at
            <a href="mailto:support@healtrackai.com">
              {" "}
              support@healtrackai.com
            </a>
          </p>
        </div>
      </div>

      {showSuccessPopup && (
        <div className={styles.modalOverlay} onClick={closeSuccessPopup}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.successIcon}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#28a745"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  d="M25 40L35 50L55 30"
                  stroke="#28a745"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Registration Successful!</h2>
            <p className={styles.successMessage}>
              Dear Dr. {formData.first_name} {formData.last_name}, your
              registration has been submitted successfully. Our team will review
              your application and get back to you soon.
            </p>
            <button
              onClick={closeSuccessPopup}
              className={styles.successButton}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorRegistration;
