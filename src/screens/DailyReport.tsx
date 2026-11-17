import React, { useEffect, useState, useRef } from "react";
import api from "../utils/central";
import styles from "../css/DailyReport.module.css";

interface AppointmentTiming {
  start_time: string;
  end_time: string;
  patient_name: string;
  therapy_type: string;
}

interface DoctorReport {
  doctor_id: string;
  doctor_name: string;
  doctor_photo: string | null;
  appointment_count: number;
  appointment_timings: AppointmentTiming[];
  isBlurred?: boolean;
}

interface ApiResponse {
  success: boolean;
  data: DoctorReport[];
}

interface DailyReportProps {
  selectedMonth?: string;
  selectedYear?: string;
  startDate?: string;
  endDate?: string;
}

const DailyReport: React.FC<DailyReportProps> = ({
  selectedMonth,
  selectedYear,
  startDate,
  endDate,
}) => {
  const [reports, setReports] = useState<DoctorReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const storedUser = localStorage.getItem("user");
  const token = storedUser ? JSON.parse(storedUser).token : null;
  const cardsPerPage = 4;
  const totalPages = Math.ceil(reports.length / cardsPerPage);

  useEffect(() => {
    if (!token) {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (startDate && endDate) {
          queryParams.append("startDate", startDate);
          queryParams.append("endDate", endDate);
        } else if (selectedMonth && selectedYear) {
          const date = new Date(
            parseInt(selectedYear),
            parseInt(selectedMonth) - 1,
            1,
          );
          queryParams.append("date", date.toISOString().split("T")[0]);
        } else {
          const today = new Date();
          queryParams.append("date", today.toISOString().split("T")[0]);
        }

        const response = await api.get<ApiResponse>(
          `/daily/report?${queryParams.toString()}`,
        );

        if (response.data.success && Array.isArray(response.data.data)) {
          setReports(response.data.data);
          setCurrentPage(0); // Reset to first page when data changes
        } else {
          setError("Unexpected API response format");
        }
      } catch (err: any) {
        setError(
          `Error ${err.response?.status}: ${
            err.response?.data?.message || "Failed to fetch reports."
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token, selectedMonth, selectedYear, startDate, endDate]);

  const handleCardClick = (doctorId: string) => {
    if (activeCard === doctorId) {
      setActiveCard(null);
      setPopupPosition(null);
      setReports((prevReports) =>
        prevReports.map((report) => ({
          ...report,
          isBlurred: false,
        })),
      );
    } else {
      const cardElement = cardRefs.current[doctorId];
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        setPopupPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
        setActiveCard(doctorId);
        setReports((prevReports) =>
          prevReports.map((report) => ({
            ...report,
            isBlurred: report.doctor_id !== doctorId,
          })),
        );
      }
    }
  };

  const scrollLeft = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const scrollRight = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const getCurrentPageData = () => {
    const startIndex = currentPage * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return reports.slice(startIndex, endIndex);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles["report-container"]}>
      {reports.length === 0 ? (
        <p className={styles["no-reports"]}>No doctor reports available.</p>
      ) : (
        <>
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
                {getCurrentPageData().map((report) => (
                  <div
                    key={report.doctor_id}
                    ref={(el) => {
                      cardRefs.current[report.doctor_id] = el;
                    }}
                    className={`${styles["report-card"]} ${
                      activeCard === report.doctor_id ? styles.active : ""
                    } ${report.isBlurred ? styles.blur : ""}`}
                    onClick={() => handleCardClick(report.doctor_id)}
                  >
                    <div className={styles["doctor-info"]}>
                      {report.doctor_photo ? (
                        <img
                          src={report.doctor_photo}
                          alt={`${report.doctor_name}`}
                          className={styles["doctor-photo"]}
                        />
                      ) : (
                        <div className={styles["doctor-photo-placeholder"]}>
                          {report.doctor_name.charAt(0)}
                        </div>
                      )}
                      <h3>{report.doctor_name}</h3>
                    </div>
                    <div className={styles["appointment-info"]}>
                      <p>Appointments: {report.appointment_count}</p>
                      {report.appointment_count > 0 && (
                        <div className={styles["appointment-status"]}>
                          <span className={`${styles.status} ${styles.active}`}>
                            Active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                  className={`${styles.dot} ${index === currentPage ? styles.dotActive : ""}`}
                  onClick={() => goToPage(index)}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeCard && popupPosition && (
        <div
          className={styles["popup-details"]}
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
          }}
        >
          <div className={styles["appointment-details"]}>
            <h4>Schedule</h4>
            <ul>
              {reports
                .find((report) => report.doctor_id === activeCard)
                ?.appointment_timings.map((appointment, index) => (
                  <li key={index}>
                    <span className={styles["appointment-time"]}>
                      {appointment.start_time} - {appointment.end_time}
                    </span>
                    <span className={styles["appointment-patient"]}>
                      {appointment.patient_name}
                    </span>
                    <span className={styles["appointment-type"]}>
                      {appointment.therapy_type}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
