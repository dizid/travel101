/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Underlying Thai palette (scale) ─────────────────────────────
        // Keep these for backward compatibility with existing component code.
        'thai-gold': {
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
        },
        'thai-blue': {
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
        },
        'thai-teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'thai-coral': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },

        // ─── Semantic tokens (PRIMARY API — use these in new code) ────────
        // Brand — maps to thai-gold
        'brand': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // brand default
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#f59e0b',
        },
        // Brand deep — for depth, headings on light, hover states
        'brand-deep': '#b45309',

        // Text — warm blacks replacing gray-900
        'ink': '#1c1917',
        'ink-muted': '#57534e',
        'ink-faint': '#a8a29e',

        // Surfaces — warm off-white, replacing plain white
        'surface': '#fffbf5',
        'surface-raised': '#ffffff',
        'surface-sunk': '#f5f0e8',

        // Accents — semantic aliases over Thai palette
        'accent-warm': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          DEFAULT: '#f97316',
        },
        'accent-cool': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          DEFAULT: '#14b8a6',
        },
        'accent-royal': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          DEFAULT: '#2563eb',
        },

        // Borders — warm, replaces gray-200
        'edge': '#e7e0d4',
        'edge-strong': '#c9bfb0',

        // ─── Legacy semantic aliases (keep for existing .card-thai etc) ───
        primary: {
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
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },

      // ─── Font families ─────────────────────────────────────────────────
      fontFamily: {
        // New type system (semantic)
        display: ['Prompt', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        thai: ['Sarabun', 'Inter', 'system-ui', 'sans-serif'],
      },

      // ─── Type scale ────────────────────────────────────────────────────
      fontSize: {
        // Display scale
        'display-2xl': ['96px', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-xl':  ['72px', { lineHeight: '1',    letterSpacing: '-0.02em' }],
        'display-lg':  ['56px', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        // Heading scale
        'heading-xl': ['36px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'heading-lg': ['28px', { lineHeight: '1.2',  letterSpacing: '-0.005em' }],
        'heading-md': ['22px', { lineHeight: '1.3',  letterSpacing: '0' }],
        // Body scale
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'body':    ['16px', { lineHeight: '1.55' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
      },

      // ─── Border radius scale ───────────────────────────────────────────
      borderRadius: {
        // New semantic scale
        sm:   '6px',
        md:   '12px',
        lg:   '20px',
        xl:   '28px',
        pill: '999px',
        // Legacy aliases (keep — used in existing .card-thai etc)
        'thai':    '1rem',   // 16px
        'thai-lg': '1.5rem', // 24px
      },

      // ─── Shadow scale ──────────────────────────────────────────────────
      boxShadow: {
        // New semantic scale
        xs: '0 1px 2px 0 rgba(28, 25, 23, 0.05)',
        sm: '0 2px 4px 0 rgba(28, 25, 23, 0.06), 0 1px 2px -1px rgba(28, 25, 23, 0.04)',
        md: '0 4px 6px -1px rgba(28, 25, 23, 0.07), 0 2px 4px -2px rgba(28, 25, 23, 0.05)',
        lg: '0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.05)',
        'glow-warm': '0 0 24px 0 rgba(245, 158, 11, 0.25), 0 4px 14px 0 rgba(245, 158, 11, 0.15)',
        'glow-cool': '0 0 24px 0 rgba(20, 184, 166, 0.2), 0 4px 14px 0 rgba(20, 184, 166, 0.12)',
        // Legacy (keep — used in .card-thai, .btn-thai etc)
        'thai':    '0 4px 14px 0 rgba(245, 158, 11, 0.15)',
        'thai-lg': '0 10px 40px 0 rgba(245, 158, 11, 0.2)',
        'soft':    '0 2px 15px 0 rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 5px 30px 0 rgba(0, 0, 0, 0.08)',
      },

      // ─── Background images ─────────────────────────────────────────────
      backgroundImage: {
        'thai-pattern': "url('/patterns/thai-pattern.svg')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-thai': 'linear-gradient(135deg, #f59e0b 0%, #14b8a6 100%)',
        // Warm page gradient
        'surface-gradient': 'linear-gradient(160deg, #fffbf5 0%, #fffefa 50%, #f7fdfb 100%)',
      },

      // ─── Animations (unchanged) ────────────────────────────────────────
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'slide-down':'slideDown 0.3s ease-out',
        'scale-in':  'scaleIn 0.2s ease-out',
        'float':     'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },

      // ─── Spacing rhythm for sections ───────────────────────────────────
      spacing: {
        'section-sm': '4rem',    // 64px
        'section-md': '6rem',    // 96px
        'section-lg': '8rem',    // 128px
        'section-xl': '10rem',   // 160px
      },

      // ─── Z-index scale ─────────────────────────────────────────────────
      zIndex: {
        'base':    '0',
        'raised':  '10',
        'dropdown':'100',
        'sticky':  '200',
        'overlay': '300',
        'modal':   '400',
        'toast':   '500',
        'tooltip': '600',
      },
    },
  },
  plugins: [],
}
