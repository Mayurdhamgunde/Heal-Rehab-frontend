import React from "react";
import { Link } from "react-router-dom";
import styles from "../css/footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSectionAbout}>
          <h2>About HealTrack</h2>
          <p>
            HealTrack is a platform designed to simplify medical professionals' daily
            operations, from patient records to appointment scheduling.
          </p>
          <div className={styles.contact}>
            <span>
              <i className="fas fa-phone"></i> +91 7411620955
            </span>
            <span>
              <i className="fas fa-envelope"></i> support@healtrackai.com
            </span>
            <span>Electronic City, Bengaluru</span>
          </div>
        </div>
        <div className={styles.footerSectionLinks}>
          <h2>Quick Links</h2>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
          </ul>
          <ul>
            <li>
              <Link to="/termsofservice">Terms-of-service</Link>
            </li>
            <li>
              <Link to="/privacypolicy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
        <div className={styles.footerSectionContactForm}>
          <h2>Contact Us</h2>
          <form>
            <input type="email" name="email" placeholder="Your email..." />
            <textarea name="message" placeholder="Your message..."></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>
          <Link to="/privacy-policy">Privacy Policy</Link> |{" "}
          <Link to="/terms-of-service">Terms-of-service</Link>
        </p>
        <p>© 2024 HealTrack by GEMBURG PRIVATE LIMITED</p>
      </div>
    </footer>
  );
};

export default Footer;