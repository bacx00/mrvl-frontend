/**
 * ecosystem.config.js ─ PM2 definition for mrvl-frontend
 * ------------------------------------------------------
 *  ▸ `cwd`   → project root that contains .next/ and node_modules
 *  ▸ `script`→ call the compiled Next.js binary directly
 *  ▸ `args`  → “start” + port
 *  ▸ cluster mode spins up one worker per CPU
 */
module.exports = {
  apps: [{
    name       : 'mrvl-frontend',

    /* ---- paths ---- */
    cwd        : '/var/www/mrvl-frontend',
    script     : 'node_modules/next/dist/bin/next',
    args       : 'start -p 3000',

    /* ---- process model ---- */
    exec_mode  : 'cluster',
    instances  : 'max',     // or hard-code e.g. 4

    /* ---- env seen by Next.js ---- */
    env: {
      NODE_ENV          : 'production',
      PORT              : 3000,                    // Next listens here
      NEXT_PUBLIC_APP_ENV: 'staging',
      NEXT_PUBLIC_API_URL: 'https://staging.mrvl.net'
    },

    /* ---- misc hardening ---- */
    watch       : false,   // no file-watch in prod
    max_restarts: 10
  }]
};
