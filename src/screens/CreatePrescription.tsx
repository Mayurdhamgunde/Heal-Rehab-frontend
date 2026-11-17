import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../css/CreatePrescription.module.css';
import api from '../utils/central';

interface MedicineItem {
  medicineName: string;
  strength: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
}

interface FormDataType {
  weight: string;
  bp: string;
  notes: string;
  prescriptionDate: string;
}

const CreatePrescription: React.FC = () => {
  const { patientId, appointmentId } = useParams<{ patientId: string; appointmentId?: string }>();
  const navigate = useNavigate();

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<FormDataType>({
    weight: '',
    bp: '',
    notes: '',
    prescriptionDate: getTodayDate(),
  });

  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      medicineName: '',
      strength: '',
      route: 'Oral',
      frequency: '',
      duration: '',
      quantity: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (name: keyof FormDataType, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleMedicineChange = (
    index: number,
    field: keyof MedicineItem,
    value: string
  ) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index][field] = value;
    setMedicines(updatedMedicines);

    if (errors[`medicine_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`medicine_${index}_${field}`]: '' }));
    }
  };

  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: '',
        strength: '',
        route: 'Oral',
        frequency: '',
        duration: '',
        quantity: '',
      },
    ]);
  };

  const removeMedicineRow = (index: number) => {
    if (medicines.length === 1) {
      alert('At least one medicine is required.');
      return;
    }
    const updatedMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(updatedMedicines);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    medicines.forEach((med, index) => {
      if (!med.medicineName.trim()) {
        newErrors[`medicine_${index}_medicineName`] = 'Name required';
      }
      if (!med.frequency.trim()) {
        newErrors[`medicine_${index}_frequency`] = 'Freq required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please ensure all medicines have a Name and Frequency.');
      return;
    }

    await submitPrescription();
  };

  const submitPrescription = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        patientId,
        appointmentId: appointmentId || null,
        prescriptionDate: new Date(formData.prescriptionDate).toISOString(),
        vitals: {
          weight: formData.weight,
          bp: formData.bp,
        },
        medicines: medicines,
        notes: formData.notes,
      };

      const response = await api.post(
        `/${patientId}/prescriptions`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        alert('Prescription saved successfully');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.mainCard}>
        
        {/* Modern Header */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1>New Prescription</h1>
            <p className={styles.subTitle}>Create a digital record for patient care</p>
          </div>
        </div>

        {/* Feature: Vitals Ribbon (The "Unique" Part) */}
        <div className={styles.vitalsRibbon}>
          <div className={styles.vitalCard}>
            <label className={styles.vitalLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007b8e" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Date
            </label>
            <input
              type="date"
              value={formData.prescriptionDate}
              onChange={(e) => handleInputChange('prescriptionDate', e.target.value)}
              className={styles.vitalInput}
            />
          </div>

          <div className={styles.vitalCard}>
            <label className={styles.vitalLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007b8e" strokeWidth="2">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
              Weight (kg)
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className={styles.vitalInput}
              placeholder="--"
              step="0.1"
            />
          </div>

          <div className={styles.vitalCard}>
            <label className={styles.vitalLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007b8e" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Blood Pressure
            </label>
            <input
              type="text"
              value={formData.bp}
              onChange={(e) => handleInputChange('bp', e.target.value)}
              className={styles.vitalInput}
              placeholder="--/--"
            />
          </div>
        </div>

        {/* Medicine Section */}
        <div className={styles.sectionTitle}>
          <span>Rx Medications</span>
        </div>

        <div className={styles.medicinesContainer}>
          {medicines.map((med, index) => (
            <div key={index} className={styles.medicineBlock}>
              <div className={styles.indexCircle}>{index + 1}</div>
              
              <div className={styles.medicineContent}>
                {/* Top Row: Name and Route */}
                <div className={styles.medicineRowTop}>
                  <div className={styles.fieldGroup}>
                    {index === 0 && <label className={styles.label}>Medicine Name <span className={styles.required}>*</span></label>}
                    <input
                      type="text"
                      value={med.medicineName}
                      onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                      className={`${styles.input} ${errors[`medicine_${index}_medicineName`] ? styles.errorInput : ''}`}
                      placeholder="Search medicine..."
                    />
                    {errors[`medicine_${index}_medicineName`] && (
                      <span className={styles.errorMsg}>{errors[`medicine_${index}_medicineName`]}</span>
                    )}
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    {index === 0 && <label className={styles.label}>Route</label>}
                    <select
                      value={med.route}
                      onChange={(e) => handleMedicineChange(index, 'route', e.target.value)}
                      className={styles.select}
                    >
                      <option value="Oral">Oral</option>
                      <option value="IV">IV</option>
                      <option value="IM">IM</option>
                      <option value="Topical">Topical</option>
                      <option value="Subcutaneous">SC</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Row: Details */}
                <div className={styles.medicineRowBottom}>
                  <div className={styles.fieldGroup}>
                    {index === 0 && <label className={styles.label}>Strength</label>}
                    <input
                      type="text"
                      value={med.strength}
                      onChange={(e) => handleMedicineChange(index, 'strength', e.target.value)}
                      className={styles.input}
                      placeholder="e.g. 500mg"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    {index === 0 && <label className={styles.label}>Frequency <span className={styles.required}>*</span></label>}
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                      className={`${styles.input} ${errors[`medicine_${index}_frequency`] ? styles.errorInput : ''}`}
                      placeholder="e.g. 1-0-1"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    {index === 0 && <label className={styles.label}>Duration / Qty</label>}
                    <div style={{display:'flex', gap: '10px'}}>
                      <input
                        type="number"
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        className={styles.input}
                        placeholder="Days"
                        min="1"
                      />
                      <input
                        type="text"
                        value={med.quantity}
                        onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)}
                        className={styles.input}
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {medicines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedicineRow(index)}
                  className={styles.removeBtn}
                  title="Remove"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addMedicineRow} className={styles.addBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Another Medicine
        </button>

        {/* Notes Section */}
        <div className={styles.sectionTitle}>
          <span>Instructions</span>
        </div>
        <div className={styles.notesContainer}>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className={styles.textarea}
            placeholder="Add special instructions, diet advice, or follow-up notes..."
            rows={4}
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnCancel}`}
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnSubmit}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner}></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save Prescription</span> 
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePrescription;