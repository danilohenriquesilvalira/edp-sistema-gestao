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
        // Cores da EDP Portugal
        edp: {
          primary: {
            purple: '#32127A', // Roxo EDP
            green: '#A4D233',  // Verde EDP
            blue: '#00ACEB',   // Azul EDP
            DEFAULT: '#32127A', // Cor principal
          },
          secondary: {
            red: '#FF0039',     // Vermelho para alertas
            orange: '#FF9114',  // Laranja para warnings
            yellow: '#FFBE00',  // Amarelo para notas
            DEFAULT: '#00ACEB', // Cor secundária
          },
          neutral: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
            950: '#020617',
          },
        },
        primary: {
          50: '#eff6ff',
          100: '#dbe9fe',
          200: '#bfdaff',
          300: '#93c5fe',
          400: '#60a7fc',
          500: '#3b82f7',
          600: '#2461ee',
          700: '#1c4fd8',
          800: '#1e41af',
          900: '#1d3a8a',
          950: '#162555',
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
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'edp': '0 10px 15px -3px rgba(50, 18, 122, 0.1), 0 4px 6px -2px rgba(50, 18, 122, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-edp': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
      gradientColorStops: {
        'edp-start': '#32127A',
        'edp-mid': '#A4D233',
        'edp-end': '#00ACEB',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.transform-flip-x': {
          transform: 'scaleX(-1)',
        },
        '.transform-flip-y': {
          transform: 'scaleY(-1)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}