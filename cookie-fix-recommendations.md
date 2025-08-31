# Рекомендации по исправлению проблемы с куками (50MB+)

## Основные источники проблемы:

### 1. BackupManager.tsx
- **Проблема**: Создает большие JSON объекты с данными сайта и БД
- **Решение**: Не хранить данные бэкапов в состоянии компонента
- **Код для исправления**:
```typescript
// Вместо:
const backup: Backup = {
  // ... данные
  data: siteContent // ❌ Большие данные
};

// Использовать:
const backup: Backup = {
  // ... данные
  data: null // ✅ Не хранить данные в памяти
};
```

### 2. localStorage накопление
- **Проблема**: Накопление данных в recentlyViewed, recentSearches
- **Решение**: Ограничить количество элементов
- **Код для исправления**:
```typescript
// Ограничить до 10 элементов
const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
```

### 3. Сессионные данные
- **Проблема**: Большие объекты сессии в localStorage
- **Решение**: Хранить только необходимые поля
- **Код для исправления**:
```typescript
// Вместо полной сессии:
localStorage.setItem('novado_session', JSON.stringify(session));

// Хранить только ID пользователя:
localStorage.setItem('novado_user_id', session.user.id);
```

## Немедленные действия:

1. Очистить localStorage от больших данных
2. Ограничить размер истории поиска
3. Удалить данные бэкапов из состояния
4. Добавить автоматическую очистку

## Файлы для изменения:
- src/pages/admin/BackupManager.tsx
- src/components/SearchSuggestions.tsx  
- src/components/RecentlyViewed.tsx
- src/hooks/useAuth.tsx
