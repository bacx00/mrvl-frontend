/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#FED7D7',
          100: '#FEB2B2', 
          200: '#FC8181',
          300: '#F56565',
          400: '#ED8936',
          500: '#E53E3E',
          600: '#C53030',
          700: '#9B2C2C',
          800: '#822727',
          900: '#63171B',
        },
        marvel: {
          red: '#E53E3E',
          blue: '#3182CE', 
          purple: '#805AD5',
          gold: '#DD6B20',
          cyan: '#00B5D8',
          green: '#38A169',
        }
      },
      animation: {
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'grid-move': 'gridMove 20s linear infinite',
        'particle-float': 'particleFloat 25s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(229, 62, 62, 0.3)',
        'glow-blue': '0 0 20px rgba(49, 130, 206, 0.3)',
        'glow-purple': '0 0 20px rgba(128, 90, 213, 0.3)',
      }
    }
  },
  plugins: [],
}