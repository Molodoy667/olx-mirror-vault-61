import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './index.css';

// Симулируем все провайдеры из оригинального App
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Mock компоненты для тестирования
function MockToaster() {
  return <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'green', color: 'white', padding: '5px', borderRadius: '3px' }}>✅ Toaster</div>;
}

function MockErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ background: 'rgba(0,255,0,0.1)', padding: '5px', margin: '5px', borderRadius: '3px' }}>✅ ErrorBoundary</div>
      {children}
    </div>
  );
}

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ background: 'rgba(0,255,0,0.1)', padding: '5px', margin: '5px', borderRadius: '3px' }}>✅ AuthProvider</div>
      {children}
    </div>
  );
}

function MockScrollToTopRouter({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ background: 'rgba(0,255,0,0.1)', padding: '5px', margin: '5px', borderRadius: '3px' }}>✅ ScrollToTopRouter</div>
      {children}
    </div>
  );
}

function MockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: '2px solid green', padding: '10px', margin: '5px' }}>
      <div style={{ background: 'rgba(0,255,0,0.1)', padding: '5px', margin: '5px', borderRadius: '3px' }}>✅ Layout</div>
      {children}
    </div>
  );
}

// Простые страницы для тестирования
function HomePage() {
  return (
    <div style={{ padding: '20px', background: '#4CAF50', color: 'white', borderRadius: '10px', margin: '10px' }}>
      <h2>🏠 Главная страница</h2>
      <p>Все провайдеры работают!</p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{ padding: '20px', background: '#FF9800', color: 'white', borderRadius: '10px', margin: '10px' }}>
      <h2>⏳ Загрузка...</h2>
      <div style={{ width: '50px', height: '50px', border: '5px solid white', borderTop: '5px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>
  );
}

// Компонент для пошагового тестирования
function ComprehensiveTest() {
  const [step, setStep] = useState(1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ padding: '20px', background: '#2196F3', color: 'white', borderRadius: '10px' }}>
            <h3>Шаг 1: Базовый React</h3>
            <p>✅ React рендерится</p>
            <button onClick={() => setStep(2)} style={{ padding: '10px', margin: '10px', fontSize: '16px' }}>
              Тест QueryClient →
            </button>
          </div>
        );

      case 2:
        return (
          <QueryClientProvider client={queryClient}>
            <div style={{ padding: '20px', background: '#9C27B0', color: 'white', borderRadius: '10px' }}>
              <h3>Шаг 2: QueryClient</h3>
              <p>✅ QueryClientProvider работает</p>
              <button onClick={() => setStep(3)} style={{ padding: '10px', margin: '10px', fontSize: '16px' }}>
                Тест ErrorBoundary →
              </button>
            </div>
          </QueryClientProvider>
        );

      case 3:
        return (
          <QueryClientProvider client={queryClient}>
            <MockErrorBoundary>
              <div style={{ padding: '20px', background: '#3F51B5', color: 'white', borderRadius: '10px' }}>
                <h3>Шаг 3: ErrorBoundary</h3>
                <p>✅ ErrorBoundary работает</p>
                <button onClick={() => setStep(4)} style={{ padding: '10px', margin: '10px', fontSize: '16px' }}>
                  Тест BrowserRouter →
                </button>
              </div>
            </MockErrorBoundary>
          </QueryClientProvider>
        );

      case 4:
        return (
          <QueryClientProvider client={queryClient}>
            <MockErrorBoundary>
              <BrowserRouter>
                <div style={{ padding: '20px', background: '#009688', color: 'white', borderRadius: '10px' }}>
                  <h3>Шаг 4: BrowserRouter</h3>
                  <p>✅ BrowserRouter работает</p>
                  <p>URL: {window.location.pathname}</p>
                  <button onClick={() => setStep(5)} style={{ padding: '10px', margin: '10px', fontSize: '16px' }}>
                    Тест AuthProvider →
                  </button>
                </div>
              </BrowserRouter>
            </MockErrorBoundary>
          </QueryClientProvider>
        );

      case 5:
        return (
          <QueryClientProvider client={queryClient}>
            <MockErrorBoundary>
              <BrowserRouter>
                <MockAuthProvider>
                  <div style={{ padding: '20px', background: '#607D8B', color: 'white', borderRadius: '10px' }}>
                    <h3>Шаг 5: AuthProvider</h3>
                    <p>✅ AuthProvider работает</p>
                    <button onClick={() => setStep(6)} style={{ padding: '10px', margin: '10px', fontSize: '16px' }}>
                      Тест Layout →
                    </button>
                  </div>
                </MockAuthProvider>
              </BrowserRouter>
            </MockErrorBoundary>
          </QueryClientProvider>
        );

      case 6:
        return (
          <QueryClientProvider client={queryClient}>
            <MockErrorBoundary>
              <MockToaster />
              <BrowserRouter>
                <MockAuthProvider>
                  <MockScrollToTopRouter>
                    <MockLayout>
                      <div style={{ padding: '20px', background: '#4CAF50', color: 'white', borderRadius: '10px' }}>
                        <h3>Шаг 6: Полная структура</h3>
                        <p>✅ Все провайдеры работают</p>
                        <button onClick={() => setStep(7)} style={{ padding: '10px', margin: '10px', fontSize: '16px' }}>
                          Тест Suspense + Lazy →
                        </button>
                      </div>
                    </MockLayout>
                  </MockScrollToTopRouter>
                </MockAuthProvider>
              </BrowserRouter>
            </MockErrorBoundary>
          </QueryClientProvider>
        );

      case 7:
        return (
          <QueryClientProvider client={queryClient}>
            <MockErrorBoundary>
              <MockToaster />
              <BrowserRouter>
                <MockAuthProvider>
                  <MockScrollToTopRouter>
                    <MockLayout>
                      <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="*" element={
                            <div style={{ padding: '20px', background: '#f44336', color: 'white', borderRadius: '10px' }}>
                              <h2>❌ 404</h2>
                              <p>Все работает + роутинг!</p>
                            </div>
                          } />
                        </Routes>
                      </Suspense>
                    </MockLayout>
                  </MockScrollToTopRouter>
                </MockAuthProvider>
              </BrowserRouter>
            </MockErrorBoundary>
          </QueryClientProvider>
        );

      default:
        return <div>Тест завершен!</div>;
    }
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🔍 Комплексный тест всех провайдеров</h1>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h2>📊 Прогресс тестирования: {step}/7</h2>
        <div style={{ background: 'rgba(255,255,255,0.1)', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            background: '#4CAF50', 
            height: '100%', 
            width: `${(step / 7) * 100}%`,
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {renderStep()}

      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <h3>🎯 Что тестируем:</h3>
        <p>✅ React</p>
        <p>{step >= 2 ? '✅' : '⏳'} QueryClient + QueryClientProvider</p>
        <p>{step >= 3 ? '✅' : '⏳'} ErrorBoundary</p>
        <p>{step >= 4 ? '✅' : '⏳'} BrowserRouter</p>
        <p>{step >= 5 ? '✅' : '⏳'} AuthProvider</p>
        <p>{step >= 6 ? '✅' : '⏳'} Layout + все провайдеры</p>
        <p>{step >= 7 ? '✅' : '⏳'} Suspense + Lazy loading + Routes</p>
      </div>

      <div style={{
        background: 'rgba(255,255,0,0.1)',
        padding: '15px',
        borderRadius: '10px',
        margin: '20px 0',
        border: '2px solid yellow'
      }}>
        <h3>⚠️ Инструкция:</h3>
        <p>1. Нажимайте кнопки по порядку</p>
        <p>2. Если на каком-то шаге белый экран - СТОП! Проблема найдена</p>
        <p>3. Если все шаги прошли - проблема в реальных компонентах</p>
        <p>4. Сообщите на каком шаге остановилось!</p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default ComprehensiveTest;