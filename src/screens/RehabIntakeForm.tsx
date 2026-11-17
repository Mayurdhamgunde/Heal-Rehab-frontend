import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../css/RehabIntakeForm.module.css';
import api from '../utils/central'; // Adjusted to match your architecture

interface FormDataState {
  admission_type: string;
  accompanying_person: string;
  primary_substance: string;
  secondary_substances: string;
  age_first_use: string;
  frequency_30_days: string;
  route_of_admin: string;
  last_use_date: string;
  last_use_time: string;
  severe_withdrawal: string;
  physical_medical_conditions: string;
  prescription_medications: string;
  mental_health_diagnosis: string[];
  mental_health_other: string;
  previous_rehab: string;
  previous_rehab_count: string;
  history_self_harm: string;
  cage_cut_down: string;
  cage_annoyed: string;
  cage_guilty: string;
  cage_eye_opener: string;
  cage_family_problems: string;
  employment_status: string;
  live_with_whom: string;
  readiness_scale: string;
  primary_goal: string;
}

const RehabIntakeForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState<FormDataState>({
    admission_type: '', accompanying_person: '',
    primary_substance: '', secondary_substances: '', age_first_use: '', frequency_30_days: '', route_of_admin: '', last_use_date: '', last_use_time: '', severe_withdrawal: '',
    physical_medical_conditions: '', prescription_medications: '', mental_health_diagnosis: [], mental_health_other: '', previous_rehab: '', previous_rehab_count: '', history_self_harm: '',
    cage_cut_down: '', cage_annoyed: '', cage_guilty: '', cage_eye_opener: '', cage_family_problems: '',
    employment_status: '', live_with_whom: '', readiness_scale: '', primary_goal: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // ===================== API CALLS =====================
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!patientId) {
        setGeneralError("Patient ID is missing.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        // Using your central API utility
        const response = await api.get(`/patient/${patientId}/rehab_intake`);
        
        // Adjust this if your actual web backend wraps the response differently
        const assessment = response.data?.rehab_assessment || response.data; 

        if (assessment && Object.keys(assessment).length > 0) {
          setFormData((prev) => ({ ...prev, ...assessment }));
        }
      } catch (error) {
        console.error("Error fetching existing rehab assessment:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingData();
  }, [patientId]);

  const saveToDatabase = async () => {
    if (!patientId) {
      setGeneralError('Patient ID is missing.');
      return false;
    }
    try {
      setGeneralError('');
      await api.post(`/patient/${patientId}/rehab_intake`, formData);
      return true;
    } catch (error) {
      console.error("Saving error:", error);
      setGeneralError('Failed to save assessment. Please try again.');
      return false;
    }
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    const success = await saveToDatabase();
    setIsSaving(false);
    if (success) {
      setSuccessMsg('Progress saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSubmitFinal = async () => {
    if (!validateStep(5)) return;
    setIsSubmitting(true);
    const success = await saveToDatabase();
    setIsSubmitting(false);
    
    if (success) {
      setSuccessMsg('Intake Assessment completed and saved.');
      setTimeout(() => navigate(-1), 2000); // Go back after success
    }
  };

  // ===================== LOGIC & VALIDATION =====================
  const handleInputChange = (name: keyof FormDataState, value: any) => {
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMentalHealth = (condition: string) => {
    setFormData((prev) => {
      const exists = prev.mental_health_diagnosis.includes(condition);
      return {
        ...prev,
        mental_health_diagnosis: exists
          ? prev.mental_health_diagnosis.filter((c) => c !== condition)
          : [...prev.mental_health_diagnosis, condition],
      };
    });
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    if (step === 1 && !formData.admission_type) errors.admission_type = 'Required';
    if (step === 2) {
      if (!formData.primary_substance.trim()) errors.primary_substance = 'Required';
      if (!formData.last_use_date.trim()) errors.last_use_date = 'Required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ===================== UI HELPERS =====================
  const renderInput = (label: string, field: keyof FormDataState, placeholder: string, type: string = 'text', isMandatory = false) => (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        {label} {isMandatory && <span className={styles.mandatory}>*</span>}
      </label>
      <input
        type={type}
        className={`${styles.input} ${formErrors[field] ? styles.inputError : ''}`}
        placeholder={placeholder}
        value={formData[field] as string}
        onChange={(e) => handleInputChange(field, e.target.value)}
      />
      {formErrors[field] && <span className={styles.errorText}>{formErrors[field]}</span>}
    </div>
  );

  const renderRadioGroup = (label: string, field: keyof FormDataState, options: string[], isMandatory = false) => (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        {label} {isMandatory && <span className={styles.mandatory}>*</span>}
      </label>
      <div className={styles.radioGroup}>
        {options.map((opt) => (
          <label key={opt} className={`${styles.radioItem} ${formData[field] === opt ? styles.radioSelected : ''}`}>
            <input
              type="radio"
              name={field}
              value={opt}
              checked={formData[field] === opt}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className={styles.hiddenRadio}
            />
            {opt}
          </label>
        ))}
      </div>
      {formErrors[field] && <span className={styles.errorText}>{formErrors[field]}</span>}
    </div>
  );

  // ===================== STEPS =====================
  const renderStep1 = () => (
    <div className={styles.stepContainer}>
      <h2 className={styles.sectionTitle}>Admission Details</h2>
      {renderRadioGroup('Admission Type', 'admission_type', ['Voluntary', 'Family-Initiated', 'Court-Mandated'], true)}
      {renderInput('Accompanying Person', 'accompanying_person', 'Who brought the patient?')}
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.stepContainer}>
      <h2 className={styles.sectionTitle}>Substance Profile</h2>
      {renderInput('Primary Substance', 'primary_substance', 'e.g., Alcohol, Opioids', 'text', true)}
      {renderInput('Secondary Substances', 'secondary_substances', 'List other substances')}
      {renderInput('Age of First Use', 'age_first_use', 'e.g., 18', 'number')}
      {renderRadioGroup('Frequency (Last 30 Days)', 'frequency_30_days', ['Daily', 'Weekly', 'Occasional'])}
      {renderRadioGroup('Route of Admin', 'route_of_admin', ['Oral', 'Smoking', 'Snorting', 'IV'])}
      
      <div className={styles.row}>
        <div className={styles.col}>{renderInput('Date of Last Use', 'last_use_date', '', 'date', true)}</div>
        <div className={styles.col}>{renderInput('Time of Last Use', 'last_use_time', '', 'time')}</div>
      </div>
      {renderRadioGroup('Severe withdrawal history?', 'severe_withdrawal', ['Yes', 'No'], true)}
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.stepContainer}>
      <h2 className={styles.sectionTitle}>Medical History</h2>
      {renderInput('Physical Conditions', 'physical_medical_conditions', 'e.g., Diabetes, Hypertension')}
      {renderInput('Prescription Meds', 'prescription_medications', 'Current medications')}
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Mental Health Diagnoses</label>
        <div className={styles.checkboxGroup}>
          {['Depression', 'Anxiety', 'Bipolar', 'Schizophrenia'].map((cond) => (
            <label key={cond} className={`${styles.checkboxItem} ${formData.mental_health_diagnosis.includes(cond) ? styles.checkboxSelected : ''}`}>
              <input
                type="checkbox"
                checked={formData.mental_health_diagnosis.includes(cond)}
                onChange={() => toggleMentalHealth(cond)}
                className={styles.hiddenCheckbox}
              />
              {cond}
            </label>
          ))}
        </div>
      </div>

      {renderRadioGroup('Previous Rehab?', 'previous_rehab', ['Yes', 'No'])}
      {formData.previous_rehab === 'Yes' && renderInput('How many times?', 'previous_rehab_count', 'e.g., 2', 'number')}
      {renderRadioGroup('History of self-harm?', 'history_self_harm', ['Yes', 'No'])}
    </div>
  );

  const renderStep4 = () => (
    <div className={styles.stepContainer}>
      <h2 className={styles.sectionTitle}>CAGE Screening</h2>
      {renderRadioGroup('Felt you ought to CUT DOWN?', 'cage_cut_down', ['Yes', 'No'])}
      {renderRadioGroup('People ANNOYED you by criticizing use?', 'cage_annoyed', ['Yes', 'No'])}
      {renderRadioGroup('Felt GUILTY about use?', 'cage_guilty', ['Yes', 'No'])}
      {renderRadioGroup('EYE-OPENER (used first thing in morning)?', 'cage_eye_opener', ['Yes', 'No'])}
      {renderRadioGroup('Substance created family problems?', 'cage_family_problems', ['Yes', 'No'])}
    </div>
  );

  const renderStep5 = () => (
    <div className={styles.stepContainer}>
      <h2 className={styles.sectionTitle}>Psychosocial</h2>
      {renderRadioGroup('Employment Status', 'employment_status', ['Employed', 'Unemployed', 'Student'])}
      {renderInput('Lives With', 'live_with_whom', 'e.g., Spouse, Alone')}
      {renderInput('Readiness to Change (1-10)', 'readiness_scale', '10 = Completely ready', 'number')}
      {renderInput('Primary Treatment Goal', 'primary_goal', 'What do you hope to achieve?')}
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading assessment details...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        <header className={styles.header}>
          <h1 className={styles.title}>Rehab Intake Assessment</h1>
          <button className={styles.closeBtn} onClick={() => navigate(-1)}>✕</button>
        </header>

        <div className={styles.progressContainer}>
          <div className={styles.progressBarBg}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }} 
            />
          </div>
          <span className={styles.progressText}>Step {currentStep} of {totalSteps}</span>
        </div>

        {generalError && <div className={styles.errorMessage}>{generalError}</div>}
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}

        <div className={styles.formBody}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        <div className={styles.buttonContainer}>
          <div className={styles.navButtonsLeft}>
            {currentStep > 1 && (
              <button type="button" className={styles.navButton} onClick={prevStep}>
                ‹ Back
              </button>
            )}
          </div>
          
          <div className={styles.navButtonsRight}>
            <button 
              type="button" 
              className={styles.secondaryButton} 
              onClick={handleSaveProgress} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Progress'}
            </button>

            {currentStep < totalSteps ? (
              <button type="button" className={styles.primaryButton} onClick={nextStep}>
                Next ›
              </button>
            ) : (
              <button 
                type="button" 
                className={`${styles.primaryButton} ${styles.submitButton}`} 
                onClick={handleSubmitFinal} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Final'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RehabIntakeForm;