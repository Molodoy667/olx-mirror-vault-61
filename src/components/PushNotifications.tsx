import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { showSuccessToast, showErrorToast, showInfoToast } from '@/lib/toast-helpers';

interface PushNotificationProps {
  onPermissionGranted?: () => void;
}

export function PushNotifications({ onPermissionGranted }: PushNotificationProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Проверяем поддержку уведомлений
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Получаем Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      showErrorToast('Помилка', 'Ваш браузер не підтримує push-сповіщення');
      return;
    }

    try {
      // Запрашиваем разрешение на уведомления
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        showSuccessToast('Дозвіл надано', 'Push-сповіщення увімкнено успішно');
        
        // Сохраняем в базе данных что пользователь согласился
        if (user) {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              push_notifications_enabled: true,
              updated_at: new Date().toISOString()
            });
        }

        // Подписываемся на push уведомления
        await subscribeToPush();
        
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      } else if (result === 'denied') {
        showErrorToast('Дозвіл відхилено', 'Push-сповіщення заблоковано. Увімкніть їх у налаштуваннях браузера.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      showErrorToast('Помилка', 'Не вдалося запросити дозвіл на сповіщення');
    }
  };

  const subscribeToPush = async () => {
    if (!registration) {
      console.error('Service Worker not registered');
      return;
    }

    try {
      // Создаем подписку на push уведомления
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa6iMjyr2PJNn5_ZgOcQ6M7pOhf6_7VGRJOVHaGJzZfPRpPRJ5QmYrOweRTVE8' // Замените на ваш VAPID ключ
        )
      });

      // Сохраняем подписку в базе данных
      if (user && subscription) {
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: JSON.stringify(subscription),
            endpoint: subscription.endpoint,
            created_at: new Date().toISOString()
          });

        console.log('Push subscription saved:', subscription);
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      showErrorToast('Помилка підписки', 'Не вдалося підписатися на push-сповіщення');
    }
  };

  const unsubscribeFromPush = async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Удаляем из базы данных
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id);
        }

        showInfoToast('Відписка', 'Push-сповіщення вимкнено');
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      showErrorToast('Помилка', 'Не вдалося відписатися від сповіщень');
    }
  };

  // Функция для отправки тестового уведомления
  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('🎉 Novado', {
        body: 'Безліч оголошень чекають на тебе!',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'test-notification',
        requireInteraction: false,
        actions: [
          {
            action: 'open',
            title: 'Відкрити'
          }
        ]
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push-сповіщення недоступні
          </CardTitle>
          <CardDescription>
            Ваш браузер або пристрій не підтримує push-сповіщення
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push-сповіщення
        </CardTitle>
        <CardDescription>
          Отримуйте сповіщення про нові повідомлення, оголошення та оновлення
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Статус: {permission === 'granted' ? '✅ Увімкнено' : 
                      permission === 'denied' ? '❌ Заблоковано' : 
                      '⏳ Очікує дозволу'}
            </p>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' ? 'Ви отримуватимете push-сповіщення' :
               permission === 'denied' ? 'Увімкніть у налаштуваннях браузера' :
               'Натисніть кнопку для надання дозволу'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {permission === 'default' && (
              <Button onClick={requestPermission} size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Увімкнути
              </Button>
            )}
            
            {permission === 'granted' && (
              <>
                <Button onClick={sendTestNotification} variant="outline" size="sm">
                  Тест
                </Button>
                <Button onClick={unsubscribeFromPush} variant="destructive" size="sm">
                  <BellOff className="h-4 w-4 mr-2" />
                  Вимкнути
                </Button>
              </>
            )}
            
            {permission === 'denied' && (
              <Button variant="outline" size="sm" onClick={() => {
                showInfoToast('Налаштування', 'Перейдіть у налаштування браузера → Сайти → Novado → Сповіщення → Дозволити');
              }}>
                <Settings className="h-4 w-4 mr-2" />
                Налаштування
              </Button>
            )}
          </div>
        </div>

        {permission === 'granted' && (
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              🔔 Push-сповіщення активні! Ви отримуватимете сповіщення про:
            </p>
            <ul className="text-sm text-green-600 dark:text-green-400 mt-2 space-y-1">
              <li>• Нові повідомлення від покупців</li>
              <li>• Відповіді на ваші оголошення</li>
              <li>• Важливі оновлення системи</li>
              <li>• Нові функції Novado</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility function для конвертации VAPID ключа
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}