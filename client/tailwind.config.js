/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f5f3f0', 100: '#e8e4de', 200: '#d4cdc4', 300: '#b8ae9f',
          400: '#9a8d7c', 500: '#7d6e5d', 600: '#665a4c', 700: '#52483d',
          800: '#453d34', 900: '#3b342d', 950: '#201c18',
        },
        parchment: {
          50: '#fdfaf5', 100: '#faf4e8', 200: '#f4e8d0', 300: '#ecd6ae',
          400: '#e1bf83', 500: '#d4a55a', 600: '#c08a3e', 700: '#a07232',
          800: '#845d2d', 900: '#6d4d28',
        },
        sage: {
          50: '#f3f7f4', 100: '#e3ede6', 200: '#c8dace', 300: '#a0c0aa',
          400: '#74a082', 500: '#527f60', 600: '#3f644b', 700: '#34513d',
          800: '#2b4132', 900: '#24362a',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideIn: { from: { transform: 'translateX(-12px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
      },
      boxShadow: {
        'note': '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'note-hover': '0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
        'panel': '4px 0 24px rgba(0,0,0,0.08)',
        'modal': '0 24px 60px rgba(0,0,0,0.18)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      }
    }
  },
  plugins: []
}