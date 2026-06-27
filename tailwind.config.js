/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#111827',
          50: '#1E293B',
          100: '#1F2937',
          200: '#374151',
        },
        primary: {
          DEFAULT: '#8B5CF6',
          50: '#C4B5FD',
          100: '#A78BFA',
          200: '#7C3AED',
          300: '#6D28D9',
        },
        secondary: {
          DEFAULT: '#06B6D4',
          50: '#67E8F9',
          100: '#22D3EE',
          200: '#0891B2',
        },
        success: {
          DEFAULT: '#10B981',
          50: '#6EE7B7',
          100: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FCD34D',
          100: '#FBBF24',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FCA5A5',
          100: '#F87171',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
