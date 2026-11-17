import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/central';
import styles from '../css/TherapyTypesByDoctor.module.css';

interface TherapyType {
  count: number;
  completed: number;
  cancelled: number;
  pending: number;
  scheduled: number;
}

interface DoctorTherapyTypes {
  doctor_name: string;
  therapyTypes: {
    'In Clinic': TherapyType;
    'In Home': TherapyType;
    'IP/ICU': TherapyType;
    'Online': TherapyType;
  };
}

interface TherapyTypeSummary {
  inClinic: number;
  inHome: number;
  ipIcu: number;
  online: number;
}

interface Props {
  selectedMonth?: string;
  selectedYear?: string;
  startDate?: string;
  endDate?: string;
}

const TherapyTypeByDoctor: React.FC<Props> = ({ selectedMonth, selectedYear, startDate, endDate }) => {
  const [data, setData] = useState<DoctorTherapyTypes[]>([]);
  const [summary, setSummary] = useState<TherapyTypeSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Calculate how many cards can fit in the viewport
  const cardsPerPage = 3;
  const totalPages = Math.ceil(data.length / cardsPerPage);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const hasTherapySessions = (doctor: DoctorTherapyTypes): boolean => {
    const therapyTypes = doctor.therapyTypes;
    return (
      therapyTypes['In Clinic'].count > 0 ||
      therapyTypes['In Home'].count > 0 ||
      therapyTypes['IP/ICU'].count > 0 ||
      therapyTypes['Online'].count > 0
    );
  };

  useEffect(() => {
    const fetchTherapyTypes = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (startDate && endDate) {
          queryParams.append('startDate', startDate);
          queryParams.append('endDate', endDate);
        } else if (selectedMonth && selectedYear) {
          queryParams.append('month', selectedMonth);
          queryParams.append('year', selectedYear);
        } else if (selectedYear) {
          queryParams.append('year', selectedYear);
        }

        const response = await api.get(`/get/typemonthly?${queryParams.toString()}`);

        if (response.data) {
          if (response.data.doctors) {
            const filteredDoctors = response.data.doctors.filter(hasTherapySessions);
            setData(filteredDoctors);
            setCurrentPage(0); // Reset to first page when data changes
          }

          if (response.data.aggregateStats?.therapyTypeTotals) {
            setSummary(response.data.aggregateStats.therapyTypeTotals);
          }
        }
      } catch (error) {
        console.error('Error fetching therapy types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapyTypes();
  }, [selectedMonth, selectedYear, startDate, endDate]);

  const scrollLeft = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
    }
  };

  const scrollRight = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
    }
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = currentPage * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const renderSummaryCards = (): React.ReactElement | null => {
    if (!summary) return null;

    const summaryData = [
      { label: 'In Clinic', value: summary.inClinic, color: '#007b8e' },
      { label: 'In Home', value: summary.inHome, color: '#0b5e69' },
      { label: 'IP/ICU', value: summary.ipIcu, color: '#2c3e50' },
      { label: 'Online', value: summary.online, color: '#27ae60' },
    ];

    return (
      <div className={styles.summaryContainer}>
        <h2 className={styles.summaryTitle}>Overall Summary</h2>
        <div className={styles.summaryCards}>
          {summaryData.map((item) => (
            <div
              key={item.label}
              className={styles.summaryCard}
              style={{ backgroundColor: item.color }}
            >
              <span className={styles.summaryCardLabel}>{item.label}</span>
              <span className={styles.summaryCardValue}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDoctorItem = (item: DoctorTherapyTypes, index: number): React.ReactElement => {
    const therapyData = [
      { type: 'In Clinic', data: item.therapyTypes['In Clinic'], color: '#007b8e' },
      { type: 'In Home', data: item.therapyTypes['In Home'], color: '#0b5e69' },
      { type: 'IP/ICU', data: item.therapyTypes['IP/ICU'], color: '#2c3e50' },
      { type: 'Online', data: item.therapyTypes['Online'], color: '#27ae60' },
    ];

    const totalSessions = therapyData.reduce((sum, therapy) => sum + therapy.data.count, 0);

    return (
      <div key={`${item.doctor_name}-${index}`} className={styles.doctorCard}>
        <div className={styles.doctorHeader}>
          <div className={styles.doctorInfo}>
            <div className={styles.doctorAvatar}>
              <span className={styles.doctorAvatarText}>
                {item.doctor_name?.charAt(0) || 'D'}
              </span>
            </div>
            <div className={styles.doctorDetails}>
              <span className={styles.doctorName}>{item.doctor_name}</span>
              <span className={styles.totalSessions}>Total: {totalSessions}</span>
            </div>
          </div>
        </div>

        <div className={styles.therapySection}>
          <h3 className={styles.therapySectionTitle}>Distribution</h3>
          {therapyData.map((therapy) => (
            <div key={therapy.type} className={styles.therapyRow}>
              <div className={styles.therapyInfo}>
                <span className={styles.therapyType}>{therapy.type}</span>
              </div>
              <div className={styles.therapyDetails}>
                <div className={styles.therapyCountBadge} style={{ backgroundColor: therapy.color }}>
                  <span className={styles.therapyCount}>{therapy.data.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.componentContainer}>
        <div className={styles.loading}>
          <div className={styles.loader}></div>
          <span className={styles.loadingText}>Loading...</span>
        </div>
      </div>
    );
  }

  // Calculate period label for display
  let periodLabel = 'All Time';
  if (startDate && endDate) {
    periodLabel = `${startDate} to ${endDate}`;
  } else if (selectedMonth && selectedYear) {
    periodLabel = `${months[parseInt(selectedMonth) - 1]} ${selectedYear}`;
  } else if (selectedYear) {
    periodLabel = `Year ${selectedYear}`;
  }

  return (
    <div className={styles.componentContainer}>
      <h2 className={styles.chartSubtitle}>
        {periodLabel}
      </h2>

      {renderSummaryCards()}

      {data.length === 0 ? (
        <div className={styles.noDataContainer}>
          <span className={styles.noDataText}>
            No doctors with therapy sessions found
          </span>
        </div>
      ) : (
        <div className={styles.doctorPerformanceSection}>
          <div className={styles.doctorPerformanceHeader}>
            <h2 className={styles.doctorsListTitle}>Doctor Performance</h2>
          </div>
          
          <div className={styles.sliderWrapper}>
            <button 
              className={`${styles.navButton} ${styles.navButtonLeft}`}
              onClick={scrollLeft}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <span className={styles.navArrow}>‹</span>
            </button>
            
            <div className={styles.sliderContainer}>
              <div className={styles.doctorSlider} ref={sliderRef}>
                {getCurrentPageData().map((item, index) => renderDoctorItem(item, index))}
              </div>
            </div>
            
            <button 
              className={`${styles.navButton} ${styles.navButtonRight}`}
              onClick={scrollRight}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              <span className={styles.navArrow}>›</span>
            </button>
          </div>
          
          {totalPages > 1 && (
            <div className={styles.paginationDots}>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${index === currentPage ? styles.dotActive : ''}`}
                  onClick={() => goToPage(index)}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TherapyTypeByDoctor;