import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaPlus,
  FaTimes,
  FaCheckCircle,
  FaCalendarAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaChartLine,
  FaTrash,
} from "react-icons/fa";
import api from "../utils/central";
import styles from "../css/paymentDetails.module.css";

interface Addon {
  name: string;
  amount: number;
}

interface TherapySession {
  _id: string;
  status: string;
  date: string;
  session_number: number;
}

interface PaymentInfo {
  therapy_name: string;
  payment_summary: {
    total_amount: number;
    received_amount: number;
    balance: number;
    addons_amount: number;
  };
  session_info: {
    per_session_amount: number;
    estimated_sessions: number;
    completed_sessions: number;
    remaining_sessions: number;
  };
  payment_structure: {
    payment_type: string;
    next_payment_due: string;
    next_payment_number?: number;
  };
  addons: Array<any>;
  payment_history: Array<{
    payment_number: any;
    amount: number;
    date: string;
    type: string;
    session_number: number;
    addon_services?: Addon[];
    therapyId?: string;
  }>;
  therapy_sessions?: TherapySession[];
}

const SkeletonLoader: React.FC = () => {
  return (
    <div className={styles["page-container"]}>
      <header className={styles.header}>
        <div className={styles["skeleton-header-title"]}></div>
      </header>
      <div className={styles["content-container"]}>
        <div className={`${styles.card} ${styles["summary-card"]}`}>
          <div className={styles["amount-row"]}>
            <div className={styles["skeleton-amount-box"]}>
              <div className={styles["skeleton-amount-label"]}></div>
              <div className={styles["skeleton-amount-value"]}></div>
            </div>
            <div className={styles["skeleton-amount-box"]}>
              <div className={styles["skeleton-amount-label"]}></div>
              <div className={styles["skeleton-amount-value"]}></div>
            </div>
          </div>
          <div className={styles["amount-row"]}>
            <div className={styles["skeleton-amount-box"]}>
              <div className={styles["skeleton-amount-label"]}></div>
              <div className={styles["skeleton-amount-value"]}></div>
            </div>
            <div className={styles["skeleton-addons-container"]}>
              <div className={styles["skeleton-addons-label"]}></div>
              <div className={styles["skeleton-addons-value"]}></div>
            </div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles["skeleton-section-title"]}></div>
          <div className={styles["session-grid"]}>
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className={styles["skeleton-session-item"]}>
                <div className={styles["skeleton-session-label"]}></div>
                <div className={styles["skeleton-session-value"]}></div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles["payment-structure-history-row"]}>
          <div className={styles.card}>
            <div className={styles["skeleton-section-title"]}></div>
            <div className={styles["skeleton-payment-type-container"]}>
              <div className={styles["skeleton-payment-type-label"]}></div>
              <div className={styles["skeleton-payment-type-badge"]}></div>
            </div>
            <div className={styles["skeleton-next-payment-container"]}>
              <div className={styles["skeleton-next-payment-label"]}></div>
              <div className={styles["skeleton-next-payment-date"]}></div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles["skeleton-section-title"]}></div>
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className={styles["skeleton-payment-history-item"]}
              >
                <div className={styles["skeleton-payment-history-content"]}>
                  <div className={styles["skeleton-payment-history-left"]}>
                    <div
                      className={styles["skeleton-payment-history-session"]}
                    ></div>
                    <div
                      className={styles["skeleton-payment-history-date"]}
                    ></div>
                  </div>
                  <div className={styles["skeleton-payment-history-right"]}>
                    <div
                      className={styles["skeleton-payment-history-amount"]}
                    ></div>
                    <div
                      className={styles["skeleton-payment-history-type"]}
                    ></div>
                  </div>
                </div>
                <div className={styles["skeleton-delete-button"]}></div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles["button-container"]}>
          <div className={styles["skeleton-button"]}></div>
          <div className={styles["skeleton-button"]}></div>
        </div>
      </div>
    </div>
  );
};

const PaymentDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string; patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<TherapySession[]>(
    [],
  );
  const [filteredSessions, setFilteredSessions] = useState<TherapySession[]>(
    [],
  );
  const [selectedSession, setSelectedSession] = useState<TherapySession | null>(
    null,
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSessionDropdownVisible, setIsSessionDropdownVisible] =
    useState(false);

  // Modal form states
  const [amount, setAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("CASH");
  const [addons, setAddons] = useState<Addon[]>([]);
  const [addonInput, setAddonInput] = useState<string>("");
  const [addonAmount, setAddonAmount] = useState<string>("");
  const [isAdditionalServicesOpen, setIsAdditionalServicesOpen] =
    useState(false);

  useEffect(() => {
    fetchPaymentInfo();
    fetchPlanDetails();
  }, [planId]);

  useEffect(() => {
    if (availableSessions.length > 0 && paymentInfo?.payment_history) {
      filterAvailableSessions();
    }
  }, [availableSessions, paymentInfo]);

  useEffect(() => {
    if (
      isPaymentModalVisible &&
      paymentInfo?.session_info?.per_session_amount
    ) {
      setPaymentType("CASH");
      setAmount(
        paymentInfo.payment_summary.balance > 0
          ? paymentInfo.session_info.per_session_amount.toString()
          : "0",
      );
    } else {
      setAmount("");
    }
  }, [isPaymentModalVisible, paymentInfo]);

  const fetchPaymentInfo = async () => {
    try {
      setError(null);
      const response = await api.get(`/get/paymentinfo/${planId}`);
      if (response.status === 200 && response.data) {
        setPaymentInfo(response.data);
      }
    } catch (error) {
      setError("Failed to fetch payment details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetails = async () => {
    try {
      const response = await api.get(`/get/plan/${planId}`);
      if (
        response.status === 200 &&
        response.data.therapy_plan.therapy_sessions
      ) {
        setAvailableSessions(response.data.therapy_plan.therapy_sessions);
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
    }
  };

  const filterAvailableSessions = () => {
    if (!availableSessions.length) {
      setFilteredSessions([]);
      setSelectedSession(null);
      return;
    }

    if (
      !paymentInfo?.payment_history ||
      paymentInfo.payment_history.length === 0
    ) {
      setFilteredSessions(availableSessions);
      setSelectedSession(
        availableSessions.length > 0 ? availableSessions[0] : null,
      );
      return;
    }

    const paidSessionIds = new Set(
      paymentInfo.payment_history
        .map((payment) => payment.therapyId)
        .filter((id) => id),
    );
    const filtered = availableSessions.filter(
      (session) => !paidSessionIds.has(session._id),
    );
    setFilteredSessions(filtered);
    setSelectedSession(filtered.length > 0 ? filtered[0] : null);
  };

  const handleRecordPayment = async (
    amount: number,
    type: string,
    addons: Addon[] = [],
  ) => {
    try {
      if (!selectedSession) {
        alert("Please select a session");
        return;
      }
      setLoading(true);
      const formData = {
        amount,
        type,
        session_number: selectedSession.session_number,
        addon_services: addons.map((addon) => ({
          name: addon.name,
          amount: addon.amount,
        })),
      };
      const response = await api.post(
        `/put/payment/${planId}/${selectedSession._id}`,
        formData,
      );
      if (response.status === 200) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await fetchPaymentInfo();
        await fetchPlanDetails();
      } else {
        alert("Failed to record payment");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while recording payment");
    } finally {
      setLoading(false);
      setIsPaymentModalVisible(false);
    }
  };

  const handleDeletePayment = async (payment: any) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        setLoading(true);
        const response = await api.delete(
          `/plans/${planId}/payments/${payment.date}`,
        );
        if (response.status === 200) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          await fetchPaymentInfo();
        } else {
          alert("Failed to delete payment");
        }
      } catch (error) {
        console.error(error);
        alert("An error occurred while deleting payment");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹ ${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case "CASH":
        return <FaMoneyBillWave />;
      case "ONLINE":
        return <FaCreditCard />;
      case "Counter":
        return <FaCreditCard />;
      default:
        return <FaMoneyBillWave />;
    }
  };

  const handleAddonSubmit = () => {
    if (addonInput.trim() && addonAmount.trim()) {
      const numAmount = parseFloat(addonAmount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const existingAddonIndex = addons.findIndex(
          (addon) => addon.name === addonInput.trim(),
        );

        if (existingAddonIndex >= 0) {
          const newAddons = [...addons];
          newAddons[existingAddonIndex].amount = numAmount;
          setAddons(newAddons);
        } else {
          setAddons([
            ...addons,
            { name: addonInput.trim(), amount: numAmount },
          ]);
        }
        setAddonInput("");
        setAddonAmount("");
      }
    }
  };

  const calculateBaseAmount = () => {
    return parseFloat(amount) || 0;
  };

  const calculateAddonTotal = () => {
    return addons.reduce((sum, addon) => sum + addon.amount, 0);
  };

  const calculateTotalAmount = () => {
    return calculateBaseAmount() + calculateAddonTotal();
  };

  const openPaymentModal = () => {
    setIsPaymentModalVisible(true);
  };

  const submitPayment = () => {
    const numAmount = parseFloat(amount);
    const totalAmount = calculateTotalAmount();
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (paymentInfo && totalAmount > paymentInfo.payment_summary.balance) {
      alert("Payment amount exceeds the remaining balance");
      return;
    }
    handleRecordPayment(numAmount, paymentType, addons);
  };

  const renderSessionDropdown = () => (
    <div className={styles["session-selection-card"]}>
      <h3 className={styles["section-title"]}>Select Session</h3>
      {filteredSessions.length === 0 ? (
        <div className={styles["no-data-container"]}>
          <p className={styles["no-data-text"]}>
            All sessions have been paid for or no sessions available
          </p>
        </div>
      ) : (
        <>
          <div
            className={styles["dropdown-button"]}
            onClick={() =>
              setIsSessionDropdownVisible(!isSessionDropdownVisible)
            }
          >
            <span className={styles["dropdown-button-text"]}>
              {selectedSession
                ? `Session ${selectedSession.session_number} - ${formatDate(selectedSession.date)}`
                : "Select a session"}
            </span>
            <span
              className={`${styles["dropdown-arrow"]} ${
                isSessionDropdownVisible ? styles["dropdown-arrow-open"] : ""
              }`}
            >
              ▼
            </span>
          </div>
          {isSessionDropdownVisible && (
            <div className={styles["session-list-container"]}>
              <div className={styles["session-list"]}>
                {filteredSessions.map((session) => (
                  <div
                    key={session._id}
                    className={`${styles["session-option"]} ${
                      selectedSession?._id === session._id
                        ? styles["selected-session-option"]
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedSession(session);
                      setIsSessionDropdownVisible(false);
                    }}
                  >
                    <div className={styles["session-option-content"]}>
                      <div className={styles["session-option-header"]}>
                        <span className={styles["session-option-number"]}>
                          Session {session.session_number}
                        </span>
                        <span
                          className={`${styles["status-badge"]} ${
                            session.status === "completed"
                              ? styles["completed-badge"]
                              : session.status === "In Progress"
                                ? styles["in-progress-badge"]
                                : styles["scheduled-badge"]
                          }`}
                        >
                          {session.status}
                        </span>
                        <span className={styles["session-option-date"]}>
                          {formatDate(session.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !paymentInfo) {
    return (
      <div className={styles["error-container"]}>
        <p className={styles["error-text"]}>
          {error || "Failed to load payment details"}
        </p>
        <button className={styles["retry-button"]} onClick={fetchPaymentInfo}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles["page-container"]}>
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
        <h1 className={styles["header-title"]}>
          Payment Details - {paymentInfo.therapy_name}
        </h1>
      </header>

      <div className={styles["content-container"]}>
        <div className={`${styles.card} ${styles["summary-card"]}`}>
          <div className={styles["amount-row"]}>
            <div className={styles["amount-box"]}>
              <span className={styles["amount-label"]}>Total Amount</span>
              <span className={styles["amount-value"]}>
                {formatCurrency(paymentInfo.payment_summary.total_amount)}
              </span>
            </div>
            <div className={styles["amount-box"]}>
              <span className={styles["amount-label"]}>Received</span>
              <span className={styles["amount-value"]}>
                {formatCurrency(paymentInfo.payment_summary.received_amount)}
              </span>
            </div>
          </div>
          <div className={styles["amount-row"]}>
            <div className={styles["amount-box"]}>
              <span className={styles["amount-label"]}>Balance</span>
              <span className={`${styles["amount-value"]} ${styles.balance}`}>
                {formatCurrency(paymentInfo.payment_summary.balance)}
              </span>
            </div>
            <div className={styles["addons-container"]}>
              <span className={styles["addons-label"]}>Add-ons</span>
              <span className={styles["addons-value"]}>
                {formatCurrency(paymentInfo.payment_summary.addons_amount)}
              </span>
            </div>
          </div>
        </div>
        {renderSessionDropdown()}
        <div className={styles.card}>
          <h3 className={styles["section-title"]}>
            <FaChartLine />
            Session Information
          </h3>
          <div className={styles["session-grid"]}>
            <div className={styles["session-item"]}>
              <span className={styles["session-label"]}>Per Session</span>
              <span className={styles["session-value"]}>
                {formatCurrency(paymentInfo.session_info.per_session_amount)}
              </span>
            </div>
            <div className={styles["session-item"]}>
              <span className={styles["session-label"]}>
                Estimated Sessions
              </span>
              <span className={styles["session-value"]}>
                {paymentInfo.session_info.estimated_sessions}
              </span>
            </div>
            <div className={styles["session-item"]}>
              <span className={styles["session-label"]}>Completed</span>
              <span className={styles["session-value"]}>
                {paymentInfo.session_info.completed_sessions}
              </span>
            </div>
            <div className={styles["session-item"]}>
              <span className={styles["session-label"]}>Remaining</span>
              <span className={styles["session-value"]}>
                {paymentInfo.session_info.remaining_sessions}
              </span>
            </div>
          </div>
        </div>
        <div className={styles["payment-structure-history-row"]}>
          <div className={styles.card}>
            <h3 className={styles["section-title"]}>
              <FaCalendarAlt />
              Payment Structure
            </h3>
            <div className={styles["payment-type-container"]}>
              <span className={styles["payment-type-label"]}>
                Payment Type:
              </span>
              <span className={styles["payment-type-badge"]}>
                {paymentInfo.payment_structure.payment_type}
              </span>
            </div>
            <div className={styles["next-payment-container"]}>
              <span className={styles["next-payment-label"]}>
                Next Payment Due:
              </span>
              <span className={styles["next-payment-date"]}>
                {formatDate(paymentInfo.payment_structure.next_payment_due)}
              </span>
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles["section-title"]}>
              <FaCreditCard />
              Payment History
            </h3>
            {paymentInfo.payment_history.length > 0 ? (
              <div>
                {paymentInfo.payment_history.map((payment, index) => (
                  <div key={index} className={styles["payment-history-item"]}>
                    <div className={styles["payment-history-content"]}>
                      <div className={styles["payment-history-left"]}>
                        <span className={styles["payment-history-session"]}>
                          Session #{payment.session_number}
                        </span>
                        <span className={styles["payment-history-date"]}>
                          {formatDate(payment.date)}
                        </span>
                      </div>
                      <div className={styles["payment-history-right"]}>
                        <span className={styles["payment-history-amount"]}>
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className={styles["payment-history-type"]}>
                          {getPaymentTypeIcon(payment.type)}
                          {payment.type === "Counter"
                            ? "At Counter"
                            : payment.type}
                        </span>
                      </div>
                    </div>
                    <button
                      className={styles["delete-button"]}
                      onClick={() => handleDeletePayment(payment)}
                      title="Delete Payment"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles["no-data-container"]}>
                <p className={styles["no-data-text"]}>
                  No payment history available
                </p>
              </div>
            )}
          </div>
        </div>
        <div className={styles["button-container"]}>
          <button
            className={`${styles.button} ${styles["close-button"]}`}
            onClick={() => setIsCloseModalVisible(true)}
          >
            Close
          </button>
          <button
            className={`${styles.button} ${styles["record-payment-button"]} ${
              !selectedSession || filteredSessions.length === 0
                ? styles["disabled-button"]
                : ""
            }`}
            onClick={openPaymentModal}
            disabled={!selectedSession || filteredSessions.length === 0}
          >
            <FaPlus />
            Record Payment
          </button>
        </div>
      </div>

      {isPaymentModalVisible && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setIsPaymentModalVisible(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-inner"]}>
              <h2 className={styles["modal-title"]}>Record Payment</h2>
              {selectedSession && (
                <div className={styles["selected-session-container"]}>
                  <span className={styles["selected-session-label"]}>
                    Selected Session:
                  </span>
                  <span className={styles["selected-session-text"]}>
                    Session {selectedSession.session_number} -{" "}
                    {formatDate(selectedSession.date)}
                  </span>
                </div>
              )}
              {/* {paymentInfo.payment_structure.next_payment_number && (
                <div className={styles['payment-number-badge']}>
                  <span className={styles['payment-number-badge-text']}>
                    Payment #{paymentInfo.payment_structure.next_payment_number}
                  </span>
                </div>
              )} */}
              <div className={styles["input-section"]}>
                <label className={styles["input-label"]}>
                  Base Session Payment
                </label>
                <div className={styles["currency-input-container"]}>
                  <span className={styles["currency-symbol"]}>₹</span>
                  <input
                    type="number"
                    className={styles["currency-input"]}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className={styles["input-section"]}>
                <label className={styles["input-label"]}>Payment Method</label>
                <div className={styles["payment-type-selector"]}>
                  {["CASH", "ONLINE", "Counter"].map((type) => (
                    <button
                      key={type}
                      className={`${styles["type-button"]} ${paymentType === type ? styles.selected : ""}`}
                      onClick={() => setPaymentType(type)}
                    >
                      {type === "CASH"
                        ? "Cash"
                        : type === "ONLINE"
                          ? "Online"
                          : "At Counter"}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles["input-section"]}>
                <div className={styles["services-header"]}>
                  <button
                    className={styles["services-toggle-button"]}
                    onClick={() =>
                      setIsAdditionalServicesOpen(!isAdditionalServicesOpen)
                    }
                  >
                    <FaPlus
                      className={`${styles["services-icon"]} ${
                        isAdditionalServicesOpen
                          ? styles["services-icon-open"]
                          : ""
                      }`}
                    />
                    <span className={styles["services-header-text"]}>
                      Additional Services
                    </span>
                  </button>
                </div>
                {isAdditionalServicesOpen && (
                  <div className={styles["addon-input-container"]}>
                    <input
                      type="text"
                      className={styles["addon-name-input"]}
                      placeholder="Service Name"
                      value={addonInput}
                      onChange={(e) => setAddonInput(e.target.value)}
                    />
                    <div className={styles["currency-input-container"]}>
                      <span className={styles["currency-symbol"]}>₹</span>
                      <input
                        type="number"
                        className={styles["addon-amount-input"]}
                        placeholder="0.00"
                        value={addonAmount}
                        onChange={(e) => setAddonAmount(e.target.value)}
                      />
                    </div>
                    <button
                      className={styles["add-button"]}
                      onClick={handleAddonSubmit}
                    >
                      Add
                    </button>
                  </div>
                )}
                {addons.map((addon, index) => (
                  <div key={index} className={styles["addon-item"]}>
                    <span className={styles["addon-name"]}>{addon.name}</span>
                    <span className={styles["addon-amount"]}>
                      {formatCurrency(addon.amount)}
                    </span>
                    <button
                      className={styles["delete-button"]}
                      onClick={() =>
                        setAddons(addons.filter((_, i) => i !== index))
                      }
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles["total-container"]}>
                <span className={styles["total-label"]}>Total Payment</span>
                <span className={styles["total-amount"]}>
                  {formatCurrency(calculateTotalAmount())}
                </span>
              </div>
              <div className={styles["modal-buttons"]}>
                <button
                  className={`${styles["modal-button"]} ${styles["cancel-button"]}`}
                  onClick={() => setIsPaymentModalVisible(false)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles["modal-button"]} ${styles["submit-button"]}`}
                  onClick={submitPayment}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCloseModalVisible && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setIsCloseModalVisible(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-inner"]}>
              <h2 className={styles["modal-title"]}>Confirm Close</h2>
              <p>Are you sure you want to close this payment plan?</p>
              <div className={styles["modal-buttons"]}>
                <button
                  className={`${styles["modal-button"]} ${styles["cancel-button"]}`}
                  onClick={() => setIsCloseModalVisible(false)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles["modal-button"]} ${styles["submit-button"]}`}
                  onClick={() => {
                    setIsCloseModalVisible(false);
                    navigate(-1);
                  }}
                >
                  Close Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;
