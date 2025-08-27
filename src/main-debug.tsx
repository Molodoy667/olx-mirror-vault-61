import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Простой компонент для отладки
function DebugApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🔍 Debug Mode - OLX</h1>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h2>✅ React приложение загружено!</h2>
        <p><strong>Время:</strong> {new Date().toLocaleString()}</p>
        <p><strong>URL:</strong> {window.location.href}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
      </div>
      
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>🧪 Базовые тесты:</h3>
        <p>✅ JSX рендерится</p>
        <p>✅ CSS стили применяются</p>
        <p>✅ JavaScript функции работают</p>
        <p>✅ React hooks доступны</p>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>🔧 Следующие шаги:</h3>
        <p>1. Если видите это сообщение - основная проблема НЕ в React</p>
        <p>2. Проблема может быть в:</p>
        <ul>
          <li>Ошибке в компонентах App.tsx</li>
          <li>Проблеме с роутингом</li>
          <li>Ошибке в Supabase подключении</li>
          <li>Проблеме с lazy loading компонентов</li>
        </ul>
        
        <button 
          onClick={() => {
            console.log('🔄 Пытаемся загрузить полное приложение...');
            // Попробуем загрузить полное приложение
            import('./App.tsx').then(AppModule => {
              console.log('✅ App.tsx загружен успешно');
            }).catch(error => {
              console.error('❌ Ошибка загрузки App.tsx:', error);
            });
          }}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '10px'
          }}
        >
          Тест загрузки App.tsx
        </button>
      </div>
    </div>
  );
}

// Безопасная инициализация с обработкой ошибок
try {
  console.log('🚀 Инициализация React приложения...');
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Element with id "root" not found');
  }
  
  console.log('✅ Root element найден');
  
  const root = createRoot(rootElement);
  console.log('✅ React root создан');
  
  root.render(
    <StrictMode>
      <DebugApp />
    </StrictMode>
  );
  
  console.log('✅ Debug приложение отрендерено');
  
} catch (error) {
  console.error('❌ Критическая ошибка инициализации:', error);
  
  // Fallback - показываем ошибку в HTML
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial; background: #ffebee; color: #c62828; border-radius: 5px; margin: 20px;">
        <h1>❌ Ошибка инициализации React</h1>
        <p><strong>Ошибка:</strong> ${error.message}</p>
        <p><strong>Стек:</strong> ${error.stack}</p>
        <button onclick="window.location.reload()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Перезагрузить страницу
        </button>
      </div>
    `;
  }
}