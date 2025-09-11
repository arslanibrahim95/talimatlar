/**
 * Claude Talimat Design System - Typography Constants
 * 
 * This file defines the standardized typography system for the application.
 * All components should use these constants instead of hardcoded typography values.
 */

// Font families
export const FONT_FAMILIES = {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
} as const;

// Font weights
export const FONT_WEIGHTS = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// Font sizes with line heights
export const FONT_SIZES = {
  xs: {
    fontSize: '0.75rem',    // 12px
    lineHeight: '1rem',     // 16px
    letterSpacing: '0.025em',
  },
  sm: {
    fontSize: '0.875rem',   // 14px
    lineHeight: '1.25rem',  // 20px
    letterSpacing: '0.025em',
  },
  base: {
    fontSize: '1rem',       // 16px
    lineHeight: '1.5rem',   // 24px
    letterSpacing: '0',
  },
  lg: {
    fontSize: '1.125rem',   // 18px
    lineHeight: '1.75rem',  // 28px
    letterSpacing: '-0.025em',
  },
  xl: {
    fontSize: '1.25rem',    // 20px
    lineHeight: '1.75rem',  // 28px
    letterSpacing: '-0.025em',
  },
  '2xl': {
    fontSize: '1.5rem',     // 24px
    lineHeight: '2rem',     // 32px
    letterSpacing: '-0.025em',
  },
  '3xl': {
    fontSize: '1.875rem',   // 30px
    lineHeight: '2.25rem',  // 36px
    letterSpacing: '-0.025em',
  },
  '4xl': {
    fontSize: '2.25rem',    // 36px
    lineHeight: '2.5rem',   // 40px
    letterSpacing: '-0.025em',
  },
  '5xl': {
    fontSize: '3rem',       // 48px
    lineHeight: '1',        // 48px
    letterSpacing: '-0.025em',
  },
  '6xl': {
    fontSize: '3.75rem',    // 60px
    lineHeight: '1',        // 60px
    letterSpacing: '-0.025em',
  },
} as const;

// Typography scale classes
export const TYPOGRAPHY_CLASSES = {
  // Headings
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold tracking-tight',
  h4: 'text-xl font-semibold tracking-tight',
  h5: 'text-lg font-semibold tracking-tight',
  h6: 'text-base font-semibold tracking-tight',
  
  // Body text
  body: {
    large: 'text-lg leading-7',
    base: 'text-base leading-6',
    small: 'text-sm leading-5',
  },
  
  // Labels and captions
  label: 'text-sm font-medium leading-5',
  caption: 'text-xs leading-4',
  
  // Code
  code: {
    inline: 'font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded',
    block: 'font-mono text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto',
  },
  
  // Links
  link: {
    default: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-4 hover:underline',
    subtle: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline-offset-4 hover:underline',
  },
} as const;

// Component-specific typography
export const COMPONENT_TYPOGRAPHY = {
  // Button typography
  button: {
    sm: 'text-xs font-medium',
    md: 'text-sm font-medium',
    lg: 'text-base font-medium',
  },
  
  // Card typography
  card: {
    title: 'text-lg font-semibold leading-6',
    subtitle: 'text-sm font-medium leading-5',
    description: 'text-sm leading-5',
    caption: 'text-xs leading-4',
  },
  
  // Form typography
  form: {
    label: 'text-sm font-medium leading-5',
    helper: 'text-xs leading-4',
    error: 'text-xs leading-4',
    placeholder: 'text-sm leading-5',
  },
  
  // Navigation typography
  navigation: {
    item: 'text-sm font-medium leading-5',
    section: 'text-xs font-semibold leading-4 uppercase tracking-wider',
  },
  
  // Table typography
  table: {
    header: 'text-xs font-semibold leading-4 uppercase tracking-wider',
    cell: 'text-sm leading-5',
    caption: 'text-xs leading-4',
  },
  
  // Modal typography
  modal: {
    title: 'text-lg font-semibold leading-6',
    description: 'text-sm leading-5',
  },
  
  // Badge typography
  badge: {
    default: 'text-xs font-medium leading-4',
  },
  
  // Alert typography
  alert: {
    title: 'text-sm font-medium leading-5',
    description: 'text-sm leading-5',
  },
} as const;

// Responsive typography
export const RESPONSIVE_TYPOGRAPHY = {
  // Mobile-first responsive typography
  mobile: {
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-semibold tracking-tight',
    h3: 'text-xl font-semibold tracking-tight',
    h4: 'text-lg font-semibold tracking-tight',
    body: 'text-sm leading-5',
  },
  
  tablet: {
    h1: 'md:text-4xl md:font-bold md:tracking-tight',
    h2: 'md:text-3xl md:font-semibold md:tracking-tight',
    h3: 'md:text-2xl md:font-semibold md:tracking-tight',
    h4: 'md:text-xl md:font-semibold md:tracking-tight',
    body: 'md:text-base md:leading-6',
  },
  
  desktop: {
    h1: 'lg:text-5xl lg:font-bold lg:tracking-tight',
    h2: 'lg:text-4xl lg:font-semibold lg:tracking-tight',
    h3: 'lg:text-3xl lg:font-semibold lg:tracking-tight',
    h4: 'lg:text-2xl lg:font-semibold lg:tracking-tight',
    body: 'lg:text-lg lg:leading-7',
  },
} as const;

// Utility functions for typography
export const getTypographyClass = (element: keyof typeof TYPOGRAPHY_CLASSES) => {
  return TYPOGRAPHY_CLASSES[element];
};

export const getComponentTypography = (component: keyof typeof COMPONENT_TYPOGRAPHY, element: keyof typeof COMPONENT_TYPOGRAPHY.button) => {
  return COMPONENT_TYPOGRAPHY[component][element];
};

export const getResponsiveTypography = (breakpoint: keyof typeof RESPONSIVE_TYPOGRAPHY, element: keyof typeof RESPONSIVE_TYPOGRAPHY.mobile) => {
  return RESPONSIVE_TYPOGRAPHY[breakpoint][element];
};

// Text color utilities
export const TEXT_COLORS = {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-600 dark:text-gray-400',
  tertiary: 'text-gray-500 dark:text-gray-500',
  muted: 'text-gray-400 dark:text-gray-600',
  accent: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
} as const;

export default {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  FONT_SIZES,
  TYPOGRAPHY_CLASSES,
  COMPONENT_TYPOGRAPHY,
  RESPONSIVE_TYPOGRAPHY,
  TEXT_COLORS,
};
