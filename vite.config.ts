/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Supabase client — large dependency, stable
          'vendor-supabase': ['@supabase/supabase-js'],
          // Animation library — used by canvas editor
          'vendor-motion': ['motion'],
          // Charting — only used by admin dashboard
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
