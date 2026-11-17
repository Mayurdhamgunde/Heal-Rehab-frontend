import React from "react";
import {
  GoogleOAuthProvider,
  useGoogleLogin,
  type CodeResponse,
} from "@react-oauth/google";
import api from "../utils/central";
import styles from "../css/GoogleSignInButton.module.css";
import { LogIn } from "lucide-react";

interface GoogleSignInButtonProps {
  onSignInSuccess: () => void;
}

interface ServerResponse {
  accessToken: string;
}

interface GoogleError {
  error?: string;
  details?: string;
}

const GOOGLE_CLIENT_ID =
  "1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com";

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
}) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse: CodeResponse) => {
      try {
        // Exchange auth code for backend access token
        const response = await api.post<ServerResponse>("/exchange", {
          serverAuthCode: tokenResponse.code,
          clientType: "web",
        });

        const { accessToken } = response.data;
        // Store access token in localStorage
        localStorage.setItem("googleAccessToken", accessToken);
        localStorage.setItem(
          "tokenExpirationTime",
          (Date.now() + 3300000).toString(),
        );
        onSignInSuccess();
      } catch (error) {
        console.error("Google Sign-In error:", error);
        alert("Failed to sign in with Google.");
      }
    },
    onError: (error: GoogleError) => {
      console.error("Google Sign-In error:", error);
      alert(
        `Google Sign-In failed: ${error.error || "Unknown error"}${
          error.details ? ` - ${error.details}` : ""
        }`,
      );
    },
    flow: "auth-code",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" "),
  });

  return (
    <button className={styles.googleButton} onClick={() => login()}>
      <div className={styles.googleButtonContent}>
        <LogIn size={24} className={styles.googleIcon} />
        <span className={styles.googleButtonText}>Sign in with Google</span>
      </div>
    </button>
  );
};

// Wrap the button in GoogleOAuthProvider
const WrappedGoogleSignInButton: React.FC<GoogleSignInButtonProps> = (
  props,
) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <GoogleSignInButton {...props} />
  </GoogleOAuthProvider>
);

export default WrappedGoogleSignInButton;
