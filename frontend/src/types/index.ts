// User types
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone: string;
  company?: string;
  position?: string;
  role: 'admin' | 'manager' | 'employee' | string;
  tenantId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company: string;
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  requiresOtp?: boolean;
  error?: string;
}

export interface OtpResponse {
  success: boolean;
  error?: string;
}

// Document types
export interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'active' | 'draft' | 'archived' | 'pending';
  fileUrl: string;
  fileSize: number;
  fileType: string;
  tags: string[];
  version: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  downloads: number;
  rating?: number;
}

export interface DocumentCreate {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  file: File;
}

export interface DocumentUpdate {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: string;
}

// Analytics types
export interface AnalyticsOverview {
  totalDocuments: number;
  activeUsers: number;
  monthlyUploads: number;
  complianceRate: number;
  totalDownloads: number;
  averageRating: number;
}

export interface TrendData {
  month: string;
  documents: number;
  downloads: number;
  users: number;
}

export interface CategoryData {
  name: string;
  count: number;
  percentage: number;
}

export interface TopDocument {
  title: string;
  downloads: number;
  rating: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  title: string;
  message: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | undefined;
  };
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Common types
export type Status = 'success' | 'error' | 'warning' | 'info';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'default' | 'outline' | 'ghost' | 'destructive';

// Event types
export interface AppEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

// Search types
export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  createdBy?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  filters: SearchFilters;
  suggestions?: string[];
}
