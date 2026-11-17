import React, { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import styles from '../css/IndustryDropDown.module.css';

// Define the industry type
interface Industry {
  id: string;
  name: string;
}

// Define the props interface for the IndustryDropdown component
interface IndustryDropdownProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const industries: Industry[] = [
  { id: 'physiotherapy', name: 'Physiotherapy' },
  { id: 'dentistry', name: 'Dentistry' },
  { id: 'gynacologist', name: 'Gynecologist' },
  { id: 'ayurveda', name: 'Ayurveda' },
  { id: 'homeopathy', name: 'Homeopathy' },
  { id: 'pediatrics', name: 'Pediatrics' },
];

const IndustryDropdown: React.FC<IndustryDropdownProps> = ({
  selectedValue,
  onValueChange,
  placeholder = 'Select Speciality',
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const handleSelect = (industry: Industry) => {
    onValueChange(industry.id);
    setIsVisible(false);
  };

  const selectedIndustry = industries.find(
    (industry: Industry) => industry.id === selectedValue
  );

  return (
    <div className={styles.container}>
      {/* Dropdown Selector */}
      <button
        className={styles.selector}
        onClick={() => setIsVisible(true)}
      >
        <span className={styles.selectorText}>
          {selectedIndustry ? selectedIndustry.name : placeholder}
        </span>
        <ChevronDown className={styles.icon} />
      </button>

      {/* Modal/Dropdown Menu */}
      {isVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Select Speciality</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsVisible(false)}
              >
                <X className={styles.icon} />
              </button>
            </div>

            {/* Dropdown Items */}
            <div className={styles.dropdownContainer}>
              {industries.map((industry, index) => (
                <button
                  key={industry.id}
                  className={`${styles.dropdownItem} ${
                    selectedValue === industry.id ? styles.selectedItem : ''
                  } ${index === industries.length - 1 ? styles.lastItem : ''}`}
                  onClick={() => handleSelect(industry)}
                >
                  <span
                    className={`${styles.dropdownItemText} ${
                      selectedValue === industry.id ? styles.selectedItemText : ''
                    }`}
                  >
                    {industry.name}
                  </span>
                  {selectedValue === industry.id && (
                    <Check className={styles.checkIcon} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustryDropdown;