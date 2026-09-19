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
        navy: {
          950: '#070A13',
          900: '#0B0F19',
          850: '#0F1629',
          800: '#151D36',
          750: '#1C2646',
          700: '#233058',
        },
        brand: {
          indigo: '#6366F1',
          accent: '#818CF8',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)' },
          '100%': { boxShadow: '0 0 35px rgba(99, 102, 241, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
