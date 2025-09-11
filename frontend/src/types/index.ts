/**
 * Type definitions for Claude Talimat application
 * Contains interfaces for all major data structures and API responses
 */

/**
 * User account information and authentication details
 */
export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'user';
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User login credentials for authentication
 */
export interface LoginCredentials {
  email: string;
  password: string;
  device_info?: DeviceInfo;
}

/**
 * User registration data for account creation
 */
export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

/**
 * Authentication response after successful login
 * Includes access token and user information
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  requires_mfa?: boolean;
  mfa_methods?: string[];
}

/**
 * Device information for multi-factor authentication
 * Tracks device characteristics for security purposes
 */
export interface DeviceInfo {
  device_id: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser?: string;
  app_version?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

/**
 * Multi-factor authentication method configuration
 * Supports various MFA types for enhanced security
 */
export interface MFAMethod {
  id: string;
  type: 'sms' | 'email' | 'totp' | 'biometric' | 'push';
  name: string;
  is_primary: boolean;
  is_enabled: boolean;
  last_used?: string;
}

/**
 * MFA code request for authentication
 * Specifies method and target for code delivery
 */
export interface MFACodeRequest {
  method: string;
  personnel_id?: string;
  email?: string;
  phone?: string;
  device_id?: string;
}

/**
 * MFA code verification for authentication
 * Includes verification code and device information
 */
export interface MFACodeVerification {
  method: string;
  code: string;
  personnel_id?: string;
  device_id?: string;
  remember_device?: boolean;
}

/**
 * MFA setup configuration for new authentication methods
 * Configures primary and secondary MFA methods
 */
export interface MFASetup {
  method: string;
  personnel_id: string;
  value: string; // phone number, email, or TOTP secret
  is_primary?: boolean;
}

/**
 * Personnel login request for mobile applications
 * Supports multiple login methods for field workers
 */
export interface PersonnelLoginRequest {
  employee_id: string;
  phone?: string;
  email?: string;
  device_info: DeviceInfo;
  login_method: 'employee_id' | 'phone' | 'email';
}

/**
 * Personnel login response with verification requirements
 * Indicates if additional verification is needed
 */
export interface PersonnelLoginResponse {
  success: boolean;
  requires_verification: boolean;
  verification_methods: string[];
  session_id: string;
  message: string;
}

/**
 * Personnel verification request for mobile authentication
 * Handles OTP and biometric verification
 */
export interface PersonnelVerificationRequest {
  session_id: string;
  verification_method: string;
  verification_code?: string;
  biometric_data?: string;
  device_id: string;
}

/**
 * Personnel verification response with authentication result
 * Provides access token and user information upon success
 */
export interface PersonnelVerificationResponse {
  success: boolean;
  access_token?: string;
  user?: Personnel;
  message: string;
  expires_in?: number;
}

/**
 * Document information and metadata
 * Represents files and documents in the system
 */
export interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  file_url?: string;
  file_size?: number;
  file_type?: string;
  status: 'draft' | 'published' | 'archived' | 'deleted';
  created_by: string;
  created_at: string;
  updated_at?: string;
  version: number;
  is_public: boolean;
  download_count: number;
  last_downloaded?: string;
}

/**
 * Document creation data for new documents
 * Required fields for document creation
 */
export interface DocumentCreate {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  file_url?: string;
  file_size?: number;
  file_type?: string;
  is_public?: boolean;
}

/**
 * Document update data for existing documents
 * Partial updates for document modification
 */
export interface DocumentUpdate {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived' | 'deleted';
  is_public?: boolean;
}

/**
 * Dashboard statistics and metrics
 * Provides overview of system activity and usage
 */
export interface DashboardStats {
  total_documents: number;
  total_users: number;
  total_downloads: number;
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
  popular_categories: Array<{
    name: string;
    count: number;
  }>;
  system_health: {
    status: 'healthy' | 'warning' | 'error';
    message: string;
    last_check: string;
  };
}

/**
 * Analytics report data for business intelligence
 * Contains aggregated metrics and trends
 */
export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'usage' | 'performance' | 'user_behavior' | 'custom';
  data: Record<string, string | number | boolean | object>;
  created_at: string;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Notification information for user alerts
 * Supports various notification types and priorities
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  action_url?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expires_at?: string;
}

/**
 * Form data for login form
 * Client-side form validation and submission
 */
export interface LoginFormData {
  email: string;
  password: string;
  remember_me?: boolean;
}

/**
 * Form data for user registration
 * Client-side form validation and submission
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  accept_terms: boolean;
}

/**
 * Form data for password reset request
 * Handles forgotten password scenarios
 */
export interface ForgotPasswordFormData {
  email: string;
}

/**
 * Form data for password reset confirmation
 * Handles password reset with token verification
 */
export interface ResetPasswordFormData {
  token: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Generic API response wrapper
 * Standardizes API responses across the application
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status_code: number;
}

/**
 * Paginated response for large data sets
 * Supports pagination with metadata
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * API error information for error handling
 * Provides detailed error context for debugging
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  request_id?: string;
}

/**
 * Validation error details for form validation
 * Field-specific error information
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: string | number | boolean | object;
  rule?: string;
}

/**
 * Network error information for connectivity issues
 * Handles offline and connection problems
 */
export interface NetworkError {
  type: 'network' | 'timeout' | 'offline' | 'server_error';
  message: string;
  retry_after?: number;
  is_retryable: boolean;
}

/**
 * Service response wrapper for internal services
 * Standardizes service layer responses
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * HTTP method types for API requests
 * Standard HTTP methods supported by the application
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP request configuration options
 * Configures request behavior and retry logic
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Theme configuration for UI customization
 * Supports light/dark mode and custom themes
 */
export interface Theme {
  name: string;
  type: 'light' | 'dark' | 'custom';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    text_secondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

/**
 * Personnel information for field workers
 * Manages employee data and access permissions
 */
export interface Personnel {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  department: string;
  position: string;
  supervisor_id?: string;
  hire_date: string;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  profile_image?: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Personnel creation data for new employees
 * Required fields for personnel registration
 */
export interface PersonnelCreate {
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  department: string;
  position: string;
  supervisor_id?: string;
  hire_date: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Personnel update data for existing employees
 * Partial updates for personnel modification
 */
export interface PersonnelUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  supervisor_id?: string;
  is_active?: boolean;
  mfa_enabled?: boolean;
  profile_image?: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Instruction reading record for compliance tracking
 * Tracks when personnel read and acknowledged instructions
 */
export interface InstructionReading {
  id: string;
  instruction_id: string;
  personnel_id: string;
  read_at: string;
  acknowledged: boolean;
  acknowledgment_date?: string;
  quiz_score?: number;
  time_spent: number; // in seconds
  device_info: DeviceInfo;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

/**
 * Instruction reading creation data
 * Records new instruction readings
 */
export interface InstructionReadingCreate {
  instruction_id: string;
  personnel_id: string;
  acknowledged: boolean;
  quiz_score?: number;
  time_spent: number;
  device_info: DeviceInfo;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

/**
 * Instruction reading statistics for reporting
 * Aggregated data for compliance analysis
 */
export interface InstructionReadingStats {
  total_readings: number;
  total_personnel: number;
  average_quiz_score: number;
  average_time_spent: number;
  completion_rate: number;
  last_reading_date?: string;
  department_breakdown: DepartmentStats[];
}

/**
 * Department statistics for instruction compliance
 * Department-level performance metrics
 */
export interface DepartmentStats {
  department: string;
  personnel_count: number;
  readings_count: number;
  average_score: number;
  completion_rate: number;
  last_activity?: string;
}

/**
 * Instruction assignment for personnel
 * Links instructions to specific employees or departments
 */
export interface InstructionAssignment {
  id: string;
  instruction_id: string;
  personnel_id?: string;
  department_id?: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
  completion_date?: string;
}

/**
 * Instruction assignment creation data
 * Creates new instruction assignments
 */
export interface InstructionAssignmentCreate {
  instruction_id: string;
  personnel_id?: string;
  department_id?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}
