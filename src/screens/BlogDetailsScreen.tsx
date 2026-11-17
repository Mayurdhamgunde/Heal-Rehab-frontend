import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Edit, Clock, AlertCircle, RefreshCw, PlayCircle } from 'lucide-react';
import api from '../utils/central';
import styles from '../css/BlogDetailsScreen.module.css';

interface YouTubeVideo {
  url: string;
  title: string;
}

interface Blog {
  imageWithSas: string | undefined;
  _id: string;
  title: string;
  description: string;
  image?: string;
  video?: string;
  videos?: YouTubeVideo[];
  genre: string;
  readTime: number;
  status: string;
  createdAt: string;
  doctor_id: string;
  doctor_name: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const handleError = (error: unknown) => {
  console.error('An error occurred:', error);
};

const BlogDetailsScreen: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const session = { idToken: 'placeholder-token' };
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    fetchBlogDetails();
  }, [blogId]);

  const fetchBlogDetails = async () => {
    if (!session?.idToken || !blogId) {
      setError(true);
      setLoading(false);
      return;
    }

    if (!blog) {
      setLoading(true);
    }
    setError(false);

    try {
      const response = await api.get(`/blog/${blogId}`);
      if (response.data.success) {
        setBlog(response.data.data);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      handleError(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!blog) return;

    try {
      const blogLink = `https://healtrackai.com/blog/${blog._id}`;
      if (navigator.share) {
        await navigator.share({
          title: blog.title,
          text: `Check out this blog: ${blog.title}\n\n${blog.description.substring(0, 150)}...`,
          url: blogLink,
        });
      } else {
        alert('Sharing is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error sharing blog:', error);
    }
  };

  const handleEditBlog = () => {
    if (blog) {
      navigate(`/Updateblog/${blogId}`);
    }
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : '';
  };

  if (loading && !blog) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <AlertCircle className={`${styles.icon} ${styles.errorIcon}`} />
          <p className={styles.errorText}>Blog not found or unable to load blog details</p>
          <button className={styles.refreshButton} onClick={fetchBlogDetails}>
            <RefreshCw className={`${styles.icon} ${styles.refreshIcon}`} />
            <span className={styles.refreshButtonText}>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollView}>
        <div className={styles.scrollContent}>
          <div className={styles.blogMainContent}>
            {/* Left side - Blog Information */}
            <div className={styles.blogInfoSection}>
              <div className={styles.blogHeader}>
                <div className={styles.titleContainer}>
                  <h1 className={styles.blogTitle}>{blog.title}</h1>
                  <div className={styles.actionIcons}>
                    <Share2
                      className={`${styles.icon} ${styles.actionIcon}`}
                      onClick={handleShare}
                      aria-label="Share blog"
                    />
                    <Edit
                      className={`${styles.icon} ${styles.actionIcon}`}
                      onClick={handleEditBlog}
                      aria-label="Edit blog"
                    />
                  </div>
                </div>
                <div className={styles.metaContainer}>
                  <div className={styles.authorDateContainer}>
                    <span className={styles.authorText}>By {blog.doctor_name}</span>
                    <span className={styles.dateText}>{formatDate(blog.createdAt)}</span>
                  </div>
                  <div className={styles.readTimeContainer}>
                    <Clock className={`${styles.icon} ${styles.clockIcon}`} />
                    <span className={styles.readTimeText}>{blog.readTime} min read</span>
                  </div>
                  <div className={styles.genreContainer}>
                    <span className={styles.genreText}>{blog.genre}</span>
                  </div>
                </div>
              </div>
              <div className={styles.divider} />
              <p className={styles.blogContent}>{blog.description}</p>
              {blog.videos && blog.videos.length > 0 && (
                <div className={styles.videoContainer}>
                  {blog.videos.map((video, index) => {
                    const embedUrl = getYouTubeEmbedUrl(video.url);
                    return embedUrl ? (
                      <div key={index} className={styles.videoWrapper}>
                        <h3 className={styles.videoTitle}>{video.title}</h3>
                        <iframe
                          src={embedUrl}
                          title={video.title}
                          className={styles.videoIframe}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              {blog.video && (
                <div className={styles.videoPlaceholder}>
                  <PlayCircle className={`${styles.icon} ${styles.playIcon}`} />
                  <p className={styles.videoText}>Video content available</p>
                </div>
              )}
            </div>

            {/* Right side - Image */}
            <div className={styles.blogImageSection}>
              {blog.imageWithSas && (
                <img src={blog.imageWithSas} className={styles.blogImage} alt="Blog cover" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailsScreen;