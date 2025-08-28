import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Save, 
  Globe, 
  Shield, 
  Mail,
  Database,
  Palette,
  Bell,
  FileImage,
  Link,
  RefreshCw
} from 'lucide-react';

interface SystemSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  max_images_per_listing: number;
  auto_approve_listings: boolean;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_notifications: boolean;
  default_currency: string;
  max_listing_price: number;
}

// Компонент для управления SEO URL
function SeoManagementSection() {
  const [regenerating, setRegenerating] = useState(false);
  const [stats, setStats] = useState<{ total: number; withSeo: number } | null>(null);

  // Загружаем статистику SEO URL
  const loadSeoStats = async () => {
    try {
      const [listingsResult, seoUrlsResult] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('seo_urls').select('id', { count: 'exact' })
      ]);

      setStats({
        total: listingsResult.count || 0,
        withSeo: seoUrlsResult.count || 0
      });
    } catch (error) {
      console.error('Error loading SEO stats:', error);
    }
  };

  // Пересоздание всех SEO URL
  const handleRegenerateAll = async () => {
    setRegenerating(true);
    try {
      const { regenerateAllSeoUrls } = await import('@/lib/seo');
      const result = await regenerateAllSeoUrls();
      
      toast({
        title: "SEO URL оновлено",
        description: `Успішно: ${result.success}, Помилок: ${result.errors}`,
        variant: result.errors > 0 ? "destructive" : "default"
      });
      
      // Обновляем статистику
      await loadSeoStats();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити SEO URL",
        variant: "destructive"
      });
    } finally {
      setRegenerating(false);
    }
  };

  // Загружаем статистику при монтировании
  useEffect(() => {
    loadSeoStats();
  }, []);

  return (
    <div className="space-y-4">
      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h5 className="font-semibold text-green-900 dark:text-green-100">Активних оголошень</h5>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {stats?.total ?? '...'}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h5 className="font-semibold text-blue-900 dark:text-blue-100">З SEO URL</h5>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats?.withSeo ?? '...'}
          </p>
        </div>
      </div>

      {/* Действия */}
      <div className="space-y-3">
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <h5 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            ⚠️ Пересоздання всіх SEO URL
          </h5>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            Це видалить всі існуючі SEO URL та створить нові з правильним форматом.
            Старі посилання перестануть працювати!
          </p>
          <Button 
            onClick={handleRegenerateAll}
            disabled={regenerating}
            variant="destructive"
            className="w-full"
          >
            {regenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Оновлення...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Пересоздати всі SEO URL
              </>
            )}
          </Button>
        </div>

        <Button 
          onClick={loadSeoStats}
          variant="outline"
          className="w-full"
        >
          🔄 Оновити статистику
        </Button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  
  // Налаштування системи
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'Маркетплейс',
    site_description: 'Найкращий маркетплейс України',
    contact_email: 'admin@marketplace.ua',
    max_images_per_listing: 10,
    auto_approve_listings: true,
    maintenance_mode: false,
    registration_enabled: true,
    email_notifications: true,
    default_currency: 'UAH',
    max_listing_price: 1000000
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  // Завантаження налаштувань з бази даних або localStorage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Тут можна завантажити налаштування з бази даних
    // Поки що використовуємо localStorage для демонстрації
    const savedSettings = localStorage.getItem('admin_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Зберігаємо в localStorage (в реальному додатку - в БД)
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      
      toast({
        title: "Успішно",
        description: "Налаштування збережено",
      });
    } catch (error) {
      toast({
        title: "Помилка", 
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Ви впевнені, що хочете скинути всі налаштування?')) {
      localStorage.removeItem('admin_settings');
      window.location.reload();
    }
  };

  // Обробник зміни значень
  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Налаштування системи
            </h1>
            <p className="text-muted-foreground mt-1">
              Керуйте конфігурацією вашого маркетплейсу
            </p>
          </div>

          <div className="space-y-6">
            {/* Кнопки дій */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-glow"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetSettings}
                >
                  Скинути налаштування
                </Button>
              </div>
            </div>

            {/* Вкладки налаштувань */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Загальні</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Безпека</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Сповіщення</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  <span className="hidden sm:inline">Медіа</span>
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  <span className="hidden sm:inline">SEO URL</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Вигляд</span>
                </TabsTrigger>
              </TabsList>

              {/* Загальні налаштування */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Основні налаштування сайту
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="site-name">Назва сайту</Label>
                        <Input
                          id="site-name"
                          value={settings.site_name}
                          onChange={(e) => handleSettingChange('site_name', e.target.value)}
                          placeholder="Назва вашого маркетплейсу"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Email для контактів</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={settings.contact_email}
                          onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                          placeholder="admin@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="site-description">Опис сайту</Label>
                      <Textarea
                        id="site-description"
                        value={settings.site_description}
                        onChange={(e) => handleSettingChange('site_description', e.target.value)}
                        placeholder="Короткий опис вашого маркетплейсу"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="default-currency">Валюта за замовчуванням</Label>
                        <Select
                          value={settings.default_currency}
                          onValueChange={(value) => handleSettingChange('default_currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UAH">Гривня (UAH)</SelectItem>
                            <SelectItem value="USD">Долар США (USD)</SelectItem>
                            <SelectItem value="EUR">Євро (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-price">Максимальна ціна оголошення</Label>
                        <Input
                          id="max-price"
                          type="number"
                          value={settings.max_listing_price}
                          onChange={(e) => handleSettingChange('max_listing_price', Number(e.target.value))}
                          placeholder="1000000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Налаштування безпеки */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Налаштування безпеки та модерації
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Автоматичне схвалення оголошень</Label>
                        <p className="text-sm text-muted-foreground">
                          Оголошення будуть публікуватися без модерації
                        </p>
                      </div>
                      <Switch
                        checked={settings.auto_approve_listings}
                        onCheckedChange={(checked) => handleSettingChange('auto_approve_listings', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Реєстрація нових користувачів</Label>
                        <p className="text-sm text-muted-foreground">
                          Дозволити реєстрацію нових акаунтів
                        </p>
                      </div>
                      <Switch
                        checked={settings.registration_enabled}
                        onCheckedChange={(checked) => handleSettingChange('registration_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Режим обслуговування</Label>
                        <p className="text-sm text-muted-foreground">
                          Тимчасово закрити сайт для відвідувачів
                        </p>
                      </div>
                      <Switch
                        checked={settings.maintenance_mode}
                        onCheckedChange={(checked) => handleSettingChange('maintenance_mode', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Налаштування сповіщень */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Налаштування сповіщень
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email-сповіщення</Label>
                        <p className="text-sm text-muted-foreground">
                          Надсилати сповіщення на електронну пошту
                        </p>
                      </div>
                      <Switch
                        checked={settings.email_notifications}
                        onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Налаштування медіа */}
              <TabsContent value="media" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileImage className="w-5 h-5" />
                      Налаштування зображень та файлів
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-images">Максимальна кількість зображень в оголошенні</Label>
                      <Input
                        id="max-images"
                        type="number"
                        value={settings.max_images_per_listing}
                        onChange={(e) => handleSettingChange('max_images_per_listing', Number(e.target.value))}
                        min="1"
                        max="20"
                      />
                      <p className="text-sm text-muted-foreground">
                        Рекомендовано: 5-10 зображень
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO та URL налаштування */}
              <TabsContent value="seo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link className="w-5 h-5" />
                      Управління SEO URL
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Формат SEO URL
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                        Правильний формат: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">/seo-slug-LISTINGID</code>
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Приклад: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">/prodazh-iphone-A1B2C3D4</code>
                      </p>
                    </div>

                    <SeoManagementSection />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Налаштування зовнішнього вигляду */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Налаштування зовнішнього вигляду
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Налаштування кольорової схеми та логотипу будуть додані в наступних версіях.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Статус збереження */}
            {saving && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-sm">Збереження налаштувань...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}