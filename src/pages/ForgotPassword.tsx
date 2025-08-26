import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email обов\'язковий');
      return;
    }

    if (!validateEmail(email)) {
      setError('Невірний формат email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Лист відправлено!",
        description: "Перевірте вашу пошту для відновлення паролю",
      });
    } catch (error: any) {
      setError(error.message || 'Помилка при відправці листа');
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відправити лист",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Лист відправлено повторно!",
        description: "Перевірте вашу пошту",
      });
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відправити лист",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="backdrop-blur-sm bg-card/95 shadow-xl border-border/50">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-semibold">
                Лист відправлено!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Ми відправили інструкції для відновлення паролю на пошту
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Перевірте папку "{email}" включно з папкою "Спам"
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <p className="text-sm font-medium mb-2">Не отримали лист?</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Перевірте папку "Спам" або "Небажані"</li>
                    <li>• Переконайтесь, що email введено правильно</li>
                    <li>• Спробуйте відправити лист повторно</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Відправляємо...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Відправити повторно
                    </div>
                  )}
                </Button>

                <Link to="/auth" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Повернутися до входу
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="backdrop-blur-sm bg-card/95 shadow-xl border-border/50">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Novado
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">
              Забули пароль?
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Введіть ваш email і ми відправимо інструкції для відновлення паролю
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email адреса
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Введіть ваш email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className={cn(
                      "pl-10",
                      error && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Відправляємо...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Відправити інструкції
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <Link
                  to="/auth"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Повернутися до входу
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Пам'ятаєте пароль?{' '}
          <Link to="/auth" className="text-primary hover:underline">
            Увійти в систему
          </Link>
        </p>
      </div>
    </div>
  );
}