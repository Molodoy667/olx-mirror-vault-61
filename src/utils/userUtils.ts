/**
 * Генерирует короткий 6-значный ID из полного UUID
 * Использует детерминистический алгоритм для консистентности
 */
export function generateShortId(uuid: string): string {
  // Убираем дефисы и берем только буквы и цифры
  const cleanUuid = uuid.replace(/-/g, '');
  
  // Создаем числовой хеш из UUID
  let hash = 0;
  for (let i = 0; i < cleanUuid.length; i++) {
    const char = cleanUuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Конвертируем в 32-битное число
  }
  
  // Берем абсолютное значение и ограничиваем до 6 цифр
  const shortId = Math.abs(hash) % 1000000;
  
  // Дополняем нулями до 6 цифр
  return shortId.toString().padStart(6, '0');
}

/**
 * Создает отображаемое имя пользователя для профиля
 */
export function getUserDisplayName(user: { username?: string; id: string }): string {
  return user.username || generateShortId(user.id);
}

/**
 * Создает URL профиля пользователя
 */
export function getUserProfileUrl(user: { username?: string; id: string }): string {
  const displayName = getUserDisplayName(user);
  return `/profile/@${displayName}`;
}