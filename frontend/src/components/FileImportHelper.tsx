import React, { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface FileImportHelperProps {
  onImport: (files: File[]) => void;
  onCancel: () => void;
  className?: string;
}

const FileImportHelper: React.FC<FileImportHelperProps> = ({
  onImport,
  onCancel,
  className = ''
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importType, setImportType] = useState<'single' | 'multiple' | 'bulk'>('single');
  const [processing, setProcessing] = useState(false);

  const importTypes = [
    {
      id: 'single',
      title: 'Tek Dosya',
      description: 'Tek bir dosya seçin ve import edin',
      icon: '📄',
      maxFiles: 1
    },
    {
      id: 'multiple',
      title: 'Çoklu Dosya',
      description: 'Birden fazla dosya seçin',
      icon: '📁',
      maxFiles: 10
    },
    {
      id: 'bulk',
      title: 'Toplu Import',
      description: 'Klasör veya zip dosyasından toplu import',
      icon: '📦',
      maxFiles: 100
    }
  ];

  const supportedFormats = [
    { type: 'document', extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf'], icon: '📝' },
    { type: 'spreadsheet', extensions: ['.xlsx', '.xls', '.csv'], icon: '📊' },
    { type: 'presentation', extensions: ['.pptx', '.ppt'], icon: '📈' },
    { type: 'image', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'], icon: '🖼️' },
    { type: 'video', extensions: ['.mp4', '.avi', '.mov', '.wmv'], icon: '🎥' },
    { type: 'audio', extensions: ['.mp3', '.wav', '.aac'], icon: '🎵' },
    { type: 'archive', extensions: ['.zip', '.rar', '.7z'], icon: '📦' }
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const currentType = importTypes.find(t => t.id === importType);
    
    if (currentType && files.length > currentType.maxFiles) {
      alert(`Maksimum ${currentType.maxFiles} dosya seçebilirsiniz`);
      return;
    }
    
    setSelectedFiles(files);
  }, [importType]);

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      alert('Lütfen en az bir dosya seçin');
      return;
    }

    setProcessing(true);
    try {
      await onImport(selectedFiles);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Import hatası:', error);
      alert('Import sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    const format = supportedFormats.find(f => f.extensions.includes(extension));
    return format ? format.icon : '📎';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Import Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Import Türü Seçin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {importTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setImportType(type.id as any)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  importType === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {type.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Maksimum: {type.maxFiles} dosya
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Dosya Seçimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Dosyaları seçmek için tıklayın veya sürükleyin
              </p>
              <input
                type="file"
                multiple={importType !== 'single'}
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
                accept={supportedFormats.flatMap(f => f.extensions).join(',')}
              />
              <label htmlFor="file-input">
                <Button>
                  Dosya Seç
                </Button>
              </label>
            </div>

            {/* Supported Formats */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Desteklenen Formatlar:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {supportedFormats.map((format) => (
                  <div key={format.type} className="flex items-center space-x-2 text-sm">
                    <span className="text-lg">{format.icon}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {format.extensions.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Seçilen Dosyalar ({selectedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getFileIcon(file.name)}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Kaldır
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button
          onClick={handleImport}
          disabled={selectedFiles.length === 0 || processing}
        >
          {processing ? 'Import Ediliyor...' : 'Import Et'}
        </Button>
      </div>
    </div>
  );
};

export default FileImportHelper;
