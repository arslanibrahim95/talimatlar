/**
 * Document Metadata Extractor
 * Extracts metadata from various document types for safety documents
 */

export interface ExtractedMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  securityLevel?: string;
  customProperties?: { [key: string]: string };
}

export interface DocumentAnalysis {
  fileType: string;
  fileSize: number;
  checksum: string;
  extractedMetadata: ExtractedMetadata;
  safetyKeywords: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceTags: string[];
  suggestedCategory: string;
  suggestedTags: string[];
  contentPreview?: string;
}

// Safety-related keywords for analysis
const SAFETY_KEYWORDS = {
  critical: [
    'yangın', 'fire', 'patlama', 'explosion', 'elektrik', 'electrical',
    'kimyasal', 'chemical', 'gaz', 'gas', 'basınç', 'pressure',
    'yükseklik', 'height', 'derinlik', 'depth', 'makine', 'machine'
  ],
  high: [
    'güvenlik', 'safety', 'prosedür', 'procedure', 'talimat', 'instruction',
    'acil', 'emergency', 'kaza', 'accident', 'yaralanma', 'injury',
    'koruyucu', 'protective', 'donanım', 'equipment'
  ],
  medium: [
    'eğitim', 'training', 'bilgilendirme', 'information', 'rehber', 'guide',
    'kontrol', 'control', 'denetim', 'inspection', 'bakım', 'maintenance'
  ],
  low: [
    'genel', 'general', 'temel', 'basic', 'standart', 'standard',
    'politika', 'policy', 'yönetmelik', 'regulation'
  ]
};

// Compliance-related tags
const COMPLIANCE_TAGS = [
  'ISO 45001', 'OHSAS 18001', 'ISO 14001', 'ISO 9001',
  'SGK', 'ÇSGB', 'İSG', 'OSHA', 'CE', 'TSE',
  'RoHS', 'REACH', 'GDPR', 'KVKK'
];

// Category suggestions based on content analysis
const CATEGORY_SUGGESTIONS = {
  'yangın': 'fire-safety',
  'fire': 'fire-safety',
  'elektrik': 'electrical-safety',
  'electrical': 'electrical-safety',
  'kimyasal': 'chemical-safety',
  'chemical': 'chemical-safety',
  'acil': 'emergency-procedures',
  'emergency': 'emergency-procedures',
  'makine': 'equipment-safety',
  'machine': 'equipment-safety',
  'eğitim': 'training-materials',
  'training': 'training-materials',
  'kişisel': 'personal-protection',
  'personal': 'personal-protection',
  'uyumluluk': 'compliance',
  'compliance': 'compliance'
};

export class DocumentMetadataExtractor {
  private static instance: DocumentMetadataExtractor;

  public static getInstance(): DocumentMetadataExtractor {
    if (!DocumentMetadataExtractor.instance) {
      DocumentMetadataExtractor.instance = new DocumentMetadataExtractor();
    }
    return DocumentMetadataExtractor.instance;
  }

  /**
   * Extract metadata from a file
   */
  async extractMetadata(file: File): Promise<DocumentAnalysis> {
    const checksum = await this.generateChecksum(file);
    const fileType = file.type;
    const fileSize = file.size;

    let extractedMetadata: ExtractedMetadata = {};
    let contentPreview = '';

    try {
      // Extract based on file type
      switch (fileType) {
        case 'application/pdf':
          extractedMetadata = await this.extractPDFMetadata(file);
          contentPreview = await this.extractPDFContent(file);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedMetadata = await this.extractWordMetadata(file);
          contentPreview = await this.extractWordContent(file);
          break;
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          extractedMetadata = await this.extractExcelMetadata(file);
          contentPreview = await this.extractExcelContent(file);
          break;
        case 'text/plain':
          extractedMetadata = await this.extractTextMetadata(file);
          contentPreview = await this.extractTextContent(file);
          break;
        default:
          extractedMetadata = await this.extractBasicMetadata(file);
      }
    } catch (error) {
      console.warn('Metadata extraction failed:', error);
      extractedMetadata = await this.extractBasicMetadata(file);
    }

    // Analyze content for safety-related information
    const safetyKeywords = this.analyzeSafetyKeywords(contentPreview);
    const riskLevel = this.calculateRiskLevel(safetyKeywords);
    const complianceTags = this.extractComplianceTags(contentPreview);
    const suggestedCategory = this.suggestCategory(contentPreview);
    const suggestedTags = this.suggestTags(contentPreview, extractedMetadata);

    return {
      fileType,
      fileSize,
      checksum,
      extractedMetadata,
      safetyKeywords,
      riskLevel,
      complianceTags,
      suggestedCategory,
      suggestedTags,
      contentPreview: contentPreview.substring(0, 500) // Limit preview length
    };
  }

  /**
   * Generate SHA-256 checksum for file integrity
   */
  private async generateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Extract basic metadata from file properties
   */
  private async extractBasicMetadata(file: File): Promise<ExtractedMetadata> {
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      creationDate: new Date(file.lastModified).toISOString(),
      modificationDate: new Date(file.lastModified).toISOString()
    };
  }

  /**
   * Extract metadata from PDF files
   */
  private async extractPDFMetadata(file: File): Promise<ExtractedMetadata> {
    // In a real implementation, you would use a PDF parsing library
    // For now, we'll return basic metadata
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      creationDate: new Date(file.lastModified).toISOString(),
      modificationDate: new Date(file.lastModified).toISOString(),
      customProperties: {
        'PDF Version': 'Unknown',
        'Producer': 'Unknown'
      }
    };
  }

  /**
   * Extract content from PDF files
   */
  private async extractPDFContent(file: File): Promise<string> {
    // In a real implementation, you would use a PDF parsing library like pdf-parse
    // For now, return empty string
    return '';
  }

  /**
   * Extract metadata from Word documents
   */
  private async extractWordMetadata(file: File): Promise<ExtractedMetadata> {
    // In a real implementation, you would use a Word parsing library
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      creationDate: new Date(file.lastModified).toISOString(),
      modificationDate: new Date(file.lastModified).toISOString()
    };
  }

  /**
   * Extract content from Word documents
   */
  private async extractWordContent(file: File): Promise<string> {
    // In a real implementation, you would use a Word parsing library
    return '';
  }

  /**
   * Extract metadata from Excel files
   */
  private async extractExcelMetadata(file: File): Promise<ExtractedMetadata> {
    // In a real implementation, you would use an Excel parsing library
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      creationDate: new Date(file.lastModified).toISOString(),
      modificationDate: new Date(file.lastModified).toISOString()
    };
  }

  /**
   * Extract content from Excel files
   */
  private async extractExcelContent(file: File): Promise<string> {
    // In a real implementation, you would use an Excel parsing library
    return '';
  }

  /**
   * Extract metadata from text files
   */
  private async extractTextMetadata(file: File): Promise<ExtractedMetadata> {
    const content = await this.extractTextContent(file);
    const lines = content.split('\n');
    
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      creationDate: new Date(file.lastModified).toISOString(),
      modificationDate: new Date(file.lastModified).toISOString(),
      wordCount: content.split(/\s+/).length,
      language: this.detectLanguage(content)
    };
  }

  /**
   * Extract content from text files
   */
  private async extractTextContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Analyze content for safety-related keywords
   */
  private analyzeSafetyKeywords(content: string): string[] {
    const foundKeywords: string[] = [];
    const contentLower = content.toLowerCase();

    Object.entries(SAFETY_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (contentLower.includes(keyword.toLowerCase())) {
          foundKeywords.push(keyword);
        }
      });
    });

    return [...new Set(foundKeywords)]; // Remove duplicates
  }

  /**
   * Calculate risk level based on found keywords
   */
  private calculateRiskLevel(keywords: string[]): 'low' | 'medium' | 'high' | 'critical' {
    let maxLevel = 'low';

    keywords.forEach(keyword => {
      Object.entries(SAFETY_KEYWORDS).forEach(([level, levelKeywords]) => {
        if (levelKeywords.includes(keyword)) {
          const levelOrder = ['low', 'medium', 'high', 'critical'];
          const currentIndex = levelOrder.indexOf(maxLevel);
          const keywordIndex = levelOrder.indexOf(level);
          if (keywordIndex > currentIndex) {
            maxLevel = level as any;
          }
        }
      });
    });

    return maxLevel as any;
  }

  /**
   * Extract compliance tags from content
   */
  private extractComplianceTags(content: string): string[] {
    const foundTags: string[] = [];
    const contentUpper = content.toUpperCase();

    COMPLIANCE_TAGS.forEach(tag => {
      if (contentUpper.includes(tag.toUpperCase())) {
        foundTags.push(tag);
      }
    });

    return foundTags;
  }

  /**
   * Suggest category based on content analysis
   */
  private suggestCategory(content: string): string {
    const contentLower = content.toLowerCase();

    for (const [keyword, category] of Object.entries(CATEGORY_SUGGESTIONS)) {
      if (contentLower.includes(keyword)) {
        return category;
      }
    }

    return 'general-safety'; // Default category
  }

  /**
   * Suggest tags based on content and metadata
   */
  private suggestTags(content: string, metadata: ExtractedMetadata): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();

    // Add keywords as tags
    const keywords = this.analyzeSafetyKeywords(content);
    tags.push(...keywords.slice(0, 5)); // Limit to 5 keywords

    // Add compliance tags
    const complianceTags = this.extractComplianceTags(content);
    tags.push(...complianceTags);

    // Add metadata-based tags
    if (metadata.keywords) {
      tags.push(...metadata.keywords.slice(0, 3));
    }

    // Add file type tag
    if (contentLower.includes('prosedür') || contentLower.includes('procedure')) {
      tags.push('prosedür');
    }
    if (contentLower.includes('talimat') || contentLower.includes('instruction')) {
      tags.push('talimat');
    }
    if (contentLower.includes('eğitim') || contentLower.includes('training')) {
      tags.push('eğitim');
    }

    return [...new Set(tags)].slice(0, 10); // Remove duplicates and limit to 10 tags
  }

  /**
   * Detect language of content
   */
  private detectLanguage(content: string): string {
    // Simple language detection based on common words
    const turkishWords = ['ve', 'bir', 'bu', 'ile', 'için', 'olan', 'güvenlik', 'iş', 'çalışan'];
    const englishWords = ['and', 'the', 'for', 'with', 'safety', 'work', 'employee', 'procedure'];

    const contentLower = content.toLowerCase();
    const turkishCount = turkishWords.filter(word => contentLower.includes(word)).length;
    const englishCount = englishWords.filter(word => contentLower.includes(word)).length;

    return turkishCount > englishCount ? 'tr' : 'en';
  }

  /**
   * Validate document for safety compliance
   */
  validateSafetyCompliance(analysis: DocumentAnalysis): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for required safety elements
    if (analysis.safetyKeywords.length === 0) {
      warnings.push('Dokümanda güvenlik ile ilgili anahtar kelimeler bulunamadı');
    }

    if (!analysis.extractedMetadata.title || analysis.extractedMetadata.title.length < 5) {
      warnings.push('Doküman başlığı çok kısa veya eksik');
    }

    if (analysis.riskLevel === 'critical' && analysis.complianceTags.length === 0) {
      warnings.push('Kritik risk seviyesindeki dokümanda uyumluluk etiketleri bulunamadı');
    }

    // Add suggestions
    if (analysis.suggestedTags.length > 0) {
      suggestions.push(`Önerilen etiketler: ${analysis.suggestedTags.join(', ')}`);
    }

    if (analysis.suggestedCategory !== 'general-safety') {
      suggestions.push(`Önerilen kategori: ${analysis.suggestedCategory}`);
    }

    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      suggestions.push('Yüksek risk seviyesi tespit edildi. Düzenli gözden geçirme önerilir');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }
}

// Export singleton instance
export const documentMetadataExtractor = DocumentMetadataExtractor.getInstance();

