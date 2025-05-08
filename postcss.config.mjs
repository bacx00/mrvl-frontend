/**
 * PostCSS for Tailwind 4
 * – The Tailwind team broke the plugin out into its own package
 *   so we load **@tailwindcss/postcss** here instead of `tailwindcss`.
 */
export default {
  plugins: {
    '@tailwindcss/postcss' : {},   // <‑‑ NEW
    autoprefixer           : {},
  },
}
