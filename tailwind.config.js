/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        tsm: {
          navy: {
            50:  '#f0f2f7',
            100: '#dde3ef',
            200: '#b9c5df',
            300: '#8ba1cb',
            400: '#6079b4',
            500: '#3d5a9c',
            600: '#2d4580',
            700: '#1d3066',
            800: '#0f1e4d',
            900: '#0a1435',
            950: '#060b22',
          },
          red: {
            50:  '#fff2f2',
            100: '#ffe1e1',
            200: '#ffc7c7',
            300: '#ff9e9e',
            400: '#ff6363',
            500: '#ff2d2d',
            600: '#e01010',
            700: '#c00b0b',
            800: '#9f0d0d',
            900: '#841212',
          },
          gray: {
            50:  '#f8f9fa',
            100: '#f1f3f5',
            200: '#e9ecef',
            300: '#dee2e6',
            400: '#ced4da',
            500: '#adb5bd',
            600: '#6c757d',
            700: '#495057',
            800: '#343a40',
            900: '#212529',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #060b22 0%, #0f1e4d 50%, #1d3066 100%)',
        'card-gradient': 'linear-gradient(180deg, transparent 60%, rgba(6,11,34,0.85) 100%)',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.16)',
        'btn': '0 4px 15px rgba(224, 16, 16, 0.35)',
        'navbar': '0 2px 20px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'slide-in-right': 'slideInRight 0.3s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
