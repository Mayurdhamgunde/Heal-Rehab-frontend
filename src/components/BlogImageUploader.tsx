import React, { useRef } from 'react';
import { Image } from 'lucide-react';
import styles from '../css/BlogImageUploader.module.css';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface BlogImageUploaderProps {
  onImageSelected: (image: File) => void;
  onImageRemoved: () => void;
  initialImage?: string | null;
  isUploading: boolean;
}

const BlogImageUploader: React.FC<BlogImageUploaderProps> = ({
  onImageSelected,
  initialImage,
  isUploading,
}) => {
  const [localImage, setLocalImage] = React.useState<string | null>(initialImage || null);
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState<Crop>({
    unit: '%',
    x: 10,
    y: 20,
    width: 80,
    height: 60,
  });
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImagePick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImage = async (): Promise<File | null> => {
    if (!completedCrop || !imgRef.current) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Set canvas size to maintain high quality
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], `blog-banner-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.95); // Higher quality (0.95 instead of 0.8)
    });
  };

  const handleImageUpload = async () => {
    const croppedImage = await getCroppedImage();
    if (croppedImage) {
      setLocalImage(URL.createObjectURL(croppedImage));
      onImageSelected(croppedImage);
    }
    setShowCropModal(false);
    setSelectedImage(null);
    setCompletedCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      {localImage ? (
        <div className={styles.imagePreviewContainer}>
          <img src={localImage} alt="Blog Banner" className={styles.imagePreview} />
          {isUploading && (
            <div className={styles.uploadingOverlay}>
              <div className={styles.spinner} />
            </div>
          )}
          
        </div>
      ) : (
        <button
          className={styles.uploadButton}
          onClick={handleImagePick}
          disabled={isUploading}
        >
          <Image size={40} />
          <span className={styles.addImageText}>Add Banner Image</span>
        </button>
      )}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageSelect}
      />
      {showCropModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowCropModal(false);
            setSelectedImage(null);
            setCompletedCrop(null);
          }}
        >
          <div
            className={styles.cropModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.videoModalTitle}>Crop Banner Image</h2>
            <div className={styles.cropImageContainer}>
              {selectedImage && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={16 / 9} // Banner aspect ratio (16:9)
                  className="ReactCrop"
                >
                  <img
                    ref={imgRef}
                    src={selectedImage}
                    alt="Crop"
                    className={styles.cropImage}
                    onLoad={() => {
                      setCrop({
                        unit: '%',
                        x: 10,
                        y: 20,
                        width: 80,
                        height: 60,
                      });
                    }}
                  />
                </ReactCrop>
              )}
            </div>
            <div className={styles.videoModalButtonsRow}>
              <button
                className={styles.videoModalCancelButton}
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedImage(null);
                  setCompletedCrop(null);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.videoModalSaveButton}
                onClick={handleImageUpload}
                disabled={!completedCrop}
              >
                Save Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogImageUploader;