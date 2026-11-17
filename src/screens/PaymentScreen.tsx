import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/PaymentScreen.module.css";
import LocationPicker from "../components/HospitalLocation";

interface TherapySession {
  _id: string;
  status: string;
  date: string;
  session_number: number;
}

interface TherapyPlan {
  _id: string;
  therapy_name: string;
  balance: string;
  per_session_amount: number;
  therapy_sessions: TherapySession[];
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

interface PaymentFormData {
  payment_type_mode: "plan" | "direct";
  payment_reason: string;
  plan_id: string;
  plan_name: string;
  session_id: string;
  session_number: number | null;
  payment_type: string;
  location: string;
  location_id: string;
  amount: string;
  description: string;
  notes: string;
  date: string;
}

const PaymentScreen: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [therapyPlans, setTherapyPlans] = useState<TherapyPlan[]>([]);
  const [availableSessions, setAvailableSessions] = useState<TherapySession[]>(
    [],
  );
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNoPlanModal, setShowNoPlanModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<PaymentFormData>({
    payment_type_mode: "direct",
    payment_reason: "",
    plan_id: "",
    plan_name: "",
    session_id: "",
    session_number: null,
    payment_type: "Cash",
    location: "",
    location_id: "",
    amount: "",
    description: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTherapyPlans();
  }, [patientId]);

  const fetchTherapyPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/get/plans/${patientId}`);
      if (response.status === 200 && response.data.therapy_plans) {
        setTherapyPlans(response.data.therapy_plans);
      }
    } catch (error) {
      console.error("Error fetching therapy plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof PaymentFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePaymentModeChange = (mode: "plan" | "direct") => {
    // Check if switching to plan mode and no plans available
    if (mode === "plan" && therapyPlans.length === 0) {
      setShowNoPlanModal(true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      payment_type_mode: mode,
      plan_id: mode === "direct" ? "" : prev.plan_id,
      plan_name: mode === "direct" ? "" : prev.plan_name,
      session_id: mode === "direct" ? "" : prev.session_id,
      session_number: mode === "direct" ? null : prev.session_number,
    }));
    setAvailableSessions([]);
    setErrors({});
  };

  const handlePlanSelection = (planId: string) => {
    const selectedPlan = therapyPlans.find((p) => p._id === planId);

    setFormData((prev) => ({
      ...prev,
      plan_id: planId,
      plan_name: selectedPlan?.therapy_name || "",
      session_id: "",
      session_number: null,
      amount: selectedPlan?.per_session_amount?.toString() || prev.amount,
    }));

    if (selectedPlan?.therapy_sessions) {
      setAvailableSessions(selectedPlan.therapy_sessions);
    } else {
      setAvailableSessions([]);
    }

    setErrors((prev) => ({ ...prev, plan_id: "" }));
  };

  const handleSessionSelection = (sessionId: string) => {
    const selectedSession = availableSessions.find((s) => s._id === sessionId);
    const selectedPlan = therapyPlans.find((p) => p._id === formData.plan_id);

    setFormData((prev) => ({
      ...prev,
      session_id: sessionId,
      session_number: selectedSession?.session_number || null,
      amount: selectedPlan?.per_session_amount?.toString() || prev.amount,
    }));

    setErrors((prev) => ({ ...prev, session_id: "" }));
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setFormData((prev) => ({
      ...prev,
      location: location.name,
      location_id: location._id,
    }));
    setErrors((prev) => ({ ...prev, location: "" }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.amount.trim() || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (!formData.location.trim() || !formData.location_id) {
      newErrors.location = "Please select a location";
    }

    if (!formData.payment_type || formData.payment_type === "") {
      newErrors.payment_type = "Please select a payment type";
    }

    if (formData.payment_type_mode === "plan") {
      if (!formData.plan_id) {
        newErrors.plan_id = "Please select a therapy plan";
      }
      if (!formData.session_id) {
        newErrors.session_id = "Please select a session";
      }
    } else {
      if (!formData.payment_reason.trim()) {
        newErrors.payment_reason =
          "Payment reason is required for direct payments";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let url;
      let paymentData;

      if (formData.payment_type_mode === "plan") {
        paymentData = {
          amount: parseFloat(formData.amount),
          type: formData.payment_type,
          addon_services: [],
          location_address: formData.location,
          location_name: formData.location,
          location_id: formData.location_id,
        };

        url = formData.session_id
          ? `/put/payment/${formData.plan_id}/${formData.session_id}`
          : `/put/payment/${formData.plan_id}`;
      } else {
        paymentData = {
          amount: parseFloat(formData.amount),
          type: formData.payment_type,
          addon_services: [],
          location_address: formData.location,
          location_name: formData.location,
          location_id: formData.location_id,
          description: formData.payment_reason || formData.description,
          notes: formData.notes || null,
          date: new Date(formData.date).toISOString(),
        };

        url = `/put/payment/patient/${patientId}`;
      }

      const response = await api.post(url, paymentData);

      if (response.status === 200 || response.status === 201) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate(-1);
        }, 2000);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(error.response?.data?.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles["page-container"]}>
        <div className={styles["loading-container"]}>
          <div className={styles.spinner}></div>
          <p className={styles["loading-text"]}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["page-container"]}>
      {/* No Plan Modal */}
      {showNoPlanModal && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setShowNoPlanModal(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-icon-warning"]}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className={styles["modal-title"]}>No Plans Available</h3>
            <p className={styles["modal-message"]}>
              This patient doesn't have any active therapy plans. You cannot
              record a plan payment without an active plan.
            </p>
            <p className={styles["modal-submessage"]}>
              Please use "Direct Payment" option or create a therapy plan first.
            </p>
            <button
              className={styles["modal-button"]}
              onClick={() => setShowNoPlanModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className={styles["success-popup"]}>
          <FaCheckCircle className={styles["success-icon"]} />
          <div>
            <h4 className={styles["success-title"]}>Success!</h4>
            <p className={styles["success-message"]}>
              Payment recorded successfully
            </p>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles["header-title"]}>Record Payment</h1>
      </header>

      <div className={styles["content-container"]}>
        <div className={`${styles.card} ${styles["form-card"]}`}>
          {/* Payment Mode Selector */}
          <div className={styles["mode-container"]}>
            <label className={styles["input-label"]}>
              Payment Mode <span className={styles.mandatory}>*</span>
            </label>
            <div className={styles["toggle-container"]}>
              <button
                className={`${styles["toggle-button"]} ${
                  formData.payment_type_mode === "direct" ? styles.active : ""
                }`}
                onClick={() => handlePaymentModeChange("direct")}
              >
                Direct Payment
              </button>
              <button
                className={`${styles["toggle-button"]} ${
                  formData.payment_type_mode === "plan" ? styles.active : ""
                } ${therapyPlans.length === 0 ? styles.disabled : ""}`}
                onClick={() => handlePaymentModeChange("plan")}
                disabled={therapyPlans.length === 0}
              >
                Plan Payment
                {therapyPlans.length === 0 && (
                  <span className={styles["disabled-badge"]}>(No Plans)</span>
                )}
              </button>
            </div>
          </div>

          {/* Two Column Layout for Forms */}
          <div className={styles["form-grid"]}>
            {/* Left Column */}
            <div className={styles["form-column"]}>
              {/* Direct Payment Fields */}
              {formData.payment_type_mode === "direct" && (
                <>
                  <div className={styles["input-container"]}>
                    <label className={styles["input-label"]}>
                      Payment Date <span className={styles.mandatory}>*</span>
                    </label>
                    <div className={styles["input-wrapper"]}>
                      <input
                        type="date"
                        className={styles.input}
                        value={formData.date}
                        onChange={(e) =>
                          handleInputChange("date", e.target.value)
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  <div className={styles["input-container"]}>
                    <label className={styles["input-label"]}>
                      Payment Reason / Description{" "}
                      <span className={styles.mandatory}>*</span>
                    </label>
                    <textarea
                      className={`${styles.input} ${styles.textarea}`}
                      placeholder="Enter payment reason"
                      value={formData.payment_reason}
                      onChange={(e) =>
                        handleInputChange("payment_reason", e.target.value)
                      }
                      rows={3}
                    />
                    {errors.payment_reason && (
                      <span className={styles["error-text"]}>
                        {errors.payment_reason}
                      </span>
                    )}
                  </div>

                  <div className={styles["input-container"]}>
                    <label className={styles["input-label"]}>
                      Additional Notes
                    </label>
                    <textarea
                      className={`${styles.input} ${styles.textarea}`}
                      placeholder="Any additional notes (optional)"
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Plan Payment Fields */}
              {formData.payment_type_mode === "plan" && (
                <>
                  <div className={styles["input-container"]}>
                    <label className={styles["input-label"]}>
                      Therapy Plan <span className={styles.mandatory}>*</span>
                    </label>
                    <select
                      className={styles["form-select"]}
                      value={formData.plan_id}
                      onChange={(e) => handlePlanSelection(e.target.value)}
                    >
                      <option value="">Select a therapy plan</option>
                      {therapyPlans.map((plan) => (
                        <option key={plan._id} value={plan._id}>
                          {plan.therapy_name} (Balance: ₹{plan.balance})
                        </option>
                      ))}
                    </select>
                    {errors.plan_id && (
                      <span className={styles["error-text"]}>
                        {errors.plan_id}
                      </span>
                    )}
                  </div>

                  {formData.plan_id && availableSessions.length > 0 && (
                    <div className={styles["input-container"]}>
                      <label className={styles["input-label"]}>
                        Session <span className={styles.mandatory}>*</span>
                      </label>
                      <select
                        className={styles["form-select"]}
                        value={formData.session_id}
                        onChange={(e) => handleSessionSelection(e.target.value)}
                      >
                        <option value="">Select a session</option>
                        {availableSessions.map((session) => (
                          <option key={session._id} value={session._id}>
                            Session {session.session_number} -{" "}
                            {formatDate(session.date)} ({session.status})
                          </option>
                        ))}
                      </select>
                      {errors.session_id && (
                        <span className={styles["error-text"]}>
                          {errors.session_id}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column */}
            <div className={styles["form-column"]}>
              {/* Amount */}
              <div className={styles["input-container"]}>
                <label className={styles["input-label"]}>
                  Amount <span className={styles.mandatory}>*</span>
                </label>
                <div className={styles["input-wrapper"]}>
                  <span className={styles["currency-symbol"]}>₹</span>
                  <input
                    type="number"
                    className={`${styles.input} ${styles["amount-input"]}`}
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                  />
                </div>
                {errors.amount && (
                  <span className={styles["error-text"]}>{errors.amount}</span>
                )}
              </div>

              {/* Payment Type */}
              <div className={styles["input-container"]}>
                <label className={styles["input-label"]}>
                  Payment Type <span className={styles.mandatory}>*</span>
                </label>
                <div className={styles["payment-type-selector"]}>
                  {["Cash", "Online", "Counter"].map((type) => (
                    <button
                      key={type}
                      className={`${styles["type-button"]} ${
                        formData.payment_type === type ? styles.selected : ""
                      }`}
                      onClick={() => handleInputChange("payment_type", type)}
                    >
                      {type === "Cash" ? (
                        <FaMoneyBillWave />
                      ) : type === "Online" ? (
                        <FaCreditCard />
                      ) : (
                        <FaCreditCard />
                      )}
                      <span>{type === "Counter" ? "At Counter" : type}</span>
                    </button>
                  ))}
                </div>
                {errors.payment_type && (
                  <span className={styles["error-text"]}>
                    {errors.payment_type}
                  </span>
                )}
              </div>

              {/* Location - Using LocationPicker */}
              <div className={styles["input-container"]}>
                <label className={styles["input-label"]}>
                  Location <span className={styles.mandatory}>*</span>
                </label>
                <LocationPicker
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                  disabled={false}
                  showSetAsDefault={true}
                  autoSelectPreferred={true}
                />
                {errors.location && (
                  <span className={styles["error-text"]}>
                    {errors.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Buttons - Full Width at Bottom */}
          <div className={styles["button-container"]}>
            <button
              className={`${styles.button} ${styles["secondary-button"]}`}
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <button
              className={`${styles.button} ${styles["primary-button"]}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
