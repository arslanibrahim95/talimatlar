/**
 * Security utilities for frontend application
 */

import { STORAGE_KEYS } from '../constants';

/**
 * Secure token storage with encryption
 */
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'claude-talimat-secure-key';

  /**
   * Encrypt data before storing
   */
  private static encrypt(data: string): string {
    // Simple XOR encryption (in production, use proper encryption)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
  }

  /**
   * Decrypt data after retrieving
   */
  private static decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch {
      return '';
    }
  }

  /**
   * Store sensitive data securely
   */
  static setItem(key: string, value: string): void {
    try {
      const encrypted = this.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  static getItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove secure data:', error);
    }
  }

  /**
   * Clear all secure data
   */
  static clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key.includes('token') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear secure data:', error);
    }
  }
}

/**
 * XSS protection utilities
 */
export class XSSProtection {
  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .trim();
  }

  /**
   * Validate URL to prevent malicious redirects
   */
  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  private static token: string | null = null;

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return this.token;
  }

  /**
   * Get current CSRF token
   */
  static getToken(): string | null {
    return this.token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    return this.token === token;
  }

  /**
   * Add CSRF token to request headers
   */
  static addTokenToHeaders(headers: Record<string, string>): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  }
}

/**
 * Content Security Policy utilities
 */
export class CSPProtection {
  /**
   * Validate script source
   */
  static validateScriptSource(src: string): boolean {
    // Allow same origin, HTTPS, and trusted CDNs
    const allowedDomains = [
      'localhost',
      'claude-talimat.com',
      'cdn.jsdelivr.net',
      'unpkg.com',
      'cdnjs.cloudflare.com'
    ];

    try {
      const url = new URL(src);
      return allowedDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Validate image source
   */
  static validateImageSource(src: string): boolean {
    // Allow same origin and HTTPS sources
    try {
      const url = new URL(src);
      return url.protocol === 'https:' || url.hostname === 'localhost';
    } catch {
      return false;
    }
  }
}

/**
 * Input validation for security
 */
export class SecurityValidation {
  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): {
    isValid: boolean;
    error?: string;
  } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not allowed'
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds limit'
      };
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.pif$/i,
      /\.com$/i,
      /\.js$/i,
      /\.vbs$/i,
      /\.jar$/i
    ];

    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate form input for malicious content
   */
  static validateFormInput(input: string, maxLength: number = 1000): {
    isValid: boolean;
    error?: string;
  } {
    // Check length
    if (input.length > maxLength) {
      return {
        isValid: false,
        error: 'Input too long'
      };
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\bOR\b|\bAND\b).*(\bOR\b|\bAND\b)/i
    ];

    if (sqlPatterns.some(pattern => pattern.test(input))) {
      return {
        isValid: false,
        error: 'Invalid input detected'
      };
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
    ];

    if (xssPatterns.some(pattern => pattern.test(input))) {
      return {
        isValid: false,
        error: 'Invalid input detected'
      };
    }

    return { isValid: true };
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  /**
   * Check if session is secure
   */
  static isSecureSession(): boolean {
    // Check if running on HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return false;
    }

    // Check if secure cookies are available
    try {
      document.cookie = 'test=1; secure; samesite=strict';
      const isSecure = document.cookie.includes('test=1');
      document.cookie = 'test=1; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return isSecure;
    } catch {
      return false;
    }
  }

  /**
   * Set secure session timeout
   */
  static setSessionTimeout(timeoutMs: number): void {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Clear sensitive data and redirect to login
        SecureStorage.clear();
        window.location.href = '/auth/login';
      }, timeoutMs);
    };

    // Reset timeout on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Initial timeout
    resetTimeout();
  }

  /**
   * Check for session hijacking indicators
   */
  static checkSessionIntegrity(): boolean {
    const currentUserAgent = navigator.userAgent;
    const storedUserAgent = SecureStorage.getItem('user_agent');

    if (!storedUserAgent) {
      SecureStorage.setItem('user_agent', currentUserAgent);
      return true;
    }

    return currentUserAgent === storedUserAgent;
  }
}

/**
 * Initialize security measures
 */
export const initializeSecurity = (): void => {
  // Initialize CSRF protection
  CSRFProtection.generateToken();

  // Set session timeout (30 minutes)
  SessionSecurity.setSessionTimeout(30 * 60 * 1000);

  // Check session integrity
  if (!SessionSecurity.checkSessionIntegrity()) {
    console.warn('Session integrity check failed');
    SecureStorage.clear();
  }

  // Log security warnings in development
  if (import.meta.env.DEV) {
    if (!SessionSecurity.isSecureSession()) {
      console.warn('⚠️ Session is not secure. Use HTTPS in production.');
    }
  }
};

export default {
  SecureStorage,
  XSSProtection,
  CSRFProtection,
  CSPProtection,
  SecurityValidation,
  SessionSecurity,
  initializeSecurity,
};
