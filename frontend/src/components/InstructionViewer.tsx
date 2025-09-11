import React, { useState } from 'react';
import { useInstructionViewer } from '../hooks/useInstructionViewer';
import InstructionHeader from './InstructionViewer/InstructionHeader';
import InstructionContent from './InstructionViewer/InstructionContent';
import InstructionNavigation from './InstructionViewer/InstructionNavigation';
import { Instruction } from '../types/instruction';

interface InstructionViewerProps {
  instruction: Instruction;
  onUpdate?: (instruction: Instruction) => void;
  onDelete?: (id: string) => void;
  onDownload?: (attachment: any) => void;
  onShare?: (instruction: Instruction) => void;
  onBookmark?: (id: string, bookmarked: boolean) => void;
  className?: string;
}

const InstructionViewer: React.FC<InstructionViewerProps> = ({
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
    toggleBookmark: handleToggleBookmark,
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

  const handleBookmark = () => {
    handleToggleBookmark();
    onBookmark?.(instruction.id, !viewerState.readingSession?.bookmarked);
  };

  const handleShare = () => {
    onShare?.(instruction);
  };

  const handleDownload = () => {
    if (instruction.attachments.length > 0) {
      onDownload?.(instruction.attachments[0]);
    }
  };

  const handleDeviceChange = (device: 'mobile' | 'tablet' | 'desktop') => {
    // Device change logic can be added here
    console.log('Device changed to:', device);
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleBack = () => {
    // Handle back navigation
    window.history.back();
  };

  const handleZoomIn = () => {
    setZoomLevel(viewerState.zoomLevel + 25);
  };

  const handleZoomOut = () => {
    setZoomLevel(viewerState.zoomLevel - 25);
  };

  const handleRotate = () => {
    rotate();
  };

  const handlePlayPause = () => {
    togglePlayPause();
  };

  const handleVolumeChange = (volume: number) => {
    setVolume(volume);
  };

  const handleMute = () => {
    toggleMute();
  };

  const handleSearch = (query: string) => {
    searchInContent(query);
  };

  const handleAddNote = (content: string, position: number) => {
    addNote(content, position);
  };

  const handleAddHighlight = (text: string, start: number, end: number, color: string) => {
    addHighlight(text, start, end, color as any);
  };

  return (
    <div className={`${viewerState.isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      <div className={`${viewerState.isFullscreen ? 'h-full flex flex-col' : 'h-screen flex flex-col'}`}>
        {/* Header */}
        <InstructionHeader
          instruction={instruction}
          viewerState={viewerState}
          onBack={handleBack}
          onShare={handleShare}
          onDownload={handleDownload}
          onBookmark={handleBookmark}
          onSettings={handleSettings}
          onFullscreen={toggleFullscreen}
          onDeviceChange={handleDeviceChange}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Content */}
          <div className="flex-1 flex flex-col">
            <InstructionContent
              instruction={instruction}
              viewerState={viewerState}
              contentRef={contentRef}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onRotate={handleRotate}
              onPlayPause={handlePlayPause}
              onVolumeChange={handleVolumeChange}
              onMute={handleMute}
              onSearch={handleSearch}
              onAddNote={handleAddNote}
              onAddHighlight={handleAddHighlight}
              onUpdateReadingProgress={updateReadingProgress}
            />
          </div>

          {/* Navigation Sidebar */}
          {!viewerState.isFullscreen && (
            <div className="w-80 border-l bg-white">
              <InstructionNavigation
                instruction={instruction}
                viewerState={viewerState}
                navigation={navigation}
                searchResults={searchResults}
                currentSearchIndex={currentSearchIndex}
                onNavigateToView={navigateToView}
                onNavigateToPosition={navigateToPosition}
                onNavigateToSearchResult={navigateToSearchResult}
              />
            </div>
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Görüntüleme Ayarları</h3>
              
              <div className="space-y-4">
                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yazı Boyutu
                  </label>
                  <div className="flex space-x-2">
                    {['small', 'medium', 'large', 'xlarge'].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateSettings({ fontSize: size as any })}
                        className={`px-3 py-2 text-sm rounded border min-h-[44px] ${
                          viewerState.settings.fontSize === size
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-label={`${size === 'small' ? 'Küçük' :
                         size === 'medium' ? 'Orta' :
                         size === 'large' ? 'Büyük' : 'Çok Büyük'} yazı boyutu`}
                        aria-pressed={viewerState.settings.fontSize === size}
                      >
                        {size === 'small' ? 'Küçük' :
                         size === 'medium' ? 'Orta' :
                         size === 'large' ? 'Büyük' : 'Çok Büyük'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yazı Tipi
                  </label>
                  <select
                    value={viewerState.settings.fontFamily}
                    onChange={(e) => updateSettings({ fontFamily: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="system">Sistem</option>
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>

                {/* Line Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satır Aralığı
                  </label>
                  <div className="flex space-x-2">
                    {['tight', 'normal', 'relaxed'].map((height) => (
                      <button
                        key={height}
                        onClick={() => updateSettings({ lineHeight: height as any })}
                        className={`px-3 py-2 text-sm rounded border ${
                          viewerState.settings.lineHeight === height
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {height === 'tight' ? 'Sıkı' :
                         height === 'normal' ? 'Normal' : 'Gevşek'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema
                  </label>
                  <div className="flex space-x-2">
                    {['light', 'dark', 'sepia', 'high-contrast'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateSettings({ theme: theme as any })}
                        className={`px-3 py-2 text-sm rounded border ${
                          viewerState.settings.theme === theme
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {theme === 'light' ? 'Açık' :
                         theme === 'dark' ? 'Koyu' :
                         theme === 'sepia' ? 'Sepia' : 'Yüksek Kontrast'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Scroll */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Otomatik Kaydırma
                  </label>
                  <button
                    onClick={() => updateSettings({ autoScroll: !viewerState.settings.autoScroll })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      viewerState.settings.autoScroll ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        viewerState.settings.autoScroll ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Progress */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    İlerleme Göster
                  </label>
                  <button
                    onClick={() => updateSettings({ showProgress: !viewerState.settings.showProgress })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      viewerState.settings.showProgress ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        viewerState.settings.showProgress ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Highlights */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Vurguları Göster
                  </label>
                  <button
                    onClick={() => updateSettings({ showHighlights: !viewerState.settings.showHighlights })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      viewerState.settings.showHighlights ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        viewerState.settings.showHighlights ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Notes */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Notları Göster
                  </label>
                  <button
                    onClick={() => updateSettings({ showNotes: !viewerState.settings.showNotes })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      viewerState.settings.showNotes ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        viewerState.settings.showNotes ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructionViewer;