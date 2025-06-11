/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  darkMode: 'class',
  safelist: [
    'text-secondary-900',
    'dark:text-secondary-100',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - Professional Blue Gradient
        primary: {
          50: '#eff6ff',   // Very light blue for backgrounds
          100: '#dbeafe',  // Light blue for hover states
          200: '#bfdbfe',  // Soft blue for borders
          300: '#93c5fd',  // Medium blue for secondary elements
          400: '#60a5fa',  // Bright blue for interactive elements
          500: '#3b82f6',  // Main brand blue (primary)
          600: '#2563eb',  // Darker blue for hover states
          700: '#1d4ed8',  // Deep blue for active states
          800: '#1e40af',  // Very dark blue for text
          900: '#1e3a8a',  // Darkest blue for emphasis
          950: '#172554',  // Ultra dark for dark mode
        },
        
        // Secondary Colors - Modern Slate/Gray
        secondary: {
          50: '#f8fafc',   // Almost white
          100: '#f1f5f9',  // Very light gray
          200: '#e2e8f0',  // Light gray for borders
          300: '#cbd5e1',  // Medium gray for disabled states
          400: '#94a3b8',  // Gray for secondary text
          500: '#64748b',  // Main secondary gray
          600: '#475569',  // Darker gray for text
          700: '#334155',  // Dark gray for headings
          800: '#1e293b',  // Very dark gray
          900: '#0f172a',  // Almost black
          950: '#020617',  // Pure dark for dark mode
        },
        
        // Success Colors - Modern Green
        success: {
          50: '#f0fdf4',   // Very light green
          100: '#dcfce7',  // Light green for backgrounds
          200: '#bbf7d0',  // Soft green
          300: '#86efac',  // Medium green
          400: '#4ade80',  // Bright green
          500: '#22c55e',  // Main success green
          600: '#16a34a',  // Darker green for hover
          700: '#15803d',  // Deep green for active
          800: '#166534',  // Very dark green
          900: '#14532d',  // Darkest green
          950: '#052e16',  // Ultra dark green
        },
        
        // Warning Colors - Warm Orange
        warning: {
          50: '#fffbeb',   // Very light orange
          100: '#fef3c7',  // Light orange for backgrounds
          200: '#fde68a',  // Soft orange
          300: '#fcd34d',  // Medium orange
          400: '#fbbf24',  // Bright orange
          500: '#f59e0b',  // Main warning orange
          600: '#d97706',  // Darker orange for hover
          700: '#b45309',  // Deep orange for active
          800: '#92400e',  // Very dark orange
          900: '#78350f',  // Darkest orange
          950: '#451a03',  // Ultra dark orange
        },
        
        // Error Colors - Modern Red
        error: {
          50: '#fef2f2',   // Very light red
          100: '#fee2e2',  // Light red for backgrounds
          200: '#fecaca',  // Soft red
          300: '#fca5a5',  // Medium red
          400: '#f87171',  // Bright red
          500: '#ef4444',  // Main error red
          600: '#dc2626',  // Darker red for hover
          700: '#b91c1c',  // Deep red for active
          800: '#991b1b',  // Very dark red
          900: '#7f1d1d',  // Darkest red
          950: '#450a0a',  // Ultra dark red
        },
        
        // Accent Colors - Purple for Premium Features
        accent: {
          50: '#faf5ff',   // Very light purple
          100: '#f3e8ff',  // Light purple for backgrounds
          200: '#e9d5ff',  // Soft purple
          300: '#d8b4fe',  // Medium purple
          400: '#c084fc',  // Bright purple
          500: '#a855f7',  // Main accent purple
          600: '#9333ea',  // Darker purple for hover
          700: '#7c3aed',  // Deep purple for active
          800: '#6b21a8',  // Very dark purple
          900: '#581c87',  // Darkest purple
          950: '#3b0764',  // Ultra dark purple
        },
        
        // Info Colors - Cyan for Information
        info: {
          50: '#ecfeff',   // Very light cyan
          100: '#cffafe',  // Light cyan for backgrounds
          200: '#a5f3fc',  // Soft cyan
          300: '#67e8f9',  // Medium cyan
          400: '#22d3ee',  // Bright cyan
          500: '#06b6d4',  // Main info cyan
          600: '#0891b2',  // Darker cyan for hover
          700: '#0e7490',  // Deep cyan for active
          800: '#155e75',  // Very dark cyan
          900: '#164e63',  // Darkest cyan
          950: '#083344',  // Ultra dark cyan
        },
        
        // API Status Colors
        api: {
          public: '#22c55e',    // Green for public APIs
          private: '#f59e0b',   // Orange for private APIs
          template: '#06b6d4',  // Cyan for template-based
          schema: '#a855f7',    // Purple for schema-based
          active: '#22c55e',    // Green for active status
          inactive: '#94a3b8',  // Gray for inactive status
        },
        
        // Method Colors for HTTP Methods
        method: {
          get: '#22c55e',       // Green for GET
          post: '#3b82f6',      // Blue for POST
          put: '#f59e0b',       // Orange for PUT
          delete: '#ef4444',    // Red for DELETE
          patch: '#a855f7',     // Purple for PATCH
        },
      },
      
      // Enhanced Typography
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Monaco',
          'Cascadia Code',
          'Roboto Mono',
          'Consolas',
          'Courier New',
          'monospace'
        ],
      },
      
      // Enhanced Spacing System
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },
      
      // Enhanced Border Radius
      borderRadius: {
        '4xl': '2rem',    // 32px
        '5xl': '2.5rem',  // 40px
      },
      
      // Enhanced Box Shadows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.15)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.15)',
      },
      
      // Enhanced Animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};