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
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // VLR.gg style tablet breakpoints
        'tablet-sm': '768px',
        'tablet': '768px',
        'tablet-lg': '1024px',
        // Orientation-specific breakpoints
        'tablet-portrait': {'raw': '(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)'},
        'tablet-landscape': {'raw': '(min-width: 768px) and (max-width: 1024px) and (orientation: landscape)'},
        // Device-specific iPad breakpoints
        'ipad': {'raw': '(min-device-width: 768px) and (max-device-width: 1024px)'},
        'ipad-pro': {'raw': '(min-device-width: 1024px) and (max-device-width: 1366px)'},
      },
      animation: {
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'grid-move': 'gridMove 20s linear infinite',
        'particle-float': 'particleFloat 25s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'tablet-pulse': 'tabletPulse 2s ease-in-out infinite',
        'tablet-glow': 'tabletGlow 3s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(229, 62, 62, 0.3)',
        'glow-blue': '0 0 20px rgba(49, 130, 206, 0.3)',
        'glow-purple': '0 0 20px rgba(128, 90, 213, 0.3)',
        'tablet-card': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'tablet-hover': '0 12px 40px rgba(239, 68, 68, 0.15)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      aspectRatio: {
        'tournament': '16 / 9',
        'bracket': '4 / 3',
      },
      gridTemplateColumns: {
        'tablet-2': 'repeat(2, minmax(0, 1fr))',
        'tablet-3': 'repeat(3, minmax(0, 1fr))',
        'tablet-auto-fit': 'repeat(auto-fit, minmax(320px, 1fr))',
        'tablet-sidebar': '280px 1fr',
        'tablet-split': '1fr 1fr',
      },
      maxWidth: {
        'tablet': '1024px',
        'tablet-content': '900px',
      },
    }
  },
  plugins: [],
}