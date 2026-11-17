import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  Heart,
  Apple,
  Baby,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Filter,
  FolderOpen 
} from "lucide-react";
import api from "../../utils/central"; 
import styles from "../../css/Rehab/AssesmentsList.module.css";

interface Template {
  _id: string;
  assessmentName: string;
  description?: string;
  status: string;
  createdAt: string;
  questions?: any[];
  sequence?: number; 
  department_id?: string;
}

interface Department {
  _id: string;
  department_name: string;
}

const AssessmentsList: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean; templateId: string | null; templateName: string;}>({isOpen: false, templateId: null, templateName: ""});
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const deptRes = await api.get("/departments");
      setDepartments(deptRes.data.departments || []);

      const response = await api.get("/form-builder/templates");
      let fetchedTemplates = response.data.templates || [];

      // Sort by sequence number
      fetchedTemplates = fetchedTemplates.sort((a: Template, b: Template) => {
        const aSeq = a.sequence;
        const bSeq = b.sequence;
        if (typeof aSeq === 'number' && typeof bSeq === 'number') return aSeq - bSeq;
        if (typeof aSeq === 'number') return -1;
        if (typeof bSeq === 'number') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDeptName = (deptId?: string) => {
    if (!deptId) return "General / Unassigned";
    const dept = departments.find(d => d._id === deptId);
    return dept ? dept.department_name : "General / Unassigned";
  };

  const filteredTemplates = selectedDeptFilter === "All" 
    ? templates 
    : templates.filter(t => (t.department_id || "Unassigned") === selectedDeptFilter);

  // Group the filtered templates by Department Name
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const deptName = getDeptName(template.department_id);
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  // Sort department names alphabetically, but put "General / Unassigned" at the bottom
  const sortedDepartments = Object.keys(groupedTemplates).sort((a, b) => {
    if (a === "General / Unassigned") return 1;
    if (b === "General / Unassigned") return -1;
    return a.localeCompare(b);
  });

  // Handlers
  const promptDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setDeleteModal({ isOpen: true, templateId: id, templateName: name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.templateId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/form-builder/templates/${deleteModal.templateId}`);
      await fetchData(); 
      cancelDelete();
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => setDeleteModal({ isOpen: false, templateId: null, templateName: "" });
  const handleEdit = (id: string, e: React.MouseEvent) => { e.stopPropagation(); navigate(`/formBuilder/edit/${id}`); };

  const handleView = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsViewModalOpen(true);
    setIsLoadingView(true);
    try {
      const response = await api.get(`/form-builder/templates/${id}`);
      setViewingTemplate(response.data.template);
    } catch (error) {
      console.error("Error fetching template:", error);
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingView(false);
    }
  };

  const closeViewModal = () => { setIsViewModalOpen(false); setViewingTemplate(null); };

  const renderIcon = (index: number) => {
    const icons = [<ClipboardList size={16} />, <Heart size={16} />, <Apple size={16} />, <Baby size={16} />];
    return icons[index % icons.length];
  };

  // --- UPDATED PREVIEW LOGIC TO RENDER ALL STRUCTURAL ELEMENTS ---
  const renderQuestionPreview = (q: any, index: number) => {
    return (
      <div key={q.id || index} className={`${styles.previewBlock} ${q.type === "section_header" ? styles.sectionHeaderBlock : ""}`}>
        {q.type !== "section_header" && <h4 className={styles.previewTitle}>{index + 1}. {q.title}</h4>}
        {q.type === "section_header" && <h3 className={styles.previewSectionTitle}>{q.title}</h3>}
        {q.description && <p className={styles.previewDesc}>{q.description}</p>}

        <div className={styles.previewContent}>
          {q.type === "text" && (
            <input type="text" disabled className={styles.previewTextInput} placeholder="Short text response..." />
          )}

          {q.type === "dropdown" && (
            <select disabled className={styles.previewTextInput}>
              <option>-- Select Option --</option>
              {q.options?.map((opt: any) => <option key={opt.id}>{opt.value}</option>)}
            </select>
          )}

          {(q.type === "radio" || q.type === "checkbox") && (
            <div className={styles.previewOptions}>
              {q.options?.map((opt: any) => (
                <label key={opt.id} className={styles.previewOptionLabel}>
                  <input type={q.type} disabled /> {opt.value}
                </label>
              ))}
            </div>
          )}

          {q.type === "inline_blanks" && (
            <div className={styles.previewInlineBlanks}>
              {(q.blankLines || []).map((line: any, lIdx: number) => (
                <div key={line.id || lIdx} style={{ marginBottom: "8px" }}>
                  {(line.text || "").split("[blank]").map((part: string, pIdx: number, arr: any[]) => (
                    <React.Fragment key={pIdx}>
                      {part}
                      {pIdx < arr.length - 1 && (
                        <input type="text" disabled className={styles.previewBlankInput} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          )}

          {q.type === "table" && (
            <div className={styles.previewTableWrapper}>
              <table className={styles.previewInnerTable}>
                <thead>
                  <tr>
                    {q.hasRowLabels !== false && <th>{q.columns?.[0]?.value || "Details"}</th>}
                    {(q.hasRowLabels !== false ? q.columns.slice(1) : q.columns).map((col: any) => (
                      <th key={col.id}>{col.value}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q.rows?.map((row: any) => (
                    <tr key={row.id}>
                      {q.hasRowLabels !== false && (
                        <td style={{ paddingLeft: row.isSubRow ? "24px" : "8px" }}>
                          <span style={{ color: "#64748b", marginRight: "8px" }}>{row.srNo}</span>
                          <strong>{row.label}</strong>
                        </td>
                      )}
                      {(q.hasRowLabels !== false ? q.columns.slice(1) : q.columns).map((col: any, idx: number, arr: any[]) => {
                         const isLast = idx === arr.length - 1;
                         // Determine input type mapping for accurate UI preview
                         const isCheckbox = row.cellType === 'checkbox' || (row.cellType === 'per_column' && col.colType === 'checkbox');
                         
                         return (
                           <td key={col.id}>
                             {row.cellType === 'rubric' && !isLast ? (
                                <span style={{fontSize: '0.75rem', color: '#64748b'}}>{row.cellDescriptions?.[idx] || '...'}</span>
                             ) : isCheckbox ? (
                                <input type="checkbox" disabled />
                             ) : (
                                <input type="text" disabled className={styles.previewTextInput} style={{ padding: "4px" }} />
                             )}
                           </td>
                         );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <div className={styles.breadcrumbs}>
            ASSESSMENTS &gt; <span className={styles.breadcrumbActive}>TEMPLATES</span>
          </div>
          <h1 className={styles.title}>Saved Assessment Templates</h1>
          <p className={styles.subtitle}>Manage and deploy standardized clinical evaluation forms.</p>
        </div>
        
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
            <Filter size={16} color="#64748b" />
            <select 
              value={selectedDeptFilter} 
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: "0.85rem", color: "#0f172a", background: "transparent", cursor: "pointer" }}
            >
              <option value="All">All Departments</option>
              <option value="Unassigned">General / Unassigned</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.department_name}</option>
              ))}
            </select>
          </div>

          <button className={styles.createButton} onClick={() => navigate("/formBuilder/new")}>
            <Plus size={16} strokeWidth={2.5} /> Create New Template
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Template Directory</h2>
        </div>

        {sortedDepartments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No templates found for this selection.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "60px", textAlign: "center" }}>Order</th>
                <th>Name</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDepartments.map((deptName) => (
                <React.Fragment key={deptName}>
                  {/* Department Section Header Row */}
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <td colSpan={5} style={{ padding: "12px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155", fontWeight: 700 }}>
                        <FolderOpen size={16} color="#0b7b8a" />
                        {deptName} Forms
                      </div>
                    </td>
                  </tr>

                  {/* Forms belonging to this department */}
                  {groupedTemplates[deptName].map((template, index) => (
                    <tr key={template._id} className={styles.tableRow} onClick={() => handleView(template._id)}>
                      
                      <td style={{ textAlign: "center" }}>
                        <span style={{ 
                          background: template.sequence != null ? "#e0f2f1" : "#f1f5f9", 
                          color: template.sequence != null ? "#00796b" : "#94a3b8",
                          padding: "4px 8px", 
                          borderRadius: "6px", 
                          fontWeight: "bold",
                          fontSize: "0.8rem"
                        }}>
                          {template.sequence != null ? `#${template.sequence}` : "-"}
                        </span>
                      </td>

                      <td>
                        <div className={styles.templateInfo}>
                          <div className={styles.iconWrapper}>{renderIcon(index)}</div>
                          <div>
                            <p className={styles.nameText}>{template.assessmentName}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`${styles.statusPill} ${template.status.toLowerCase() === "published" ? styles.statusPublished : styles.statusDraft}`}>
                          {template.status}
                        </span>
                      </td>

                      <td>
                        <span className={styles.dateText}>
                          {new Date(template.createdAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionGroup} style={{ justifyContent: "flex-end" }}>
                          <button className={styles.iconBtn} onClick={(e) => handleView(template._id, e)}><Eye size={16} /></button>
                          <button className={styles.iconBtn} onClick={(e) => handleEdit(template._id, e)}><Pencil size={16} /></button>
                          <button className={`${styles.iconBtn} ${styles.delete}`} onClick={(e) => promptDelete(template._id, template.assessmentName, e)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && (
        <div className={styles.modalOverlay} onClick={closeViewModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{isLoadingView ? "Loading..." : viewingTemplate?.assessmentName}</h2>
              </div>
              <button className={styles.closeBtn} onClick={closeViewModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              {isLoadingView ? (
                <div className={styles.innerLoadingContainer}>
                   <Loader2 className={styles.spinner} size={32} />
                   <p className={styles.loadingText}>Fetching complete assessment data...</p>
                </div>
              ) : viewingTemplate?.questions?.length ? (
                <div className={styles.questionsList}>
                  {/* Changed mapping to include the index for correct numbering */}
                  {viewingTemplate.questions.map((q, index) => renderQuestionPreview(q, index))}
                </div>
              ) : (
                <p className={styles.emptyState}>No questions found in this template.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCloseButton} onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteModalIcon}><AlertCircle size={32} color="#ef4444" /></div>
            <h2 className={styles.deleteModalTitle}>Are you sure you want to delete?</h2>
            <div className={styles.deleteModalActions}>
              <button className={styles.deleteCancelBtn} onClick={cancelDelete} disabled={isDeleting}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className={styles.btnSpinner} size={16} /> : "Delete this template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentsList;