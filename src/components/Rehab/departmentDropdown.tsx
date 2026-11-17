import React, { useState, useEffect } from "react";
import api from "../../utils/central";
import styles from "../../css/Rehab/DepartmentDropdown.module.css";

interface Department {
  _id: string;
  department_name: string;
}

interface DepartmentDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value,
  onChange,
  error,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/departments");
        // Safely extract departments based on standard API response shape
        setDepartments(response.data.departments || []);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className={styles.container}>
      <label htmlFor="department_id" className={styles.label}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        Department <span style={{ color: "red" }}>*</span>
      </label>
      <select
        id="department_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.select} ${error ? styles.inputError : ""}`}
        disabled={isLoading}
      >
        <option value="" disabled>
          {isLoading ? "Loading departments..." : "Select a department"}
        </option>
        {departments.map((dept) => (
          <option key={dept._id} value={dept._id}>
            {dept.department_name}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default DepartmentDropdown;
