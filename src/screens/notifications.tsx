import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBellSlash, FaChevronDown, FaCog, FaCreditCard, FaShieldAlt, FaBell, FaDownload, FaFilter } from 'react-icons/fa';
import { AxiosError } from 'axios'; 
import api from '../utils/central';
import styles from '../css/notifications.module.css';

interface NotificationMetadata {
  subscription_plan?: string;
  days_remaining?: number;
  expiry_date?: string;
  auto_renew?: boolean;
  billing_cycle?: string;
  [key: string]: any;
}

interface Notification {
  _id: string;
  tenant_id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
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

interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: Pagination;
  };
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterOption, setFilterOption] = useState('all');
  const [sortOption] = useState('created_at');
  const [sortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_prev: false,
  });

  // Mock session context (replace with actual session context)
  const session = { idToken: 'mock-token' }; // Adjust based on your session management

  useEffect(() => {
    if (session.idToken) {
      fetchNotifications(1, true);
    }
  }, [session.idToken, filterOption, sortOption, sortOrder]);

  const buildQueryParams = (page: number = 1) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '20');
    if (filterOption === 'all') {
      params.append('status', 'all');
    } else if (filterOption === 'unread' || filterOption === 'read') {
      params.append('status', filterOption);
    } else if (filterOption.includes('_priority')) {
      params.append('status', 'all');
      params.append('priority', filterOption.replace('_priority', ''));
    }
    params.append('sort', 'created_at');
    params.append('order', 'desc');
    return params.toString();
  };

  const fetchNotifications = async (page: number = 1, reset: boolean = false) => {
    if (!session.idToken) return;
    try {
      if (page === 1 || reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      const queryParams = buildQueryParams(page);
      const response = await api.get<NotificationsResponse>(`/notification?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.idToken}` },
      });
      if (response.data.success) {
        let notificationsData = response.data.data.notifications;
        notificationsData = notificationsData.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        if (page === 1 || reset) {
          setNotifications(notificationsData);
        } else {
          setNotifications((prev) => [...prev, ...notificationsData]);
        }
        setPagination(response.data.data.pagination);
      }
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        setNotifications([]);
        setPagination({
          current_page: 1,
          total_pages: 1,
          total_count: 0,
          has_next: false,
          has_prev: false,
        });
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_next && !isLoadingMore) {
      fetchNotifications(pagination.current_page + 1);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    navigate(`/notification/${notification._id}`);
  };

  const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high':
      return { color: '#ef4444', icon: 'bell', bgColor: '#fef2f2', gradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' };
    case 'medium':
      return { color: '#f59e0b', icon: 'alert-circle', bgColor: '#fffbeb', gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' };
    case 'low':
      return { color: '#10b981', icon: 'info', bgColor: '#ecfdf5', gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' };
    default:
      return { 
        color: '#007b8e', 
        icon: 'alert-circle', 
        bgColor: '#e6f4f6', // Light teal background to complement #007b8e
        gradient: 'linear-gradient(135deg, #e6f4f6 0%, #cce8ec 100%)' // Adjusted gradient
      };
  }
};

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'system':
        return 'cog';
      case 'billing':
        return 'credit-card';
      case 'security':
        return 'shield';
      case 'updates':
        return 'download';
      default:
        return 'bell';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getFilterOptions = () => [
    { value: 'all', label: 'All Notifications', count: notifications.length },
    { value: 'unread', label: 'Unread', count: notifications.filter(n => n.status === 'unread').length },
    { value: 'read', label: 'Read', count: notifications.filter(n => n.status === 'read').length },
    { value: 'high_priority', label: 'High Priority', count: notifications.filter(n => n.priority === 'high').length },
    { value: 'medium_priority', label: 'Medium Priority', count: notifications.filter(n => n.priority === 'medium').length },
    { value: 'low_priority', label: 'Low Priority', count: notifications.filter(n => n.priority === 'low').length }
  ];

  const renderSkeletonLoader = () => (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonSubtitle}></div>
          </div>
          <div className={styles.skeletonFilter}></div>
        </div>
      </header>
      <div className={styles.contentContainer}>
        <div className={styles.notificationGrid}>
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonCardHeader}>
                <div className={styles.skeletonIcon}></div>
                <div className={styles.skeletonTime}></div>
              </div>
              <div className={styles.skeletonCardTitle}></div>
              <div className={styles.skeletonCardMessage}></div>
              <div className={styles.skeletonCardFooter}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <FaBellSlash size={48} />
      </div>
      <h2 className={styles.emptyStateTitle}>All Caught Up!</h2>
      <p className={styles.emptyStateMessage}>
        No new notifications to show. You're up to date with everything.
      </p>
    </div>
  );

  const renderNotificationItem = (notification: Notification, index: number) => {
    const priorityConfig = getPriorityConfig(notification.priority);
    return (
      <div
        className={`${styles.notificationCard} ${
          notification.status === 'unread' ? styles.unreadCard : ''
        }`}
        onClick={() => handleNotificationClick(notification)}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className={styles.cardHeader}>
          <div 
            className={styles.iconContainer}
            style={{ background: priorityConfig.gradient }}
          >
            <FaIcon icon={getCategoryIcon(notification.category)} size={16} color={priorityConfig.color} />
          </div>
          <div className={styles.headerRight}>
            <span className={styles.timestamp}>{formatDate(notification.created_at)}</span>
            {notification.status === 'unread' && (
              <div className={styles.unreadDot} style={{ backgroundColor: priorityConfig.color }}></div>
            )}
          </div>
        </div>
        
        <div className={styles.cardContent}>
          <h3 className={`${styles.title} ${notification.status === 'unread' ? styles.unreadTitle : ''}`}>
            {notification.title}
          </h3>
          <p className={styles.message}>{notification.message}</p>
        </div>
        
        <div className={styles.cardFooter}>
          <div 
            className={styles.categoryChip}
            style={{ 
              backgroundColor: priorityConfig.bgColor,
              color: priorityConfig.color,
              borderColor: priorityConfig.color + '20'
            }}
          >
            {notification.category}
          </div>
          {notification.action_required && (
            <div className={styles.actionBadge} style={{ backgroundColor: priorityConfig.color }}>
              Action Required
            </div>
          )}
        </div>
        
        <div 
          className={styles.priorityIndicator} 
          style={{ backgroundColor: priorityConfig.color }}
        ></div>
      </div>
    );
  };

  // Custom icon component to map string icons to FaIcons
  const FaIcon: React.FC<{ icon: string; size: number; color: string }> = ({ icon, size, color }) => {
    switch (icon) {
      case 'cog':
        return <FaCog size={size} color={color} />;
      case 'credit-card':
        return <FaCreditCard size={size} color={color} />;
      case 'shield':
        return <FaShieldAlt size={size} color={color} />;
      case 'download':
        return <FaDownload size={size} color={color} />;
      default:
        return <FaBell size={size} color={color} />;
    }
  };

  if (isLoading && pagination.current_page === 1) {
    return renderSkeletonLoader();
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.headerTitle}>
              Notifications
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount}</span>
              )}
            </h1>
            <p className={styles.headerSubtitle}>
              Stay updated with your latest activities
            </p>
          </div>
          <div className={styles.filterContainer}>
            <button 
              className={styles.filterButton}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <FaFilter size={14} />
              Filter
              <FaChevronDown size={12} className={`${styles.filterChevron} ${showFilterMenu ? styles.rotated : ''}`} />
            </button>
            {showFilterMenu && (
              <div className={styles.filterDropdown}>
                {getFilterOptions().map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${filterOption === option.value ? styles.active : ''}`}
                    onClick={() => {
                      setFilterOption(option.value);
                      setShowFilterMenu(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className={styles.filterCount}>{option.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className={styles.contentContainer}>
        {notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <div className={styles.notificationGrid}>
              {notifications.map((notification, index) => (
                <div key={notification._id}>
                  {renderNotificationItem(notification, index)}
                </div>
              ))}
            </div>
            {pagination.has_next && (
              <div className={styles.loadMoreContainer}>
                <button
                  className={`${styles.loadMoreButton} ${isLoadingMore ? styles.loading : ''}`}
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <div className={styles.spinner}></div>
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Notifications</span>
                      <FaChevronDown className={styles.loadMoreIcon} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;