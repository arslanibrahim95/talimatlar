/**
 * Claude Talimat Design System - Color Constants
 * 
 * This file defines the standardized color palette for the application.
 * All components should use these constants instead of hardcoded color values.
 */

// Modern Primary Brand Colors (2024-2025 Trends)
export const PRIMARY_COLORS = {
  // Modern Blue scale with enhanced vibrancy
  blue: {
    50: '#f0f7ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Enhanced primary color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  // Modern Sky scale with better contrast
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Enhanced secondary color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  // Modern Purple scale for accents
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Modern accent color
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  }
} as const;

// Semantic Colors
export const SEMANTIC_COLORS = {
  // Success (Green)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main success color
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // Warning (Yellow/Amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Danger/Error (Red)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main danger color
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Info (Blue - same as primary)
  info: PRIMARY_COLORS.blue,
} as const;

// Neutral Colors
export const NEUTRAL_COLORS = {
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  }
} as const;

// Modern Theme-aware color mappings with Glassmorphism
export const THEME_COLORS = {
  // Background colors with modern glassmorphism
  background: {
    primary: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
    secondary: 'bg-gray-50/70 dark:bg-gray-800/70 backdrop-blur-lg',
    tertiary: 'bg-gray-100/60 dark:bg-gray-700/60 backdrop-blur-md',
    glass: 'bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30',
    glassStrong: 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50',
  },
  
  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-400',
    tertiary: 'text-gray-500 dark:text-gray-500',
    muted: 'text-gray-400 dark:text-gray-600',
  },
  
  // Border colors
  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-300 dark:border-gray-600',
    focus: 'border-blue-500 dark:border-blue-400',
    error: 'border-red-500 dark:border-red-400',
  },
  
  // Interactive colors
  interactive: {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100',
  },
  
  // Status colors
  status: {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      icon: 'text-green-400',
      border: 'border-green-200 dark:border-green-800',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
  },
} as const;

// Modern Component-specific color classes with Glassmorphism
export const COMPONENT_COLORS = {
  // Button variants with modern effects
  button: {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 active:from-gray-700 active:to-gray-800 focus-visible:ring-2 focus-visible:ring-gray-500/50 shadow-lg hover:shadow-xl transition-all duration-300',
    outline: 'border-2 border-blue-500/30 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/10 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-300',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-gray-500/50 transition-all duration-300',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 focus-visible:ring-2 focus-visible:ring-red-500/50 shadow-lg hover:shadow-xl transition-all duration-300',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 focus-visible:ring-2 focus-visible:ring-green-500/50 shadow-lg hover:shadow-xl transition-all duration-300',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 active:from-yellow-700 active:to-yellow-800 focus-visible:ring-2 focus-visible:ring-yellow-500/50 shadow-lg hover:shadow-xl transition-all duration-300',
  },
  
  // Badge variants
  badge: {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
  },
  
  // Card variants with modern glassmorphism
  card: {
    default: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-xl',
    elevated: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl border border-white/40 dark:border-gray-700/40 shadow-2xl',
    interactive: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300',
    glass: 'bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-2xl',
    glassStrong: 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 shadow-2xl',
  },
  
  // Input variants
  input: {
    default: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    focus: 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/20',
    error: 'border-red-500 dark:border-red-400 ring-2 ring-red-500/20 dark:ring-red-400/20',
    disabled: 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
  },
} as const;

// Modern Shadow System
export const MODERN_SHADOWS = {
  // Glassmorphism shadows
  glass: {
    light: 'shadow-[0_8px_32px_rgba(31,38,135,0.37)]',
    medium: 'shadow-[0_8px_32px_rgba(31,38,135,0.37)] shadow-[0_4px_16px_rgba(31,38,135,0.37)]',
    strong: 'shadow-[0_8px_32px_rgba(31,38,135,0.37)] shadow-[0_4px_16px_rgba(31,38,135,0.37)] shadow-[0_2px_8px_rgba(31,38,135,0.37)]',
  },
  
  // Modern component shadows
  component: {
    button: 'shadow-[0_4px_14px_0_rgba(0,118,255,0.39)]',
    card: 'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
    modal: 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]',
    dropdown: 'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]',
  },
  
  // Hover effects
  hover: {
    subtle: 'hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]',
    medium: 'hover:shadow-[0_10px_40px_rgba(0,0,0,0.2)]',
    strong: 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]',
  }
} as const;

// Utility functions for color usage
export const getColorClass = (color: keyof typeof THEME_COLORS, variant?: string) => {
  if (variant) {
    return THEME_COLORS[color][variant as keyof typeof THEME_COLORS[typeof color]];
  }
  return THEME_COLORS[color];
};

export const getComponentColor = (component: keyof typeof COMPONENT_COLORS, variant: string) => {
  return COMPONENT_COLORS[component][variant as keyof typeof COMPONENT_COLORS[typeof component]];
};

// Export all colors for easy access
export const COLORS = {
  ...PRIMARY_COLORS,
  ...SEMANTIC_COLORS,
  ...NEUTRAL_COLORS,
} as const;

// Modern Gradient System (2024-2025 Trends)
export const MODERN_GRADIENTS = {
  // Primary gradients
  primary: {
    blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
    sky: 'bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600',
    purple: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700',
  },
  
  // Modern multi-color gradients
  modern: {
    sunset: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600',
    ocean: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
    forest: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600',
    fire: 'bg-gradient-to-br from-red-400 via-orange-500 to-yellow-500',
    aurora: 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500',
  },
  
  // Glassmorphism gradients
  glass: {
    primary: 'bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl',
    dark: 'bg-gradient-to-br from-gray-900/20 via-gray-800/10 to-gray-700/5 backdrop-blur-xl',
    colored: 'bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/5 backdrop-blur-xl',
  },
  
  // Animated gradients (CSS animations)
  animated: {
    shimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer',
    pulse: 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-[length:200%_100%] animate-pulse-gradient',
  }
} as const;

export default COLORS;
