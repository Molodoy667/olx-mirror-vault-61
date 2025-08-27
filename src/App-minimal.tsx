import React from 'react';

// Минимальный App для тестирования
function MinimalApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>✅ Минимальный App работает!</h1>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h2>🎉 React App успешно загружен</h2>
        <p><strong>Время:</strong> {new Date().toLocaleString()}</p>
        <p><strong>URL:</strong> {window.location.href}</p>
        <p><strong>React работает:</strong> ✅</p>
      </div>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>🔧 Следующие шаги:</h3>
        <p>1. Если видите это - основная структура React работает</p>
        <p>2. Проблема в компонентах основного App.tsx:</p>
        <ul>
          <li>Router настройка</li>
          <li>Lazy loading компонентов</li>
          <li>Provider'ы (QueryClient, AuthProvider, etc.)</li>
          <li>Импорты компонентов</li>
          <li>CSS стили</li>
        </ul>
      </div>
      
      <button 
        onClick={() => {
          console.log('✅ Event handlers работают');
          alert('✅ JavaScript события работают!');
        }}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Тест события
      </button>
    </div>
  );
}

export default MinimalApp;