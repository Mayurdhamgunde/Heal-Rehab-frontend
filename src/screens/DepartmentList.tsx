import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/central";
import styles from "../css/DepartmentList.module.css";
import {
  Briefcase,
  Plus,
  Search,
  ChevronRight,
  MapPin,
  Activity,
} from "lucide-react";

interface Location {
  location_id: string;
  location_name: string;
}

interface Department {
  _id: string;
  department_name: string;
  department_code: string;
  description: string;
  status: string;
  assigned_locations: Location[];
}

const DepartmentListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Based on your api instructions
      const response = await api.get("/departments");
      setDepartments(response.data.departments || []);
    } catch (err: any) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = () => {
    navigate("/department/create");
  };

  const handleDepartmentClick = (id: string) => {
    // Assuming your route for department details is /department/:id
    navigate(`/department/${id}`);
  };

  // Filter departments based on search query
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.department_code &&
        dept.department_code.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>
          <Activity className={styles.spinner} size={24} />
          <p>Loading Departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Departments</h1>
            <p className={styles.subtitle}>
              Manage your organization's departments and locations
            </p>
          </div>
          <button
            className={styles.createButton}
            onClick={handleCreateDepartment}
          >
            <Plus size={20} />
            <span>Create Department</span>
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Search and Filter Section */}
        <div className={styles.controlsSection}>
          <div className={styles.searchBar}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search departments by name or code..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Departments Grid */}
        {filteredDepartments.length === 0 ? (
          <div className={styles.emptyState}>
            <Briefcase size={48} className={styles.emptyIcon} />
            <h3>No departments found</h3>
            <p>
              {searchQuery
                ? "Try adjusting your search terms."
                : "Get started by creating your first department."}
            </p>
            {!searchQuery && (
              <button
                className={styles.createButtonSecondary}
                onClick={handleCreateDepartment}
              >
                Create Department
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredDepartments.map((dept) => (
              <div
                key={dept._id}
                className={styles.card}
                onClick={() => handleDepartmentClick(dept._id)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleGroup}>
                    <div className={styles.iconContainer}>
                      <Briefcase size={20} className={styles.cardIcon} />
                    </div>
                    <div>
                      <h3 className={styles.cardTitle}>
                        {dept.department_name}
                      </h3>
                      {dept.department_code && (
                        <span className={styles.cardCode}>
                          {dept.department_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className={styles.chevron} />
                </div>

                <p className={styles.cardDescription}>
                  {dept.description || "No description provided."}
                </p>

                <div className={styles.cardFooter}>
                  <div className={styles.locationInfo}>
                    <MapPin size={14} />
                    <span>
                      {dept.assigned_locations?.length || 0} Location
                      {dept.assigned_locations?.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <span
                    className={`${styles.statusBadge} ${dept.status.toLowerCase() === "active" ? styles.statusActive : styles.statusInactive}`}
                  >
                    {dept.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentListScreen;
