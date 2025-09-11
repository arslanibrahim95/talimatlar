import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Instruction, 
  ViewerState, 
  ViewerSettings, 
  ReadingSession, 
  ReadingNote, 
  Highlight,
  ViewerEvent,
  NavigationItem,
  SearchResult
} from '../types/instruction';

interface UseInstructionViewerProps {
  instruction: Instruction;
  userId?: string;
  onUpdate?: (instruction: Instruction) => void;
  onAnalytics?: (event: ViewerEvent) => void;
}

export const useInstructionViewer = ({
  instruction,
  userId = 'anonymous',
  onUpdate,
  onAnalytics
}: UseInstructionViewerProps) => {
  // State management
  const [viewerState, setViewerState] = useState<ViewerState>({
    currentView: 'overview',
    isFullscreen: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    zoomLevel: 100,
    rotation: 0,
    showControls: true,
    deviceType: 'desktop',
    readingSession: null,
    settings: {
      fontSize: 'medium',
      fontFamily: 'system',
      lineHeight: 'normal',
      theme: 'light',
      autoScroll: false,
      autoScrollSpeed: 5,
      showProgress: true,
      showBookmarks: true,
      showNotes: true,
      showHighlights: true,
      enableVoiceOver: false,
      enableTextToSpeech: false,
      speechRate: 1.0,
      speechPitch: 1.0
    },
    isLoading: false,
    error: null
  });

  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<Date>(new Date());

  // Device detection
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      
      if (width < 768) deviceType = 'mobile';
      else if (width < 1024) deviceType = 'tablet';
      
      setViewerState(prev => ({ ...prev, deviceType }));
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Initialize reading session
  useEffect(() => {
    const initializeSession = () => {
      const session: ReadingSession = {
        instructionId: instruction.id,
        userId,
        startTime: new Date().toISOString(),
        lastReadTime: new Date().toISOString(),
        readingProgress: 0,
        lastReadPosition: 0,
        bookmarked: false,
        notes: [],
        highlights: [],
        timeSpent: 0,
        completed: false
      };

      setViewerState(prev => ({ ...prev, readingSession: session }));
      
      // Track view start event
      trackEvent('view_start', { instructionId: instruction.id });
    };

    initializeSession();
  }, [instruction.id, userId]);

  // Generate navigation from content
  useEffect(() => {
    if (instruction.content && contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const navItems: NavigationItem[] = [];

      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const position = heading.offsetTop;
        
        navItems.push({
          id: `nav-${index}`,
          title: heading.textContent || '',
          level,
          position
        });
      });

      setNavigation(navItems);
    }
  }, [instruction.content]);

  // Auto-scroll functionality
  useEffect(() => {
    if (viewerState.settings.autoScroll && viewerState.currentView === 'content') {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => stopAutoScroll();
  }, [viewerState.settings.autoScroll, viewerState.currentView]);

  // Track reading progress
  const updateReadingProgress = useCallback(() => {
    if (!contentRef.current) return;

    const scrollTop = contentRef.current.scrollTop;
    const scrollHeight = contentRef.current.scrollHeight;
    const clientHeight = contentRef.current.clientHeight;
    
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
    
    setViewerState(prev => {
      if (prev.readingSession) {
        const updatedSession = {
          ...prev.readingSession,
          readingProgress: progress,
          lastReadPosition: scrollTop,
          lastReadTime: new Date().toISOString()
        };
        
        return { ...prev, readingSession: updatedSession };
      }
      return prev;
    });
  }, []);

  // Auto-scroll functions
  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) return;

    const scrollSpeed = viewerState.settings.autoScrollSpeed * 10; // pixels per interval
    const interval = 50; // milliseconds

    autoScrollRef.current = setInterval(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop += scrollSpeed;
        
        // Stop at bottom
        if (contentRef.current.scrollTop >= 
            contentRef.current.scrollHeight - contentRef.current.clientHeight) {
          stopAutoScroll();
        }
      }
    }, interval);
  }, [viewerState.settings.autoScrollSpeed]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  // Event tracking
  const trackEvent = useCallback((type: ViewerEvent['type'], data: any) => {
    const event: ViewerEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
      userId,
      sessionId: viewerState.readingSession?.instructionId
    };

    onAnalytics?.(event);
  }, [userId, viewerState.readingSession?.instructionId, onAnalytics]);

  // Navigation functions
  const navigateToView = useCallback((view: ViewerState['currentView']) => {
    setViewerState(prev => ({ ...prev, currentView: view }));
    trackEvent('page_turn', { from: prev.currentView, to: view });
  }, [trackEvent]);

  const navigateToPosition = useCallback((position: number) => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: position, behavior: 'smooth' });
      trackEvent('page_turn', { position });
    }
  }, [trackEvent]);

  // Bookmark functions
  const toggleBookmark = useCallback(() => {
    setViewerState(prev => {
      if (prev.readingSession) {
        const updatedSession = {
          ...prev.readingSession,
          bookmarked: !prev.readingSession.bookmarked
        };
        
        trackEvent(
          updatedSession.bookmarked ? 'bookmark_add' : 'bookmark_remove',
          { instructionId: instruction.id }
        );
        
        return { ...prev, readingSession: updatedSession };
      }
      return prev;
    });
  }, [instruction.id, trackEvent]);

  // Note functions
  const addNote = useCallback((content: string, position: number) => {
    const note: ReadingNote = {
      id: `note-${Date.now()}`,
      content,
      position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setViewerState(prev => {
      if (prev.readingSession) {
        const updatedSession = {
          ...prev.readingSession,
          notes: [...prev.readingSession.notes, note]
        };
        
        trackEvent('note_add', { noteId: note.id, position });
        return { ...prev, readingSession: updatedSession };
      }
      return prev;
    });
  }, [trackEvent]);

  const updateNote = useCallback((noteId: string, content: string) => {
    setViewerState(prev => {
      if (prev.readingSession) {
        const updatedSession = {
          ...prev.readingSession,
          notes: prev.readingSession.notes.map(note =>
            note.id === noteId 
              ? { ...note, content, updatedAt: new Date().toISOString() }
              : note
          )
        };
        
        trackEvent('note_edit', { noteId, content });
        return { ...prev, readingSession: updatedSession };
      }
      return prev;
    });
  }, [trackEvent]);

  const deleteNote = useCallback((noteId: string) => {
    setViewerState(prev => {
      if (prev.readingSession) {
        const updatedSession = {
          ...prev.readingSession,
          notes: prev.readingSession.notes.filter(note => note.id !== noteId)
        };
        
        trackEvent('note_delete', { noteId });
        return { ...prev, readingSession: updatedSession };
      }
      return prev;
    });
  }, [trackEvent]);

  // Highlight functions
  const addHighlight = useCallback((
    text: string, 
    startPosition: number, 
    endPosition: number, 
    color: Highlight['color'] = 'yellow',
    note?: string
  ) => {
    const highlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text,
      startPosition,
      endPosition,
      color,
      note,
      createdAt: new Date().toISOString()
    };

    setViewerState(prev => {
      if (prev.readingSession) {
        const updatedSession = {
          ...prev.readingSession,
          highlights: [...prev.readingSession.highlights, highlight]
        };
        
        trackEvent('highlight_add', { highlightId: highlight.id, color });
        return { ...prev, readingSession: updatedSession };
      }
      return prev;
    });
  }, [trackEvent]);

  const removeHighlight = useCallback((highlightId: string) => {
    setViewerState(prev => {
      if (prev.readingSession) {
        const updatedSession = {
          ...prev.readingSession,
          highlights: prev.readingSession.highlights.filter(h => h.id !== highlightId)
        };
        
        trackEvent('highlight_remove', { highlightId });
        return { ...prev, readingSession: updatedSession };
      }
      return prev;
    });
  }, [trackEvent]);

  // Search functions
  const searchInContent = useCallback((query: string) => {
    if (!instruction.content || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const content = instruction.content.toLowerCase();
    const searchQuery = query.toLowerCase();
    const results: SearchResult[] = [];
    
    let index = 0;
    while ((index = content.indexOf(searchQuery, index)) !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + searchQuery.length + 50);
      const context = instruction.content.substring(start, end);
      
      results.push({
        text: searchQuery,
        position: index,
        context,
        relevance: 1.0 // Simple relevance for now
      });
      
      index += searchQuery.length;
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);
    trackEvent('search', { query, resultCount: results.length });
  }, [instruction.content, trackEvent]);

  const navigateToSearchResult = useCallback((index: number) => {
    if (searchResults[index]) {
      const result = searchResults[index];
      navigateToPosition(result.position);
      setCurrentSearchIndex(index);
    }
  }, [searchResults, navigateToPosition]);

  // Settings functions
  const updateSettings = useCallback((newSettings: Partial<ViewerSettings>) => {
    setViewerState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  // Media control functions
  const togglePlayPause = useCallback(() => {
    setViewerState(prev => {
      const isPlaying = !prev.isPlaying;
      trackEvent('page_turn', { action: isPlaying ? 'play' : 'pause' });
      return { ...prev, isPlaying };
    });
  }, [trackEvent]);

  const setVolume = useCallback((volume: number) => {
    setViewerState(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleMute = useCallback(() => {
    setViewerState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Zoom and rotation functions
  const setZoomLevel = useCallback((zoom: number) => {
    const clampedZoom = Math.max(50, Math.min(200, zoom));
    setViewerState(prev => ({ ...prev, zoomLevel: clampedZoom }));
    trackEvent('zoom', { level: clampedZoom });
  }, [trackEvent]);

  const rotate = useCallback(() => {
    setViewerState(prev => ({ 
      ...prev, 
      rotation: (prev.rotation + 90) % 360 
    }));
    trackEvent('rotate', { rotation: (viewerState.rotation + 90) % 360 });
  }, [viewerState.rotation, trackEvent]);

  // Fullscreen functions
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await document.documentElement.requestFullscreen();
        setViewerState(prev => ({ ...prev, isFullscreen: true }));
        trackEvent('fullscreen_toggle', { isFullscreen: true });
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setViewerState(prev => ({ ...prev, isFullscreen: false }));
        trackEvent('fullscreen_toggle', { isFullscreen: false });
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback to state-only toggle
      setViewerState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
      trackEvent('fullscreen_toggle', { isFullscreen: !viewerState.isFullscreen, error: true });
    }
  }, [viewerState.isFullscreen, trackEvent]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setViewerState(prev => ({ ...prev, isFullscreen }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Touch/Swipe navigation for mobile
  useEffect(() => {
    if (viewerState.deviceType !== 'mobile') return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 50;
      
      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe right - previous view
          const views = ['overview', 'content', 'attachments', 'metadata', 'notes'];
          const currentIndex = views.indexOf(viewerState.currentView);
          if (currentIndex > 0) {
            navigateToView(views[currentIndex - 1] as any);
            trackEvent('page_turn', { method: 'swipe_right', from: viewerState.currentView, to: views[currentIndex - 1] });
          }
        } else {
          // Swipe left - next view
          const views = ['overview', 'content', 'attachments', 'metadata', 'notes'];
          const currentIndex = views.indexOf(viewerState.currentView);
          if (currentIndex < views.length - 1) {
            navigateToView(views[currentIndex + 1] as any);
            trackEvent('page_turn', { method: 'swipe_left', from: viewerState.currentView, to: views[currentIndex + 1] });
          }
        }
      }
      
      // Vertical swipe
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY < 0) {
          // Swipe up - scroll up
          if (contentRef.current) {
            contentRef.current.scrollBy({ top: -100, behavior: 'smooth' });
            trackEvent('page_turn', { method: 'swipe_up' });
          }
        } else {
          // Swipe down - scroll down
          if (contentRef.current) {
            contentRef.current.scrollBy({ top: 100, behavior: 'smooth' });
            trackEvent('page_turn', { method: 'swipe_down' });
          }
        }
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [viewerState.deviceType, viewerState.currentView, navigateToView, trackEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
      
      // Track view end event
      if (viewerState.readingSession) {
        const endTime = new Date();
        const totalTime = Math.floor((endTime.getTime() - sessionStartTime.current.getTime()) / 1000);
        
        trackEvent('view_end', { 
          totalTime,
          readingProgress: viewerState.readingSession.readingProgress,
          timeSpent: totalTime
        });
      }
    };
  }, [viewerState.readingSession, trackEvent, stopAutoScroll]);

  return {
    // State
    viewerState,
    navigation,
    searchResults,
    currentSearchIndex,
    contentRef,
    
    // Navigation
    navigateToView,
    navigateToPosition,
    
    // Bookmarks
    toggleBookmark,
    
    // Notes
    addNote,
    updateNote,
    deleteNote,
    
    // Highlights
    addHighlight,
    removeHighlight,
    
    // Search
    searchInContent,
    navigateToSearchResult,
    
    // Settings
    updateSettings,
    
    // Media controls
    togglePlayPause,
    setVolume,
    toggleMute,
    
    // View controls
    setZoomLevel,
    rotate,
    toggleFullscreen,
    
    // Progress tracking
    updateReadingProgress,
    
    // Auto-scroll
    startAutoScroll,
    stopAutoScroll
  };
};
