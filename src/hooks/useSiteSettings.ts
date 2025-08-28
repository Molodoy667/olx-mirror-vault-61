import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
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

const defaultSettings: SiteSettings = {
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
  
  logo_url: '',
  favicon_url: '',
  primary_color: '#3B82F6',
  secondary_color: '#1E40AF',
  
  meta_title: 'Novado - Маркетплейс України',
  meta_description: 'Купуйте та продавайте товари на найкращому маркетплейсі України. Безкоштовні оголошення, безпечні угоди.',
  meta_keywords: 'маркетплейс україна, купити продати, безкоштовні оголошення, товари послуги',
  og_title: 'Novado - Маркетплейс України',
  og_description: 'Найкращий маркетплейс для купівлі та продажу в Україні',
  og_image: '',
  og_type: 'website',
  
  facebook_url: '',
  instagram_url: '',
  telegram_url: '',
  youtube_url: '',
  twitter_url: '',
  linkedin_url: '',
  
  max_images_per_listing: 10,
  max_listing_price: 999999.99,
  auto_approve_listings: false,
  maintenance_mode: false,
  registration_enabled: true,
  email_notifications: true,
  
  google_analytics_id: '',
  google_tag_manager_id: '',
  facebook_pixel_id: '',
  
  support_chat_enabled: true,
  whatsapp_number: '',
  viber_number: '',
  
  max_login_attempts: 5,
  session_timeout: 3600,
  require_email_verification: true,
  
  default_listing_duration: 30,
  featured_listings_count: 8,
  max_search_results: 50
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

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
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
        // Fallback to default settings
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Subscribe to settings changes
    const subscription = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'site_settings' }, 
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { settings, loading };
}

// Функція для отримання налаштувань синхронно (для SSR)
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      return { ...defaultSettings, ...data };
    }
  } catch (error) {
    console.error('Error getting site settings:', error);
  }

  return defaultSettings;
}

// Функція для оновлення мета-тегів на сторінці
export function updatePageMeta(settings: SiteSettings, pageTitle?: string, pageDescription?: string) {
  // Оновлення title
  document.title = pageTitle ? `${pageTitle} | ${settings.site_name}` : settings.meta_title || settings.site_name;

  // Оновлення description
  const description = pageDescription || settings.meta_description;
  updateMetaTag('description', description);

  // Оновлення keywords
  if (settings.meta_keywords) {
    updateMetaTag('keywords', settings.meta_keywords);
  }

  // Open Graph теги
  updateMetaTag('og:title', pageTitle || settings.og_title || settings.site_name);
  updateMetaTag('og:description', pageDescription || settings.og_description || description);
  updateMetaTag('og:type', settings.og_type);
  
  if (settings.og_image) {
    updateMetaTag('og:image', settings.og_image);
  }

  // Favicon
  if (settings.favicon_url) {
    updateFavicon(settings.favicon_url);
  }
}

function updateMetaTag(property: string, content: string) {
  if (!content) return;

  let selector = `meta[name="${property}"]`;
  if (property.startsWith('og:')) {
    selector = `meta[property="${property}"]`;
  }

  let element = document.querySelector(selector) as HTMLMetaElement;
  
  if (element) {
    element.content = content;
  } else {
    element = document.createElement('meta');
    if (property.startsWith('og:')) {
      element.setAttribute('property', property);
    } else {
      element.setAttribute('name', property);
    }
    element.content = content;
    document.head.appendChild(element);
  }
}

function updateFavicon(url: string) {
  let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  
  if (favicon) {
    favicon.href = url;
  } else {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = url;
    document.head.appendChild(favicon);
  }
}