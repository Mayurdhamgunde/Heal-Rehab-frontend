import { useState, useEffect } from "react";
import { RefreshCw, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import styles from "../css/ForgotPassword.module.css";
import api from "../utils/central";
import HTlogo from "../assets/HTic.png";

interface ForgotPasswordPageProps {
  onBack: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer, canResend]);

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
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError("");
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    setOtp(sanitizedValue);
    setOtpError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      validatePassword(value);
    } else {
      setPasswordError("");
    }
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value) {
      validateConfirmPassword(value);
    } else {
      setConfirmPasswordError("");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSendOtp = async () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    setLoading(true);
    try {
      const response = await api.post("/sendOtp", { email });
      if (response.data.message === "OTP sent successfully") {
        setIsOtpSent(true);
        setSuccessMessage("OTP has been sent to your email");
        setCanResend(false);
        setResendTimer(60); // 60 seconds cooldown
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setEmailError("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setEmailError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resendTimer > 0) return;

    setLoading(true);
    try {
      const response = await api.post("/sendOtp", { email });
      if (response.data.message === "OTP sent successfully") {
        setSuccessMessage("OTP has been resent to your email");
        setCanResend(false);
        setResendTimer(60); // 60 seconds cooldown
        setOtp(""); // Clear previous OTP
        setOtpError("");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setOtpError("Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSetup = async () => {
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!otp) {
      setOtpError("OTP is required");
      return;
    }

    if (otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!isPasswordValid || !isConfirmPasswordValid) return;

    setLoading(true);
    try {
      const response = await api.post("/otpVerification/passwordsetup", {
        email,
        otp,
        password,
      });

      if (response.data.message === "Password updated successfully") {
        setSuccessMessage("Password updated successfully! Redirecting...");
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setOtpError("OTP verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error setting up password:", error);
      setOtpError("Failed to verify OTP and setup password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setIsOtpSent(false);
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setOtpError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setResendTimer(0);
    setCanResend(true);
  };

  return (
    <div className={styles.forgot_password_container}>
      <div className={styles.forgot_password_left}>
        <h2 className={styles.forgot_password_heading}>Reset Password</h2>
        <p className={styles.forgot_password_subtext}>
          Secure your account with a new password
        </p>
      </div>

      <div className={styles.forgot_password_right}>
        <img
          src={HTlogo}
          alt="HealTrack Logo"
          className={styles.forgot_password_logo}
        />

        {successMessage && (
          <div className={styles.success_message}>{successMessage}</div>
        )}

        <h3 className={styles.form_title}>
          {isOtpSent ? "Verify OTP & Set Password" : "Forgot Password"}
        </h3>
        <p className={styles.form_subtitle}>
          {isOtpSent
            ? "Enter the OTP sent to your email along with your new password"
            : "Enter your email to receive an OTP"}
        </p>

        <div className={styles.input_container}>
          {!isOtpSent && (
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
                onClick={handleSendOtp}
                className={styles.button_primary}
                disabled={loading || !email || !!emailError}
              >
                {loading ? (
                  <RefreshCw className={styles.spinner} />
                ) : (
                  <>
                    <Mail size={18} />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </>
          )}

          {isOtpSent && (
            <>
              <div className={styles.input_with_icon}>
                <Shield className={styles.input_icon} size={20} />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  className={`${styles.input_field} ${
                    otpError ? styles.input_error : ""
                  }`}
                />
              </div>
              {otpError && <p className={styles.error_text}>{otpError}</p>}

              <div className={styles.input_with_icon}>
                <Lock className={styles.input_icon} size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
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

              <div className={styles.input_with_icon}>
                <Lock className={styles.input_icon} size={20} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter Password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`${styles.input_field} ${
                    confirmPasswordError ? styles.input_error : ""
                  }`}
                />
                <div
                  className={styles.password_toggle}
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </div>
              </div>
              {confirmPasswordError && (
                <p className={styles.error_text}>{confirmPasswordError}</p>
              )}

              <button
                onClick={handleVerifyAndSetup}
                className={styles.button_primary}
                disabled={
                  loading ||
                  !otp ||
                  !password ||
                  !confirmPassword ||
                  !!passwordError ||
                  !!confirmPasswordError
                }
              >
                {loading ? (
                  <RefreshCw className={styles.spinner} />
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Verify & Setup Password</span>
                  </>
                )}
              </button>

              <div className={styles.action_buttons}>
                <button
                  onClick={handleChangeEmail}
                  className={styles.secondary_button}
                >
                  Change Email
                </button>
                <button
                  onClick={handleResendOtp}
                  className={styles.secondary_button}
                  disabled={!canResend || resendTimer > 0 || loading}
                >
                  {resendTimer > 0 ? (
                    <span>Resend OTP ({resendTimer}s)</span>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Resend OTP</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <button onClick={onBack} className={styles.back_to_login}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
