import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, User, Plus, ArrowRight, CheckCircle, Star, Sparkles } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleGoToProfile = () => {
    setIsAnimating(true);
    setTimeout(() => navigate('/profile'), 300);
  };

  const handleCreateListing = () => {
    setIsAnimating(true);
    setTimeout(() => navigate('/create-listing'), 300);
  };

  // Показуємо loader поки перевіряємо авторизацію
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Перенаправляємо неавторизованих користувачів
  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className={`w-full max-w-2xl transition-transform duration-300 ${isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 shadow-2xl border-0 overflow-hidden">
          <CardHeader className="text-center pb-6 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20" />
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <div className="relative z-10">
              {/* Cat illustration */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <div className="text-6xl">🐱</div>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 text-yellow-800" />
                    </div>
                  </div>
                </div>
              </div>

              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Привіт, {user.user_metadata?.full_name || user.email?.split('@')[0]}! 👋
              </CardTitle>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Профіль створено
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Star className="w-3 h-3 mr-1" />
                  Новий користувач
                </Badge>
              </div>

              <p className="text-muted-foreground text-lg">
                Ласкаво просимо до спільноти Novado! 🎉
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {/* User data for saving */}
            <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border/50">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                📋 Ваші дані збережено:
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">Email:</span>
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                {user.user_metadata?.full_name && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium">Ім'я:</span>
                    <span className="text-muted-foreground">{user.user_metadata.full_name}</span>
                  </div>
                )}
                {user.user_metadata?.username && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium">Username:</span>
                    <span className="text-muted-foreground">@{user.user_metadata.username}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick guide */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Швидкий старт:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Заповніть профіль</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Додайте фото, опис та контактну інформацію</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">Створіть оголошення</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Додайте фото, опис та ціну вашого товару</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Спілкуйтесь та продавайте</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Використовуйте вбудований чат для зв'язку з покупцями</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleGoToProfile}
                className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <User className="w-5 h-5 mr-2" />
                Перейти в профіль
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                onClick={handleCreateListing}
                className="h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Створити оголошення
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Additional info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Потрібна допомога? Завжди можете знайти інструкції в{' '}
                <button 
                  onClick={() => navigate('/help')}
                  className="text-primary hover:underline font-medium"
                >
                  розділі допомоги
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}