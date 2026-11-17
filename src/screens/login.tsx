import { useState, useEffect, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Send, Lock, EyeOff, Eye, Mail } from "lucide-react";
import styles from "../css/login.module.css";
import api from "../utils/central";
import HTlogo from "../assets/HTic.png";
import ForgotPasswordPage from "../components/forgetpassword";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("password"); // "password", "otp", or "phone"
  const [step, setStep] = useState("request"); // "request" or "verify" (for OTP flow)
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const message = localStorage.getItem("loginMessage");
    if (message) {
      setLoginMessage(message);
      localStorage.removeItem("loginMessage");
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Email address is required");
      return false;
    } else if (!regex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  if (showForgotPassword) {
    return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />;
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEmailChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      validatePassword(value);
    } else {
      setPasswordError("");
    }
  };

  const handleOtpChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    // Only allow numbers
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    setOtp(sanitizedValue);
    setOtpError("");
  };

  const handleModeToggle = (newMode: SetStateAction<string>) => {
    setMode(newMode);
    setStep("request");
    setResendTimer(0);
    resetErrors();
  };

  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
    setOtpError("");
  };

  const handleRequestOtp = async () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    setLoading(true);
    try {
      await api.post("/sendOtp", { email });
      setStep("verify");
      setResendTimer(60); // 60 seconds cooldown
    } catch (error) {
      console.error("Error sending OTP", error);
      setOtpError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setResendLoading(true);
    try {
      await api.post("/sendOtp", { email });
      setResendTimer(60); // 60 seconds cooldown
      setOtpError("");
      setOtp(""); // Clear existing OTP input
    } catch (error) {
      console.error("Error resending OTP", error);
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const processSuccessfulLogin = (responseData: any) => {
    const {
      token,
      is_admin,
      doctor_id,
      doctor_first_name,
      doctor_last_name,
      doctor_photo,
      organization_industry,
      has_access_token,
      organization_location,
    } = responseData;

    const userData = {
      email,
      token,
      is_admin,
      doctor_id,
      doctor_first_name,
      doctor_last_name,
      doctor_photo,
      organization_industry,
      has_access_token,
      organization_location,
      lastLoginTime: new Date().toISOString(),
    };

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userToken", token);

    window.dispatchEvent(new Event("userLogin"));

    // Post-Login Setup Check
    const needsGoogleIntegration = !!(is_admin && !has_access_token);
    const needsLocationSetup =
      !organization_location || organization_location.length === 0;

    if (needsGoogleIntegration || needsLocationSetup) {
      navigate("/OrganizationSettings", {
        replace: true,
        state: {
          showGooglePopup: needsGoogleIntegration,
          showOrgPopup: needsLocationSetup,
        },
      });
    } else {
      // Force navigation to My Patients if setup is complete
      navigate("/MyPatients", { replace: true });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError("OTP is required");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/otpVerify", {
        email,
        otp,
      });

      if (response.data) {
        processSuccessfulLogin(response.data);
      }
    } catch (error) {
      console.error("Error verifying OTP", error);
      setOtpError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setLoading(true);
    try {
      const response = await api.post("/verify/password", {
        email,
        password,
      });

      if (response.data) {
        processSuccessfulLogin(response.data);
      }
    } catch (error) {
      console.error("Error logging in", error);
      setPasswordError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.login_container}>
      <div className={styles.login_left}>
        <h2 className={styles.login_heading}>Login</h2>
        <p className={styles.login_subtext}>
          Get access to your Appointments, Patient Records, and Progress
          Tracking
        </p>
      </div>

      <div className={styles.login_right}>
        <img src={HTlogo} alt="HealTrack Logo" className={styles.login_logo} />

        {loginMessage && (
          <div className={styles.login_message}>{loginMessage}</div>
        )}

        <div className={styles.toggle_container}>
          <button
            onClick={() => handleModeToggle("password")}
            className={`${styles.toggle_button} ${
              mode === "password" ? styles.active : ""
            }`}
          >
            Password
          </button>
          <button
            onClick={() => handleModeToggle("otp")}
            className={`${styles.toggle_button} ${
              mode === "otp" ? styles.active : ""
            }`}
          >
            OTP
          </button>
        </div>

        <div className={styles.input_container}>
          {mode === "password" && (
            <>
              <div className={styles.input_with_icon}>
                <Mail className={styles.input_icon} size={20} />
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`${styles.input_field} ${
                    emailError ? styles.input_error : ""
                  }`}
                />
              </div>
              {emailError && <p className={styles.error_text}>{emailError}</p>}

              <div className={styles.input_with_icon}>
                <Lock className={styles.input_icon} size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`${styles.input_field} ${
                    passwordError ? styles.input_error : ""
                  }`}
                />
                <div
                  className={styles.password_toggle}
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
              {passwordError && (
                <p className={styles.error_text}>{passwordError}</p>
              )}
              <div className={styles.forgot_password_container}>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className={styles.forgot_password_link}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                onClick={handlePasswordLogin}
                className={styles.button_primary}
                disabled={
                  loading ||
                  !email ||
                  !!emailError ||
                  !password ||
                  !!passwordError
                }
              >
                {loading ? (
                  <RefreshCw className={styles.spinner} />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Login</span>
                  </>
                )}
              </button>
            </>
          )}

          {mode === "otp" && step === "request" && (
            <>
              <div className={styles.input_with_icon}>
                <Mail className={styles.input_icon} size={20} />
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`${styles.input_field} ${
                    emailError ? styles.input_error : ""
                  }`}
                />
              </div>
              {emailError && <p className={styles.error_text}>{emailError}</p>}

              <button
                onClick={handleRequestOtp}
                className={styles.button_primary}
                disabled={loading || !email || !!emailError}
              >
                {loading ? (
                  <RefreshCw className={styles.spinner} />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </>
          )}

          {mode === "otp" && step === "verify" && (
            <>
              <div className={styles.input_with_icon}>
                <Lock className={styles.input_icon} size={20} />
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  className={`${styles.input_field} ${
                    otpError ? styles.input_error : ""
                  }`}
                />
              </div>
              {otpError && <p className={styles.error_text}>{otpError}</p>}

              <button
                onClick={handleVerifyOtp}
                className={styles.button_primary}
                disabled={loading || !otp}
              >
                {loading ? (
                  <RefreshCw className={styles.spinner} />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Verify OTP</span>
                  </>
                )}
              </button>

              <div className={styles.resend_container}>
                <button
                  onClick={handleResendOtp}
                  className={styles.resend_button}
                  disabled={resendTimer > 0 || resendLoading}
                >
                  {resendLoading ? (
                    <RefreshCw className={styles.spinner} size={16} />
                  ) : resendTimer > 0 ? (
                    `Resend OTP in ${resendTimer}s`
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setStep("request");
                  setOtp("");
                  setOtpError("");
                  setResendTimer(0);
                }}
                className={styles.back_button}
              >
                Back to Email
              </button>
            </>
          )}
        </div>

        <p className={styles.terms_text}>
          By continuing, you agree to HealTrack's{" "}
          <a href="/termsofservice" className={styles.terms_link}>
            Terms of Use
          </a>{" "}
          and{" "}
          <a href="/privacypolicy" className={styles.terms_link}>
            Privacy Policy
          </a>
        </p>

        <p className={styles.new_user}>
          New to HealTrack?{" "}
          <a href="/signup" className={styles.signup_link}>
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
