import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBell, 
  FaUser, 
  FaCheckCircle, 
  FaCircle, 
  FaGlobe, 
  FaFileAlt,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfoCircle,
  FaShieldAlt,
  FaCreditCard,
  FaCog,
  FaReceipt,
  FaDownload,
  FaComments,
  FaCalendarAlt,
  FaArrowRight,
} from 'react-icons/fa';
import api from '../utils/central';
import styles from '../css/notificationDetail.module.css';

interface NotificationMetadata {
  subscription_plan?: string;
  days_remaining?: number;
  expiry_date?: string;
  auto_renew?: boolean;
  billing_cycle?: string;
  [key: string]: any;
}

interface NotificationDetail {
  _id: string;
  tenant_id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'read' | 'unread';
  category: string;
  metadata: NotificationMetadata;
  recipient: string;
  is_global: boolean;
  action_required: boolean;
  action_url?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface NotificationDetailResponse {
  success: boolean;
  data: NotificationDetail;
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}

// Skeleton Loader Component
const SkeletonLoader: React.FC = () => (
  <div className={styles.container}>
    <div className={styles.header}>
      <div className={styles.skeletonBackButton}></div>
      <div className={styles.skeletonHeaderTitle}></div>
    </div>

    <div className={styles.content}>
      {/* Hero Section Skeleton */}
      <div className={styles.heroSection}>
        <div className={styles.badgeContainer}>
          <div className={styles.skeletonBadge}></div>
          <div className={styles.skeletonBadge}></div>
        </div>
        <div className={styles.skeletonHeroTitle}></div>
        <div className={styles.skeletonTimestamp}></div>
      </div>

      {/* Message Card Skeleton */}
      <div className={styles.messageCard}>
        <div className={styles.messageHeader}>
          <div className={styles.skeletonIcon}></div>
          <div className={styles.skeletonMessageTitle}></div>
        </div>
        <div className={styles.skeletonMessageText}>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine} style={{width: '75%'}}></div>
        </div>
      </div>

      {/* Metadata Card Skeleton */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.skeletonIcon}></div>
          <div className={styles.skeletonCardTitle}></div>
        </div>
        <div className={styles.metadataGrid}>
          {[...Array(4)].map((_, index) => (
            <div key={index} className={styles.skeletonMetadataItem}>
              <div className={styles.skeletonMetadataKey}></div>
              <div className={styles.skeletonMetadataValue}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Info Cards Skeleton */}
      <div className={styles.quickInfoGrid}>
        {[...Array(4)].map((_, index) => (
          <div key={index} className={styles.infoCard}>
            <div className={styles.skeletonInfoIcon}></div>
            <div className={styles.infoContent}>
              <div className={styles.skeletonInfoLabel}></div>
              <div className={styles.skeletonInfoValue}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button Skeleton */}
      <div className={styles.skeletonActionButton}></div>
    </div>
  </div>
);

const NotificationDetail: React.FC = () => {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notification details
  const fetchNotificationDetail = async () => {
    if (!notificationId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<NotificationDetailResponse>(
        `/notification/${notificationId}`
      );
      
      if (response.data.success) {
        setNotification(response.data.data);
      } else {
        setError('Failed to fetch notification details');
      }
    } catch (err) {
      console.error('Error fetching notification details:', err);
      setError('Failed to fetch notification details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionPress = () => {
    const targetUrl = 'https://doctor.healtrackai.com/payment';
    
    const confirmOpen = window.confirm(
      'This will open the payment page in a new tab. Continue?'
    );
    
    if (confirmOpen) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Get priority configuration
  const getPriorityConfig = (priority: string) => {
    const configs = {
      high: {
        color: '#FF6B6B',
        bgColor: 'rgba(255, 107, 107, 0.1)',
        icon: <FaExclamationTriangle />,
        label: 'High Priority'
      },
      medium: {
        color: '#FFB946',
        bgColor: 'rgba(255, 185, 70, 0.1)',
        icon: <FaBell />,
        label: 'Medium Priority'
      },
      low: {
        color: '#51CF66',
        bgColor: 'rgba(81, 207, 102, 0.1)',
        icon: <FaInfoCircle />,
        label: 'Low Priority'
      },
      critical: {
        color: '#ffffff',
        bgColor: 'rgba(255, 0, 0, 0.15)',
        icon: <FaExclamationCircle />,
        label: 'Critical Priority'
      }
    };

    return configs[priority as keyof typeof configs] || {
      color: '#007b8e',
      bgColor: 'rgba(0, 123, 142, 0.1)',
      icon: <FaInfoCircle />,
      label: 'Normal Priority'
    };
  };

  // Format date with relative time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let relative = '';
    if (diffDays > 0) {
      relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      relative = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      relative = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      relative = 'Just now';
    }

    return {
      formatted: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      relative,
    };
  };

  // Get category configuration
  const getCategoryConfig = (category: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
      subscription: { icon: <FaCreditCard />, color: '#007B8E', bg: 'rgba(0, 123, 142, 0.1)' },
      security: { icon: <FaShieldAlt />, color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' },
      system: { icon: <FaCog />, color: '#007b8e', bg: 'rgba(0, 123, 142, 0.1)' },
      billing: { icon: <FaReceipt />, color: '#51CF66', bg: 'rgba(81, 207, 102, 0.1)' },
      update: { icon: <FaDownload />, color: '#FFB946', bg: 'rgba(255, 185, 70, 0.1)' },
      default: { icon: <FaBell />, color: '#6C757D', bg: 'rgba(108, 117, 125, 0.1)' }
    };

    return configs[category.toLowerCase()] || configs.default;
  };

  // Render info card
  const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, color = '#6C757D' }) => (
    <div className={styles.infoCard}>
      <div className={styles.infoIcon} style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className={styles.infoContent}>
        <div className={styles.infoLabel}>{label}</div>
        <div className={styles.infoValue}>{value}</div>
      </div>
    </div>
  );

  // Render metadata
  const renderMetadata = () => {
    if (!notification?.metadata || Object.keys(notification.metadata).length === 0) {
      return null;
    }

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FaInfoCircle className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Additional Details</h3>
        </div>
        <div className={styles.metadataGrid}>
          {Object.entries(notification.metadata).map(([key, value]) => {
            if (value === null || value === undefined) return null;
            
            let displayValue = value;
            if (key.includes('date') && typeof value === 'string') {
              const dateTime = formatDateTime(value);
              displayValue = dateTime.formatted;
            } else if (typeof value === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            }

            return (
              <div key={key} className={styles.metadataItem}>
                <div className={styles.metadataKey}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className={styles.metadataValue}>{String(displayValue)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchNotificationDetail();
  }, [notificationId]);

  // Show skeleton loader while loading
  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !notification) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className={styles.headerTitle}>Notification Details</h1>
        </div>
        <div className={styles.emptyContainer}>
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <FaFileAlt />
            </div>
            <h2 className={styles.emptyTitle}>Notification Not Found</h2>
            <p className={styles.emptyMessage}>
              {error || "This notification may have been removed or doesn't exist."}
            </p>
            <button 
              className={styles.emptyButton}
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priorityConfig = getPriorityConfig(notification.priority);
  const categoryConfig = getCategoryConfig(notification.category);
  const createdDateTime = formatDateTime(notification.created_at);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Notification Details</h1>
      </div>

      <div className={styles.content}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.badgeContainer}>
            <div 
              className={styles.categoryBadge} 
              style={{ backgroundColor: categoryConfig.bg }}
            >
              {categoryConfig.icon}
              <span style={{ color: categoryConfig.color }}>
                {notification.category}
              </span>
            </div>
            <div 
              className={styles.priorityBadge} 
              style={{ backgroundColor: priorityConfig.bgColor }}
            >
              {priorityConfig.icon}
              <span style={{ color: priorityConfig.color }}>
                {priorityConfig.label}
              </span>
            </div>
          </div>
          
          <h1 className={styles.heroTitle}>{notification.title}</h1>
          <p className={styles.heroTimestamp}>
            <FaCalendarAlt /> {createdDateTime.relative}
          </p>
        </div>

        {/* Message Card */}
        <div className={styles.messageCard}>
          <div className={styles.messageHeader}>
            <FaComments className={styles.messageIcon} />
            <h3 className={styles.messageTitle}>Message</h3>
          </div>
          <p className={styles.messageText}>{notification.message}</p>
        </div>
        
        {/* Metadata */}
        {renderMetadata()}

        {/* Quick Info Cards */}
        <div className={styles.quickInfoGrid}>
          <InfoCard
            icon={<FaUser />}
            label="Recipient"
            value={notification.recipient}
            color="#007b8e"
          />
          <InfoCard
            icon={notification.status === 'read' ? <FaCheckCircle /> : <FaCircle />}
            label="Status"
            value={notification.status === 'read' ? 'Read' : 'Unread'}
            color={notification.status === 'read' ? '#51CF66' : '#FFB946'}
          />
          <InfoCard
            icon={<FaGlobe />}
            label="Scope"
            value={notification.is_global ? 'Global' : 'Personal'}
            color="#845EC2"
          />
          <InfoCard
            icon={<FaFileAlt />}
            label="Type"
            value={notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            color="#6C757D"
          />
        </div>

        {/* Action Button */}
        {notification.action_required && (
          <button
            className={styles.actionButton}
            onClick={handleActionPress}
          >
            <span className={styles.actionTitle}>Subscribe</span>
            <FaArrowRight className={styles.actionIcon} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationDetail;