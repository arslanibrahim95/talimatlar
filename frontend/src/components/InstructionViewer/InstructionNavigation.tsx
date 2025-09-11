import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Eye, 
  FileText, 
  Download, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  Image,
  Video,
  Volume2,
  FileSpreadsheet,
  Presentation,
  Archive,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface InstructionNavigationProps {
  instruction: any;
  viewerState: any;
  navigation: any[];
  searchResults: any[];
  currentSearchIndex: number;
  onNavigateToView: (view: string) => void;
  onNavigateToPosition: (position: number) => void;
  onNavigateToSearchResult: (index: number) => void;
  className?: string;
}

const InstructionNavigation: React.FC<InstructionNavigationProps> = ({
  instruction,
  viewerState,
  navigation,
  searchResults,
  currentSearchIndex,
  onNavigateToView,
  onNavigateToPosition,
  onNavigateToSearchResult,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const views = [
    { id: 'overview', label: 'Genel', icon: Eye, description: 'Talimat özeti ve bilgileri' },
    { id: 'content', label: 'İçerik', icon: FileText, description: 'Talimat içeriği' },
    { id: 'attachments', label: 'Ekler', icon: Download, description: 'Dosya ekleri' },
    { id: 'metadata', label: 'Bilgi', icon: Settings, description: 'Detaylı bilgiler' },
    { id: 'notes', label: 'Notlar', icon: BookOpen, description: 'Kişisel notlar' }
  ];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Volume2;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    if (type.includes('presentation') || type.includes('powerpoint')) return Presentation;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Key Information */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Kategori</div>
          <div className="font-medium">{instruction.category}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Hedef Kitle</div>
          <div className="font-medium">{instruction.targetAudience.join(', ')}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Departmanlar</div>
          <div className="font-medium">{instruction.departments.join(', ')}</div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Etiketler</div>
        <div className="flex flex-wrap gap-1">
          {instruction.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Compliance */}
      {instruction.metadata.compliance.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Uyumluluk</div>
          <div className="flex flex-wrap gap-1">
            {instruction.metadata.compliance.map((compliance: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {compliance}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {instruction.metadata.summary && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Özet</div>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {instruction.metadata.summary}
          </div>
        </div>
      )}
    </div>
  );

  const renderAttachments = () => (
    <div className="space-y-3">
      {instruction.attachments.map((attachment: any) => {
        const IconComponent = getFileIcon(attachment.type);
        return (
          <div key={attachment.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IconComponent className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{attachment.name}</div>
                <div className="text-sm text-gray-500">
                  {formatFileSize(attachment.size)} • {attachment.type}
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMetadata = () => (
    <div className="space-y-4">
      {/* File Information */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Dosya Bilgileri</div>
        <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
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

      {/* Security Information */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Güvenlik Bilgileri</div>
        <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Güvenlik Seviyesi:</span>
            <Badge variant="outline">{instruction.metadata.securityLevel}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Risk Seviyesi:</span>
            <Badge variant="outline">{instruction.metadata.riskLevel}</Badge>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">İstatistikler</div>
        <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Okunma Sayısı:</span>
            <span className="font-medium">{instruction.readCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Son Okunma:</span>
            <span className="font-medium">
              {instruction.lastReadAt 
                ? new Date(instruction.lastReadAt).toLocaleDateString('tr-TR')
                : 'Hiç okunmamış'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Oluşturulma:</span>
            <span className="font-medium">
              {new Date(instruction.createdAt).toLocaleDateString('tr-TR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Güncellenme:</span>
            <span className="font-medium">
              {new Date(instruction.updatedAt).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {instruction.metadata.keywords.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Anahtar Kelimeler</div>
          <div className="flex flex-wrap gap-1">
            {instruction.metadata.keywords.map((keyword: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-3">
      {viewerState.readingSession?.notes.length > 0 ? (
        viewerState.readingSession.notes
          .sort((a: any, b: any) => sortOrder === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map((note: any) => (
            <div key={note.id} className="border rounded-lg p-3 bg-yellow-50">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-gray-600">
                  {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                </div>
                <Button size="sm" variant="ghost">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm">{note.content}</div>
            </div>
          ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <div className="text-sm">Henüz not eklenmemiş</div>
          <div className="text-xs text-gray-400 mt-1">
            Metni seçip not ekleyebilirsiniz
          </div>
        </div>
      )}
    </div>
  );

  const renderNavigation = () => (
    <div className="space-y-2">
      {navigation.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigateToPosition(item.position)}
          className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
          style={{ paddingLeft: `${item.level * 12 + 8}px` }}
        >
          <div className="text-sm font-medium truncate">{item.title}</div>
        </button>
      ))}
    </div>
  );

  const renderSearchResults = () => (
    <div className="space-y-2">
      {searchResults.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">
              {searchResults.length} sonuç bulundu
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigateToSearchResult(Math.max(0, currentSearchIndex - 1))}
                disabled={currentSearchIndex === 0}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
              <span className="text-xs text-gray-500 px-2 py-1">
                {currentSearchIndex + 1} / {searchResults.length}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigateToSearchResult(Math.min(searchResults.length - 1, currentSearchIndex + 1))}
                disabled={currentSearchIndex === searchResults.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => onNavigateToSearchResult(index)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                index === currentSearchIndex 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {result.context.substring(0, 100)}...
              </div>
              <div className="text-xs text-gray-500">
                Pozisyon: {result.position}
              </div>
            </button>
          ))}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <div className="text-sm">Arama sonucu bulunamadı</div>
          <div className="text-xs text-gray-400 mt-1">
            Farklı anahtar kelimeler deneyin
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white border-l ${className}`}>
      {/* View Tabs */}
      <div className="border-b">
        <div className="flex overflow-x-auto">
          {views.map((view) => {
            const IconComponent = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => onNavigateToView(view.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  viewerState.currentView === view.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-full overflow-y-auto">
        {viewerState.currentView === 'overview' && renderOverview()}
        {viewerState.currentView === 'attachments' && renderAttachments()}
        {viewerState.currentView === 'metadata' && renderMetadata()}
        {viewerState.currentView === 'notes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-700">Notlar</div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {renderNotes()}
          </div>
        )}
        
        {/* Navigation and Search Results */}
        {(viewerState.currentView === 'content' || viewerState.currentView === 'overview') && (
          <div className="space-y-6">
            {/* Navigation */}
            {navigation.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700">İçindekiler</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSection('navigation')}
                  >
                    {expandedSections.has('navigation') ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </Button>
                </div>
                {expandedSections.has('navigation') && renderNavigation()}
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700">Arama Sonuçları</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSection('search')}
                  >
                    {expandedSections.has('search') ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </Button>
                </div>
                {expandedSections.has('search') && renderSearchResults()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructionNavigation;
