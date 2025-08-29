#!/bin/bash

echo "🔍 ТЕСТИРОВАНИЕ CAPACITOR ЛОКАЛЬНО"
echo "=================================="

# Проверка зависимостей
echo "📦 Проверка зависимостей..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx не найден"
    exit 1
fi

# Установка зависимостей
echo "📋 Установка зависимостей..."
npm install --legacy-peer-deps

# Сборка PWA
echo "🏗️ Сборка PWA..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Папка dist не создана"
    exit 1
fi

echo "✅ PWA собран успешно"

# Проверка Capacitor конфигурации
if [ ! -f "capacitor.config.ts" ]; then
    echo "🔧 Инициализация Capacitor..."
    npx cap init "Novado" "com.novado.app" --web-dir=dist
else
    echo "✅ Capacitor уже инициализирован"
fi

# Проверка Android платформы
if [ ! -d "android" ]; then
    echo "📱 Добавление Android платформы..."
    npx cap add android
    
    if [ $? -eq 0 ]; then
        echo "✅ Android платформа добавлена"
    else
        echo "❌ Ошибка добавления Android платформы"
        exit 1
    fi
else
    echo "✅ Android платформа уже существует"
fi

# Синхронизация
echo "🔄 Синхронизация с Android..."
npx cap sync android

if [ $? -eq 0 ]; then
    echo "✅ Синхронизация успешна"
else
    echo "❌ Ошибка синхронизации"
    exit 1
fi

# Диагностика
echo ""
echo "🔍 ДИАГНОСТИКА:"
echo "==============="

echo "📁 Структура проекта:"
ls -la | grep -E "(android|capacitor|dist)"

echo ""
echo "📱 Android директория:"
if [ -d "android" ]; then
    ls -la android/
else
    echo "❌ android директория не найдена"
fi

echo ""
echo "🔧 Gradle файлы:"
if [ -d "android" ]; then
    find android/ -name "*gradle*" -type f 2>/dev/null | head -10
    echo ""
    echo "📱 Gradlew файлы:"
    ls -la android/gradlew* 2>/dev/null || echo "❌ gradlew не найден"
else
    echo "❌ android директория не найдена"
fi

echo ""
echo "📱 App директория:"
if [ -d "android/app" ]; then
    ls -la android/app/
else
    echo "❌ android/app директория не найдена"
fi

# Проверка Java (если установлена)
echo ""
echo "☕ Java версия:"
if command -v java &> /dev/null; then
    java -version
else
    echo "❌ Java не найдена (нужна для сборки APK)"
fi

echo ""
echo "🎯 РЕЗУЛЬТАТ:"
echo "============="

if [ -d "android" ] && [ -f "android/gradlew" ]; then
    echo "✅ Capacitor настроен корректно"
    echo "✅ Android проект создан"
    echo "✅ Gradle wrapper найден"
    echo ""
    echo "🚀 Готово к сборке APK!"
    echo "Для сборки APK запустите:"
    echo "cd android && ./gradlew assembleDebug"
else
    echo "❌ Есть проблемы с настройкой"
    echo "Проверьте логи выше"
fi