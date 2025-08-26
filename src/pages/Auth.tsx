import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email) {
      newErrors.email = "Email обов'язковий";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Невірний формат email";
    }

    if (!formData.password) {
      newErrors.password = "Пароль обов'язковий";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль повинен містити мінімум 6 символів";
    }

    if (!isLogin) {
      if (!formData.fullName) {
        newErrors.fullName = "Повне ім'я обов'язкове";
      }
      if (!formData.username) {
        newErrors.username = "Ім'я користувача обов'язкове";
      } else if (formData.username.length < 3) {
        newErrors.username = "Ім'я користувача повинно містити мінімум 3 символи";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        
        if (data.user) {
          toast({
            title: "Успішно!",
            description: "Ви увійшли в систему",
          });
          navigate('/');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName,
              username: formData.username
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create profile after successful signup
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: formData.fullName,
              username: formData.username,
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          toast({
            title: "Реєстрація успішна!",
            description: "Ви можете увійти в систему",
          });
          
          // Auto login after signup
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          
          if (!signInError) {
            navigate('/');
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Щось пішло не так",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

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
              {isLogin ? 'Вітаємо знову!' : 'Створити акаунт'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin 
                ? 'Увійдіть, щоб продовжити роботу з Novado' 
                : 'Приєднуйтеся до спільноти Novado'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Повне ім'я
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Введіть ваше повне ім'я"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={cn(
                          "pl-10",
                          errors.fullName && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Ім'я користувача
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Введіть ім'я користувача"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={cn(
                          "pl-10",
                          errors.username && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-sm text-red-500">{errors.username}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Введіть ваш email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={cn(
                      "pl-10",
                      errors.email && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Пароль
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isLogin ? "Введіть ваш пароль" : "Створіть надійний пароль"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={cn(
                      "pl-10 pr-10",
                      errors.password && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Забули пароль?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Зачекайте...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? 'Увійти' : 'Зареєструватися'}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? 'Немає облікового запису?' : 'Вже є обліковий запис?'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setFormData({ email: '', password: '', fullName: '', username: '' });
                  }}
                  className="mt-2 text-primary hover:underline font-semibold inline-flex items-center gap-1"
                >
                  {isLogin ? 'Зареєструватися' : 'Увійти'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Безкоштовна реєстрація</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Миттєвий доступ до всіх функцій</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Безпечне зберігання даних</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Реєструючись, ви погоджуєтесь з нашими{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Умовами використання
          </Link>{' '}
          та{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Політикою конфіденційності
          </Link>
        </p>
      </div>
    </div>
  );
}