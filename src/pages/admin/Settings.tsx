import { useState, useEffect, useRef } from 'react';
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
import { 
  showSuccessToast, 
  showErrorToast, 
  showSaveSuccess, 
  showSaveError,
  showFileUploadSuccess,
  showFileUploadError,
  showValidationError 
} from '@/lib/toast-helpers';
import { regenerateAllSeoUrls } from '@/lib/seo';
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
  RefreshCw,
  Upload,
  Eye,
  Facebook,
  Instagram,
  MessageCircle,
  Youtube,
  Twitter,
  Linkedin,
  BarChart3,
  Phone,
  MapPin,
  Clock,
  Languages,
  CreditCard,
  Search,
  Users
} from 'lucide-react';

interface SystemSettings {
  // Основні налаштування
  site_name: string;
  site_description: string;
  site_keywords: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  language: string;
  currency: string;
  
  // Візуальні налаштування
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  
  // Мета-теги SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  
  // Соціальні мережі
  facebook_url: string;
  instagram_url: string;
  telegram_url: string;
  youtube_url: string;
  twitter_url: string;
  linkedin_url: string;
  
  // Технічні налаштування
  max_images_per_listing: number;
  max_listing_price: number;
  auto_approve_listings: boolean;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_notifications: boolean;
  
  // Аналітика
  google_analytics_id: string;
  google_tag_manager_id: string;
  facebook_pixel_id: string;
  
  // Месенджери
  support_chat_enabled: boolean;
  whatsapp_number: string;
  viber_number: string;
  
  // Безпека
  max_login_attempts: number;
  session_timeout: number;
  require_email_verification: boolean;
  
  // Контент
  default_listing_duration: number;
  featured_listings_count: number;
  max_search_results: number;
}

// Компонент для отображения ошибок
function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
      <span className="text-red-500">⚠</span>
      {error}
    </p>
  );
}

// Компонент для загрузки файлов
function FileUploadField({ 
  label, 
  value, 
  fieldName, 
  onUpload, 
  onChange,
  error, 
  uploading 
}: {
  label: string;
  value: string;
  fieldName: keyof SystemSettings;
  onUpload: (file: File, fieldName: keyof SystemSettings) => Promise<void>;
  onChange: (fieldName: keyof SystemSettings, value: string) => void;
  error?: string;
  uploading?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, fieldName);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>{label}</Label>
      
      <div className="flex gap-2">
        <Input
          id={fieldName}
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
          placeholder="URL зображення або завантажте файл"
          className={error ? 'border-red-500' : ''}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0"
        >
          {uploading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
        
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => window.open(value, '_blank')}
            className="shrink-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {value && (
        <div className="mt-2">
          <img 
            src={value} 
            alt={label}
            className="max-w-32 max-h-32 object-contain border rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <ErrorMessage error={error} />
    </div>
  );
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
      const result = await regenerateAllSeoUrls();
      
      if (result.errors > 0) {
        showErrorToast("SEO URL оновлено з помилками", `Успішно: ${result.success}, Помилок: ${result.errors}`);
      } else {
        showSuccessToast("SEO URL оновлено", `Успішно оновлено ${result.success} URL`);
      }
      
      // Обновляем статистику
      await loadSeoStats();
    } catch (error) {
      showErrorToast("Помилка", "Не вдалося оновити SEO URL");
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
    // Основні налаштування
    site_name: 'Novado',
    site_description: 'Найкращий маркетплейс України для купівлі та продажу товарів',
    site_keywords: 'маркетплейс, україна, купити, продати, оголошення',
    contact_email: 'admin@novado.store',
    contact_phone: '+380 (44) 123-45-67',
    address: 'вул. Хрещатик, 1, Київ, Україна',
    city: 'Київ',
    country: 'Україна',
    timezone: 'Europe/Kiev',
    language: 'uk',
    currency: 'UAH',
    
    // Візуальні налаштування
    logo_url: '',
    favicon_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    
    // Мета-теги SEO
    meta_title: 'Novado - Маркетплейс України',
    meta_description: 'Купуйте та продавайте товари на найкращому маркетплейсі України. Безкоштовні оголошення, безпечні угоди.',
    meta_keywords: 'маркетплейс україна, купити продати, безкоштовні оголошення, товари послуги',
    og_title: 'Novado - Маркетплейс України',
    og_description: 'Найкращий маркетплейс для купівлі та продажу в Україні',
    og_image: '',
    og_type: 'website',
    
    // Соціальні мережі
    facebook_url: '',
    instagram_url: '',
    telegram_url: '',
    youtube_url: '',
    twitter_url: '',
    linkedin_url: '',
    
    // Технічні налаштування
    max_images_per_listing: 10,
    max_listing_price: 999999.99,
    auto_approve_listings: false,
    maintenance_mode: false,
    registration_enabled: true,
    email_notifications: true,
    
    // Аналітика
    google_analytics_id: '',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
    
    // Месенджери
    support_chat_enabled: true,
    whatsapp_number: '',
    viber_number: '',
    
    // Безпека
    max_login_attempts: 5,
    session_timeout: 3600,
    require_email_verification: true,
    
    // Контент
    default_listing_duration: 30,
    featured_listings_count: 8,
    max_search_results: 50
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Функції валідації
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phone === '' || phoneRegex.test(phone);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateColor = (color: string): boolean => {
    const colorRegex = /^#[0-9A-F]{6}$/i;
    return colorRegex.test(color);
  };

  const validateRequired = (value: string, fieldName: string): boolean => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, [fieldName]: `${fieldName} є обов'язковим полем` }));
      return false;
    }
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
    return true;
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Обов'язкові поля
    if (!settings.site_name.trim()) {
      newErrors.site_name = "Назва сайту є обов'язковою";
    }
    if (!settings.contact_email.trim()) {
      newErrors.contact_email = "Email є обов'язковим";
    } else if (!validateEmail(settings.contact_email)) {
      newErrors.contact_email = "Невірний формат email";
    }

    // Валідація телефону
    if (settings.contact_phone && !validatePhone(settings.contact_phone)) {
      newErrors.contact_phone = "Невірний формат телефону";
    }

    // Валідація кольорів
    if (!validateColor(settings.primary_color)) {
      newErrors.primary_color = "Невірний формат кольору (приклад: #3B82F6)";
    }
    if (!validateColor(settings.secondary_color)) {
      newErrors.secondary_color = "Невірний формат кольору (приклад: #1E40AF)";
    }

    // Валідація URL
    const urlFields = [
      'logo_url', 'favicon_url', 'og_image', 'facebook_url', 'instagram_url',
      'telegram_url', 'youtube_url', 'twitter_url', 'linkedin_url'
    ];
    urlFields.forEach(field => {
      const value = settings[field as keyof SystemSettings] as string;
      if (value && !validateUrl(value)) {
        newErrors[field] = "Невірний формат URL";
      }
    });

    // Валідація числових полів
    if (settings.max_images_per_listing < 1 || settings.max_images_per_listing > 50) {
      newErrors.max_images_per_listing = "Кількість зображень повинна бути від 1 до 50";
    }
    if (settings.max_listing_price < 0) {
      newErrors.max_listing_price = "Максимальна ціна не може бути негативною";
    }

    // Валідація мета-тегів
    if (settings.meta_title && settings.meta_title.length > 60) {
      newErrors.meta_title = "Мета заголовок повинен бути не більше 60 символів";
    }
    if (settings.meta_description && settings.meta_description.length > 160) {
      newErrors.meta_description = "Мета опис повинен бути не більше 160 символів";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  // Завантаження налаштувань з БД
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

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
      
      showSaveSuccess("Налаштування");
    } catch (error) {
      showSaveError("налаштування");
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

  // Загрузка файлів
  const handleFileUpload = async (file: File, fieldName: keyof SystemSettings) => {
    if (!file) return;

    // Валідація типу файлу
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ 
        ...prev, 
        [fieldName]: 'Підтримуються тільки файли JPG, PNG, WebP, SVG' 
      }));
      return;
    }

    // Валідація розміру файлу (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        [fieldName]: 'Розмір файлу не повинен перевищувати 5MB' 
      }));
      return;
    }

    setUploadingFile(fieldName);
    setErrors(prev => ({ ...prev, [fieldName]: '' }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${fieldName}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      handleSettingChange(fieldName, publicUrl);
      
      showFileUploadSuccess("Зображення");
    } catch (error: any) {
      setErrors(prev => ({ 
        ...prev, 
        [fieldName]: error.message || 'Помилка завантаження файлу' 
      }));
      showFileUploadError(error.message || 'Не вдалося завантажити файл');
    } finally {
      setUploadingFile(null);
    }
  };

  // Функція збереження налаштувань
  const handleSave = async () => {
    if (!validateAllFields()) {
      showValidationError("Будь ласка, виправте всі помилки перед збереженням");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(settings, { onConflict: 'id' });

      if (error) throw error;

      showSaveSuccess("Налаштування");
    } catch (error: any) {
      showSaveError("налаштування", error.message);
    } finally {
      setSaving(false);
    }
  };

  // Обробник зміни значень
  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Очищаємо помилку для цього поля
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
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