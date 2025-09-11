import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Share2, 
  Download, 
  Bookmark, 
  BookmarkCheck,
  Settings,
  Maximize,
  Minimize,
  Smartphone,
  Tablet,
  Monitor,
  Building2,
  User,
  Calendar,
  Clock,
  Eye,
  QrCode
} from 'lucide-react';

interface InstructionHeaderProps {
  instruction: any;
  viewerState: any;
  onBack: () => void;
  onShare: () => void;
  onDownload: () => void;
  onBookmark: () => void;
  onSettings: () => void;
  onFullscreen: () => void;
  onDeviceChange: (device: 'mobile' | 'tablet' | 'desktop') => void;
  className?: string;
}

const InstructionHeader: React.FC<InstructionHeaderProps> = ({
  instruction,
  viewerState,
  onBack,
  onShare,
  onDownload,
  onBookmark,
  onSettings,
  onFullscreen,
  onDeviceChange,
  className = ''
}) => {
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatReadingTime = (minutes?: number) => {
    if (!minutes) return 'Bilinmiyor';
    if (minutes < 1) return '< 1 dk';
    if (minutes < 60) return `${Math.round(minutes)} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`;
  };

  if (viewerState.isFullscreen) {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm ${className}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                {instruction.title}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBookmark}
            >
              {viewerState.readingSession?.bookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onFullscreen}
            >
              <Minimize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-b ${className}`}>
      {/* Main Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Geri</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">{instruction.companyName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Device Type Selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeviceMenu(!showDeviceMenu)}
              className="flex items-center space-x-1"
            >
              {viewerState.deviceType === 'mobile' && <Smartphone className="w-4 h-4" />}
              {viewerState.deviceType === 'tablet' && <Tablet className="w-4 h-4" />}
              {viewerState.deviceType === 'desktop' && <Monitor className="w-4 h-4" />}
            </Button>
            
            {showDeviceMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10">
                <div className="p-1">
                  <button
                    onClick={() => {
                      onDeviceChange('mobile');
                      setShowDeviceMenu(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-3 text-sm rounded hover:bg-gray-100 min-h-[44px] ${
                      viewerState.deviceType === 'mobile' ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                    aria-label="Mobil görünümü seç"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobil</span>
                  </button>
                  <button
                    onClick={() => {
                      onDeviceChange('tablet');
                      setShowDeviceMenu(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-3 text-sm rounded hover:bg-gray-100 min-h-[44px] ${
                      viewerState.deviceType === 'tablet' ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                    aria-label="Tablet görünümü seç"
                  >
                    <Tablet className="w-4 h-4" />
                    <span>Tablet</span>
                  </button>
                  <button
                    onClick={() => {
                      onDeviceChange('desktop');
                      setShowDeviceMenu(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-3 text-sm rounded hover:bg-gray-100 min-h-[44px] ${
                      viewerState.deviceType === 'desktop' ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                    aria-label="Masaüstü görünümü seç"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Masaüstü</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-48">
                <div className="p-1">
                  <button
                    onClick={() => {
                      onBookmark();
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    {viewerState.readingSession?.bookmarked ? (
                      <BookmarkCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    <span>{viewerState.readingSession?.bookmarked ? 'Yer İminden Çıkar' : 'Yer İmine Ekle'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onShare();
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Paylaş</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onDownload();
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4" />
                    <span>İndir</span>
                  </button>
                  
                  {instruction.qrCode && (
                    <button
                      onClick={() => {
                        // Show QR code
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Kod</span>
                    </button>
                  )}
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={() => {
                      onSettings();
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Ayarlar</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onFullscreen();
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    <Maximize className="w-4 h-4" />
                    <span>Tam Ekran</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instruction Info */}
      <div className="px-4 pb-4">
        <div className="space-y-4">
          {/* Title and Status */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{instruction.title}</h1>
            <p className="text-gray-600 mb-3">{instruction.description}</p>
            
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(instruction.priority)}>
                {instruction.priority.toUpperCase()}
              </Badge>
              <Badge className={getStatusColor(instruction.status)}>
                {instruction.status.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                v{instruction.version}
              </Badge>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Yazar</div>
                <div className="font-medium">{instruction.author}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Geçerlilik</div>
                <div className="font-medium">{formatDate(instruction.effectiveDate)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Okuma Süresi</div>
                <div className="font-medium">
                  {formatReadingTime(instruction.metadata.readingTime)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Okunma</div>
                <div className="font-medium">{instruction.readCount} kez</div>
              </div>
            </div>
          </div>

          {/* Reading Progress */}
          {viewerState.settings.showProgress && viewerState.readingSession && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Okuma İlerlemesi</span>
                <span className="text-sm text-gray-500">
                  {Math.round(viewerState.readingSession.readingProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${viewerState.readingSession.readingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructionHeader;
