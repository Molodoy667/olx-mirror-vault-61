import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { ScrollToTopRouter } from "@/components/ScrollToTopRouter";
import { Layout } from "@/components/Layout";
import './index.css';

// Временный AuthProvider БЕЗ useNavigate для тестирования
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

const useAuth = () => useContext(AuthContext);

const SafeAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // НЕ ИСПОЛЬЗУЕМ useNavigate здесь!

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // navigate('/auth'); // УБРАНО! Будем навигировать в компонентах ВНУТРИ Router
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Простые lazy компоненты для тестирования
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
      </div>
      <p className="text-muted-foreground bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent font-medium">
        Завантаження...
      </p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <div style={{
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    color: 'white'
  }}>
    <h1>🔍 Тест РЕАЛЬНЫХ компонентов</h1>
    
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      padding: '20px',
      borderRadius: '10px',
      margin: '20px 0'
    }}>
      <h2>🎯 Что тестируем:</h2>
      <p>✅ Настоящий QueryClient</p>
      <p>✅ Настоящий ErrorBoundary</p>
      <p>✅ Настоящий BrowserRouter</p>
      <p>✅ Исправленный AuthProvider (БЕЗ useNavigate)</p>
      <p>✅ Настоящий ScrollToTopRouter</p>
      <p>✅ Настоящий Layout</p>
      <p>✅ Настоящий Suspense + Lazy loading</p>
      <p>✅ Настоящие страницы (Home, Auth)</p>
    </div>

    <div style={{
      background: 'rgba(255,255,0,0.1)',
      padding: '15px',
      borderRadius: '10px',
      margin: '20px 0',
      border: '2px solid yellow'
    }}>
      <h3>⚠️ НАЙДЕНА ПРОБЛЕМА!</h3>
      <p><strong>AuthProvider использует useNavigate() ВНЕ BrowserRouter!</strong></p>
      <p>Строка 26 в useAuth.tsx: <code>const navigate = useNavigate();</code></p>
      <p>Но AuthProvider вызывается ДО BrowserRouter в структуре!</p>
    </div>

    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter>
          <SafeAuthProvider>
            <ScrollToTopRouter />
            <Layout>
              <Suspense fallback={<PageFallback />}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '20px',
                  borderRadius: '10px',
                  margin: '20px 0'
                }}>
                  <h3>📍 Роутер с настоящими страницами:</h3>
                  
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="*" element={
                      <div style={{ padding: '20px', background: '#f44336', color: 'white', borderRadius: '10px' }}>
                        <h2>❌ 404</h2>
                        <p>Все настоящие компоненты работают!</p>
                      </div>
                    } />
                  </Routes>
                </div>
              </Suspense>
            </Layout>
          </SafeAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>

    <div style={{
      background: 'rgba(0,255,0,0.1)',
      padding: '15px',
      borderRadius: '10px',
      margin: '20px 0',
      border: '2px solid green'
    }}>
      <h3>✅ РЕШЕНИЕ:</h3>
      <p>1. Убрать useNavigate() из AuthProvider</p>
      <p>2. Перенести навигацию в компоненты ВНУТРИ Router</p>
      <p>3. Или перенести AuthProvider ВНУТРЬ BrowserRouter</p>
    </div>
  </div>
);

export default App;