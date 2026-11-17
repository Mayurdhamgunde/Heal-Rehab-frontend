import React, { useState, useEffect, useRef } from 'react';
import { FileText, Image as ImageIcon, Save, Tag, Clock, Eye, Check, Type, BookOpen, Film } from 'lucide-react';
import styles from '../css/CreateBlogScreen.module.css';
import api from '../utils/central';
import { useNavigate, useParams } from 'react-router-dom';
import BlogImageUploader from '../components/BlogImageUploader';
import YouTubeVideoManager, { type YouTubeVideo } from '../components/YouTubeVideoManager';

interface BlogFormData {
  title: string;
  description: string;
  image: File | string | null;
  videos: YouTubeVideo[];
  genre: string;
  readTime: string;
  status: 'draft' | 'published';
}

interface ValidationErrors {
  title: string;
  description: string;
  genre: string;
}

interface Blog {
  _id: string;
  title: string;
  image?: string;
  imageWithSas?: string;
  description: string;
  videos?: YouTubeVideo[];
  genre: string;
  readTime: number;
  status: string;
  createdAt: string;
  doctor_id: string;
  doctor_name: string;
}

const genres = [
  'Mental Health',
  'Physical Therapy',
  'Nutrition',
  'Wellness',
  'Medical Research',
  'Health Tips',
  'Disease Prevention',
  'Healthcare',
  'Other',
];

const readTimeOptions = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

const UpdateBlogScreen: React.FC = () => {
  const navigate = useNavigate();
  const { blogId } = useParams<{ blogId: string }>();
  const session = { idToken: 'mock-token' };
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    description: '',
    image: null,
    videos: [],
    genre: genres[0],
    readTime: readTimeOptions[3],
    status: 'draft',
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    title: '',
    description: '',
    genre: '',
  });

  const [touched, setTouched] = useState({
    title: false,
    description: false,
    genre: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPermissionError, setIsPermissionError] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchBlogDetails = async () => {
      if (!session.idToken || !blogId) return;

      setLoading(true);
      try {
        const response = await api.get(`/blog/${blogId}`, {
          headers: { Authorization: `Bearer ${session.idToken}` },
        });

        if (response.data.success) {
          const blogData: Blog = response.data.data;
          setFormData({
            title: blogData.title,
            description: blogData.description,
            image: blogData.imageWithSas || null,
            videos: blogData.videos || [],
            genre: blogData.genre,
            readTime: blogData.readTime.toString(),
            status: blogData.status as 'draft' | 'published',
          });
        }
      } catch (error) {
        showToast('Failed to load blog details. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [blogId]);

  const handleInputChange = (
    field: keyof BlogFormData,
    value: string | YouTubeVideo[] | File | null
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    if (field === 'title' || field === 'description' || field === 'genre') {
      setTouched({
        ...touched,
        [field]: true,
      });
      validateField(field, value as string);
    }
  };

  const validateField = (field: keyof ValidationErrors, value: string) => {
    let newErrors = { ...errors };

    switch (field) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.trim().length > 100) {
          newErrors.title = 'Title must be less than 100 characters';
        } else {
          newErrors.title = '';
        }
        break;
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Content is required';
        } else {
          const wordCount = value.trim().split(/\s+/).length;
          if (wordCount < 50) {
            newErrors.description = `Content is too short. Current: ${wordCount} words (minimum 50 words)`;
          } else {
            newErrors.description = '';
          }
        }
        break;
      case 'genre':
        if (!value) {
          newErrors.genre = 'Please select a genre';
        } else {
          newErrors.genre = '';
        }
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const handleBlur = (field: keyof ValidationErrors) => {
    setTouched({
      ...touched,
      [field]: true,
    });
    validateField(field, formData[field] as string);
    if (field === 'description') {
      calculateReadTime();
    }
  };

  const validateForm = () => {
    const titleIsValid = validateField('title', formData.title);
    const descriptionIsValid = validateField('description', formData.description);
    const genreIsValid = validateField('genre', formData.genre);

    setTouched({
      title: true,
      description: true,
      genre: true,
    });

    return titleIsValid && descriptionIsValid && genreIsValid;
  };

  const scrollToFirstError = () => {
    if (errors.title && titleInputRef.current) {
      titleInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.description && descriptionInputRef.current) {
      descriptionInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleImageSelected = (imageData: File) => {
    setIsUploadingImage(true);
    setFormData({
      ...formData,
      image: imageData,
    });
    setTimeout(() => setIsUploadingImage(false), 1000);
  };

  const handleImageRemoved = () => {
    setFormData({
      ...formData,
      image: null,
    });
  };

  const handleVideosChange = (videos: YouTubeVideo[]) => {
    setFormData({
      ...formData,
      videos,
    });
  };

  const calculateReadTime = () => {
    const wordCount = formData.description.trim().split(/\s+/).length;
    const estimatedTime = Math.ceil(wordCount / 200);

    if (estimatedTime < 2) {
      handleInputChange('readTime', '2');
    } else if (estimatedTime > 10) {
      handleInputChange('readTime', '10');
    } else {
      handleInputChange('readTime', estimatedTime.toString());
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    setFormData({
      ...formData,
      status,
    });

    if (!validateForm()) {
      scrollToFirstError();
      return;
    }

    if (!session.idToken) {
      showToast('You must be logged in to update a blog post', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const blogFormData = new FormData();
      blogFormData.append('title', formData.title);
      blogFormData.append('description', formData.description);
      blogFormData.append('genre', formData.genre);
      blogFormData.append('readTime', formData.readTime);
      blogFormData.append('status', status);

      if (formData.image instanceof File) {
        blogFormData.append('image', formData.image);
      } else if (!formData.image) {
        blogFormData.append('removeImage', 'true');
      }

      if (formData.videos.length > 0) {
        blogFormData.append('videos', JSON.stringify(formData.videos));
      }

      const response = await api.put(`/update/blog/${blogId}`, blogFormData, {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        showToast(`Blog post ${status === 'draft' ? 'saved as draft' : 'published'} successfully`);
        navigate(`/blog/${blogId}`);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        setIsPermissionError(true);
        showToast("You don't have permission to update this blog", 'error');
      } else {
        showToast(`Failed to ${status === 'draft' ? 'save' : 'publish'} blog post`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <header className={styles.header}>
            <h1>Update Blog Post</h1>
          </header>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (isPermissionError) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <header className={styles.header}>
            <h1>Update Blog Post</h1>
          </header>
          <div>You don't have permission to edit this blog</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toast && (
        <div className={styles.toastContainer}>
          <div
            className={`${styles.toast} ${
              toast.type === 'success' ? styles.toastSuccess : styles.toastError
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
      
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <h1>Update Blog Post</h1>
          <p className={styles.subtitle}>Update your healthcare insights</p>
        </header>
        
        <div className={styles.formContainer}>
          {/* Main Column */}
          <div className={styles.mainColumn}>
            {/* Content Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <FileText className={styles.sectionIcon} size={20} />
                <h2 className={styles.sectionTitle}>Content</h2>
              </div>
              
              <div className={styles.sectionContent}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <Type size={16} style={{ marginRight: 8, color: '#0f766e' }} />
                    Title <span className={styles.required}>*</span>
                  </label>
                  <div className={`${styles.inputWrapper} ${touched.title && errors.title ? styles.inputError : ''}`}>
                    <input
                      ref={titleInputRef}
                      className={styles.input}
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      onBlur={() => handleBlur('title')}
                      placeholder="Enter blog title"
                    />
                  </div>
                  {touched.title && errors.title && (
                    <p className={styles.errorText}>{errors.title}</p>
                  )}
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <BookOpen size={16} style={{ marginRight: 8, color: '#0f766e' }} />
                    Content <span className={styles.required}>*</span>
                  </label>
                  <div className={`${styles.inputWrapper} ${touched.description && errors.description ? styles.inputError : ''}`}>
                    <textarea
                      ref={descriptionInputRef}
                      className={`${styles.input} ${styles.textarea}`}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      onBlur={() => handleBlur('description')}
                      placeholder="Write your blog content here..."
                    />
                  </div>
                  {touched.description && errors.description && (
                    <p className={styles.errorText}>{errors.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Media Section */}
            <div className={`${styles.section} ${styles.mediaSection}`}>
              <div className={`${styles.sectionHeader} ${styles.mediaHeader}`}>
                <ImageIcon className={styles.sectionIcon} size={20} />
                <h2 className={styles.sectionTitle}>Media</h2>
              </div>
              
              <div className={styles.sectionContent}>
                <p className={styles.sectionDescription}>
                  Add images or videos to enhance your blog post.
                </p>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <ImageIcon size={16} style={{ marginRight: 8, color: '#0f766e' }} />
                    Featured Image
                  </label>
                  <BlogImageUploader
                    onImageSelected={handleImageSelected}
                    onImageRemoved={handleImageRemoved}
                    initialImage={typeof formData.image === 'string' ? formData.image : formData.image ? URL.createObjectURL(formData.image) : null}
                    isUploading={isUploadingImage}
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <Film size={16} style={{ marginRight: 8, color: '#0f766e' }} />
                    YouTube Videos
                  </label>
                  <YouTubeVideoManager
                    videos={formData.videos}
                    onChange={handleVideosChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Side Column */}
          <div className={styles.sideColumn}>
            {/* Details Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Tag className={styles.sectionIcon} size={20} />
                <h2 className={styles.sectionTitle}>Details</h2>
              </div>
              
              <div className={styles.sectionContent}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <Tag size={16} style={{ marginRight: 8, color: '#0f766e' }} />
                    Genre <span className={styles.required}>*</span>
                  </label>
                  <div className={`${styles.inputWrapper} ${touched.genre && errors.genre ? styles.inputError : ''}`}>
                    <select
                      className={styles.select}
                      value={formData.genre}
                      onChange={(e) => handleInputChange('genre', e.target.value)}
                      onBlur={() => handleBlur('genre')}
                    >
                      {genres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>
                  {touched.genre && errors.genre && (
                    <p className={styles.errorText}>{errors.genre}</p>
                  )}
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <Clock size={16} style={{ marginRight: 8, color: '#0f766e' }} />
                    Read Time (minutes)
                  </label>
                  <div className={styles.inputWrapper}>
                    <select
                      className={styles.select}
                      value={formData.readTime}
                      onChange={(e) => handleInputChange('readTime', e.target.value)}
                    >
                      {readTimeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option} min
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <FileText className={styles.sectionIcon} size={20} />
                <h2 className={styles.sectionTitle}>Status</h2>
              </div>
              
              <div className={styles.sectionContent}>
                <div className={styles.statusButtons}>
                  <button
                    className={`${styles.statusButton} ${styles.saveAsDraft}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit('draft');
                    }}
                    disabled={isSubmitting}
                  >
                    <Save size={18} style={{ marginRight: 8 }} />
                    Save as Draft
                  </button>
                  <button
                    className={`${styles.statusButton} ${styles.publishNow}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit('published');
                    }}
                    disabled={isSubmitting}
                  >
                    <Eye size={18} style={{ marginRight: 8 }} />
                    Publish Now
                  </button>
                </div>
              </div>
            </div>
            
            {/* Writing Tips */}
            <div className={styles.writingTips}>
              <h3 className={styles.tipTitle}>Writing Tips</h3>
              <ul className={styles.tipList}>
                <li className={styles.tipItem}>
                  <Check className={styles.tipIcon} size={16} />
                  Keep your title under 60 characters
                </li>
                <li className={styles.tipItem}>
                  <Check className={styles.tipIcon} size={16} />
                  Use headers to structure your content
                </li>
                <li className={styles.tipItem}>
                  <Check className={styles.tipIcon} size={16} />
                  Add images to make it engaging
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateBlogScreen;