import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mapsKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    env.VITE_GOOGLE_MAPS_API_KEY ||
    env.GOOGLE_MAPS_API_KEY ||
    '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-maps-key',
        transformIndexHtml(html) {
          if (!mapsKey) return html;
          return html.replace(
            '<head>',
            `<head>\n    <script>window.__GOOGLE_MAPS_API_KEY__ = ${JSON.stringify(mapsKey)};</script>`
          );
        },
      },
    ],
    define: {
      '__GOOGLE_MAPS_KEY__': JSON.stringify(mapsKey),
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(mapsKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
