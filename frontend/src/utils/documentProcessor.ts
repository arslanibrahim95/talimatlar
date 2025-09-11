// Document processing utilities for different file formats
export interface ProcessedDocument {
  id: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  extractedText: string;
  summary: string;
  keywords: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  compliance: string[];
  pageCount?: number;
  wordCount: number;
  language: string;
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface DocumentMetadata {
  fileType: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  createdAt: string;
  modifiedAt: string;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface ProcessingOptions {
  extractText: boolean;
  generateSummary: boolean;
  detectLanguage: boolean;
  assessRisk: boolean;
  extractMetadata: boolean;
  generateKeywords: boolean;
  checkCompliance: boolean;
}

export class DocumentProcessor {
  private static instance: DocumentProcessor;
  private processingQueue: Map<string, Promise<ProcessedDocument>> = new Map();

  public static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  // Security keywords for risk assessment
  private securityKeywords = {
    critical: [
      'yangın', 'patlama', 'elektrik', 'kimyasal', 'gaz', 'basınç', 
      'yükseklik', 'derinlik', 'makine', 'tehlikeli', 'zehirli', 
      'radyoaktif', 'patlayıcı', 'yanıcı', 'aşındırıcı'
    ],
    high: [
      'güvenlik', 'prosedür', 'talimat', 'acil', 'kaza', 'yaralanma', 
      'koruyucu', 'donanım', 'emniyet', 'risk', 'tehlike', 'önlem'
    ],
    medium: [
      'eğitim', 'bilgilendirme', 'rehber', 'kontrol', 'denetim', 
      'bakım', 'işlem', 'süreç', 'standart', 'kalite'
    ],
    low: [
      'genel', 'temel', 'standart', 'politika', 'yönetmelik', 
      'bilgi', 'açıklama', 'tanım', 'kavram'
    ]
  };

  // Compliance standards
  private complianceStandards = [
    'ISO 45001', 'OHSAS 18001', 'ISO 14001', 'ISO 9001', 
    'SGK', 'ÇSGB', 'İSG', 'OSHA', 'CE', 'TSE', 'RoHS', 
    'REACH', 'GDPR', 'KVKK', 'ISO 27001', 'ISO 22000'
  ];

  // Language detection patterns
  private languagePatterns = {
    tr: ['ve', 'bir', 'bu', 'ile', 'için', 'olan', 'gibi', 'daha', 'çok', 'en'],
    en: ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had'],
    de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
    fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir']
  };

  /**
   * Process a document file and extract all relevant information
   */
  public async processDocument(
    file: File, 
    options: Partial<ProcessingOptions> = {}
  ): Promise<ProcessedDocument> {
    const fileId = this.generateFileId(file);
    
    // Check if already processing
    if (this.processingQueue.has(fileId)) {
      return this.processingQueue.get(fileId)!;
    }

    const processingPromise = this.performProcessing(file, options);
    this.processingQueue.set(fileId, processingPromise);

    try {
      const result = await processingPromise;
      return result;
    } finally {
      this.processingQueue.delete(fileId);
    }
  }

  /**
   * Process multiple documents in parallel
   */
  public async processDocuments(
    files: File[], 
    options: Partial<ProcessingOptions> = {}
  ): Promise<ProcessedDocument[]> {
    const promises = files.map(file => this.processDocument(file, options));
    return Promise.all(promises);
  }

  /**
   * Extract text content from different file types
   */
  private async extractTextContent(file: File): Promise<string> {
    const fileType = this.getFileType(file.name);
    
    switch (fileType) {
      case 'pdf':
        return this.extractFromPDF(file);
      case 'docx':
        return this.extractFromDocx(file);
      case 'doc':
        return this.extractFromDoc(file);
      case 'txt':
        return this.extractFromText(file);
      case 'rtf':
        return this.extractFromRTF(file);
      case 'xlsx':
        return this.extractFromExcel(file);
      case 'pptx':
        return this.extractFromPowerPoint(file);
      case 'image':
        return this.extractFromImage(file);
      default:
        return `Dosya içeriği: ${file.name}`;
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractFromPDF(file: File): Promise<string> {
    try {
      // In a real implementation, you would use PDF.js or similar library
      // For now, return a mock extraction
      return `PDF içeriği: ${file.name}\n\nBu bir PDF dosyasından çıkarılan metin içeriğidir. Gerçek uygulamada PDF.js kütüphanesi kullanılarak metin çıkarımı yapılacaktır.`;
    } catch (error) {
      console.error('PDF extraction error:', error);
      return `PDF dosyası işlenirken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Extract text from DOCX files
   */
  private async extractFromDocx(file: File): Promise<string> {
    try {
      // In a real implementation, you would use mammoth.js or similar library
      return `DOCX içeriği: ${file.name}\n\nBu bir Word belgesinden çıkarılan metin içeriğidir. Gerçek uygulamada mammoth.js kütüphanesi kullanılarak metin çıkarımı yapılacaktır.`;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return `DOCX dosyası işlenirken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Extract text from DOC files
   */
  private async extractFromDoc(file: File): Promise<string> {
    try {
      // DOC files require special handling
      return `DOC içeriği: ${file.name}\n\nBu bir eski Word belgesinden çıkarılan metin içeriğidir.`;
    } catch (error) {
      console.error('DOC extraction error:', error);
      return `DOC dosyası işlenirken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractFromText(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      console.error('Text extraction error:', error);
      return `Metin dosyası okunurken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Extract text from RTF files
   */
  private async extractFromRTF(file: File): Promise<string> {
    try {
      // RTF files require special parsing
      return `RTF içeriği: ${file.name}\n\nBu bir RTF belgesinden çıkarılan metin içeriğidir.`;
    } catch (error) {
      console.error('RTF extraction error:', error);
      return `RTF dosyası işlenirken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Extract text from Excel files
   */
  private async extractFromExcel(file: File): Promise<string> {
    try {
      // In a real implementation, you would use xlsx or similar library
      return `Excel içeriği: ${file.name}\n\nBu bir Excel dosyasından çıkarılan metin içeriğidir.`;
    } catch (error) {
      console.error('Excel extraction error:', error);
      return `Excel dosyası işlenirken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Extract text from PowerPoint files
   */
  private async extractFromPowerPoint(file: File): Promise<string> {
    try {
      // In a real implementation, you would use pptx-parser or similar library
      return `PowerPoint içeriği: ${file.name}\n\nBu bir PowerPoint sunumundan çıkarılan metin içeriğidir.`;
    } catch (error) {
      console.error('PowerPoint extraction error:', error);
      return `PowerPoint dosyası işlenirken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Extract text from images using OCR
   */
  private async extractFromImage(file: File): Promise<string> {
    try {
      // In a real implementation, you would use Tesseract.js or similar OCR library
      return `Resim içeriği: ${file.name}\n\nBu bir resim dosyasından OCR ile çıkarılan metin içeriğidir.`;
    } catch (error) {
      console.error('Image OCR error:', error);
      return `Resim dosyası işlenirken hata oluştu: ${file.name}`;
    }
  }

  /**
   * Generate document summary
   */
  private generateSummary(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Simple extractive summarization
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 2) {
      return content.substring(0, maxLength) + '...';
    }

    // Take first and last sentences
    const firstSentence = sentences[0].trim();
    const lastSentence = sentences[sentences.length - 1].trim();
    
    let summary = firstSentence;
    if (summary.length + lastSentence.length + 3 <= maxLength) {
      summary += '... ' + lastSentence;
    }

    return summary.length > maxLength ? summary.substring(0, maxLength) + '...' : summary;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string, maxKeywords: number = 10): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Assess risk level based on content
   */
  private assessRiskLevel(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const contentLower = content.toLowerCase();
    
    for (const [level, keywords] of Object.entries(this.securityKeywords)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return level as 'low' | 'medium' | 'high' | 'critical';
      }
    }
    
    return 'low';
  }

  /**
   * Check compliance standards
   */
  private checkCompliance(content: string): string[] {
    const contentUpper = content.toUpperCase();
    return this.complianceStandards.filter(standard => 
      contentUpper.includes(standard.toUpperCase())
    );
  }

  /**
   * Detect document language
   */
  private detectLanguage(content: string): string {
    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\s+/);
    
    let maxScore = 0;
    let detectedLanguage = 'tr';
    
    for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
      const score = patterns.reduce((acc, pattern) => {
        return acc + words.filter(word => word.includes(pattern)).length;
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    }
    
    return detectedLanguage;
  }

  /**
   * Extract document metadata
   */
  private async extractMetadata(file: File): Promise<DocumentMetadata> {
    const checksum = await this.calculateChecksum(file);
    
    return {
      fileType: this.getFileType(file.name),
      fileSize: file.size,
      mimeType: file.type,
      checksum,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date(file.lastModified).toISOString(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      author: 'Unknown',
      subject: '',
      keywords: [],
      creator: 'Document Processor',
      producer: 'Talimatlar System'
    };
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || '';
    
    const typeMap: { [key: string]: string } = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'txt': 'txt',
      'rtf': 'rtf',
      'xlsx': 'xlsx',
      'xls': 'xlsx',
      'pptx': 'pptx',
      'ppt': 'pptx',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      'webp': 'image'
    };
    
    return typeMap[extension] || 'unknown';
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }

  /**
   * Main processing function
   */
  private async performProcessing(
    file: File, 
    options: Partial<ProcessingOptions>
  ): Promise<ProcessedDocument> {
    const defaultOptions: ProcessingOptions = {
      extractText: true,
      generateSummary: true,
      detectLanguage: true,
      assessRisk: true,
      extractMetadata: true,
      generateKeywords: true,
      checkCompliance: true
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    // Extract text content
    const extractedText = finalOptions.extractText 
      ? await this.extractTextContent(file)
      : '';

    // Extract metadata
    const metadata = finalOptions.extractMetadata
      ? await this.extractMetadata(file)
      : {} as DocumentMetadata;

    // Generate summary
    const summary = finalOptions.generateSummary
      ? this.generateSummary(extractedText)
      : '';

    // Extract keywords
    const keywords = finalOptions.generateKeywords
      ? this.extractKeywords(extractedText)
      : [];

    // Assess risk level
    const riskLevel = finalOptions.assessRisk
      ? this.assessRiskLevel(extractedText)
      : 'low';

    // Check compliance
    const compliance = finalOptions.checkCompliance
      ? this.checkCompliance(extractedText)
      : [];

    // Detect language
    const language = finalOptions.detectLanguage
      ? this.detectLanguage(extractedText)
      : 'tr';

    // Calculate word count
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

    // Determine security level based on content
    const securityLevel = this.determineSecurityLevel(extractedText, riskLevel);

    return {
      id: this.generateFileId(file),
      title: file.name.replace(/\.[^/.]+$/, ''),
      content: extractedText,
      metadata,
      extractedText,
      summary,
      keywords,
      riskLevel,
      compliance,
      wordCount,
      language,
      securityLevel
    };
  }

  /**
   * Determine security level based on content and risk
   */
  private determineSecurityLevel(
    content: string, 
    riskLevel: string
  ): 'public' | 'internal' | 'confidential' | 'restricted' {
    const contentLower = content.toLowerCase();
    
    // Check for restricted keywords
    const restrictedKeywords = ['gizli', 'confidential', 'restricted', 'top secret'];
    if (restrictedKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'restricted';
    }
    
    // Check for confidential keywords
    const confidentialKeywords = ['iç', 'internal', 'özel', 'private'];
    if (confidentialKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'confidential';
    }
    
    // Check for internal keywords
    const internalKeywords = ['şirket', 'company', 'kurum', 'organization'];
    if (internalKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'internal';
    }
    
    // Default based on risk level
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return 'internal';
      case 'medium':
        return 'internal';
      default:
        return 'public';
    }
  }
}

// Export singleton instance
export const documentProcessor = DocumentProcessor.getInstance();

// Export utility functions
export const processDocument = (file: File, options?: Partial<ProcessingOptions>) => 
  documentProcessor.processDocument(file, options);

export const processDocuments = (files: File[], options?: Partial<ProcessingOptions>) => 
  documentProcessor.processDocuments(files, options);
