import React, { useState, useEffect } from "react";
import api from "../utils/central";
import styles from "../css/LeaderBoard.module.css";

interface Doctor {
  doctor_id: string;
  doctor_name: string;
  doctor_photo: string | null;
  therapy_count: number;
}

interface LeaderBoardProps {
  selectedMonth?: string;
  selectedYear?: string;
  startDate?: string;
  endDate?: string;
}

const LeaderBoard: React.FC<LeaderBoardProps> = ({
  selectedMonth,
  selectedYear,
  startDate,
  endDate,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  const userData = localStorage.getItem("user");
  const token = userData ? JSON.parse(userData).token : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (startDate && endDate) {
          queryParams.append("startDate", startDate);
          queryParams.append("endDate", endDate);
        } else if (selectedMonth && selectedYear) {
          queryParams.append("month", selectedMonth);
          queryParams.append("year", selectedYear);
        }

        const response = await api.get(
          `/monthly/leaderboard?${queryParams.toString()}`,
        );
        if (response.data && response.data.success) {
          setDoctors(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear, startDate, endDate, token]);

  // Function to get the arranged order for top 3 doctors
  const getTopThreeArranged = () => {
    if (doctors.length < 3) return doctors;

    // Create a copy of the top 3 doctors
    const topThree = [...doctors.slice(0, 3)];

    // Sort by therapy count to ensure we have them in descending order
    topThree.sort((a, b) => b.therapy_count - a.therapy_count);

    // Rearrange for display: 2nd place, 1st place, 3rd place
    if (topThree.length === 3) {
      return [topThree[1], topThree[0], topThree[2]];
    }

    return topThree;
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading leaderboard...</p>
        </div>
      ) : (
        <div className={styles.splitContainer}>
          <div className={styles.cardsSection}>
            <div className={styles.topCards}>
              {getTopThreeArranged().map((doctor, index) => {
                // Apply different styles based on position
                const isFirstPlace = index === 1; // Middle card is 1st place
                const cardClass = isFirstPlace
                  ? `${styles.card} ${styles.firstPlace}`
                  : styles.card;

                // Apply different animation delays based on position
                const animationDelay = `${index * 0.2}s`;

                return (
                  <div
                    key={doctor.doctor_id}
                    className={cardClass}
                    style={{ animationDelay }}
                  >
                    <div className={styles.rankBadge}>
                      {index === 1 ? "1" : index === 0 ? "2" : "3"}
                    </div>
                    <div className={styles.avatar1}>
                      {doctor.doctor_photo ? (
                        <img
                          src={doctor.doctor_photo}
                          alt={doctor.doctor_name}
                        />
                      ) : (
                        <span>{doctor.doctor_name.charAt(0)}</span>
                      )}
                    </div>
                    <p className={styles.name}>
                      {doctor.doctor_name.split(" ")[0]}
                    </p>
                    <p className={styles.therapies}>
                      {doctor.therapy_count} therapies
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.tableSection}>
            <div className={styles.tableContainer}>
              <table className={styles.doctorTable}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Doctor</th>
                    <th>Therapies</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors
                    .slice(0, showAll ? doctors.length : 5)
                    .map((doctor, index) => (
                      <tr
                        key={doctor.doctor_id}
                        className={styles.tableRow}
                        style={{ animationDelay: `${0.1 * index}s` }}
                      >
                        <td>{index + 1}</td>
                        <td>
                          <div className={styles.doctorInfo}>
                            <div className={styles.avatar}>
                              {doctor.doctor_photo ? (
                                <img
                                  src={doctor.doctor_photo}
                                  alt={doctor.doctor_name}
                                />
                              ) : (
                                <span>{doctor.doctor_name.charAt(0)}</span>
                              )}
                            </div>
                            <div className={styles.doctorName}>
                              {doctor.doctor_name}
                            </div>
                          </div>
                        </td>
                        <td>{doctor.therapy_count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {doctors.length > 5 && (
                <button
                  className={styles.viewMoreButton}
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "View Less" : "View More"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderBoard;
