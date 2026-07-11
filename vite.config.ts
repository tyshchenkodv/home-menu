import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// The production bundle is served from the GitHub Pages project subpath
// (https://<owner>.github.io/home-menu/), so asset URLs must be prefixed with
// that base at build time. Local `dev`/`preview` keep the root base so the app
// stays reachable at `/`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/home-menu/' : '/',
  plugins: [react()],
}));
