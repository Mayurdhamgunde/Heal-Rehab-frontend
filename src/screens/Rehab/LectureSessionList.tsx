import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Eye,
  BookOpen
} from "lucide-react";
import api from "../../utils/central";
import styles from "../../css/Rehab/LectureSessionList.module.css";

interface AbsentPatient {
  patient_id: string;
  patient_name: string;
  reason: string;
}

interface LectureSession {
  _id: string;
  lecture_number: number;
  topic_name: string;
  counselor_name: string;
  lecture_date: string;
  attendance_count: number;
  total_patients: number;
  absent_patients: AbsentPatient[];
  status: string;
}

const LectureSessionList: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    sessionId: string | null;
    sessionName: string;
  }>({
    isOpen: false,
    sessionId: null,
    sessionName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 1. SEARCH & FETCH SESSIONS ---
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Using the q param for global search as per your backend controller
      const response = await api.get(`/lecture/sessions`, {
        params: { q: searchTerm, page, limit: 10 },
      });
      setSessions(response.data.lectures || []);
      setTotalPages(response.data.pages || 1);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSessions();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchSessions]);

  // --- 2. ACTIONS ---
  const handleAddNew = () => navigate("/create-lecture-session");
  const handleView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/view-lecture/${id}`);
  };
  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-lecture/${id}`);
  };

  // --- 3. DELETE LOGIC (WITH MODAL) ---
  const promptDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, sessionId: id, sessionName: name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.sessionId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/delete/lecture/session/${deleteModal.sessionId}`);
      cancelDelete();
      fetchSessions(); 
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, sessionId: null, sessionName: "" });
  };

  // --- 4. HELPERS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Lecture Sessions</h1>
          <p className={styles.subtitle}>
            Manage and maintain your clinic's group lecture records and attendance.
          </p>
        </div>
        <button className={styles.createButton} onClick={handleAddNew}>
          <Plus size={16} strokeWidth={2.5} /> Add New Session
        </button>
      </header>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Session Directory</h2>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Topic or Counselor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); 
              }}
              className={styles.searchInput}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spinner} size={32} />
            <p>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchTerm ? "No matching sessions found." : "No sessions found. Create one above!"}</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Session Information</th>
                <th>Date</th>
                <th>Attendance</th>
                <th>Counselor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const isCancelled = session.status === 'Cancelled';
                return (
                  <tr
                    key={session._id}
                    className={`${styles.tableRow} ${isCancelled ? styles.rowCancelled : ''}`}
                    onClick={(e) => handleView(session._id, e)}
                    title="Click to view session"
                  >
                    <td>
                      <div className={styles.itemInfo}>
                        <div className={styles.iconWrapper}>
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className={styles.nameText}>
                        {session.lecture_number} - {session.topic_name}
                          </p>
                          <p className={styles.descText}>
                            {session.absent_patients?.length || 0} Absent
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.normalText}>{formatDate(session.lecture_date)}</span>
                    </td>
                    <td>
                      {isCancelled ? (
                         <span className={`${styles.timingPill} ${styles.pillCancelled}`}>Cancelled</span>
                      ) : (
                        <span className={styles.timingPill}>
                          {session.attendance_count} / {session.total_patients} Present
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={styles.typePill}>{session.counselor_name}</span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          className={styles.iconBtn}
                          onClick={(e) => handleView(session._id, e)}
                          title="View Session"
                        >
                          <Eye size={16} />
                        </button>
                        {!isCancelled && (
                          <>
                            <button
                              className={styles.iconBtn}
                              onClick={(e) => handleEdit(session._id, e)}
                              title="Edit Session"
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        )}
                        <button
                          className={`${styles.iconBtn} ${styles.delete}`}
                          onClick={(e) => promptDelete(session._id, `#${session.lecture_number} - ${session.topic_name}`, e)}
                          title="Delete Permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalCount > 0 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Showing page {page} of {totalPages} ({totalCount} total items)
            </span>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageArrow} 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              <span className={`${styles.pageNumber} ${styles.active}`}>
                {page}
              </span>
              <button 
                className={styles.pageArrow} 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Exactly from MedicineMaster) */}
      {deleteModal.isOpen && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteModalIcon}>
              <AlertCircle size={32} color="#ef4444" />
            </div>
            <h2 className={styles.deleteModalTitle}>Are you sure you want to delete?</h2>
            <p className={styles.deleteModalText}>
              You are about to permanently delete <strong>"{deleteModal.sessionName}"</strong>. This action cannot be undone.
            </p>
            <div className={styles.deleteModalActions}>
              <button 
                className={styles.deleteCancelBtn} 
                onClick={cancelDelete} 
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmBtn} 
                onClick={confirmDelete} 
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className={styles.btnSpinner} size={16} /> : "Delete session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureSessionList;