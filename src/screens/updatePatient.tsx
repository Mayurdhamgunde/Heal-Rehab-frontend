import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "../css/updatePatient.module.css";
import api from "../utils/central";
import LocationPicker from "../components/HospitalLocation";

// --- COUNTRY LIST ---
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

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Location Interface
interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientData {
  doctor_id: string;
  patient_first_name: string;
  patient_middle_name?: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  guardian_phone: string;
  guardian_phone_2?: string;

  guardian_relation?: string;
  other_guardian_relation?: string;
  guardian_relation_2?: string;
  other_guardian_relation_2?: string;
  other_witness_relationship?: string;

  gender: string;
  date_of_birth: string;
  address: Address;
  patient_age: string;
  patient_bloodGroup: string;
  patient_symptoms: string;
  therepy_category: string;
  patient_diagnosis: string;
  patient_therapy_type: string;
  therapy_duration: string;
  patient_id: string;
  doctor_name: string;
  patient_image?: string;
  appointments?: any[];

  education?: string;
  caste?: string;
  otherCaste?: string;
  occupation?: string;
  marital_status?: string;
  iCardType?: string;
  iCardNumber?: string;
  annual_income?: string;
  treatment_days?: string | number;
  prior_treatment?: string;

  witness_name?: string;
  witness_relationship?: string;
  witness_photo_url?: string;
  UHID?: string;
  location_id?: string;
  location_name?: string;
}

const isValidObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

const calculateAge = (dobString: string): string => {
  if (!dobString) return "";
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age.toString() : "";
};

const parsePhoneNumber = (fullNumber: string | undefined) => {
  if (!fullNumber) return { countryCode: countries[0].code, localNumber: "" };
  const cleanedFullNumber = fullNumber.replace(/\s+/g, "");
  for (const country of countries) {
    const prefix = `+${country.callingCode}`;
    if (cleanedFullNumber.startsWith(prefix)) {
      const localNumber = cleanedFullNumber
        .slice(prefix.length)
        .replace(/\D/g, "");
      return { countryCode: country.code, localNumber };
    }
  }
  return {
    countryCode: countries[0].code,
    localNumber: fullNumber.replace(/\D/g, ""),
  };
};

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

// Icons Components
const IconPersonal = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <rect
      width="20"
      height="14"
      x="2"
      y="5"
      rx="2"
      strokeDasharray="60"
      strokeDashoffset="60"
      className={styles.hideBox}
    />
  </svg>
);
const IconAdditional = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 8h10M7 12h10M7 16h10" />
  </svg>
);
const IconFinancial = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);
const IconWitness = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconMedical = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconCamera = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const UpdateProfile: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<Country>(
    countries[0],
  );
  const [selectedGuardianCountry, setSelectedGuardianCountry] =
    useState<Country>(countries[0]);

  const [selectedGuardian2Country, setSelectedGuardian2Country] =
    useState<Country>(countries[0]);

  // Location State
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  // Treatment Suggestions State
  const [treatmentSuggestions, setTreatmentSuggestions] = useState<string[]>(
    [],
  );

  // Image States
  const [patientImage, setPatientImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [witnessPhoto, setWitnessPhoto] = useState<File | null>(null);
  const [witnessPhotoPreview, setWitnessPhotoPreview] = useState<string | null>(
    null,
  );

  // Crop States
  const [imgSrc, setImgSrc] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [currentCropTarget, setCurrentCropTarget] = useState<
    "patient" | "witness" | null
  >(null);

  // Webcam States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [patientData, setPatientData] = useState<PatientData>({
    patient_first_name: "",
    patient_middle_name: "",
    patient_last_name: "",
    patient_email: "",
    patient_phone: "",
    guardian_phone: "",
    guardian_phone_2: "",

    guardian_relation: "",
    other_guardian_relation: "",
    guardian_relation_2: "",
    other_guardian_relation_2: "",
    other_witness_relationship: "",

    gender: "",
    date_of_birth: "",
    address: {
      street: "",
      city: "",
      state: "Maharashtra",
      zip: "",
      country: "India",
    },
    patient_age: "",
    patient_bloodGroup: "",
    patient_symptoms: "",
    therepy_category: "",
    patient_diagnosis: "",
    patient_therapy_type: "",
    therapy_duration: "",
    patient_id: "",
    doctor_name: "",
    doctor_id: "",
    education: "",
    caste: "",
    otherCaste: "",
    occupation: "",
    marital_status: "",
    iCardType: "AADHAR",
    iCardNumber: "",
    annual_income: "",
    treatment_days: "",
    prior_treatment: "",
    witness_name: "",
    witness_relationship: "",
    UHID: "",
    location_id: "",
    location_name: "",
  });

  const [errors, setErrors] = useState<
    Partial<PatientData & { general: string }>
  >({});

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  };

  const handlePhoneCountryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) setSelectedPhoneCountry(country);
  };

  const handleGuardianCountryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) setSelectedGuardianCountry(country);
  };

  const handleGuardian2CountryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) setSelectedGuardian2Country(country);
  };

  // Location handler
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const calculatedAge = calculateAge(formattedDate);

      setPatientData((prev) => ({
        ...prev,
        date_of_birth: formattedDate,
        patient_age: calculatedAge,
      }));
    } else {
      setPatientData((prev) => ({
        ...prev,
        date_of_birth: "",
        patient_age: "",
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setPatientData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
      return;
    }

    if (
      name === "patient_phone" ||
      name === "guardian_phone" ||
      name === "guardian_phone_2"
    ) {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setPatientData((prev) => ({ ...prev, [name]: cleaned }));

      if (cleaned.length > 0 && !validatePhone(cleaned)) {
        setErrors((prev) => ({ ...prev, [name]: "Invalid 10-digit number." }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
      return;
    }

    if (name === "patient_email") {
      if (!validateEmail(value)) {
        setErrors((prev) => ({ ...prev, patient_email: "Invalid email" }));
      } else {
        setErrors((prev) => ({ ...prev, patient_email: "" }));
      }
    }

    setPatientData((prev) => ({ ...prev, [name]: value }));
  };

  // --- File Upload Logic ---
  const onSelectFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "patient" | "witness",
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setCurrentCropTarget(target);
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- Webcam Logic ---
  const startWebcam = async (
    target: "patient" | "witness",
    mode: "user" | "environment" = "user",
  ) => {
    setCurrentCropTarget(target);
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
    if (currentCropTarget) {
      startWebcam(currentCropTarget, newMode);
    }
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

  // --- Image Crop Logic ---
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

      const fileName = `${currentCropTarget}_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(file);

      if (currentCropTarget === "patient") {
        setPatientImage(file);
        setImagePreview(previewUrl);
      } else if (currentCropTarget === "witness") {
        setWitnessPhoto(file);
        setWitnessPhotoPreview(previewUrl);
      }

      setIsCropModalOpen(false);
      setImgSrc("");
    }, "image/jpeg");
  };

  const fetchPatientData = useCallback(async () => {
    if (!patientId || !isValidObjectId(patientId)) {
      setErrors((prev) => ({ ...prev, general: "Invalid patient ID." }));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/patient/${patientId}`);
      const patientInfo = response.data.patientData;

      const parsedPatientPhone = parsePhoneNumber(patientInfo.patient_phone);
      const matchedPatientCountry =
        countries.find((c) => c.code === parsedPatientPhone.countryCode) ||
        countries[0];
      setSelectedPhoneCountry(matchedPatientCountry);

      const parsedGuardianPhone = parsePhoneNumber(patientInfo.guardian_phone);
      const matchedGuardianCountry =
        countries.find((c) => c.code === parsedGuardianPhone.countryCode) ||
        countries[0];
      setSelectedGuardianCountry(matchedGuardianCountry);

      if (patientInfo.guardian_phone_2) {
        const parsedGuardian2Phone = parsePhoneNumber(
          patientInfo.guardian_phone_2,
        );
        const matchedGuardian2Country =
          countries.find((c) => c.code === parsedGuardian2Phone.countryCode) ||
          countries[0];
        setSelectedGuardian2Country(matchedGuardian2Country);
      }

      const formattedDob = patientInfo.date_of_birth
        ? new Date(patientInfo.date_of_birth).toISOString().split("T")[0]
        : "";
      const initialAge = formattedDob
        ? calculateAge(formattedDob)
        : patientInfo.patient_age || "";

      if (patientInfo.patient_image) setImagePreview(patientInfo.patient_image);
      if (patientInfo.witness_photo_url)
        setWitnessPhotoPreview(patientInfo.witness_photo_url);

      if (patientInfo.location_id && patientInfo.location_name) {
        setSelectedLocation({
          _id: patientInfo.location_id,
          id: patientInfo.location_id,
          name: patientInfo.location_name,
          locationId: patientInfo.location_id,
          addressLink: "",
          createdAt: "",
          updatedAt: "",
        });
      }

      const fetchedCaste = patientInfo.caste || "";
      const standardCastes = ["General", "OBC", "SC", "ST"];
      const isOtherCaste =
        fetchedCaste && !standardCastes.includes(fetchedCaste);

      const parsedGuardian2 = parsePhoneNumber(patientInfo.guardian_phone_2);

      const standardGuardianRelations = [
        "Father",
        "Mother",
        "Wife",
        "Brother",
        "Sister",
        "Child",
      ];

      const fetchedGRelation1 = patientInfo.guardian_relation || "";
      const isOtherGRelation1 =
        fetchedGRelation1 &&
        !standardGuardianRelations.includes(fetchedGRelation1);

      const fetchedGRelation2 = patientInfo.guardian_relation_2 || "";
      const isOtherGRelation2 =
        fetchedGRelation2 &&
        !standardGuardianRelations.includes(fetchedGRelation2);

      const standardWitnessRelations = [
        "Mother",
        "Father",
        "Brother",
        "Sister",
        "Wife",
        "Child",
        "Guardian",
        "Friend",
      ];
      const fetchedWitnessRel = patientInfo.witness_relationship || "";
      const isOtherWitnessRel =
        fetchedWitnessRel &&
        !standardWitnessRelations.includes(fetchedWitnessRel);

      setPatientData((prev) => ({
        ...prev,
        ...patientInfo,
        patient_phone: parsedPatientPhone.localNumber,
        guardian_phone: parsedGuardianPhone.localNumber,
        guardian_phone_2: parsedGuardian2.localNumber,

        guardian_relation: isOtherGRelation1 ? "Other" : fetchedGRelation1,
        other_guardian_relation: isOtherGRelation1 ? fetchedGRelation1 : "",
        guardian_relation_2: isOtherGRelation2 ? "Other" : fetchedGRelation2,
        other_guardian_relation_2: isOtherGRelation2 ? fetchedGRelation2 : "",
        witness_relationship: isOtherWitnessRel ? "Other" : fetchedWitnessRel,
        other_witness_relationship: isOtherWitnessRel ? fetchedWitnessRel : "",

        date_of_birth: formattedDob,
        patient_age: initialAge,
        gender: patientInfo.gender || "",
        address: {
          street: patientInfo.address?.street || "",
          city: patientInfo.address?.city || "",
          state: patientInfo.address?.state || "Maharashtra",
          zip: patientInfo.address?.zip || "",
          country: patientInfo.address?.country || "India",
        },
        education: patientInfo.education || "",
        caste: isOtherCaste ? "Other" : fetchedCaste,
        otherCaste: isOtherCaste ? fetchedCaste : "",
        occupation: patientInfo.occupation || "",
        marital_status: patientInfo.marital_status || "",
        annual_income: patientInfo.annual_income || "",
        treatment_days: patientInfo.treatment_days || "",
        prior_treatment: patientInfo.prior_treatment || "",
        iCardType: patientInfo.identity_card?.type || "AADHAR",
        iCardNumber: patientInfo.identity_card?.number || "",
        witness_name: patientInfo.witness_name || "",
        UHID: patientInfo.UHID || "",
      }));
    } catch (error) {
      console.error("Error fetching patient data:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Failed to load patient data.",
      }));
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  // --- Fetch Treatment Suggestions ---
  useEffect(() => {
    const fetchTreatmentSuggestions = async () => {
      try {
        // Replace with your actual API endpoint once available:
        // const response = await api.get("/suggestions/treatments");
        // setTreatmentSuggestions(response.data.suggestions);

        // Mock data for now:
        setTreatmentSuggestions(["Ayush Institute For Addiction Management"]);
      } catch (error) {
        console.error("Failed to load treatment suggestions", error);
      }
    };
    fetchTreatmentSuggestions();
  }, []);

  const handlePatientUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !isValidObjectId(patientId)) return;

    setIsLoading(true);

    const finalPatientPhone = `+${selectedPhoneCountry.callingCode}${patientData.patient_phone}`;
    const finalGuardianPhone = patientData.guardian_phone
      ? `+${selectedGuardianCountry.callingCode}${patientData.guardian_phone}`
      : "";
    const finalGuardianPhone2 = patientData.guardian_phone_2
      ? `+${selectedGuardian2Country.callingCode}${patientData.guardian_phone_2}`
      : "";

    const formDataToSend = new FormData();
    const ignoredKeys = [
      "address",
      "patient_image",
      "appointments",
      "_id",
      "__v",
      "createdAt",
      "updatedAt",
      "caste",
      "otherCaste",
      "iCardType",
      "iCardNumber",
      "identity_card",
      "witness_photo_url",
      "location_id",
      "location_name",
      "guardian_phone_2",
      "guardian_relation",
      "other_guardian_relation",
      "guardian_relation_2",
      "other_guardian_relation_2",
      "witness_relationship",
      "other_witness_relationship",
    ];

    Object.entries(patientData).forEach(([key, value]) => {
      if (ignoredKeys.includes(key)) return;
      if (key === "patient_phone")
        formDataToSend.append("patient_phone", finalPatientPhone);
      else if (key === "guardian_phone") {
        if (finalGuardianPhone)
          formDataToSend.append("guardian_phone", finalGuardianPhone);
      } else if (
        value !== null &&
        value !== undefined &&
        typeof value !== "object"
      ) {
        if (key === "treatment_days" && value === "") return;
        formDataToSend.append(key, value as string);
      }
    });

    if (finalGuardianPhone2) {
      formDataToSend.append("guardian_phone_2", finalGuardianPhone2);
    }

    formDataToSend.append("address.street", patientData.address.street);
    formDataToSend.append("address.city", patientData.address.city);
    formDataToSend.append("address.state", patientData.address.state);
    formDataToSend.append("address.zip", patientData.address.zip);
    formDataToSend.append("address.country", patientData.address.country);

    const finalCaste =
      patientData.caste === "Other"
        ? patientData.otherCaste
        : patientData.caste;
    if (finalCaste) formDataToSend.append("caste", finalCaste);

    const finalGRelation1 =
      patientData.guardian_relation === "Other"
        ? patientData.other_guardian_relation
        : patientData.guardian_relation;
    if (finalGRelation1)
      formDataToSend.append("guardian_relation", finalGRelation1);

    const finalGRelation2 =
      patientData.guardian_relation_2 === "Other"
        ? patientData.other_guardian_relation_2
        : patientData.guardian_relation_2;
    if (finalGRelation2)
      formDataToSend.append("guardian_relation_2", finalGRelation2);

    const finalWitnessRel =
      patientData.witness_relationship === "Other"
        ? patientData.other_witness_relationship
        : patientData.witness_relationship;
    if (finalWitnessRel)
      formDataToSend.append("witness_relationship", finalWitnessRel);

    formDataToSend.append(
      "identity_card.type",
      patientData.iCardType || "AADHAR",
    );
    if (patientData.iCardNumber)
      formDataToSend.append("identity_card.number", patientData.iCardNumber);

    if (selectedLocation) {
      formDataToSend.append("location_id", selectedLocation._id);
      formDataToSend.append("location_name", selectedLocation.name);
    }

    if (patientImage) formDataToSend.append("patient_image", patientImage);
    if (witnessPhoto) formDataToSend.append("witness_photo", witnessPhoto);

    try {
      const response = await api.post(
        `/patient/update/${patientId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("idToken")}`,
          },
        },
      );
      if (response.data?.updatedPatient?.patient_image)
        setImagePreview(response.data.updatedPatient.patient_image);
      if (response.data?.updatedPatient?.witness_photo_url)
        setWitnessPhotoPreview(response.data.updatedPatient.witness_photo_url);
      alert("Profile updated successfully!");
      navigate(`/patient/${patientId}`);
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        general: error.response?.data?.error || "Update failed.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

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
        <div className={styles.headerArea}>
          <h1 className={styles.pageTitle}>Update Patient Profile</h1>
        </div>

        {errors.general && (
          <div className={styles.errorMessage}>{errors.general}</div>
        )}

        <form onSubmit={handlePatientUpdate} className={styles.formLayout}>
          {/* TOP ROW: PHOTOS */}
          <div className={styles.grid2Col}>
            {/* Patient Photo Card */}
            <div className={styles.card}>
              <h3 className={styles.cardHeader}>PATIENT PHOTO</h3>
              <div className={styles.photoBoxContainer}>
                <div className={styles.photoFrame}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Patient"
                      className={styles.uploadedImg}
                    />
                  ) : (
                    <div className={styles.placeholderImg}>👤</div>
                  )}
                  <div className={styles.cameraIconBadge}>
                    <IconCamera />
                  </div>
                </div>
                <div className={styles.photoActions}>
                  <label className={styles.pillButtonLight}>
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                      onChange={(e) => onSelectFile(e, "patient")}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.pillButtonLight}
                    onClick={() => startWebcam("patient")}
                  >
                    Capture Live
                  </button>
                </div>
              </div>
            </div>

            {/* Witness Photo Card */}
            <div className={styles.card}>
              <h3 className={styles.cardHeader}>WITNESS PHOTO</h3>
              <div className={styles.photoBoxContainer}>
                <div className={styles.photoFrame}>
                  {witnessPhotoPreview ? (
                    <img
                      src={witnessPhotoPreview}
                      alt="Witness"
                      className={styles.uploadedImg}
                    />
                  ) : (
                    <div className={styles.placeholderImg}>👥</div>
                  )}
                  <div className={styles.cameraIconBadge}>
                    <IconCamera />
                  </div>
                </div>
                <div className={styles.photoActions}>
                  <label className={styles.pillButtonLight}>
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                      onChange={(e) => onSelectFile(e, "witness")}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.pillButtonLight}
                    onClick={() => startWebcam("witness")}
                  >
                    Capture Live
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: PERSONAL DETAILS */}
          <div className={styles.card}>
            <div className={styles.cardTitleWithIcon}>
              <div className={styles.iconWrapper}>
                <IconPersonal />
              </div>
              <h2>Personal Details</h2>
            </div>

            <div className={styles.grid3Col}>
              <div className={styles.formGroup}>
                <label>UHID</label>
                <input
                  type="text"
                  name="UHID"
                  value={patientData.UHID}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="UHID"
                />
              </div>
              <div className={styles.formGroup}>
                <label>FIRST NAME *</label>
                <input
                  type="text"
                  name="patient_first_name"
                  value={patientData.patient_first_name}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>MIDDLE NAME</label>
                <input
                  type="text"
                  name="patient_middle_name"
                  value={patientData.patient_middle_name}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>LAST NAME *</label>
                <input
                  type="text"
                  name="patient_last_name"
                  value={patientData.patient_last_name}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>DATE OF BIRTH *</label>
                <DatePicker
                  selected={
                    patientData.date_of_birth
                      ? new Date(patientData.date_of_birth)
                      : null
                  }
                  onChange={handleDateChange}
                  className={styles.input}
                  dateFormat="dd/MM/yyyy"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  maxDate={new Date()}
                  placeholderText="DD/MM/YYYY"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>AGE *</label>
                <input
                  type="number"
                  name="patient_age"
                  value={patientData.patient_age}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>GENDER *</label>
                <select
                  name="gender"
                  value={patientData.gender}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>EMAIL ADDRESS</label>
                <input
                  type="email"
                  name="patient_email"
                  value={patientData.patient_email}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>PHONE NUMBER *</label>
                <div className={styles.phoneInputWrap}>
                  <select
                    value={selectedPhoneCountry.code}
                    onChange={handlePhoneCountryChange}
                    className={styles.inputPrefix}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        +{c.callingCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="patient_phone"
                    value={patientData.patient_phone}
                    onChange={handleInputChange}
                    className={styles.inputMain}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>GUARDIAN PHONE 1</label>
                <div className={styles.phoneInputWrap}>
                  <select
                    value={selectedGuardianCountry.code}
                    onChange={handleGuardianCountryChange}
                    className={styles.inputPrefix}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        +{c.callingCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="guardian_phone"
                    value={patientData.guardian_phone}
                    onChange={handleInputChange}
                    className={styles.inputMain}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>GUARDIAN 1 RELATION</label>
                <select
                  name="guardian_relation"
                  value={patientData.guardian_relation}
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  <option value="">Select Relation</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Wife">Wife</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Child">Child</option>
                  <option value="Other">Other</option>
                </select>
                {patientData.guardian_relation === "Other" && (
                  <input
                    type="text"
                    name="other_guardian_relation"
                    value={patientData.other_guardian_relation}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Specify Relation"
                    style={{ marginTop: "0.25rem" }}
                    required
                  />
                )}
              </div>

              <div className={styles.formGroup}>
                <label>GUARDIAN PHONE 2</label>
                <div className={styles.phoneInputWrap}>
                  <select
                    value={selectedGuardian2Country.code}
                    onChange={handleGuardian2CountryChange}
                    className={styles.inputPrefix}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        +{c.callingCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="guardian_phone_2"
                    value={patientData.guardian_phone_2}
                    onChange={handleInputChange}
                    className={styles.inputMain}
                    maxLength={10}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>GUARDIAN 2 RELATION</label>
                <select
                  name="guardian_relation_2"
                  value={patientData.guardian_relation_2}
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  <option value="">Select Relation</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Wife">Wife</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Child">Child</option>
                  <option value="Other">Other</option>
                </select>
                {patientData.guardian_relation_2 === "Other" && (
                  <input
                    type="text"
                    name="other_guardian_relation_2"
                    value={patientData.other_guardian_relation_2}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Specify Relation"
                    style={{ marginTop: "0.25rem" }}
                    required
                  />
                )}
              </div>
            </div>

            {/* --- FACILITY LOCATION FIELD --- */}
            <div className={styles.formGroupFull} style={{ marginTop: "1rem" }}>
              <label>FACILITY LOCATION</label>
              <LocationPicker
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                disabled={false}
                showSetAsDefault={true}
                autoSelectPreferred={true}
              />
            </div>

            {/* Address Spans Full Width */}
            <div className={styles.formGroupFull} style={{ marginTop: "1rem" }}>
              <label>ADDRESS *</label>
              <div className={styles.addressGrid}>
                {/* Street — spans full width on first row */}
                <input
                  type="text"
                  name="address.street"
                  value={patientData.address.street}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Street Address"
                  required
                />
                <input
                  type="text"
                  name="address.city"
                  value={patientData.address.city}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="City"
                  required
                />

                <select
                  name="address.state"
                  value={patientData.address.state}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                >
                  <option value="">Select State</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                </select>

                <input
                  type="text"
                  name="address.zip"
                  value={patientData.address.zip}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="ZIP Code (optional)"
                />

                <input
                  type="text"
                  name="address.country"
                  value={patientData.address.country}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Country"
                  required
                />
              </div>
            </div>
          </div>

          {/* ROW 3: ADDITIONAL INFO & FINANCIAL */}
          <div className={styles.gridSplit2to1}>
            <div className={styles.card}>
              <div className={styles.cardTitleWithIcon}>
                <div className={styles.iconWrapper}>
                  <IconAdditional />
                </div>
                <h2>Additional Information</h2>
              </div>
              <div className={styles.grid2Col}>
                <div className={styles.formGroup}>
                  <label>EDUCATION</label>
                  <input
                    type="text"
                    name="education"
                    value={patientData.education}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g. Postgraduate"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>CATEGORY / CASTE</label>
                  <select
                    name="caste"
                    value={patientData.caste}
                    onChange={handleInputChange}
                    className={styles.input}
                  >
                    <option value="">Select Category</option>
                    <option value="General">General / Open</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="Other">Other</option>
                  </select>
                  {patientData.caste === "Other" && (
                    <input
                      type="text"
                      name="otherCaste"
                      value={patientData.otherCaste}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Specify"
                      style={{ marginTop: "0.25rem" }}
                      required
                    />
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label>OCCUPATION</label>
                  <input
                    type="text"
                    name="occupation"
                    value={patientData.occupation}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g. Retired Educator"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>MARITAL STATUS</label>
                  <select
                    name="marital_status"
                    value={patientData.marital_status}
                    onChange={handleInputChange}
                    className={styles.input}
                  >
                    <option value="">Select</option>
                    <option value="Unmarried">Unmarried</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>IDENTITY CARD TYPE</label>
                  <select
                    name="iCardType"
                    value={patientData.iCardType}
                    onChange={handleInputChange}
                    className={styles.input}
                  >
                    <option value="AADHAR">Aadhar</option>
                    <option value="PAN">PAN</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>IDENTITY NUMBER</label>
                  <input
                    type="text"
                    name="iCardNumber"
                    value={patientData.iCardNumber}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="XXXX-XXXX-XXXX"
                  />
                </div>
              </div>
            </div>

            {/* Financial Status Card */}
            <div className={`${styles.card} ${styles.financialCard}`}>
              <div className={styles.cardTitleWithIcon}>
                <div className={styles.iconWrapperLight}>
                  <IconFinancial />
                </div>
                <h2>Financial Status</h2>
              </div>
              <div className={styles.formGroup} style={{ marginTop: "0.5rem" }}>
                <label style={{ color: "var(--primary)", fontWeight: 700 }}>
                  ANNUAL INCOME (EST.)
                </label>
                <div className={styles.currencyInputWrap}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="text"
                    name="annual_income"
                    value={patientData.annual_income}
                    onChange={handleInputChange}
                    className={styles.financialInput}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ROW 4: WITNESS & MEDICAL */}
          <div className={styles.grid2Col}>
            <div className={styles.card}>
              <div className={styles.cardTitleWithIcon}>
                <div className={styles.iconWrapper}>
                  <IconWitness />
                </div>
                <h2>Witness Information</h2>
              </div>
              <div
                className={styles.formGroup}
                style={{ marginBottom: "0.75rem" }}
              >
                <label>WITNESS NAME</label>
                <input
                  type="text"
                  name="witness_name"
                  value={patientData.witness_name}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>RELATIONSHIP TO PATIENT</label>
                <select
                  name="witness_relationship"
                  value={patientData.witness_relationship}
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  <option value="">Select Relationship</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Wife">Wife</option>
                  <option value="Child">Child</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
                {patientData.witness_relationship === "Other" && (
                  <input
                    type="text"
                    name="other_witness_relationship"
                    value={patientData.other_witness_relationship}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Specify Relationship"
                    style={{ marginTop: "0.25rem" }}
                    required
                  />
                )}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitleWithIcon}>
                <div className={styles.iconWrapper}>
                  <IconMedical />
                </div>
                <h2>Medical History</h2>
              </div>

              <div
                className={styles.formGroup}
                style={{ marginBottom: "0.75rem" }}
              >
                <label>TREATMENT DAYS</label>
                <input
                  type="number"
                  name="treatment_days"
                  value={patientData.treatment_days}
                  onChange={handleInputChange}
                  className={styles.input}
                  min="0"
                  placeholder="e.g. 30"
                />
              </div>

              {/* --- AUTOCOMPLETE FIELD IMPLEMENTATION --- */}
              <div className={styles.formGroupFull}>
                <label>PRIOR TREATMENT / ALLERGIES</label>
                <input
                  type="text"
                  name="prior_treatment"
                  list="prior-treatments-list"
                  value={patientData.prior_treatment}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Search or type prior treatment..."
                />
                <datalist id="prior-treatments-list">
                  {treatmentSuggestions.map((suggestion, index) => (
                    <option key={index} value={suggestion} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className={styles.actionFooter}>
            <button
              type="button"
              className={styles.btnDiscard}
              onClick={() => navigate(-1)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Discard Changes
            </button>
            <div className={styles.actionRight}>
              <button
                type="submit"
                disabled={isLoading}
                className={styles.btnPrimary}
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
