import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {  FaCalendarAlt, FaUser, FaStethoscope, FaClock, FaCheckCircle } from 'react-icons/fa';
import api from '../utils/central';
import styles from '../css/AppointmentDetails.module.css';

interface Appointment {
  plan_id: string;
  _id: string;
  patient_id: string;
  patientUser?: string;
  doctor_id: string;
  therepy_type: string;
  therepy_link?: string;
  therepy_start_time: string;
  therepy_date: string;
  patient_name?: string;
  doctor_name?: string;
}

interface SessionImage {
  file: File; 
  name: string;
  type: string;
  id: string;
  preview: string; 
}

interface AppointmentState {
  isStarted: boolean;
  startTime: string | null;
  elapsedTime: number;
  previousRemarks: string;
  postRemarks: string;
  isCompleted: boolean;
}

const MAX_SESSION_TIME = 10800; 

const AppointmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment as Appointment | undefined;
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [previousRemarks, setPreviousRemarks] = useState('');
  const [postRemarks, setPostRemarks] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [presessionImages, setPresessionImages] = useState<SessionImage[]>([]);
  const [postsessionImages, setPostsessionImages] = useState<SessionImage[]>([]);
  const [] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  // Scroll to top on mount - CRITICAL: Must run first
  useEffect(() => {
    // Scroll window to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also scroll any scroll containers to top
    const scrollContainer = document.querySelector(`.${styles.scrollContainer}`);
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, []);

  // Load saved state from localStorage
  const loadAppointmentState = useCallback(async () => {
    try {
      const savedState = localStorage.getItem(`appointment_${appointment?._id}`);
      if (savedState) {
        const state: AppointmentState = JSON.parse(savedState);
        setIsStarted(state.isStarted);
        setStartTime(state.startTime ? new Date(state.startTime) : null);
        setElapsedTime(state.elapsedTime);
        setPreviousRemarks(state.previousRemarks);
        setPostRemarks(state.postRemarks);
        setIsCompleted(state.isCompleted);
      }
    } catch (error) {
      console.error('Error loading appointment state:', error);
    }
  }, [appointment?._id]);

  // Save state to localStorage
  const saveAppointmentState = useCallback(async () => {
    try {
      const state: AppointmentState = {
        isStarted,
        startTime: startTime?.toISOString() || null,
        elapsedTime,
        previousRemarks,
        postRemarks,
        isCompleted,
      };
      localStorage.setItem(`appointment_${appointment?._id}`, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving appointment state:', error);
    }
  }, [appointment?._id, isStarted, startTime, elapsedTime, previousRemarks, postRemarks, isCompleted]);

  // Clear saved state
  const clearAppointmentState = useCallback(async () => {
    try {
      localStorage.removeItem(`appointment_${appointment?._id}`);
    } catch (error) {
      console.error('Error clearing appointment state:', error);
    }
  }, [appointment?._id]);

  // Handle session time limit
  const handleTimeExceeded = useCallback(async () => {
    setIsStarted(false);
    setStartTime(null);
    setElapsedTime(0);
    await clearAppointmentState();
    alert('Session Expired: The session has exceeded the 3-hour limit and has been automatically ended.');
  }, [clearAppointmentState]);

  // Load state on mount
  useEffect(() => {
    if (appointment) {
      loadAppointmentState();
    } else {
      navigate('/appointments');
    }
  }, [appointment, loadAppointmentState, navigate]);

  // Save state when values change
  useEffect(() => {
    if (appointment) {
      saveAppointmentState();
    }
  }, [appointment, saveAppointmentState]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && startTime) {
      interval = setInterval(() => {
        const newElapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        if (newElapsedTime >= MAX_SESSION_TIME) {
          handleTimeExceeded();
        } else {
          setElapsedTime(newElapsedTime);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, startTime, handleTimeExceeded]);

  // Handle joining a video session
  const handleJoinSession = async () => {
    if (!appointment?.patientUser) {
      alert('Error: No patientUser ID in this appointment.');
      return;
    }
    if (!appointment?.doctor_id) {
      alert('Error: Doctor ID missing.');
      return;
    }
    const base = `https://doctor.healtrackai.com/videoCall/${appointment.patientUser}`;
    const url = `${base}?donorId=${appointment.doctor_id}&donorName=${appointment.doctor_name}`;
    try {
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening session:', error);
      alert('Error: Could not open session.');
    }
  };

  // Handle start therapy
  const handleStart = useCallback(async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add presession remarks
      if (previousRemarks) {
        formData.append('presession_remarks', previousRemarks);
      }
      
      // Add presession images - Fixed for web
      if (presessionImages.length > 0) {
        presessionImages.forEach(image => {
          formData.append('images', image.file, image.name);
        });
      }
      
      // console.log('Starting therapy with FormData:', formData);
      
      const response = await api.post(`/therapy/start/${appointment._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.status === 200) {
        setIsStarted(true);
        setStartTime(new Date());
      } else {
        alert('Error: Failed to start therapy session.');
      }
    } catch (error) {
      console.error('Failed to start therapy session:', error);
      alert('Error: Failed to start therapy session.');
    } finally {
      setLoading(false);
    }
  }, [appointment, previousRemarks, presessionImages]);

  // Handle end therapy - Fixed for web
  const handleEnd = useCallback(async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add postsession remarks
      if (postRemarks) {
        formData.append('postsession_remarks', postRemarks);
      }
      
      // Add postsession images - Fixed for web
      if (postsessionImages.length > 0) {
        postsessionImages.forEach(image => {
          formData.append('images', image.file, image.name);
        });
      }
      
      // console.log('Ending therapy with FormData:', formData);
      
      const response = await api.post(`/therapy/end/${appointment._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.status === 200) {
        setIsCompleted(true);
        await clearAppointmentState();
        setModalVisible(false);
        navigate('/', {
          state: {
            planId: appointment.plan_id,
            patientId: appointment.patient_id,
            therapyId: appointment._id,
          },
        });
      } else {
        alert('Error: Failed to end therapy session.');
      }
    } catch (error) {
      console.error('Failed to end therapy session:', error);
      alert('Error: Failed to end therapy session.');
    } finally {
      setLoading(false);
    }
  }, [appointment, postRemarks, postsessionImages, clearAppointmentState, navigate]);

  // Handle cancel
  const handleCancel = () => {
    clearAppointmentState();
    setPreviousRemarks('');
    setPresessionImages([]);
    setPostsessionImages([]);
    navigate('/get/appointments');
  };

  // Fixed image handlers for web
  const handlePresessionImagesSelected = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: SessionImage[] = Array.from(files).map(file => ({
      file: file,
      name: file.name,
      type: file.type,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
    }));
    
    setPresessionImages(prev => [...prev, ...newImages]);
  };

  const handlePresessionImageRemoved = (imageId: string) => {
    setPresessionImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const handlePostsessionImagesSelected = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: SessionImage[] = Array.from(files).map(file => ({
      file: file,
      name: file.name,
      type: file.type,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
    }));
    
    setPostsessionImages(prev => [...prev, ...newImages]);
  };

  const handlePostsessionImageRemoved = (imageId: string) => {
    setPostsessionImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      presessionImages.forEach(image => URL.revokeObjectURL(image.preview));
      postsessionImages.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, []);

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!appointment) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Appointment Details</h1>
        <div className={styles.headerRight}></div>
      </div>
      <div className={styles.scrollContainer}>
        <div className={styles.dateContainer}>
          <div className={styles.dateIconContainer}>
            {!isStarted ? (
              <>
                <FaCalendarAlt className={styles.icon} />
                <span className={styles.dateText}>
                  {new Date(appointment.therepy_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).replace(/(\d+)(?:st|nd|rd|th)/, '$1')}
                </span>
              </>
            ) : (
              <div className={styles.dateTextContainer}>
                <span className={styles.patientNameText}>{appointment.patient_name}</span>
                <span className={styles.dateText}>
                  {new Date(appointment.therepy_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).replace(/(\d+)(?:st|nd|rd|th)/, '$1')}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.detailsContainer}>
          {isCompleted ? (
            <div className={styles.completedContainer}>
              <FaCheckCircle className={styles.completedIcon} />
              <h2 className={styles.completedText}>Session Completed</h2>
              <button className={styles.closeButton} onClick={handleCancel}>
                Close
              </button>
            </div>
          ) : !isStarted ? (
            <>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <FaUser className={styles.icon} />
                  <h3 className={styles.detailTitle}>Patient Name</h3>
                </div>
                <p className={styles.detailText}>{appointment.patient_name}</p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <FaStethoscope className={styles.icon} />
                  <h3 className={styles.detailTitle}>Therapy Type</h3>
                </div>
                <p className={styles.detailText}>{appointment.therepy_type}</p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <FaClock className={styles.icon} />
                  <h3 className={styles.detailTitle}>Therapy Start Time</h3>
                </div>
                <p className={styles.detailText}>{appointment.therepy_start_time}</p>
              </div>
              <div className={styles.remarksSection}>
                <h3 className={styles.detailTitle}>Pre-Session Remarks</h3>
                <textarea
                  className={styles.remarksInput}
                  value={previousRemarks}
                  onChange={(e) => setPreviousRemarks(e.target.value)}
                  placeholder="Enter previous session remarks"
                />
              </div>
              <div className={styles.imageUploader}>
                <h3 className={styles.detailTitle}>Pre-Session Images</h3>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handlePresessionImagesSelected(e.target.files)}
                />
                <div className={styles.imagePreview}>
                  {presessionImages.map(image => (
                    <div key={image.id} className={styles.imageItem}>
                      <img src={image.preview} alt={image.name} />
                      <button onClick={() => handlePresessionImageRemoved(image.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.actionButtonsContainer}>
                <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  className={`${styles.actionButton} ${styles.startButton}`}
                  onClick={handleStart}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Start Therapy'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.timerContainer}>
              <div className={styles.timerRing}>
                <div className={styles.timerInnerRing}>
                  <span className={styles.timerText}>{formatTime(elapsedTime)}</span>
                </div>
              </div>
              {appointment.therepy_type === 'Online' && appointment.patientUser && (
                <button className={styles.joinButton} onClick={handleJoinSession}>
                  Join Session
                </button>
              )}
              <button className={styles.endButton} onClick={() => setModalVisible(true)}>
                End Therapy
              </button>
            </div>
          )}
        </div>
      </div>
      {isModalVisible && (
        <div className={styles.modalContainer}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Post-Session Details</h2>
            <h3 className={styles.detailTitle}>Post-Session Remarks</h3>
            <textarea
              className={styles.remarksInput}
              value={postRemarks}
              onChange={(e) => setPostRemarks(e.target.value)}
              placeholder="Enter post session remarks"
            />
            <div className={styles.imageUploader}>
              <h3 className={styles.detailTitle}>Post-Session Images</h3>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePostsessionImagesSelected(e.target.files)}
              />
              <div className={styles.imagePreview}>
                {postsessionImages.map(image => (
                  <div key={image.id} className={styles.imageItem}>
                    <img src={image.preview} alt={image.name} />
                    <button onClick={() => handlePostsessionImageRemoved(image.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <button
              className={styles.modalButton}
              onClick={handleEnd}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Submit and End Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;