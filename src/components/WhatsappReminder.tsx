import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaWhatsapp, FaPaperPlane } from 'react-icons/fa';
import api from "../utils/central";
import styles from '../css/WhatsappRemainder.module.css';

interface WhatsAppReminderProps {
  sessionId: string;
  patientName?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const WhatsAppReminderButton: React.FC<WhatsAppReminderProps> = ({
  sessionId,
  patientName = 'Patient',
  size = 'medium',
  disabled = false,
  onSuccess,
  onError,
  onClick,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendWhatsAppReminder = async () => {
    setIsLoading(true);
    try {
      
      // Validate sessionId
      if (!sessionId || sessionId.trim() === '') {
        throw new Error('Session ID is required but not provided');
      }
      
      const requestPayload = {
        sessionId: sessionId.trim(), // Ensure no whitespace
      };
      
      console.log('Request payload:', JSON.stringify(requestPayload, null, 2));
      
      const response = await api.post('/send/whatsapp/reminder', requestPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.status === 200 || response.status === 201) {
        // Check if response indicates success
        const responseData = response.data;
        if (responseData && responseData.success === false) {
          throw new Error(responseData.message || 'Server returned success=false');
        }
        
        alert(`WhatsApp reminder sent successfully to ${patientName}!`);
        setIsModalVisible(false);
        onSuccess?.();
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: any) {
      console.error('=== WhatsApp Reminder Error Debug ===');
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      
      let errorMessage = 'Failed to send WhatsApp reminder. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
        
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage = `Bad Request: ${data?.message || 'Invalid request data'}`;
            break;
          case 401:
            errorMessage = 'Unauthorized: Please check your authentication';
            break;
          case 403:
            errorMessage = 'Forbidden: You don\'t have permission to send reminders';
            break;
          case 404:
            errorMessage = 'Not Found: WhatsApp reminder endpoint not found';
            break;
          case 422:
            errorMessage = `Validation Error: ${data?.message || 'Invalid data provided'}`;
            break;
          case 500:
            errorMessage = 'Server Error: Please try again later';
            break;
          default:
            errorMessage = `Server Error (${status}): ${data?.message || 'Unknown error'}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received');
        errorMessage = 'Network Error: Unable to reach server. Please check your connection.';
      } else if (error.code === 'ECONNABORTED') {
        // Request timeout
        errorMessage = 'Request Timeout: Server took too long to respond';
      } else {
        // Something else happened
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    setIsModalVisible(false);
    sendWhatsAppReminder();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalVisible(false);
  };

  const getIconClassName = () => {
    switch (size) {
      case 'small':
        return styles.iconSmall;
      case 'large':
        return styles.iconLarge;
      default:
        return styles.iconMedium;
    }
  };

  // Modal component
  const Modal = () => (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <FaWhatsapp className={styles.modalHeaderIcon} />
          <h2 className={styles.modalTitle}>Send WhatsApp Reminder</h2>
        </div>
        <p className={styles.modalMessage}>
          Are you sure you want to send a WhatsApp reminder to{' '}
          <span className={styles.patientName}>{patientName}</span>?
        </p>
       
        <div className={styles.modalButtons}>
          <button
            className={`${styles.modalButton} ${styles.cancelButton}`}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={`${styles.modalButton} ${styles.confirmButton}`}
            onClick={handleConfirm}
            disabled={!sessionId || sessionId.trim() === ''}
          >
            <FaPaperPlane className={styles.sendIcon} />
            Send Reminder
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className={`${styles.reminderButton} ${disabled ? styles.disabledButton : ''} ${styles[size]}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
          
          console.log("=== Button Click Debug ===");
          console.log("SessionId:", sessionId);
          console.log("IsLoading:", isLoading);
          console.log("Disabled:", disabled);
          console.log("IsModalVisible:", isModalVisible);
          
          if (!sessionId || sessionId.trim() === '') {
            alert('Error: Session ID is required but not provided');
            return;
          }
          
          if (!disabled && !isLoading) {
            setIsModalVisible(true);
          }
        }}
        disabled={disabled || isLoading || !sessionId}
        title={`Send WhatsApp Reminder${!sessionId ? ' (No Session ID)' : ''}`}
      >
        {isLoading ? (
          <div className={styles.spinner}></div>
        ) : (
          <FaWhatsapp className={getIconClassName()} />
        )}
      </button>

      {isModalVisible && createPortal(<Modal />, document.body)}
    </>
  );
};

export default WhatsAppReminderButton;