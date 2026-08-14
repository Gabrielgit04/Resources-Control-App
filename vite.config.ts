import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = (env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
  const supabaseHost = supabaseUrl.replace(/^https?:\/\//, '')

  // Inyecta una Content-Security-Policy estricta solo en el build de producción.
  const cspPlugin: Plugin = {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        `img-src 'self' data: blob: ${supabaseUrl}`,
        `connect-src 'self' ${supabaseUrl} wss://${supabaseHost}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
      const tag = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${tag}`)
    },
  }

  return {
    plugins: [react(), cspPlugin, cloudflare()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      open: true,
    },
  };
})