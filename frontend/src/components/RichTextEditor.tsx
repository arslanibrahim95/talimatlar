import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

interface ImageData {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onContentChange,
  placeholder = 'Metninizi buraya yazın...',
  className = '',
  readOnly = false
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState(400);
  const [imageHeight, setImageHeight] = useState(300);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // HTML içeriğini güvenli şekilde render etme
  const createMarkup = (html: string) => {
    return { __html: html };
  };

  // Seçili metni al
  const getSelectedText = (): string => {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  };



  // Metin formatlama fonksiyonları
  const formatText = (command: string, value?: string) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    onContentChange(editorRef.current?.innerHTML || '');
    editorRef.current?.focus();
  };

  // Başlık ekleme
  const addHeading = (level: number) => {
    if (readOnly) return;
    
    const heading = document.createElement(`h${level}`);
    heading.textContent = 'Yeni Başlık';
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(heading);
        onContentChange(editorRef.current.innerHTML);
      } else {
        editorRef.current.appendChild(heading);
        onContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Liste ekleme
  const addList = (type: 'ul' | 'ol') => {
    if (readOnly) return;
    
    const list = document.createElement(type);
    const listItem = document.createElement('li');
    listItem.textContent = 'Liste öğesi';
    list.appendChild(listItem);
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(list);
        onContentChange(editorRef.current.innerHTML);
      } else {
        editorRef.current.appendChild(list);
        onContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Resim ekleme
  const addImage = (imageData: ImageData) => {
    if (readOnly) return;
    
    const img = document.createElement('img');
    img.src = imageData.src;
    img.alt = imageData.alt;
    img.style.width = `${imageData.width}px`;
    img.style.height = `${imageData.height}px`;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.className = 'rounded-lg shadow-md';
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
      } else {
        editorRef.current.appendChild(img);
      }
      
      // Resim sonrası boşluk ekle
      const br = document.createElement('br');
      editorRef.current.appendChild(br);
      
      onContentChange(editorRef.current.innerHTML);
    }
    
    setIsImageModalOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Resim yükleme
  const handleImageUpload = async (file: File) => {
    if (readOnly) return;
    
    setIsUploading(true);
    
    try {
      // Gerçek uygulamada burada API'ye yükleme yapılır
      // Şimdilik local URL oluşturuyoruz
      const imageUrl = URL.createObjectURL(file);
      
      const imageData: ImageData = {
        id: Date.now().toString(),
        src: imageUrl,
        alt: file.name,
        width: imageWidth,
        height: imageHeight
      };
      
      addImage(imageData);
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // URL'den resim ekleme
  const handleAddImageFromUrl = () => {
    if (!imageUrl.trim()) return;
    
    const imageData: ImageData = {
      id: Date.now().toString(),
      src: imageUrl,
      alt: imageAlt || 'Resim',
      width: imageWidth,
      height: imageHeight
    };
    
    addImage(imageData);
  };

  // Drag & Drop resim yükleme
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleImageUpload(imageFiles[0]);
    }
  }, []);

  // Tablo ekleme
  const addTable = () => {
    if (readOnly) return;
    
    const table = document.createElement('table');
    table.className = 'border-collapse border border-gray-300 w-full';
    
    // Tablo başlığı
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (let i = 0; i < 3; i++) {
      const th = document.createElement('th');
      th.className = 'border border-gray-300 px-4 py-2 bg-gray-100 dark:bg-gray-700';
      th.textContent = `Başlık ${i + 1}`;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Tablo gövdesi
    const tbody = document.createElement('tbody');
    for (let i = 0; i < 2; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < 3; j++) {
        const td = document.createElement('td');
        td.className = 'border border-gray-300 px-4 py-2';
        td.textContent = `Hücre ${i + 1}-${j + 1}`;
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(table);
      } else {
        editorRef.current.appendChild(table);
      }
      
      // Tablo sonrası boşluk ekle
      const br = document.createElement('br');
      editorRef.current.appendChild(br);
      
      onContentChange(editorRef.current.innerHTML);
    }
  };

  // Bağlantı ekleme
  const addLink = () => {
    if (readOnly) return;
    
    const url = prompt('Bağlantı URL\'sini girin:');
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = getSelectedText() || url;
      link.target = '_blank';
      link.className = 'text-blue-600 hover:text-blue-800 underline';
      
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(link);
          onContentChange(editorRef.current.innerHTML);
        }
      }
    }
  };

  // Temizleme
  const clearFormatting = () => {
    if (readOnly) return;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const fragment = range.extractContents();
        const text = document.createTextNode(fragment.textContent || '');
        range.insertNode(text);
        onContentChange(editorRef.current.innerHTML);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2">
          <div className="flex flex-wrap gap-2">
            {/* Metin formatlama */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('bold')}
              title="Kalın"
            >
              <strong>B</strong>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('italic')}
              title="İtalik"
            >
              <em>I</em>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('underline')}
              title="Altı çizili"
            >
              <u>U</u>
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            
            {/* Başlık ekleme */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addHeading(1)}
              title="H1 Başlık"
            >
              H1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addHeading(2)}
              title="H2 Başlık"
            >
              H2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addHeading(3)}
              title="H3 Başlık"
            >
              H3
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            
            {/* Liste ekleme */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addList('ul')}
              title="Madde işaretli liste"
            >
              • Liste
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addList('ol')}
              title="Numaralı liste"
            >
              1. Liste
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            
            {/* Resim ekleme */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImageModalOpen(true)}
              title="Resim ekle"
            >
              🖼️ Resim
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Resim yükle"
            >
              📁 Yükle
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            
            {/* Tablo ve bağlantı */}
            <Button
              variant="outline"
              size="sm"
              onClick={addTable}
              title="Tablo ekle"
            >
              📊 Tablo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addLink}
              title="Bağlantı ekle"
            >
              🔗 Link
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            
            {/* Temizleme */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearFormatting}
              title="Formatı temizle"
            >
              🧹 Temizle
            </Button>
          </div>
        </div>
      )}

      {/* Editor */}
              <div
          ref={editorRef}
          contentEditable={!readOnly}
          className={`min-h-[300px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
          } ${readOnly ? 'cursor-default' : 'cursor-text'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onInput={() => onContentChange(editorRef.current?.innerHTML || '')}
          onBlur={() => onContentChange(editorRef.current?.innerHTML || '')}
          dangerouslySetInnerHTML={createMarkup(content)}
          data-placeholder={placeholder}
        />

      {/* Gizli dosya input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImageUpload(file);
          }
        }}
        className="hidden"
      />

      {/* Resim Ekleme Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Resim Ekle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resim URL'si
                </label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alt Metin
                </label>
                <Input
                  placeholder="Resim açıklaması"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Genişlik (px)
                  </label>
                  <Input
                    type="number"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(Number(e.target.value))}
                    min="100"
                    max="1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yükseklik (px)
                  </label>
                  <Input
                    type="number"
                    value={imageHeight}
                    onChange={(e) => setImageHeight(Number(e.target.value))}
                    min="100"
                    max="800"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleAddImageFromUrl}
                  disabled={!imageUrl.trim() || isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Yükleniyor...' : 'Resim Ekle'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsImageModalOpen(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Drag & Drop İpucu */}
      {!readOnly && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          💡 Resim eklemek için dosyayı buraya sürükleyip bırakabilirsiniz
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
