import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';

// Простые компоненты для тестирования роутера
function HomePage() {
  return (
    <div style={{ padding: '20px', background: '#4CAF50', color: 'white', borderRadius: '10px', margin: '10px' }}>
      <h2>🏠 Главная страница</h2>
      <p>URL: {window.location.pathname}</p>
      <p>Если видите это - роутер работает!</p>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={{ padding: '20px', background: '#2196F3', color: 'white', borderRadius: '10px', margin: '10px' }}>
      <h2>ℹ️ О сайте</h2>
      <p>URL: {window.location.pathname}</p>
      <p>Роутер переключает страницы корректно!</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div style={{ padding: '20px', background: '#f44336', color: 'white', borderRadius: '10px', margin: '10px' }}>
      <h2>❌ Страница не найдена</h2>
      <p>URL: {window.location.pathname}</p>
      <p>404 страница работает!</p>
    </div>
  );
}

// Тест BrowserRouter
function RouterTestApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🔍 Тест BrowserRouter</h1>
      
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
          <a href="/nonexistent" style={{ color: 'yellow', textDecoration: 'none', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px' }}>
            404 тест (/nonexistent)
          </a>
        </div>
      </div>

      {/* ЗДЕСЬ ТЕСТИРУЕМ BROWSERROUTER */}
      <BrowserRouter>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '10px',
          margin: '20px 0'
        }}>
          <h3>📍 Текущая страница:</h3>
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </BrowserRouter>

      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>📝 Диагностика:</h3>
        <p><strong>Время:</strong> {new Date().toLocaleString()}</p>
        <p><strong>URL:</strong> {window.location.href}</p>
        <p><strong>Pathname:</strong> {window.location.pathname}</p>
        <p><strong>Hash:</strong> {window.location.hash || 'нет'}</p>
        <p><strong>Search:</strong> {window.location.search || 'нет'}</p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>🎯 Тестирование:</h3>
        <p>1. Если видите эту страницу - BrowserRouter инициализируется</p>
        <p>2. Если видите цветные блоки выше - Routes работают</p>
        <p>3. Если можете переходить по ссылкам - навигация работает</p>
        <p>4. Если белый экран - ошибка в BrowserRouter setup</p>
      </div>
    </div>
  );
}

export default RouterTestApp;