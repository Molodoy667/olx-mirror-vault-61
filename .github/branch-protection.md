# Branch Protection Configuration

## Настройки для защиты main ветки:

1. Зайдите в GitHub Settings → Branches
2. Добавьте правило для ветки `main`
3. Включите следующие опции:

### Рекомендуемые настройки:
- ✅ **Restrict pushes that create files** - предотвращает создание файлов
- ✅ **Require pull request reviews** - требует проверки PR
- ✅ **Dismiss stale reviews** - отклоняет устаревшие ревью  
- ✅ **Require status checks** - требует успешных проверок
- ✅ **Require branches to be up to date** - требует актуальности ветки
- ✅ **Include administrators** - применяется к администраторам

### Дополнительно:
- ❌ **Allow force pushes** - запретить force push
- ❌ **Allow deletions** - запретить удаление ветки

Это предотвратит автоматическое создание веток и защитит main от нежелательных изменений.