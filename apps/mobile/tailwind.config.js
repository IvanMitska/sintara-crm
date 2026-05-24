/** @type {import('tailwindcss').Config} */
// Token parity with apps/frontend/src/app/globals.css (ТЗ §6).
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a12',
          raised: '#0d0d18',
          card: 'rgba(18,18,28,0.7)',
          cardLight: 'rgba(22,22,42,0.6)',
          sidebar: 'rgba(12,12,20,0.85)',
          strong: 'rgba(15,15,25,0.9)',
        },
        text: {
          primary: '#f5f5f7',
          secondary: 'rgba(245,245,247,0.72)',
          muted: 'rgba(245,245,247,0.55)',
          disabled: 'rgba(245,245,247,0.35)',
        },
        primary: {
          500: '#8B5CF6',
          600: '#6366F1',
        },
        accent: {
          500: '#14B8A6',
          600: '#06B6D4',
        },
        purple: {
          500: '#A855F7',
        },
        pink: '#FF6B9D',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.12)',
        },
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
