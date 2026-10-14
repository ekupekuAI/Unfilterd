/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#12101F',
          50: '#1B1830',
          100: '#221E3A',
          200: '#2E2950',
        },
        primary: {
          DEFAULT: '#9D7CFF',
          50: '#D9CCFF',
          100: '#B9A2FF',
          200: '#8160F5',
          300: '#6A47E0',
        },
        secondary: {
          DEFAULT: '#FFA48C',
          50: '#FFD3C6',
          100: '#FFBBA6',
          200: '#F27F63',
        },
        ink: '#07060F',
        mint: '#6EE7C8',
        success: {
          DEFAULT: '#34D3A6',
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
