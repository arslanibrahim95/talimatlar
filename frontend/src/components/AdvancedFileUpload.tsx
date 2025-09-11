import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  uploadDate: Date;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
}

interface AdvancedFileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  onFileRemove: (fileId: string) => void;
  uploadedFiles: UploadedFile[];
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  showPreview?: boolean;
  allowMultiple?: boolean;
}

const AdvancedFileUpload: React.FC<AdvancedFileUploadProps> = ({
  onFileUpload,
  onFileRemove,
  uploadedFiles,
  maxFiles = 10,
  maxSize = 50,
  acceptedTypes = [
    '.pdf', '.doc', '.docx', '.txt', '.rtf',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
    '.mp4', '.avi', '.mov', '.wmv',
    '.mp3', '.wav', '.aac',
    '.xlsx', '.xls', '.csv',
    '.pptx', '.ppt'
  ],
  className = '',
  showPreview = true,
  allowMultiple = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('text')) return '📃';
    if (type.includes('archive') || type.includes('zip')) return '📦';
    return '📎';
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `Dosya boyutu ${maxSize}MB'dan büyük olamaz`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `Desteklenmeyen dosya türü. İzin verilen türler: ${acceptedTypes.join(', ')}`;
    }

    // Check max files
    if (!allowMultiple && uploadedFiles.length >= 1) {
      return 'Sadece 1 dosya yükleyebilirsiniz';
    }
    if (allowMultiple && uploadedFiles.length >= maxFiles) {
      return `Maksimum ${maxFiles} dosya yükleyebilirsiniz`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        alert(error);
        continue;
      }

      setUploading(true);
      try {
        await onFileUpload(file);
      } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        alert('Dosya yüklenirken hata oluştu');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = () => {
    // Mobile camera capture
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          // Capture frame after 2 seconds
          setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                handleFileSelect(dataTransfer.files);
              }
            }, 'image/jpeg');
            
            stream.getTracks().forEach(track => track.stop());
          }, 2000);
        })
        .catch(err => {
          console.error('Kamera erişimi hatası:', err);
          alert('Kameraya erişilemedi');
        });
    }
  };

  const isImageFile = (type: string): boolean => {
    return type.startsWith('image/');
  };

  const isVideoFile = (type: string): boolean => {
    return type.startsWith('video/');
  };

  const isAudioFile = (type: string): boolean => {
    return type.startsWith('audio/');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        ref={dropZoneRef}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dosyaları buraya sürükleyin
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              veya{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                dosya seçin
              </button>
            </p>
          </div>
          
          {/* Mobile Camera Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCameraCapture}
              className="flex items-center space-x-2"
            >
              📷 Kamera ile Çek
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Maksimum {maxFiles} dosya, her biri {maxSize}MB'dan küçük</p>
            <p>Desteklenen türler: {acceptedTypes.slice(0, 8).join(', ')}...</p>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={allowMultiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        capture="environment"
      />

      {/* Uploaded Files Grid */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Yüklenen Dosyalar ({uploadedFiles.length}/{maxFiles})
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Toplam: {formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {uploadedFiles.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* File Preview */}
                  {showPreview && isImageFile(file.type) && (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <img
                        src={file.preview || file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {showPreview && isVideoFile(file.type) && (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <video
                        src={file.url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </div>
                  )}
                  
                  {showPreview && isAudioFile(file.type) && (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <audio
                        src={file.url}
                        controls
                        className="w-full"
                        preload="metadata"
                      />
                    </div>
                  )}
                  
                  {!showPreview || (!isImageFile(file.type) && !isVideoFile(file.type) && !isAudioFile(file.type)) ? (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <span className="text-4xl">{getFileIcon(file.type)}</span>
                    </div>
                  ) : null}

                  {/* File Info */}
                  <div className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                          {file.name}
                        </h5>
                        <button
                          onClick={() => onFileRemove(file.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>{formatFileSize(file.size)}</p>
                        <p>{new Date(file.uploadDate).toLocaleDateString('tr-TR')}</p>
                      </div>

                      {/* Progress Bar */}
                      {file.status === 'uploading' && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress || 0}%` }}
                          />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          file.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          file.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {file.status === 'success' ? '✓ Başarılı' :
                           file.status === 'error' ? '✗ Hata' :
                           '⏳ Yükleniyor'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600 dark:text-blue-400">Dosya yükleniyor...</span>
        </div>
      )}
    </div>
  );
};

export default AdvancedFileUpload;
