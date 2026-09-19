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
        // True Dark & Charcoal Theme (NO navy blue!)
        dark: {
          950: '#09090B', // Deepest background
          900: '#121215', // Main surface
          850: '#18181B', // Card surface
          800: '#222226', // Elevated surface
          750: '#27272A', // Subtle borders
          700: '#3F3F46', // Strong borders
        },
        navy: {
          // Remapped to pure charcoal/dark to override any legacy classes
          950: '#09090B',
          900: '#121215',
          850: '#18181B',
          800: '#222226',
          750: '#27272A',
          700: '#3F3F46',
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
