import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages sirve el sitio bajo /manducapp/; en local y en los tests se usa la raíz.
  base: process.env.GITHUB_ACTIONS ? '/manducapp/' : '/',
  plugins: [react()],
});
