import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
// Single self-contained HTML (JS, CSS, fonts, HDRI inlined) for publishing as a shareable page.
export default defineConfig({ base: './', plugins: [viteSingleFile()], build: { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 } });
