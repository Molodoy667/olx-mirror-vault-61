# Инструкция по настройке сборки APK

## Что уже настроено:

✅ Capacitor конфигурация (`capacitor.config.json`)
✅ GitHub Actions workflows:
  - `ci.yml` - основной CI/CD с Vercel деплоем
  - `build-apk.yml` - сборка APK
  - `sign-apk.yml` - подпись APK (опционально)
✅ Скрипты в package.json для работы с Capacitor

## Следующие шаги:

### 1. Настройка GitHub Secrets

В настройках репозитория (Settings > Secrets and variables > Actions) добавьте:

**Для Vercel:**
- `VERCEL_TOKEN` - токен из Vercel Dashboard
- `VERCEL_ORG_ID` - ID организации Vercel  
- `VERCEL_PROJECT_ID` - ID проекта Vercel

**Для подписи APK (опционально):**
- `ANDROID_KEYSTORE_BASE64` - base64 keystore файла
- `ANDROID_KEYSTORE_PASSWORD` - пароль keystore
- `ANDROID_KEY_ALIAS` - алиас ключа
- `ANDROID_KEY_PASSWORD` - пароль ключа

### 2. Первый запуск

```bash
# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Добавление Android платформы
npx cap add android

# Синхронизация
npx cap sync android
```

### 3. Тестирование

Сделайте push в main ветку - автоматически запустятся:
- Сборка и деплой на Vercel
- Сборка APK
- Создание GitHub Release с APK файлами

## Результат:

- При каждом push в main: автоматический деплой на Vercel + сборка APK
- APK файлы доступны в GitHub Releases
- Подписанные APK (если настроены секреты) готовы для Google Play Store

## Документация:

Подробная документация в `ANDROID_BUILD_GUIDE.md`
