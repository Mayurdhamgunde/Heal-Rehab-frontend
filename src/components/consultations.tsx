import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaStethoscope, FaPlus, FaTimes } from 'react-icons/fa';
import api from '../utils/central';
import styles from '../css/consultations.module.css';

interface Consultation {
  _id: string;
  causes: string;
  consultationDate: string;
  consultationTime: string;
  doctorName: string;
  notes: string;
  results: string;
  patientSymptoms: string;
}

interface ConsultationsProps {
  consultations: Consultation[];
}

type FormDataType = {
  patientSymptoms: string;
  causes: string;
  notes: string;
  results: string;
  consultationDate: Date;
  consultationTime: Date;
};

const Consultations: React.FC<ConsultationsProps> = ({ consultations }) => {
  const { patientId } = useParams<{ patientId: string }>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormDataType>({
    defaultValues: {
      patientSymptoms: '',
      causes: '',
      notes: '',
      results: '',
      consultationDate: new Date(),
      consultationTime: new Date(),
    },
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBookConsultation = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
    setSuccess(null);
    reset();
  };

  const onSubmit = async (data: FormDataType) => {
    if (!patientId) {
      setError('Patient ID not provided');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const consultationDateTime = new Date(data.consultationDate);
      const time = new Date(data.consultationTime);
      consultationDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

      const resultsApiValue = data.results === 'Therapy needed' ? 'therapy_needed' : 'therapy_not_needed';

      const formData = {
        patientSymptoms: data.patientSymptoms,
        causes: data.causes,
        notes: data.notes,
        results: resultsApiValue,
        consultationDate: consultationDateTime.toISOString().split('T')[0],
        consultationTime: consultationDateTime.toTimeString().split(' ')[0],
      };

      await api.post(`/patient/${patientId}/consultations`, formData);
      setSuccess('Consultation booked successfully!');
      reset();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error booking consultation');
      console.error('Error booking consultation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.consultationsTab}>
      <div className={styles.sectionHeader}>
  <div className={styles.rightAlignedButton}>
    <button className={styles.addButton} onClick={handleBookConsultation} title="Book Consultation" aria-label="Book Consultation">
      <FaPlus size={20} />
    </button>
  </div>
</div>


      {consultations.length === 0 ? (
        <div className={styles.noRecords}>
          <p>No consultations found for this patient.</p>
        </div>
      ) : (
        <div className={styles.consultationsList}>
          {consultations.slice().reverse().map((consultation) => (
            <div key={consultation._id} className={styles.consultationCard}>
              <div className={styles.consultationHeader}>
                <div className={styles.consultationHeaderLeft}>
                  <div className={styles.consultationIcon}>
                    <FaStethoscope size={20} />
                  </div>
                  <div>
                    <h4>{consultation.causes}</h4>
                    <span className={styles.consultationDatetime}>
                      {formatDate(consultation.consultationDate)} • {consultation.consultationTime}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.consultationDetails}>
                <div className={styles.column}>
                  <div className={styles.consultationItem}>
                    <span className={styles.consultationLabel}>Doctor:</span>
                    <span className={styles.consultationValue}>{consultation.doctorName}</span>
                  </div>
                  <div className={styles.consultationItem}>
                    <span className={styles.consultationLabel}>Symptoms:</span>
                    <span className={styles.consultationValue}>{consultation.patientSymptoms}</span>
                  </div>
                </div>
                <div className={styles.column}>
                  <div className={styles.consultationItem}>
                    <span className={styles.consultationLabel}>Notes:</span>
                    <span className={styles.consultationValue}>{consultation.notes}</span>
                  </div>
                  <div className={styles.consultationItem}>
                    <span className={styles.consultationLabel}>Results:</span>
                    <span className={styles.consultationValue}>{consultation.results}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button
              className={styles.closeButton}
              onClick={handleCloseModal}
              aria-label="Close Modal"
            >
              <FaTimes size={20} />
            </button>
            <div className={styles.modalHeader}>
              <h2>Book Consultation</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="patientSymptoms" className={styles.label}>
                    Symptoms <span className={styles.required}>*</span>
                  </label>
                  <Controller
                    name="patientSymptoms"
                    control={control}
                    rules={{ required: 'Symptoms are required' }}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="patientSymptoms"
                        className={`${styles.input} ${styles.textarea} ${errors.patientSymptoms ? styles.errorInput : ''}`}
                        placeholder="Enter patient symptoms"
                      />
                    )}
                  />
                  {errors.patientSymptoms && (
                    <span className={styles.errorMessage}>{errors.patientSymptoms.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="causes" className={styles.label}>
                    Causes <span className={styles.required}>*</span>
                  </label>
                  <Controller
                    name="causes"
                    control={control}
                    rules={{ required: 'Causes are required' }}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="causes"
                        className={`${styles.input} ${styles.textarea} ${errors.causes ? styles.errorInput : ''}`}
                        placeholder="Enter possible causes"
                      />
                    )}
                  />
                  {errors.causes && (
                    <span className={styles.errorMessage}>{errors.causes.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="notes" className={styles.label}>
                    Notes
                  </label>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="notes"
                        className={`${styles.input} ${styles.textarea}`}
                        placeholder="Additional notes"
                      />
                    )}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="results" className={styles.label}>
                    Results <span className={styles.required}>*</span>
                  </label>
                  <Controller
                    name="results"
                    control={control}
                    rules={{ required: 'Please select a result' }}
                    render={({ field }) => (
                      <select
                        {...field}
                        id="results"
                        className={`${styles.input} ${errors.results ? styles.errorInput : ''}`}
                      >
                        <option value="" disabled>
                          Select result
                        </option>
                        <option value="Therapy needed">Therapy needed</option>
                        <option value="Therapy not needed">Therapy not needed</option>
                      </select>
                    )}
                  />
                  {errors.results && (
                    <span className={styles.errorMessage}>{errors.results.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="consultationDate" className={styles.label}>
                    Consultation Date <span className={styles.required}>*</span>
                  </label>
                  <Controller
                    name="consultationDate"
                    control={control}
                    rules={{ required: 'Consultation date is required' }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        dateFormat="MMMM d, yyyy"
                        className={`${styles.input} ${errors.consultationDate ? styles.errorInput : ''}`}
                        placeholderText="Select date"
                        minDate={new Date()}
                      />
                    )}
                  />
                  {errors.consultationDate && (
                    <span className={styles.errorMessage}>{errors.consultationDate.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="consultationTime" className={styles.label}>
                    Consultation Time <span className={styles.required}>*</span>
                  </label>
                  <Controller
                    name="consultationTime"
                    control={control}
                    rules={{ required: 'Consultation time is required' }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        className={`${styles.input} ${errors.consultationTime ? styles.errorInput : ''}`}
                        placeholderText="Select time"
                      />
                    )}
                  />
                  {errors.consultationTime && (
                    <span className={styles.errorMessage}>{errors.consultationTime.message}</span>
                  )}
                </div>
              </div>

              {error && <div className={styles.errorAlert}>{error}</div>}
              {success && <div className={styles.successAlert}>{success}</div>}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.cancelButton}`}
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.submitButton}`}
                  disabled={loading}
                >
                  {loading ? (
                    <span className={styles.spinner}></span>
                  ) : (
                    'Book Consultation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultations;