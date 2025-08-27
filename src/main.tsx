import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Глобальный обработчик ошибок загрузки чанков
window.addEventListener('error', (event) => {
  // Проверяем, является ли ошибка связанной с загрузкой чанков
  if (
    event.message.includes('Loading chunk') ||
    event.message.includes('Loading CSS chunk') ||
    event.message.includes('ChunkLoadError')
  ) {
    console.warn('Chunk loading error detected, reloading page...');
    // Перезагружаем страницу для получения новых чанков
    window.location.reload();
  }
});

// Обработчик для unhandled promise rejections (например, от динамических импортов)
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.message?.includes('Loading chunk') ||
     event.reason.message?.includes('ChunkLoadError'))
  ) {
    console.warn('Chunk loading promise rejection detected, reloading page...');
    event.preventDefault(); // Предотвращаем показ ошибки в консоли
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
