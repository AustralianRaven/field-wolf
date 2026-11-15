import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';

/**
 * GitHub Pages has no SPA fallback. It serves 404.html for any unknown path,
 * so the build ships the app as 404.html too: /field-wolf/fauna opened
 * directly still boots the app, which then routes itself.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'));
    },
  };
}

export default defineConfig({
  base: '/field-wolf/',
  plugins: [svelte(), spaFallback()],
  // Pre-bundling onnxruntime-web breaks how it loads its .wasm glue at runtime.
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  worker: { format: 'es' },
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
});
