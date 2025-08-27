import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './index.css';

// Создаем QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

// Простые компоненты для тестирования
function HomePage() {
  return (
    <div style={{ padding: '20px', background: '#4CAF50', color: 'white', borderRadius: '10px', margin: '10px' }}>
      <h2>🏠 Главная + QueryClient</h2>
      <p>URL: {window.location.pathname}</p>
      <p>QueryClient работает!</p>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={{ padding: '20px', background: '#2196F3', color: 'white', borderRadius: '10px', margin: '10px' }}>
      <h2>ℹ️ О сайте + QueryClient</h2>
      <p>URL: {window.location.pathname}</p>
      <p>React Query Provider активен!</p>
    </div>
  );
}

// Тест BrowserRouter + QueryClient
function QueryClientTestApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🔍 Тест BrowserRouter + QueryClient</h1>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h2>📊 QueryClient Info</h2>
        <p><strong>Статус:</strong> Инициализирован</p>
        <p><strong>Default retry:</strong> 3</p>
        <p><strong>Stale time:</strong> 5 минут</p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h2>🧭 Навигация</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: 'yellow', textDecoration: 'none', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px' }}>
            Главная (/)
          </a>
          <a href="/about" style={{ color: 'yellow', textDecoration: 'none', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px' }}>
            О сайте (/about)
          </a>
        </div>
      </div>

      {/* QueryClientProvider + BrowserRouter */}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '10px',
            margin: '20px 0'
          }}>
            <h3>📍 Роутер + QueryClient:</h3>
            
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={
                <div style={{ padding: '20px', background: '#f44336', color: 'white', borderRadius: '10px' }}>
                  <h2>❌ 404 + QueryClient</h2>
                  <p>QueryClient + Router + 404 = OK!</p>
                </div>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>

      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>🎯 Тестирование:</h3>
        <p>1. Если видите эту страницу - QueryClient инициализируется</p>
        <p>2. Если видите цветные блоки - QueryClientProvider работает</p>
        <p>3. Если навигация работает - совместимость Router + QueryClient OK</p>
        <p>4. Если белый экран - проблема в QueryClient или его конфиге</p>
        
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
          <h4>📝 Следующие тесты:</h4>
          <p>• QueryClient ✅ (текущий)</p>
          <p>• AuthProvider (следующий)</p>
          <p>• Toaster</p>
          <p>• Layout + сложные компоненты</p>
          <p>• Lazy loading</p>
        </div>
      </div>
    </div>
  );
}

export default QueryClientTestApp;