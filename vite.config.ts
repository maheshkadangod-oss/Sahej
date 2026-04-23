import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
  build: {
    // Don't prefetch lazy chunks at initial load — they're only needed when
    // the user navigates to MoodTab (recharts), ChatTab (markdown), or falls
    // back to the Gemini client SDK (genai). Prefetching them inflates the
    // first-paint network bill for no gain.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter(d => !/\/(recharts|markdown|genai)-/.test(d)),
    },
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          markdown: ['react-markdown'],
          genai: ['@google/genai'],
        },
      },
    },
  },
});
