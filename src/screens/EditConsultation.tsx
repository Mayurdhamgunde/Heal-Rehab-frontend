import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaStethoscope, 
  FaCalendarAlt, 
  FaClock, 
  FaUserInjured, 
  FaNotesMedical, 
  FaFilePrescription,
  FaClipboardList 
} from 'react-icons/fa';
import api from '../utils/central';
import styles from '../css/EditConsultation.module.css'; // Reusing your existing styles
import PrescriptionFormComponent from '../components/PrescriptionFormComponent';
import CircularProgress from '@mui/material/CircularProgress';

const EditConsultation: React.FC = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    patientSymptoms: '',
    causes: '',
    notes: '',
    results: '',
    consultationDate: '',
    consultationTime: '',
  });

  const [includePrescription, setIncludePrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPhysiotherapy = session.organization_industry?.toLowerCase() === 'physiotherapy';

  useEffect(() => {
    fetchConsultationDetails();
  }, [consultationId]);

 const fetchConsultationDetails = async () => {
  try {
    setIsLoading(true);
    const response = await api.get(`/fetch/consultation/${consultationId}`);
    
    if (response.data && response.data.consultation) {
      const { consultation, prescription } = response.data;

      // 1. Handle Date: Convert ISO string to YYYY-MM-DD
      const dateObj = new Date(consultation.consultationDate);
      const formattedDate = !isNaN(dateObj.getTime()) 
        ? dateObj.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      // 2. Handle Time: Convert "12:14 PM" or "HH:mm:ss" to "HH:mm"
      let formattedTime = "12:00"; // Default fallback
      const rawTime = consultation.consultationTime || "";

      if (rawTime.includes('AM') || rawTime.includes('PM')) {
        // Handle "12:14 PM" format
        const [time, modifier] = rawTime.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
        formattedTime = `${hours.padStart(2, '0')}:${minutes}`;
      } else if (rawTime) {
        // Handle "HH:mm:ss" format
        formattedTime = rawTime.substring(0, 5);
      }

      // 3. Map Results for the dropdown
      let resultsValue = '';
      const res = consultation.results?.toLowerCase() || "";
      if (res.includes('therapy needed') && !res.includes('not')) {
        resultsValue = 'therapy_needed';
      } else if (res.includes('therapy not needed')) {
        resultsValue = 'therapy_not_needed';
      }

      setFormData({
        patientSymptoms: consultation.patientSymptoms || '',
        causes: consultation.causes || '',
        notes: consultation.notes || '',
        results: resultsValue,
        consultationDate: formattedDate,
        consultationTime: formattedTime,
      });

      // 4. Handle Prescription
      if (prescription) {
        setIncludePrescription(true);
        setPrescriptionData({
          weight: prescription.vitals?.weight || '',
          bp: prescription.vitals?.bp || '',
          medications: prescription.medications || [],
          notes: prescription.notes || '',
        });
      }
    }
  } catch (err) {
    console.error('Fetch error:', err);
    alert('Could not find this consultation.');
    navigate(-1);
  } finally {
    // This ensures the loading spinner disappears no matter what
    setIsLoading(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const resultsValue = formData.results === 'therapy_needed' ? 'Therapy needed' : 
                           formData.results === 'therapy_not_needed' ? 'Therapy not needed' : '';

      const payload: any = {
        patientSymptoms: formData.patientSymptoms,
        causes: formData.causes,
        notes: formData.notes,
        results: resultsValue,
        consultationDate: formData.consultationDate,
        consultationTime: formData.consultationTime,
      };

      if (includePrescription && prescriptionData) {
        payload.prescription = {
          vitals: { weight: prescriptionData.weight, bp: prescriptionData.bp },
          medications: prescriptionData.medications,
          notes: prescriptionData.notes,
          diagnosis: resultsValue,
        };
      }

      await api.put(`/edit/consultation/${consultationId}`, payload);
      alert('Consultation Updated Successfully');
      navigate(-1);
    } catch (error) {
      console.error('Update Error:', error);
      alert('Failed to update consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
  return (
    <div className={styles.loadingScreen}>
      <CircularProgress size={50} thickness={4} style={{ color: '#007b8e' }} />
      <p className={styles.loadingText}>Loading Consultation details...</p>
    </div>
  );
}

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FaStethoscope />
          </div>
          <h1 className={styles.title}>Edit Consultation</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label><FaCalendarAlt className={styles.icon} /> Date</label>
              <input 
                type="date" 
                name="consultationDate" 
                value={formData.consultationDate} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.field}>
              <label><FaClock className={styles.icon} /> Time</label>
              <input 
                type="time" 
                name="consultationTime" 
                value={formData.consultationTime} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className={styles.field}>
            <label><FaUserInjured className={styles.icon} /> Patient Symptoms *</label>
            <textarea 
              name="patientSymptoms" 
              value={formData.patientSymptoms} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className={styles.field}>
            <label><FaClipboardList className={styles.icon} /> Causes / Diagnosis *</label>
            <textarea 
              name="causes" 
              value={formData.causes} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className={styles.field}>
            <label><FaNotesMedical className={styles.icon} /> Medical Notes *</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          {isPhysiotherapy ? (
            <div className={styles.field}>
              <label>Results *</label>
              <select name="results" value={formData.results} onChange={handleInputChange} required className={styles.select}>
                <option value="">Select Result</option>
                <option value="therapy_needed">Therapy Needed</option>
                <option value="therapy_not_needed">Therapy Not Needed</option>
              </select>
            </div>
          ) : (
            <div className={styles.prescriptionSection}>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}><FaFilePrescription className={styles.icon} /> Prescription</span>
                <label className={styles.switch}>
                  <input type="checkbox" checked={includePrescription} onChange={(e) => setIncludePrescription(e.target.checked)} />
                  <span className={styles.slider}></span>
                </label>
              </div>
              {includePrescription && (
                <div className={styles.prescriptionContent}>
                  <PrescriptionFormComponent 
                    onDataChange={setPrescriptionData}
                    initialData={prescriptionData} // Pass existing data to form
                    hideFooter={true}
                  />
                </div>
              )}
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? <span className={styles.spinner}></span> : 'Update Consultation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditConsultation;