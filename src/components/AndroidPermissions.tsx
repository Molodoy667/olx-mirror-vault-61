import { useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers';

export function AndroidPermissions() {
  useEffect(() => {
    const requestPermissions = async () => {
      // Проверяем что это Android приложение
      const isAndroidApp = (window as any).Capacitor !== undefined;
      
      if (!isAndroidApp) return;
      
      try {
        // Проверяем есть ли уже разрешения
        const hasRequestedPermissions = localStorage.getItem('android-permissions-requested');
        
        if (hasRequestedPermissions) return;
        
        console.log('🔐 Запрашиваем Android разрешения...');
        
        // Запрашиваем разрешения через Capacitor плагины
        if ((window as any).Capacitor?.Plugins) {
          const { Camera, LocalNotifications } = (window as any).Capacitor.Plugins;
          
          try {
            // Запрашиваем разрешения на камеру (для медиа)
            if (Camera) {
              await Camera.requestPermissions();
              console.log('✅ Camera permissions requested');
            }
            
            // Запрашиваем разрешения на уведомления
            if (LocalNotifications) {
              await LocalNotifications.requestPermissions();
              console.log('✅ Notification permissions requested');
            }
            
            showSuccessToast(
              'Дозволи надано', 
              'Android система запитала необхідні дозволи'
            );
            
            // Отмечаем что разрешения запрошены
            localStorage.setItem('android-permissions-requested', 'true');
            
          } catch (error) {
            console.log('Разрешения могут быть запрошены системой позже:', error);
          }
        }
        
        // Также запрашиваем через веб API как fallback
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
            console.log('✅ Web notification permission requested');
          } catch (error) {
            console.log('Web notification permission denied:', error);
          }
        }
        
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    // Запрашиваем разрешения через 3 секунды после загрузки
    const timer = setTimeout(requestPermissions, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return null; // Этот компонент не рендерит UI
}