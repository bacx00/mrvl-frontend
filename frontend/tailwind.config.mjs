import { type Config } from 'tailwindcss'

export default /** @type {Config} */ ({
  darkMode : 'class',                             // toggle by adding “dark” to <html>
  content  : [
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme : {
    extend : {
      colors : {
        // brand palette ───────────────────────────
        brandDark  : '#181a26',                    // dark background
        brandLight : '#dde2ed',                    // light background
        accent     : '#26335F',                    // little brighter than brandDark
      },
    },
  },
  plugins : [],
})
