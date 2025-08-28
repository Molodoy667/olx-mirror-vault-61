import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Home, AtSign, Shield, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    login: '', // може бути email або username
    password: '',
    fullName: '',
    username: ''
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isValidUsername = (username: string) => /^[a-zA-Z0-9_]{3,20}$/.test(username);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Валідація логіна (email або username)
    if (!formData.login) {
      newErrors.login = "Логін обов'язковий";
    } else if (!isValidEmail(formData.login) && !isValidUsername(formData.login)) {
      newErrors.login = "Введіть валідний email або username (3-20 символів, a-z, 0-9, _)";
    }

    // Валідація пароля
    if (!formData.password) {
      newErrors.password = "Пароль обов'язковий";
    } else if (formData.password.length < 8) {
      newErrors.password = "Пароль повинен містити мінімум 8 символів";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Пароль повинен містити великі та малі літери та цифри";
    }

    if (!isLogin) {
      // Валідація повного імені
      if (!formData.fullName) {
        newErrors.fullName = "Повне ім'я обов'язкове";
      } else if (formData.fullName.length < 2) {
        newErrors.fullName = "Повне ім'я повинно містити мінімум 2 символи";
      }

      // Валідація username
      if (!formData.username) {
        newErrors.username = "Username обов'язковий";
      } else if (!isValidUsername(formData.username)) {
        newErrors.username = "Username: 3-20 символів, лише a-z, 0-9, _";
      }

      // Валідація згоди з умовами
      if (!agreements.terms) {
        newErrors.terms = "Необхідно погодитися з Умовами використання";
      }
      if (!agreements.privacy) {
        newErrors.privacy = "Необхідно погодитися з Політикою конфіденційності";
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
        // Спробуємо увійти як email, якщо не вийде - як username
        let loginData;
        
        if (isValidEmail(formData.login)) {
          // Логін як email
          loginData = await supabase.auth.signInWithPassword({
            email: formData.login,
            password: formData.password,
          });
        } else {
          // Логін як username - потрібно знайти email по username
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', formData.login)
            .single();
          
          if (!profile || !profile.email) {
            throw new Error('Користувача з таким username не знайдено');
          }
          
          // Логін через email знайдений по username
          loginData = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: formData.password,
          });
        }

        if (loginData.error) throw loginData.error;
        
        if (loginData.data.user) {
          // Збереження сесії в localStorage та cookies
          localStorage.setItem('novado_session', JSON.stringify(loginData.data.session));
          document.cookie = `novado_user=${loginData.data.user.id}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
          
          toast({
            title: "Успішно!",
            description: "Ласкаво просимо назад!",
          });
          navigate('/');
        }
      } else {
        // Перевірка унікальності username
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username)
          .single();

        if (existingUser) {
          setErrors({ username: 'Цей username вже зайнятий' });
          setLoading(false);
          return;
        }

        // Реєстрація з email (login поле має бути email для реєстрації)
        if (!isValidEmail(formData.login)) {
          setErrors({ login: 'Для реєстрації потрібен валідний email' });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.login,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/welcome`,
            data: {
              full_name: formData.fullName,
              username: formData.username
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Створення профілю
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: formData.fullName,
              username: formData.username,
              email: formData.login,
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          // Автоматичний вхід після реєстрації
          const loginData = await supabase.auth.signInWithPassword({
            email: formData.login,
            password: formData.password,
          });
          
          if (!loginData.error && loginData.data.user) {
            // Збереження сесії
            localStorage.setItem('novado_session', JSON.stringify(loginData.data.session));
            document.cookie = `novado_user=${loginData.data.user.id}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
            
            toast({
              title: "Реєстрація успішна! 🎉",
              description: "Ласкаво просимо до Novado!",
            });
            
            // Перехід на welcome сторінку
            navigate('/welcome');
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

  const handleAgreementChange = (field: 'terms' | 'privacy', checked: boolean) => {
    setAgreements({ ...agreements, [field]: checked });
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
              {/* Логін (email або username) */}
              <div className="space-y-2">
                <Label htmlFor="login" className="text-sm font-medium">
                  {isLogin ? 'Email або Username' : 'Email'}
                </Label>
                <div className="relative">
                  {isLogin ? (
                    <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    id="login"
                    type="text"
                    placeholder={isLogin ? "email@example.com або username" : "Введіть ваш email"}
                    value={formData.login}
                    onChange={(e) => handleInputChange('login', e.target.value)}
                    className={cn(
                      "pl-10",
                      errors.login && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                {errors.login && (
                  <p className="text-sm text-red-500">{errors.login}</p>
                )}
              </div>

              {/* Поля для реєстрації */}
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
                      Username
                    </Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="@username"
                        value={formData.username}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('@')) {
                            value = '@' + value;
                          }
                          handleInputChange('username', value.slice(1)); // Зберігаємо без @
                        }}
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

              {/* Пароль */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Пароль
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isLogin ? "Введіть ваш пароль" : "Мін. 8 символів, великі та малі літери, цифри"}
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

              {/* Галочки згоди для реєстрації */}
              {!isLogin && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreements.terms}
                      onCheckedChange={(checked) => handleAgreementChange('terms', checked as boolean)}
                      className={errors.terms ? "border-red-500" : ""}
                    />
                    <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Я погоджуюся з{' '}
                      <Link to="/terms" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Умовами використання
                      </Link>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-500 ml-6">{errors.terms}</p>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={agreements.privacy}
                      onCheckedChange={(checked) => handleAgreementChange('privacy', checked as boolean)}
                      className={errors.privacy ? "border-red-500" : ""}
                    />
                    <Label htmlFor="privacy" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Я погоджуюся з{' '}
                      <Link to="/privacy" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Політикою конфіденційності
                      </Link>
                    </Label>
                  </div>
                  {errors.privacy && (
                    <p className="text-sm text-red-500 ml-6">{errors.privacy}</p>
                  )}
                </div>
              )}

              {/* Забули пароль для входу */}
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

              {/* Кнопка відправки */}
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

              {/* Кнопка повернутись на головну */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Повернутись на головну
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
                    setFormData({ login: '', password: '', fullName: '', username: '' });
                    setAgreements({ terms: false, privacy: false });
                  }}
                  className="mt-2 text-primary hover:underline font-semibold inline-flex items-center gap-1"
                >
                  {isLogin ? 'Зареєструватися' : 'Увійти'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}