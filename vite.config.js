import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// Multi-page build: the landing, thank-you and 404 pages stay plain HTML;
// the app pages (quiz, explore, gym, compare, saved) are Vue apps. Shared CSS, fonts and theme.js live in public/.
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        quiz: resolve(import.meta.dirname, 'quiz/index.html'),
        explore: resolve(import.meta.dirname, 'explore/index.html'),
        gym: resolve(import.meta.dirname, 'gym/index.html'),
        compare: resolve(import.meta.dirname, 'compare/index.html'),
        saved: resolve(import.meta.dirname, 'saved/index.html'),
        thanks: resolve(import.meta.dirname, 'thanks.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
})
