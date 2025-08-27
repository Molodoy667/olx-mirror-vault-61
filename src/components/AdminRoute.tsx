import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Показываем загрузку пока проверяем авторизацию и права
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">
            Перевірка прав доступу...
          </p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Для доступу до адміністративної панелі необхідно увійти в систему.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Увійти в систему
          </Button>
        </div>
      </div>
    );
  }

  // Если пользователь не является админом
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              У вас немає прав доступу до адміністративної панелі. 
              Зверніться до адміністратора для отримання доступу.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              На головну
            </Button>
            <Button 
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Назад
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Если все проверки пройдены, показываем админский контент
  return <>{children}</>;
}