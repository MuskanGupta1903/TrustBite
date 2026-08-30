/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'page-bg': '#E7F0E5',
        'surface': '#FFFFFF',
        'primary': '#1F3D2A',
        'success': '#4E8362',
        'caution': '#D9A441',
        'danger': '#C4705F',
        'secondary': '#5F6E5F',
        'border-subtle': '#D3E2CE',
      },
      fontFamily: {
        heading: ['Switzer', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-live': 'pulseLive 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
}
