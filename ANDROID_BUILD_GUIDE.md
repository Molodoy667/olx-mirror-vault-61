# Руководство по сборке Android APK

## Обзор

Этот проект настроен для автоматической сборки Android APK через GitHub Actions с синхронной работой с Vercel деплоем.

## Настройка

### 1. GitHub Secrets

Для работы CI/CD необходимо добавить следующие секреты в настройках репозитория:

- `VERCEL_TOKEN` - токен Vercel (получить в настройках Vercel)
- `VERCEL_ORG_ID` - ID организации Vercel
- `VERCEL_PROJECT_ID` - ID проекта Vercel

### 2. Локальная разработка

```bash
# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Добавление Android платформы (первый раз)
npx cap add android

# Синхронизация с Android
npx cap sync android

# Открытие Android Studio
npx cap open android
```

### 3. Скрипты

- `npm run cap:add` - добавить платформу
- `npm run cap:copy` - скопировать веб-файлы
- `npm run cap:sync` - синхронизировать изменения
- `npm run cap:open:android` - открыть в Android Studio
- `npm run cap:build:android` - полная сборка Android

## GitHub Actions Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

Выполняется при каждом push в main и pull request:
- Тестирование и линтинг
- Сборка проекта
- Деплой на Vercel (preview для PR, production для main)

### 2. Build APK (`.github/workflows/build-apk.yml`)

Выполняется при каждом push в main и pull request:
- Тестирование и линтинг
- Сборка проекта
- Сборка Android APK
- Создание GitHub Release с APK файлами

## Результаты сборки

### APK файлы

После успешной сборки APK файлы будут доступны:
1. В GitHub Actions artifacts
2. В GitHub Releases (только для main ветки)

### Типы APK

- `app-debug.apk` - отладочная версия
- `app-release-unsigned.apk` - релизная версия (требует подписи)

## Подпись APK для продакшена

Для создания подписанного APK для Google Play Store:

1. Создайте keystore файл
2. Добавьте секреты в GitHub:
   - `ANDROID_KEYSTORE_BASE64` - base64 keystore файла
   - `ANDROID_KEYSTORE_PASSWORD` - пароль keystore
   - `ANDROID_KEY_ALIAS` - алиас ключа
   - `ANDROID_KEY_PASSWORD` - пароль ключа

3. Обновите workflow для подписи APK

## Синхронизация с Vercel

- При push в main: деплой на Vercel + сборка APK
- При pull request: preview деплой на Vercel + тестовая сборка APK
- Все процессы запускаются параллельно для экономии времени

## Troubleshooting

### Проблемы с Android SDK

Если возникают проблемы с Android SDK в GitHub Actions:
1. Проверьте версию Java (должна быть 17)
2. Убедитесь, что Android SDK правильно настроен
3. Проверьте права доступа к файлам

### Проблемы с Capacitor

1. Убедитесь, что `capacitor.config.json` настроен правильно
2. Проверьте, что `webDir` указывает на правильную папку
3. Выполните `npx cap sync` после изменений в конфигурации

### Проблемы с Vercel

1. Проверьте правильность токенов и ID
2. Убедитесь, что проект подключен к Vercel
3. Проверьте настройки в `vercel.json`
