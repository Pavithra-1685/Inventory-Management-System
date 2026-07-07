/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111827',
        secondary: '#374151',
        accent: '#D1D5DB',
        success: '#166534',
        danger: '#991B1B',
        warning: '#B45309',
        bg: '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px #111827',
        'brutal-sm': '2px 2px 0px #111827',
        'brutal-lg': '6px 6px 0px #111827',
        'brutal-xl': '8px 8px 0px #111827',
        'brutal-danger': '4px 4px 0px #991B1B',
        'brutal-success': '4px 4px 0px #166534',
        'brutal-warning': '4px 4px 0px #B45309',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
