import React, { useState } from 'react';
import { Video, Edit, Trash2 } from 'lucide-react';
import styles from '../css/YouTubeVideoManager.module.css';

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface Props {
  videos: YouTubeVideo[];
  onChange: (videos: YouTubeVideo[]) => void;
}

const YouTubeVideoManager: React.FC<Props> = ({ videos, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetModal = () => {
    setVideoTitle('');
    setVideoUrl('');
    setVideoDescription('');
    setEditingId(null);
  };

  const openAddModal = () => {
    resetModal();
    setModalVisible(true);
  };

  const closeModal = () => {
    resetModal();
    setModalVisible(false);
  };

  const handleSaveVideo = () => {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      window.alert('Please enter both title and URL.');
      return;
    }

    if (!videoUrl.includes('youtube.com/') && !videoUrl.includes('youtu.be/')) {
      window.alert('Only YouTube URLs are supported.');
      return;
    }

    const newVideo: YouTubeVideo = {
      id: editingId || Date.now().toString(),
      title: videoTitle,
      url: videoUrl,
      description: videoDescription,
    };

    const updated = editingId
      ? videos.map((v) => (v.id === editingId ? newVideo : v))
      : [...videos, newVideo];

    onChange(updated);
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      onChange(videos.filter((v) => v.id !== id));
    }
  };

  const handleEdit = (video: YouTubeVideo) => {
    setEditingId(video.id);
    setVideoTitle(video.title);
    setVideoUrl(video.url);
    setVideoDescription(video.description);
    setModalVisible(true);
  };

  return (
    <div className={styles.container}>
      {videos.length === 0 ? (
        <div className={styles.noVideosContainer}>
          <Video className={styles.noVideosIcon} size={40} />
          <p className={styles.noVideosText}>No videos added yet</p>
        </div>
      ) : (
        <div className={styles.videoList}>
          {videos.map((item) => (
            <div key={item.id} className={styles.videoItem}>
              <div className={styles.videoInfo}>
                <Video className={styles.youtubeIcon} size={18} />
                <div className={styles.videoTextContainer}>
                  <p className={styles.videoTitle}>{item.title}</p>
                  <p className={styles.videoUrl}>{item.url}</p>
                  {item.description && (
                    <p className={styles.videoDescription}>{item.description}</p>
                  )}
                </div>
              </div>
              <div className={styles.videoActions}>
                <button
                  className={styles.videoEditButton}
                  onClick={() => handleEdit(item)}
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.videoDeleteButton}
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className={styles.addVideoButton} onClick={openAddModal}>
        <Video className={styles.addVideoIcon} size={20} />
        <span className={styles.addVideoButtonText}>Add YouTube Video</span>
      </button>

      {modalVisible && (
        <div
          className={styles.modalOverlay}
          onClick={closeModal}
        >
          <div
            className={styles.videoModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.videoModalTitle}>
              {editingId ? 'Edit Video' : 'Add YouTube Video'}
            </h2>
            <div className={styles.videoInputGroup}>
              <label className={styles.videoInputLabel}>Video Title</label>
              <input
                className={styles.videoInput}
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>
            <div className={styles.videoInputGroup}>
              <label className={styles.videoInputLabel}>YouTube URL</label>
              <input
                className={styles.videoInput}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter YouTube video URL"
              />
            </div>
            <div className={styles.videoInputGroup}>
              <label className={styles.videoInputLabel}>Description</label>
              <textarea
                className={[styles.videoInput, styles.videoDescriptionInput].join(' ')}
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Enter video description"
              />
            </div>
            <div className={styles.videoModalButtonsRow}>
              <button
                className={styles.videoModalCancelButton}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={styles.videoModalSaveButton}
                onClick={handleSaveVideo}
              >
                {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeVideoManager;