import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  Tag,
  Clock,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import api from "../utils/central";
import styles from "../css/ProfileScreen.module.css";
import BlogImageUploader from "../components/BlogImageUploader";

interface DoctorInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_phone: string;
  organization_name?: string;
  is_admin: boolean;
  qualification: string;
  patients?: any[];
  doctors_photo: string;
  address?: string;
  blogs?: string[];
}

interface Blog {
  _id: string;
  title: string;
  description: string;
  image?: string;
  imageWithSas?: string;
  genre: string;
  readTime: number;
  status: string;
  createdAt: string;
  doctor_name: string;
}

const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  if (phone.startsWith("+") && phone.length >= 3) {
    return `${phone.substring(0, 3)} ${phone.substring(3)}`;
  }
  return phone;
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" } as const;
  return date.toLocaleDateString("en-US", options);
};

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const session = { idToken: "mock-token" };
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedTab, setSelectedTab] = useState<"about" | "blogs">("about");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsPage, setBlogsPage] = useState(1);
  const [hasMoreBlogs, setHasMoreBlogs] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDoctorInfo = async () => {
    if (!session.idToken) {
      showToast("You must be logged in to view profile", "error");
      return;
    }
    try {
      const [doctorResponse, appointmentsResponse] = await Promise.all([
        api.get("/doctor"),
        api.get("/appointments/getevents"),
      ]);
      setDoctorInfo(doctorResponse.data);
      setAppointments(appointmentsResponse.data.appointments || []);
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      showToast("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async (page = 1, refresh = false) => {
    if (!session.idToken || !doctorInfo?._id) return;

    setBlogsLoading(true);
    try {
      const response = await api.get("/blogs", {
        headers: { Authorization: `Bearer ${session.idToken}` },
        params: {
          page: page,
          limit: 5,
          sortBy: "createdAt",
          sortOrder: -1,
        },
      });

      const newBlogs = response.data.data;
      if (refresh) {
        setBlogs(newBlogs);
      } else {
        setBlogs((prev) => [...prev, ...newBlogs]);
      }

      setHasMoreBlogs(
        newBlogs.length > 0 && page < response.data.pagination.pages
      );
      setBlogsPage(page);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      showToast("Failed to load blogs", "error");
    } finally {
      setBlogsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorInfo();
  }, [session.idToken]);

  useEffect(() => {
    if (doctorInfo && selectedTab === "blogs") {
      fetchBlogs(1, true);
    }
  }, [doctorInfo, selectedTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctorInfo();
    if (selectedTab === "blogs") {
      await fetchBlogs(1, true);
    }
    setRefreshing(false);
  };

  const loadMoreBlogs = () => {
    if (!blogsLoading && hasMoreBlogs) {
      fetchBlogs(blogsPage + 1);
    }
  };

  const navigateToCreateBlog = () => {
    navigate("/createBlogDetailsScreen");
  };

  const navigateToBlogDetails = (blogId: string) => {
    navigate(`/blog/${blogId}`);
  };
  
   // Handle read more click with event stopping
  const handleReadMore = (e: React.MouseEvent, blogId: string) => {
    e.stopPropagation(); // Prevent card click event
    navigateToBlogDetails(blogId);
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={48} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toast && (
        <div className={styles.toastContainer}>
          <div
            className={`${styles[
              `toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`
            ]}`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Your Profile</h1>
          <p className={styles.headerSubtitle}>
            Manage your professional details and content
          </p>
        </div>
        <button
          className={`${styles.refreshButton} ${
            refreshing ? styles.refreshButtonActive : ""
          }`}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className={styles.spinner} size={20} />
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      {/* First Row - Profile Info and Quick Stats */}
      <div className={styles.firstRow}>
        <div className={styles.profileInfoBox}>
          <div className={styles.profileImageContainer}>
            <BlogImageUploader
              initialImage={doctorInfo?.doctors_photo || null}
              isUploading={false}
              onImageSelected={() => {}}
              onImageRemoved={() => {}}
            />
          </div>
          <div className={styles.profileDetails}>
            <h2 className={styles.doctorName}>
              {doctorInfo?.doctor_first_name} {doctorInfo?.doctor_last_name}
            </h2>
            <p className={styles.qualification}>{doctorInfo?.qualification}</p>
            {doctorInfo?.organization_name && (
              <p className={styles.organization}>
                {doctorInfo.organization_name}
              </p>
            )}
            <div className={styles.contactItem}>
              <Mail size={18} />
              <span>{doctorInfo?.doctor_email}</span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={18} />
              <span>{formatPhoneNumber(doctorInfo?.doctor_phone || "")}</span>
            </div>
            {doctorInfo?.address && (
              <div className={styles.contactItem}>
                <MapPin size={18} />
                <span>{doctorInfo.address}</span>
              </div>
            )}
            <div className={styles.profileActions}>
              <button
                className={styles.actionButton}
                onClick={() => navigate("/Doctor/edit")}
              >
                Edit Profile
              </button>
              <button
                className={styles.actionButton}
                onClick={navigateToCreateBlog}
              >
                Create Blog
              </button>
            </div>
          </div>
        </div>

        <div className={styles.quickStatsBox}>
          <h3 className={styles.statsTitle}>Quick Stats</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <User size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Patients</span>
                <span className={styles.statNumber}>
                  {doctorInfo?.patients?.length || 0}
                </span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Calendar size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Appointments</span>
                <span className={styles.statNumber}>{appointments.length}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FileText size={20} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Blogs</span>
                <span className={styles.statNumber}>
                  {doctorInfo?.blogs?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

     {/* Second Row - Tabs and Content */}
      <div className={styles.secondRow}>
        <div className={styles.contentCard}>
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${
                selectedTab === "about" ? styles.activeTab : ""
              }`}
              onClick={() => setSelectedTab("about")}
            >
              About
            </button>
            <button
              className={`${styles.tab} ${
                selectedTab === "blogs" ? styles.activeTab : ""
              }`}
              onClick={() => setSelectedTab("blogs")}
            >
              Blogs
            </button>
          </div>
          <div className={styles.tabContent}>
            {selectedTab === "about" && (
              <div className={styles.aboutContent}>
                <div className={styles.aboutSection}>
                  <h4>Professional Summary</h4>
                  <p>
                    Experienced healthcare professional specializing in{" "}
                    {doctorInfo?.qualification}. Committed to providing
                    excellent patient care and contributing to medical knowledge
                    through research and education.
                  </p>
                </div>
                <div className={styles.aboutSection}>
                  <h4>Specialization</h4>
                  <p>{doctorInfo?.qualification}</p>
                </div>
              </div>
            )}
            {selectedTab === "blogs" && (
              <div className={styles.blogsContent}>
                {blogs.length === 0 && !blogsLoading ? (
                  <div className={styles.emptyBlogsContainer}>
                    <FileText size={48} />
                    <h4>No Blogs Yet</h4>
                    <p>Share your expertise by creating your first blog post</p>
                    <button
                      className={styles.createBlogButton}
                      onClick={navigateToCreateBlog}
                    >
                      Create Blog
                    </button>
                  </div>
                ) : (
                  <div className={styles.blogsGrid}>
                    {blogs.map((blog) => (
                      <div
                        key={blog._id}
                        className={styles.blogCard}
                        onClick={() => navigateToBlogDetails(blog._id)}
                      >
                        {blog.image && (
                          <div className={styles.blogImageContainer}>
                            <img
                              src={blog.imageWithSas}
                              alt={blog.title}
                              className={styles.blogImage}
                            />
                          </div>
                        )}
                        <div className={styles.blogContent}>
                          <span className={styles.blogGenre}>{blog.genre}</span>
                          <h4 className={styles.blogTitle}>{blog.title}</h4>
                          <p className={styles.blogDescription}>
                            {truncateText(blog.description, 80)}
                          </p>
                          {blog.description.length > 80 && (
                            <button
                              className={styles.readMoreButton}
                              onClick={(e) => handleReadMore(e, blog._id)}
                            >
                              Read more
                            </button>
                          )}
                          <div className={styles.blogMeta}>
                            <div className={styles.blogMetaItem}>
                              <Clock size={14} />
                              <span>{blog.readTime} min read</span>
                            </div>
                            <div className={styles.blogMetaItem}>
                              <Tag size={14} />
                              <span>{formatDate(blog.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                  </div>
                )}
                {blogsLoading && (
                  <div className={styles.loadingIndicator}>
                    <Loader2 className={styles.spinner} size={32} />
                  </div>
                )}
                {hasMoreBlogs && !blogsLoading && (
                  <button
                    className={styles.loadMoreButton}
                    onClick={loadMoreBlogs}
                  >
                    Load More Blogs
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default ProfileScreen;