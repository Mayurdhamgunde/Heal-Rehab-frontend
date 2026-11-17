import React, { useEffect, useState, useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from '../css/AdminReport.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGoogle,
  faFacebook,
  faInstagram,
  faTwitter,
  faWhatsapp,
  faLinkedin,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/central';

// Register ChartJS components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Types
interface ReferralData {
  doctor_name: string;
  referral_count: number;
}

interface SocialReferenceData {
  source: string;
  count: number;
}

interface AdminReportsProps {
  selectedMonth?: string;
  selectedYear?: string;
  startDate?: string;
  endDate?: string;
}

const AdminReports: React.FC<AdminReportsProps> = ({ selectedMonth, selectedYear, startDate, endDate }) => {
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [socialReferenceData, setSocialReferenceData] = useState<SocialReferenceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Fetch data
  const fetchReportData = async () => {
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

      const referralResponse = await api.get(`/get/refrells?${queryParams.toString()}`);
      const transformedReferralData: ReferralData[] = referralResponse.data.referralDetails?.map(
        (detail: { _id: string; referralCount: number }) => ({
          doctor_name:
            detail._id === 'Patient Reference'
              ? 'Patient Reference'
              : detail._id === 'Hospital Reference'
              ? 'Hospital Reference'
              : detail._id,
          referral_count: detail.referralCount,
        })
      ) || [];

      const socialReferenceResponse = await api.get(`/get/socialrefrence?${queryParams.toString()}`);
      const transformedSocialReferenceData: SocialReferenceData[] = Object.entries(
        socialReferenceResponse.data.data?.pivotArray?.find(
          (item: any) => 
            (selectedMonth && selectedYear 
              ? item.year === parseInt(selectedYear) && item.month === months[parseInt(selectedMonth) - 1].slice(0, 3)
              : selectedYear 
              ? item.year === parseInt(selectedYear)
              : true)
        ) || {}
      )
        .filter(([key, value]) => key !== 'year' && key !== 'month' && key !== 'total' && typeof value === 'number' && key !== '(blank)')
        .map(([source, count]) => ({
          source: source === '(blank)' ? 'Unspecified' : source,
          count: count as number,
        }));

      setReferralData(transformedReferralData);
      setSocialReferenceData(transformedSocialReferenceData);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Chart colors
  const modernColors = [
    '#007b8e', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#3498db', '#1abc9c',
  ];

  // Memoized Pie Chart Data
  const referralPieChartData = useMemo(
    () => ({
      labels: referralData.map(item => item.doctor_name),
      datasets: [
        {
          data: referralData.map(item => item.referral_count),
          backgroundColor: modernColors,
          hoverBackgroundColor: modernColors.map(color => `${color}CC`),
        },
      ],
    }),
    [referralData]
  );

  // Memoized Bar Chart Data
  const socialReferenceBarChartData = useMemo(
    () => ({
      labels: socialReferenceData.map(item => item.source),
      datasets: [
        {
          data: socialReferenceData.map(item => item.count),
          backgroundColor: '#007b8e',
          hoverBackgroundColor: '#007b8eCC',
        },
      ],
    }),
    [socialReferenceData]
  );

  // Memoized Chart Options
  const pieChartOptions = useMemo(
    () => ({
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      maintainAspectRatio: false,
      responsive: true,
    }),
    []
  );

  const barChartOptions = useMemo(
    () => ({
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: { 
          display: true, 
          ticks: { display: true, color: '#333', font: { size: 10 } },
          grid: { display: false },
        },
        y: { 
          beginAtZero: true, 
          display: true, 
          ticks: { color: '#333', font: { size: 10 } },
          grid: { display: false },
        },
      },
      maintainAspectRatio: false,
      responsive: true,
    }),
    []
  );

  // Social reference icons
  const getSocialReferenceIcon = (source: string) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('google')) return faGoogle;
    if (sourceLower.includes('facebook')) return faFacebook;
    if (sourceLower.includes('instagram')) return faInstagram;
    if (sourceLower.includes('twitter') || sourceLower.includes('x')) return faTwitter;
    if (sourceLower.includes('whatsapp')) return faWhatsapp;
    if (sourceLower.includes('linkedin')) return faLinkedin;
    if (sourceLower.includes('youtube')) return faYoutube;
    return faGlobe;
  };

  // Skeleton UI Component
  const SkeletonUI = () => (
    <div className={styles.reportsContainer}>
      <div className={styles.leftColumn}>
        <div className={styles.chartCard}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonPieChart}></div>
          <div className={styles.legendContainer}>
            {[1, 2, 3].map((_, index) => (
              <div key={index} className={styles.legendItem}>
                <div className={styles.skeletonLegendBox}></div>
                <div className={styles.skeletonLegendText}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.rightColumn}>
        <div className={styles.chartCard}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonBarChart}>
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className={styles.skeletonBar}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.contentCard}>
      <div className={styles.componentWrapper}>
        {loading ? (
          <SkeletonUI />
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : (
          <div className={styles.reportsContainer}>
            <div className={styles.leftColumn}>
              {referralPieChartData.labels.length > 0 ? (
                <div className={styles.chartCard}>
                  <h3 className={styles.contentTitle}>New Referrals</h3>
                  <div className={styles.chartContent}>
                    <div className={styles.chartWrapper}>
                      <Pie
                        data={referralPieChartData}
                        options={pieChartOptions}
                        height={150}
                        width={150}
                      />
                    </div>
                    <div className={styles.legendContainer}>
                      {referralPieChartData.labels.map((label, index) => (
                        <div key={index} className={styles.legendItem}>
                          <div
                            className={styles.legendColorBox}
                            style={{ backgroundColor: modernColors[index % modernColors.length] }}
                          />
                          <span className={styles.legendText}>
                            {label} ({referralPieChartData.datasets[0].data[index]})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.chartCard}>
                  <p className={styles.noDataText}>No referral data available</p>
                </div>
              )}
            </div>
            <div className={styles.rightColumn}>
              {socialReferenceBarChartData.labels.length > 0 ? (
                <div className={styles.chartCard}>
                  <h3 className={styles.contentTitle}>Social References</h3>
                  <div className={styles.barChartContainer}>
                    <Bar
                      data={socialReferenceBarChartData}
                      options={barChartOptions}
                      height={150}
                      width={300}
                    />
                    <div className={styles.iconContainer}>
                      {socialReferenceData.map((item, index) => (
                        <div key={index} className={styles.iconWrapper}>
                          <FontAwesomeIcon
                            icon={getSocialReferenceIcon(item.source)}
                            className={styles.icon}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.chartCard}>
                  <p className={styles.noDataText}>No social reference data available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;