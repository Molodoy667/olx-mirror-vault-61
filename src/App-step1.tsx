import React from 'react';
import './index.css'; // Добавляем CSS

// Шаг 1: Только CSS + базовый компонент
function Step1App() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🔍 Шаг 1: CSS + React</h1>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h2>✅ Тест CSS импорта</h2>
        <p><strong>Время:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Статус:</strong> CSS загружен без ошибок</p>
        
        {/* Тестируем CSS классы */}
        <div className="bg-red-500 text-white p-4 rounded-lg mt-4">
          <h3>🎨 Tailwind CSS Test</h3>
          <p>Если видите красный фон - Tailwind работает</p>
        </div>
      </div>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>📝 Следующие шаги:</h3>
        <p>1. Если видите это - CSS импорт работает</p>
        <p>2. Далее добавим: QueryClient, Router, AuthProvider</p>
        <p>3. Потом: Lazy loading, сложные компоненты</p>
      </div>
    </div>
  );
}

export default Step1App;