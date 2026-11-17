import React, { useState, useEffect } from 'react';
import styles from '../css/reportComponent.module.css';
import api from '../utils/central';

interface ReferralDetailsItem {
  _id: string;
  count: number;
}

interface ReportComponentProps {
  selectedMonth?: string;
  selectedYear?: string;
  startDate?: string;
  endDate?: string;
}

const ReferralDetails: React.FC<ReportComponentProps> = ({ selectedMonth, selectedYear, startDate, endDate }) => {
  const [referralDetails, setReferralDetails] = useState<ReferralDetailsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchReferralDetails = async () => {
      setLoading(true);
      setError(null);
      
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

        const response = await api.get(`/get/referralDetails?${queryParams.toString()}`);
        setReferralDetails(response.data.referralDetailsCount || []);
      } catch (err) {
        setError('Unable to load referral details');
        console.error('Error fetching referral details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralDetails();
  }, [selectedMonth, selectedYear, startDate, endDate]);

  const displayedData = showAll ? referralDetails : referralDetails.slice(0, 4);

  const renderSkeletonItems = () => (
    <>
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className={styles.summaryItem}>
          <div className={styles.skeletonLabel}></div>
          <div className={styles.skeletonValue}></div>
        </div>
      ))}
    </>
  );

  const renderReferralItems = () => (
    <>
      {displayedData.map((item, index) => (
        <div key={`${item._id}-${index}`} className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {item._id || 'Unknown Source'}
          </span>
          <span className={styles.summaryValue}>
            {item.count}
          </span>
        </div>
      ))}
    </>
  );

  return (
    <div className={styles.summaryDetails}>
      <h3 className={styles.contentTitle}>Referral Sources</h3>
      
      <div className={styles.summaryDetailsGrid}>
        {loading ? renderSkeletonItems() : renderReferralItems()}
      </div>

      {error && (
        <p className={styles.errorText}>{error}</p>
      )}

      {!loading && !error && displayedData.length === 0 && (
        <p className={styles.noDataText}>No referral data available for this period</p>
      )}

      {!loading && !error && referralDetails.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={styles.viewMoreButton}
        >
          {showAll ? 'Show Less' : `Show All (${referralDetails.length})`}
        </button>
      )}
    </div>
  );
};

export { ReferralDetails };