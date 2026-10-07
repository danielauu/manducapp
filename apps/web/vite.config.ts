import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages sirve el sitio bajo /manducapp/; en local y en los tests se usa la raíz.
  base: process.env.GITHUB_ACTIONS ? '/manducapp/' : '/',
  plugins: [
    react(),
    VitePWA({
      // La actualización no se aplica sola: una sesión en curso no debe recargarse; se avisa y se elige.
      registerType: 'prompt',
      injectRegister: false,
      // El manifest ya vive en public/manifest.webmanifest.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
        // La navegación es por hash: cualquier carga de página se sirve desde index.html.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
