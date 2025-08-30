import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download, Smartphone } from 'lucide-react';
import { showSuccessToast, showInfoToast } from '@/lib/toast-helpers';

export function AppUpdateButton() {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Очищаем все кеши
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 All caches cleared');
      }

      // Очищаем localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Обновляем Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('🔄 Service Worker unregistered');
        }
      }

      showSuccessToast('Кеш очищено', 'Додаток буде перезавантажено з новою версією');
      
      // Перезагружаем страницу через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error during force update:', error);
      showInfoToast('Оновлення', 'Перезавантажте сторінку вручну для застосування змін');
      setIsUpdating(false);
    }
  };

  const handleDownloadAPK = () => {
    const githubActionsUrl = 'https://github.com/Molodoy667/olx-mirror-vault-61/actions';
    window.open(githubActionsUrl, '_blank');
    showInfoToast('GitHub Actions', 'Відкрито у новій вкладці. Знайдіть останній workflow та завантажте APK з Artifacts');
  };

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <RefreshCw className="h-5 w-5" />
          Оновлення додатку
        </CardTitle>
        <CardDescription>
          Примусове оновлення або завантаження нової версії APK
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleForceUpdate}
            disabled={isUpdating}
            className="w-full"
            variant="default"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Оновлення...' : 'Примусове оновлення'}
          </Button>
          
          <Button 
            onClick={handleDownloadAPK}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Завантажити APK
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3" />
            <strong>Примусове оновлення:</strong> Очищає кеш та перезавантажує додаток
          </p>
          <p className="flex items-center gap-2">
            <Smartphone className="h-3 w-3" />
            <strong>Завантажити APK:</strong> Отримати останню версію Android додатку
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Якщо не бачите змін:</strong>
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1">
            <li>1. Натисніть "Примусове оновлення" якщо у веб-версії</li>
            <li>2. Або завантажте новий APK якщо у мобільному додатку</li>
            <li>3. Перевірте версію у "Інформація про версію" нижче</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}