import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000, // Увеличиваем лимит до 3MB для больших vendor chunks
    rollupOptions: {
      external: [],
      // Убеждаемся что React не конфликтует с другими библиотеками
      plugins: [],
      output: {
        manualChunks: (id) => {
          // БЕЗОПАСНОЕ разделение - только крупные независимые библиотеки
          if (id.includes('node_modules')) {
            // Supabase - крупная независимая библиотека
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Recharts - крупные графики, но зависят от React!
            if (id.includes('recharts')) {
              return 'vendor-react'; // Перемещаем к React!
            }
            // ВСЕ ОСТАЛЬНОЕ - в vendor-react для безопасности
            // Включая React, Radix, Router, hooks, и все что может использовать React
            return 'vendor-react';
          }
          
          // Разделяем страницы админки
          if (id.includes('/pages/admin/')) {
            if (id.includes('Analytics')) {
              return 'admin-analytics';
            }
            if (id.includes('BackupManager')) {
              return 'admin-backup';
            }
            return 'admin-other';
          }
        },
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
}));
