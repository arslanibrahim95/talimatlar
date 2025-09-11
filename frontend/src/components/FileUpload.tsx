import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onFileRemove: (fileId: string) => void;
  uploadedFiles: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileRemove,
  uploadedFiles,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.gif'],
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    if (uploadedFiles.length >= maxFiles) {
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
        onFileUpload(file);
      } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        alert('Dosya yüklenirken hata oluştu');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('image')) return '🖼️';
    if (type.includes('text')) return '📃';
    return '📎';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dosyaları buraya sürükleyin veya{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              dosya seçin
            </button>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Maksimum {maxFiles} dosya, her biri {maxSize}MB'dan küçük
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Desteklenen türler: {acceptedTypes.join(', ')}
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Yüklenen Dosyalar ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    Görüntüle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onFileRemove(file.id)}
                  >
                    Kaldır
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Dosya yükleniyor...</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
