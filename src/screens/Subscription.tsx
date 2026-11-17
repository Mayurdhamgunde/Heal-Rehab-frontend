import { useState, type JSX } from "react";
import { CheckCircle, X, AlertTriangle, CreditCard, XCircle } from "lucide-react";
import { FaCrown, FaGem, FaShieldAlt } from "react-icons/fa";
import api from "../utils/central"; // Your central API service
import styles from "../css/Subscription.module.css";

// Define interfaces for our types
interface PlanFeature {
  name: string;
  included: boolean;
}
declare global {
  interface Window {
    Razorpay: any;
  }
}
interface PlanType {
  id: PlanKey;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  popularPlan?: boolean;
  icon: JSX.Element;
}

// Define plan key type for type safety
type PlanKey = 'basic' | 'professional' | 'enterprise';
type BillingCycle = 'monthly' | 'yearly';

interface SubscriptionData {
  plan: PlanKey;
  billing_cycle: BillingCycle;
  payment_method: string;
  price_paid: number;
  billing_information: {
    name: string;
    email: string;
    phone: string;
  };
}

const SubscriptionPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  // Plan details with updated UI structure
  const plans: PlanType[] = [
    {
      id: "basic",
      name: "Basic",
      monthlyPrice: 999,
      yearlyPrice: 9990,
      icon: <FaShieldAlt className={styles.planIcon} />,
      features: [
        { name: "Up to 100 patients", included: true },
        { name: "Basic appointment scheduling", included: true },
        { name: "Patient records management", included: true },
        { name: "Email support", included: true },
        { name: "Progress tracking analytics", included: false },
        { name: "Custom reports", included: false },
        { name: "API access", included: false },
        { name: "Custom integrations", included: false }
      ]
    },
    {
      id: "professional",
      name: "Professional",
      monthlyPrice: 1999,
      yearlyPrice: 19990,
      icon: <FaGem className={styles.planIcon} />,
      popularPlan: true,
      features: [
        { name: "Up to 500 patients", included: true },
        { name: "Advanced appointment scheduling", included: true },
        { name: "Patient records management", included: true },
        { name: "Progress tracking analytics", included: true },
        { name: "Email and phone support", included: true },
        { name: "Custom reports", included: true },
        { name: "API access", included: false },
        { name: "Custom integrations", included: false }
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: 4999,
      yearlyPrice: 49990,
      icon: <FaCrown className={styles.planIcon} />,
      features: [
        { name: "Unlimited patients", included: true },
        { name: "Full feature access", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Priority support", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "API access", included: true },
        { name: "Custom integrations", included: true },
        { name: "White labeling", included: true }
      ]
    }
  ];

  const handleSelectPlan = (plan: PlanKey) => {
    setSelectedPlan(plan);
    setError("");
  };

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
  };

  const getCurrentPrice = (plan: PlanKey): number => {
    const selectedPlanData = plans.find(p => p.id === plan);
    if (!selectedPlanData) return 0;
    return billingCycle === "monthly" 
      ? selectedPlanData.monthlyPrice 
      : selectedPlanData.yearlyPrice;
  };

  const handleSubscribe = async () => {
  if (!selectedPlan) {
    setError("Please select a plan to continue");
    return;
  }

  setLoading(true);
  setError("");

  try {
    // Step 1: Create Razorpay order from backend
    const orderResponse = await api.post("/create-razorpay-order", {
      plan: selectedPlan,
      billingCycle: billingCycle
    });

    const { order, planDetails } = orderResponse.data;
    const { amount } = planDetails;

    // Retrieve user data from local storage
    const user = localStorage.getItem("user");
    const userData = user ? JSON.parse(user) : {};

    // Step 2: Open Razorpay Checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
      amount: amount * 100,
      currency: "INR",
      name: "HealTrack",
      description: "Subscription Purchase",
      image: "https://healtrackai.com/assets/HTic-Dm-I03Et.png",
      order_id: order.id,
      handler: async function (response: any) {
        try {
          // Prepare subscription data
          const subscriptionData: SubscriptionData = {
            plan: selectedPlan,
            billing_cycle: billingCycle,
            payment_method: "razorpay",
            price_paid: amount,
            billing_information: {
              name: userData.userName || "",
              email: userData.email || "",
              phone: userData.phoneNumber || ""
            }
          };

          // Verify payment and create subscription
          const verifyResponse = await api.post("/purchase/plan", {
            ...subscriptionData,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          if (verifyResponse.status === 201) {
            setSuccess(true);
            // Redirect after successful subscription
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 2000);
          } else {
            throw new Error("Subscription creation failed");
          }
        } catch (bookingErr) {
          console.error("Subscription after payment failed:", bookingErr);
          setError("Payment succeeded but subscription creation failed.");
        }
      },
      prefill: {
        name: userData.userName,
        email: userData.email,
        contact: userData.phoneNumber,
      },
      theme: {
        color: "#007B8E",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (err) {
    console.error("Error during Razorpay subscription flow:", err);
    setError("Failed to initiate payment. Try again later.");
  } finally {
    setLoading(false);
  }
};
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Wellness Tracking Tiers</h2>
        <p className={styles.subtitle}>
          Select the perfect subscription that fits your health tracking needs
        </p>
      </div>

      {/* Billing toggle */}
      <div className={styles.billingToggleContainer}>
        <div className={styles.billingToggle}>
          <button
            type="button"
            className={`${styles.billingOption} ${billingCycle === "monthly" ? styles.active : ""}`}
            onClick={() => handleBillingCycleChange("monthly")}
          >
            Monthly billing
          </button>
          <button
            type="button"
            className={`${styles.billingOption} ${billingCycle === "yearly" ? styles.active : ""}`}
            onClick={() => handleBillingCycleChange("yearly")}
          >
            Yearly billing
            <span className={styles.discountBadge}>Save 16%</span>
          </button>
        </div>
      </div>
      
      {/* Pricing cards */}
      <div className={styles.pricingCards}>
        {plans.map((plan) => {
          const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          
          return (
            <div
              key={plan.id}
              className={`${styles.pricingCard} ${plan.popularPlan ? styles.popularPlan : ""} ${selectedPlan === plan.id ? styles.selected : ""}`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {plan.popularPlan && (
                <div className={styles.popularBadge}>Most Popular</div>
              )}
              <div className={styles.pricingHeader}>
                <div className={styles.planIconContainer}>
                  {plan.icon}
                </div>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planPrice}>
                  <span className={styles.priceAmount}>{formatPrice(price)}</span>
                  <span className={styles.pricePeriod}>
                    /{billingCycle === "monthly" ? "mo" : "year"}
                  </span>
                </p>
                <button
                  type="button"
                  className={`${styles.subscribeButton} ${plan.popularPlan ? styles.popularButton : ""} ${selectedPlan === plan.id ? styles.selected_button : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                >
                  {selectedPlan === plan.id ? "Selected" : "Get Started"}
                </button>
              </div>
              <div className={styles.featuresContainer}>
                <h4 className={styles.featuresTitle}>What's Included</h4>
                <ul className={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <li key={index} className={styles.featureItem}>
                      {feature.included ? (
                        <CheckCircle className={`${styles.featureIcon} ${styles.included}`} size={18} />
                      ) : (
                        <XCircle className={`${styles.featureIcon} ${styles.excluded}`} size={18} />
                      )}
                      <span
                        className={`${styles.featureName} ${
                          feature.included ? styles.included : styles.excluded
                        }`}
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary and action only shown when plan is selected */}
      {selectedPlan && (
        <div className={styles.summary_container}>
          <h3 className={styles.summary_title}>Order Summary</h3>
          
          <div className={styles.summary_row}>
            <span>Plan:</span>
            <span>{plans.find(p => p.id === selectedPlan)?.name}</span>
          </div>
          
          <div className={styles.summary_row}>
            <span>Billing:</span>
            <span>{billingCycle === "monthly" ? "Monthly" : "Yearly"}</span>
          </div>
          
          <div className={`${styles.summary_row} ${styles.amount_row}`}>
            <span>Amount:</span>
            <span className={styles.amount}>{formatPrice(getCurrentPrice(selectedPlan))}</span>
          </div>
          
          <button
            className={styles.subscribe_button}
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.loading_container}>
                <svg className={styles.spinner} viewBox="0 0 24 24">
                  <circle
                    className={styles.spinner_circle}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className={styles.spinner_path}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <CreditCard className={styles.button_icon} size={20} />
                Get Started
              </>
            )}
          </button>
          
          <p className={styles.redirect_text}>
            You will be redirected to complete the payment process
          </p>
        </div>
      )}
      
      {/* FAQ Section */}
      <div className={styles.faqSection}>
        <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
        <div className={styles.faqItems}>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>Can I cancel my subscription?</h4>
            <p className={styles.faqAnswer}>
              Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access to your plan until the end of your billing period.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>How secure is my health data?</h4>
            <p className={styles.faqAnswer}>
              We take security seriously. Your data is encrypted both in transit and at rest, and we comply with all relevant healthcare data regulations.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>Do you offer refunds?</h4>
            <p className={styles.faqAnswer}>
              We offer a 30-day money-back guarantee. If you're not satisfied with your subscription within the first 30 days, contact our support team for a full refund.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>Can I switch between plans?</h4>
            <p className={styles.faqAnswer}>
              Absolutely! You can upgrade or downgrade your subscription at any time. Changes to your subscription will be applied immediately, with prorated charges for the billing period.
            </p>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className={styles.error_container}>
          <AlertTriangle className={styles.alert_icon} size={20} />
          <span>{error}</span>
          <button 
            className={styles.dismiss_button} 
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            <X className={styles.close_icon} size={20} />
          </button>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className={styles.success_container}>
          <CheckCircle className={styles.success_icon} size={20} />
          <span>Subscription purchased successfully! Redirecting...</span>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;