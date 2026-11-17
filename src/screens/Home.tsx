import { useState, useEffect, useRef } from "react";
import { ArrowRight, Pill, Brain, HeartHandshake, Dumbbell, Sparkles, Palette } from "lucide-react";
import style from "../css/Home.module.css";

import images from "../assets/pexels-tima-miroshnichenko-8376192.jpg";
import patientManagement from "../assets/patientmanagement.png";
import AppointScheduling from "../assets/AppointmentScheduling.png";
import ProgressTracking from "../assets/ProgressTracking.png";

const Home = () => {
  const [buttonHovered, setButtonHovered] = useState(false);
  const [isAddictionVisible, setIsAddictionVisible] = useState(false);
  const addictionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to trigger animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAddictionVisible(true);
          observer.unobserve(entry.target); // Stops observing once it becomes visible
        }
      },
      { threshold: 0.15 } // Triggers when 15% of the section is visible
    );

    if (addictionRef.current) {
      observer.observe(addictionRef.current);
    }

    return () => {
      if (addictionRef.current) observer.unobserve(addictionRef.current);
    };
  }, []);

  return (
    <div className={style.container}>
      {/* Hero Section */}
      <div className={style.brandHeaderWrapper}>
        <div className={style.brandHeader}>
          <h1 className={style.brandWelcome}>Welcome to</h1>
          <div className={style.brandNameContainer}>
            <span className={style.brandNamePrimary}>HealTrack Rehab</span>
          </div>
          <div className={style.brandTagline}>
            <p className={style.brandTaglinePrimary}>
              Empowering medical professionals to manage patients and
              appointments efficiently
            </p>
          </div>
        </div>

        {/* Wave SVG */}
        <div className={style.wave}>
          <svg
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="#f5f5f5"
              className={style.shapeFill}
            ></path>
          </svg>
        </div>
      </div>

      {/* Addiction Management Section (Moved to be First) */}
      <div 
        ref={addictionRef} 
        className={`${style.addictionSection} ${isAddictionVisible ? style.isVisible : ''}`}
      >
        <div className={style.addictionHeader}>
          <h2 className={style.addictionTitle}>Holistic Addiction Management</h2>
          <p className={style.addictionSubtitle}>
            Combining modern scientific treatments with traditional healing for recovery.
          </p>
        </div>
        
        <div className={style.addictionGrid}>
          <div className={style.addictionCard}>
            <div className={style.addictionIconWrapper}><Pill size={24} /></div>
            <h3 className={style.addictionCardTitle}>Medical Treatment</h3>
            <p className={style.addictionCardDesc}>Pharmacotherapy to safely manage physical dependency.</p>
          </div>

          <div className={style.addictionCard}>
            <div className={style.addictionIconWrapper}><Brain size={24} /></div>
            <h3 className={style.addictionCardTitle}>Psychiatric Care</h3>
            <p className={style.addictionCardDesc}>Psychological support for associated conditions like anxiety.</p>
          </div>

          <div className={style.addictionCard}>
            <div className={style.addictionIconWrapper}><HeartHandshake size={24} /></div>
            <h3 className={style.addictionCardTitle}>Counseling</h3>
            <p className={style.addictionCardDesc}>Guidance to resolve conflicts and foster positive choices.</p>
          </div>

          <div className={style.addictionCard}>
            <div className={style.addictionIconWrapper}><Dumbbell size={24} /></div>
            <h3 className={style.addictionCardTitle}>Yoga Therapy</h3>
            <p className={style.addictionCardDesc}>Ancient Indian practices for physical and mental control.</p>
          </div>

          <div className={style.addictionCard}>
            <div className={style.addictionIconWrapper}><Sparkles size={24} /></div>
            <h3 className={style.addictionCardTitle}>Spiritual Awakening</h3>
            <p className={style.addictionCardDesc}>Fostering humility and finding inner peace through values.</p>
          </div>

          <div className={style.addictionCard}>
            <div className={style.addictionIconWrapper}><Palette size={24} /></div>
            <h3 className={style.addictionCardTitle}>Art & Hobbies</h3>
            <p className={style.addictionCardDesc}>Engaging in music, sports, and drawing to channel energy.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={style.ctaSection}>
        <div className={style.ctaLeftSide}>
          <p className={style.ctaDescription}>
            Join thousands of patients who benefit from organized medical care.
            Register with HealTrack to easily manage your appointments, track
            progress, and connect with top medical professionals.
          </p>

          <div className={style.buttonContainer}>
            <a
              href="/doctor/registration"
              className={style.ctaButton}
              onMouseEnter={() => setButtonHovered(true)}
              onMouseLeave={() => setButtonHovered(false)}
            >
              Register Yourself
              <ArrowRight
                className={`${style.arrowIcon} ${
                  buttonHovered ? style.arrowIconHovered : ""
                }`}
                size={20}
              />
            </a>
          </div>
        </div>

        <div className={style.ctaRightSide}>
          <h2 className={style.ctaTitle}>
            Ready to Start Your Healing Journey?
          </h2>
        </div>
      </div>

      {/* Key Features (Moved below About Section) */}
      <div id="features" className={style.featuresWrapper}>
        <div className={style.featureCard}>
          <div className={style.featureImageContainer}>
            <img
              src={patientManagement}
              alt="Patient Management"
              className={style.featureImage}
            />
          </div>
          <div className={style.featureContent}>
            <h2 className={style.featureTitle}>Patient Management</h2>
            <p className={style.featureDescription}>
              Easily track your patients progress and medical history
            </p>
          </div>
        </div>

        <div className={style.featureCard}>
          <div className={style.featureImageContainer}>
            <img
              src={AppointScheduling}
              alt="Appointment Scheduling"
              className={style.featureImage}
            />
          </div>
          <div className={style.featureContent}>
            <h2 className={style.featureTitle}>Appointment Scheduling</h2>
            <p className={style.featureDescription}>
              Streamline your calendar and manage appointments efficiently
            </p>
          </div>
        </div>

        <div className={style.featureCard}>
          <div className={style.featureImageContainer}>
            <img
              src={ProgressTracking}
              alt="Progress Tracking"
              className={style.featureImage}
            />
          </div>
          <div className={style.featureContent}>
            <h2 className={style.featureTitle}>Progress Tracking</h2>
            <p className={style.featureDescription}>
              Monitor and document patient recovery with ease
            </p>
          </div>
        </div>
      </div>

      
      {/* About Section */}
      <div id="about" className={style.aboutSection}>
        <div className={style.aboutImageSide}>
          <img
            src={images}
            alt="Medical professional helping patient"
            className={style.aboutImage}
          />
        </div>

        <div className={style.aboutContentSide}>
          <h2 className={style.aboutTitle}>About HealTrack</h2>
          <p className={style.aboutDescription}>
            HealTrack is a comprehensive platform designed specifically for addiction recovery and rehabilitation centers. By simplifying the daily operations of rehab professionals—from tracking holistic treatment progress to scheduling therapy and counseling sessions—HealTrack removes the administrative burden. This ensures your team can focus entirely on what matters most: supporting your patients through their healing journey.
          </p>
         
        </div>
      </div>


    </div>
  );
};

export default Home;