# Инструкции по деплою для исправления SPA роутинга

## Проблема
После деплоя прямые ссылки (например, /profile/@username) не работают и показывают 404 ошибку.

## Решение

### 1. Проверить конфигурацию Vercel
Убедиться, что файл `vercel.json` содержит правильные настройки для SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Принудительный редеплой
Иногда нужно принудительно запустить новый деплой:

```bash
# Если используется Vercel CLI
vercel --prod

# Или сделать пустой коммит для триггера деплоя
git commit --allow-empty -m "Trigger redeploy for SPA routing"
git push origin main
```

### 3. Проверка в Vercel Dashboard
1. Зайти в Vercel Dashboard
2. Найти проект
3. Перейти во вкладку "Functions" или "Settings"
4. Убедиться, что настройки Rewrites применены

### 4. Альтернативная конфигурация
Если простая конфигурация не работает, попробовать расширенную:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 5. Проверка после деплоя
Тестировать следующие URL:
- `/profile/@username` - должен работать
- `/search` - должен работать  
- `/admin/dashboard` - должен работать
- Обновление страницы (F5) - должно работать

### 6. Если проблема остается
1. Проверить логи деплоя в Vercel
2. Убедиться, что `dist/index.html` создается при сборке
3. Проверить, что все файлы из `dist/` загружаются на Vercel

## Текущий статус
- ✅ vercel.json создан с правильной конфигурацией
- ✅ public/_redirects создан для Netlify
- ✅ public/.htaccess создан для Apache
- ✅ Глобальные обработчики ошибок чанков добавлены
- ⏳ Ожидается применение конфигурации после деплоя