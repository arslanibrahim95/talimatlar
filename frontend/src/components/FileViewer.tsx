import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import RichTextEditor from './RichTextEditor';

interface FileViewerProps {
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    content?: string;
    metadata?: {
      title?: string;
      description?: string;
      tags?: string[];
      category?: string;
      author?: string;
      version?: string;
    };
  };
  onUpdate: (fileId: string, updates: any) => void;
  onDelete: (fileId: string) => void;
  onDownload: (fileId: string) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  onUpdate,
  onDelete,
  onDownload
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editData, setEditData] = useState({
    title: file.metadata?.title || file.name,
    description: file.metadata?.description || '',
    tags: file.metadata?.tags || [],
    category: file.metadata?.category || '',
    author: file.metadata?.author || '',
    version: file.metadata?.version || '1.0'
  });
  const [fileContent, setFileContent] = useState(file.content || '');
  const [newTag, setNewTag] = useState('');

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
    return '📎';
  };

  const isImageFile = (type: string): boolean => type.startsWith('image/');
  const isVideoFile = (type: string): boolean => type.startsWith('video/');
  const isAudioFile = (type: string): boolean => type.startsWith('audio/');
  const isTextFile = (type: string): boolean => type.startsWith('text/') || type.includes('document');

  const handleSave = () => {
    onUpdate(file.id, {
      metadata: editData,
      content: fileContent
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: file.metadata?.title || file.name,
      description: file.metadata?.description || '',
      tags: file.metadata?.tags || [],
      category: file.metadata?.category || '',
      author: file.metadata?.author || '',
      version: file.metadata?.version || '1.0'
    });
    setIsEditing(false);
  };

  const addTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const renderFileContent = () => {
    if (isImageFile(file.type)) {
      return (
        <div className="max-w-full overflow-hidden rounded-lg">
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
      );
    }

    if (isVideoFile(file.type)) {
      return (
        <video
          controls
          className="w-full max-h-96 rounded-lg"
          preload="metadata"
        >
          <source src={file.url} type={file.type} />
          Tarayıcınız video oynatmayı desteklemiyor.
        </video>
      );
    }

    if (isAudioFile(file.type)) {
      return (
        <audio
          controls
          className="w-full"
          preload="metadata"
        >
          <source src={file.url} type={file.type} />
          Tarayıcınız ses oynatmayı desteklemiyor.
        </audio>
      );
    }

    if (isTextFile(file.type)) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {file.content || 'Dosya içeriği görüntülenemiyor.'}
          </pre>
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">{getFileIcon(file.type)}</div>
        <p>Bu dosya türü önizlenemiyor</p>
        <p className="text-sm mt-1">İndirerek görüntüleyebilirsiniz</p>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(file.type)}</span>
            <div>
              <CardTitle className="text-lg">{file.name}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)} • {file.type}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(file.id)}
                >
                  📥 İndir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(file.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️ Sil
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button size="sm" onClick={handleSave}>
                  💾 Kaydet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  ❌ İptal
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Dosya İçeriği
            </h4>
            {!isEditingContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingContent(true)}
              >
                ✏️ İçeriği Düzenle
              </Button>
            )}
          </div>
          
          {isEditingContent ? (
            <div className="space-y-4">
              <RichTextEditor
                content={fileContent}
                onContentChange={setFileContent}
                placeholder="Dosya içeriğini buraya yazın..."
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setIsEditingContent(false);
                    onUpdate(file.id, { content: fileContent });
                  }}
                >
                  💾 İçeriği Kaydet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingContent(false);
                    setFileContent(file.content || '');
                  }}
                >
                  ❌ İptal
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              {fileContent ? (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: fileContent }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Henüz içerik eklenmemiş</p>
                  <p className="text-sm mt-1">İçerik eklemek için "İçeriği Düzenle" butonuna tıklayın</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata Section */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Dosya Bilgileri
          </h4>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Başlık
                </label>
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Dosya başlığı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Dosya açıklaması"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategori
                </label>
                <Input
                  value={editData.category}
                  onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Dosya kategorisi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yazar
                </label>
                <Input
                  value={editData.author}
                  onChange={(e) => setEditData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Dosya yazarı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Versiyon
                </label>
                <Input
                  value={editData.version}
                  onChange={(e) => setEditData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Etiketler
                </label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Yeni etiket"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Başlık:</span>
                <p className="text-gray-900 dark:text-white">{editData.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama:</span>
                <p className="text-gray-900 dark:text-white">{editData.description || 'Açıklama yok'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori:</span>
                <p className="text-gray-900 dark:text-white">{editData.category || 'Kategori yok'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Yazar:</span>
                <p className="text-gray-900 dark:text-white">{editData.author || 'Yazar yok'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Versiyon:</span>
                <p className="text-gray-900 dark:text-white">{editData.version}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Etiketler:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {editData.tags.length > 0 ? (
                    editData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Etiket yok</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileViewer;
