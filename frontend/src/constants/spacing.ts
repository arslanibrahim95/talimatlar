/**
 * Claude Talimat Design System - Spacing Constants
 * 
 * This file defines the standardized spacing system for the application.
 * All components should use these constants instead of hardcoded spacing values.
 */

// Base spacing unit: 4px (0.25rem)
export const SPACING = {
  // Micro spacing (0-8px)
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
  '5xl': '5rem',   // 80px
  '6xl': '6rem',   // 96px
} as const;

// Tailwind spacing classes
export const SPACING_CLASSES = {
  // Padding
  padding: {
    xs: 'p-2',      // 8px
    sm: 'p-3',      // 12px
    md: 'p-4',      // 16px
    lg: 'p-6',      // 24px
    xl: 'p-8',      // 32px
    '2xl': 'p-10',  // 40px
    '3xl': 'p-12',  // 48px
  },
  
  // Padding horizontal
  paddingX: {
    xs: 'px-2',     // 8px
    sm: 'px-3',     // 12px
    md: 'px-4',     // 16px
    lg: 'px-6',     // 24px
    xl: 'px-8',     // 32px
    '2xl': 'px-10', // 40px
    '3xl': 'px-12', // 48px
  },
  
  // Padding vertical
  paddingY: {
    xs: 'py-2',     // 8px
    sm: 'py-3',     // 12px
    md: 'py-4',     // 16px
    lg: 'py-6',     // 24px
    xl: 'py-8',     // 32px
    '2xl': 'py-10', // 40px
    '3xl': 'py-12', // 48px
  },
  
  // Margin
  margin: {
    xs: 'm-2',      // 8px
    sm: 'm-3',      // 12px
    md: 'm-4',      // 16px
    lg: 'm-6',      // 24px
    xl: 'm-8',      // 32px
    '2xl': 'm-10',  // 40px
    '3xl': 'm-12',  // 48px
  },
  
  // Margin horizontal
  marginX: {
    xs: 'mx-2',     // 8px
    sm: 'mx-3',     // 12px
    md: 'mx-4',     // 16px
    lg: 'mx-6',     // 24px
    xl: 'mx-8',     // 32px
    '2xl': 'mx-10', // 40px
    '3xl': 'mx-12', // 48px
  },
  
  // Margin vertical
  marginY: {
    xs: 'my-2',     // 8px
    sm: 'my-3',     // 12px
    md: 'my-4',     // 16px
    lg: 'my-6',     // 24px
    xl: 'my-8',     // 32px
    '2xl': 'my-10', // 40px
    '3xl': 'my-12', // 48px
  },
  
  // Gap (for flexbox and grid)
  gap: {
    xs: 'gap-2',    // 8px
    sm: 'gap-3',    // 12px
    md: 'gap-4',    // 16px
    lg: 'gap-6',    // 24px
    xl: 'gap-8',    // 32px
    '2xl': 'gap-10', // 40px
    '3xl': 'gap-12', // 48px
  },
  
  // Space between (for flexbox)
  space: {
    xs: 'space-y-2 space-x-2',    // 8px
    sm: 'space-y-3 space-x-3',    // 12px
    md: 'space-y-4 space-x-4',    // 16px
    lg: 'space-y-6 space-x-6',    // 24px
    xl: 'space-y-8 space-x-8',    // 32px
    '2xl': 'space-y-10 space-x-10', // 40px
    '3xl': 'space-y-12 space-x-12', // 48px
  },
} as const;

// Component-specific spacing
export const COMPONENT_SPACING = {
  // Button spacing
  button: {
    sm: 'px-3 py-1.5',  // Small buttons
    md: 'px-4 py-2',    // Medium buttons (default)
    lg: 'px-6 py-3',    // Large buttons
  },
  
  // Card spacing
  card: {
    padding: 'p-6',           // Card padding
    headerPadding: 'p-6 pb-4', // Card header padding
    contentPadding: 'p-6 pt-0', // Card content padding
    footerPadding: 'p-6 pt-0',  // Card footer padding
  },
  
  // Form spacing
  form: {
    fieldSpacing: 'mb-4',     // Space between form fields
    labelSpacing: 'mb-1',     // Space between label and input
    groupSpacing: 'mb-6',     // Space between form groups
  },
  
  // Layout spacing
  layout: {
    sectionSpacing: 'mb-6',   // Space between sections
    pagePadding: 'p-4 lg:p-6', // Page padding
    containerPadding: 'px-4 sm:px-6 lg:px-8', // Container padding
  },
  
  // Navigation spacing
  navigation: {
    itemSpacing: 'px-3 py-2', // Navigation item padding
    groupSpacing: 'mb-1',     // Space between navigation groups
  },
  
  // Modal spacing
  modal: {
    padding: 'p-6',           // Modal padding
    headerPadding: 'p-6 pb-4', // Modal header padding
    contentPadding: 'p-6 pt-0', // Modal content padding
    footerPadding: 'p-6 pt-0',  // Modal footer padding
  },
  
  // Table spacing
  table: {
    cellPadding: 'px-4 py-3', // Table cell padding
    headerPadding: 'px-4 py-3', // Table header padding
    rowSpacing: 'border-b',   // Table row spacing
  },
} as const;

// Responsive spacing
export const RESPONSIVE_SPACING = {
  // Mobile-first responsive spacing
  mobile: {
    section: 'mb-4',          // Mobile section spacing
    padding: 'p-4',           // Mobile padding
    gap: 'gap-4',             // Mobile gap
  },
  
  tablet: {
    section: 'md:mb-6',       // Tablet section spacing
    padding: 'md:p-6',        // Tablet padding
    gap: 'md:gap-6',          // Tablet gap
  },
  
  desktop: {
    section: 'lg:mb-8',       // Desktop section spacing
    padding: 'lg:p-8',        // Desktop padding
    gap: 'lg:gap-8',          // Desktop gap
  },
} as const;

// Utility functions for spacing
export const getSpacingClass = (type: keyof typeof SPACING_CLASSES, size: keyof typeof SPACING_CLASSES.padding) => {
  return SPACING_CLASSES[type][size];
};

export const getComponentSpacing = (component: keyof typeof COMPONENT_SPACING, element: keyof typeof COMPONENT_SPACING.button) => {
  return COMPONENT_SPACING[component][element];
};

export const getResponsiveSpacing = (breakpoint: keyof typeof RESPONSIVE_SPACING, property: keyof typeof RESPONSIVE_SPACING.mobile) => {
  return RESPONSIVE_SPACING[breakpoint][property];
};

export default SPACING;
