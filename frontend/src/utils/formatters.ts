// Consolidated formatting utility functions
// This file consolidates all duplicate formatting functions across the frontend

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date string to Turkish locale
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
}

/**
 * Format date and time string to Turkish locale
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Get priority color class for UI components
 * @param priority - Priority level string
 * @returns CSS class string for priority styling
 */
export function getPriorityColor(priority: string): string {
  const priorityMap: Record<string, string> = {
    'high': 'bg-red-100 text-red-800 border-red-200',
    'yüksek': 'bg-red-100 text-red-800 border-red-200',
    'critical': 'bg-red-200 text-red-900 border-red-300',
    'kritik': 'bg-red-200 text-red-900 border-red-300',
    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'orta': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'normal': 'bg-blue-100 text-blue-800 border-blue-200',
    'normal': 'bg-blue-100 text-blue-800 border-blue-200',
    'low': 'bg-green-100 text-green-800 border-green-200',
    'düşük': 'bg-green-100 text-green-800 border-green-200'
  };
  
  return priorityMap[priority.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get status color class for UI components
 * @param status - Status string
 * @returns CSS class string for status styling
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'aktif': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'pasif': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'beklemede': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'onaylandı': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'reddedildi': 'bg-red-100 text-red-800',
    'draft': 'bg-gray-100 text-gray-800',
    'taslak': 'bg-gray-100 text-gray-800',
    'published': 'bg-blue-100 text-blue-800',
    'yayınlandı': 'bg-blue-100 text-blue-800',
    'archived': 'bg-gray-100 text-gray-600',
    'arşivlendi': 'bg-gray-100 text-gray-600'
  };
  
  return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

/**
 * Get security level color class for UI components
 * @param level - Security level string
 * @returns CSS class string for security level styling
 */
export function getSecurityLevelColor(level: string): string {
  const securityMap: Record<string, string> = {
    'public': 'bg-green-100 text-green-800',
    'genel': 'bg-green-100 text-green-800',
    'internal': 'bg-yellow-100 text-yellow-800',
    'iç': 'bg-yellow-100 text-yellow-800',
    'confidential': 'bg-orange-100 text-orange-800',
    'gizli': 'bg-orange-100 text-orange-800',
    'secret': 'bg-red-100 text-red-800',
    'çok gizli': 'bg-red-100 text-red-800'
  };
  
  return securityMap[level.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'TRY')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Format number with Turkish locale
 * @param number - Number to format
 * @returns Formatted number string
 */
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('tr-TR').format(number);
}

/**
 * Format percentage
 * @param value - Value to format as percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 100)
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
