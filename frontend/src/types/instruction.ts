// Instruction types and interfaces for the viewing system

export interface Instruction {
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
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  checksum: string;
  mimeType?: string;
  extension?: string;
}

export interface InstructionMetadata {
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
  readingTime?: number; // estimated reading time in minutes
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface ReadingSession {
  instructionId: string;
  userId: string;
  startTime: string;
  lastReadTime: string;
  readingProgress: number; // 0-100
  lastReadPosition: number; // scroll position
  bookmarked: boolean;
  notes: ReadingNote[];
  highlights: Highlight[];
  timeSpent: number; // in seconds
  completed: boolean;
}

export interface ReadingNote {
  id: string;
  content: string;
  position: number; // scroll position where note was added
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  text: string;
  startPosition: number;
  endPosition: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
  note?: string;
  createdAt: string;
}

export interface ViewerSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'system' | 'serif' | 'sans-serif' | 'monospace';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  theme: 'light' | 'dark' | 'sepia' | 'high-contrast';
  autoScroll: boolean;
  autoScrollSpeed: number; // 1-10
  showProgress: boolean;
  showBookmarks: boolean;
  showNotes: boolean;
  showHighlights: boolean;
  enableVoiceOver: boolean;
  enableTextToSpeech: boolean;
  speechRate: number; // 0.5-2.0
  speechPitch: number; // 0.5-2.0
}

export interface ViewerState {
  currentView: 'overview' | 'content' | 'attachments' | 'metadata' | 'notes';
  isFullscreen: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  zoomLevel: number;
  rotation: number;
  showControls: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  readingSession: ReadingSession | null;
  settings: ViewerSettings;
  isLoading: boolean;
  error: string | null;
}

export interface NavigationItem {
  id: string;
  title: string;
  level: number; // heading level (1-6)
  position: number; // scroll position
  children?: NavigationItem[];
}

export interface SearchResult {
  text: string;
  position: number;
  context: string; // surrounding text
  relevance: number; // 0-1
}

export interface AccessibilitySettings {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindSupport: boolean;
}

export interface ShareOptions {
  method: 'link' | 'email' | 'sms' | 'social' | 'qr';
  recipients?: string[];
  message?: string;
  includeAttachments: boolean;
  includeNotes: boolean;
  expirationDate?: string;
  accessLevel: 'view' | 'comment' | 'edit';
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt' | 'html' | 'epub';
  includeAttachments: boolean;
  includeNotes: boolean;
  includeHighlights: boolean;
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: 'narrow' | 'normal' | 'wide';
}

// Event types for the viewer
export interface ViewerEvent {
  type: 'view_start' | 'view_end' | 'page_turn' | 'bookmark_add' | 'bookmark_remove' | 
        'note_add' | 'note_edit' | 'note_delete' | 'highlight_add' | 'highlight_remove' |
        'search' | 'share' | 'export' | 'print' | 'zoom' | 'rotate' | 'fullscreen_toggle';
  timestamp: string;
  data: any;
  userId?: string;
  sessionId?: string;
}

// Analytics data
export interface ViewerAnalytics {
  instructionId: string;
  userId: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalTime: number;
  pagesViewed: number;
  scrollDepth: number;
  interactions: ViewerEvent[];
  completionRate: number;
  bounceRate: boolean;
  deviceInfo: {
    type: string;
    os: string;
    browser: string;
    screenSize: string;
  };
}
