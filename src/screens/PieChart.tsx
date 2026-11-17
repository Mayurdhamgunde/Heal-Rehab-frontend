import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import styles from "../css/PieChart.module.css";

ChartJS.register(ArcElement, Tooltip, Legend);

interface TherapyTypes {
  inClinic: number;
  inHome: number;
  ipIcu: number;
  online: number;
}

interface PieChartProps {
  therapyTypeTotals: TherapyTypes;
}

const PieChart: React.FC<PieChartProps> = ({ therapyTypeTotals }) => {
  // Check if all values are zero
  const hasData =
    therapyTypeTotals.inClinic > 0 ||
    therapyTypeTotals.inHome > 0 ||
    therapyTypeTotals.ipIcu > 0 ||
    therapyTypeTotals.online > 0;

  const data = {
    labels: ["In Clinic", "In Home", "IP/ICU", "Online"],
    datasets: [
      {
        data: [
          therapyTypeTotals.inClinic,
          therapyTypeTotals.inHome,
          therapyTypeTotals.ipIcu,
          therapyTypeTotals.online,
        ],
        backgroundColor: ["#007b8e", "#87aacd", "#3a8dde", "#2c64a4"],
        borderColor: ["#007b8e", "#87aacd", "#3a8dde", "#2c64a4"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={styles.pieChartCard}>
      <h3 className={styles.therapyTypeTitle}>Therapy Type Distribution</h3>
      <div className={styles.pieChartContainer}>
        {hasData ? (
          <Pie
            data={data}
            options={{
              cutout: "50%",
              animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: "easeOutQuart",
              },
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    color: "var(--text-primary)",
                    font: { size: 12 },
                    padding: 16,
                    boxWidth: 15,
                  },
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleFont: { size: 10 },
                  bodyFont: { size: 10 },
                  padding: 10,
                },
              },
              maintainAspectRatio: false,
            }}
          />
        ) : (
          <div className={styles.noDataMessage}>
            <p>No results found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;