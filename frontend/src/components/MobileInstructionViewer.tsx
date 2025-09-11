import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useInstructionViewer } from '../hooks/useInstructionViewer';
import InstructionHeader from './InstructionViewer/InstructionHeader';
import InstructionContent from './InstructionViewer/InstructionContent';
import InstructionNavigation from './InstructionViewer/InstructionNavigation';
import { 
  Eye, 
  Download, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Search,
  Filter,
  SortAsc,
  Calendar,
  User,
  Tag,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Image,
  Video,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Settings,
  MoreVertical,
  QrCode,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

interface MobileInstruction {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  content: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  author: string;
  approver?: string;
  version: string;
  effectiveDate: string;
  reviewDate: string;
  tags: string[];
  targetAudience: string[];
  departments: string[];
  attachments: FileAttachment[];
  metadata: InstructionMetadata;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  readCount: number;
  lastReadAt?: string;
  mobileOptimized: boolean;
  qrCode?: string;
  readingProgress?: number;
  bookmarked?: boolean;
  lastReadPosition?: number;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  checksum: string;
}

interface InstructionMetadata {
  fileType: string;
  fileSize: number;
  pageCount?: number;
  wordCount?: number;
  language: string;
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  compliance: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  extractedText?: string;
  summary?: string;
}

interface MobileInstructionViewerProps {
  instruction: MobileInstruction;
  onUpdate?: (instruction: MobileInstruction) => void;
  onDelete?: (id: string) => void;
  onDownload?: (attachment: FileAttachment) => void;
  onShare?: (instruction: MobileInstruction) => void;
  onBookmark?: (id: string, bookmarked: boolean) => void;
  className?: string;
}

const MobileInstructionViewer: React.FC<MobileInstructionViewerProps> = ({
  instruction,
  onUpdate,
  onDelete,
  onDownload,
  onShare,
  onBookmark,
  className = ''
}) => {
  const [showSettings, setShowSettings] = useState(false);
  
  // Use the custom hook for viewer logic
  const {
    viewerState,
    navigation,
    searchResults,
    currentSearchIndex,
    contentRef,
    navigateToView,
    navigateToPosition,
    toggleBookmark,
    addNote,
    updateNote,
    deleteNote,
    addHighlight,
    removeHighlight,
    searchInContent,
    navigateToSearchResult,
    updateSettings,
    togglePlayPause,
    setVolume,
    toggleMute,
    setZoomLevel,
    rotate,
    toggleFullscreen,
    updateReadingProgress,
    startAutoScroll,
    stopAutoScroll
  } = useInstructionViewer({
    instruction,
    userId: 'current_user',
    onUpdate,
    onAnalytics: (event) => {
      console.log('Analytics event:', event);
    }
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  useEffect(() => {
    // Track reading progress
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        const scrollHeight = contentRef.current.scrollHeight;
        const clientHeight = contentRef.current.clientHeight;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
        setLastReadPosition(scrollTop);
      }
    };

    if (contentRef.current) {
      contentRef.current.addEventListener('scroll', handleScroll);
      return () => contentRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, [currentView]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'restricted': return 'bg-red-100 text-red-800';
      case 'confidential': return 'bg-orange-100 text-orange-800';
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'public': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBookmark = () => {
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    onBookmark?.(instruction.id, newBookmarked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: instruction.title,
        text: instruction.description,
        url: window.location.href
      });
    } else {
      onShare?.(instruction);
    }
  };

  const handleDownload = (attachment: FileAttachment) => {
    onDownload?.(attachment);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(200, prev + 25));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(50, prev - 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleMediaPlay = () => {
    setIsPlaying(true);
    if (mediaRef.current) {
      mediaRef.current.play();
    }
  };

  const handleMediaPause = () => {
    setIsPlaying(false);
    if (mediaRef.current) {
      mediaRef.current.pause();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600">{instruction.companyName}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{instruction.title}</h1>
        <p className="text-gray-600">{instruction.description}</p>
      </div>

      {/* Status and Priority */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge className={getPriorityColor(instruction.priority)}>
          {instruction.priority.toUpperCase()}
        </Badge>
        <Badge className={getStatusColor(instruction.status)}>
          {instruction.status.toUpperCase()}
        </Badge>
        <Badge className={getSecurityLevelColor(instruction.metadata.securityLevel)}>
          {instruction.metadata.securityLevel.toUpperCase()}
        </Badge>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Yazar</span>
          </div>
          <p className="text-sm text-gray-900">{instruction.author}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Versiyon</span>
          </div>
          <p className="text-sm text-gray-900">{instruction.version}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Geçerlilik</span>
          </div>
          <p className="text-sm text-gray-900">{formatDate(instruction.effectiveDate)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Gözden Geçirme</span>
          </div>
          <p className="text-sm text-gray-900">{formatDate(instruction.reviewDate)}</p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Etiketler</h3>
        <div className="flex flex-wrap gap-1">
          {instruction.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Compliance */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Uyumluluk</h3>
        <div className="flex flex-wrap gap-1">
          {instruction.metadata.compliance.map((compliance, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {compliance}
            </Badge>
          ))}
        </div>
      </div>

      {/* Reading Progress */}
      {readingProgress > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Okuma İlerlemesi</span>
            <span className="text-sm text-gray-500">{Math.round(readingProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div 
      ref={contentRef}
      className="prose prose-sm max-w-none"
      style={{ 
        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
        transformOrigin: 'top left'
      }}
    >
      <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
        {instruction.content || instruction.metadata.extractedText || 'İçerik bulunamadı.'}
      </div>
    </div>
  );

  const renderAttachments = () => (
    <div className="space-y-4">
      {instruction.attachments.map((attachment) => (
        <div key={attachment.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {attachment.type.startsWith('image/') ? (
                  <Image className="w-5 h-5 text-blue-600" />
                ) : attachment.type.startsWith('video/') ? (
                  <Video className="w-5 h-5 text-blue-600" />
                ) : attachment.type.startsWith('audio/') ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{attachment.name}</h4>
                <p className="text-sm text-gray-500">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(attachment)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Media Preview */}
          {attachment.type.startsWith('image/') && (
            <div className="relative">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full rounded-lg"
                style={{ 
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
              />
              {isFullscreen && (
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Button size="sm" variant="secondary" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {attachment.type.startsWith('video/') && (
            <div className="relative">
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={attachment.url}
                className="w-full rounded-lg"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="secondary" onClick={isPlaying ? handleMediaPause : handleMediaPlay}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <div className="flex-1 bg-gray-300 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleMute}>
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {attachment.type.startsWith('audio/') && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={attachment.url}
                className="w-full"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Button size="sm" variant="secondary" onClick={isPlaying ? handleMediaPause : handleMediaPlay}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="flex-1 bg-gray-300 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <Button size="sm" variant="secondary" onClick={handleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderMetadata = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Dosya Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Dosya Türü:</span>
              <span className="font-medium">{instruction.metadata.fileType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dosya Boyutu:</span>
              <span className="font-medium">{formatFileSize(instruction.metadata.fileSize)}</span>
            </div>
            {instruction.metadata.pageCount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Sayfa Sayısı:</span>
                <span className="font-medium">{instruction.metadata.pageCount}</span>
              </div>
            )}
            {instruction.metadata.wordCount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Kelime Sayısı:</span>
                <span className="font-medium">{instruction.metadata.wordCount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Dil:</span>
              <span className="font-medium">{instruction.metadata.language}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Güvenlik Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Güvenlik Seviyesi:</span>
              <Badge className={getSecurityLevelColor(instruction.metadata.securityLevel)}>
                {instruction.metadata.securityLevel}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risk Seviyesi:</span>
              <Badge className={getPriorityColor(instruction.metadata.riskLevel)}>
                {instruction.metadata.riskLevel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">İstatistikler</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Okunma Sayısı:</span>
              <span className="font-medium">{instruction.readCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Son Okunma:</span>
              <span className="font-medium">
                {instruction.lastReadAt ? formatDate(instruction.lastReadAt) : 'Hiç okunmamış'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Oluşturulma:</span>
              <span className="font-medium">{formatDate(instruction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Güncellenme:</span>
              <span className="font-medium">{formatDate(instruction.updatedAt)}</span>
            </div>
          </div>
        </div>

        {instruction.metadata.summary && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Özet</h3>
            <p className="text-sm text-gray-700">{instruction.metadata.summary}</p>
          </div>
        )}

        {instruction.metadata.keywords.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Anahtar Kelimeler</h3>
            <div className="flex flex-wrap gap-1">
              {instruction.metadata.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderNavigation = () => (
    <div className="flex justify-center space-x-1 bg-white border-t">
      <Button
        variant={currentView === 'overview' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('overview')}
        className="flex-1"
      >
        <Eye className="w-4 h-4 mr-2" />
        Genel
      </Button>
      <Button
        variant={currentView === 'content' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('content')}
        className="flex-1"
      >
        <FileText className="w-4 h-4 mr-2" />
        İçerik
      </Button>
      <Button
        variant={currentView === 'attachments' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('attachments')}
        className="flex-1"
      >
        <Download className="w-4 h-4 mr-2" />
        Ekler
      </Button>
      <Button
        variant={currentView === 'metadata' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('metadata')}
        className="flex-1"
      >
        <Settings className="w-4 h-4 mr-2" />
        Bilgi
      </Button>
    </div>
  );

  const renderControls = () => (
    <div className="flex items-center justify-between p-4 bg-white border-t">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-5 h-5 text-blue-600" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
        </Button>
        {instruction.qrCode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Show QR code */}}
          >
            <QrCode className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {currentView === 'content' && (
          <>
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">{zoomLevel}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={handleFullscreen}>
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      <div className={`${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Header */}
        {!isFullscreen && (
          <div className="flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-medium text-gray-900 truncate">{instruction.title}</h1>
                <p className="text-sm text-gray-500">{instruction.companyName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {deviceType === 'mobile' && <Smartphone className="w-4 h-4 text-gray-400" />}
                {deviceType === 'tablet' && <Tablet className="w-4 h-4 text-gray-400" />}
                {deviceType === 'desktop' && <Monitor className="w-4 h-4 text-gray-400" />}
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`${isFullscreen ? 'flex-1 overflow-auto' : 'h-96 overflow-auto'} p-4`}>
          {currentView === 'overview' && renderOverview()}
          {currentView === 'content' && renderContent()}
          {currentView === 'attachments' && renderAttachments()}
          {currentView === 'metadata' && renderMetadata()}
        </div>

        {/* Navigation */}
        {renderNavigation()}

        {/* Controls */}
        {renderControls()}
      </div>
    </div>
  );
};

export default MobileInstructionViewer;