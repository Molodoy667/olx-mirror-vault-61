import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Простой диагностический компонент
function DiagnosticApp() {
  const [loadStep, setLoadStep] = React.useState('Инициализация...');
  const [errors, setErrors] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    const steps = [
      { name: 'Загрузка App.tsx...', action: () => import('./App.tsx') },
      { name: 'Инициализация App компонента...', action: (AppModule) => AppModule.default },
    ];
    
    let currentStep = 0;
    
    const runNextStep = async () => {
      if (currentStep >= steps.length) {
        setLoadStep('✅ Все компоненты загружены! Переключаемся на основное приложение...');
        
        // Загружаем основное приложение
        try {
          const AppModule = await import('./App.tsx');
          const root = createRoot(document.getElementById("root")!);
          root.render(
            React.createElement(StrictMode, null, 
              React.createElement(AppModule.default)
            )
          );
        } catch (error) {
          setErrors(prev => [...prev, 'Критическая ошибка App: ' + error.message]);
        }
        return;
      }
      
      const step = steps[currentStep];
      setLoadStep(step.name);
      
      try {
        const result = await step.action();
        currentStep++;
        setTimeout(runNextStep, 500);
      } catch (error) {
        setErrors(prev => [...prev, `${step.name}: ${error.message}`]);
        currentStep++;
        setTimeout(runNextStep, 500);
      }
    };
    
    setTimeout(runNextStep, 1000);
  }, []);
  
  return React.createElement('div', { 
    style: { 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }
  }, [
    React.createElement('h1', { key: 'title' }, '🔍 OLX - Диагностика загрузки'),
    React.createElement('div', { 
      key: 'status',
      style: {
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }
    }, [
      React.createElement('h2', { key: 'step' }, loadStep),
      React.createElement('p', { key: 'time' }, 'Время: ' + new Date().toLocaleTimeString())
    ]),
    
    errors.length > 0 && React.createElement('div', {
      key: 'errors',
      style: {
        background: 'rgba(244, 67, 54, 0.3)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }
    }, [
      React.createElement('h3', { key: 'errors-title' }, '❌ Ошибки:'),
      ...errors.map((error, index) => 
        React.createElement('p', { key: index }, error)
      )
    ])
  ]);
}

// Безопасная инициализация
try {
  console.log('🚀 Запуск диагностического режима...');
  
  // Добавляем React в window для диагностики
  window.React = React;
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(React.createElement(DiagnosticApp));
  
  console.log('✅ Диагностический режим запущен');
  
} catch (error) {
  console.error('❌ Критическая ошибка:', error);
  
  // Последний fallback
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #ffebee; color: #c62828; font-family: Arial;">
        <h1>❌ Критическая ошибка</h1>
        <p><strong>Ошибка:</strong> ${error.message}</p>
        <p><strong>Стек:</strong> <pre>${error.stack}</pre></p>
      </div>
    `;
  }
}
