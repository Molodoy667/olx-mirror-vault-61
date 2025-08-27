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
    chunkSizeWarningLimit: 1500, // Увеличиваем лимит до 1.5MB для больших vendor chunks
    rollupOptions: {
      external: [],
      // Убеждаемся что React не конфликтует с другими библиотеками
      plugins: [],
      output: {
        manualChunks: (id) => {
          // Выносим большие библиотеки в отдельные чанки
          if (id.includes('node_modules')) {
            // КРИТИЧНО: React должен быть в одном chunk с зависящими от него библиотеками
            if (id.includes('react') || id.includes('react-dom') || 
                id.includes('@radix-ui') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-other';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            return 'vendor-other';
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
