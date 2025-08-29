import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { UserBottomPanel } from '@/components/UserBottomPanel';
import { useSiteSettings, updatePageMeta } from '@/hooks/useSiteSettings';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { settings, loading } = useSiteSettings();
  
  // Не показываем UserBottomPanel на админских страницах
  const isAdminPage = location.pathname.startsWith('/admin');
  
  // Применяем настройки сайта при загрузке и изменении маршрута
  useEffect(() => {
    if (!loading) {
      updatePageMeta(settings);
      
      // Применяем кастомные CSS переменные для цветов
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
      
      // Добавляем Google Analytics если указан
      if (settings.google_analytics_id && !window.gtag) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`;
        document.head.appendChild(script);
        
        const configScript = document.createElement('script');
        configScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.google_analytics_id}');
        `;
        document.head.appendChild(configScript);
        
        (window as unknown as { gtag: Function; dataLayer: unknown[] }).gtag = (window as unknown as { dataLayer: unknown[] }).dataLayer?.push;
      }
      
      // Добавляем Facebook Pixel если указан
      if (settings.facebook_pixel_id && !(window as unknown as { fbq?: Function }).fbq) {
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${settings.facebook_pixel_id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }
    }
  }, [settings, loading, location.pathname]);
  
  // Показываем индикатор режима обслуживования для админов
  if (settings.maintenance_mode && !isAdminPage) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="max-w-md text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold text-amber-800 mb-2">
            Режим обслуговування
          </h1>
          <p className="text-amber-700 mb-4">
            Сайт тимчасово недоступний через технічні роботи. Спробуйте пізніше.
          </p>
          <p className="text-sm text-amber-600">
            {settings.site_name} команда
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {children}
      {!isAdminPage && <UserBottomPanel />}
    </>
  );
}