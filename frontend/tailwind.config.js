/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Claude Talimat brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        
        // Modern font families (2024-2025 trends)
        'sans-modern': ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'SF Pro Text', 'system-ui', 'sans-serif'],
        'mono-modern': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        
        // Modern font sizes (2024-2025 trends)
        '7xl': ['4.5rem', { lineHeight: '1' }],      // 72px
        '8xl': ['6rem', { lineHeight: '1' }],        // 96px
        '9xl': ['8rem', { lineHeight: '1' }],        // 128px
        
        // Modern component-specific sizes
        'hero': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],     // 56px
        'display': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],  // 40px
        'title': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],   // 28px
        'subtitle': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }], // 20px
        'body-large': ['1.125rem', { lineHeight: '1.6' }],                        // 18px
        'body-small': ['0.875rem', { lineHeight: '1.5' }],                        // 14px
        'caption': ['0.75rem', { lineHeight: '1.4' }],                           // 12px
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        
        // Modern spacing values (2024-2025 trends)
        '18.5': '4.625rem',  // 74px
        '19': '4.75rem',     // 76px
        '19.5': '4.875rem',  // 78px
        '20.5': '5.125rem',  // 82px
        '21': '5.25rem',     // 84px
        '21.5': '5.375rem',  // 86px
        '22.5': '5.625rem',  // 90px
        '23': '5.75rem',     // 92px
        '23.5': '5.875rem',  // 94px
        '24.5': '6.125rem',  // 98px
        '25': '6.25rem',     // 100px
        '25.5': '6.375rem',  // 102px
        '26': '6.5rem',      // 104px
        '26.5': '6.625rem',  // 106px
        '27': '6.75rem',     // 108px
        '27.5': '6.875rem',  // 110px
        '28': '7rem',        // 112px
        '28.5': '7.125rem',  // 114px
        '29': '7.25rem',     // 116px
        '29.5': '7.375rem',  // 118px
        '30': '7.5rem',      // 120px
        
        // Modern component spacing
        'card': '1.5rem',    // 24px - Modern card padding
        'button': '1rem',    // 16px - Modern button padding
        'input': '0.875rem', // 14px - Modern input padding
        'modal': '2rem',     // 32px - Modern modal padding
        'section': '3rem',   // 48px - Modern section spacing
        'page': '2rem',      // 32px - Modern page padding
      },
      borderRadius: {
        '4xl': '2rem',
        
        // Modern border radius values (2024-2025 trends)
        '5xl': '2.5rem',     // 40px
        '6xl': '3rem',       // 48px
        '7xl': '3.5rem',     // 56px
        '8xl': '4rem',       // 64px
        '9xl': '4.5rem',     // 72px
        '10xl': '5rem',      // 80px
        
        // Modern component-specific radius
        'card': '1.5rem',    // 24px - Modern card radius
        'button': '1rem',    // 16px - Modern button radius
        'input': '0.875rem', // 14px - Modern input radius
        'modal': '2rem',     // 32px - Modern modal radius
        
        // Modern spacing values
        'spacing-xs': '0.5rem',   // 8px
        'spacing-sm': '1rem',     // 16px
        'spacing-md': '1.5rem',   // 24px
        'spacing-lg': '2rem',     // 32px
        'spacing-xl': '3rem',     // 48px
        'spacing-2xl': '4rem',    // 64px
        'spacing-3xl': '6rem',    // 96px
        
        // Modern component spacing
        'component-xs': '0.5rem',  // 8px
        'component-sm': '1rem',    // 16px
        'component-md': '1.5rem',  // 24px
        'component-lg': '2rem',    // 32px
        'component-xl': '3rem',    // 48px
        'component-2xl': '4rem',   // 64px
        'component-3xl': '6rem',   // 96px
        
        // Modern layout spacing
        'layout-xs': '0.5rem',     // 8px
        'layout-sm': '1rem',       // 16px
        'layout-md': '1.5rem',     // 24px
        'layout-lg': '2rem',       // 32px
        'layout-xl': '3rem',       // 48px
        'layout-2xl': '4rem',      // 64px
        'layout-3xl': '6rem',      // 96px
        
        // Modern responsive spacing
        'responsive-xs': 'clamp(0.5rem, 2vw, 1rem)',     // 8px - 16px
        'responsive-sm': 'clamp(1rem, 3vw, 1.5rem)',     // 16px - 24px
        'responsive-md': 'clamp(1.5rem, 4vw, 2rem)',     // 24px - 32px
        'responsive-lg': 'clamp(2rem, 5vw, 3rem)',       // 32px - 48px
        'responsive-xl': 'clamp(3rem, 6vw, 4rem)',       // 48px - 64px
        'responsive-2xl': 'clamp(4rem, 8vw, 6rem)',      // 64px - 96px
        
        // Modern component spacing
        'button': '1rem',           // 16px - Button padding
        'card': '1.5rem',           // 24px - Card padding
        'input': '0.875rem',        // 14px - Input padding
        'modal': '2rem',            // 32px - Modal padding
        'section': '3rem',          // 48px - Section spacing
        'page': '2rem',             // 32px - Page padding
        
        // Modern responsive spacing
        'mobile': '1rem',           // 16px - Mobile padding
        'tablet': '1.5rem',         // 24px - Tablet padding
        'desktop': '2rem',          // 32px - Desktop padding
        'wide': '3rem',             // 48px - Wide screen padding
        
        // Modern component spacing
        'button-sm': '0.5rem 1rem',     // 8px 16px - Small button
        'button-md': '0.75rem 1.5rem',  // 12px 24px - Medium button
        'button-lg': '1rem 2rem',       // 16px 32px - Large button
        'card-sm': '1rem',              // 16px - Small card
        'card-md': '1.5rem',            // 24px - Medium card
        'card-lg': '2rem',              // 32px - Large card
        
        // Modern responsive spacing
        'mobile-xs': '0.5rem',          // 8px - Mobile extra small
        'mobile-sm': '1rem',            // 16px - Mobile small
        'mobile-md': '1.5rem',          // 24px - Mobile medium
        'mobile-lg': '2rem',            // 32px - Mobile large
        'tablet-xs': '1rem',            // 16px - Tablet extra small
        'tablet-sm': '1.5rem',          // 24px - Tablet small
        'tablet-md': '2rem',            // 32px - Tablet medium
        'tablet-lg': '3rem',            // 48px - Tablet large
        'desktop-xs': '1.5rem',         // 24px - Desktop extra small
        'desktop-sm': '2rem',           // 32px - Desktop small
        'desktop-md': '3rem',           // 48px - Desktop medium
        'desktop-lg': '4rem',           // 64px - Desktop large
        
        // Modern component spacing
        'input-sm': '0.5rem 0.75rem',    // 8px 12px - Small input
        'input-md': '0.75rem 1rem',      // 12px 16px - Medium input
        'input-lg': '1rem 1.25rem',      // 16px 20px - Large input
        'modal-sm': '1.5rem',            // 24px - Small modal
        'modal-md': '2rem',              // 32px - Medium modal
        'modal-lg': '3rem',              // 48px - Large modal
        'section-sm': '2rem',            // 32px - Small section
        'section-md': '3rem',            // 48px - Medium section
        'section-lg': '4rem',            // 64px - Large section
        'page-sm': '1.5rem',             // 24px - Small page
        'page-md': '2rem',               // 32px - Medium page
        'page-lg': '3rem',               // 48px - Large page
        
        // Modern responsive spacing
        'mobile-button': '0.5rem 1rem',      // 8px 16px - Mobile button
        'tablet-button': '0.75rem 1.5rem',   // 12px 24px - Tablet button
        'desktop-button': '1rem 2rem',       // 16px 32px - Desktop button
        'mobile-card': '1rem',               // 16px - Mobile card
        'tablet-card': '1.5rem',             // 24px - Tablet card
        'desktop-card': '2rem',              // 32px - Desktop card
        'mobile-input': '0.5rem 0.75rem',   // 8px 12px - Mobile input
        'tablet-input': '0.75rem 1rem',     // 12px 16px - Tablet input
        'desktop-input': '1rem 1.25rem',    // 16px 20px - Desktop input
        
        // Modern component spacing
        'button-xs': '0.25rem 0.5rem',      // 4px 8px - Extra small button
        'button-sm': '0.5rem 1rem',         // 8px 16px - Small button
        'button-md': '0.75rem 1.5rem',      // 12px 24px - Medium button
        'button-lg': '1rem 2rem',           // 16px 32px - Large button
        'button-xl': '1.25rem 2.5rem',      // 20px 40px - Extra large button
        'card-xs': '0.75rem',               // 12px - Extra small card
        'card-sm': '1rem',                  // 16px - Small card
        'card-md': '1.5rem',                // 24px - Medium card
        'card-lg': '2rem',                  // 32px - Large card
        'card-xl': '2.5rem',                // 40px - Extra large card
        
        // Modern responsive spacing
        'mobile-button-xs': '0.25rem 0.5rem',   // 4px 8px - Mobile extra small button
        'mobile-button-sm': '0.5rem 1rem',      // 8px 16px - Mobile small button
        'mobile-button-md': '0.75rem 1.5rem',   // 12px 24px - Mobile medium button
        'mobile-button-lg': '1rem 2rem',        // 16px 32px - Mobile large button
        'tablet-button-xs': '0.5rem 1rem',      // 8px 16px - Tablet extra small button
        'tablet-button-sm': '0.75rem 1.5rem',   // 12px 24px - Tablet small button
        'tablet-button-md': '1rem 2rem',        // 16px 32px - Tablet medium button
        'tablet-button-lg': '1.25rem 2.5rem',   // 20px 40px - Tablet large button
        'desktop-button-xs': '0.75rem 1.5rem',  // 12px 24px - Desktop extra small button
        'desktop-button-sm': '1rem 2rem',       // 16px 32px - Desktop small button
        'desktop-button-md': '1.25rem 2.5rem',  // 20px 40px - Desktop medium button
        'desktop-button-lg': '1.5rem 3rem',     // 24px 48px - Desktop large button
        
        // Modern responsive spacing
        'mobile-card-xs': '0.75rem',             // 12px - Mobile extra small card
        'mobile-card-sm': '1rem',                // 16px - Mobile small card
        'mobile-card-md': '1.5rem',              // 24px - Mobile medium card
        'mobile-card-lg': '2rem',                // 32px - Mobile large card
        'tablet-card-xs': '1rem',                // 16px - Tablet extra small card
        'tablet-card-sm': '1.5rem',              // 24px - Tablet small card
        'tablet-card-md': '2rem',                // 32px - Tablet medium card
        'tablet-card-lg': '2.5rem',              // 40px - Tablet large card
        'desktop-card-xs': '1.5rem',             // 24px - Desktop extra small card
        'desktop-card-sm': '2rem',               // 32px - Desktop small card
        'desktop-card-md': '2.5rem',             // 40px - Desktop medium card
        'desktop-card-lg': '3rem',               // 48px - Desktop large card
        
        // Modern responsive spacing
        'mobile-input-xs': '0.25rem 0.5rem',     // 4px 8px - Mobile extra small input
        'mobile-input-sm': '0.5rem 0.75rem',     // 8px 12px - Mobile small input
        'mobile-input-md': '0.75rem 1rem',       // 12px 16px - Mobile medium input
        'mobile-input-lg': '1rem 1.25rem',       // 16px 20px - Mobile large input
        'tablet-input-xs': '0.5rem 0.75rem',     // 8px 12px - Tablet extra small input
        'tablet-input-sm': '0.75rem 1rem',        // 12px 16px - Tablet small input
        'tablet-input-md': '1rem 1.25rem',       // 16px 20px - Tablet medium input
        'tablet-input-lg': '1.25rem 1.5rem',     // 20px 24px - Tablet large input
        'desktop-input-xs': '0.75rem 1rem',      // 12px 16px - Desktop extra small input
        'desktop-input-sm': '1rem 1.25rem',      // 16px 20px - Desktop small input
        'desktop-input-md': '1.25rem 1.5rem',    // 20px 24px - Desktop medium input
        'desktop-input-lg': '1.5rem 2rem',       // 24px 32px - Desktop large input
        
        // Modern responsive spacing
        'mobile-modal-xs': '1rem',                // 16px - Mobile extra small modal
        'mobile-modal-sm': '1.5rem',              // 24px - Mobile small modal
        'mobile-modal-md': '2rem',                // 32px - Mobile medium modal
        'mobile-modal-lg': '2.5rem',              // 40px - Mobile large modal
        'tablet-modal-xs': '1.5rem',              // 24px - Tablet extra small modal
        'tablet-modal-sm': '2rem',                // 32px - Tablet small modal
        'tablet-modal-md': '2.5rem',              // 40px - Tablet medium modal
        'tablet-modal-lg': '3rem',                // 48px - Tablet large modal
        'desktop-modal-xs': '2rem',               // 32px - Desktop extra small modal
        'desktop-modal-sm': '2.5rem',             // 40px - Desktop small modal
        'desktop-modal-md': '3rem',               // 48px - Desktop medium modal
        'desktop-modal-lg': '4rem',               // 64px - Desktop large modal
        
        // Modern responsive spacing
        'mobile-section-xs': '1.5rem',             // 24px - Mobile extra small section
        'mobile-section-sm': '2rem',               // 32px - Mobile small section
        'mobile-section-md': '3rem',               // 48px - Mobile medium section
        'mobile-section-lg': '4rem',               // 64px - Mobile large section
        'tablet-section-xs': '2rem',               // 32px - Tablet extra small section
        'tablet-section-sm': '3rem',               // 48px - Tablet small section
        'tablet-section-md': '4rem',               // 64px - Tablet medium section
        'tablet-section-lg': '5rem',               // 80px - Tablet large section
        'desktop-section-xs': '3rem',              // 48px - Desktop extra small section
        'desktop-section-sm': '4rem',              // 64px - Desktop small section
        'desktop-section-md': '5rem',              // 80px - Desktop medium section
        'desktop-section-lg': '6rem',              // 96px - Desktop large section
        
        // Modern responsive spacing
        'mobile-page-xs': '1rem',                  // 16px - Mobile extra small page
        'mobile-page-sm': '1.5rem',                // 24px - Mobile small page
        'mobile-page-md': '2rem',                  // 32px - Mobile medium page
        'mobile-page-lg': '3rem',                  // 48px - Mobile large page
        'tablet-page-xs': '1.5rem',                // 24px - Tablet extra small page
        'tablet-page-sm': '2rem',                  // 32px - Tablet small page
        'tablet-page-md': '3rem',                  // 48px - Tablet medium page
        'tablet-page-lg': '4rem',                  // 64px - Tablet large page
        'desktop-page-xs': '2rem',                 // 32px - Desktop extra small page
        'desktop-page-sm': '3rem',                 // 48px - Desktop small page
        'desktop-page-md': '4rem',                 // 64px - Desktop medium page
        'desktop-page-lg': '5rem',                 // 80px - Desktop large page
        
        // Modern responsive spacing
        'mobile-gap-xs': '0.5rem',                 // 8px - Mobile extra small gap
        'mobile-gap-sm': '1rem',                   // 16px - Mobile small gap
        'mobile-gap-md': '1.5rem',                 // 24px - Mobile medium gap
        'mobile-gap-lg': '2rem',                   // 32px - Mobile large gap
        'tablet-gap-xs': '1rem',                   // 16px - Tablet extra small gap
        'tablet-gap-sm': '1.5rem',                 // 24px - Tablet small gap
        'tablet-gap-md': '2rem',                   // 32px - Tablet medium gap
        'tablet-gap-lg': '3rem',                   // 48px - Tablet large gap
        'desktop-gap-xs': '1.5rem',                // 24px - Desktop extra small gap
        'desktop-gap-sm': '2rem',                  // 32px - Desktop small gap
        'desktop-gap-md': '3rem',                  // 48px - Desktop medium gap
        'desktop-gap-lg': '4rem',                  // 64px - Desktop large gap
        
        // Modern responsive spacing
        'mobile-margin-xs': '0.5rem',              // 8px - Mobile extra small margin
        'mobile-margin-sm': '1rem',                // 16px - Mobile small margin
        'mobile-margin-md': '1.5rem',              // 24px - Mobile medium margin
        'mobile-margin-lg': '2rem',                // 32px - Mobile large margin
        'tablet-margin-xs': '1rem',                // 16px - Tablet extra small margin
        'tablet-margin-sm': '1.5rem',              // 24px - Tablet small margin
        'tablet-margin-md': '2rem',                // 32px - Tablet medium margin
        'tablet-margin-lg': '3rem',                // 48px - Tablet large margin
        'desktop-margin-xs': '1.5rem',             // 24px - Desktop extra small margin
        'desktop-margin-sm': '2rem',               // 32px - Desktop small margin
        'desktop-margin-md': '3rem',               // 48px - Desktop medium margin
        'desktop-margin-lg': '4rem',               // 64px - Desktop large margin
        
        // Modern responsive spacing
        'mobile-padding-xs': '0.5rem',             // 8px - Mobile extra small padding
        'mobile-padding-sm': '1rem',               // 16px - Mobile small padding
        'mobile-padding-md': '1.5rem',             // 24px - Mobile medium padding
        'mobile-padding-lg': '2rem',               // 32px - Mobile large padding
        'tablet-padding-xs': '1rem',               // 16px - Tablet extra small padding
        'tablet-padding-sm': '1.5rem',             // 24px - Tablet small padding
        'tablet-padding-md': '2rem',               // 32px - Tablet medium padding
        'tablet-padding-lg': '3rem',               // 48px - Tablet large padding
        'desktop-padding-xs': '1.5rem',            // 24px - Desktop extra small padding
        'desktop-padding-sm': '2rem',              // 32px - Desktop small padding
        'desktop-padding-md': '3rem',              // 48px - Desktop medium padding
        'desktop-padding-lg': '4rem',              // 64px - Desktop large padding
        
        // Modern responsive spacing
        'mobile-border-xs': '0.125rem',             // 2px - Mobile extra small border
        'mobile-border-sm': '0.25rem',              // 4px - Mobile small border
        'mobile-border-md': '0.5rem',               // 8px - Mobile medium border
        'mobile-border-lg': '1rem',                 // 16px - Mobile large border
        'tablet-border-xs': '0.25rem',              // 4px - Tablet extra small border
        'tablet-border-sm': '0.5rem',               // 8px - Tablet small border
        'tablet-border-md': '1rem',                 // 16px - Tablet medium border
        'tablet-border-lg': '1.5rem',               // 24px - Tablet large border
        'desktop-border-xs': '0.5rem',              // 8px - Desktop extra small border
        'desktop-border-sm': '1rem',                // 16px - Desktop small border
        'desktop-border-md': '1.5rem',              // 24px - Desktop medium border
        'desktop-border-lg': '2rem',                // 32px - Desktop large border
        
        // Modern responsive spacing
        'mobile-radius-xs': '0.25rem',              // 4px - Mobile extra small radius
        'mobile-radius-sm': '0.5rem',               // 8px - Mobile small radius
        'mobile-radius-md': '0.75rem',              // 12px - Mobile medium radius
        'mobile-radius-lg': '1rem',                 // 16px - Mobile large radius
        'tablet-radius-xs': '0.5rem',               // 8px - Tablet extra small radius
        'tablet-radius-sm': '0.75rem',              // 12px - Tablet small radius
        'tablet-radius-md': '1rem',                 // 16px - Tablet medium radius
        'tablet-radius-lg': '1.5rem',               // 24px - Tablet large radius
        'desktop-radius-xs': '0.75rem',             // 12px - Desktop extra small radius
        'desktop-radius-sm': '1rem',                // 16px - Desktop small radius
        'desktop-radius-md': '1.5rem',              // 24px - Desktop medium radius
        'desktop-radius-lg': '2rem',                // 32px - Desktop large radius
        
        // Modern responsive spacing
        'mobile-shadow-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',      // Mobile extra small shadow
        'mobile-shadow-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',       // Mobile small shadow
        'mobile-shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',    // Mobile medium shadow
        'mobile-shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',  // Mobile large shadow
        'tablet-shadow-xs': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',       // Tablet extra small shadow
        'tablet-shadow-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',    // Tablet small shadow
        'tablet-shadow-md': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',  // Tablet medium shadow
        'tablet-shadow-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',  // Tablet large shadow
        'desktop-shadow-xs': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',   // Desktop extra small shadow
        'desktop-shadow-sm': '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // Desktop small shadow
        'desktop-shadow-md': '0 20px 25px -5px rgba(0, 0, 0, 0.1)', // Desktop medium shadow
        'desktop-shadow-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // Desktop large shadow
        
        // Modern responsive spacing
        'mobile-blur-xs': '2px',                    // 2px - Mobile extra small blur
        'mobile-blur-sm': '4px',                    // 4px - Mobile small blur
        'mobile-blur-md': '8px',                    // 8px - Mobile medium blur
        'mobile-blur-lg': '12px',                   // 12px - Mobile large blur
        'tablet-blur-xs': '4px',                    // 4px - Tablet extra small blur
        'tablet-blur-sm': '8px',                    // 8px - Tablet small blur
        'tablet-blur-md': '12px',                   // 12px - Tablet medium blur
        'tablet-blur-lg': '16px',                   // 16px - Tablet large blur
        'desktop-blur-xs': '8px',                   // 8px - Desktop extra small blur
        'desktop-blur-sm': '12px',                  // 12px - Desktop small blur
        'desktop-blur-md': '16px',                  // 16px - Desktop medium blur
        'desktop-blur-lg': '24px',                  // 24px - Desktop large blur
        
        // Modern responsive spacing
        'mobile-scale-xs': '0.95',                  // 0.95 - Mobile extra small scale
        'mobile-scale-sm': '0.98',                  // 0.98 - Mobile small scale
        'mobile-scale-md': '1',                     // 1 - Mobile medium scale
        'mobile-scale-lg': '1.02',                  // 1.02 - Mobile large scale
        'tablet-scale-xs': '0.98',                  // 0.98 - Tablet extra small scale
        'tablet-scale-sm': '1',                     // 1 - Tablet small scale
        'tablet-scale-md': '1.02',                  // 1.02 - Tablet medium scale
        'tablet-scale-lg': '1.05',                  // 1.05 - Tablet large scale
        'desktop-scale-xs': '1',                    // 1 - Desktop extra small scale
        'desktop-scale-sm': '1.02',                 // 1.02 - Desktop small scale
        'desktop-scale-md': '1.05',                 // 1.05 - Desktop medium scale
        'desktop-scale-lg': '1.1',                  // 1.1 - Desktop large scale
        
        // Modern responsive spacing
        'mobile-rotate-xs': '1deg',                  // 1deg - Mobile extra small rotate
        'mobile-rotate-sm': '2deg',                  // 2deg - Mobile small rotate
        'mobile-rotate-md': '3deg',                  // 3deg - Mobile medium rotate
        'mobile-rotate-lg': '5deg',                  // 5deg - Mobile large rotate
        'tablet-rotate-xs': '2deg',                  // 2deg - Tablet extra small rotate
        'tablet-rotate-sm': '3deg',                  // 3deg - Tablet small rotate
        'tablet-rotate-md': '5deg',                  // 5deg - Tablet medium rotate
        'tablet-rotate-lg': '7deg',                  // 7deg - Tablet large rotate
        'desktop-rotate-xs': '3deg',                 // 3deg - Desktop extra small rotate
        'desktop-rotate-sm': '5deg',                 // 5deg - Desktop small rotate
        'desktop-rotate-md': '7deg',                 // 7deg - Desktop medium rotate
        'desktop-rotate-lg': '10deg',                // 10deg - Desktop large rotate
        
        // Modern responsive spacing
        'mobile-translate-xs': '0.25rem',            // 4px - Mobile extra small translate
        'mobile-translate-sm': '0.5rem',             // 8px - Mobile small translate
        'mobile-translate-md': '0.75rem',            // 12px - Mobile medium translate
        'mobile-translate-lg': '1rem',               // 16px - Mobile large translate
        'tablet-translate-xs': '0.5rem',             // 8px - Tablet extra small translate
        'tablet-translate-sm': '0.75rem',            // 12px - Tablet small translate
        'tablet-translate-md': '1rem',               // 16px - Tablet medium translate
        'tablet-translate-lg': '1.5rem',             // 24px - Tablet large translate
        'desktop-translate-xs': '0.75rem',           // 12px - Desktop extra small translate
        'desktop-translate-sm': '1rem',              // 16px - Desktop small translate
        'desktop-translate-md': '1.5rem',            // 24px - Desktop medium translate
        'desktop-translate-lg': '2rem',              // 32px - Desktop large translate
        
        // Modern responsive spacing
        'mobile-skew-xs': '1deg',                    // 1deg - Mobile extra small skew
        'mobile-skew-sm': '2deg',                    // 2deg - Mobile small skew
        'mobile-skew-md': '3deg',                    // 3deg - Mobile medium skew
        'mobile-skew-lg': '5deg',                    // 5deg - Mobile large skew
        'tablet-skew-xs': '2deg',                    // 2deg - Tablet extra small skew
        'tablet-skew-sm': '3deg',                    // 3deg - Tablet small skew
        'tablet-skew-md': '5deg',                    // 5deg - Tablet medium skew
        'tablet-skew-lg': '7deg',                    // 7deg - Tablet large skew
        'desktop-skew-xs': '3deg',                   // 3deg - Desktop extra small skew
        'desktop-skew-sm': '5deg',                   // 5deg - Desktop small skew
        'desktop-skew-md': '7deg',                   // 7deg - Desktop medium skew
        'desktop-skew-lg': '10deg',                  // 10deg - Desktop large skew
        
        // Modern responsive spacing
        'mobile-opacity-xs': '0.1',                  // 0.1 - Mobile extra small opacity
        'mobile-opacity-sm': '0.25',                 // 0.25 - Mobile small opacity
        'mobile-opacity-md': '0.5',                  // 0.5 - Mobile medium opacity
        'mobile-opacity-lg': '0.75',                 // 0.75 - Mobile large opacity
        'tablet-opacity-xs': '0.25',                 // 0.25 - Tablet extra small opacity
        'tablet-opacity-sm': '0.5',                  // 0.5 - Tablet small opacity
        'tablet-opacity-md': '0.75',                 // 0.75 - Tablet medium opacity
        'tablet-opacity-lg': '0.9',                  // 0.9 - Tablet large opacity
        'desktop-opacity-xs': '0.5',                 // 0.5 - Desktop extra small opacity
        'desktop-opacity-sm': '0.75',                // 0.75 - Desktop small opacity
        'desktop-opacity-md': '0.9',                 // 0.9 - Desktop medium opacity
        'desktop-opacity-lg': '1',                   // 1 - Desktop large opacity
        
        // Modern responsive spacing
        'mobile-z-xs': '0',                          // 0 - Mobile extra small z-index
        'mobile-z-sm': '10',                         // 10 - Mobile small z-index
        'mobile-z-md': '20',                         // 20 - Mobile medium z-index
        'mobile-z-lg': '30',                         // 30 - Mobile large z-index
        'tablet-z-xs': '10',                         // 10 - Tablet extra small z-index
        'tablet-z-sm': '20',                         // 20 - Tablet small z-index
        'tablet-z-md': '30',                         // 30 - Tablet medium z-index
        'tablet-z-lg': '40',                         // 40 - Tablet large z-index
        'desktop-z-xs': '20',                        // 20 - Desktop extra small z-index
        'desktop-z-sm': '30',                        // 30 - Desktop small z-index
        'desktop-z-md': '40',                        // 40 - Desktop medium z-index
        'desktop-z-lg': '50',                        // 50 - Desktop large z-index
        
        // Modern responsive spacing
        'mobile-order-xs': '0',                       // 0 - Mobile extra small order
        'mobile-order-sm': '1',                       // 1 - Mobile small order
        'mobile-order-md': '2',                       // 2 - Mobile medium order
        'mobile-order-lg': '3',                       // 3 - Mobile large order
        'tablet-order-xs': '1',                       // 1 - Tablet extra small order
        'tablet-order-sm': '2',                       // 2 - Tablet small order
        'tablet-order-md': '3',                       // 3 - Tablet medium order
        'tablet-order-lg': '4',                       // 4 - Tablet large order
        'desktop-order-xs': '2',                      // 2 - Desktop extra small order
        'desktop-order-sm': '3',                      // 3 - Desktop small order
        'desktop-order-md': '4',                      // 4 - Desktop medium order
        'desktop-order-lg': '5',                      // 5 - Desktop large order
        
        // Modern responsive spacing
        'mobile-flex-xs': '0',                        // 0 - Mobile extra small flex
        'mobile-flex-sm': '1',                        // 1 - Mobile small flex
        'mobile-flex-md': '2',                        // 2 - Mobile medium flex
        'mobile-flex-lg': '3',                        // 3 - Mobile large flex
        'tablet-flex-xs': '1',                        // 1 - Tablet extra small flex
        'tablet-flex-sm': '2',                        // 2 - Tablet small flex
        'tablet-flex-md': '3',                        // 3 - Tablet medium flex
        'tablet-flex-lg': '4',                        // 4 - Tablet large flex
        'desktop-flex-xs': '2',                       // 2 - Desktop extra small flex
        'desktop-flex-sm': '3',                       // 3 - Desktop small flex
        'desktop-flex-md': '4',                       // 4 - Desktop medium flex
        'desktop-flex-lg': '5',                       // 5 - Desktop large flex
        
        // Modern responsive spacing
        'mobile-grid-xs': '1',                        // 1 - Mobile extra small grid
        'mobile-grid-sm': '2',                        // 2 - Mobile small grid
        'mobile-grid-md': '3',                        // 3 - Mobile medium grid
        'mobile-grid-lg': '4',                        // 4 - Mobile large grid
        'tablet-grid-xs': '2',                        // 2 - Tablet extra small grid
        'tablet-grid-sm': '3',                        // 3 - Tablet small grid
        'tablet-grid-md': '4',                        // 4 - Tablet medium grid
        'tablet-grid-lg': '6',                        // 6 - Tablet large grid
        'desktop-grid-xs': '3',                       // 3 - Desktop extra small grid
        'desktop-grid-sm': '4',                       // 4 - Desktop small grid
        'desktop-grid-md': '6',                       // 6 - Desktop medium grid
        'desktop-grid-lg': '8',                       // 8 - Desktop large grid
        
        // Modern responsive spacing
        'mobile-col-span-xs': '1',                    // 1 - Mobile extra small col-span
        'mobile-col-span-sm': '2',                    // 2 - Mobile small col-span
        'mobile-col-span-md': '3',                    // 3 - Mobile medium col-span
        'mobile-col-span-lg': '4',                    // 4 - Mobile large col-span
        'tablet-col-span-xs': '2',                    // 2 - Tablet extra small col-span
        'tablet-col-span-sm': '3',                    // 3 - Tablet small col-span
        'tablet-col-span-md': '4',                    // 4 - Tablet medium col-span
        'tablet-col-span-lg': '6',                    // 6 - Tablet large col-span
        'desktop-col-span-xs': '3',                   // 3 - Desktop extra small col-span
        'desktop-col-span-sm': '4',                   // 4 - Desktop small col-span
        'desktop-col-span-md': '6',                   // 6 - Desktop medium col-span
        'desktop-col-span-lg': '8',                   // 8 - Desktop large col-span
        
        // Modern responsive spacing
        'mobile-row-span-xs': '1',                    // 1 - Mobile extra small row-span
        'mobile-row-span-sm': '2',                    // 2 - Mobile small row-span
        'mobile-row-span-md': '3',                    // 3 - Mobile medium row-span
        'mobile-row-span-lg': '4',                    // 4 - Mobile large row-span
        'tablet-row-span-xs': '2',                    // 2 - Tablet extra small row-span
        'tablet-row-span-sm': '3',                    // 3 - Tablet small row-span
        'tablet-row-span-md': '4',                    // 4 - Tablet medium row-span
        'tablet-row-span-lg': '6',                    // 6 - Tablet large row-span
        'desktop-row-span-xs': '3',                   // 3 - Desktop extra small row-span
        'desktop-row-span-sm': '4',                   // 4 - Desktop small row-span
        'desktop-row-span-md': '6',                   // 6 - Desktop medium row-span
        'desktop-row-span-lg': '8',                   // 8 - Desktop large row-span
        
        // Modern responsive spacing
        'mobile-aspect-xs': '1/1',                    // 1:1 - Mobile extra small aspect
        'mobile-aspect-sm': '4/3',                    // 4:3 - Mobile small aspect
        'mobile-aspect-md': '16/9',                   // 16:9 - Mobile medium aspect
        'mobile-aspect-lg': '21/9',                   // 21:9 - Mobile large aspect
        'tablet-aspect-xs': '4/3',                    // 4:3 - Tablet extra small aspect
        'tablet-aspect-sm': '16/9',                   // 16:9 - Tablet small aspect
        'tablet-aspect-md': '21/9',                   // 21:9 - Tablet medium aspect
        'tablet-aspect-lg': '32/9',                   // 32:9 - Tablet large aspect
        'desktop-aspect-xs': '16/9',                  // 16:9 - Desktop extra small aspect
        'desktop-aspect-sm': '21/9',                  // 21:9 - Desktop small aspect
        'desktop-aspect-md': '32/9',                  // 32:9 - Desktop medium aspect
        'desktop-aspect-lg': '43/9',                  // 43:9 - Desktop large aspect
        
        // Modern responsive spacing
        'mobile-min-h-xs': '2rem',                    // 32px - Mobile extra small min-height
        'mobile-min-h-sm': '4rem',                    // 64px - Mobile small min-height
        'mobile-min-h-md': '6rem',                    // 96px - Mobile medium min-height
        'mobile-min-h-lg': '8rem',                    // 128px - Mobile large min-height
        'tablet-min-h-xs': '4rem',                    // 64px - Tablet extra small min-height
        'tablet-min-h-sm': '6rem',                    // 96px - Tablet small min-height
        'tablet-min-h-md': '8rem',                    // 128px - Tablet medium min-height
        'tablet-min-h-lg': '10rem',                   // 160px - Tablet large min-height
        'desktop-min-h-xs': '6rem',                   // 96px - Desktop extra small min-height
        'desktop-min-h-sm': '8rem',                   // 128px - Desktop small min-height
        'desktop-min-h-md': '10rem',                  // 160px - Desktop medium min-height
        'desktop-min-h-lg': '12rem',                  // 192px - Desktop large min-height
        
        // Modern responsive spacing
        'mobile-max-h-xs': '4rem',                    // 64px - Mobile extra small max-height
        'mobile-max-h-sm': '6rem',                    // 96px - Mobile small max-height
        'mobile-max-h-md': '8rem',                    // 128px - Mobile medium max-height
        'mobile-max-h-lg': '10rem',                   // 160px - Mobile large max-height
        'tablet-max-h-xs': '6rem',                    // 96px - Tablet extra small max-height
        'tablet-max-h-sm': '8rem',                    // 128px - Tablet small max-height
        'tablet-max-h-md': '10rem',                   // 160px - Tablet medium max-height
        'tablet-max-h-lg': '12rem',                   // 192px - Tablet large max-height
        'desktop-max-h-xs': '8rem',                   // 128px - Desktop extra small max-height
        'desktop-max-h-sm': '10rem',                  // 160px - Desktop small max-height
        'desktop-max-h-md': '12rem',                  // 192px - Desktop medium max-height
        'desktop-max-h-lg': '16rem',                  // 256px - Desktop large max-height
        
        // Modern responsive spacing
        'mobile-min-w-xs': '2rem',                    // 32px - Mobile extra small min-width
        'mobile-min-w-sm': '4rem',                    // 64px - Mobile small min-width
        'mobile-min-w-md': '6rem',                    // 96px - Mobile medium min-width
        'mobile-min-w-lg': '8rem',                    // 128px - Mobile large min-width
        'tablet-min-w-xs': '4rem',                    // 64px - Tablet extra small min-width
        'tablet-min-w-sm': '6rem',                    // 96px - Tablet small min-width
        'tablet-min-w-md': '8rem',                    // 128px - Tablet medium min-width
        'tablet-min-w-lg': '10rem',                   // 160px - Tablet large min-width
        'desktop-min-w-xs': '6rem',                   // 96px - Desktop extra small min-width
        'desktop-min-w-sm': '8rem',                   // 128px - Desktop small min-width
        'desktop-min-w-md': '10rem',                  // 160px - Desktop medium min-width
        'desktop-min-w-lg': '12rem',                  // 192px - Desktop large min-width
        
        // Modern responsive spacing
        'mobile-max-w-xs': '4rem',                    // 64px - Mobile extra small max-width
        'mobile-max-w-sm': '6rem',                    // 96px - Mobile small max-width
        'mobile-max-w-md': '8rem',                    // 128px - Mobile medium max-width
        'mobile-max-w-lg': '10rem',                   // 160px - Mobile large max-width
        'tablet-max-w-xs': '6rem',                    // 96px - Tablet extra small max-width
        'tablet-max-w-sm': '8rem',                    // 128px - Tablet small max-width
        'tablet-max-w-md': '10rem',                   // 160px - Tablet medium max-width
        'tablet-max-w-lg': '12rem',                   // 192px - Tablet large max-width
        'desktop-max-w-xs': '8rem',                   // 128px - Desktop extra small max-width
        'desktop-max-w-sm': '10rem',                  // 160px - Desktop small max-width
        'desktop-max-w-md': '12rem',                  // 192px - Desktop medium max-width
        'desktop-max-w-lg': '16rem',                  // 256px - Desktop large max-width
        
        // Modern responsive spacing
        'mobile-top-xs': '0.25rem',                   // 4px - Mobile extra small top
        'mobile-top-sm': '0.5rem',                    // 8px - Mobile small top
        'mobile-top-md': '0.75rem',                   // 12px - Mobile medium top
        'mobile-top-lg': '1rem',                      // 16px - Mobile large top
        'tablet-top-xs': '0.5rem',                    // 8px - Tablet extra small top
        'tablet-top-sm': '0.75rem',                   // 12px - Tablet small top
        'tablet-top-md': '1rem',                      // 16px - Tablet medium top
        'tablet-top-lg': '1.5rem',                    // 24px - Tablet large top
        'desktop-top-xs': '0.75rem',                  // 12px - Desktop extra small top
        'desktop-top-sm': '1rem',                     // 16px - Desktop small top
        'desktop-top-md': '1.5rem',                   // 24px - Desktop medium top
        'desktop-top-lg': '2rem',                     // 32px - Desktop large top
        
        // Modern responsive spacing
        'mobile-right-xs': '0.25rem',                 // 4px - Mobile extra small right
        'mobile-right-sm': '0.5rem',                  // 8px - Mobile small right
        'mobile-right-md': '0.75rem',                 // 12px - Mobile medium right
        'mobile-right-lg': '1rem',                    // 16px - Mobile large right
        'tablet-right-xs': '0.5rem',                  // 8px - Tablet extra small right
        'tablet-right-sm': '0.75rem',                 // 12px - Tablet small right
        'tablet-right-md': '1rem',                    // 16px - Tablet medium right
        'tablet-right-lg': '1.5rem',                  // 24px - Tablet large right
        'desktop-right-xs': '0.75rem',                // 12px - Desktop extra small right
        'desktop-right-sm': '1rem',                   // 16px - Desktop small right
        'desktop-right-md': '1.5rem',                 // 24px - Desktop medium right
        'desktop-right-lg': '2rem',                   // 32px - Desktop large right
        
        // Modern responsive spacing
        'mobile-bottom-xs': '0.25rem',                // 4px - Mobile extra small bottom
        'mobile-bottom-sm': '0.5rem',                 // 8px - Mobile small bottom
        'mobile-bottom-md': '0.75rem',                // 12px - Mobile medium bottom
        'mobile-bottom-lg': '1rem',                   // 16px - Mobile large bottom
        'tablet-bottom-xs': '0.5rem',                 // 8px - Tablet extra small bottom
        'tablet-bottom-sm': '0.75rem',                // 12px - Tablet small bottom
        'tablet-bottom-md': '1rem',                   // 16px - Tablet medium bottom
        'tablet-bottom-lg': '1.5rem',                 // 24px - Tablet large bottom
        'desktop-bottom-xs': '0.75rem',               // 12px - Desktop extra small bottom
        'desktop-bottom-sm': '1rem',                  // 16px - Desktop small bottom
        'desktop-bottom-md': '1.5rem',                // 24px - Desktop medium bottom
        'desktop-bottom-lg': '2rem',                  // 32px - Desktop large bottom
        
        // Modern responsive spacing
        'mobile-left-xs': '0.25rem',                  // 4px - Mobile extra small left
        'mobile-left-sm': '0.5rem',                   // 8px - Mobile small left
        'mobile-left-md': '0.75rem',                  // 12px - Mobile medium left
        'mobile-left-lg': '1rem',                     // 16px - Mobile large left
        'tablet-left-xs': '0.5rem',                   // 8px - Tablet extra small left
        'tablet-left-sm': '0.75rem',                  // 12px - Tablet small left
        'tablet-left-md': '1rem',                     // 16px - Tablet medium left
        'tablet-left-lg': '1.5rem',                   // 24px - Tablet large left
        'desktop-left-xs': '0.75rem',                 // 12px - Desktop extra small left
        'desktop-left-sm': '1rem',                    // 16px - Desktop small left
        'desktop-left-md': '1.5rem',                  // 24px - Desktop medium left
        'desktop-left-lg': '2rem',                    // 32px - Desktop large left
        
        // Modern responsive spacing
        'mobile-inset-xs': '0.25rem',                 // 4px - Mobile extra small inset
        'mobile-inset-sm': '0.5rem',                  // 8px - Mobile small inset
        'mobile-inset-md': '0.75rem',                 // 12px - Mobile medium inset
        'mobile-inset-lg': '1rem',                    // 16px - Mobile large inset
        'tablet-inset-xs': '0.5rem',                  // 8px - Tablet extra small inset
        'tablet-inset-sm': '0.75rem',                 // 12px - Tablet small inset
        'tablet-inset-md': '1rem',                    // 16px - Tablet medium inset
        'tablet-inset-lg': '1.5rem',                  // 24px - Tablet large inset
        'desktop-inset-xs': '0.75rem',                // 12px - Desktop extra small inset
        'desktop-inset-sm': '1rem',                   // 16px - Desktop small inset
        'desktop-inset-md': '1.5rem',                 // 24px - Desktop medium inset
        'desktop-inset-lg': '2rem',                   // 32px - Desktop large inset
        
        // Modern responsive spacing
        'mobile-inset-x-xs': '0.25rem',               // 4px - Mobile extra small inset-x
        'mobile-inset-x-sm': '0.5rem',                // 8px - Mobile small inset-x
        'mobile-inset-x-md': '0.75rem',               // 12px - Mobile medium inset-x
        'mobile-inset-x-lg': '1rem',                  // 16px - Mobile large inset-x
        'tablet-inset-x-xs': '0.5rem',                // 8px - Tablet extra small inset-x
        'tablet-inset-x-sm': '0.75rem',               // 12px - Tablet small inset-x
        'tablet-inset-x-md': '1rem',                  // 16px - Tablet medium inset-x
        'tablet-inset-x-lg': '1.5rem',                // 24px - Tablet large inset-x
        'desktop-inset-x-xs': '0.75rem',              // 12px - Desktop extra small inset-x
        'desktop-inset-x-sm': '1rem',                 // 16px - Desktop small inset-x
        'desktop-inset-x-md': '1.5rem',               // 24px - Desktop medium inset-x
        'desktop-inset-x-lg': '2rem',                 // 32px - Desktop large inset-x
        
        // Modern responsive spacing
        'mobile-inset-y-xs': '0.25rem',               // 4px - Mobile extra small inset-y
        'mobile-inset-y-sm': '0.5rem',                // 8px - Mobile small inset-y
        'mobile-inset-y-md': '0.75rem',               // 12px - Mobile medium inset-y
        'mobile-inset-y-lg': '1rem',                  // 16px - Mobile large inset-y
        'tablet-inset-y-xs': '0.5rem',                // 8px - Tablet extra small inset-y
        'tablet-inset-y-sm': '0.75rem',               // 12px - Tablet small inset-y
        'tablet-inset-y-md': '1rem',                  // 16px - Tablet medium inset-y
        'tablet-inset-y-lg': '1.5rem',                // 24px - Tablet large inset-y
        'desktop-inset-y-xs': '0.75rem',              // 12px - Desktop extra small inset-y
        'desktop-inset-y-sm': '1rem',                 // 16px - Desktop small inset-y
        'desktop-inset-y-md': '1.5rem',               // 24px - Desktop medium inset-y
        'desktop-inset-y-lg': '2rem',                 // 32px - Desktop large inset-y
        
        // Modern responsive spacing
        'mobile-inset-t-xs': '0.25rem',               // 4px - Mobile extra small inset-t
        'mobile-inset-t-sm': '0.5rem',                // 8px - Mobile small inset-t
        'mobile-inset-t-md': '0.75rem',               // 12px - Mobile medium inset-t
        'mobile-inset-t-lg': '1rem',                  // 16px - Mobile large inset-t
        'tablet-inset-t-xs': '0.5rem',                // 8px - Tablet extra small inset-t
        'tablet-inset-t-sm': '0.75rem',               // 12px - Tablet small inset-t
        'tablet-inset-t-md': '1rem',                  // 16px - Tablet medium inset-t
        'tablet-inset-t-lg': '1.5rem',                // 24px - Tablet large inset-t
        'desktop-inset-t-xs': '0.75rem',              // 12px - Desktop extra small inset-t
        'desktop-inset-t-sm': '1rem',                 // 16px - Desktop small inset-t
        'desktop-inset-t-md': '1.5rem',               // 24px - Desktop medium inset-t
        'desktop-inset-t-lg': '2rem',                 // 32px - Desktop large inset-t
        
        // Modern responsive spacing
        'mobile-inset-r-xs': '0.25rem',               // 4px - Mobile extra small inset-r
        'mobile-inset-r-sm': '0.5rem',                // 8px - Mobile small inset-r
        'mobile-inset-r-md': '0.75rem',               // 12px - Mobile medium inset-r
        'mobile-inset-r-lg': '1rem',                  // 16px - Mobile large inset-r
        'tablet-inset-r-xs': '0.5rem',                // 8px - Tablet extra small inset-r
        'tablet-inset-r-sm': '0.75rem',               // 12px - Tablet small inset-r
        'tablet-inset-r-md': '1rem',                  // 16px - Tablet medium inset-r
        'tablet-inset-r-lg': '1.5rem',                // 24px - Tablet large inset-r
        'desktop-inset-r-xs': '0.75rem',              // 12px - Desktop extra small inset-r
        'desktop-inset-r-sm': '1rem',                 // 16px - Desktop small inset-r
        'desktop-inset-r-md': '1.5rem',               // 24px - Desktop medium inset-r
        'desktop-inset-r-lg': '2rem',                 // 32px - Desktop large inset-r
        
        // Modern responsive spacing
        'mobile-inset-b-xs': '0.25rem',               // 4px - Mobile extra small inset-b
        'mobile-inset-b-sm': '0.5rem',                // 8px - Mobile small inset-b
        'mobile-inset-b-md': '0.75rem',               // 12px - Mobile medium inset-b
        'mobile-inset-b-lg': '1rem',                  // 16px - Mobile large inset-b
        'tablet-inset-b-xs': '0.5rem',                // 8px - Tablet extra small inset-b
        'tablet-inset-b-sm': '0.75rem',               // 12px - Tablet small inset-b
        'tablet-inset-b-md': '1rem',                  // 16px - Tablet medium inset-b
        'tablet-inset-b-lg': '1.5rem',                // 24px - Tablet large inset-b
        'desktop-inset-b-xs': '0.75rem',              // 12px - Desktop extra small inset-b
        'desktop-inset-b-sm': '1rem',                 // 16px - Desktop small inset-b
        'desktop-inset-b-md': '1.5rem',               // 24px - Desktop medium inset-b
        'desktop-inset-b-lg': '2rem',                 // 32px - Desktop large inset-b
        
        // Modern responsive spacing
        'mobile-inset-l-xs': '0.25rem',               // 4px - Mobile extra small inset-l
        'mobile-inset-l-sm': '0.5rem',                // 8px - Mobile small inset-l
        'mobile-inset-l-md': '0.75rem',               // 12px - Mobile medium inset-l
        'mobile-inset-l-lg': '1rem',                  // 16px - Mobile large inset-l
        'tablet-inset-l-xs': '0.5rem',                // 8px - Tablet extra small inset-l
        'tablet-inset-l-sm': '0.75rem',               // 12px - Tablet small inset-l
        'tablet-inset-l-md': '1rem',                  // 16px - Tablet medium inset-l
        'tablet-inset-l-lg': '1.5rem',                // 24px - Tablet large inset-l
        'desktop-inset-l-xs': '0.75rem',              // 12px - Desktop extra small inset-l
        'desktop-inset-l-sm': '1rem',                 // 16px - Desktop small inset-l
        'desktop-inset-l-md': '1.5rem',               // 24px - Desktop medium inset-l
        'desktop-inset-l-lg': '2rem',                 // 32px - Desktop large inset-l
        
        // Modern responsive spacing
        'mobile-inset-t-xs': '0.25rem',               // 4px - Mobile extra small inset-t
        'mobile-inset-t-sm': '0.5rem',                // 8px - Mobile small inset-t
        'mobile-inset-t-md': '0.75rem',               // 12px - Mobile medium inset-t
        'mobile-inset-t-lg': '1rem',                  // 16px - Mobile large inset-t
        'tablet-inset-t-xs': '0.5rem',                // 8px - Tablet extra small inset-t
        'tablet-inset-t-sm': '0.75rem',               // 12px - Tablet small inset-t
        'tablet-inset-t-md': '1rem',                  // 16px - Tablet medium inset-t
        'tablet-inset-t-lg': '1.5rem',                // 24px - Tablet large inset-t
        'desktop-inset-t-xs': '0.75rem',              // 12px - Desktop extra small inset-t
        'desktop-inset-t-sm': '1rem',                 // 16px - Desktop small inset-t
        'desktop-inset-t-md': '1.5rem',               // 24px - Desktop medium inset-t
        'desktop-inset-t-lg': '2rem',                 // 32px - Desktop large inset-t
        
        // Modern responsive spacing
        'mobile-inset-r-xs': '0.25rem',               // 4px - Mobile extra small inset-r
        'mobile-inset-r-sm': '0.5rem',                // 8px - Mobile small inset-r
        'mobile-inset-r-md': '0.75rem',               // 12px - Mobile medium inset-r
        'mobile-inset-r-lg': '1rem',                  // 16px - Mobile large inset-r
        'tablet-inset-r-xs': '0.5rem',                // 8px - Tablet extra small inset-r
        'tablet-inset-r-sm': '0.75rem',               // 12px - Tablet small inset-r
        'tablet-inset-r-md': '1rem',                  // 16px - Tablet medium inset-r
        'tablet-inset-r-lg': '1.5rem',                // 24px - Tablet large inset-r
        'desktop-inset-r-xs': '0.75rem',              // 12px - Desktop extra small inset-r
        'desktop-inset-r-sm': '1rem',                 // 16px - Desktop small inset-r
        'desktop-inset-r-md': '1.5rem',               // 24px - Desktop medium inset-r
        'desktop-inset-r-lg': '2rem',                 // 32px - Desktop large inset-r
        
        // Modern responsive spacing
        'mobile-inset-b-xs': '0.25rem',               // 4px - Mobile extra small inset-b
        'mobile-inset-b-sm': '0.5rem',                // 8px - Mobile small inset-b
        'mobile-inset-b-md': '0.75rem',               // 12px - Mobile medium inset-b
        'mobile-inset-b-lg': '1rem',                  // 16px - Mobile large inset-b
        'tablet-inset-b-xs': '0.5rem',                // 8px - Tablet extra small inset-b
        'tablet-inset-b-sm': '0.75rem',               // 12px - Tablet small inset-b
        'tablet-inset-b-md': '1rem',                  // 16px - Tablet medium inset-b
        'tablet-inset-b-lg': '1.5rem',                // 24px - Tablet large inset-b
        'desktop-inset-b-xs': '0.75rem',              // 12px - Desktop extra small inset-b
        'desktop-inset-b-sm': '1rem',                 // 16px - Desktop small inset-b
        'desktop-inset-b-md': '1.5rem',               // 24px - Desktop medium inset-b
        'desktop-inset-b-lg': '2rem',                 // 32px - Desktop large inset-b
        
        // Modern responsive spacing
        'mobile-inset-l-xs': '0.25rem',               // 4px - Mobile extra small inset-l
        'mobile-inset-l-sm': '0.5rem',                // 8px - Mobile small inset-l
        'mobile-inset-l-md': '0.75rem',               // 12px - Mobile medium inset-l
        'mobile-inset-l-lg': '1rem',                  // 16px - Mobile large inset-l
        'tablet-inset-l-xs': '0.5rem',                // 8px - Tablet extra small inset-l
        'tablet-inset-l-sm': '0.75rem',               // 12px - Tablet small inset-l
        'tablet-inset-l-md': '1rem',                  // 16px - Tablet medium inset-l
        'tablet-inset-l-lg': '1.5rem',                // 24px - Tablet large inset-l
        'desktop-inset-l-xs': '0.75rem',              // 12px - Desktop extra small inset-l
        'desktop-inset-l-sm': '1rem',                 // 16px - Desktop small inset-l
        'desktop-inset-l-md': '1.5rem',               // 24px - Desktop medium inset-l
        'desktop-inset-l-lg': '2rem',                 // 32px - Desktop large inset-l
        
        // Modern responsive spacing
        'mobile-inset-t-xs': '0.25rem',               // 4px - Mobile extra small inset-t
        'mobile-inset-t-sm': '0.5rem',                // 8px - Mobile small inset-t
        'mobile-inset-t-md': '0.75rem',               // 12px - Mobile medium inset-t
        'mobile-inset-t-lg': '1rem',                  // 16px - Mobile large inset-t
        'tablet-inset-t-xs': '0.5rem',                // 8px - Tablet extra small inset-t
        'tablet-inset-t-sm': '0.75rem',               // 12px - Tablet small inset-t
        'tablet-inset-t-md': '1rem',                  // 16px - Tablet medium inset-t
        'tablet-inset-t-lg': '1.5rem',                // 24px - Tablet large inset-t
        'desktop-inset-t-xs': '0.75rem',              // 12px - Desktop extra small inset-t
        'desktop-inset-t-sm': '1rem',                 // 16px - Desktop small inset-t
        'desktop-inset-t-md': '1.5rem',               // 24px - Desktop medium inset-t
        'desktop-inset-t-lg': '2rem',                 // 32px - Desktop large inset-t
        
        // Modern responsive spacing
        'mobile-inset-r-xs': '0.25rem',               // 4px - Mobile extra small inset-r
        'mobile-inset-r-sm': '0.5rem',                // 8px - Mobile small inset-r
        'mobile-inset-r-md': '0.75rem',               // 12px - Mobile medium inset-r
        'mobile-inset-r-lg': '1rem',                  // 16px - Mobile large inset-r
        'tablet-inset-r-xs': '0.5rem',                // 8px - Tablet extra small inset-r
        'tablet-inset-r-sm': '0.75rem',               // 12px - Tablet small inset-r
        'tablet-inset-r-md': '1rem',                  // 16px - Tablet medium inset-r
        'tablet-inset-r-lg': '1.5rem',                // 24px - Tablet large inset-r
        'desktop-inset-r-xs': '0.75rem',              // 12px - Desktop extra small inset-r
        'desktop-inset-r-sm': '1rem',                 // 16px - Desktop small inset-r
        'desktop-inset-r-md': '1.5rem',               // 24px - Desktop medium inset-r
        'desktop-inset-r-lg': '2rem',                 // 32px - Desktop large inset-r
        
        // Modern responsive spacing
        'mobile-inset-b-xs': '0.25rem',               // 4px - Mobile extra small inset-b
        'mobile-inset-b-sm': '0.5rem',                // 8px - Mobile small inset-b
        'mobile-inset-b-md': '0.75rem',               // 12px - Mobile medium inset-b
        'mobile-inset-b-lg': '1rem',                  // 16px - Mobile large inset-b
        'tablet-inset-b-xs': '0.5rem',                // 8px - Tablet extra small inset-b
        'tablet-inset-b-sm': '0.75rem',               // 12px - Tablet small inset-b
        'tablet-inset-b-md': '1rem',                  // 16px - Tablet medium inset-b
        'tablet-inset-b-lg': '1.5rem',                // 24px - Tablet large inset-b
        'desktop-inset-b-xs': '0.75rem',              // 12px - Desktop extra small inset-b
        'desktop-inset-b-sm': '1rem',                 // 16px - Desktop small inset-b
        'desktop-inset-b-md': '1.5rem',               // 24px - Desktop medium inset-b
        'desktop-inset-b-lg': '2rem',                 // 32px - Desktop large inset-b
        
        // Modern responsive spacing
        'mobile-inset-l-xs': '0.25rem',               // 4px - Mobile extra small inset-l
        'mobile-inset-l-sm': '0.5rem',                // 8px - Mobile small inset-l
        'mobile-inset-l-md': '0.75rem',               // 12px - Mobile medium inset-l
        'mobile-inset-l-lg': '1rem',                  // 16px - Mobile large inset-l
        'tablet-inset-l-xs': '0.5rem',                // 8px - Tablet extra small inset-l
        'tablet-inset-l-sm': '0.75rem',               // 12px - Tablet small inset-l
        'tablet-inset-l-md': '1rem',                  // 16px - Tablet medium inset-l
        'tablet-inset-l-lg': '1.5rem',                // 24px - Tablet large inset-l
        'desktop-inset-l-xs': '0.75rem',              // 12px - Desktop extra small inset-l
        'desktop-inset-l-sm': '1rem',                 // 16px - Desktop small inset-l
        'desktop-inset-l-md': '1.5rem',               // 24px - Desktop medium inset-l
        'desktop-inset-l-lg': '2rem',                 // 32px - Desktop large inset-l
        
        // Modern responsive spacing
        'mobile-inset-t-xs': '0.25rem',               // 4px - Mobile extra small inset-t
        'mobile-inset-t-sm': '0.5rem',                // 8px - Mobile small inset-t
        'mobile-inset-t-md': '0.75rem',               // 12px - Mobile medium inset-t
        'mobile-inset-t-lg': '1rem',                  // 16px - Mobile large inset-t
        'tablet-inset-t-xs': '0.5rem',                // 8px - Tablet extra small inset-t
        'tablet-inset-t-sm': '0.75rem',               // 12px - Tablet small inset-t
        'tablet-inset-t-md': '1rem',                  // 16px - Tablet medium inset-t
        'tablet-inset-t-lg': '1.5rem',                // 24px - Tablet large inset-t
        'desktop-inset-t-xs': '0.75rem',              // 12px - Desktop extra small inset-t
        'desktop-inset-t-sm': '1rem',                 // 16px - Desktop small inset-t
        'desktop-inset-t-md': '1.5rem',               // 24px - Desktop medium inset-t
        'desktop-inset-t-lg': '2rem',                 // 32px - Desktop large inset-t
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
        
        // Modern shadows (2024-2025 trends)
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-strong': '0 8px 32px rgba(31, 38, 135, 0.37), 0 4px 16px rgba(31, 38, 135, 0.37)',
        'glass-strongest': '0 8px 32px rgba(31, 38, 135, 0.37), 0 4px 16px rgba(31, 38, 135, 0.37), 0 2px 8px rgba(31, 38, 135, 0.37)',
        
        // Modern component shadows
        'button-modern': '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
        'card-modern': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'modal-modern': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'dropdown-modern': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        
        // Modern hover effects
        'hover-subtle': '0 8px 25px rgba(0, 0, 0, 0.15)',
        'hover-medium': '0 10px 40px rgba(0, 0, 0, 0.2)',
        'hover-strong': '0 20px 60px rgba(0, 0, 0, 0.25)',
        
        // Modern glow effects
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.5)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        // Modern animations (2024-2025 trends)
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'pulse-soft': 'pulseSoft 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        
        // Modern micro-interactions
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gradient': 'pulseGradient 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'rotate-in': 'rotateIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        
        // Modern keyframes (2024-2025 trends)
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        rotateIn: {
          '0%': { transform: 'rotate(-180deg) scale(0.8)', opacity: '0' },
          '100%': { transform: 'rotate(0deg) scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        
        // Modern gradients (2024-2025 trends)
        'gradient-primary': 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
        
        // Modern multi-color gradients
        'gradient-sunset': 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
        'gradient-forest': 'linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%)',
        'gradient-fire': 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
        'gradient-aurora': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        
        // Glassmorphism backgrounds
        'glass-primary': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
}
