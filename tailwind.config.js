/** @type {import('tailwindcss').Config} */
module.exports = {
  // App‑router & components folders
  content: [
    './src/app/**/*.{js,jsx,ts,tsx,mdx}',
    './src/components/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  darkMode: 'class',          // we flip a `class="dark"` on <body>
  theme: {
    extend: {
      colors: {
        // palette requested by the user
        lightBg : '#dde2ed',
        darkBg  : '#181a26',
        primary : '#181a26',
        accent  : '#dde2ed',
      },
      // the subtle diagonal‑line background used on nextjs.org
      backgroundImage: {
        'mesh-lines':
          'repeating-linear-gradient(135deg, transparent 0 22px, rgb(0 0 0 / .04) 22px 24px)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
