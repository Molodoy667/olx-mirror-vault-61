import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Globe, Info } from 'lucide-react';

export function VersionInfo() {
  const packageVersion = "4.5.0";
  const buildDate = new Date().toLocaleDateString('uk-UA');
  
  // Определяем тип приложения
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroidApp = window.navigator.userAgent.includes('Novado/4.5.0');
  const isPWA = 'serviceWorker' in navigator;
  
  const appType = isAndroidApp ? 'Android APK' : 
                  isStandalone ? 'PWA (Standalone)' : 
                  isPWA ? 'PWA (Browser)' : 
                  'Web Browser';

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Info className="h-5 w-5" />
          Інформація про версію
        </CardTitle>
        <CardDescription>
          Деталі поточної версії додатку Novado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Версія</p>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              v{packageVersion}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Тип додатку</p>
            <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
              {isAndroidApp ? <Smartphone className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
              {appType}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Функції:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className={isPWA ? "text-green-600" : "text-gray-400"}>
                {isPWA ? "✅" : "❌"}
              </span>
              PWA підтримка
            </div>
            <div className="flex items-center gap-1">
              <span className={isStandalone ? "text-green-600" : "text-gray-400"}>
                {isStandalone ? "✅" : "❌"}
              </span>
              Standalone режим
            </div>
            <div className="flex items-center gap-1">
              <span className={'Notification' in window ? "text-green-600" : "text-gray-400"}>
                {'Notification' in window ? "✅" : "❌"}
              </span>
              Push сповіщення
            </div>
            <div className="flex items-center gap-1">
              <span className={isAndroidApp ? "text-green-600" : "text-gray-400"}>
                {isAndroidApp ? "✅" : "❌"}
              </span>
              Android APK
            </div>
          </div>
        </div>

        {isAndroidApp && (
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              🎉 Ви використовуєте Android APK версію 4.5!
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Всі функції доступні: splash screen, push-сповіщення, автооновлення
            </p>
          </div>
        )}
        
        {!isAndroidApp && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              📱 Ви використовуєте веб-версію
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Для повної функціональності завантажте Android APK з GitHub Actions
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>User-Agent: {navigator.userAgent.substring(0, 100)}...</p>
          <p>Дата збірки: {buildDate}</p>
        </div>
      </CardContent>
    </Card>
  );
}