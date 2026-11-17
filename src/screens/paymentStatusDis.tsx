import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faChartBar,
  faUser,
  faDollarSign,
  faClock,
  faCheckCircle,
  faSort,
  faExclamationCircle,
  faXmark,
  faTable,
  faTh,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Chart from 'chart.js/auto';
import api from "../utils/central";
import styles from '../css/paymentStatusDist.module.css';
import { useNavigate } from 'react-router-dom'; 

// Type definitions
interface PatientInfo {
  patient_name: string;
  patient_phone: string;
}

interface AdditionalInfo {
  patient_diagnosis: string;
  therapy_category: string;
}

interface Timeline {
  therapy_start: string;
  therapy_end: string;
  days_remaining: number;
  plan_status: string;
}

interface SessionSummary {
  completed_sessions: number;
  estimated_sessions: number;
  session_progress_percentage: number;
  scheduled_sessions: number;
  remaining_sessions: number;
}

interface PaymentSummary {
  total_amount: number;
  received_amount: number;
  balance: number;
  per_session_amount: number;
  payment_progress_percentage: number;
  payment_urgency: 'high' | 'medium' | 'low';
  payment_type: string;
}

interface StatusIndicators {
  priority: string;
  payment_status: string;
  session_status: string;
  plan_status: string;
}

interface ActivePlan {
  plan_id: string;
  therapy_name: string;
  patient_info: PatientInfo;
  additional_info: AdditionalInfo;
  timeline: Timeline;
  session_summary: SessionSummary;
  payment_summary: PaymentSummary;
  status_indicators: StatusIndicators;
}

interface PaymentStatusBreakdown {
  completed: number;
  pending: number;
}

interface SessionStatusBreakdown {
  completed: number;
  ongoing: number;
}

interface PlanStatusBreakdown {
  active: number;
  completed: number;
  upcoming: number;
  unknown: number;
}

interface PaymentUrgencyBreakdown {
  high: number;
  medium: number;
  low: number;
}

interface ReportingPeriod {
  type: string;
  year: number;
  quarter: number | null;
  month: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface PaginationMeta {
  current_page: number;
  items_per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
  start_index: number;
  end_index: number;
  showing_count: number;
  links: {
    first: number | null;
    last: number | null;
    prev: number | null;
    next: number | null;
  };
  page_range: {
    start: number;
    end: number;
  };
}

interface Summary {
  total_plans: number;
  showing_plans: number;
  total_revenue_received: number;
  total_pending_balance: number;
  total_completed_sessions: number;
  total_scheduled_sessions: number;
  total_remaining_sessions: number;
  average_payment_completion: number;
  average_session_completion: number;
  reporting_period: ReportingPeriod;
  plans_by_status: PlanStatusBreakdown;
  payment_status_breakdown: PaymentStatusBreakdown;
  session_status_breakdown: SessionStatusBreakdown;
  payment_urgency_breakdown: PaymentUrgencyBreakdown;
  therapy_categories: string[];
  payment_types: string[];
}

interface ApiResponse {
  message: string;
  summary: Summary;
  plans_report: ActivePlan[];
  pagination: PaginationMeta;
}

interface FilterState {
  reporting_period: string;
  report_year: string;
  report_quarter: string;
  report_month: string;
  payment_status: string;
  session_status: string;
  plan_status: string;
  patient_name: string;
  therapy_name: string;
  therapy_category: string;
  payment_type: string;
  priority: string;
  min_amount: string;
  max_amount: string;
  min_balance: string;
  max_balance: string;
  min_sessions: string;
  max_sessions: string;
  payment_progress_min: string;
  payment_progress_max: string;
  created_after: string;
  created_before: string;
  include_zero_balance: string;
  overdue_only: string;
  high_balance_only: string;
  last_payment_after: string;
  last_payment_before: string;
  days_remaining_filter: string;
}

type SortBy =
  | "urgency"
  | "newest"
  | "oldest"
  | "balance_desc"
  | "balance_asc"
  | "amount_desc"
  | "amount_asc"
  | "payment_progress_desc"
  | "payment_progress_asc"
  | "completed_desc"
  | "completed_asc"
  | "scheduled_desc"
  | "scheduled_asc"
  | "remaining_desc"
  | "remaining_asc"
  | "patient_name"
  | "therapy_name"
  | "plan_status";

interface SortOption {
  value: string;
  label: string;
}

const PaymentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [filteredPlans, setFilteredPlans] = useState<ActivePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<string>('payment');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('urgency');
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [offset, setOffset] = useState(0);
  const [limit,] = useState(20); // Align with backend default
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    reporting_period: 'all',
    report_year: new Date().getFullYear().toString(),
    report_quarter: '',
    report_month: '',
    payment_status: '',
    session_status: '',
    plan_status: '',
    patient_name: '',
    therapy_name: '',
    therapy_category: '',
    payment_type: '',
    priority: '',
    min_amount: '',
    max_amount: '',
    min_balance: '',
    max_balance: '',
    min_sessions: '',
    max_sessions: '',
    payment_progress_min: '',
    payment_progress_max: '',
    created_after: '',
    created_before: '',
    include_zero_balance: '',
    overdue_only: '',
    high_balance_only: '',
    last_payment_after: '',
    last_payment_before: '',
    days_remaining_filter: '',
  });

  const sessionChartRef = useRef<Chart | null>(null);
  const paymentChartRef = useRef<Chart | null>(null);

  const sortOptions: SortOption[] = [
    { value: 'urgency', label: 'Payment Urgency' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'balance_desc', label: 'Highest Balance' },
    { value: 'balance_asc', label: 'Lowest Balance' },
    { value: 'amount_desc', label: 'Highest Total Amount' },
    { value: 'amount_asc', label: 'Lowest Total Amount' },
    { value: 'payment_progress_desc', label: 'Highest Payment Progress' },
    { value: 'payment_progress_asc', label: 'Lowest Payment Progress' },
    { value: 'completed_desc', label: 'Most Sessions Completed' },
    { value: 'completed_asc', label: 'Least Sessions Completed' },
    { value: 'scheduled_desc', label: 'Most Sessions Scheduled' },
    { value: 'scheduled_asc', label: 'Least Sessions Scheduled' },
    { value: 'remaining_desc', label: 'Most Sessions Remaining' },
    { value: 'remaining_asc', label: 'Least Sessions Remaining' },
    { value: 'patient_name', label: 'Patient Name (A-Z)' },
    { value: 'therapy_name', label: 'Therapy Name (A-Z)' },
    { value: 'plan_status', label: 'Plan Status' },
  ];
  
   // Add handler for Active Plans toggle
  const handleActivePlansToggle = () => {
    navigate('/dashboard');
  };
  useEffect(() => {
    fetchDashboardData();
  }, [offset, limit, sortBy]);

  useEffect(() => {
    if (data) {
      setFilteredPlans(data.plans_report || []);
      setPaginationMeta(data.pagination);
    }
  }, [data]);

  useEffect(() => {
    if (data && data.summary) {
      if (sessionChartRef.current) {
        sessionChartRef.current.destroy();
        sessionChartRef.current = null;
      }
      if (paymentChartRef.current) {
        paymentChartRef.current.destroy();
        paymentChartRef.current = null;
      }

      const sessionCtx = document.getElementById("sessionChart") as HTMLCanvasElement | null;
      if (sessionCtx) {
        sessionChartRef.current = new Chart(sessionCtx, {
          type: "doughnut",
          data: {
            labels: ["Completed Sessions", "Remaining Sessions"],
            datasets: [{
              data: [
                data.summary.total_completed_sessions || 0,
                data.summary.total_remaining_sessions || 0,
              ],
              backgroundColor: ["#007b8e", "#e0e0e0"],
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: "bottom" },
            },
          },
        });
      }

      const paymentCtx = document.getElementById("paymentChart") as HTMLCanvasElement | null;
      if (paymentCtx && data.plans_report && data.plans_report.length > 0) {
        paymentChartRef.current = new Chart(paymentCtx, {
          type: "bar",
          data: {
            labels: Object.keys(data.summary.payment_status_breakdown),
            datasets: [{
              label: "Plans by Payment Status",
              data: Object.values(data.summary.payment_status_breakdown),
              backgroundColor: "#007b8e",
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
            },
            plugins: {
              legend: { display: false },
            },
          },
        });
      }

      return () => {
        if (sessionChartRef.current) {
          sessionChartRef.current.destroy();
          sessionChartRef.current = null;
        }
        if (paymentChartRef.current) {
          paymentChartRef.current.destroy();
          paymentChartRef.current = null;
        }
      };
    }
  }, [data]);

  const fetchDashboardData = async (customFilters?: Partial<FilterState>) => {
    try {
      setIsLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      const currentFilters = { ...filters, ...customFilters };

      const apiFilters = {
        reporting_period: currentFilters.reporting_period,
        report_year: currentFilters.report_year,
        report_quarter: currentFilters.report_quarter,
        report_month: currentFilters.report_month,
        patient_name: currentFilters.patient_name,
        therapy_name: currentFilters.therapy_name,
        therapy_category: currentFilters.therapy_category,
        payment_type: currentFilters.payment_type,
        payment_status: currentFilters.payment_status,
        session_status: currentFilters.session_status,
        plan_status: currentFilters.plan_status,
        min_amount: currentFilters.min_amount,
        max_amount: currentFilters.max_amount,
        min_balance: currentFilters.min_balance,
        max_balance: currentFilters.max_balance,
        min_sessions: currentFilters.min_sessions,
        max_sessions: currentFilters.max_sessions,
        payment_progress_min: currentFilters.payment_progress_min,
        payment_progress_max: currentFilters.payment_progress_max,
        created_after: currentFilters.created_after,
        created_before: currentFilters.created_before,
        include_zero_balance: currentFilters.include_zero_balance,
        overdue_only: currentFilters.overdue_only,
        high_balance_only: currentFilters.high_balance_only,
        last_payment_after: currentFilters.last_payment_after,
        last_payment_before: currentFilters.last_payment_before,
        sortBy,
        offset: offset.toString(),
        limit: limit.toString(),
      };

      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/getplans/sessions?${queryParams.toString()}`);
      setData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (key === 'reporting_period') {
      if (value !== 'quarterly') newFilters.report_quarter = '';
      if (value !== 'monthly') newFilters.report_month = '';
    }
    setFilters(newFilters);
    setOffset(0); // Reset to first page when filters change
    fetchDashboardData(newFilters);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy as SortBy);
    setOffset(0); // Reset to first page when sorting changes
    fetchDashboardData();
  };

  const clearFilters = () => {
    const clearedFilters = {
      reporting_period: 'all',
      report_year: new Date().getFullYear().toString(),
      report_quarter: '',
      report_month: '',
      payment_status: '',
      session_status: '',
      plan_status: '',
      patient_name: '',
      therapy_name: '',
      therapy_category: '',
      payment_type: '',
      priority: '',
      min_amount: '',
      max_amount: '',
      min_balance: '',
      max_balance: '',
      min_sessions: '',
      max_sessions: '',
      payment_progress_min: '',
      payment_progress_max: '',
      created_after: '',
      created_before: '',
      include_zero_balance: '',
      overdue_only: '',
      high_balance_only: '',
      last_payment_after: '',
      last_payment_before: '',
      days_remaining_filter: '',
    };
    setFilters(clearedFilters);
    setOffset(0); // Reset to first page
    fetchDashboardData(clearedFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = (): boolean => {
    return Object.values(filters).some((value) => value && value.trim() !== '' && value !== 'all');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return styles.priorityLow;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return styles.statusCompleted;
      case 'pending':
        return styles.statusPending;
      case 'ongoing':
        return styles.statusOngoing;
      default:
        return styles.statusDefault;
    }
  };

  const prepareChartData = () => {
    if (!data) return null;

    const paymentData = [
      { name: 'Completed', value: data.summary.payment_status_breakdown.completed, color: '#007b8e' },
      { name: 'Pending', value: data.summary.payment_status_breakdown.pending, color: '#d1d5db' }
    ];

    const sessionData = [
      { name: 'Completed', value: data.summary.session_status_breakdown.completed, color: '#007b8e' },
      { name: 'Ongoing', value: data.summary.session_status_breakdown.ongoing, color: '#000000' }
    ];

    const planData = [
      { name: 'Active', value: data.summary.plans_by_status.active, color: '#d1d5db' },
      { name: 'Completed', value: data.summary.plans_by_status.completed, color: '#007b8e' }
    ];

    const urgencyData = [
      { name: 'High', value: data.summary.payment_urgency_breakdown.high, color: '#007b8e' },
      { name: 'Medium', value: data.summary.payment_urgency_breakdown.medium, color: '#000000' },
      { name: 'Low', value: data.summary.payment_urgency_breakdown.low, color: '#ffffff' }
    ];

    return { paymentData, sessionData, planData, urgencyData };
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const total = (data?.summary.payment_status_breakdown.completed || 0) + (data?.summary.payment_status_breakdown.pending || 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
    const textColor = name === 'Completed' ? '#007b8e' : '#000000';

    return (
      <text
        x={x}
        y={y}
        fill={textColor}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
      >
        {`${name} ${percentage}%`}
      </text>
    );
  };

  const renderChart = () => {
    const chartData = prepareChartData();
    if (!chartData) return null;

    switch (activeChart) {
      case 'payment':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData.paymentData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'session':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.sessionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#007b8e" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'plan':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData.planData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.planData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'urgency':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.urgencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#007b8e" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const renderKPICard = (title: string, value: string | number, icon: any) => (
    <motion.div
      className={styles.summaryCard}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.cardHeader}>
        <FontAwesomeIcon icon={icon} className={styles.cardIcon} />
        <h3>{title}</h3>
      </div>
      <div className={styles.cardValue}>{value}</div>
    </motion.div>
  );

  // Pagination logic
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (paginationMeta?.total_pages || 1)) {
      setOffset((page - 1) * limit);
    }
  };

  const renderPageNumbers = () => {
    if (!paginationMeta) return null;
    const { page_range, total_pages, current_page } = paginationMeta;
    const pageNumbers = [];

    if (page_range.start > 1) {
      pageNumbers.push(
        <button
          key={1}
          className={`${styles.pageButton} ${1 === current_page ? styles.activePage : ''}`}
          onClick={() => handlePageChange(1)}
          aria-label="Go to page 1"
        >
          1
        </button>
      );
      if (page_range.start > 2) {
        pageNumbers.push(
          <span key="start-ellipsis" className={styles.ellipsis}>...</span>
        );
      }
    }

    for (let i = page_range.start; i <= page_range.end; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`${styles.pageButton} ${i === current_page ? styles.activePage : ''}`}
          onClick={() => handlePageChange(i)}
          aria-label={`Go to page ${i}`}
        >
          {i}
        </button>
      );
    }

    if (page_range.end < total_pages) {
      if (page_range.end < total_pages - 1) {
        pageNumbers.push(
          <span key="end-ellipsis" className={styles.ellipsis}>...</span>
        );
      }
      pageNumbers.push(
        <button
          key={total_pages}
          className={`${styles.pageButton} ${total_pages === current_page ? styles.activePage : ''}`}
          onClick={() => handlePageChange(total_pages)}
          aria-label={`Go to page ${total_pages}`}
        >
          {total_pages}
        </button>
      );
    }

    return pageNumbers;
  };

  // Skeleton Loader Components
  const SkeletonSummaryCard = () => (
    <div className={`${styles.summaryCard} ${styles.skeleton}`}>
      <div className={styles.cardHeader}>
        <div className={`${styles.cardIcon} ${styles.skeletonBox}`}></div>
        <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
      </div>
      <div className={`${styles.cardValue} ${styles.skeletonBox}`}></div>
    </div>
  );

  const SkeletonChartCard = () => (
    <div className={`${styles.chartCard} ${styles.skeleton}`}>
      <div className={`${styles.chartTitle} ${styles.skeletonText} ${styles.skeleton}`}></div>
      <div className={`${styles.chartCanvas} ${styles.skeletonBox}`}></div>
    </div>
  );

  const SkeletonPlanCard = () => (
    <div className={`${styles.planCard} ${styles.skeleton}`}>
      <div className={styles.planHeader}>
        <div className={`${styles.planTitle} ${styles.skeletonText} ${styles.skeleton}`}></div>
        <div className={`${styles.priorityBadge} ${styles.skeletonBox}`}></div>
      </div>
      <div className={styles.planSection}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionIcon} ${styles.skeletonBox}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
        </div>
        <div className={styles.patientInfo}>
          <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
        </div>
      </div>
      <div className={styles.planSection}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionIcon} ${styles.skeletonBox}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
        </div>
        <div className={`${styles.timelineInfo} ${styles.skeletonText} ${styles.skeleton}`}></div>
      </div>
      <div className={styles.progressSection}>
        <div className={styles.progressItem}>
          <div className={styles.progressHeader}>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
          </div>
          <div className={`${styles.progressBar} ${styles.skeletonBox}`}></div>
          <div className={`${styles.progressText} ${styles.skeletonText} ${styles.skeleton}`}></div>
        </div>
      </div>
      <div className={styles.planSection}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionIcon} ${styles.skeletonBox}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
        </div>
        <div className={styles.paymentGrid}>
          <div className={styles.paymentItem}>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
          </div>
          <div className={styles.paymentItem}>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
          </div>
          <div className={styles.paymentItem}>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
          </div>
          <div className={styles.paymentItem}>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
            <div className={`${styles.skeletonText} ${styles.skeleton}`}></div>
          </div>
        </div>
      </div>
      <div className={styles.statusSection}>
        <div className={`${styles.statusBadge} ${styles.skeletonBox}`}></div>
        <div className={`${styles.statusBadge} ${styles.skeletonBox}`}></div>
        <div className={`${styles.statusBadge} ${styles.skeletonBox}`}></div>
      </div>
    </div>
  );

  const SkeletonPlanTable = () => (
    <div className={`${styles.planTableWrapper} ${styles.skeleton}`}>
      <table className={styles.planTable}>
        <thead>
          <tr>
            {["Patient Name", "Therapy", "Start", "End", "Payment Status", "Session Status", "Total Amount", "Balance"].map((_, index) => (
              <th key={index} className={`${styles.tableHeader} ${styles.skeletonText} ${styles.skeleton}`}></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array(3).fill(0).map((_, index) => (
            <tr key={index} className={styles.tableRow}>
              {Array(8).fill(0).map((_, colIndex) => (
                <td key={colIndex} className={`${styles.tableCell} ${styles.skeletonText} ${styles.skeleton}`}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.summaryGrid}>
          {Array(6).fill(0).map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </div>
        <div className={styles.chartsSection}>
          <SkeletonChartCard />
          <SkeletonChartCard />
        </div>
        <div className={styles.plansSection}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.sectionTitle} ${styles.skeletonText} ${styles.skeleton}`}></div>
            <div className={`${styles.resultsCount} ${styles.skeletonText} ${styles.skeleton}`}></div>
          </div>
          {viewMode === "card" ? (
            <div className={styles.plansGrid}>
              {Array(3).fill(0).map((_, index) => (
                <SkeletonPlanCard key={index} />
              ))}
            </div>
          ) : (
            <SkeletonPlanTable />
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <FontAwesomeIcon icon={faExclamationCircle} className={styles.errorIcon} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={() => fetchDashboardData()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className={styles.container}>
        <div className={styles.noDataWrapper}>
          <FontAwesomeIcon icon={faClock} className={styles.noDataIcon} />
          <h3>No Data Found</h3>
          <p>There are currently no plans available.</p>
        </div>
      </div>
    );
  }

  const { summary } = data;

  if (filteredPlans.length === 0 && !hasActiveFilters()) {
    return (
      <div className={styles.container}>
        <div className={styles.summaryGrid}>
          {renderKPICard('Total Plans', summary.total_plans || 0, faChartBar)}
          {renderKPICard('Total Revenue', formatCurrency(summary.total_revenue_received || 0), faDollarSign)}
          {renderKPICard('Pending Balance', formatCurrency(summary.total_pending_balance || 0), faClock)}
          {renderKPICard('Completed Sessions', summary.total_completed_sessions || 0, faCheckCircle)}
          {renderKPICard('Payment Completion', `${summary.average_payment_completion || 0}%`, faDollarSign)}
          {renderKPICard('Remaining Sessions', summary.total_remaining_sessions || 0, faClock)}
        </div>
        <div className={styles.chartsSection}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Session Progress</h3>
            <canvas id="sessionChart" className={styles.chartCanvas}></canvas>
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Analytics Overview</h3>
            <div className={styles.chartControls}>
              <div className={styles.chartTabs}>
                <button
                  className={`${styles.chartTab} ${activeChart === 'payment' ? styles.active : ''}`}
                  onClick={() => setActiveChart('payment')}
                >
                  Payment Status
                </button>
                <button
                  className={`${styles.chartTab} ${activeChart === 'session' ? styles.active : ''}`}
                  onClick={() => setActiveChart('session')}
                >
                  Session Status
                </button>
                <button
                  className={`${styles.chartTab} ${activeChart === 'plan' ? styles.active : ''}`}
                  onClick={() => setActiveChart('plan')}
                >
                  Plan Status
                </button>
                <button
                  className={`${styles.chartTab} ${activeChart === 'urgency' ? styles.active : ''}`}
                  onClick={() => setActiveChart('urgency')}
                >
                  Payment Urgency
                </button>
              </div>
              <div className={styles.filterControls}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FontAwesomeIcon icon={faFilter} className={styles.filterIcon} />
                  Filters
                  {hasActiveFilters() && <span className={styles.filterBadge}></span>}
                </motion.button>
                {hasActiveFilters() && (
                  <button className={styles.clearFilters} onClick={clearFilters}>
                    <FontAwesomeIcon icon={faXmark} className={styles.clearIcon} />
                    Clear All
                  </button>
                )}
              </div>
            </div>
            {showFilters && (
              <motion.div
                className={styles.filterPanel}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Reporting Period</label>
                    <select
                      value={filters.reporting_period}
                      onChange={(e) => handleFilterChange('reporting_period', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Time</option>
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Year</label>
                    <select
                      value={filters.report_year}
                      onChange={(e) => handleFilterChange('report_year', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {filters.reporting_period === 'quarterly' && (
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Quarter</label>
                      <select
                        value={filters.report_quarter}
                        onChange={(e) => handleFilterChange('report_quarter', e.target.value)}
                        className={styles.filterSelect}
                      >
                        <option value="">All Quarters</option>
                        <option value="1">Q1</option>
                        <option value="2">Q2</option>
                        <option value="3">Q3</option>
                        <option value="4">Q4</option>
                      </select>
                    </div>
                  )}
                  {filters.reporting_period === 'monthly' && (
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Month</label>
                      <select
                        value={filters.report_month}
                        onChange={(e) => handleFilterChange('report_month', e.target.value)}
                        className={styles.filterSelect}
                      >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString()}>
                            {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Patient Name</label>
                    <input
                      type="text"
                      value={filters.patient_name}
                      onChange={(e) => handleFilterChange('patient_name', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Enter patient name"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Therapy Name</label>
                    <input
                      type="text"
                      value={filters.therapy_name}
                      onChange={(e) => handleFilterChange('therapy_name', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Enter therapy name"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Therapy Category</label>
                    <select
                      value={filters.therapy_category}
                      onChange={(e) => handleFilterChange('therapy_category', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All Categories</option>
                      {data.summary.therapy_categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Payment Type</label>
                    <select
                      value={filters.payment_type}
                      onChange={(e) => handleFilterChange('payment_type', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All Types</option>
                      {data.summary.payment_types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Payment Status</label>
                    <select
                      value={filters.payment_status}
                      onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Session Status</label>
                    <select
                      value={filters.session_status}
                      onChange={(e) => handleFilterChange('session_status', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Plan Status</label>
                    <select
                      value={filters.plan_status}
                      onChange={(e) => handleFilterChange('plan_status', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Min Amount</label>
                    <input
                      type="number"
                      value={filters.min_amount}
                      onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Min amount"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Amount</label>
                    <input
                      type="number"
                      value={filters.max_amount}
                      onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Max amount"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Min Balance</label>
                    <input
                      type="number"
                      value={filters.min_balance}
                      onChange={(e) => handleFilterChange('min_balance', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Min balance"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Balance</label>
                    <input
                      type="number"
                      value={filters.max_balance}
                      onChange={(e) => handleFilterChange('max_balance', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Max balance"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Min Sessions</label>
                    <input
                      type="number"
                      value={filters.min_sessions}
                      onChange={(e) => handleFilterChange('min_sessions', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Min sessions"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Sessions</label>
                    <input
                      type="number"
                      value={filters.max_sessions}
                      onChange={(e) => handleFilterChange('max_sessions', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Max sessions"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Min Payment Progress (%)</label>
                    <input
                      type="number"
                      value={filters.payment_progress_min}
                      onChange={(e) => handleFilterChange('payment_progress_min', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Min progress"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Payment Progress (%)</label>
                    <input
                      type="number"
                      value={filters.payment_progress_max}
                      onChange={(e) => handleFilterChange('payment_progress_max', e.target.value)}
                      className={styles.filterInput}
                      placeholder="Max progress"
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Created After</label>
                    <input
                      type="date"
                      value={filters.created_after}
                      onChange={(e) => handleFilterChange('created_after', e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Created Before</label>
                    <input
                      type="date"
                      value={filters.created_before}
                      onChange={(e) => handleFilterChange('created_before', e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Last Payment After</label>
                    <input
                      type="date"
                      value={filters.last_payment_after}
                      onChange={(e) => handleFilterChange('last_payment_after', e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Last Payment Before</label>
                    <input
                      type="date"
                      value={filters.last_payment_before}
                      onChange={(e) => handleFilterChange('last_payment_before', e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Include Zero Balance</label>
                    <select
                      value={filters.include_zero_balance}
                      onChange={(e) => handleFilterChange('include_zero_balance', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Overdue Only</label>
                    <select
                      value={filters.overdue_only}
                      onChange={(e) => handleFilterChange('overdue_only', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>High Balance Only</label>
                    <select
                      value={filters.high_balance_only}
                      onChange={(e) => handleFilterChange('high_balance_only', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Days Remaining</label>
                    <select
                      value={filters.days_remaining_filter}
                      onChange={(e) => handleFilterChange('days_remaining_filter', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="ending_soon">Ending Soon (≤7 days)</option>
                      <option value="ending_month">This Month (≤30 days)</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
            <div className={styles.chartContainer}>
              {renderChart()}
            </div>
          </div>
        </div>
        <div className={styles.noDataWrapper}>
          <FontAwesomeIcon icon={faChartBar} className={styles.noDataIcon} />
          <h3>No Plans Found</h3>
          <p>There are currently no plans with payments available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.summaryGrid}>
        {renderKPICard('Total Plans', summary.total_plans || 0, faChartBar)}
        {renderKPICard('Total Revenue', formatCurrency(summary.total_revenue_received || 0), faDollarSign)}
        {renderKPICard('Pending Balance', formatCurrency(summary.total_pending_balance || 0), faClock)}
        {renderKPICard('Completed Sessions', summary.total_completed_sessions || 0, faCheckCircle)}
        {renderKPICard('Payment Completion', `${summary.average_payment_completion || 0}%`, faDollarSign)}
        {renderKPICard('Remaining Sessions', summary.total_remaining_sessions || 0, faClock)}
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Session Progress</h3>
          <canvas id="sessionChart" className={styles.chartCanvas}></canvas>
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Analytics Overview</h3>
          <div className={styles.chartControls}>
            <div className={styles.chartTabs}>
              <button
                className={`${styles.chartTab} ${activeChart === 'payment' ? styles.active : ''}`}
                onClick={() => setActiveChart('payment')}
              >
                Payment Status
              </button>
              <button
                className={`${styles.chartTab} ${activeChart === 'session' ? styles.active : ''}`}
                onClick={() => setActiveChart('session')}
              >
                Session Status
              </button>
              <button
                className={`${styles.chartTab} ${activeChart === 'plan' ? styles.active : ''}`}
                onClick={() => setActiveChart('plan')}
              >
                Plan Status
              </button>
              <button
                className={`${styles.chartTab} ${activeChart === 'urgency' ? styles.active : ''}`}
                onClick={() => setActiveChart('urgency')}
              >
                Payment Urgency
              </button>
            </div>
            <div className={styles.filterControls}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FontAwesomeIcon icon={faFilter} className={styles.filterIcon} />
                Filters
                {hasActiveFilters() && <span className={styles.filterBadge}></span>}
              </motion.button>
              
            </div>
          </div>
          {showFilters && (
            <motion.div
              className={styles.filterPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Reporting Period</label>
                  <select
                    value={filters.reporting_period}
                    onChange={(e) => handleFilterChange('reporting_period', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Time</option>
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Year</label>
                  <select
                    value={filters.report_year}
                    onChange={(e) => handleFilterChange('report_year', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>
                {filters.reporting_period === 'quarterly' && (
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Quarter</label>
                    <select
                      value={filters.report_quarter}
                      onChange={(e) => handleFilterChange('report_quarter', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All Quarters</option>
                      <option value="1">Q1</option>
                      <option value="2">Q2</option>
                      <option value="3">Q3</option>
                      <option value="4">Q4</option>
                    </select>
                  </div>
                )}
                {filters.reporting_period === 'monthly' && (
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Month</label>
                    <select
                      value={filters.report_month}
                      onChange={(e) => handleFilterChange('report_month', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All Months</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString()}>
                          {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
              </div>
            </motion.div>
          )}
          <div className={styles.chartContainer}>
            {renderChart()}
          </div>
        </div>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.sortControls}>
          <div className={styles.sortGroup}>
            <FontAwesomeIcon icon={faSort} className={styles.sortIcon} />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className={styles.sortSelect}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Add Active Plans Toggle */}
          <div className={styles.toggleBadge}>
            <button
              className={styles.controlButton}
              onClick={handleActivePlansToggle}
            >
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className={styles.toggleIcon}
              />
              <span className={styles.toggleText}>
                View Plans with Remaining Payments
              </span>
            </button>
          </div>
          <div className={styles.toggleBadge}>
            <button
              className={styles.controlButton}
              onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
            >
              <FontAwesomeIcon
                icon={viewMode === "card" ? faTable : faTh}
                className={styles.toggleIcon}
              />
              <span className={styles.toggleText}>
                {viewMode === "card" ? "Table View" : "Card View"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.plansSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Active Plans Details</h2>
          <div className={styles.resultsCount}>
            Showing {paginationMeta?.start_index || 0} - {paginationMeta?.end_index || 0} of {paginationMeta?.total_items || 0} plans
          </div>
        </div>

        {filteredPlans.length === 0 ? (
          <div className={styles.noDataWrapper}>
            <FontAwesomeIcon icon={faChartBar} className={styles.noDataIcon} />
            <h3>No Results Found</h3>
            <p>Try adjusting your filters to see more results.</p>
          </div>
        ) : viewMode === "card" ? (
          <div className={`${styles.plansGrid} ${styles.viewTransition}`}>
            {filteredPlans.map((plan: ActivePlan) => (
              <div key={plan.plan_id} className={styles.planCard}>
                <div className={styles.planHeader}>
                  <h3 className={styles.planTitle}>{plan.patient_info.patient_name}</h3>
                  <div
                    className={`${styles.priorityBadge} ${getPriorityColor(
                      plan.status_indicators.priority
                    )}`}
                  >
                    {plan.status_indicators.priority.toUpperCase()}
                  </div>
                </div>

                <div className={styles.planSection}>
                  <div className={styles.sectionHeader}>
                    <FontAwesomeIcon icon={faUser} className={styles.sectionIcon} />
                    <h4>Patient Information</h4>
                  </div>
                  <div className={styles.patientInfo}>
                    <p>
                      <strong>Therapy Name:</strong> {plan.therapy_name || "N/A"}
                    </p>
                    <p>
                      <strong>Diagnosis:</strong>{" "}
                      {plan.additional_info.patient_diagnosis || "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {plan.patient_info.patient_phone || "N/A"}
                    </p>
                  </div>
                </div>

                <div className={styles.planSection}>
                  <div className={styles.sectionHeader}>
                    <FontAwesomeIcon icon={faClock} className={styles.sectionIcon} />
                    <h4>Timeline</h4>
                  </div>
                  <div className={styles.timelineInfo}>
                    <p>
                      <strong>Start:</strong> {formatDate(plan.timeline.therapy_start)} -{" "}
                      <strong>End:</strong> {formatDate(plan.timeline.therapy_end)}
                    </p>
                    {/* <p>
                      <strong>Days Remaining:</strong> {plan.timeline.days_remaining}
                    </p> */}
                  </div>
                </div>

                <div className={styles.progressSection}>
                  <div className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <span>Payment Progress</span>
                      <span>
                        {plan.payment_summary.payment_progress_percentage || 0}%
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${plan.payment_summary.payment_progress_percentage || 0}%`,
                        }}
                      ></div>
                    </div>
                    <p className={styles.progressText}>
                      {formatCurrency(plan.payment_summary.received_amount)} of{" "}
                      {formatCurrency(plan.payment_summary.total_amount)} received
                    </p>
                  </div>

                  <div className={styles.planSection}>
                    <div className={styles.sectionHeader}>
                      <FontAwesomeIcon icon={faDollarSign} className={styles.sectionIcon} />
                      <h4>Payment Summary</h4>
                    </div>
                    <div className={styles.paymentGrid}>
                      <div className={styles.paymentItem}>
                        <span>Total Amount:</span>
                        <span>
                          {formatCurrency(plan.payment_summary.total_amount)}
                        </span>
                      </div>
                      <div className={styles.paymentItem}>
                        <span>Received:</span>
                        <span>
                          {formatCurrency(plan.payment_summary.received_amount)}
                        </span>
                      </div>
                      <div className={styles.paymentItem}>
                        <span>Balance:</span>
                        <span
                          className={
                            (plan.payment_summary.balance || 0) > 0
                              ? styles.balancePending
                              : styles.balanceCompleted
                          }
                        >
                          {formatCurrency(plan.payment_summary.balance)}
                        </span>
                      </div>
                      <div className={styles.paymentItem}>
                        <span>Per Session:</span>
                        <span>
                          {formatCurrency(plan.payment_summary.per_session_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.statusSection}>
                    <div
                      className={`${styles.statusBadge} ${getStatusColor(
                        plan.status_indicators.payment_status
                      )}`}
                    >
                      <FontAwesomeIcon icon={faDollarSign} className={styles.statusIcon} />
                      {plan.status_indicators.payment_status}
                    </div>
                    <div
                      className={`${styles.statusBadge} ${getStatusColor(
                        plan.status_indicators.session_status
                      )}`}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className={styles.statusIcon} />
                      {plan.status_indicators.session_status}
                    </div>
                    <div
                      className={`${styles.statusBadge} ${getStatusColor(
                        plan.status_indicators.plan_status
                      )}`}
                    >
                      <FontAwesomeIcon icon={faClock} className={styles.statusIcon} />
                      {plan.status_indicators.plan_status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${styles.planTableWrapper} ${styles.viewTransition}`}>
            <table className={styles.planTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Patient Name</th>
                  <th className={styles.tableHeader}>Therapy</th>
                  <th className={styles.tableHeader}>Start</th>
                  <th className={styles.tableHeader}>End</th>
                  <th className={styles.tableHeader}>Payment Status</th>
                  <th className={styles.tableHeader}>Session Status</th>
                  <th className={styles.tableHeader}>Total Amount</th>
                  <th className={styles.tableHeader}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan: ActivePlan) => (
                  <tr key={plan.plan_id} className={styles.tableRow}>
                    <td className={styles.tableCell}>{plan.patient_info.patient_name}</td>
                    <td className={styles.tableCell}>{plan.therapy_name || "N/A"}</td>
                    <td className={styles.tableCell}>{formatDate(plan.timeline.therapy_start)}</td>
                    <td className={styles.tableCell}>{formatDate(plan.timeline.therapy_end)}</td>
                    <td className={styles.tableCell}>
                      <span
                        className={`${styles.statusBadge} ${getStatusColor(plan.status_indicators.payment_status)}`}
                      >
                        <FontAwesomeIcon icon={faDollarSign} className={styles.statusIcon} size="sm" />
                        {plan.status_indicators.payment_status}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span
                        className={`${styles.statusBadge} ${getStatusColor(plan.status_indicators.session_status)}`}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className={styles.statusIcon} size="sm" />
                        {plan.status_indicators.session_status}
                      </span>
                    </td>
                    <td className={styles.tableCell}>{formatCurrency(plan.payment_summary.total_amount)}</td>
                    <td className={styles.tableCell}>
                      <span
                        className={
                          (plan.payment_summary.balance || 0) > 0
                            ? styles.balancePending
                            : styles.balanceCompleted
                        }
                      >
                        {formatCurrency(plan.payment_summary.balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {paginationMeta && paginationMeta.total_pages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(paginationMeta.previous_page || 1)}
              disabled={!paginationMeta.has_previous}
              aria-label="Previous page"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {renderPageNumbers()}
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(paginationMeta.next_page || paginationMeta.total_pages)}
              disabled={!paginationMeta.has_next}
              aria-label="Next page"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDashboard;