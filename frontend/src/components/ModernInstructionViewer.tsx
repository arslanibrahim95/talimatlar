import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';

import { Progress } from './ui/Progress';

interface InstructionHeader {
  companyLogo?: string;
  companyName: string;
  title: string;
  subtitle?: string;
  author: string;
  publishDate: string;
  readTime: number; // in minutes
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  version: string;
}

interface InstructionSection {
  id: string;
  title: string;
  content: string;
  level: number; // heading level
}

interface ModernInstructionViewerProps {
  header: InstructionHeader;
  content: string;
  onProgressUpdate?: (progress: number) => void;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

const ModernInstructionViewer: React.FC<ModernInstructionViewerProps> = ({
  header,
  content,
  onProgressUpdate,
  onSectionClick,
  className = ''
}) => {
  const [currentSection, setCurrentSection] = useState<string>('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [lineHeight, setLineHeight] = useState<'tight' | 'normal' | 'relaxed'>('normal');
  const [showTableOfContents, setShowTableOfContents] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Parse content into sections
  const sections: InstructionSection[] = React.useMemo(() => {
    const lines = content.split('\n');
    const sections: InstructionSection[] = [];
    let currentSection: InstructionSection | null = null;
    let sectionContent: string[] = [];

    lines.forEach((line) => {
      // Detect headers (# ## ###)
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentSection && sectionContent.length > 0) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
        }
        
        // Start new section
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const id = `section-${sections.length + 1}`;
        
        currentSection = {
          id,
          title,
          content: '',
          level
        };
        
        sectionContent = [];
      } else {
        if (currentSection) {
          sectionContent.push(line);
        }
      }
    });

    // Add last section
    if (currentSection) {
      currentSection.content = sectionContent.join('\n');
      sections.push(currentSection);
    }

    return sections;
  }, [content]);

  // Format content with markdown-like syntax
  const formatContent = (text: string): string => {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-10 mb-6 text-gray-900 dark:text-white">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300">$1</li>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm text-gray-800 dark:text-gray-200">$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
      setReadingProgress(progress);
      
      if (onProgressUpdate) {
        onProgressUpdate(progress);
      }

      // Update current section based on scroll position
      let currentSectionId = '';
      sections.forEach(section => {
        const sectionElement = sectionsRef.current.get(section.id);
        if (sectionElement) {
          const rect = sectionElement.getBoundingClientRect();
          if (rect.top <= 100) {
            currentSectionId = section.id;
          }
        }
      });
      
      if (currentSectionId !== currentSection) {
        setCurrentSection(currentSectionId);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [currentSection, onProgressUpdate, sections]);

  const getFontSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'text-sm';
      case 'medium': return 'text-base';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getLineHeightClass = (height: string) => {
    switch (height) {
      case 'tight': return 'leading-tight';
      case 'normal': return 'leading-normal';
      case 'relaxed': return 'leading-relaxed';
      default: return 'leading-normal';
    }
  };

  const handleSectionClick = (sectionId: string) => {
    const sectionElement = sectionsRef.current.get(sectionId);
    if (sectionElement && contentRef.current) {
      contentRef.current.scrollTo({
        top: sectionElement.offsetTop - 100,
        behavior: 'smooth'
      });
    }
    
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      contentRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Table of Contents Sidebar */}
      {showTableOfContents && (
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">İçindekiler</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTableOfContents(false)}
                className="lg:hidden"
              >
                ✕
              </Button>
            </div>
            
            {/* Reading Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Okuma İlerlemesi</span>
                <span>{Math.round(readingProgress)}%</span>
              </div>
              <Progress value={readingProgress} className="h-2" />
            </div>
          </div>

          {/* Sections Navigation */}
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentSection === section.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
                style={{ paddingLeft: `${(section.level - 1) * 16 + 12}px` }}
              >
                <div className="font-medium text-sm">{section.title}</div>
                {section.level === 1 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ana Bölüm
                  </div>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Company Info */}
            <div className="flex items-center space-x-4 mb-6">
              {header.companyLogo && (
                <img
                  src={header.companyLogo}
                  alt={header.companyName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {header.companyName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Talimat Dokümanı
                </p>
              </div>
            </div>

            {/* Title and Meta */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {header.title}
                </h1>
                {header.subtitle && (
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    {header.subtitle}
                  </p>
                )}
              </div>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>{header.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>{new Date(header.publishDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⏱️</span>
                  <span>{header.readTime} dk okuma</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🏷️</span>
                  <span>{header.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>v{header.version}</span>
                </div>
              </div>

              {/* Tags */}
              {header.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {header.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Priority Badge */}
              <div className="inline-flex">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  header.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  header.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  header.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {header.priority === 'critical' ? '🚨 Kritik' :
                   header.priority === 'high' ? '⚠️ Yüksek' :
                   header.priority === 'medium' ? '⚡ Orta' :
                   '✅ Düşük'} Öncelik
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Controls */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Font:
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="small">Küçük</option>
                  <option value="medium">Orta</option>
                  <option value="large">Büyük</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Satır:
                </label>
                <select
                  value={lineHeight}
                  onChange={(e) => setLineHeight(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="tight">Sıkı</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Rahat</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className="lg:hidden"
              >
                {showTableOfContents ? '📖' : '📋'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? '⤓' : '⤢'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto bg-white dark:bg-gray-900"
        >
          <div className="max-w-4xl mx-auto p-6">
            <div 
              className={`prose prose-gray dark:prose-invert max-w-none ${getFontSizeClass(fontSize)} ${getLineHeightClass(lineHeight)}`}
            >
              {/* Render sections with refs for navigation */}
              {sections.map((section) => (
                <div
                  key={section.id}
                  ref={(el) => {
                    if (el) sectionsRef.current.set(section.id, el);
                  }}
                  className="mb-8"
                >
                  <div dangerouslySetInnerHTML={{ __html: formatContent(section.content) }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernInstructionViewer;
