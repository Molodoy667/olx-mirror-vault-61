import { createContext, useContext, useEffect, useState } from 'react';
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

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Збереження сесії в localStorage та cookies
        if (session) {
          localStorage.setItem('novado_session', JSON.stringify(session));
          document.cookie = `novado_user=${session.user.id}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        } else {
          localStorage.removeItem('novado_session');
          document.cookie = 'novado_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      }
    );

    // Спроба відновлення сесії з localStorage
    const savedSession = localStorage.getItem('novado_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        // Перевіряємо чи не закінчився термін дії сесії
        if (parsedSession.expires_at && new Date(parsedSession.expires_at) > new Date()) {
          setSession(parsedSession);
          setUser(parsedSession.user);
        } else {
          localStorage.removeItem('novado_session');
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('novado_session');
      }
    }

    // THEN check for existing session from Supabase
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
      // Очищуємо збережені дані
      localStorage.removeItem('novado_session');
      document.cookie = 'novado_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Navigation will be handled by components that call signOut
      // They can use useNavigate inside Router context
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