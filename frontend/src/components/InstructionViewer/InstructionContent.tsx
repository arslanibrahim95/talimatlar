import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  BookOpen,
  FileText,
  Image,
  Video,
  Volume1,
  Search,
  Highlighter,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react';

interface InstructionContentProps {
  instruction: any;
  viewerState: any;
  contentRef: React.RefObject<HTMLDivElement>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onSearch: (query: string) => void;
  onAddNote: (content: string, position: number) => void;
  onAddHighlight: (text: string, start: number, end: number, color: string) => void;
  onUpdateReadingProgress: () => void;
  className?: string;
}

const InstructionContent: React.FC<InstructionContentProps> = ({
  instruction,
  viewerState,
  contentRef,
  onZoomIn,
  onZoomOut,
  onRotate,
  onPlayPause,
  onVolumeChange,
  onMute,
  onSearch,
  onAddNote,
  onAddHighlight,
  onUpdateReadingProgress,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 });
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notePosition, setNotePosition] = useState(0);

  const highlightColors = [
    { name: 'Sarı', color: 'yellow', class: 'bg-yellow-200' },
    { name: 'Yeşil', color: 'green', class: 'bg-green-200' },
    { name: 'Mavi', color: 'blue', class: 'bg-blue-200' },
    { name: 'Pembe', color: 'pink', class: 'bg-pink-200' },
    { name: 'Turuncu', color: 'orange', class: 'bg-orange-200' }
  ];

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
        
        // Get selection position for highlight menu
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setHighlightPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setShowHighlightMenu(true);
      } else {
        setShowHighlightMenu(false);
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  // Handle scroll for reading progress
  useEffect(() => {
    const handleScroll = () => {
      onUpdateReadingProgress();
    };

    if (contentRef.current) {
      contentRef.current.addEventListener('scroll', handleScroll);
      return () => contentRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, [contentRef, onUpdateReadingProgress]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setShowSearch(false);
    }
  };

  const handleHighlight = (color: string) => {
    if (selectedText) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        
        onAddHighlight(selectedText, startOffset, endOffset, color);
        setShowHighlightMenu(false);
        setSelectedText('');
        selection.removeAllRanges();
      }
    }
  };

  const handleAddNote = () => {
    if (selectedText) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const position = range.startOffset;
        setNotePosition(position);
        setShowNoteDialog(true);
        setShowHighlightMenu(false);
      }
    }
  };

  const handleSaveNote = () => {
    if (noteContent.trim()) {
      onAddNote(noteContent, notePosition);
      setNoteContent('');
      setShowNoteDialog(false);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderContent = () => {
    if (instruction.attachments && instruction.attachments.length > 0) {
      const attachment = instruction.attachments[0];
      
      // Render different attachment types
      if (attachment.type.startsWith('image/')) {
        return (
          <div className="relative">
            <img
              src={attachment.url}
              alt={attachment.name}
              className="w-full rounded-lg shadow-lg"
              style={{ 
                transform: `scale(${viewerState.zoomLevel / 100}) rotate(${viewerState.rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
            
            {/* Image overlay controls */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button size="sm" variant="secondary" onClick={onZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={onZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={onRotate}>
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      }
      
      if (attachment.type.startsWith('video/')) {
        return (
          <div className="relative">
            <video
              src={attachment.url}
              className="w-full rounded-lg"
              controls
              onTimeUpdate={(e) => {
                // Handle time update
              }}
              onLoadedMetadata={(e) => {
                // Handle metadata loaded
              }}
            />
            
            {/* Video overlay controls */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="secondary" onClick={onPlayPause}>
                  {viewerState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div className="flex-1 bg-gray-300 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full"
                    style={{ width: `${(viewerState.currentTime / viewerState.duration) * 100}%` }}
                  />
                </div>
                
                <Button size="sm" variant="secondary" onClick={onMute}>
                  {viewerState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        );
      }
      
      if (attachment.type.startsWith('audio/')) {
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <Button size="lg" variant="secondary" onClick={onPlayPause}>
                {viewerState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Volume1 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{attachment.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-300 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${(viewerState.currentTime / viewerState.duration) * 100}%` }}
                    />
                  </div>
                  
                  <Button size="sm" variant="ghost" onClick={onMute}>
                    {viewerState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    // Render text content
    return (
      <div 
        className="prose prose-lg max-w-none"
        style={{ 
          transform: `scale(${viewerState.zoomLevel / 100}) rotate(${viewerState.rotation}deg)`,
          transformOrigin: 'top left',
          fontSize: viewerState.settings.fontSize === 'small' ? '14px' :
                   viewerState.settings.fontSize === 'medium' ? '16px' :
                   viewerState.settings.fontSize === 'large' ? '18px' : '20px',
          fontFamily: viewerState.settings.fontFamily === 'serif' ? 'serif' :
                     viewerState.settings.fontFamily === 'monospace' ? 'monospace' :
                     viewerState.settings.fontFamily === 'sans-serif' ? 'sans-serif' : 'system-ui',
          lineHeight: viewerState.settings.lineHeight === 'tight' ? '1.4' :
                     viewerState.settings.lineHeight === 'normal' ? '1.6' : '1.8'
        }}
      >
        <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
          {instruction.content || instruction.metadata.extractedText || 'İçerik bulunamadı.'}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-white border rounded-lg shadow-lg p-4">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İçerikte ara..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <Button type="submit" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setShowSearch(false)}
            >
              İptal
            </Button>
          </form>
        </div>
      )}

      {/* Highlight Menu */}
      {showHighlightMenu && (
        <div 
          className={`absolute z-20 bg-white border rounded-lg shadow-lg p-2 ${
            viewerState.deviceType === 'mobile' ? 'w-full max-w-sm mx-auto' : ''
          }`}
          style={{ 
            left: viewerState.deviceType === 'mobile' ? '50%' : highlightPosition.x - 100, 
            top: viewerState.deviceType === 'mobile' ? 'auto' : highlightPosition.y - 50,
            transform: viewerState.deviceType === 'mobile' ? 'translateX(-50%)' : 'none',
            bottom: viewerState.deviceType === 'mobile' ? '20px' : 'auto'
          }}
        >
          <div className={`flex ${viewerState.deviceType === 'mobile' ? 'justify-center space-x-2' : 'space-x-1'}`}>
            {highlightColors.map((color) => (
              <button
                key={color.color}
                onClick={() => handleHighlight(color.color)}
                className={`${viewerState.deviceType === 'mobile' ? 'w-12 h-12' : 'w-8 h-8'} rounded border-2 border-gray-300 ${color.class} hover:scale-110 transition-transform min-h-[44px]`}
                title={color.name}
                aria-label={`${color.name} renk ile vurgula`}
              />
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <button
              onClick={handleAddNote}
              className={`flex items-center justify-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded w-full min-h-[44px] ${
                viewerState.deviceType === 'mobile' ? 'text-base' : ''
              }`}
              aria-label="Seçilen metne not ekle"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Not Ekle</span>
            </button>
          </div>
        </div>
      )}

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="absolute inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Not Ekle</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Seçilen metin:</div>
              <div className="bg-gray-100 p-2 rounded text-sm italic">"{selectedText}"</div>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Notunuzu yazın..."
              className="w-full h-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowNoteDialog(false)}
              >
                İptal
              </Button>
              <Button onClick={handleSaveNote}>
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div 
        ref={contentRef}
        className={`overflow-auto ${viewerState.isFullscreen ? 'h-screen pt-16' : 'h-96'}`}
        style={{
          backgroundColor: viewerState.settings.theme === 'dark' ? '#1f2937' :
                         viewerState.settings.theme === 'sepia' ? '#f7f3e9' :
                         viewerState.settings.theme === 'high-contrast' ? '#000000' : '#ffffff',
          color: viewerState.settings.theme === 'dark' ? '#f9fafb' :
                viewerState.settings.theme === 'high-contrast' ? '#ffffff' : '#111827'
        }}
      >
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2" role="toolbar" aria-label="İçerik kontrolleri">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowSearch(!showSearch)}
          className="shadow-lg min-h-[44px] min-w-[44px]"
          aria-label="İçerikte ara"
          aria-pressed={showSearch}
        >
          <Search className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={onZoomIn}
          className="shadow-lg min-h-[44px] min-w-[44px]"
          aria-label="Yakınlaştır"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={onZoomOut}
          className="shadow-lg min-h-[44px] min-w-[44px]"
          aria-label="Uzaklaştır"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={onRotate}
          className="shadow-lg min-h-[44px] min-w-[44px]"
          aria-label="Döndür"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Highlights and Notes Overlay */}
      {viewerState.settings.showHighlights && viewerState.readingSession?.highlights.map((highlight: any) => (
        <div
          key={highlight.id}
          className="absolute pointer-events-none"
          style={{
            left: highlight.startPosition,
            top: highlight.position,
            backgroundColor: highlightColors.find(c => c.color === highlight.color)?.class,
            padding: '2px 4px',
            borderRadius: '2px',
            opacity: 0.7
          }}
        >
          {highlight.text}
        </div>
      ))}

      {/* Notes Overlay */}
      {viewerState.settings.showNotes && viewerState.readingSession?.notes.map((note: any) => (
        <div
          key={note.id}
          className="absolute bg-yellow-100 border-l-4 border-yellow-400 p-2 rounded shadow-sm max-w-xs"
          style={{
            left: note.position,
            top: note.position + 20
          }}
        >
          <div className="text-xs text-gray-600 mb-1">Not:</div>
          <div className="text-sm">{note.content}</div>
        </div>
      ))}
    </div>
  );
};

export default InstructionContent;
